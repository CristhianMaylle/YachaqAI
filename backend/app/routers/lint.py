from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.agents.lint import analyze_deck
from app.dependencies import get_supabase
from app.services.wiki_builder import notebook_exists

router = APIRouter()


# --- POST /lint/{deck_id}/analyze ---
@router.post("/{deck_id}/analyze")
async def analyze(deck_id: str):
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    report = await analyze_deck(deck_id)

    sb = get_supabase()
    sb.table("lint_reports").insert({"deck_id": deck_id, **report}).execute()

    return report


# --- GET /lint/{deck_id}/latest ---
@router.get("/{deck_id}/latest")
async def latest(deck_id: str):
    sb = get_supabase()
    result = (
        sb.table("lint_reports")
        .select("*")
        .eq("deck_id", deck_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return {
            "score": None, "status": "unknown", "issues": [], "created_at": None,
            "orphan_count": 0, "contradiction_count": 0, "missing_page_count": 0,
            "broken_ref_count": 0, "missing_quiz_count": 0,
        }
    return result.data[0]
