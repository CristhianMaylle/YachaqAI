"""Metricas y estadisticas de progreso por mazo (P6.1 / P6.2).

Escopado por deck_id (no por usuario) porque la autenticacion todavia no
existe (llega en Sprint 5) — ver ARQUITECTURA_MVP.md seccion 10.1. Cuando
se active el JWT, estos endpoints deben ademas filtrar por
decks.user_id = auth.uid() antes de agregar.
"""
from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException

from app.dependencies import get_supabase
from app.services.wiki_builder import get_all_pages, get_notebook_stats, notebook_exists

router = APIRouter()

WEEKDAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
WEEKDAY_LABELS_FULL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]


def _parse_dt(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


# --- GET /dashboard/{deck_id}/metrics ---
@router.get("/{deck_id}/metrics")
async def get_metrics(deck_id: str):
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    sb = get_supabase()
    stats = get_notebook_stats(deck_id)

    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())

    sessions_result = (
        sb.table("study_sessions")
        .select("started_at,duration_seconds")
        .eq("deck_id", deck_id)
        .not_.is_("completed_at", "null")
        .gte("started_at", week_start.isoformat())
        .execute()
    )
    sessions = sessions_result.data or []

    minutes_by_day = {i: 0 for i in range(7)}
    for s in sessions:
        dt = _parse_dt(s.get("started_at"))
        if not dt:
            continue
        idx = (dt.date() - week_start).days
        if 0 <= idx < 7:
            minutes_by_day[idx] += round((s.get("duration_seconds") or 0) / 60)

    tiempo_semana = [{"day": WEEKDAY_LABELS[i], "minutes": minutes_by_day[i]} for i in range(7)]

    srs_result = (
        sb.table("srs_states")
        .select("proximo_repaso,retentiva,estado")
        .eq("deck_id", deck_id)
        .execute()
    )
    srs_rows = srs_result.data or []
    retencion_avg = (
        round(sum(r.get("retentiva") or 0 for r in srs_rows) / len(srs_rows) * 100)
        if srs_rows else 0
    )

    today_str = today.isoformat()
    week_end_str = (today + timedelta(days=7)).isoformat()
    due_today = [r for r in srs_rows if r.get("proximo_repaso") and r["proximo_repaso"] <= today_str]
    due_week = [
        r for r in srs_rows
        if r.get("proximo_repaso") and today_str <= r["proximo_repaso"] <= week_end_str
    ]

    upcoming = sorted(
        r["proximo_repaso"] for r in srs_rows
        if r.get("proximo_repaso") and r["proximo_repaso"] > today_str
    )
    proxima_revision = upcoming[0] if upcoming else None

    # Racha: dias consecutivos con >=1 sesion completada, contando hacia atras desde hoy
    all_sessions_result = (
        sb.table("study_sessions")
        .select("started_at")
        .eq("deck_id", deck_id)
        .not_.is_("completed_at", "null")
        .execute()
    )
    session_dates = set()
    for s in all_sessions_result.data or []:
        dt = _parse_dt(s.get("started_at"))
        if dt:
            session_dates.add(dt.date())

    streak = 0
    cursor = today if today in session_dates else today - timedelta(days=1)
    while cursor in session_dates:
        streak += 1
        cursor -= timedelta(days=1)

    return {
        "mastery_avg": stats["masteryAvg"],
        "estado_counts": stats["estadoCounts"],
        "concept_count": stats["conceptCount"],
        "tiempo_semana": tiempo_semana,
        "retencion_30d": retencion_avg,
        "due_today_count": len(due_today),
        "due_week_count": len(due_week),
        "proxima_revision": proxima_revision,
        "streak_days": streak,
        "studied_today": today in session_dates,
    }


# --- GET /dashboard/{deck_id}/stats ---
@router.get("/{deck_id}/stats")
async def get_stats(deck_id: str):
    if not notebook_exists(deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    sb = get_supabase()

    srs_result = sb.table("srs_states").select("*").eq("deck_id", deck_id).execute()
    srs_rows = srs_result.data or []

    # Curva de retencion: "real" = promedio de la formula FSRS de retrievability
    # segun la estabilidad actual de cada concepto; "Ebbinghaus" = curva teorica
    # de decaimiento exponencial simple (sin repeticion espaciada), como referencia.
    curve = []
    for day in range(0, 31, 3):
        if srs_rows:
            real_vals = [
                (1 + day / (9 * max(r.get("estabilidad") or 1.0, 0.1))) ** -1
                for r in srs_rows
            ]
            real_avg = round(sum(real_vals) / len(real_vals) * 100, 1)
        else:
            real_avg = 0
        ebbinghaus = round(100 * math.exp(-day / 1.5), 1)
        curve.append({"day": day, "real": real_avg, "ebbinghaus": ebbinghaus})

    pages = get_all_pages(deck_id)
    concept_pages = {p["page_id"]: p for p in pages if p["type"] == "concepto"}
    concept_table = []
    for r in srs_rows:
        p = concept_pages.get(r["concept_slug"])
        if not p:
            continue
        concept_table.append({
            "concept": p["title"],
            "module": p["frontmatter"].get("modulo", ""),
            "retentiva": round((r.get("retentiva") or 0) * 100),
            "estabilidad": round(r.get("estabilidad") or 0, 1),
            "dificultad": round(r.get("dificultad") or 0, 1),
            "proximo_repaso": r.get("proximo_repaso"),
        })
    concept_table.sort(key=lambda x: x["dificultad"], reverse=True)

    year_ago = (datetime.now(timezone.utc).date() - timedelta(days=365)).isoformat()
    sessions_result = (
        sb.table("study_sessions")
        .select("started_at,duration_seconds,retentiva_avg")
        .eq("deck_id", deck_id)
        .not_.is_("completed_at", "null")
        .gte("started_at", year_ago)
        .execute()
    )
    sessions = sessions_result.data or []

    heatmap: dict[str, int] = {}
    weekday_retentiva: dict[int, list[float]] = {i: [] for i in range(7)}
    for s in sessions:
        dt = _parse_dt(s.get("started_at"))
        if not dt:
            continue
        d_str = dt.date().isoformat()
        mins = round((s.get("duration_seconds") or 0) / 60)
        heatmap[d_str] = heatmap.get(d_str, 0) + mins
        if s.get("retentiva_avg") is not None:
            weekday_retentiva[dt.weekday()].append(s["retentiva_avg"])

    best_day = None
    best_avg = -1.0
    for i, vals in weekday_retentiva.items():
        if vals:
            avg = sum(vals) / len(vals)
            if avg > best_avg:
                best_avg = avg
                best_day = WEEKDAY_LABELS_FULL[i]

    total_count = sb.table("study_sessions").select("id", count="exact").eq("deck_id", deck_id).execute().count or 0
    completed_count = (
        sb.table("study_sessions").select("id", count="exact")
        .eq("deck_id", deck_id).not_.is_("completed_at", "null").execute().count or 0
    )

    patterns = []
    if best_day:
        patterns.append(f"Tu mejor retencion es los dias {best_day} ({round(best_avg * 100)}%).")
    if total_count:
        patterns.append(f"Tasa de finalizacion de sesiones: {round(completed_count / total_count * 100)}%.")
    critical = sum(1 for r in srs_rows if r.get("estado") == "critico")
    if critical:
        patterns.append(f"Tienes {critical} concepto(s) en estado critico que requieren repaso urgente.")

    return {
        "retention_curve": curve,
        "concept_table": concept_table,
        "heatmap": [{"date": d, "minutes": m} for d, m in sorted(heatmap.items())],
        "patterns": patterns,
        "schedule_efficacy": {"planned": total_count, "completed": completed_count},
    }
