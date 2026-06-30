"""Gestión de wikis usando Supabase Storage.

Los archivos .md se almacenan en el bucket "wikis" de Supabase Storage.
Estructura: wikis/{deck_id}/2. conceptos/tcp.md

Los PDFs originales van al bucket "pdfs".
Estructura: pdfs/{deck_id}/nombre-archivo.pdf

El backend NO guarda nada localmente — todo vive en Supabase.
Un cache temporal en memoria evita descargas repetidas durante
una misma operación del agente LLM Wiki.
"""
import json
import re
import urllib.parse
from datetime import datetime
import yaml

from app.dependencies import get_supabase

WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]+))?\]\]")

WIKI_BUCKET = "wikis"
PDF_BUCKET = "pdfs"

# --- Cache en memoria (se limpia por request, no persistente) ---
_page_cache: dict[str, dict[str, str]] = {}


def _cache_key(deck_id: str) -> str:
    return deck_id


def invalidate_cache(deck_id: str) -> None:
    _page_cache.pop(deck_id, None)


def _get_cached_content(deck_id: str, path: str) -> str | None:
    return _page_cache.get(deck_id, {}).get(path)


def _set_cached_content(deck_id: str, path: str, content: str) -> None:
    if deck_id not in _page_cache:
        _page_cache[deck_id] = {}
    _page_cache[deck_id][path] = content


# --- Supabase Storage helpers ---

def _storage_path(deck_id: str, rel_path: str) -> str:
    return f"{deck_id}/{rel_path}"


def _upload_text(bucket: str, storage_path: str, content: str) -> None:
    # upsert=true ya sobreescribe atomicamente — el remove() previo dejaba
    # una ventana donde el archivo "no existia" entre el delete y el upload,
    # causando 404 intermitentes al navegar justo despues de generar la wiki.
    sb = get_supabase()
    data = content.encode("utf-8")
    sb.storage.from_(bucket).upload(
        storage_path, data,
        file_options={"content-type": "text/markdown; charset=utf-8", "upsert": "true"},
    )


def _download_text(bucket: str, storage_path: str) -> str | None:
    sb = get_supabase()
    try:
        data = sb.storage.from_(bucket).download(storage_path)
        return data.decode("utf-8") if data else None
    except Exception:
        return None


def _list_files(bucket: str, prefix: str) -> list[str]:
    sb = get_supabase()
    results: list[str] = []
    try:
        items = sb.storage.from_(bucket).list(prefix)
        for item in items:
            name = item.get("name", "")
            if item.get("id") is None:
                sub = _list_files(bucket, f"{prefix}/{name}" if prefix else name)
                results.extend(sub)
            elif name.endswith(".md"):
                full = f"{prefix}/{name}" if prefix else name
                results.append(full)
    except Exception:
        pass
    return sorted(results)


def _delete_prefix(bucket: str, prefix: str) -> None:
    sb = get_supabase()
    files = _list_files(bucket, prefix)
    if files:
        sb.storage.from_(bucket).remove(files)


# --- Notebook CRUD ---

def _slugify(name: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFD", name.lower())
    s = re.sub(r"[̀-ͯ]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def list_notebooks() -> list[dict]:
    sb = get_supabase()
    try:
        items = sb.storage.from_(WIKI_BUCKET).list("")
        deck_ids = [
            item["name"] for item in items
            if item.get("id") is None  # folders
        ]
    except Exception:
        return []

    results = []
    for deck_id in deck_ids:
        meta = _get_notebook_meta_raw(deck_id)
        if meta:
            results.append(meta)
    results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return results


def _get_notebook_meta_raw(deck_id: str) -> dict | None:
    raw = _download_text(WIKI_BUCKET, f"{deck_id}/.yachaq/notebook.json")
    if not raw:
        return None
    try:
        data = json.loads(raw)
        data["id"] = deck_id
        return data
    except Exception:
        return None


def notebook_exists(deck_id: str) -> bool:
    return _get_notebook_meta_raw(deck_id) is not None


def get_notebook_meta(deck_id: str) -> dict:
    meta = _get_notebook_meta_raw(deck_id)
    if not meta:
        return {"id": deck_id, "name": deck_id, "createdAt": "", "updatedAt": ""}
    return meta


def create_notebook(name: str) -> dict:
    nb_id = _slugify(name)
    now = datetime.utcnow().isoformat() + "Z"
    today = now.split("T")[0]

    meta = {"name": name, "description": "", "createdAt": now, "updatedAt": now}
    _upload_text(WIKI_BUCKET, f"{nb_id}/.yachaq/notebook.json", json.dumps(meta, indent=2, ensure_ascii=False))

    yachaq = f"# YACHAQ: Esquema del Notebook\n\n## Dominio\n{name}\n\n## Idioma\n- Español\n"
    _upload_text(WIKI_BUCKET, f"{nb_id}/YACHAQ.md", yachaq)

    index_fm = {
        "id": f"notebook-{nb_id}", "tipo": "notebook", "titulo": name,
        "estado": "nuevo", "creado": today, "actualizado": today,
        "resumen": "Notebook nuevo. Agrega fuentes para comenzar.",
        "modulos": [], "conceptos": [], "entidades": [], "fuentes": [], "preguntas": [],
    }
    _write_page_to_storage(nb_id, "index.md", index_fm, f"# {name}\n\nEste notebook está vacío.")

    log_fm = {"id": f"log-{nb_id}", "tipo": "log"}
    _write_page_to_storage(nb_id, "log.md", log_fm, f"# Registro de actividad\n\n- {today} — Cuaderno creado.")

    meta["id"] = nb_id
    return meta


def register_deck(deck_id: str, name: str) -> None:
    """Inserta la fila correspondiente en la tabla `decks` (Postgres).

    Debe llamarse junto con create_notebook() para que el Dashboard
    (que lee de Postgres, no de Storage) muestre el mazo recien creado.
    """
    sb = get_supabase()
    sb.table("decks").insert({
        "id": deck_id,
        "name": name,
        "wiki_path": f"{deck_id}/",
    }).execute()


def touch_deck(deck_id: str) -> None:
    """Actualiza updated_at de un deck (dispara el trigger deck_updated_at)."""
    sb = get_supabase()
    sb.table("decks").update({"wiki_path": f"{deck_id}/"}).eq("id", deck_id).execute()


def delete_notebook(deck_id: str) -> None:
    _delete_prefix(WIKI_BUCKET, deck_id)
    _delete_prefix(PDF_BUCKET, deck_id)
    invalidate_cache(deck_id)


# --- PDF Storage ---

def upload_pdf(deck_id: str, filename: str, content: bytes) -> str:
    path = f"{deck_id}/{filename}"
    sb = get_supabase()
    sb.storage.from_(PDF_BUCKET).upload(
        path, content,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )
    return path


# --- Page I/O ---

def _write_page_to_storage(deck_id: str, rel_path: str, frontmatter: dict, body: str) -> None:
    fm_text = yaml.dump(frontmatter, allow_unicode=True, default_flow_style=False)
    content = f"---\n{fm_text}---\n\n{body}"
    _upload_text(WIKI_BUCKET, _storage_path(deck_id, rel_path), content)
    _set_cached_content(deck_id, rel_path, content)


def parse_frontmatter(raw: str) -> tuple[dict, str]:
    if not raw.startswith("---"):
        return {}, raw
    try:
        idx = raw.index("---", 3)
    except ValueError:
        return {}, raw
    fm_text = raw[3:idx].strip()
    body = raw[idx + 3:].strip()
    try:
        fm = yaml.safe_load(fm_text) or {}
    except Exception:
        fm = {}
    return fm, body


def read_page(deck_id: str, rel_path: str) -> dict:
    rp = rel_path.replace("\\", "/")
    if not rp.endswith(".md"):
        rp += ".md"

    cached = _get_cached_content(deck_id, rp)
    if cached is not None:
        raw = cached
    else:
        raw = _download_text(WIKI_BUCKET, _storage_path(deck_id, rp)) or ""
        _set_cached_content(deck_id, rp, raw)

    fm, body = parse_frontmatter(raw)

    raw_type = fm.get("tipo", "concepto")
    tipo = "fuente" if raw_type == "fuente_transformada" else raw_type
    page_id = fm.get("id", re.sub(r"[^a-z0-9]", "-", rp.removesuffix(".md").lower()))
    title = fm.get("titulo", rp.split("/")[-1].removesuffix(".md").replace("-", " ").title())

    def _wikilink_to_md(m: re.Match) -> str:
        link_path = m.group(1).strip()
        label = (m.group(2) or "").strip()
        encoded = "/".join(urllib.parse.quote(seg) for seg in link_path.split("/"))
        if not label:
            base = link_path.split("/")[-1].removesuffix(".md").replace("-", " ").replace("_", " ").title()
            label = base
        return f"[{label}](/deck/{deck_id}/wiki/{encoded})"

    parsed_body = WIKILINK_RE.sub(_wikilink_to_md, body)

    try:
        import markdown
        html = markdown.markdown(parsed_body, extensions=["tables", "fenced_code"])
    except ImportError:
        html = parsed_body

    return {
        "notebookId": deck_id,
        "page_id": page_id,
        "file": rp,
        "title": title,
        "type": tipo,
        "content": raw,
        "html": html,
        "frontmatter": fm,
        "related": fm.get("relacionados", []) or [],
        "maestria": fm.get("maestria", 0) if isinstance(fm.get("maestria"), (int, float)) else 0,
        "estado_srs": fm.get("estado_srs", "bloqueado"),
        "last_updated": fm.get("ultimo_repaso") or fm.get("actualizado") or fm.get("fecha_ingesta") or "",
    }


def save_page(deck_id: str, rel_path: str, content: str) -> None:
    _upload_text(WIKI_BUCKET, _storage_path(deck_id, rel_path), content)
    _set_cached_content(deck_id, rel_path, content)


def get_markdown_files(deck_id: str) -> list[str]:
    all_files = _list_files(WIKI_BUCKET, deck_id)
    prefix_len = len(deck_id) + 1  # "deck-id/"
    return [f[prefix_len:] for f in all_files if not f.split("/")[-2].startswith(".")]


def get_all_pages(deck_id: str) -> list[dict]:
    skip = {"YACHAQ.md", "index.md", "log.md"}
    files = get_markdown_files(deck_id)

    all_raw = {}
    for f in files:
        if f not in skip:
            cached = _get_cached_content(deck_id, f)
            if cached is None:
                raw = _download_text(WIKI_BUCKET, _storage_path(deck_id, f)) or ""
                _set_cached_content(deck_id, f, raw)
            all_raw[f] = _get_cached_content(deck_id, f) or ""

    return [read_page(deck_id, f) for f in all_raw]


# --- Graph builder ---

def extract_wikilinks(content: str) -> list[str]:
    return [m.group(1).strip() for m in WIKILINK_RE.finditer(content)]


def build_graph(deck_id: str) -> dict:
    pages = get_all_pages(deck_id)
    node_map: dict[str, dict] = {}

    # Indice de busqueda: mapea slug/id/file/stem a page_id
    lookup: dict[str, str] = {}
    for p in pages:
        pid = p["page_id"]
        lookup[pid] = pid
        lookup[p["file"]] = pid
        stem = p["file"].split("/")[-1].removesuffix(".md")
        lookup[stem] = pid
        fm_id = p["frontmatter"].get("id")
        if isinstance(fm_id, str):
            lookup[fm_id] = pid

    def _resolve(ref: str) -> str | None:
        if not isinstance(ref, str):
            return None
        ref = ref.strip()
        if ref in lookup:
            return lookup[ref]
        clean = ref.removesuffix(".md")
        if clean in lookup:
            return lookup[clean]
        base = clean.split("/")[-1]
        if base in lookup:
            return lookup[base]
        return None

    for p in pages:
        t = p["type"]
        group = (
            p["frontmatter"].get("modulo", "general") if t == "concepto"
            else {"entidad": "Entidades", "fuente": "Fuentes", "modulo": "Módulos", "pregunta": "SRS"}.get(t, "general")
        )
        proximo_repaso = p["frontmatter"].get("proximo_repaso")
        node_map[p["page_id"]] = {
            "id": p["page_id"], "label": p["title"], "type": t, "group": group,
            "maestria": p["maestria"], "estado_srs": p["estado_srs"], "file": p["file"],
            "summary": p["frontmatter"].get("resumen", ""),
            "module": p["frontmatter"].get("modulo"),
            "category": group,
            "proximo_repaso": proximo_repaso if isinstance(proximo_repaso, str) else None,
            "n_preguntas": 0,
            "prerequisites": [],
        }

    edge_map: dict[str, dict] = {}

    def _add_edge(src: str, tgt: str, etype: str):
        if src == tgt:
            return
        key = f"{tgt}--{src}" if etype == "prerrequisito" else "--".join(sorted([src, tgt]))
        if key not in edge_map:
            edge_map[key] = {"source": src, "target": tgt, "type": etype}

    for p in pages:
        pid = p["page_id"]

        for link in extract_wikilinks(p["content"]):
            resolved = _resolve(link)
            if resolved and resolved != pid:
                _add_edge(pid, resolved, "relacionado")

        for rel in (p["frontmatter"].get("relacionados") or []):
            resolved = _resolve(rel)
            if resolved and resolved != pid:
                _add_edge(pid, resolved, "relacionado")

        for pre in (p["frontmatter"].get("prerrequisitos") or []):
            resolved = _resolve(pre)
            if resolved and resolved != pid:
                _add_edge(resolved, pid, "prerrequisito")

        ca = p["frontmatter"].get("concepto_asociado")
        if p["type"] == "pregunta" and isinstance(ca, str):
            resolved = _resolve(ca)
            if resolved and resolved != pid:
                _add_edge(pid, resolved, "pregunta_sobre")

    # Enriquecimiento para el tooltip del grafo: N preguntas asociadas y
    # prerrequisitos resueltos a {id, title} (no solo el slug crudo).
    for edge in edge_map.values():
        if edge["type"] == "pregunta_sobre" and edge["target"] in node_map:
            node_map[edge["target"]]["n_preguntas"] += 1
        elif edge["type"] == "prerrequisito" and edge["target"] in node_map and edge["source"] in node_map:
            node_map[edge["target"]]["prerequisites"].append(
                {"id": edge["source"], "title": node_map[edge["source"]]["label"]}
            )

    return {"nodes": list(node_map.values()), "edges": list(edge_map.values())}


# --- Plan de estudio ---

def build_plan(deck_id: str) -> dict:
    """Modulos ordenados topologicamente segun los prerrequisitos reales
    (a nivel de concepto, agregados al modulo dueno de cada concepto), con
    estado, retencion promedio y conteo de conceptos por modulo.

    El campo frontmatter "orden" de cada modulo (asignado por el LLM en la
    ingesta) es solo un criterio de desempate, no la fuente de verdad del
    orden — el orden real se deriva del grafo de prerrequisitos.
    """
    pages = get_all_pages(deck_id)
    modules = {p["page_id"]: p for p in pages if p["type"] == "modulo"}
    concepts = [p for p in pages if p["type"] == "concepto"]

    concepts_by_module: dict[str, list[dict]] = {mid: [] for mid in modules}
    for c in concepts:
        mid = c["frontmatter"].get("modulo")
        if mid in concepts_by_module:
            concepts_by_module[mid].append(c)

    concept_owner = {
        c["page_id"]: mid for mid, cs in concepts_by_module.items() for c in cs
    }

    # Aristas modulo->modulo agregadas desde prerrequisitos de concepto
    module_edges: set[tuple[str, str]] = set()
    for c in concepts:
        mid = c["frontmatter"].get("modulo")
        if mid not in modules:
            continue
        for pre in (c["frontmatter"].get("prerrequisitos") or []):
            if not isinstance(pre, str):
                continue
            owner = concept_owner.get(pre)
            if owner and owner != mid:
                module_edges.add((owner, mid))

    def _tiebreak(mid: str) -> tuple:
        m = modules[mid]
        orden = m["frontmatter"].get("orden", 0)
        return (orden if isinstance(orden, (int, float)) else 0, m["title"])

    in_degree = {mid: 0 for mid in modules}
    adj: dict[str, list[str]] = {mid: [] for mid in modules}
    prereq_of: dict[str, set[str]] = {mid: set() for mid in modules}
    for src, tgt in module_edges:
        adj[src].append(tgt)
        in_degree[tgt] += 1
        prereq_of[tgt].add(src)

    # Kahn's algorithm con desempate estable por "orden" y titulo
    remaining = dict(in_degree)
    queue = [mid for mid, d in remaining.items() if d == 0]
    ordered: list[str] = []
    while queue:
        queue.sort(key=_tiebreak)
        mid = queue.pop(0)
        ordered.append(mid)
        for nxt in adj[mid]:
            remaining[nxt] -= 1
            if remaining[nxt] == 0:
                queue.append(nxt)

    # Si hay un ciclo, los modulos restantes se anexan por desempate sin
    # bloquear el plan con un error duro.
    if len(ordered) < len(modules):
        leftover = sorted((mid for mid in modules if mid not in ordered), key=_tiebreak)
        ordered.extend(leftover)

    today = datetime.utcnow().strftime("%Y-%m-%d")

    def _estado(cs: list[dict], prereqs_done: bool) -> str:
        if not prereqs_done:
            return "bloqueado"
        if not cs:
            return "pendiente"
        estados = [c["estado_srs"] for c in cs]
        has_dominado = "dominado" in estados
        has_critico = "critico" in estados
        if has_dominado and has_critico:
            return "degradado"
        if all(e == "dominado" for e in estados):
            overdue = any(
                isinstance(c["frontmatter"].get("proximo_repaso"), str)
                and c["frontmatter"]["proximo_repaso"] < today
                for c in cs
            )
            return "repaso_pendiente" if overdue else "completado"
        if any(e != "bloqueado" for e in estados):
            return "en_progreso"
        return "pendiente"

    result_modules = []
    completed_set: set[str] = set()
    for mid in ordered:
        cs = concepts_by_module.get(mid, [])
        prereqs_done = prereq_of[mid].issubset(completed_set)
        estado = _estado(cs, prereqs_done)
        if estado in ("completado", "degradado", "repaso_pendiente"):
            completed_set.add(mid)
        retencion = sum(c["maestria"] for c in cs) / len(cs) if cs else 0.0
        m = modules[mid]
        result_modules.append({
            "id": mid,
            "title": m["title"],
            "estado": estado,
            "retencion_promedio": round(retencion, 2),
            "n_conceptos": len(cs),
        })

    edges = [{"source": s, "target": t} for s, t in module_edges]
    return {"modules": result_modules, "edges": edges}


# --- Stats ---

def get_notebook_stats(deck_id: str) -> dict:
    pages = get_all_pages(deck_id)
    concepts = [p for p in pages if p["type"] == "concepto"]
    avg = sum(c["maestria"] for c in concepts) / len(concepts) if concepts else 0
    estados: dict[str, int] = {}
    for c in concepts:
        e = c["estado_srs"]
        estados[e] = estados.get(e, 0) + 1

    return {
        "conceptCount": len(concepts),
        "entityCount": sum(1 for p in pages if p["type"] == "entidad"),
        "sourceCount": sum(1 for p in pages if p["type"] == "fuente"),
        "questionCount": sum(1 for p in pages if p["type"] == "pregunta"),
        "moduleCount": sum(1 for p in pages if p["type"] == "modulo"),
        "masteryAvg": round(avg * 100),
        "estadoCounts": estados,
        "totalNodes": len(pages),
    }
