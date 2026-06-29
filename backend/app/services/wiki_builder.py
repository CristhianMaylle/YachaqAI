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
    sb = get_supabase()
    data = content.encode("utf-8")
    try:
        sb.storage.from_(bucket).remove([storage_path])
    except Exception:
        pass
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

    for p in pages:
        t = p["type"]
        group = (
            p["frontmatter"].get("modulo", "general") if t == "concepto"
            else {"entidad": "Entidades", "fuente": "Fuentes", "modulo": "Módulos", "pregunta": "SRS"}.get(t, "general")
        )
        node_map[p["page_id"]] = {
            "id": p["page_id"], "label": p["title"], "type": t, "group": group,
            "maestria": p["maestria"], "estado_srs": p["estado_srs"], "file": p["file"],
            "summary": p["frontmatter"].get("resumen", ""),
            "module": p["frontmatter"].get("modulo"),
            "category": group,
        }

    edge_map: dict[str, dict] = {}

    def _add_edge(src: str, tgt: str, etype: str):
        key = "--".join(sorted([src, tgt]))
        if etype == "prerrequisito":
            key = f"{tgt}--{src}"
        if key not in edge_map:
            edge_map[key] = {"source": src, "target": tgt, "type": etype}

    for p in pages:
        for link in extract_wikilinks(p["content"]):
            tp = next((pg for pg in pages if pg["file"] == link or pg["file"].endswith("/" + link)), None)
            if tp and tp["page_id"] != p["page_id"]:
                _add_edge(p["page_id"], tp["page_id"], "relacionado")

        for rel in (p["frontmatter"].get("relacionados") or []):
            tp = next((pg for pg in pages if pg["file"] == rel or pg["file"].endswith("/" + rel)), None)
            if tp and tp["page_id"] != p["page_id"]:
                _add_edge(p["page_id"], tp["page_id"], "relacionado")

        for pre in (p["frontmatter"].get("prerrequisitos") or []):
            tp = next((pg for pg in pages if pg["file"] == pre or pg["file"].endswith("/" + pre)), None)
            if tp and tp["page_id"] != p["page_id"]:
                _add_edge(tp["page_id"], p["page_id"], "prerrequisito")

        ca = p["frontmatter"].get("concepto_asociado")
        if p["type"] == "pregunta" and isinstance(ca, str):
            tp = next((pg for pg in pages if pg["file"] == ca or pg["file"].endswith("/" + ca) or pg["file"].endswith("/" + ca + ".md")), None)
            if tp and tp["page_id"] != p["page_id"]:
                _add_edge(p["page_id"], tp["page_id"], "pregunta_sobre")

    return {"nodes": list(node_map.values()), "edges": list(edge_map.values())}


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
