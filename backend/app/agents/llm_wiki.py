"""Agente LLM Wiki — Gemini navega la wiki preconstruida para responder
preguntas en lenguaje natural.

Pipeline (ver ARQUITECTURA_MVP.md seccion 12.2):
1. Busqueda de nodos semilla por keyword matching contra la pregunta.
2. Expansion de subgrafo 2 saltos con el modelo de relevancia de 4 senales
   (wiki_navigator.find_relevant_pages).
3. Lectura de las paginas mas relevantes (presupuesto de contexto acotado).
4. Sintesis de respuesta con el LLM activo, citando las paginas usadas.

La funcion archive_response() separa el patron LLM Wiki de "Query ->
archivado": una respuesta que sintetiza 3+ fuentes o supera 300 palabras
se puede guardar como un concepto nuevo, enlazado a sus fuentes.
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.services.llm_gateway import gateway
from app.services.wiki_builder import (
    _slugify,
    _write_page_to_storage,
    get_all_pages,
    parse_frontmatter,
)
from app.services.wiki_builder import build_graph as _build_graph
from app.services.wiki_navigator import (
    build_networkx,
    find_relevant_pages,
    find_seed_nodes,
    source_map,
)

WIKI_SYSTEM = """\
Eres el LLM Wiki de YachaqAI, un asistente que responde preguntas basandose \
UNICAMENTE en los apuntes del mazo de estudio del usuario (nunca en \
conocimiento externo no verificado). Recibiras fragmentos de paginas de la \
wiki, cada uno marcado con su titulo y archivo.

REGLAS:
- Responde en espanol, de forma clara y pedagogica.
- Basate solo en el contenido proporcionado. Si la informacion no alcanza \
para responder, dilo explicitamente en vez de inventar.
- Cuando uses una idea de una pagina, cita su titulo entre corchetes dobles \
al final de la oracion o parrafo, ej: "TCP garantiza el orden de los \
paquetes [[Protocolo TCP]]."
- Si sintetizas informacion de varias paginas, cita todas las que usaste.
- Se conciso pero completo: prioriza explicaciones utiles para estudiar, no \
listas vacias de contexto."""

WIKI_USER = """\
Historial reciente de la conversacion:
{history}

Paginas relevantes de la wiki del usuario:
{context}

Pregunta del usuario: {question}

Responde usando solo el contenido de las paginas anteriores, citando con \
[[Titulo de la pagina]] las que uses."""

MAX_CONTEXT_CHARS = 12_000
MAX_PAGE_CHARS = 1_500


async def answer_query(deck_id: str, question: str, history: list[dict] | None = None) -> dict:
    graph_data = _build_graph(deck_id)
    if not graph_data["nodes"]:
        return {
            "answer": "Tu mazo todavia no tiene contenido generado. Sube un documento primero para poder consultarlo.",
            "citations": [],
            "nodes_consulted": [],
            "can_archive": False,
        }

    nx_graph = build_networkx(graph_data)
    pages = get_all_pages(deck_id)
    pages_by_id = {p["page_id"]: p for p in pages}
    src_map = source_map(pages)

    seeds = find_seed_nodes(nx_graph, question, top_k=5)
    if not seeds:
        # Sin coincidencias de keywords: usar los nodos mas conectados del
        # mazo como punto de partida en vez de fallar la busqueda.
        by_degree = sorted(graph_data["nodes"], key=lambda n: nx_graph.degree(n["id"]), reverse=True)
        seeds = [n["id"] for n in by_degree[:3]]

    ranked = find_relevant_pages(nx_graph, seeds, src_map, top_k=8)
    relevant_ids = list(dict.fromkeys(seeds + [nid for nid, _score in ranked]))[:10]
    relevant_ids = [nid for nid in relevant_ids if nid in pages_by_id]

    if not relevant_ids:
        return {
            "answer": "No encontre paginas relacionadas con tu pregunta en este mazo. Prueba reformularla o revisa si el tema fue cubierto en el material subido.",
            "citations": [],
            "nodes_consulted": [],
            "can_archive": False,
        }

    context_blocks = []
    used_ids: list[str] = []
    used_chars = 0
    for nid in relevant_ids:
        p = pages_by_id[nid]
        _, body = parse_frontmatter(p["content"])
        block = f"### {p['title']} (archivo: {p['file']})\n{body[:MAX_PAGE_CHARS]}"
        if used_chars + len(block) > MAX_CONTEXT_CHARS:
            break
        context_blocks.append(block)
        used_ids.append(nid)
        used_chars += len(block)

    history_text = "(sin historial previo)"
    if history:
        history_text = "\n".join(f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history[-6:])

    prompt = WIKI_USER.format(
        history=history_text,
        context="\n\n".join(context_blocks),
        question=question,
    )

    response = await gateway.generate(prompt=prompt, system=WIKI_SYSTEM)
    answer = response.text

    citations = [
        {"id": nid, "file": pages_by_id[nid]["file"], "title": pages_by_id[nid]["title"]}
        for nid in used_ids
    ]

    word_count = len(answer.split())
    can_archive = word_count > 300 or len(citations) >= 3

    return {
        "answer": answer,
        "citations": citations,
        "nodes_consulted": used_ids,
        "can_archive": can_archive,
    }


async def archive_response(
    deck_id: str,
    question: str,
    content: str,
    title: str,
    source_files: list[str],
) -> dict:
    slug = _slugify(title)[:80] or f"sintesis-{int(datetime.now(timezone.utc).timestamp())}"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    related = list(dict.fromkeys(
        f.split("/")[-1].removesuffix(".md") for f in source_files if f
    ))

    frontmatter = {
        "id": slug,
        "tipo": "concepto",
        "titulo": title,
        "modulo": "sintesis-llm-wiki",
        "estado_srs": "bloqueado",
        "maestria": 0,
        "prerrequisitos": [],
        "relacionados": related,
        "resumen": f"Sintesis generada por LLM Wiki en respuesta a: {question}"[:300],
        "creado": today,
        "fuente_primaria": "LLM Wiki (sintesis)",
    }

    links_section = "\n".join(f"- [[{f}]]" for f in source_files) if source_files else ""
    body = f"# {title}\n\n{content}\n"
    if links_section:
        body += f"\n## Fuentes consultadas\n{links_section}\n"

    path = f"2. conceptos/{slug}.md"
    _write_page_to_storage(deck_id, path, frontmatter, body)

    return {"success": True, "file": path, "page_id": slug}
