"""Pydantic request/response models for the chat API."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User's natural-language question.")
    conversation_id: Optional[str] = Field(
        None, description="Omit to start a new conversation; pass to continue one."
    )
    language: Optional[str] = Field(
        "en", description="Response language: 'en' (English) or 'kn' (Kannada)."
    )


class TraceStep(BaseModel):
    """One tool execution in the agent's reasoning path (Block 9 explainability)."""

    step: int
    tool: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    sql: Optional[str] = None
    row_count: Optional[int] = None
    duration_ms: int = 0
    status: str = "ok"
    detail: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    language: str = "en"
    sources: List[str] = Field(default_factory=list, description="Grounding provenance (SQL/tools used).")
    tool_calls: int = 0
    trace: List[TraceStep] = Field(
        default_factory=list,
        description="Structured reasoning path: each tool call with arguments, SQL, rows and timing.",
    )
