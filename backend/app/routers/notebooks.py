"""Routers CRUD de notebooks — migrado desde app/api/notebooks de Next.js.

Estos endpoints manejan datos del filesystem (.md),
NO necesitan Supabase.
"""
from fastapi import APIRouter, HTTPException, Query, Request

from app.services.wiki_builder import (
    list_notebooks,
    notebook_exists,
    get_notebook_meta,
    get_notebook_stats,
    get_all_pages,
    create_notebook,
    register_deck,
    delete_notebook,
    build_graph,
    read_page,
    save_page,
    parse_frontmatter,
    _slugify,
)

router = APIRouter()


# --- GET /notebooks ---
@router.get("/")
async def list_all(include: str | None = None):
    notebooks = list_notebooks()
    if include == "stats":
        return {
            "notebooks": [{**nb, "stats": get_notebook_stats(nb["id"])} for nb in notebooks],
            "sessions": [],
        }
    return {"notebooks": notebooks, "sessions": []}


# --- POST /notebooks ---
@router.post("/")
async def create(request: Request):
    body = await request.json()
    name = (body.get("name") or "").strip()
    if len(name) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    slug = _slugify(name)
    if not slug:
        raise HTTPException(400, "Nombre invalido")
    if notebook_exists(slug):
        raise HTTPException(409, "Ya existe un mazo con ese nombre. Elige otro.")

    meta = create_notebook(name)
    register_deck(meta["id"], name)
    return meta


# --- GET /notebooks/{notebook_id} ---
@router.get("/{notebook_id}")
async def get_notebook(notebook_id: str, fields: str | None = None):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")

    meta = get_notebook_meta(notebook_id)

    if fields == "stats":
        return {"meta": meta, "stats": get_notebook_stats(notebook_id)}

    if fields == "pages":
        pages = get_all_pages(notebook_id)
        return {
            "meta": meta,
            "pages": [{
                "page_id": p["page_id"], "file": p["file"], "title": p["title"],
                "type": p["type"], "frontmatter": p["frontmatter"],
                "maestria": p["maestria"], "estado_srs": p["estado_srs"],
            } for p in pages],
        }

    stats = get_notebook_stats(notebook_id)
    pages = get_all_pages(notebook_id)
    return {"meta": meta, "stats": stats, "pages": pages}


# --- DELETE /notebooks/{notebook_id} ---
@router.delete("/{notebook_id}")
async def remove_notebook(notebook_id: str):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    delete_notebook(notebook_id)
    return {"success": True}


# --- GET /notebooks/{notebook_id}/graph ---
@router.get("/{notebook_id}/graph")
async def get_graph(notebook_id: str):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    return build_graph(notebook_id)


# --- GET /notebooks/{notebook_id}/wiki/{path} ---
@router.get("/{notebook_id}/wiki/{path:path}")
async def get_wiki_page(notebook_id: str, path: str):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    return read_page(notebook_id, path)


# --- POST /notebooks/{notebook_id}/wiki/{path} ---
@router.post("/{notebook_id}/wiki/{path:path}")
async def save_wiki_page(notebook_id: str, path: str, request: Request):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    body = await request.json()
    save_page(notebook_id, path, body.get("content", ""))
    return {"success": True}


# --- POST /notebooks/{notebook_id}/srs ---
@router.post("/{notebook_id}/srs")
async def grade_srs(notebook_id: str, request: Request):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")

    body = await request.json()
    concept_id = body.get("conceptId", "")
    grade = body.get("grade", "olvidado")

    pages = get_all_pages(notebook_id)
    concept = next(
        (p for p in pages if p["page_id"] == concept_id or p["page_id"] == f"concepto-{concept_id}"),
        None,
    )
    if not concept:
        raise HTTPException(404, "Concepto no encontrado")

    from datetime import datetime, timedelta
    import yaml

    now = datetime.utcnow()
    today = now.strftime("%Y-%m-%d")

    intervals = {"excelente": (21, "dominado", 0.95), "bien": (7, "dominado", 0.85),
                 "dificil": (3, "en_practica", 0.70), "olvidado": (1, "critico", 0.35)}
    days, estado, maestria = intervals.get(grade, (1, "critico", 0.35))
    next_review = (now + timedelta(days=days)).strftime("%Y-%m-%d")

    fm, body = parse_frontmatter(concept["content"])
    fm.update({"estado_srs": estado, "maestria": maestria, "ultimo_repaso": today,
               "proximo_repaso": next_review, "actualizado": today})
    yaml_text = yaml.dump(fm, allow_unicode=True, default_flow_style=False).strip()
    new_content = f"---\n{yaml_text}\n---\n\n{body}"
    save_page(notebook_id, concept["file"], new_content)

    return {
        "success": True, "conceptId": concept_id, "title": concept["title"],
        "newEstadoSrs": estado, "newMaestria": maestria, "nextReview": next_review,
    }


# --- POST /notebooks/{notebook_id}/ingest ---
@router.post("/{notebook_id}/ingest")
async def ingest_seed(notebook_id: str):
    """Placeholder: en el prototipo actual carga seed data hardcodeada."""
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    graph = build_graph(notebook_id)
    return {"success": True, "notebookId": notebook_id, "graph": graph}
