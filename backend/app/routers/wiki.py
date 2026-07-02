from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.agents.llm_wiki import answer_query, archive_response
from app.dependencies import get_supabase
from app.schemas.wiki import (
    WikiArchiveRequest,
    WikiArchiveResponse,
    WikiQueryRequest,
    WikiQueryResponse,
)
from app.services.wiki_builder import invalidate_cache, notebook_exists

router = APIRouter()


# --- POST /wiki/query ---
@router.post("/query", response_model=WikiQueryResponse)
async def query_wiki(body: WikiQueryRequest):
    if not notebook_exists(body.deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    sb = get_supabase()

    history = [h.model_dump() for h in body.history]
    if not history:
        hist_result = (
            sb.table("wiki_chat_messages")
            .select("role,content")
            .eq("deck_id", body.deck_id)
            .order("created_at", desc=True)
            .limit(6)
            .execute()
        )
        history = list(reversed(hist_result.data or []))

    result = await answer_query(body.deck_id, body.question, history)

    sb.table("wiki_chat_messages").insert({
        "deck_id": body.deck_id,
        "role": "user",
        "content": body.question,
    }).execute()
    sb.table("wiki_chat_messages").insert({
        "deck_id": body.deck_id,
        "role": "assistant",
        "content": result["answer"],
        "sources_consulted": result["citations"],
        "nodes_visited": len(result["nodes_consulted"]),
    }).execute()

    return WikiQueryResponse(
        answer=result["answer"],
        citations=result["citations"],
        nodes_consulted=result["nodes_consulted"],
        can_archive=result["can_archive"],
    )


# --- POST /wiki/archive ---
@router.post("/archive", response_model=WikiArchiveResponse)
async def archive(body: WikiArchiveRequest):
    if not notebook_exists(body.deck_id):
        raise HTTPException(404, "Mazo no encontrado")

    result = await archive_response(
        body.deck_id, body.question, body.content, body.title, body.source_files,
    )
    invalidate_cache(body.deck_id)

    sb = get_supabase()
    (
        sb.table("wiki_chat_messages")
        .update({"archived_as": result["file"]})
        .eq("deck_id", body.deck_id)
        .eq("role", "assistant")
        .eq("content", body.content)
        .execute()
    )

    return WikiArchiveResponse(**result)
