from fastapi import APIRouter

router = APIRouter()


@router.post("/grade")
async def grade_response():
    # TODO: Sprint 3 - Calificar + FSRS
    return {"message": "No implementado aún (Sprint 3)"}
