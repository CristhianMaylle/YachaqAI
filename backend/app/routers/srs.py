from fastapi import APIRouter

router = APIRouter()


@router.post("/grade")
async def grade_response():
    # TODO: Sprint 3 - Calificar + FSRS
    return {"message": "No implementado aún (Sprint 3)"}


@router.get("/due")
async def get_due_concepts():
    # TODO: Sprint 3 - Conceptos con proximo_repaso <= hoy
    return {"message": "No implementado aún (Sprint 3)", "concepts": []}


@router.post("/generate-questions/{deck_id}/{concept_slug}")
async def generate_questions_on_demand(deck_id: str, concept_slug: str):
    """Sprint 3: Genera preguntas SRS bajo demanda para un concepto.

    Movido desde Sprint 1 (ingesta) para optimizar tokens.
    Las preguntas se generan la primera vez que el usuario inicia
    una sesion de estudio del modulo, no durante la ingesta del PDF.
    Se cachean en 4. preguntas/q-{slug}.md para reutilizar.
    """
    # TODO: Sprint 3 - Leer concepto .md, llamar gateway.generate() con
    # QUESTION_SYSTEM prompt, escribir resultado en 4. preguntas/
    return {"message": "No implementado aún (Sprint 3)"}
