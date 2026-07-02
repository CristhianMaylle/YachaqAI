from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request

from app.agents.generador_preguntas import (
    generate_questions_for_module,
    question_file_path,
)
from app.dependencies import get_supabase
from app.services.fsrs_engine import current_retrievability, get_srs_state
from app.services.question_parser import parse_questions_md
from app.services.wiki_builder import (
    _download_text,
    _get_markdown_files_cached,
    WIKI_BUCKET,
    get_all_pages,
    invalidate_cache,
    notebook_exists,
)

router = APIRouter()


def _module_concepts(deck_id: str, module_slug: str) -> list[dict]:
    pages = get_all_pages(deck_id)
    return [p for p in pages if p["type"] == "concepto" and p["frontmatter"].get("modulo") == module_slug]


def _pending_reviews(deck_id: str) -> list[dict]:
    today = datetime.now(timezone.utc).date().isoformat()
    sb = get_supabase()
    result = (
        sb.table("srs_states")
        .select("concept_slug,proximo_repaso,estado")
        .eq("deck_id", deck_id)
        .lte("proximo_repaso", today)
        .execute()
    )
    return result.data or []


# --- POST /sessions/start ---

@router.post("/start")
async def start_session(request: Request):
    body = await request.json()
    deck_id: str = body.get("deck_id", "")
    module_slug: str = body.get("module_slug", "")
    session_type: str = body.get("session_type", "nuevo")

    if not deck_id or not module_slug:
        raise HTTPException(400, "Se requieren deck_id y module_slug")
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    concepts = _module_concepts(deck_id, module_slug)
    if not concepts:
        raise HTTPException(404, "Modulo no encontrado o sin conceptos")

    pending = _pending_reviews(deck_id)

    await generate_questions_for_module(deck_id, module_slug)
    invalidate_cache(deck_id)

    n_concepts = len(concepts)
    n_questions = n_concepts * 4

    session_id = str(uuid4())
    sb = get_supabase()
    sb.table("study_sessions").insert({
        "id": session_id,
        "deck_id": deck_id,
        "module_slug": module_slug,
        "session_type": session_type,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {
        "session_id": session_id,
        "deck_id": deck_id,
        "module_slug": module_slug,
        "session_type": session_type,
        "n_concepts": n_concepts,
        "estimated_minutes": max(1, n_concepts * 3),
        "n_questions": n_questions,
        "pending_reviews": pending,
    }


# --- GET /sessions/{sessionId}/questions ---

@router.get("/{session_id}/questions")
async def get_session_questions(session_id: str):
    sb = get_supabase()
    row = sb.table("study_sessions").select("*").eq("id", session_id).single().execute()
    if not row.data:
        raise HTTPException(404, "Sesion no encontrada")

    session = row.data
    deck_id = session["deck_id"]
    module_slug = session["module_slug"]

    await generate_questions_for_module(deck_id, module_slug)
    invalidate_cache(deck_id)

    concepts = _module_concepts(deck_id, module_slug)
    files = _get_markdown_files_cached(deck_id)

    questions_by_concept: list[dict] = []
    for c in concepts:
        qpath = question_file_path(c["page_id"])
        if qpath not in files:
            continue
        raw = _download_text(WIKI_BUCKET, f"{deck_id}/{qpath}")
        if not raw:
            continue
        qs = parse_questions_md(raw, c["page_id"], c["title"], qpath)
        if qs:
            questions_by_concept.append({"concept_slug": c["page_id"], "concept_title": c["title"], "questions": qs})

    return {"session_id": session_id, "deck_id": deck_id, "module_slug": module_slug, "data": questions_by_concept}


# --- PUT /sessions/{sessionId}/complete ---

RETENTIVA_BY_GRADE = {"excelente": 1.0, "bien": 0.8, "dificil": 0.4, "olvidado": 0.0}


@router.put("/{session_id}/complete")
async def complete_session(session_id: str, request: Request):
    """Marca una sesion como completada con su duracion y retentiva
    promedio, para que el dashboard (Sprint 4) pueda calcular tiempo
    estudiado, racha y retencion real a partir de datos reales."""
    body = await request.json()
    duration_seconds: int = body.get("duration_seconds", 0)
    grades: list[str] = body.get("grades", [])

    retentiva_avg = (
        sum(RETENTIVA_BY_GRADE.get(g, 0.0) for g in grades) / len(grades)
        if grades else 0.0
    )

    sb = get_supabase()
    result = sb.table("study_sessions").update({
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "duration_seconds": duration_seconds,
        "retentiva_avg": round(retentiva_avg, 4),
        "concepts_evaluated": len(grades),
    }).eq("id", session_id).execute()

    if not result.data:
        raise HTTPException(404, "Sesion no encontrada")

    return {"success": True, "session_id": session_id, "retentiva_avg": round(retentiva_avg, 4)}
