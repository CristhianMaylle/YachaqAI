"""Agente generador de preguntas SRS.

Generadas bajo demanda al iniciar una sesion de estudio, no durante la
ingesta (movido de Sprint 1 a Sprint 3 para ahorrar ~40% de llamadas LLM
en documentos grandes — ver PLAN_SPRINTS.md). Sigue el mismo patron que
_generate_concept en ingesta.py: prompt -> gateway.generate() ->
parse_frontmatter() -> fallback -> _write_page_to_storage. Las preguntas
se cachean en Storage; una vez generado un q-{slug}.md no se regenera.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.services.llm_gateway import gateway
from app.services.wiki_builder import (
    _get_markdown_files_cached,
    _write_page_to_storage,
    get_all_pages,
    parse_frontmatter,
)

QUESTION_SYSTEM = """\
Eres un generador de cuestionarios SRS para YachaqAI. Para el concepto dado, \
genera exactamente 4 preguntas, una de cada tipo, en formato Markdown con \
frontmatter YAML. Responde en espanol.

FORMATO OBLIGATORIO (sigue los encabezados exactos, no agregues ni quites \
secciones):

---
id: "q-{slug}"
tipo: "pregunta"
concepto_asociado: "2. conceptos/{slug}.md"
creado: "{today}"
---

# Cuestionario: {title}

## Pregunta 1 -- Completar Oracion
Enunciado con uno o mas espacios marcados como [___] que el estudiante debe \
completar.
> **Respuestas:** respuesta-del-primer-blank, respuesta-del-segundo-blank

## Pregunta 2 -- Relacionar Terminos
Exactamente 4 pares termino-definicion, uno por linea, formato:
- Termino :: Definicion correcta de ese termino
- Termino :: Definicion correcta de ese termino
- Termino :: Definicion correcta de ese termino
- Termino :: Definicion correcta de ese termino

## Pregunta 3 -- Diagrama Incompleto
Una secuencia de pasos o flujo del proceso con 2-4 espacios [___] \
representando elementos faltantes (ej: "Paso A -> [___] -> Paso C: \
descripcion breve").
> **Respuestas:** valor1, valor2

## Pregunta 4 -- Desarrollo Conceptual
Una pregunta abierta que requiera explicar el concepto con palabras propias \
(3-5 oraciones).
> **Respuesta Esperada:** Respuesta modelo de referencia, usada solo para \
evaluacion por IA — el estudiante nunca la ve antes de responder.

REGLAS:
- Cada blank [___] debe tener una unica respuesta correcta y corta (1-3 palabras).
- Basate SOLO en el texto fuente proporcionado.
- No cambies el orden ni el texto de los encabezados "## Pregunta N -- Tipo"."""

QUESTION_USER = """\
Genera el cuestionario para el concepto "{title}".

Resumen: {summary}

Contenido del concepto:
{body}"""


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def question_file_path(concept_slug: str) -> str:
    return f"4. preguntas/q-{concept_slug}.md"


def _question_file_exists(deck_id: str, concept_slug: str) -> bool:
    return question_file_path(concept_slug) in _get_markdown_files_cached(deck_id)


async def generate_questions_for_concept(
    deck_id: str, concept_slug: str, title: str, summary: str, body: str,
) -> None:
    today = _today()
    prompt = QUESTION_USER.format(title=title, summary=summary or "", body=body[:4_000])
    sys = (
        QUESTION_SYSTEM
        .replace("{slug}", concept_slug)
        .replace("{today}", today)
        .replace("{title}", title)
    )
    response = await gateway.generate(prompt=prompt, system=sys)

    fm_parsed, body_parsed = parse_frontmatter(response.text)
    if not fm_parsed:
        fm_parsed = {}
        body_parsed = response.text

    fm_parsed.setdefault("id", f"q-{concept_slug}")
    fm_parsed.setdefault("tipo", "pregunta")
    fm_parsed.setdefault("concepto_asociado", f"2. conceptos/{concept_slug}.md")
    fm_parsed.setdefault("creado", today)

    _write_page_to_storage(deck_id, question_file_path(concept_slug), fm_parsed, body_parsed)


async def generate_questions_for_module(deck_id: str, module_slug: str) -> list[str]:
    """Genera preguntas solo para los conceptos del modulo que aun no las
    tengan (cache: q-{slug}.md ya existente se respeta y no se regenera)."""
    pages = get_all_pages(deck_id)
    concepts = [
        p for p in pages
        if p["type"] == "concepto" and p["frontmatter"].get("modulo") == module_slug
    ]

    generated: list[str] = []
    for c in concepts:
        slug = c["page_id"]
        if _question_file_exists(deck_id, slug):
            continue
        fm, body = parse_frontmatter(c["content"])
        await generate_questions_for_concept(deck_id, slug, c["title"], fm.get("resumen", ""), body)
        generated.append(slug)
    return generated
