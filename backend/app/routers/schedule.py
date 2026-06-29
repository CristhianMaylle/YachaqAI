from fastapi import APIRouter

router = APIRouter()


@router.post("/parse")
async def parse_schedule():
    # TODO: Sprint 5 - Parseo NL de disponibilidad
    return {"message": "No implementado aún (Sprint 5)"}
