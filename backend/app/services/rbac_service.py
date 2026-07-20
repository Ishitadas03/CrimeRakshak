"""Role & permission management logic (admin surface)."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.rbac import Permission, Role, User
from app.services.auth_service import AuthError


# ── Permissions ──────────────────────────────────────────────────────────────
def list_permissions(db: Session) -> list[Permission]:
    return list(db.scalars(select(Permission).order_by(Permission.code)).all())


def create_permission(
    db: Session, code: str, description: Optional[str] = None
) -> Permission:
    if db.scalar(select(Permission).where(Permission.code == code)):
        raise AuthError(f"permission '{code}' already exists", code="already_exists")
    perm = Permission(code=code, description=description)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


# ── Roles ────────────────────────────────────────────────────────────────────
def list_roles(db: Session) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.role_name)).all())


def get_role_by_name(db: Session, name: str) -> Optional[Role]:
    return db.scalar(select(Role).where(Role.role_name == name))


def _resolve_permissions(db: Session, codes: list[str]) -> list[Permission]:
    perms = db.scalars(select(Permission).where(Permission.code.in_(codes))).all()
    found = {p.code for p in perms}
    missing = set(codes) - found
    if missing:
        raise AuthError(
            f"unknown permission code(s): {', '.join(sorted(missing))}",
            code="unknown_permission",
        )
    return list(perms)


def create_role(
    db: Session,
    role_name: str,
    description: Optional[str] = None,
    permission_codes: Optional[list[str]] = None,
) -> Role:
    if get_role_by_name(db, role_name):
        raise AuthError(f"role '{role_name}' already exists", code="already_exists")
    role = Role(role_name=role_name, description=description)
    if permission_codes:
        role.permissions = _resolve_permissions(db, permission_codes)
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(
    db: Session,
    role_name: str,
    description: Optional[str] = None,
    permission_codes: Optional[list[str]] = None,
) -> Role:
    role = get_role_by_name(db, role_name)
    if role is None:
        raise AuthError(f"role '{role_name}' not found", code="not_found")
    if description is not None:
        role.description = description
    if permission_codes is not None:
        role.permissions = _resolve_permissions(db, permission_codes)
    db.commit()
    db.refresh(role)
    return role


# ── User ←→ role assignment ──────────────────────────────────────────────────
def assign_roles_to_user(db: Session, user: User, role_names: list[str]) -> User:
    roles = db.scalars(select(Role).where(Role.role_name.in_(role_names))).all()
    found = {r.role_name for r in roles}
    missing = set(role_names) - found
    if missing:
        raise AuthError(
            f"unknown role(s): {', '.join(sorted(missing))}", code="not_found"
        )
    user.roles = list(roles)
    user.role_id = roles[0].role_id if roles else None  # keep legacy FK in sync
    db.commit()
    db.refresh(user)
    return user
