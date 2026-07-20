# Authentication & RBAC Module

Production-ready Auth / Role-Based Access Control for the Graph Intelligence &
Security Service, built with **FastAPI + SQLAlchemy 2.0 + Alembic + JWT (OAuth2
password flow) + bcrypt**. It integrates non-destructively with the existing
PostgreSQL schema (`db/schema.sql`) and the ingestion pipeline's `POSTGRES_URI`.

> Graph Intelligence and Financial Crime APIs are **out of scope** for this step.
> `app/routers/protected.py` ships RBAC-gated placeholders those modules reuse.

## Layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, error envelope, router wiring
│   ├── seed.py                 # Idempotent baseline roles/permissions + superuser
│   ├── core/
│   │   ├── config.py           # pydantic-settings (env-driven)
│   │   ├── database.py         # engine, SessionLocal, get_db, Base
│   │   ├── security.py         # bcrypt hashing + JWT encode/decode
│   │   ├── dependencies.py     # get_current_user, require_roles/permissions
│   │   ├── exceptions.py       # typed HTTP errors
│   │   └── logging.py          # rotating file + console logger
│   ├── models/rbac.py          # User, Role, Permission, UserRole,
│   │                           #   RolePermission, RefreshToken, AuditLog
│   ├── schemas/                # Pydantic request/response models
│   ├── services/               # auth_service, rbac_service, audit
│   └── routers/                # auth, admin, protected
├── alembic/                    # migration env + versions/0001_auth_rbac.py
├── alembic.ini
└── tests/test_smoke.py         # end-to-end smoke test (in-memory SQLite)
```

## Setup

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env        # then edit SECRET_KEY etc.

# Apply base schema first (if not already):  psql < ../db/schema.sql
alembic upgrade head              # adds auth columns + RBAC tables (idempotent)
python -m app.seed                # baseline roles/permissions + initial admin
uvicorn app.main:app --reload     # http://localhost:8000/docs
```

## Endpoints (prefix `/api/v1`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/register` | public | Register (defaults to `viewer`) |
| POST | `/auth/login` | public | OAuth2 password flow → token pair |
| POST | `/auth/refresh` | refresh token | Rotate token pair |
| POST | `/auth/logout` | bearer | Revoke a refresh token |
| POST | `/auth/logout-all` | bearer | Revoke all sessions |
| GET  | `/auth/me` | bearer | Current user profile |
| POST | `/auth/change-password` | bearer | Change password (revokes sessions) |
| GET/POST | `/admin/permissions` | `rbac:manage` | List / create permissions |
| GET/POST | `/admin/roles` | `rbac:manage` | List / create roles |
| PATCH | `/admin/roles/{name}` | `rbac:manage` | Update role permissions |
| PUT | `/admin/users/{id}/roles` | `rbac:manage` | Assign roles to a user |
| GET | `/admin/users` | `rbac:manage` | List users |
| GET | `/admin/audit-logs` | `rbac:manage` | Query audit trail |
| GET | `/secure/graph-preview` | `graph:read` | Placeholder (Graph Intelligence) |
| GET | `/secure/financial-preview` | `financial:read` | Placeholder (Financial Crime) |

## Design notes

- **Refresh-token rotation**: each refresh is single-use and persisted by `jti`;
  reuse of a rotated token revokes the whole family (breach containment).
- **Account lockout**: `MAX_FAILED_LOGIN_ATTEMPTS` wrong passwords → temporary
  lock for `ACCOUNT_LOCKOUT_MINUTES`.
- **Superusers** bypass all role/permission checks.
- **Multi-role**: `user_roles` is the source of truth; the legacy `users.role_id`
  FK from the base schema is kept in sync as the "primary" role.
- **Audit hooks** (`services/audit.py`) are best-effort and never break a request.

## Test

```bash
cd backend
python tests/test_smoke.py        # no database required (in-memory SQLite)
```
