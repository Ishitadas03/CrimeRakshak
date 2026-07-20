"""Schemas for admin/RBAC-management endpoints."""
from typing import Optional

from pydantic import BaseModel, Field


class RoleCreate(BaseModel):
    role_name: str = Field(min_length=2, max_length=50)
    description: Optional[str] = Field(default=None, max_length=255)
    permission_codes: list[str] = []


class RoleUpdate(BaseModel):
    description: Optional[str] = Field(default=None, max_length=255)
    permission_codes: Optional[list[str]] = None


class PermissionCreate(BaseModel):
    code: str = Field(min_length=2, max_length=100)
    description: Optional[str] = Field(default=None, max_length=255)


class RoleAssignment(BaseModel):
    role_names: list[str] = Field(min_length=1)


class AuditLogRead(BaseModel):
    log_id: int
    user_id: Optional[int]
    action: str
    resource: Optional[str]
    detail: Optional[str]
    status: Optional[str]
    ip_address: Optional[str]
    timestamp: object  # datetime; kept permissive to avoid tz coercion issues

    model_config = {"from_attributes": True}
