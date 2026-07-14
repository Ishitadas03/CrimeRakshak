"""Conversational chat API (Block 1) with Kannada support and PDF export.

``POST /chat``            — ask a question (English or Kannada), grounded answer.
``GET  /chat/{id}/pdf``   — download the conversation transcript as a local PDF.

Conversation memory is kept in-process per ``conversation_id``: the raw LLM
message history (for context-aware follow-ups) and a readable display transcript
(for PDF export). The endpoint requires an authenticated active user.
"""
from __future__ import annotations

import uuid
from collections import defaultdict

from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse

from app.chat.agent import run_agent
from app.chat.pdf import export_conversation
from app.chat.schemas import ChatRequest, ChatResponse
from app.chat.translate import from_english, normalize_language, to_english
from app.core.dependencies import get_current_active_user
from app.core.exceptions import AppHTTPException
from app.core.logging import get_logger
from app.models.rbac import User

logger = get_logger("chat.api")

router = APIRouter(prefix="/chat", tags=["chat"])

# In-memory stores keyed by conversation_id.
_CONVERSATIONS: dict[str, list[dict]] = defaultdict(list)   # raw LLM messages
_TRANSCRIPTS: dict[str, list[dict]] = defaultdict(list)     # readable turns
_HISTORY_WINDOW = 20


@router.post("", response_model=ChatResponse, summary="Ask the crime-intelligence assistant")
def chat(payload: ChatRequest, current_user: User = Depends(get_current_active_user)) -> ChatResponse:
    conversation_id = payload.conversation_id or str(uuid.uuid4())
    language = normalize_language(payload.language)

    # Kannada in → English for the agent; English answer → Kannada out.
    english_question = to_english(payload.message, language)
    history = _CONVERSATIONS[conversation_id][-_HISTORY_WINDOW:]

    logger.info("chat turn user=%s conv=%s lang=%s", current_user.username, conversation_id, language)
    turn = run_agent(english_question, history=history, language=language)

    answer = from_english(turn.answer, language)

    # Persist both the raw history (context) and the display transcript (PDF).
    _CONVERSATIONS[conversation_id].extend(turn.new_messages)
    _TRANSCRIPTS[conversation_id].append({"role": "user", "text": payload.message, "language": language})
    _TRANSCRIPTS[conversation_id].append(
        {"role": "assistant", "text": answer, "sources": turn.sources, "language": language}
    )

    return ChatResponse(
        conversation_id=conversation_id,
        answer=answer,
        language=language,
        sources=turn.sources,
        tool_calls=turn.tool_calls,
    )


@router.get("/{conversation_id}/pdf", summary="Download conversation history as PDF")
def export_pdf(conversation_id: str, current_user: User = Depends(get_current_active_user)) -> FileResponse:
    transcript = _TRANSCRIPTS.get(conversation_id)
    if not transcript:
        raise AppHTTPException(status_code=404, code="not_found",
                              detail=f"conversation '{conversation_id}' not found")
    path = export_conversation(conversation_id, transcript, username=current_user.username)
    return FileResponse(path, media_type="application/pdf", filename=path.name)
