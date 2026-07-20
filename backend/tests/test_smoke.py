"""Smoke test for the Auth & RBAC module.

Runs the full API against an in-memory SQLite database (no PostgreSQL needed),
exercising registration, OAuth2 login, refresh-token rotation, RBAC gating, and
audit logging. Run with::

    cd backend
    python -m pytest tests/test_smoke.py -v
    # or simply: python tests/test_smoke.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure a self-contained environment BEFORE importing the app.
os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
# Keep a Postgres-style URI so the module-level engine builds (no connection is
# made at creation time); it is swapped for in-memory SQLite immediately below.
os.environ["POSTGRES_URI"] = "postgresql://u:p@localhost:5432/placeholder"

from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app.core.database as database  # noqa: E402

# Swap in a shared in-memory SQLite engine for the test session.
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
database.engine = test_engine
database.SessionLocal = sessionmaker(
    bind=test_engine, autoflush=False, autocommit=False, expire_on_commit=False
)

from app.core.database import Base, get_db  # noqa: E402
import app.models  # noqa: E402,F401
from app.main import app  # noqa: E402
from app.services import auth_service, rbac_service  # noqa: E402

Base.metadata.create_all(bind=test_engine)

TestingSession = database.SessionLocal


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


def _seed_rbac():
    db = TestingSession()
    try:
        for code in ["graph:read", "financial:read", "rbac:manage", "audit:read"]:
            rbac_service.create_permission(db, code)
        rbac_service.create_role(db, "viewer", "read only", ["graph:read"])
        rbac_service.create_role(
            db, "admin", "admin", ["graph:read", "financial:read", "rbac:manage", "audit:read"]
        )
        # Promote a superuser directly.
        admin = auth_service.register_user(
            db,
            username="rootadmin",
            email="root@example.com",
            password="Passw0rd1",
            role_names=["admin"],
        )
        admin.is_superuser = True
        db.commit()
    finally:
        db.close()


def run():
    _seed_rbac()

    # ── health ──
    assert client.get("/health").json()["status"] == "ok"

    # ── register (defaults to viewer) ──
    r = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "Passw0rd1"},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["username"] == "alice"
    assert [role["role_name"] for role in body["roles"]] == ["viewer"]
    print("register OK")

    # ── duplicate register → 409 ──
    r = client.post(
        "/api/v1/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "Passw0rd1"},
    )
    assert r.status_code == 409, r.text
    assert r.json()["error"]["code"] == "already_exists"
    print("duplicate register rejected OK")

    # ── weak password → 422 validation ──
    r = client.post(
        "/api/v1/auth/register",
        json={"username": "bob", "email": "bob@example.com", "password": "short"},
    )
    assert r.status_code == 422, r.text
    print("weak password rejected OK")

    # ── OAuth2 login (form-encoded) ──
    r = client.post(
        "/api/v1/auth/login",
        data={"username": "alice", "password": "Passw0rd1"},
    )
    assert r.status_code == 200, r.text
    tokens = r.json()
    access = tokens["access_token"]
    refresh = tokens["refresh_token"]
    assert tokens["token_type"] == "bearer"
    print("login OK")

    # ── wrong password → 401 ──
    r = client.post(
        "/api/v1/auth/login", data={"username": "alice", "password": "wrong"}
    )
    assert r.status_code == 401, r.text
    print("bad login rejected OK")

    auth_h = {"Authorization": f"Bearer {access}"}

    # ── /me ──
    r = client.get("/api/v1/auth/me", headers=auth_h)
    assert r.status_code == 200 and r.json()["username"] == "alice"
    print("me OK")

    # ── viewer CAN read graph, CANNOT read financial ──
    assert client.get("/api/v1/secure/graph-preview", headers=auth_h).status_code == 200
    r = client.get("/api/v1/secure/financial-preview", headers=auth_h)
    assert r.status_code == 403, r.text
    assert r.json()["error"]["code"] == "forbidden"
    print("permission gating OK (viewer: graph yes, financial no)")

    # ── no token → 401 ──
    assert client.get("/api/v1/secure/graph-preview").status_code == 401
    print("unauthenticated blocked OK")

    # ── admin endpoints blocked for viewer ──
    assert client.get("/api/v1/admin/roles", headers=auth_h).status_code == 403
    print("admin blocked for viewer OK")

    # ── refresh rotation ──
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 200, r.text
    new_refresh = r.json()["refresh_token"]
    assert new_refresh != refresh
    # Old refresh now revoked → reuse detected (401).
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401, r.text
    assert r.json()["error"]["code"] == "refresh_reuse"
    print("refresh rotation + reuse detection OK")

    # ── superuser bypass: login rootadmin, hit admin + financial ──
    r = client.post(
        "/api/v1/auth/login", data={"username": "rootadmin", "password": "Passw0rd1"}
    )
    admin_h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    assert client.get("/api/v1/admin/roles", headers=admin_h).status_code == 200
    assert client.get("/api/v1/secure/financial-preview", headers=admin_h).status_code == 200
    print("superuser bypass OK")

    # ── admin creates a role and assigns it ──
    r = client.post(
        "/api/v1/admin/roles",
        headers=admin_h,
        json={"role_name": "officer", "permission_codes": ["financial:read"]},
    )
    assert r.status_code == 201, r.text
    # Assign officer to alice (user_id 2 after rootadmin=1).
    alice_id = client.get("/api/v1/auth/me", headers=auth_h).json()["user_id"]
    r = client.put(
        f"/api/v1/admin/users/{alice_id}/roles",
        headers=admin_h,
        json={"role_names": ["officer"]},
    )
    assert r.status_code == 200, r.text
    assert [x["role_name"] for x in r.json()["roles"]] == ["officer"]
    print("role create + assignment OK")

    # ── audit logs recorded ──
    r = client.get("/api/v1/admin/audit-logs", headers=admin_h)
    assert r.status_code == 200
    actions = {row["action"] for row in r.json()}
    assert "auth.login" in actions and "user.register" in actions, actions
    print(f"audit logging OK ({len(r.json())} entries)")

    print("\nALL SMOKE TESTS PASSED")


def test_smoke():
    run()


if __name__ == "__main__":
    run()
