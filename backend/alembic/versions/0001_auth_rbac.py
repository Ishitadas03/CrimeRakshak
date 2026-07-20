"""auth & rbac: extend base tables + add normalized RBAC tables

Revision ID: 0001_auth_rbac
Revises:
Create Date: 2026-07-12

This migration is additive and idempotent. It assumes the base schema in
``db/schema.sql`` (users, roles, audit_logs, dim_*/fact_*) is already applied,
and layers the auth/RBAC concerns on top without touching existing data:

  * roles       + description
  * users       + is_active, is_superuser, failed_login_attempts,
                  locked_until, last_login_at
  * audit_logs  + detail, status
  * new tables  permissions, role_permissions, user_roles, refresh_tokens
"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_auth_rbac"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Extend existing tables (IF NOT EXISTS → safe on partially-migrated DBs) ──
    op.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS description VARCHAR(255)"
    )

    op.execute(
        """
        ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ
        """
    )

    op.execute(
        """
        ALTER TABLE audit_logs
            ADD COLUMN IF NOT EXISTS detail TEXT,
            ADD COLUMN IF NOT EXISTS status VARCHAR(20)
        """
    )

    # ── permissions ──
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS permissions (
            permission_id SERIAL PRIMARY KEY,
            code VARCHAR(100) UNIQUE NOT NULL,
            description VARCHAR(255)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code)"
    )

    # ── role_permissions ──
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS role_permissions (
            id SERIAL PRIMARY KEY,
            role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
            permission_id INTEGER NOT NULL
                REFERENCES permissions(permission_id) ON DELETE CASCADE,
            CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_role_permissions_role "
        "ON role_permissions(role_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_role_permissions_perm "
        "ON role_permissions(permission_id)"
    )

    # ── user_roles ──
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_roles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            role_id INTEGER NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
            assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id)"
    )

    # ── refresh_tokens ──
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id SERIAL PRIMARY KEY,
            jti VARCHAR(36) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            user_agent VARCHAR(255),
            ip_address VARCHAR(45)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_jti ON refresh_tokens(jti)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS refresh_tokens")
    op.execute("DROP TABLE IF EXISTS user_roles")
    op.execute("DROP TABLE IF EXISTS role_permissions")
    op.execute("DROP TABLE IF EXISTS permissions")

    op.execute("ALTER TABLE audit_logs DROP COLUMN IF EXISTS status")
    op.execute("ALTER TABLE audit_logs DROP COLUMN IF EXISTS detail")

    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS last_login_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS locked_until")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_superuser")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS is_active")

    op.execute("ALTER TABLE roles DROP COLUMN IF EXISTS description")
