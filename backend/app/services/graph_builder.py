"""Construye grafo NetworkX desde archivos .md.

Lee todos los .md de un wiki, extrae frontmatter (prerrequisitos, relacionados)
y wikilinks del cuerpo para construir nodos + aristas.
"""
import re
from pathlib import Path

import networkx as nx

from app.services.wiki_builder import read_page

WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")


def build_graph(wiki_path: Path) -> nx.DiGraph:
    G = nx.DiGraph()

    for md_file in wiki_path.rglob("*.md"):
        if md_file.name in ("YACHAQ.md", "index.md", "log.md"):
            continue

        fm, body = read_page(md_file)
        slug = md_file.stem
        G.add_node(slug, **fm)

        for prereq in fm.get("prerrequisitos", []) or []:
            G.add_edge(prereq, slug, type="prerrequisito")

        for rel in fm.get("relacionados", []) or []:
            G.add_edge(slug, rel, type="relacionado")

        for link in WIKILINK_RE.findall(body):
            if link != slug and not G.has_edge(slug, link):
                G.add_edge(slug, link, type="wikilink")

    return G
