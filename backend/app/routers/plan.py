from fastapi import APIRouter

router = APIRouter()


@router.post("/customize")
async def customize_plan():
    # TODO: Sprint 2 - Personalizar plan con NL
    return {"message": "No implementado aún (Sprint 2)"}
