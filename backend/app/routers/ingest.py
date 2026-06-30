from __future__ import annotations

from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile

from app.agents.ingesta import run_generation_after_review, run_ingesta_pipeline
from app.dependencies import get_supabase
from app.schemas.ingest import (
    ConfirmReviewRequest,
    IngestJobResponse,
    IngestStatusResponse,
)
from app.services.wiki_builder import (
    notebook_exists, touch_deck, upload_pdf, _slugify,
    _download_text, WIKI_BUCKET,
)

router = APIRouter()


@router.post("/process", response_model=IngestJobResponse)
async def process_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    deck_id: str = Form(...),
    deck_name: str = Form(""),  # ya no se usa: el deck debe existir previamente
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF")

    if deck_id == "new" or not notebook_exists(deck_id):
        raise HTTPException(
            status_code=400,
            detail="Primero crea un mazo antes de subir material.",
        )

    content = await file.read()
    if len(content) > 100 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede 100MB")

    job_id = str(uuid4())
    supabase = get_supabase()
    filename = file.filename or "document.pdf"
    safe_filename = _slugify(filename.removesuffix(".pdf")) + ".pdf"

    touch_deck(deck_id)

    storage_path = f"{deck_id}/{safe_filename}"

    supabase.table("ingest_jobs").insert({
        "id": job_id,
        "deck_id": deck_id,
        "source_type": "pdf",
        "source_name": filename,
        "storage_path": storage_path,
        "status": "pending",
        "progress": 0,
        "review_status": "pending",
    }).execute()

    upload_pdf(deck_id, safe_filename, content)

    background_tasks.add_task(
        run_ingesta_pipeline,
        job_id=job_id,
        deck_id=deck_id,
        pdf_content=content,
        source_name=filename,
    )

    return IngestJobResponse(job_id=job_id, status="pending", deck_id=deck_id)


@router.get("/status/{job_id}", response_model=IngestStatusResponse)
async def get_status(job_id: str):
    supabase = get_supabase()
    result = supabase.table("ingest_jobs").select("*").eq("id", job_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job no encontrado")

    data = result.data
    return IngestStatusResponse(
        job_id=data["id"],
        status=data["status"],
        progress=data["progress"],
        stage=data.get("stage"),
        concepts_found=data.get("concepts_found", 0),
        entities_found=data.get("entities_found", 0),
        modules_found=data.get("modules_found", 0),
        error_message=data.get("error_message"),
        review_items=data.get("review_items"),
        review_status=data.get("review_status"),
        source_summary=data.get("source_summary"),
    )


@router.post("/{job_id}/confirm-review")
async def confirm_review(
    job_id: str,
    body: ConfirmReviewRequest,
    background_tasks: BackgroundTasks,
):
    supabase = get_supabase()
    result = supabase.table("ingest_jobs").select("*").eq("id", job_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job no encontrado")

    data = result.data
    if data.get("review_status") != "analysis_done":
        raise HTTPException(status_code=400, detail="El job no esta en estado de revision")

    approved = [item.model_dump() for item in body.items if item.accepted]

    supabase.table("ingest_jobs").update({
        "review_items": [item.model_dump() for item in body.items],
        "review_status": "reviewed",
        "status": "reviewed",
    }).eq("id", job_id).execute()

    deck_id = data["deck_id"]
    source_name = data["source_name"]

    raw_text = _download_text(WIKI_BUCKET, f"{deck_id}/.yachaq/extracted_{job_id}.txt")
    if not raw_text:
        raise HTTPException(status_code=400, detail="Texto extraido no encontrado. Sube el PDF de nuevo.")

    background_tasks.add_task(
        run_generation_after_review,
        job_id=job_id,
        deck_id=deck_id,
        approved_items=approved,
        raw_text=raw_text,
        source_name=source_name,
        source_summary=data.get("source_summary") or "",
    )

    return {"status": "generating", "approved_count": len(approved)}
