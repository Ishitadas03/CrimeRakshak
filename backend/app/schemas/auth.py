"""Pydantic schemas for auth request/response payloads."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.config import settings


# ── Tokens ─────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class TokenPayload(BaseModel):
    """Decoded JWT claims used internally."""

    sub: Optional[str] = None
    type: Optional[str] = None
    jti: Optional[str] = None
    exp: Optional[int] = None


# ── Registration / login ────────────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=settings.PASSWORD_MIN_LENGTH, max_length=128)
    district_id: Optional[int] = None

    @field_validator("username")
    @classmethod
    def _username_alnum(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned.replace("_", "").replace("-", "").replace(".", "").isalnum():
            raise ValueError(
                "username may only contain letters, digits, '.', '_' and '-'"
            )
        return cleaned

    @field_validator("password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("password must contain at least one letter")
        return v


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=settings.PASSWORD_MIN_LENGTH, max_length=128)

    @field_validator("new_password")
    @classmethod
    def _password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v) or not any(c.isalpha() for c in v):
            raise ValueError("password must contain at least one letter and one digit")
        return v


# ── Read models ──────────────────────────────────────────────────────────────
class PermissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    permission_id: int
    code: str
    description: Optional[str] = None


class RoleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_id: int
    role_name: str
    description: Optional[str] = None
    permissions: list[PermissionRead] = []


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    username: str
    email: EmailStr
    district_id: Optional[int] = None
    is_active: bool
    is_superuser: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None
    roles: list[RoleRead] = []


class MessageResponse(BaseModel):
    detail: str
