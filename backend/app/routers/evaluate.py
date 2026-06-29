from fastapi import APIRouter

router = APIRouter()


@router.post("/")
async def evaluate_answer():
    # TODO: Sprint 3 - Agente Evaluador
    return {"message": "No implementado aún (Sprint 3)"}
