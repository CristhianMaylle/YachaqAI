from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

import yaml
from fastapi import APIRouter, HTTPException, Request

from app.dependencies import get_supabase
from app.services.fsrs_engine import (
    card_to_srs_row,
    get_srs_state,
    load_card,
    review,
    upsert_srs_state,
    current_retrievability,
)
from app.services.srs_propagation import propagate_forgotten
from app.services.wiki_builder import get_all_pages, parse_frontmatter, save_page, notebook_exists

router = APIRouter()


# --- GET /srs/due ---

@router.get("/due")
async def get_due_concepts(deck_id: str):
    """Cola de repasos vencidos para el mazo, max 20, priorizados por
    menor retrievability (mas olvidados primero). Si hay conceptos con
    ausencia > 30 dias, marca la sesion como de rehabilitacion."""
    if not deck_id:
        raise HTTPException(400, "Se requiere deck_id")

    today = datetime.now(timezone.utc).date().isoformat()
    sb = get_supabase()

    result = (
        sb.table("srs_states")
        .select("*")
        .eq("deck_id", deck_id)
        .lte("proximo_repaso", today)
        .execute()
    )
    rows = result.data or []
    if not rows:
        return {"deck_id": deck_id, "due_count": 0, "rehabilitation_session": False, "concepts": []}

    # Ordenar por retrievability actual (mas baja = mas urgente)
    rows_scored = [(row, current_retrievability(row)) for row in rows]
    rows_scored.sort(key=lambda x: (x[1], x[0]["proximo_repaso"] or ""))
    top20 = rows_scored[:20]

    # Ausencia > 30 dias: cualquier repaso vencido por mas de un mes
    from datetime import date, timedelta
    thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
    rehabilitation = any(
        row["proximo_repaso"] and row["proximo_repaso"] < thirty_days_ago
        for row, _ in top20
    )

    return {
        "deck_id": deck_id,
        "due_count": len(rows),
        "rehabilitation_session": rehabilitation,
        "concepts": [
            {
                "concept_slug": row["concept_slug"],
                "estado": row["estado"],
                "proximo_repaso": row["proximo_repaso"],
                "current_retrievability": round(score, 4),
                "veces_olvidado": row.get("veces_olvidado", 0),
            }
            for row, score in top20
        ],
    }


# --- POST /srs/response ---

VALID_GRADES = {"excelente", "bien", "dificil", "olvidado"}


@router.post("/response")
async def submit_response(request: Request):
    """Registra la calificacion final de una pregunta y actualiza el estado
    FSRS del concepto asociado.

    Para tipos 1-3 (completar/relacionar/diagrama) la calificacion la
    determina el cliente (auto-calificacion tras ver el resultado). Para
    tipo 4 (desarrollo) el cliente ya llamo a POST /evaluate/ para obtener
    la sugerencia de IA y decide su calificacion aqui.

    Dual-write:
    - srs_states (Postgres): fuente de verdad para scheduling FSRS
    - Frontmatter del .md en Storage: sincronizado para que build_graph/
      build_plan (Sprint 2) reflejen el estado actualizado sin cambios.
    """
    body = await request.json()
    session_id: str = body.get("session_id", "")
    deck_id: str = body.get("deck_id", "")
    concept_slug: str = body.get("concept_slug", "")
    question_file: str = body.get("question_file", "")
    question_type: str = body.get("question_type", "")
    user_answer: str = body.get("user_answer", "")
    grade: str = body.get("grade", "")
    ai_evaluation = body.get("ai_evaluation", None)

    if not deck_id or not concept_slug or grade not in VALID_GRADES:
        raise HTTPException(400, "Se requieren deck_id, concept_slug y grade valido")
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    # FSRS: cargar Card existente o crear uno nuevo
    srs_row = get_srs_state(deck_id, concept_slug)
    card = load_card(srs_row)
    veces_olvidado = (srs_row.get("veces_olvidado", 0) if srs_row else 0)
    if grade == "olvidado":
        veces_olvidado += 1

    card, _ = review(card, grade)
    fields = card_to_srs_row(card, grade, veces_olvidado)
    upsert_srs_state(deck_id, concept_slug, fields)

    # Sincronizar frontmatter del concepto (para que grafo/plan de Sprint 2 vean el cambio)
    pages = get_all_pages(deck_id)
    concept_page = next((p for p in pages if p["page_id"] == concept_slug), None)
    if concept_page:
        fm, page_body = parse_frontmatter(concept_page["content"])
        fm["estado_srs"] = fields["estado"]
        fm["maestria"] = fields["maestria"]
        fm["proximo_repaso"] = fields["proximo_repaso"]
        fm["ultimo_repaso"] = fields["ultimo_repaso"]
        yaml_text = yaml.dump(fm, allow_unicode=True, default_flow_style=False).strip()
        save_page(deck_id, concept_page["file"], f"---\n{yaml_text}\n---\n\n{page_body}")

    # Propagacion de incertidumbre si el concepto fue olvidado
    propagated: list[str] = []
    if grade == "olvidado":
        propagated = propagate_forgotten(deck_id, concept_slug)

    # Registrar la respuesta en srs_responses
    sb = get_supabase()
    sb.table("srs_responses").insert({
        "id": str(uuid4()),
        "session_id": session_id or None,
        "deck_id": deck_id,
        "concept_slug": concept_slug,
        "question_file": question_file,
        "question_type": question_type,
        "user_answer": user_answer,
        "grade": grade,
        "ai_evaluation": ai_evaluation,
        "ai_suggested_grade": ai_evaluation.get("calificacion_sugerida") if ai_evaluation else None,
    }).execute()

    # Actualizar retentiva promedio de la sesion si hay session_id
    if session_id:
        sb.table("study_sessions").update({
            "concepts_evaluated": (
                sb.table("srs_responses")
                .select("*", count="exact")
                .eq("session_id", session_id)
                .execute()
                .count or 1
            ),
        }).eq("id", session_id).execute()

    return {
        "success": True,
        "concept_slug": concept_slug,
        "grade": grade,
        "new_estado": fields["estado"],
        "new_maestria": fields["maestria"],
        "new_retentiva": fields["retentiva"],
        "next_review_date": fields["proximo_repaso"],
        "propagated_concepts": propagated,
    }
