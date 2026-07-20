"""OpenRouter LLM client (OpenAI-compatible).

A thin lazily-initialised wrapper around the OpenAI SDK pointed at OpenRouter.
Two logical roles share one client, selected by model id:
  * the *agent* model does tool-calling / SQL reasoning,
  * the *summary* model produces the final (optionally Kannada) prose.

The API key is read from settings (env only). A missing key raises a clear
error at call time rather than import time, so the rest of the app still boots.
"""
from __future__ import annotations

from functools import lru_cache

from openai import OpenAI

from app.core.config import settings


class LLMConfigError(RuntimeError):
    """Raised when the LLM is used without an API key configured."""


@lru_cache
def get_client() -> OpenAI:
    provider = (settings.LLM_PROVIDER or "gemini").lower()
    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise LLMConfigError("GEMINI_API_KEY is not set. Add it to backend/.env.")
        return OpenAI(
            base_url=settings.GEMINI_BASE_URL,
            api_key=settings.GEMINI_API_KEY,
        )
    # Default: OpenRouter.
    if not settings.OPENROUTER_API_KEY:
        raise LLMConfigError("OPENROUTER_API_KEY is not set. Add it to backend/.env.")
    return OpenAI(
        base_url=settings.OPENROUTER_BASE_URL,
        api_key=settings.OPENROUTER_API_KEY,
        default_headers={
            "HTTP-Referer": "https://crimerakshak.local",
            "X-Title": "CrimeRakshak",
        },
    )


def chat_completion(messages: list[dict], *, model: str | None = None,
                    tools: list[dict] | None = None,
                    tool_choice: str | None = None,
                    temperature: float = 0.1,
                    max_tokens: int | None = None):
    """Single chat-completion call. Returns the raw OpenAI response object."""
    client = get_client()
    kwargs: dict = {
        "model": model or settings.LLM_AGENT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens or settings.LLM_MAX_TOKENS,
    }
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = tool_choice or "auto"
    return client.chat.completions.create(**kwargs)
