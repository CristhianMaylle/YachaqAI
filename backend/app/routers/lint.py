from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_lint():
    # TODO: Sprint 4 - Agente LINT
    return {"message": "No implementado aún (Sprint 4)"}
