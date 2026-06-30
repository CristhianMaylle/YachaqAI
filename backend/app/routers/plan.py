from fastapi import APIRouter, HTTPException, Request

from app.services.plan_builder import customize_plan
from app.services.wiki_builder import build_plan, notebook_exists

router = APIRouter()


# --- GET /plan/{deck_id} ---
@router.get("/{deck_id}")
async def get_plan(deck_id: str):
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")
    return build_plan(deck_id)


# --- POST /plan/{deck_id}/customize ---
@router.post("/{deck_id}/customize")
async def customize(deck_id: str, request: Request):
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")
    body = await request.json()
    instruction = body.get("instruction", "")
    return await customize_plan(deck_id, instruction)
