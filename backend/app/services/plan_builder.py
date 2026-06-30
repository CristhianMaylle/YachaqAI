"""Personalizacion del plan de estudio via instruccion en lenguaje natural.

build_plan() (wiki_builder.py) calcula el orden topologico real a partir de
prerrequisitos. Aqui el LLM solo propone una variacion de ese orden segun la
instruccion del usuario; el resultado siempre se valida contra el grafo de
dependencias real antes de devolverse — si el LLM viola una dependencia, se
descarta y se usa el orden topologico original.
"""
from __future__ import annotations

import json
import re

from app.services.llm_gateway import gateway
from app.services.wiki_builder import build_plan

CUSTOMIZE_SYSTEM = """\
Eres un asistente que reordena un plan de estudio. Recibes una lista de \
modulos (con titulo, estado y retencion) y una instruccion del usuario en \
lenguaje natural. Debes proponer un nuevo orden de los modulos que mejor \
se ajuste a la instruccion.

REGLA OBLIGATORIA: el orden propuesto sera validado contra las dependencias \
reales entre modulos (prerrequisitos). Si tu orden viola una dependencia, \
sera descartado. Respeta las dependencias logicas (un modulo prerrequisito \
de otro deberia ir antes) y dentro de eso, prioriza la instruccion del \
usuario.

Responde SOLO en JSON valido: {"order": ["id-modulo-1", "id-modulo-2", ...]}"""

CUSTOMIZE_USER = """\
Modulos actuales (en orden topologico valido):
{modules_json}

Instruccion del usuario: "{instruction}"

Devuelve el JSON con el nuevo orden de ids de modulo."""


def _parse_order_json(text: str) -> list[str]:
    cleaned = text.strip()
    fence = re.search(r"```(?:json)?\s*\n?(.*?)```", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if not match:
            return []
        try:
            data = json.loads(match.group())
        except json.JSONDecodeError:
            return []
    order = data.get("order")
    return [o for o in order if isinstance(o, str)] if isinstance(order, list) else []


def _is_valid_topo_order(order: list[str], edges: list[dict]) -> bool:
    position = {mid: i for i, mid in enumerate(order)}
    for edge in edges:
        src, tgt = edge["source"], edge["target"]
        if src not in position or tgt not in position:
            return False
        if position[src] > position[tgt]:
            return False
    return True


async def customize_plan(deck_id: str, instruction: str) -> dict:
    plan = build_plan(deck_id)
    modules = plan["modules"]
    edges = plan["edges"]

    instruction = (instruction or "").strip()
    if not modules or not instruction:
        return {**plan, "customization_applied": False, "instruction": instruction}

    modules_summary = [
        {"id": m["id"], "title": m["title"], "estado": m["estado"], "retencion": m["retencion_promedio"]}
        for m in modules
    ]
    prompt = CUSTOMIZE_USER.format(
        modules_json=json.dumps(modules_summary, ensure_ascii=False),
        instruction=instruction[:500],
    )

    try:
        response = await gateway.generate(prompt=prompt, system=CUSTOMIZE_SYSTEM, response_format="json")
        proposed = _parse_order_json(response.text)
    except Exception:
        proposed = []

    valid_ids = {m["id"] for m in modules}
    proposed = [mid for mid in proposed if mid in valid_ids]
    missing = [m["id"] for m in modules if m["id"] not in proposed]
    full_order = proposed + missing

    if not full_order or not _is_valid_topo_order(full_order, edges):
        return {**plan, "customization_applied": False, "instruction": instruction}

    by_id = {m["id"]: m for m in modules}
    return {
        "modules": [by_id[mid] for mid in full_order],
        "edges": edges,
        "customization_applied": True,
        "instruction": instruction,
    }
