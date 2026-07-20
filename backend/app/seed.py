"""Idempotent seeding of baseline RBAC data + an initial superuser.

Run after applying migrations::

    cd backend
    python -m app.seed

The initial admin credentials come from the environment
(``FIRST_SUPERUSER_USERNAME`` / ``_EMAIL`` / ``_PASSWORD``); sensible defaults
are used for local development only.
"""
import os

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.core.security import hash_password
from app.models.rbac import Permission, Role, User

logger = get_logger("seed")

# ── Baseline catalog ─────────────────────────────────────────────────────────
PERMISSIONS: dict[str, str] = {
    "graph:read": "Read Graph Intelligence data",
    "graph:write": "Modify Graph Intelligence data",
    "financial:read": "Read Financial Crime data",
    "financial:write": "Modify Financial Crime data",
    "audit:read": "View audit logs",
    "users:read": "View user accounts",
    "rbac:manage": "Manage roles, permissions and assignments",
}

# role_name -> (description, [permission codes])
ROLES: dict[str, tuple[str, list[str]]] = {
    "admin": (
        "Full administrative access",
        list(PERMISSIONS.keys()),
    ),
    "analyst": (
        "Graph & financial analysis, read/write on data modules",
        ["graph:read", "graph:write", "financial:read", "financial:write", "audit:read"],
    ),
    "officer": (
        "Field officer with read access to intelligence modules",
        ["graph:read", "financial:read"],
    ),
    "viewer": (
        "Read-only access to graph intelligence",
        ["graph:read"],
    ),
}


def seed() -> None:
    db = SessionLocal()
    try:
        # Permissions
        perm_by_code: dict[str, Permission] = {}
        for code, desc in PERMISSIONS.items():
            perm = db.scalar(select(Permission).where(Permission.code == code))
            if perm is None:
                perm = Permission(code=code, description=desc)
                db.add(perm)
                logger.info("Created permission: %s", code)
            perm_by_code[code] = perm
        db.flush()

        # Roles
        role_by_name: dict[str, Role] = {}
        for name, (desc, codes) in ROLES.items():
            role = db.scalar(select(Role).where(Role.role_name == name))
            if role is None:
                role = Role(role_name=name, description=desc)
                db.add(role)
                logger.info("Created role: %s", name)
            role.description = desc
            role.permissions = [perm_by_code[c] for c in codes]
            role_by_name[name] = role
        db.commit()

        # Initial superuser
        username = os.getenv("FIRST_SUPERUSER_USERNAME", "admin")
        email = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@crimerakshak.local")
        password = os.getenv("FIRST_SUPERUSER_PASSWORD", "ChangeMe123!")

        existing = db.scalar(select(User).where(User.username == username))
        if existing is None:
            admin_role = role_by_name["admin"]
            user = User(
                username=username,
                email=email,
                password_hash=hash_password(password),
                is_active=True,
                is_superuser=True,
                role_id=admin_role.role_id,
                roles=[admin_role],
            )
            db.add(user)
            db.commit()
            logger.info("Created initial superuser: %s", username)
        else:
            existing.password_hash = hash_password(password)
            existing.is_active = True
            existing.is_superuser = True
            db.commit()
            logger.info("Superuser '%s' password and settings synchronized.", username)

        logger.info("Seeding complete.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
