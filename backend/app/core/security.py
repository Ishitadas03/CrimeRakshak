"""Low-level security primitives: password hashing and JWT encode/decode.

Kept deliberately free of database or FastAPI imports so it can be unit-tested
in isolation and reused by scripts (e.g. seeding an initial admin).
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# bcrypt has a hard 72-byte input limit; passlib handles truncation semantics.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token type markers embedded in the JWT ``type`` claim.
ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


# ── Password hashing ──────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        # Malformed/unknown hash — treat as a non-match rather than raising.
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────
def _create_token(
    subject: str | int,
    token_type: str,
    expires_delta: timedelta,
    extra_claims: Optional[dict[str, Any]] = None,
) -> tuple[str, str, datetime]:
    """Encode a JWT.

    Returns ``(token, jti, expires_at)``. The ``jti`` (unique token id) lets the
    caller persist refresh tokens for rotation/revocation.
    """
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    jti = str(uuid4())
    claims: dict[str, Any] = {
        "sub": str(subject),
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "jti": jti,
    }
    if extra_claims:
        claims.update(extra_claims)
    token = jwt.encode(claims, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti, expire


def create_access_token(
    subject: str | int,
    extra_claims: Optional[dict[str, Any]] = None,
) -> tuple[str, datetime]:
    token, _jti, expire = _create_token(
        subject,
        ACCESS_TOKEN_TYPE,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims,
    )
    return token, expire


def create_refresh_token(subject: str | int) -> tuple[str, str, datetime]:
    """Return ``(token, jti, expires_at)`` for a refresh token."""
    return _create_token(
        subject,
        REFRESH_TOKEN_TYPE,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


def decode_token(token: str, expected_type: Optional[str] = None) -> dict[str, Any]:
    """Decode and validate a JWT. Raises ``JWTError`` on any failure."""
    payload = jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={"leeway": settings.JWT_LEEWAY_SECONDS},
    )
    if expected_type is not None and payload.get("type") != expected_type:
        raise JWTError(
            f"Invalid token type: expected '{expected_type}', "
            f"got '{payload.get('type')}'"
        )
    return payload
