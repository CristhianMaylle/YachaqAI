"""Parser centralizado de archivos `4. preguntas/q-{slug}.md`.

El generador de preguntas (agents/generador_preguntas.py) escribe un
encabezado explicito por tipo ("## Pregunta N -- {Tipo}") para que el
parseo no dependa de adivinar el tipo por posicion. El backend devuelve
JSON estructurado — el frontend nunca vuelve a parsear markdown crudo.
"""
from __future__ import annotations

import re

from app.services.wiki_builder import parse_frontmatter

QUESTION_HEADER_RE = re.compile(r"^## Pregunta \d+ -- (.+?)\s*$", re.MULTILINE)

TYPE_LABELS: dict[str, str] = {
    "completar oracion": "completar",
    "relacionar terminos": "relacionar",
    "diagrama incompleto": "diagrama",
    "desarrollo conceptual": "desarrollo",
}

_ANSWER_RE = re.compile(r"^>\s*\*\*Respuestas?:\*\*\s*(.+)$", re.MULTILINE | re.IGNORECASE)
_EXPECTED_RE = re.compile(r"^>\s*\*\*Respuesta Esperada:\*\*\s*(.+)$", re.MULTILINE | re.IGNORECASE)
_PAIR_RE = re.compile(r"^-\s*(.+?)\s*::\s*(.+?)\s*$", re.MULTILINE)


def parse_questions_md(content: str, concept_slug: str, concept_title: str, file: str) -> list[dict]:
    _, body = parse_frontmatter(content)
    matches = list(QUESTION_HEADER_RE.finditer(body))
    questions: list[dict] = []
    for i, m in enumerate(matches):
        qtype = TYPE_LABELS.get(m.group(1).strip().lower())
        if not qtype:
            continue
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        section = body[start:end].strip()
        q = _parse_section(qtype, section)
        if not q:
            continue
        q.update({"concept_slug": concept_slug, "concept_title": concept_title, "file": file})
        questions.append(q)
    return questions


def _parse_section(qtype: str, section: str) -> dict | None:
    if qtype in ("completar", "diagrama"):
        return _parse_blanks(qtype, section)
    if qtype == "relacionar":
        return _parse_matching(section)
    if qtype == "desarrollo":
        return _parse_freetext(section)
    return None


def _parse_blanks(qtype: str, section: str) -> dict | None:
    m = _ANSWER_RE.search(section)
    if not m:
        return None
    answers = [a.strip() for a in m.group(1).split(",") if a.strip()]
    if not answers:
        return None
    prompt = section[: m.start()].strip()
    return {"type": qtype, "prompt": prompt, "blanks": answers}


def _parse_matching(section: str) -> dict | None:
    pairs = [{"term": t.strip(), "definition": d.strip()} for t, d in _PAIR_RE.findall(section)]
    if not pairs:
        return None
    return {
        "type": "relacionar",
        "prompt": "Relaciona cada termino con su definicion correcta.",
        "pairs": pairs,
    }


def _parse_freetext(section: str) -> dict | None:
    m = _EXPECTED_RE.search(section)
    if not m:
        return None
    prompt = section[: m.start()].strip()
    expected = m.group(1).strip()
    if not prompt or not expected:
        return None
    return {"type": "desarrollo", "prompt": prompt, "expected_answer": expected}
