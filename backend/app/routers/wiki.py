from fastapi import APIRouter

router = APIRouter()


@router.post("/query")
async def query_wiki():
    # TODO: Sprint 4 - Agente LLM Wiki
    return {"message": "No implementado aún (Sprint 4)"}


@router.post("/archive")
async def archive_response():
    # TODO: Sprint 4 - Archivar respuesta
    return {"message": "No implementado aún (Sprint 4)"}
