"""Agente LINT — analiza la wiki generada y detecta problemas de
integridad estructural y semantica.

Cubre las 5 categorias de la Propuesta seccion 5.4 / P3.3:
1. Nodos huerfanos       — conceptos/entidades sin enlaces entrantes
2. Contradicciones       — afirmaciones que se contradicen entre paginas
3. Conceptos sin pagina  — wikilinks mencionados 3+ veces que no resuelven
   a ningun archivo real (candidatos a crear)
4. Referencias rotas     — wikilinks sin resolver mencionados 1-2 veces
   (probable typo o archivo eliminado)
5. Modulos sin cuestionario — conceptos de un modulo sin preguntas generadas
"""
from __future__ import annotations

import json
import re

from app.services.llm_gateway import gateway
from app.services.wiki_builder import (
    WIKILINK_RE,
    _resolve_wikilink_path,
    build_graph,
    get_all_pages,
    get_markdown_files,
    parse_frontmatter,
)

CONTRADICTION_SYSTEM = """\
Eres un auditor de consistencia para una wiki de estudio. Recibiras una \
lista de conceptos con su archivo y resumen. Identifica pares de conceptos \
cuyos resumenes se contradigan entre si (afirmaciones incompatibles sobre \
el mismo tema). Si no encuentras ninguna contradiccion clara, responde con \
una lista vacia — no inventes problemas.

Responde SOLO en JSON valido:
{
  "contradictions": [
    {
      "file_a": "ruta/al/archivo_a.md",
      "file_b": "ruta/al/archivo_b.md",
      "summary": "explicacion breve de la contradiccion"
    }
  ]
}"""

MAX_CONCEPTS_FOR_CONTRADICTION_SCAN = 40


def _parse_json(text: str) -> dict:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return {"contradictions": []}


async def _detect_contradictions(concepts: list[dict]) -> list[dict]:
    if len(concepts) < 2:
        return []

    lines = []
    for c in concepts[:MAX_CONCEPTS_FOR_CONTRADICTION_SCAN]:
        summary = c["frontmatter"].get("resumen") or ""
        if not summary:
            _, body = parse_frontmatter(c["content"])
            summary = body[:200]
        lines.append(f"- [{c['file']}] {c['title']}: {summary}".strip())

    prompt = "\n".join(lines)
    try:
        response = await gateway.generate(prompt=prompt, system=CONTRADICTION_SYSTEM, response_format="json")
        data = _parse_json(response.text)
        return data.get("contradictions", []) or []
    except Exception:
        return []


async def analyze_deck(deck_id: str) -> dict:
    pages = get_all_pages(deck_id)
    graph = build_graph(deck_id)
    files = get_markdown_files(deck_id)

    node_map = {n["id"]: n for n in graph["nodes"]}
    incoming: dict[str, int] = {n["id"]: 0 for n in graph["nodes"]}
    for e in graph["edges"]:
        if e["target"] in incoming:
            incoming[e["target"]] += 1

    # 1. Nodos huerfanos
    orphans = [
        {"id": nid, "title": n["label"], "file": n["file"]}
        for nid, n in node_map.items()
        if incoming.get(nid, 0) == 0 and n["type"] in ("concepto", "entidad")
    ]

    # 3/4. Wikilinks sin resolver (agrupados por texto del link)
    link_counts: dict[str, int] = {}
    link_sources: dict[str, list[str]] = {}
    for p in pages:
        for m in WIKILINK_RE.finditer(p["content"]):
            raw_link = m.group(1).strip()
            resolved = _resolve_wikilink_path(raw_link, files)
            if resolved not in files:
                link_counts[raw_link] = link_counts.get(raw_link, 0) + 1
                link_sources.setdefault(raw_link, []).append(p["file"])

    missing_pages = []
    broken_refs = []
    for link, count in link_counts.items():
        entry = {"link": link, "count": count, "referenced_from": link_sources[link][:5]}
        if count >= 3:
            missing_pages.append(entry)
        else:
            broken_refs.append(entry)

    # 5. Modulos sin cuestionario
    modules = [p for p in pages if p["type"] == "modulo"]
    concepts = [p for p in pages if p["type"] == "concepto"]
    missing_quiz = []
    for m in modules:
        mod_concepts = [c for c in concepts if c["frontmatter"].get("modulo") == m["page_id"]]
        without_quiz = [
            c["page_id"] for c in mod_concepts
            if f"4. preguntas/q-{c['page_id']}.md" not in files
        ]
        if without_quiz:
            missing_quiz.append({
                "module": m["page_id"], "title": m["title"], "concepts_without_quiz": without_quiz,
            })

    # 2. Contradicciones (1 llamada LLM, acotada a un resumen compacto)
    contradictions = await _detect_contradictions(concepts)

    issues: list[dict] = []
    for o in orphans:
        issues.append({
            "type": "orphan",
            "title": f"'{o['title']}' no tiene enlaces entrantes",
            "file": o["file"],
            "detail": o,
        })
    for c in contradictions:
        issues.append({
            "type": "contradiction",
            "title": c.get("summary", "Posible contradiccion detectada"),
            "file": c.get("file_a", ""),
            "detail": c,
        })
    for mp in missing_pages:
        issues.append({
            "type": "missing_page",
            "title": f"'{mp['link']}' se menciona {mp['count']} veces sin tener pagina propia",
            "file": mp["referenced_from"][0] if mp["referenced_from"] else "",
            "detail": mp,
        })
    for br in broken_refs:
        issues.append({
            "type": "broken_ref",
            "title": f"Referencia rota: '{br['link']}'",
            "file": br["referenced_from"][0] if br["referenced_from"] else "",
            "detail": br,
        })
    for mq in missing_quiz:
        issues.append({
            "type": "missing_quiz",
            "title": f"El modulo '{mq['title']}' tiene conceptos sin cuestionario",
            "file": "",
            "detail": mq,
        })

    penalty = (
        len(orphans) * 4
        + len(contradictions) * 10
        + len(missing_pages) * 8
        + len(broken_refs) * 3
        + len(missing_quiz) * 6
    )
    score = max(0, 100 - penalty)
    status = "healthy" if score >= 90 else "warning" if score >= 60 else "critical"

    return {
        "score": score,
        "status": status,
        "issues": issues,
        "orphan_count": len(orphans),
        "contradiction_count": len(contradictions),
        "missing_page_count": len(missing_pages),
        "broken_ref_count": len(broken_refs),
        "missing_quiz_count": len(missing_quiz),
    }
