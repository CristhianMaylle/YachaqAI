"""Wrapper sobre py-fsrs para el scheduling de repeticion espaciada.

Los routers nunca tocan el paquete `fsrs` directamente — pasan por aqui
para mapear la escala de calificacion de YachaqAI (excelente/bien/dificil/
olvidado) al `Rating` de FSRS, y para traducir entre el objeto `Card` y las
columnas de la tabla `srs_states`.

`fsrs_card_json` guarda el `Card.to_dict()` completo (state, step, card_id)
para reconstruirlo sin perdida en cada repaso; las columnas con nombre
(estabilidad, dificultad, etc.) son una vista denormalizada/queryable
derivada de ese JSON.
"""
from __future__ import annotations

from datetime import datetime, timezone

from fsrs import Card, Rating, ReviewLog, Scheduler

from app.dependencies import get_supabase

GRADE_TO_RATING: dict[str, Rating] = {
    "excelente": Rating.Easy,
    "bien": Rating.Good,
    "dificil": Rating.Hard,
    "olvidado": Rating.Again,
}

# Categoria semaforo (estado_srs) por calificacion — coincide con el
# comportamiento previo de grade_srs. proximo_repaso/estabilidad/dificultad
# ahora los calcula FSRS en vez de estar hardcodeados.
GRADE_TO_ESTADO: dict[str, str] = {
    "excelente": "dominado",
    "bien": "dominado",
    "dificil": "en_practica",
    "olvidado": "critico",
}

# maestria es un snapshot de confianza por calificacion (para barras/colores
# en la UI), no la retrievability de FSRS — esa siempre vuelve a ~1.0 justo
# despues de cualquier repaso (incluido "olvidado", porque acabas de ver la
# respuesta correcta), asi que no sirve para diferenciar que tan bien sabes
# el concepto. retentiva si usa FSRS y decae con el tiempo (ver
# current_retrievability), por eso prioriza la cola de /srs/due.
GRADE_TO_MAESTRIA: dict[str, float] = {
    "excelente": 0.95,
    "bien": 0.85,
    "dificil": 0.70,
    "olvidado": 0.35,
}

_scheduler = Scheduler()


def load_card(srs_state_row: dict | None) -> Card:
    """Reconstruye el Card desde la fila de srs_states, o crea uno nuevo
    si el concepto nunca se ha repasado."""
    if srs_state_row and srs_state_row.get("fsrs_card_json"):
        return Card.from_dict(srs_state_row["fsrs_card_json"])
    return Card()


def review(card: Card, grade: str) -> tuple[Card, ReviewLog]:
    """Aplica una calificacion al Card y devuelve el Card actualizado."""
    rating = GRADE_TO_RATING.get(grade, Rating.Again)
    return _scheduler.review_card(card, rating, review_datetime=None, review_duration=None)


def card_to_srs_row(card: Card, grade: str, veces_olvidado: int) -> dict:
    """Mapea un Card (post-review) a las columnas de srs_states."""
    estado = GRADE_TO_ESTADO.get(grade, "critico")
    return {
        "estado": estado,
        "maestria": GRADE_TO_MAESTRIA.get(grade, 0.35),
        "retentiva": round(card.get_retrievability(), 4),
        "estabilidad": card.stability,
        "dificultad": card.difficulty,
        "ultimo_repaso": card.last_review.date().isoformat() if card.last_review else None,
        "proximo_repaso": card.due.date().isoformat() if card.due else None,
        "veces_olvidado": veces_olvidado,
        "fsrs_card_json": card.to_dict(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def current_retrievability(srs_state_row: dict) -> float:
    """Retentiva real AHORA (decaida desde el ultimo repaso), para priorizar
    la cola de /srs/due — distinta de la retentiva guardada en la fila, que
    quedo congelada al momento del ultimo repaso (~1.0 justo despues)."""
    if not srs_state_row.get("fsrs_card_json"):
        return srs_state_row.get("retentiva", 0.0)
    card = Card.from_dict(srs_state_row["fsrs_card_json"])
    return card.get_retrievability()


# --- Acceso a la tabla srs_states (sin ORM, mismo patron que el resto del backend) ---

def get_srs_state(deck_id: str, concept_slug: str) -> dict | None:
    sb = get_supabase()
    result = (
        sb.table("srs_states")
        .select("*")
        .eq("deck_id", deck_id)
        .eq("concept_slug", concept_slug)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def upsert_srs_state(deck_id: str, concept_slug: str, fields: dict) -> None:
    sb = get_supabase()
    existing = get_srs_state(deck_id, concept_slug)
    if existing:
        sb.table("srs_states").update(fields).eq("id", existing["id"]).execute()
    else:
        sb.table("srs_states").insert({
            "deck_id": deck_id, "concept_slug": concept_slug, **fields,
        }).execute()
