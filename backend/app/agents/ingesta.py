"""Agente Ingesta — Pipeline de 2 pasos.

Paso 1 (Analisis): Extrae texto del PDF, usa LLM para identificar
conceptos/entidades/relaciones. Produce un plan JSON para review humano.

Paso 2 (Generacion): Despues de la aprobacion del usuario, genera los
archivos .md con frontmatter YAML y [[wikilinks]].
"""
from __future__ import annotations

import json
import logging
import re
import tempfile
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path

from app.dependencies import get_supabase
from app.services.llm_gateway import gateway
from app.services.pdf_parser import extract_text
from app.services.wiki_builder import (
    _write_page_to_storage,
    get_all_pages,
    notebook_exists,
    parse_frontmatter,
    _download_text,
    WIKI_BUCKET,
)

logger = logging.getLogger(__name__)

# ── Prompts ──────────────────────────────────────────────────

ANALYSIS_SYSTEM = """\
Eres un agente de ingesta educativa de YachaqAI. Tu tarea es analizar texto \
extraido de un documento PDF y producir un plan estructurado de conceptos, \
entidades, relaciones y modulos.

REGLAS:
- Cada concepto debe ser una idea explicable en 200-400 palabras.
- Los slugs deben ser kebab-case sin acentos (ej: "protocolo-tcp").
- Identifica prerrequisitos reales (concepto A se necesita para entender B).
- Los modulos agrupan 4-8 conceptos tematicamente relacionados.
- Si recibes una lista de conceptos existentes, detecta conflictos y actualizaciones.
- Las entidades son personas, organizaciones, tecnologias o estandares relevantes.

Responde SOLO en JSON valido con esta estructura exacta:
{
  "items": [
    {
      "slug": "string",
      "title": "string",
      "type": "concepto|entidad|modulo",
      "action": "create|update|conflict",
      "summary": "resumen de 1-2 oraciones",
      "prerequisites": ["slug-prereq"],
      "related": ["slug-relacionado"],
      "module": "slug-del-modulo",
      "conflict_detail": null
    }
  ],
  "modules": [
    {
      "slug": "modulo-01-nombre",
      "title": "Nombre del Modulo",
      "concepts": ["slug1", "slug2"],
      "order": 1
    }
  ],
  "source_summary": "resumen del documento en 2-3 oraciones"
}"""

ANALYSIS_USER = """\
Analiza el siguiente texto extraido del documento "{source_name}" y genera \
un plan de ingesta.

## Conceptos existentes en la wiki (si los hay):
{existing_concepts}

## Texto del documento:
{text}

Genera el plan JSON con todos los conceptos, entidades, modulos y relaciones \
que identificaste."""

GENERATION_SYSTEM = """\
Eres un generador de paginas wiki educativas de YachaqAI. Generas contenido \
Markdown con frontmatter YAML para una base de conocimiento interconectada.

FORMATO OBLIGATORIO:
---
id: "slug-del-concepto"
tipo: "concepto"
titulo: "Titulo Legible"
modulo: "slug-del-modulo"
estado_srs: "bloqueado"
maestria: 0
prerrequisitos:
  - "slug-prereq-1"
relacionados:
  - "slug-rel-1"
resumen: "Resumen en 1 oracion"
creado: "{today}"
fuente_primaria: "{source_name}"
---

# Titulo del Concepto

Explicacion clara de 200-400 palabras.
Usa [[2. conceptos/slug-de-otro-concepto.md]] para crear wikilinks.

## Caracteristicas Clave
- Punto 1
- Punto 2

## Relacion con Otros Conceptos
Explica como se relaciona con otros conceptos usando [[wikilinks]].

REGLAS:
- Siempre usa [[ruta/slug.md]] para referenciar otros conceptos
- El frontmatter YAML debe ser valido
- estado_srs siempre empieza en "bloqueado", maestria en 0
- Escribe en espanol. Terminos tecnicos en ingles se mantienen."""


# ── Helpers ──────────────────────────────────────────────────

def _parse_analysis_json(text: str) -> dict:
    """Extrae JSON de la respuesta LLM, tolerando code fences."""
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise
    if "items" not in data:
        data = {"items": [], "modules": [], "source_summary": ""}
    return data


def _safe_slug(text: str) -> str:
    """Convierte cualquier texto a un slug seguro para Supabase Storage."""
    import unicodedata
    s = unicodedata.normalize("NFD", text.lower())
    s = re.sub(r"[̀-ͯ]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80]


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


MAX_ANALYSIS_CHUNKS = 3  # limite duro de llamadas LLM por ingesta (costo/rate-limit)


def _split_text(text: str, max_chars: int, max_chunks: int = MAX_ANALYSIS_CHUNKS) -> list[str]:
    """Divide el texto en fragmentos de hasta max_chars, acotado a max_chunks.

    Documentos mas largos que max_chars * max_chunks se truncan en el ultimo
    fragmento (igual que el comportamiento anterior) para no disparar el
    numero de llamadas LLM sin limite.
    """
    chunks = [text[i:i + max_chars] for i in range(0, len(text), max_chars)]
    return chunks[:max_chunks] or [""]


async def _analyze_chunks(
    chunks: list[str],
    source_name: str,
    existing_concepts: list[dict],
    on_progress: "Callable[[int, str], None] | None" = None,
) -> dict:
    """Analiza el texto en uno o mas fragmentos. Cuando hay mas de un
    fragmento, acumula los items ya detectados y se los pasa al modelo en
    cada llamada subsiguiente para evitar slugs duplicados y para que pueda
    relacionar conceptos entre fragmentos."""
    items: list[dict] = []
    modules: list[dict] = []
    summaries: list[str] = []
    seen_slugs: set[str] = set()

    for idx, chunk in enumerate(chunks):
        if on_progress:
            pct = 30 + int((idx / max(len(chunks), 1)) * 20)
            label = (
                f"Analizando estructura del documento (parte {idx + 1}/{len(chunks)})"
                if len(chunks) > 1 else "Analizando estructura del documento"
            )
            on_progress(pct, label)

        known = existing_concepts + [
            {"slug": i.get("slug"), "title": i.get("title"), "type": i.get("type")}
            for i in items
        ]
        prompt = ANALYSIS_USER.format(
            source_name=source_name,
            text=chunk,
            existing_concepts=json.dumps(known, ensure_ascii=False) if known else "Ninguno (wiki vacia)",
        )
        response = await gateway.generate(prompt=prompt, system=ANALYSIS_SYSTEM, response_format="json")
        part = _parse_analysis_json(response.text)

        for item in part.get("items", []):
            slug = item.get("slug") or item.get("title", "unknown")
            if slug in seen_slugs:
                continue
            seen_slugs.add(slug)
            items.append(item)

        for mod in part.get("modules", []):
            existing_mod = next((m for m in modules if m.get("slug") == mod.get("slug")), None)
            if existing_mod:
                existing_mod["concepts"] = list(dict.fromkeys(
                    (existing_mod.get("concepts") or []) + (mod.get("concepts") or [])
                ))
            else:
                modules.append(mod)

        if part.get("source_summary"):
            summaries.append(part["source_summary"])

    return {
        "items": items,
        "modules": modules,
        "source_summary": " ".join(summaries)[:2000],
    }


def _existing_pages_context(item: dict, existing_pages: dict[str, dict], limit: int = 3) -> str:
    """Extractos de paginas wiki ya existentes (de ingestas anteriores) que
    se relacionan con este item, para que la pagina nueva se integre con lo
    que ya existe en vez de escribirse en el vacio (patron LLM Wiki)."""
    if not existing_pages:
        return ""
    refs = list(dict.fromkeys((item.get("related") or []) + (item.get("prerequisites") or [])))
    matches = [existing_pages[r] for r in refs if r in existing_pages][:limit]
    if not matches:
        return ""
    blocks = []
    for p in matches:
        _, body = parse_frontmatter(p["content"])
        blocks.append(f"### {p['title']}\n{body[:500]}")
    return (
        "## Paginas existentes relacionadas (integra el contenido nuevo de forma coherente con esto):\n\n"
        + "\n\n".join(blocks) + "\n\n"
    )


# ── Step 1: Analysis ─────────────────────────────────────────

async def run_ingesta_pipeline(
    job_id: str,
    deck_id: str,
    pdf_content: bytes,
    source_name: str,
) -> None:
    supabase = get_supabase()

    def update(status: str, progress: int, stage: str, **extras: object) -> None:
        supabase.table("ingest_jobs").update({
            "status": status,
            "progress": progress,
            "stage": stage,
            **extras,
        }).eq("id", job_id).execute()

    try:
        # 1. Extraer texto
        update("extracting", 10, "Extrayendo texto del PDF")

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(pdf_content)
            temp_path = Path(f.name)
        try:
            raw_text = await extract_text(temp_path)
        finally:
            temp_path.unlink(missing_ok=True)

        if len(raw_text.strip()) < 50:
            update("error", 0, "Error", error_message="No se pudo extraer texto del PDF")
            return

        # Guardar texto extraido en Storage para reutilizar en Step 2
        from app.services.wiki_builder import _upload_text, WIKI_BUCKET
        _upload_text(WIKI_BUCKET, f"{deck_id}/.yachaq/extracted_{job_id}.txt", raw_text)

        # 2. Analizar con LLM
        update("analyzing", 30, "Analizando estructura del documento")

        existing_concepts: list[dict] = []
        if notebook_exists(deck_id):
            try:
                existing_pages = get_all_pages(deck_id)
                existing_concepts = [
                    {"slug": p["page_id"], "title": p["title"], "type": p["type"]}
                    for p in existing_pages
                ]
            except Exception:
                pass

        max_chars = 30_000 if gateway.get_active().get("provider") == "groq" else 80_000
        chunks = _split_text(raw_text, max_chars)
        plan = await _analyze_chunks(
            chunks, source_name, existing_concepts,
            on_progress=lambda pct, stage: update("analyzing", pct, stage),
        )

        # Sanitizar slugs y enriquecer items
        for item in plan.get("items", []):
            item["slug"] = _safe_slug(item.get("slug", item.get("title", "unknown")))
            item.setdefault("accepted", True)
            item.setdefault("conflict_detail", None)
            item["prerequisites"] = [_safe_slug(p) for p in (item.get("prerequisites") or [])]
            item["related"] = [_safe_slug(r) for r in (item.get("related") or [])]
            if item.get("module"):
                item["module"] = _safe_slug(item["module"])
            item.setdefault("summary", "")
        for mod in plan.get("modules", []):
            mod["slug"] = _safe_slug(mod.get("slug", mod.get("title", "unknown")))
            mod["concepts"] = [_safe_slug(c) for c in (mod.get("concepts") or [])]

        # Algunos modelos (ej. DeepSeek) no duplican los modulos dentro de
        # "items" con type="modulo" como pide el prompt, sino que solo los
        # listan en "modules". Para no depender de ese comportamiento,
        # los modulos canonicos siempre se derivan de plan["modules"] y se
        # fusionan en items (sin duplicar si el modelo si los incluyo).
        existing_module_slugs = {
            i["slug"] for i in plan["items"] if i.get("type") == "modulo"
        }
        for mod in plan.get("modules", []):
            if mod["slug"] in existing_module_slugs:
                continue
            plan["items"].append({
                "slug": mod["slug"],
                "title": mod.get("title", mod["slug"]),
                "type": "modulo",
                "action": "create",
                "summary": mod.get("summary", ""),
                "prerequisites": [],
                "related": [],
                "module": None,
                "conflict_detail": None,
                "order": mod.get("order", 0),
            })
            existing_module_slugs.add(mod["slug"])

        n_concepts = sum(1 for i in plan["items"] if i.get("type") == "concepto")
        n_entities = sum(1 for i in plan["items"] if i.get("type") == "entidad")
        n_modules = sum(1 for i in plan["items"] if i.get("type") == "modulo")

        update(
            "analysis_done", 50, "Esperando revision del usuario",
            review_items=plan["items"],
            review_status="analysis_done",
            concepts_found=n_concepts,
            entities_found=n_entities,
            modules_found=n_modules,
            source_summary=plan.get("source_summary", "")[:2000],
        )

    except Exception as exc:
        logger.exception("Error en pipeline de ingesta")
        update("error", 0, "Error", error_message=str(exc)[:500])


# ── Step 2: Generation ───────────────────────────────────────

async def run_generation_after_review(
    job_id: str,
    deck_id: str,
    approved_items: list[dict],
    raw_text: str,
    source_name: str,
    source_summary: str = "",
) -> None:
    supabase = get_supabase()
    today = _today()

    def update(status: str, progress: int, stage: str, **extras: object) -> None:
        supabase.table("ingest_jobs").update({
            "status": status,
            "progress": progress,
            "stage": stage,
            **extras,
        }).eq("id", job_id).execute()

    try:
        concepts = [i for i in approved_items if i["type"] == "concepto"]
        entities = [i for i in approved_items if i["type"] == "entidad"]
        modules = [i for i in approved_items if i["type"] == "modulo"]
        total = len(concepts) + len(entities) + len(modules)

        # 1. Fuente transformada
        update("generating", 55, "Generando fuente transformada")
        _write_transformed_source(deck_id, source_name, raw_text, today, source_summary)

        # Paginas existentes (de ingestas previas) para dar contexto al generar
        existing_pages: dict[str, dict] = {}
        try:
            existing_pages = {p["page_id"]: p for p in get_all_pages(deck_id)}
        except Exception:
            pass

        # 2. Conceptos
        for idx, concept in enumerate(concepts):
            pct = 60 + int((idx / max(total, 1)) * 20)
            update("generating", pct, f"Generando: {concept['title']}")
            await _generate_concept(deck_id, concept, raw_text, approved_items, source_name, today, existing_pages)

        # 3. Entidades
        for entity in entities:
            update("generating", 82, f"Generando: {entity['title']}")
            await _generate_entity(deck_id, entity, raw_text, source_name, today, existing_pages)

        # 4. Modulos
        update("generating", 90, "Generando modulos")
        for mod in modules:
            _write_module(deck_id, mod, concepts, today)

        # 6. Actualizar index y log
        update("generating", 97, "Actualizando indice")
        _update_index(deck_id, approved_items, source_name, today)
        _update_log(deck_id, source_name, len(concepts), len(entities), len(modules), today)

        # 7. Actualizar YACHAQ.md
        _update_yachaq(deck_id, source_name, today)

        update(
            "completed", 100, "Wiki generada",
            review_status="completed",
            concepts_found=len(concepts),
            entities_found=len(entities),
            modules_found=len(modules),
        )

    except Exception as exc:
        logger.exception("Error en generacion de wiki")
        update("error", 0, "Error en generacion", error_message=str(exc)[:500])


# ── Page generators ──────────────────────────────────────────

def _write_transformed_source(
    deck_id: str, source_name: str, raw_text: str, today: str, source_summary: str = "",
) -> None:
    slug = re.sub(r"[^a-z0-9]+", "-", source_name.lower().removesuffix(".pdf")).strip("-")
    fm = {
        "id": f"fuente-{slug}",
        "tipo": "fuente_transformada",
        "titulo": source_name,
        "creado": today,
        "fuente_original": source_name,
    }
    resumen = f"## Resumen\n\n{source_summary}\n\n" if source_summary else ""
    body = f"# {source_name}\n\n{resumen}{raw_text[:20_000]}"
    _write_page_to_storage(deck_id, f"1. fuentes_transformadas/{slug}.md", fm, body)


async def _generate_concept(
    deck_id: str,
    concept: dict,
    raw_text: str,
    all_items: list[dict],
    source_name: str,
    today: str,
    existing_pages: dict[str, dict] | None = None,
) -> None:
    related_titles = ", ".join(
        i["title"] for i in all_items
        if i["slug"] in concept.get("related", [])
    )
    prereq_titles = ", ".join(
        i["title"] for i in all_items
        if i["slug"] in concept.get("prerequisites", [])
    )
    existing_context = _existing_pages_context(concept, existing_pages or {})

    prompt = (
        f'Genera una pagina wiki para el concepto "{concept["title"]}".\n\n'
        f"Resumen: {concept.get('summary', '')}\n"
        f"Prerrequisitos: {prereq_titles or 'Ninguno'}\n"
        f"Relacionados: {related_titles or 'Ninguno'}\n"
        f"Modulo: {concept.get('module', 'general')}\n\n"
        f"{existing_context}"
        f"Texto fuente relevante (extracto):\n{raw_text[:6_000]}"
    )

    sys = GENERATION_SYSTEM.replace("{today}", today).replace("{source_name}", source_name)
    response = await gateway.generate(prompt=prompt, system=sys)

    fm_parsed, body_parsed = parse_frontmatter(response.text)
    if not fm_parsed:
        fm_parsed = {
            "id": concept["slug"],
            "tipo": "concepto",
            "titulo": concept["title"],
            "modulo": concept.get("module", "general"),
            "estado_srs": "bloqueado",
            "maestria": 0,
            "prerrequisitos": concept.get("prerequisites", []),
            "relacionados": concept.get("related", []),
            "resumen": concept.get("summary", ""),
            "creado": today,
            "fuente_primaria": source_name,
        }
        body_parsed = response.text

    fm_parsed.setdefault("id", concept["slug"])
    fm_parsed.setdefault("tipo", "concepto")
    fm_parsed.setdefault("estado_srs", "bloqueado")
    fm_parsed.setdefault("maestria", 0)

    _write_page_to_storage(deck_id, f"2. conceptos/{concept['slug']}.md", fm_parsed, body_parsed)


async def _generate_entity(
    deck_id: str,
    entity: dict,
    raw_text: str,
    source_name: str,
    today: str,
    existing_pages: dict[str, dict] | None = None,
) -> None:
    existing_context = _existing_pages_context(entity, existing_pages or {})
    prompt = (
        f'Genera una pagina wiki para la entidad "{entity["title"]}".\n\n'
        f"Resumen: {entity.get('summary', '')}\n"
        f"Relacionados: {', '.join(entity.get('related', []))}\n\n"
        f"{existing_context}"
        f"Texto fuente relevante (extracto):\n{raw_text[:4_000]}"
    )

    sys = GENERATION_SYSTEM.replace("{today}", today).replace("{source_name}", source_name)
    response = await gateway.generate(prompt=prompt, system=sys)

    fm_parsed, body_parsed = parse_frontmatter(response.text)
    if not fm_parsed:
        fm_parsed = {
            "id": entity["slug"],
            "tipo": "entidad",
            "titulo": entity["title"],
            "resumen": entity.get("summary", ""),
            "creado": today,
            "fuente_primaria": source_name,
        }
        body_parsed = response.text

    fm_parsed.setdefault("id", entity["slug"])
    fm_parsed.setdefault("tipo", "entidad")

    _write_page_to_storage(deck_id, f"3. entidades/{entity['slug']}.md", fm_parsed, body_parsed)



def _write_module(
    deck_id: str, mod: dict, concepts: list[dict], today: str,
) -> None:
    member_concepts = [c for c in concepts if c.get("module") == mod["slug"]]
    concept_list = "\n".join(
        f"- [[2. conceptos/{c['slug']}.md|{c['title']}]]" for c in member_concepts
    )
    fm = {
        "id": mod["slug"],
        "tipo": "modulo",
        "titulo": mod["title"],
        "orden": mod.get("order", 0),
        "conceptos": [c["slug"] for c in member_concepts],
        "creado": today,
    }
    body = f"# {mod['title']}\n\n{mod.get('summary', '')}\n\n## Conceptos\n\n{concept_list}"
    _write_page_to_storage(deck_id, f"5. modulos/{mod['slug']}.md", fm, body)


def _update_index(
    deck_id: str, items: list[dict], source_name: str, today: str,
) -> None:
    concepts = [i for i in items if i["type"] == "concepto"]
    entities = [i for i in items if i["type"] == "entidad"]
    modules = [i for i in items if i["type"] == "modulo"]

    sections = [f"# Indice del Notebook\n\nActualizado: {today}\n"]

    if modules:
        sections.append("## Modulos\n")
        for m in modules:
            sections.append(f"- [[5. modulos/{m['slug']}.md|{m['title']}]]")

    if concepts:
        sections.append("\n## Conceptos\n")
        for c in concepts:
            sections.append(f"- [[2. conceptos/{c['slug']}.md|{c['title']}]] — {c.get('summary', '')}")

    if entities:
        sections.append("\n## Entidades\n")
        for e in entities:
            sections.append(f"- [[3. entidades/{e['slug']}.md|{e['title']}]]")

    sections.append(f"\n## Fuentes\n\n- [[1. fuentes_transformadas/{source_name.lower().removesuffix('.pdf').replace(' ', '-')}|{source_name}]]")

    fm = {
        "id": f"notebook-{deck_id}",
        "tipo": "notebook",
        "titulo": deck_id,
        "actualizado": today,
        "modulos": [m["slug"] for m in modules],
        "conceptos": [c["slug"] for c in concepts],
        "entidades": [e["slug"] for e in entities],
        "fuentes": [source_name],
    }
    _write_page_to_storage(deck_id, "index.md", fm, "\n".join(sections))


def _update_log(
    deck_id: str,
    source_name: str,
    n_concepts: int,
    n_entities: int,
    n_modules: int,
    today: str,
) -> None:
    # Formato "## [fecha] tipo | titulo" para que el log sea parseable con
    # grep, ej: grep "^## \[" log.md | tail -5
    entry = (
        f"## [{today}] ingest | {source_name}\n\n"
        f"- {n_concepts} conceptos, {n_entities} entidades, {n_modules} modulos generados."
    )
    existing = _download_text(WIKI_BUCKET, f"{deck_id}/log.md") or ""
    _, body = parse_frontmatter(existing)
    new_body = f"{body.strip()}\n\n{entry}" if body.strip() else f"# Registro de actividad\n\n{entry}"
    fm = {"id": f"log-{deck_id}", "tipo": "log"}
    _write_page_to_storage(deck_id, "log.md", fm, new_body)


def _update_yachaq(deck_id: str, _source_name: str, today: str) -> None:
    existing = _download_text(WIKI_BUCKET, f"{deck_id}/YACHAQ.md") or ""
    if "Instrucciones para INGEST" in existing:
        return

    fm = {"yachaq_schema_version": "2.0", "mazo_id": deck_id}
    body = f"""\
# YACHAQ.md — Esquema del Agente

## Convenciones de Este Mazo

- Idioma: **Espanol**. Terminos tecnicos en ingles se mantienen si son estandar.
- Granularidad: Un concepto = una idea explicable en 200-400 palabras.
- Ultima actualizacion: {today}

## Instrucciones para INGEST (nueva fuente)

1. Lee el documento completo antes de crear ningun archivo.
2. Compara contra `index.md` para identificar conceptos ya existentes.
3. Conceptos existentes: actualiza el archivo en lugar de crear duplicado.
4. Conceptos nuevos: crea archivo `.md` siguiendo la plantilla estandar.
5. Actualiza `index.md` con el nuevo contenido.
6. Anade entrada a `log.md`.

## Instrucciones para QUERY (LLM Wiki)

1. Lee `index.md` para identificar las 3-5 paginas mas relevantes.
2. Navega los enlaces internos si necesitas mas contexto (profundidad max: 3 saltos).
3. Cita los archivos fuente de cada afirmacion con enlaces relativos."""

    _write_page_to_storage(deck_id, "YACHAQ.md", fm, body)
