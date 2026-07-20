"""ORM models package.

Importing the models here ensures they are registered on ``Base.metadata``
(needed by Alembic autogenerate and by ``Base.metadata.create_all``).
"""
from app.models.rbac import (
    AuditLog,
    Permission,
    RefreshToken,
    Role,
    RolePermission,
    User,
    UserRole,
)

__all__ = [
    "AuditLog",
    "Permission",
    "RefreshToken",
    "Role",
    "RolePermission",
    "User",
    "UserRole",
]
