"""Notificaciones del usuario (repasos pendientes, degradaciones, racha).

Sin autenticacion todavia (Sprint 5), estas notificaciones se generan de
forma sintetica a partir del estado real del mazo en cada GET en vez de
depender de un cron/scheduler que no existe aun. Las notificaciones
persistidas en la tabla (ej. archivado desde LLM Wiki) se combinan con las
sinteticas y se ordenan por fecha.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.dependencies import get_supabase
from app.services.wiki_builder import notebook_exists

router = APIRouter()


async def _synthesize_notifications(deck_id: str) -> list[dict]:
    if not notebook_exists(deck_id):
        return []

    sb = get_supabase()
    today = datetime.now(timezone.utc).date().isoformat()
    now_iso = datetime.now(timezone.utc).isoformat()
    notifications: list[dict] = []

    due_result = (
        sb.table("srs_states").select("concept_slug", count="exact")
        .eq("deck_id", deck_id).lte("proximo_repaso", today).execute()
    )
    due_count = due_result.count or 0
    if due_count > 0:
        notifications.append({
            "id": f"synthetic-due-{deck_id}",
            "type": "repaso_pendiente",
            "title": f"{due_count} concepto(s) esperan tu repaso",
            "body": "Tienes conceptos vencidos para reforzar tu retencion.",
            "deck_id": deck_id,
            "action_url": f"/deck/{deck_id}/srs/due",
            "read": False,
            "created_at": now_iso,
        })

    critical_result = (
        sb.table("srs_states").select("concept_slug", count="exact")
        .eq("deck_id", deck_id).eq("estado", "critico").execute()
    )
    critical_count = critical_result.count or 0
    if critical_count >= 3:
        notifications.append({
            "id": f"synthetic-critical-{deck_id}",
            "type": "degradacion",
            "title": f"{critical_count} conceptos en estado critico",
            "body": "Varios conceptos necesitan atencion urgente.",
            "deck_id": deck_id,
            "action_url": f"/deck/{deck_id}/graph",
            "read": False,
            "created_at": now_iso,
        })

    sessions_today = (
        sb.table("study_sessions").select("id", count="exact")
        .eq("deck_id", deck_id).gte("started_at", today).execute()
    )
    is_afternoon = datetime.now(timezone.utc).hour >= 17
    if is_afternoon and (sessions_today.count or 0) == 0:
        notifications.append({
            "id": f"synthetic-streak-{deck_id}",
            "type": "racha_en_peligro",
            "title": "Estudia hoy para no perder tu racha",
            "body": "Aun no has completado ninguna sesion hoy.",
            "deck_id": deck_id,
            "action_url": f"/deck/{deck_id}/modules",
            "read": False,
            "created_at": now_iso,
        })

    return notifications


# --- GET /notifications ---
@router.get("/")
async def list_notifications(deck_id: str | None = None):
    sb = get_supabase()
    query = sb.table("notifications").select("*").order("created_at", desc=True).limit(30)
    if deck_id:
        query = query.eq("deck_id", deck_id)
    persisted = query.execute().data or []

    synthetic = await _synthesize_notifications(deck_id) if deck_id else []

    combined = synthetic + persisted
    return {
        "notifications": combined,
        "unread_count": sum(1 for n in combined if not n.get("read")),
    }


# --- PUT /notifications/{notification_id}/read ---
@router.put("/{notification_id}/read")
async def mark_read(notification_id: str):
    if notification_id.startswith("synthetic-"):
        return {"success": True}

    sb = get_supabase()
    result = sb.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    if not result.data:
        raise HTTPException(404, "Notificacion no encontrada")
    return {"success": True}
