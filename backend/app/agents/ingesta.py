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

QUESTION_SYSTEM = """\
Genera preguntas SRS para un concepto educativo. Produce exactamente 4 preguntas \
en formato Markdown con frontmatter YAML.

FORMATO:
---
id: "q-{slug}"
tipo: "pregunta"
concepto_asociado: "2. conceptos/{slug}.md"
subtipo_cuestionario: "mixto"
creado: "{today}"
---

# Cuestionario: {title}

## Pregunta 1 -- Completar la Oracion
[Enunciado con `[___]` en los espacios a completar]
> **Respuesta:** [respuesta correcta]

## Pregunta 2 -- Relacionar Terminos
| Termino | Definicion |
|:---|:---|
| A. Termino1 | __ Definicion que corresponde |
| B. Termino2 | __ Otra definicion |
> **Respuestas:** A-2, B-1 (etc.)

## Pregunta 3 -- Completar la Oracion
[Segundo enunciado de completar]
> **Respuesta:** [respuesta correcta]

## Pregunta 4 -- Desarrollo Conceptual
[Pregunta abierta que requiera explicacion de 3-5 oraciones]
> **Respuesta Esperada:** [respuesta modelo de referencia]"""


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


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


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

        # Guardar texto extraido para Step 2
        supabase.table("ingest_jobs").update({
            "storage_path": f"{deck_id}/{source_name}",
        }).eq("id", job_id).execute()

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

        prompt = ANALYSIS_USER.format(
            source_name=source_name,
            text=raw_text[:80_000],
            existing_concepts=json.dumps(existing_concepts, ensure_ascii=False) if existing_concepts else "Ninguno (wiki vacia)",
        )

        response = await gateway.generate(
            prompt=prompt,
            system=ANALYSIS_SYSTEM,
            response_format="json",
        )

        plan = _parse_analysis_json(response.text)

        # Enrichir items con accepted=True por defecto
        for item in plan.get("items", []):
            item.setdefault("accepted", True)
            item.setdefault("conflict_detail", None)
            item.setdefault("prerequisites", [])
            item.setdefault("related", [])
            item.setdefault("module", None)
            item.setdefault("summary", "")

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
        _write_transformed_source(deck_id, source_name, raw_text, today)

        # 2. Conceptos
        for idx, concept in enumerate(concepts):
            pct = 60 + int((idx / max(total, 1)) * 20)
            update("generating", pct, f"Generando: {concept['title']}")
            await _generate_concept(deck_id, concept, raw_text, approved_items, source_name, today)

        # 3. Entidades
        for entity in entities:
            update("generating", 82, f"Generando: {entity['title']}")
            await _generate_entity(deck_id, entity, raw_text, source_name, today)

        # 4. Preguntas SRS
        update("generating", 87, "Generando preguntas SRS")
        for concept in concepts:
            await _generate_questions(deck_id, concept, raw_text, today)

        # 5. Modulos
        update("generating", 93, "Generando modulos")
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
    deck_id: str, source_name: str, raw_text: str, today: str,
) -> None:
    slug = re.sub(r"[^a-z0-9]+", "-", source_name.lower().removesuffix(".pdf")).strip("-")
    fm = {
        "id": f"fuente-{slug}",
        "tipo": "fuente_transformada",
        "titulo": source_name,
        "creado": today,
        "fuente_original": source_name,
    }
    body = f"# {source_name}\n\n{raw_text[:20_000]}"
    _write_page_to_storage(deck_id, f"1. fuentes_transformadas/{slug}.md", fm, body)


async def _generate_concept(
    deck_id: str,
    concept: dict,
    raw_text: str,
    all_items: list[dict],
    source_name: str,
    today: str,
) -> None:
    related_titles = ", ".join(
        i["title"] for i in all_items
        if i["slug"] in concept.get("related", [])
    )
    prereq_titles = ", ".join(
        i["title"] for i in all_items
        if i["slug"] in concept.get("prerequisites", [])
    )

    prompt = (
        f'Genera una pagina wiki para el concepto "{concept["title"]}".\n\n'
        f"Resumen: {concept.get('summary', '')}\n"
        f"Prerrequisitos: {prereq_titles or 'Ninguno'}\n"
        f"Relacionados: {related_titles or 'Ninguno'}\n"
        f"Modulo: {concept.get('module', 'general')}\n\n"
        f"Texto fuente relevante (extracto):\n{raw_text[:15_000]}"
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
    deck_id: str, entity: dict, raw_text: str, source_name: str, today: str,
) -> None:
    prompt = (
        f'Genera una pagina wiki para la entidad "{entity["title"]}".\n\n'
        f"Resumen: {entity.get('summary', '')}\n"
        f"Relacionados: {', '.join(entity.get('related', []))}\n\n"
        f"Texto fuente relevante (extracto):\n{raw_text[:10_000]}"
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


async def _generate_questions(
    deck_id: str, concept: dict, raw_text: str, today: str,
) -> None:
    prompt = (
        f'Genera preguntas SRS para el concepto "{concept["title"]}".\n\n'
        f"Resumen: {concept.get('summary', '')}\n\n"
        f"Texto fuente relevante (extracto):\n{raw_text[:10_000]}"
    )

    sys = QUESTION_SYSTEM.replace("{slug}", concept["slug"]).replace(
        "{title}", concept["title"]
    ).replace("{today}", today)

    response = await gateway.generate(prompt=prompt, system=sys)

    fm_parsed, body_parsed = parse_frontmatter(response.text)
    if not fm_parsed:
        fm_parsed = {
            "id": f"q-{concept['slug']}",
            "tipo": "pregunta",
            "concepto_asociado": f"2. conceptos/{concept['slug']}.md",
            "subtipo_cuestionario": "mixto",
            "creado": today,
        }
        body_parsed = response.text

    fm_parsed.setdefault("id", f"q-{concept['slug']}")
    fm_parsed.setdefault("tipo", "pregunta")
    fm_parsed.setdefault("concepto_asociado", f"2. conceptos/{concept['slug']}.md")

    _write_page_to_storage(deck_id, f"4. preguntas/q-{concept['slug']}.md", fm_parsed, body_parsed)


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
    entry = (
        f"- {today} — Ingesta de '{source_name}': "
        f"{n_concepts} conceptos, {n_entities} entidades, {n_modules} modulos generados."
    )
    existing = _download_text(WIKI_BUCKET, f"{deck_id}/log.md") or ""
    _, body = parse_frontmatter(existing)
    new_body = f"{body.strip()}\n{entry}" if body.strip() else f"# Registro de actividad\n\n{entry}"
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
