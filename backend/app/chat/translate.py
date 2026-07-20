"""Kannada ⇄ English translation for the conversational interface (Block 1).

Strategy: the agent and tools reason in English (schema, SQL, tool routing are
English), so for a Kannada turn we translate the user's question KN→EN on the
way in and the final answer EN→KN on the way out. Uses ``deep-translator``'s
Google backend (no API key). Failures degrade gracefully to the original text.

``normalize_language`` accepts 'en'/'kn' (and a few aliases). ``detect`` offers
a cheap script-based guess so the UI can auto-switch when the user types in the
Kannada script without setting the toggle.
"""
from __future__ import annotations

from app.core.logging import get_logger

logger = get_logger("chat.translate")

_SUPPORTED = {"en": "en", "english": "en", "kn": "kn", "kannada": "kn"}


def normalize_language(lang: str | None) -> str:
    if not lang:
        return "en"
    return _SUPPORTED.get(lang.strip().lower(), "en")


def detect(text: str) -> str:
    """Return 'kn' if the text contains Kannada-script characters, else 'en'."""
    for ch in text:
        if "ಀ" <= ch <= "೿":  # Kannada Unicode block
            return "kn"
    return "en"


def _translate(text: str, source: str, target: str) -> str:
    if not text or source == target:
        return text
    try:
        from deep_translator import GoogleTranslator

        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception as exc:  # network / service errors → fall back to original
        logger.warning("translation %s->%s failed: %s", source, target, exc)
        return text


def to_english(text: str, language: str) -> str:
    """Translate an incoming user message into English if needed."""
    return _translate(text, "kn", "en") if normalize_language(language) == "kn" else text


def from_english(text: str, language: str) -> str:
    """Translate an English answer into the user's language if needed."""
    return _translate(text, "en", "kn") if normalize_language(language) == "kn" else text
