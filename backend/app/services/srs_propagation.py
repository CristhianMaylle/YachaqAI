"""Propagacion de incertidumbre a conceptos dependientes cuando el usuario
califica "Olvidado" un concepto.

No es un repaso FSRS real para los nodos propagados — es una senal de
confianza mas blanda para que el grafo/plan (Sprint 2) reflejen el riesgo
sin inundar la cola de /srs/due: el proximo_repaso de los nodos propagados
nunca se toca, solo del concepto que el usuario realmente califico.
"""
from __future__ import annotations

import yaml

from app.services.fsrs_engine import get_srs_state, upsert_srs_state
from app.services.wiki_builder import build_graph, get_all_pages, parse_frontmatter, save_page

MAX_DEPTH = 2
DECAY_BY_DEPTH = {1: 0.85, 2: 0.95}

# Solo se degrada el estado_srs (color semaforo) en el primer grado de
# dependencia — profundidad 2 solo decae retentiva, sin cambiar el tier.
_TIER_DOWNGRADE = {
    "dominado": "en_practica",
    "en_practica": "critico",
}


def propagate_forgotten(deck_id: str, forgotten_concept_id: str) -> list[str]:
    """BFS profundidad 2 sobre aristas 'prerrequisito' salientes desde el
    concepto olvidado. Devuelve los ids de los conceptos afectados."""
    graph = build_graph(deck_id)
    adjacency: dict[str, list[str]] = {}
    for edge in graph["edges"]:
        if edge["type"] != "prerrequisito":
            continue
        adjacency.setdefault(edge["source"], []).append(edge["target"])

    visited: dict[str, int] = {}
    queue: list[tuple[str, int]] = [(forgotten_concept_id, 0)]
    while queue:
        node_id, depth = queue.pop(0)
        if depth >= MAX_DEPTH:
            continue
        for neighbor in adjacency.get(node_id, []):
            if neighbor in visited or neighbor == forgotten_concept_id:
                continue
            visited[neighbor] = depth + 1
            queue.append((neighbor, depth + 1))

    if not visited:
        return []

    pages_by_id = {p["page_id"]: p for p in get_all_pages(deck_id) if p["type"] == "concepto"}

    affected: list[str] = []
    for concept_id, depth in visited.items():
        page = pages_by_id.get(concept_id)
        if not page:
            continue
        decay = DECAY_BY_DEPTH.get(depth, 1.0)

        srs_row = get_srs_state(deck_id, concept_id)
        current_retentiva = srs_row["retentiva"] if srs_row and srs_row.get("retentiva") is not None else page["maestria"]
        new_retentiva = round(max(0.0, current_retentiva * decay), 4)
        upsert_srs_state(deck_id, concept_id, {"retentiva": new_retentiva})

        if depth == 1:
            fm, body = parse_frontmatter(page["content"])
            current_estado = fm.get("estado_srs", "bloqueado")
            if current_estado in _TIER_DOWNGRADE:
                fm["estado_srs"] = _TIER_DOWNGRADE[current_estado]
                yaml_text = yaml.dump(fm, allow_unicode=True, default_flow_style=False).strip()
                save_page(deck_id, page["file"], f"---\n{yaml_text}\n---\n\n{body}")

        affected.append(concept_id)

    return affected
