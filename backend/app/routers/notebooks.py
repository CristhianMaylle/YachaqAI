"""Routers CRUD de notebooks — migrado desde app/api/notebooks de Next.js.

La mayoria de estos endpoints manejan datos del filesystem (.md) y NO
necesitan Supabase Postgres. La excepcion son las notas libres del usuario
("Mis Notas", Sprint 2), que viven en la tabla page_notes ya que no deben
mezclarse con el .md generado por el LLM.
"""
from fastapi import APIRouter, HTTPException, Query, Request

from app.dependencies import get_supabase
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
    # Rechazar paths con traversal para no escribir fuera del mazo en Storage
    clean = path.replace("\\", "/")
    if ".." in clean.split("/"):
        raise HTTPException(400, "Ruta de archivo invalida")
    body = await request.json()
    save_page(notebook_id, clean, body.get("content", ""))
    return {"success": True}


# --- GET /notebooks/{notebook_id}/notes/{page_id} ---
@router.get("/{notebook_id}/notes/{page_id}")
async def get_note(notebook_id: str, page_id: str):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    sb = get_supabase()
    result = (
        sb.table("page_notes")
        .select("content,updated_at")
        .eq("deck_id", notebook_id)
        .eq("page_id", page_id)
        .is_("user_id", "null")
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]
    return {"content": "", "updated_at": None}


# --- PUT /notebooks/{notebook_id}/notes/{page_id} ---
@router.put("/{notebook_id}/notes/{page_id}")
async def save_note(notebook_id: str, page_id: str, request: Request):
    if not notebook_exists(notebook_id):
        raise HTTPException(404, "Cuaderno no encontrado")
    body = await request.json()
    content = body.get("content", "")

    from datetime import datetime

    sb = get_supabase()
    existing = (
        sb.table("page_notes")
        .select("id")
        .eq("deck_id", notebook_id)
        .eq("page_id", page_id)
        .is_("user_id", "null")
        .limit(1)
        .execute()
    )
    now = datetime.utcnow().isoformat() + "Z"
    if existing.data:
        sb.table("page_notes").update(
            {"content": content, "updated_at": now}
        ).eq("id", existing.data[0]["id"]).execute()
    else:
        sb.table("page_notes").insert({
            "deck_id": notebook_id, "page_id": page_id, "content": content, "updated_at": now,
        }).execute()
    return {"success": True}
