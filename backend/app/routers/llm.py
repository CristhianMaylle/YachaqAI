from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.llm_gateway import gateway

router = APIRouter()


class SelectModelRequest(BaseModel):
    provider: str
    model: str


@router.get("/providers")
async def get_providers():
    return gateway.get_available_providers()


@router.get("/active")
async def get_active():
    return gateway.get_active()


@router.put("/select")
async def select_model(body: SelectModelRequest):
    try:
        return gateway.select(body.provider, body.model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
