"""Navega el grafo de conocimiento para encontrar paginas relevantes a una
pregunta en lenguaje natural.

Usado por el Agente LLM Wiki (app/agents/llm_wiki.py). Implementa el modelo
de relevancia de 4 senales descrito en ARQUITECTURA_MVP.md seccion 12.2:

1. Wikilinks directos     (x3.0) — enlace explicito entre paginas
2. Fuentes compartidas    (x4.0) — generadas desde el mismo PDF/fuente
3. Vecinos comunes        (x1.5) — indice de Adamic-Adar
4. Afinidad de tipo       (x1.0) — concepto-concepto, entidad-entidad, etc.

La busqueda expande 2 saltos desde los nodos semilla, penalizando el
segundo salto con un factor de decaimiento de 0.5.
"""
from __future__ import annotations

import math
import re
import unicodedata

import networkx as nx

WEIGHTS = {
    "wikilink": 3.0,
    "shared_source": 4.0,
    "adamic_adar": 1.5,
    "type_affinity": 1.0,
}
HOP2_DECAY = 0.5


def build_networkx(graph_data: dict) -> nx.Graph:
    """Convierte la salida de wiki_builder.build_graph() a un grafo
    networkx no dirigido (la direccion prerrequisito/relacionado no importa
    para la busqueda de relevancia)."""
    g = nx.Graph()
    for node in graph_data["nodes"]:
        g.add_node(node["id"], **node)
    for edge in graph_data["edges"]:
        if edge["source"] in g and edge["target"] in g:
            g.add_edge(edge["source"], edge["target"])
    return g


def source_map(pages: list[dict]) -> dict[str, list[str]]:
    """Mapea cada page_id a su(s) fuente(s) primaria(s), usadas para la
    senal 'fuentes compartidas'."""
    result: dict[str, list[str]] = {}
    for p in pages:
        src = p["frontmatter"].get("fuente_primaria")
        result[p["page_id"]] = [src] if isinstance(src, str) and src else []
    return result


def _keywords(text: str) -> set[str]:
    s = unicodedata.normalize("NFD", (text or "").lower())
    s = re.sub(r"[̀-ͯ]", "", s)
    return {w for w in re.findall(r"[a-z0-9]+", s) if len(w) > 2}


def find_seed_nodes(graph: nx.Graph, question: str, top_k: int = 5) -> list[str]:
    """Busqueda inicial por keyword matching contra titulo/resumen de cada
    nodo. El titulo pesa el doble que el resumen."""
    q_kw = _keywords(question)
    if not q_kw:
        return []
    scored: list[tuple[str, float]] = []
    for node_id, data in graph.nodes(data=True):
        label_kw = _keywords(data.get("label", ""))
        summary_kw = _keywords(data.get("summary", ""))
        overlap = len(q_kw & label_kw) * 2 + len(q_kw & summary_kw)
        if overlap > 0:
            scored.append((node_id, overlap))
    scored.sort(key=lambda x: x[1], reverse=True)
    return [n for n, _ in scored[:top_k]]


def relevance_score(
    graph: nx.Graph,
    seed: str,
    candidate: str,
    src_map: dict[str, list[str]],
) -> float:
    score = 0.0

    if graph.has_edge(seed, candidate):
        score += WEIGHTS["wikilink"]

    seed_sources = set(src_map.get(seed, []))
    cand_sources = set(src_map.get(candidate, []))
    if seed_sources & cand_sources:
        score += WEIGHTS["shared_source"]

    common = set(graph.neighbors(seed)) & set(graph.neighbors(candidate))
    if common:
        aa_sum = sum(1.0 / math.log(max(graph.degree(z), 2)) for z in common)
        score += WEIGHTS["adamic_adar"] * aa_sum

    seed_type = graph.nodes[seed].get("type", "")
    cand_type = graph.nodes[candidate].get("type", "")
    if seed_type and seed_type == cand_type:
        score += WEIGHTS["type_affinity"]

    return score


def find_relevant_pages(
    graph: nx.Graph,
    query_seeds: list[str],
    src_map: dict[str, list[str]],
    top_k: int = 10,
) -> list[tuple[str, float]]:
    """Expande 2 saltos desde cada nodo semilla y devuelve las top-K
    paginas candidatas ordenadas por score de relevancia agregado."""
    scores: dict[str, float] = {}
    seed_set = set(query_seeds)

    for seed in query_seeds:
        if seed not in graph:
            continue
        for neighbor in graph.neighbors(seed):
            if neighbor in seed_set:
                continue
            s = relevance_score(graph, seed, neighbor, src_map)
            scores[neighbor] = scores.get(neighbor, 0.0) + s

        for n1 in graph.neighbors(seed):
            for n2 in graph.neighbors(n1):
                if n2 != seed and n2 not in seed_set:
                    s = relevance_score(graph, seed, n2, src_map) * HOP2_DECAY
                    scores[n2] = scores.get(n2, 0.0) + s

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return ranked[:top_k]
