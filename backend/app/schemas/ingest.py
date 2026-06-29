from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class IngestJobResponse(BaseModel):
    job_id: str
    status: str
    deck_id: str = ""


class ReviewItem(BaseModel):
    slug: str
    title: str
    type: str
    action: str
    accepted: bool = True
    summary: str = ""
    prerequisites: list[str] = []
    related: list[str] = []
    module: str | None = None
    conflict_detail: str | None = None


class ConfirmReviewRequest(BaseModel):
    items: list[ReviewItem]


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    stage: str | None = None
    concepts_found: int = 0
    entities_found: int = 0
    modules_found: int = 0
    error_message: str | None = None
    review_items: list[dict[str, Any]] | None = None
    review_status: str | None = None
