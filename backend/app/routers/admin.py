"""Administrative RBAC-management endpoints (roles, permissions, assignments,
audit log inspection). Gated behind the ``admin`` role / ``rbac:manage``
permission. Superusers always pass.
"""
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_client_ip, require_permissions
from app.core.exceptions import ConflictError, NotFoundError
from app.models.rbac import AuditLog, User
from app.schemas.admin import (
    PermissionCreate,
    RoleAssignment,
    RoleCreate,
    RoleUpdate,
)
from app.schemas.auth import PermissionRead, RoleRead, UserRead
from app.services import audit, auth_service, rbac_service
from app.services.auth_service import AuthError

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    # Every admin route requires the rbac:manage permission.
    dependencies=[Depends(require_permissions("rbac:manage"))],
)


# ── Permissions ──────────────────────────────────────────────────────────────
@router.get("/permissions", response_model=list[PermissionRead])
def list_permissions(db: Session = Depends(get_db)):
    return rbac_service.list_permissions(db)


@router.post(
    "/permissions",
    response_model=PermissionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_permission(payload: PermissionCreate, db: Session = Depends(get_db)):
    try:
        return rbac_service.create_permission(db, payload.code, payload.description)
    except AuthError as exc:
        raise ConflictError(exc.message, code=exc.code)


# ── Roles ────────────────────────────────────────────────────────────────────
@router.get("/roles", response_model=list[RoleRead])
def list_roles(db: Session = Depends(get_db)):
    return rbac_service.list_roles(db)


@router.post("/roles", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    request: Request,
    current: User = Depends(require_permissions("rbac:manage")),
    db: Session = Depends(get_db),
):
    try:
        role = rbac_service.create_role(
            db, payload.role_name, payload.description, payload.permission_codes
        )
    except AuthError as exc:
        raise ConflictError(exc.message, code=exc.code)
    audit.record(
        db,
        action="rbac.role_create",
        user_id=current.user_id,
        resource=payload.role_name,
        ip_address=get_client_ip(request),
    )
    return role


@router.patch("/roles/{role_name}", response_model=RoleRead)
def update_role(
    role_name: str,
    payload: RoleUpdate,
    request: Request,
    current: User = Depends(require_permissions("rbac:manage")),
    db: Session = Depends(get_db),
):
    try:
        role = rbac_service.update_role(
            db, role_name, payload.description, payload.permission_codes
        )
    except AuthError as exc:
        raise NotFoundError(exc.message, code=exc.code)
    audit.record(
        db,
        action="rbac.role_update",
        user_id=current.user_id,
        resource=role_name,
        ip_address=get_client_ip(request),
    )
    return role


# ── User ←→ role assignment ──────────────────────────────────────────────────
@router.put("/users/{user_id}/roles", response_model=UserRead)
def assign_roles(
    user_id: int,
    payload: RoleAssignment,
    request: Request,
    current: User = Depends(require_permissions("rbac:manage")),
    db: Session = Depends(get_db),
):
    user = auth_service.get_user_by_id(db, user_id)
    if user is None:
        raise NotFoundError("user not found")
    try:
        user = rbac_service.assign_roles_to_user(db, user, payload.role_names)
    except AuthError as exc:
        raise NotFoundError(exc.message, code=exc.code)
    audit.record(
        db,
        action="rbac.assign_roles",
        user_id=current.user_id,
        resource=f"user:{user_id}",
        ip_address=get_client_ip(request),
        detail={"roles": payload.role_names},
    )
    return user


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return list(
        db.scalars(select(User).order_by(User.user_id).limit(limit).offset(offset)).all()
    )


# ── Audit log ────────────────────────────────────────────────────────────────
@router.get("/audit-logs")
def list_audit_logs(
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action: str | None = Query(None),
    user_id: int | None = Query(None),
):
    stmt = select(AuditLog).order_by(AuditLog.log_id.desc())
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if user_id is not None:
        stmt = stmt.where(AuditLog.user_id == user_id)
    rows = db.scalars(stmt.limit(limit).offset(offset)).all()
    return [
        {
            "log_id": r.log_id,
            "user_id": r.user_id,
            "action": r.action,
            "resource": r.resource,
            "detail": r.detail,
            "status": r.status,
            "ip_address": r.ip_address,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in rows
    ]
