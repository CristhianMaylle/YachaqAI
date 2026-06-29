from pydantic import BaseModel


class GradeRequest(BaseModel):
    deck_id: str
    concept_slug: str
    grade: str  # excelente | bien | dificil | olvidado
    session_id: str | None = None


class GradeResponse(BaseModel):
    concept_slug: str
    estado: str
    maestria: float
    retentiva: float
    proximo_repaso: str
