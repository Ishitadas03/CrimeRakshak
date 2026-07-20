"""Integration tests for the Financial Crime module (Feature 7).

Same approach as ``test_graph.py``: an in-memory SQLite DB for auth/RBAC/audit
and a FAKE Neo4j connection returning canned records — no live PostgreSQL or
Neo4j needed. Validates JWT+RBAC gating, audit capture, transaction/money-trail
serialization, circular-flow + suspicious detection, and 404/400/503 paths.

Run::

    cd backend
    python tests/test_financial.py
    # or (isolated):  python -m pytest tests/test_financial.py -v
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ["POSTGRES_URI"] = "postgresql://u:p@localhost:5432/placeholder"

from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import app.core.database as database  # noqa: E402

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
from app.models.rbac import AuditLog  # noqa: E402
from app.services import auth_service, rbac_service  # noqa: E402
from app.graph.connection import GraphConnectionError  # noqa: E402
from app.financial.dependencies import get_financial_service  # noqa: E402
from app.financial.repositories.financial_repository import FinancialRepository  # noqa: E402
from app.financial.services.financial_service import FinancialService  # noqa: E402

Base.metadata.create_all(bind=test_engine)
TestingSession = database.SessionLocal


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ── Fake Neo4j connection ──────────────────────────────────────────────────
class FakeConnection:
    """Canned graph:
        Person PX owns account A1.
        A1 -> A2 -> A3 (money trail); A3 -> A1 closes a cycle.
        High-value transfer A1->A2 = 500000; A2->A3 = 200000; A3->A1 = 150000.
    """

    def __init__(self):
        self.unavailable = False

    def _node(self, label, props):
        d = dict(props)
        d["_label"] = label
        return d

    def _rel(self, txid, amount, method="NEFT"):
        return {"_type": "TRANSFERRED_TO", "transaction_id": txid,
                "amount": amount, "date": "2026-01-15", "method": method}

    def run_read(self, query, params=None):
        params = params or {}
        if self.unavailable:
            raise GraphConnectionError("graph database is unavailable")
        q = query

        A1 = self._node("BankAccount", {"account_no": "A1", "bank_name": "SBI"})
        A2 = self._node("BankAccount", {"account_no": "A2", "bank_name": "HDFC"})
        A3 = self._node("BankAccount", {"account_no": "A3", "bank_name": "ICICI"})
        PX = self._node("Person", {"person_id": "PX", "name": "Xavier"})

        if "count(b) AS c" in q:  # ACCOUNT_EXISTS
            return [{"c": 1 if params.get("account_no") in ("A1", "A2", "A3") else 0}]
        if "count(p) AS c" in q:  # PERSON_EXISTS
            return [{"c": 1 if params.get("person_id") == "PX" else 0}]

        if "RETURN b AS account" in q and "outgoing" in q:  # ACCOUNT_PROFILE
            return [{
                "account": A1,
                "owners": [PX],
                "outgoing": [{"rel": self._rel("T1", 500000), "node": A2}],
                "incoming": [{"rel": self._rel("T3", 150000), "node": A3}],
            }]

        if "tx_linked + collect(DISTINCT co)" in q:  # LINKED_ACCOUNTS
            return [{"linked": [A2, A3]}]

        if "collect(DISTINCT {src: a, rel: t, dst: c})" in q:  # PERSON_FINANCIALS
            return [{
                "person": PX,
                "accounts": [A1],
                "transactions": [
                    {"src": A1, "rel": self._rel("T1", 500000), "dst": A2},
                    {"src": A3, "rel": self._rel("T3", 150000), "dst": A1},
                ],
            }]

        if "RETURN a AS src, t AS rel, b AS dst" in q and "ORDER BY" in q:
            # TRANSACTIONS or SUSPICIOUS_NETWORK (high-value)
            min_amt = params.get("min_amount", params.get("threshold", 0))
            all_tx = [
                (A1, self._rel("T1", 500000), A2),
                (A2, self._rel("T2", 200000), A3),
                (A3, self._rel("T3", 150000), A1),
            ]
            rows = [{"src": s, "rel": r, "dst": d} for (s, r, d) in all_tx if r["amount"] >= min_amt]
            acc = params.get("account")
            if acc:
                rows = [x for x in rows if x["src"]["account_no"] == acc or x["dst"]["account_no"] == acc]
            method = params.get("method")
            if method:
                rows = [x for x in rows if x["rel"]["method"] == method]
            return rows

        if "MATCH path = (a)-[:TRANSFERRED_TO*1.." in q:  # MONEY_TRAIL
            # two downstream trails from A1
            return [
                {"path": [A1, self._rel("T1", 500000), A2]},
                {"path": [A1, self._rel("T1", 500000), A2, self._rel("T2", 200000), A3]},
            ]

        if "-[:TRANSFERRED_TO*2.." in q and "->(a)" in q:  # CIRCULAR_FLOW
            return [{
                "origin": A1,
                "total": 850000.0,
                "path": [A1, self._rel("T1", 500000), A2, self._rel("T2", 200000), A3,
                         self._rel("T3", 150000), A1],
            }]

        if "in_count >= 1 AND out_count >= 1" in q:  # PASS_THROUGH_ACCOUNTS
            return [{"account": A2, "total_in": 500000, "total_out": 200000,
                     "in_count": 1, "out_count": 1}]

        if "collect(path) AS paths" in q:  # NETWORK
            return [{
                "root": A1,
                "paths": [
                    [A1, self._rel("T1", 500000), A2],
                    [PX, {"_type": "OWNS_ACCOUNT"}, A1],
                ],
            }]

        if "shortestPath" in q:  # MONEY_PATH
            src, dst = params.get("src_id"), params.get("dst_id")
            if dst == "A_UNREACHABLE":
                return []
            return [{"path": [A1, self._rel("T1", 500000), A2, self._rel("T2", 200000), A3]}]

        if "CONTAINS toLower($q)" in q:  # SEARCH
            term = params.get("q", "").lower()
            cands = [A1, A2, A3, PX]
            hits = [n for n in cands
                    if term in str(n.get("account_no", "")).lower()
                    or term in str(n.get("name", "")).lower()
                    or term in str(n.get("person_id", "")).lower()
                    or term in str(n.get("bank_name", "")).lower()]
            return [{"node": n} for n in hits]

        return []

    def run_write(self, query, params=None):
        return []


fake_conn = FakeConnection()
_svc = FinancialService(FinancialRepository(fake_conn))
app.dependency_overrides[get_financial_service] = lambda: _svc

client = TestClient(app)


def _seed():
    db = TestingSession()
    try:
        for code in ["financial:read", "graph:read", "rbac:manage"]:
            rbac_service.create_permission(db, code)
        rbac_service.create_role(db, "fin-analyst", "financial read", ["financial:read"])
        rbac_service.create_role(db, "noaccess", "none", [])
        auth_service.register_user(db, username="fin", email="fin@example.com",
                                   password="Passw0rd1", role_names=["fin-analyst"])
        auth_service.register_user(db, username="bob", email="bob@example.com",
                                   password="Passw0rd1", role_names=["noaccess"])
    finally:
        db.close()


def _token(username):
    r = client.post("/api/v1/auth/login", data={"username": username, "password": "Passw0rd1"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def run():
    _seed()
    fin = _token("fin")     # has financial:read
    no = _token("bob")      # lacks financial:read

    # ── Auth gating ──
    assert client.get("/api/v1/financial/accounts/A1").status_code == 401
    print("unauthenticated blocked OK")

    r = client.get("/api/v1/financial/accounts/A1", headers=no)
    assert r.status_code == 403 and r.json()["error"]["code"] == "forbidden", r.text
    print("RBAC gating OK (no financial:read -> 403)")

    # ── account profile ──
    r = client.get("/api/v1/financial/accounts/A1", headers=fin)
    assert r.status_code == 200, r.text
    b = r.json()
    assert b["account"]["id"] == "A1"
    assert [o["id"] for o in b["owners"]] == ["PX"]
    assert b["outgoing"][0]["target_account"] == "A2" and b["outgoing"][0]["amount"] == 500000
    assert b["incoming"][0]["source_account"] == "A3"
    assert b["total_out"] == 500000 and b["total_in"] == 150000
    assert {n["id"] for n in b["linked_accounts"]} == {"A2", "A3"}
    print("account profile OK")

    # ── account not found -> 404 ──
    r = client.get("/api/v1/financial/accounts/NOPE", headers=fin)
    assert r.status_code == 404 and r.json()["error"]["code"] == "financial_not_found"
    print("account 404 OK")

    # ── person financial profile ──
    r = client.get("/api/v1/financial/person/PX", headers=fin)
    assert r.status_code == 200, r.text
    p = r.json()
    assert [a["id"] for a in p["accounts"]] == ["A1"]
    assert len(p["transactions"]) == 2
    assert p["total_out"] == 500000 and p["total_in"] == 150000
    print("person financial profile OK")

    # ── transactions (filtering) ──
    r = client.get("/api/v1/financial/transactions?min_amount=200000", headers=fin)
    assert r.status_code == 200, r.text
    t = r.json()
    assert t["count"] == 2 and t["total_amount"] == 700000, t
    r = client.get("/api/v1/financial/transactions?min_amount=0&account=A3", headers=fin)
    ids = {x["source_account"] + "->" + x["target_account"] for x in r.json()["transactions"]}
    assert ids == {"A2->A3", "A3->A1"}, ids
    print("transactions filter OK")

    # ── money trail ──
    r = client.get("/api/v1/financial/money-trail?account_no=A1&depth=3", headers=fin)
    assert r.status_code == 200, r.text
    mt = r.json()
    assert mt["trail_count"] == 2
    longest = max(mt["trails"], key=len)
    assert [h["account"]["id"] for h in longest] == ["A1", "A2", "A3"]
    assert longest[1]["via"]["amount"] == 500000  # incoming txn into A2
    assert longest[2]["via"]["source_account"] == "A2"
    print("money trail OK")

    # ── network ──
    r = client.get("/api/v1/financial/network?root_id=A1&label=BankAccount&depth=2", headers=fin)
    assert r.status_code == 200, r.text
    net = r.json()
    assert net["root_id"] == "A1" and net["root_label"] == "BankAccount"
    assert {n["id"] for n in net["nodes"]} >= {"A1", "A2", "PX"}
    types = {e["type"] for e in net["edges"]}
    assert "TRANSFERRED_TO" in types and "OWNS_ACCOUNT" in types
    print("network OK")

    # ── suspicious ──
    r = client.get("/api/v1/financial/suspicious?threshold=150000&depth=5", headers=fin)
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["threshold"] == 150000
    assert len(s["high_value"]) == 3
    assert len(s["circular_flows"]) == 1
    cf = s["circular_flows"][0]
    assert cf["account_no"] == "A1" and cf["accounts"][0] == "A1" and cf["accounts"][-1] == "A1"
    assert cf["total_amount"] == 850000
    assert [a["id"] for a in s["pass_through_accounts"]] == ["A2"]
    print("suspicious detection OK")

    # ── search ──
    r = client.get("/api/v1/financial/search?q=A2", headers=fin)
    assert r.status_code == 200, r.text
    assert r.json()["count"] == 1 and r.json()["results"][0]["node"]["id"] == "A2"
    r = client.get("/api/v1/financial/search?q=xav", headers=fin)
    assert r.json()["results"][0]["node"]["id"] == "PX"
    print("search OK")

    # ── path (found) ──
    r = client.get("/api/v1/financial/path?source_account=A1&target_account=A3", headers=fin)
    assert r.status_code == 200, r.text
    pr = r.json()
    assert pr["found"] is True and pr["length"] == 2
    assert [h["account"]["id"] for h in pr["hops"]] == ["A1", "A2", "A3"]
    assert pr["total_amount"] == 700000
    print("money path (found) OK")

    # ── path (unreachable target exists but no path) ──
    # A_UNREACHABLE does not exist -> 404 first
    r = client.get("/api/v1/financial/path?source_account=A1&target_account=A_UNREACHABLE", headers=fin)
    assert r.status_code == 404, r.text
    print("money path missing account -> 404 OK")

    # ── invalid label -> 400 ──
    r = client.get("/api/v1/financial/network?root_id=A1&label=Wombat", headers=fin)
    assert r.status_code == 400 and r.json()["error"]["code"] == "invalid_argument", r.text
    print("invalid label -> 400 OK")

    # ── graph outage -> 503 ──
    fake_conn.unavailable = True
    r = client.get("/api/v1/financial/accounts/A1", headers=fin)
    assert r.status_code == 503 and r.json()["error"]["code"] == "graph_unavailable", r.text
    fake_conn.unavailable = False
    print("graph outage -> 503 OK")

    # ── audit logging captured every action ──
    db = TestingSession()
    try:
        actions = {a for (a,) in db.execute(select(AuditLog.action)).all()}
    finally:
        db.close()
    for expected in [
        "financial.account", "financial.person", "financial.transactions",
        "financial.money_trail", "financial.network", "financial.suspicious",
        "financial.search", "financial.path",
    ]:
        assert expected in actions, f"missing audit action {expected} in {actions}"
    print(f"audit logging OK ({len(actions)} distinct actions)")

    print("\nALL FINANCIAL TESTS PASSED")


def test_financial():
    run()


if __name__ == "__main__":
    run()
