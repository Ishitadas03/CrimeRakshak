"""Integration tests for the Graph Intelligence module (Feature 2).

Runs the full API against:
  * an in-memory SQLite database (auth/RBAC/audit tables), and
  * a FAKE Neo4j connection manager that returns canned Cypher records,

so no live PostgreSQL or Neo4j is required. Validates JWT+RBAC gating on every
graph endpoint, audit-log capture, result serialization, 404/503 error paths,
and the union-find organized-group stitching.

Run::

    cd backend
    python tests/test_graph.py
    # or: python -m pytest tests/test_graph.py -v
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
from app.graph.dependencies import get_graph_service  # noqa: E402
from app.graph.repositories.graph_repository import GraphRepository  # noqa: E402
from app.graph.services.graph_service import GraphService  # noqa: E402

Base.metadata.create_all(bind=test_engine)
TestingSession = database.SessionLocal


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ── Fake Neo4j connection manager ──────────────────────────────────────────
class FakeConnection:
    """Stand-in for Neo4jConnectionManager. Returns canned rows keyed by a
    fragment of the query text. Set ``unavailable=True`` to simulate an outage.
    """

    def __init__(self):
        self.unavailable = False
        # Graph fixture:
        #   P1 associates with P2, P3; P1 & P2 co-accused in F1 (organized pair)
        #   P1 accused in F1, F2 (repeat offender)
        self.people = {
            "P1": {"person_id": "P1", "name": "Alpha"},
            "P2": {"person_id": "P2", "name": "Bravo"},
            "P3": {"person_id": "P3", "name": "Charlie"},
        }

    def _n(self, label, props):
        # Mimic record.data() dict with a private label marker the normalizer reads.
        d = dict(props)
        d["_label"] = label
        return d

    def run_read(self, query, params=None):
        params = params or {}
        if self.unavailable:
            raise GraphConnectionError("graph database is unavailable")

        q = query

        if "count(n) AS c" in q:  # node_exists
            nid = params.get("node_id")
            exists = nid in self.people or nid in ("F1", "F2")
            return [{"c": 1 if exists else 0}]

        if "collect(DISTINCT {rel: r, node: n})" in q:  # PERSON_NETWORK
            pid = params.get("person_id")
            if pid != "P1":
                return [{"root": self._n("Person", self.people.get(pid, {"person_id": pid})),
                         "connections": []}]
            return [{
                "root": self._n("Person", self.people["P1"]),
                "connections": [
                    {"rel": ["P1", "ASSOCIATES_WITH", "P2"], "node": self._n("Person", self.people["P2"])},
                    {"rel": ["P1", "ACCUSED_IN", "F1"], "node": self._n("FIR", {"fir_id": "F1"})},
                    {"rel": ["P1", "OWNS_PHONE", "PH1"], "node": self._n("PhoneNumber", {"phone_no": "PH1"})},
                    {"rel": ["P1", "OWNS_ACCOUNT", "B1"], "node": self._n("BankAccount", {"account_no": "B1"})},
                ],
            }]

        if "r:ACCUSED_IN]->(f:FIR {fir_id" in q:  # ACCUSED_OF_FIR
            return [{"person": self._n("Person", self.people["P1"]), "rel": {}},
                    {"person": self._n("Person", self.people["P2"]), "rel": {}}]
        if "r:VICTIM_IN]->(f:FIR {fir_id" in q:
            return [{"person": self._n("Person", self.people["P3"]), "rel": {}}]
        if "r:WITNESS_IN]->(f:FIR {fir_id" in q:
            return []
        if "CLASSIFIED_AS]->(c:CrimeCategory)" in q and "crimes" in q:  # FIR_CRIMES
            return [{"crimes": [self._n("CrimeCategory", {"category_id": "murder", "name": "Murder"})]}]
        if "r:OCCURRED_AT]->(l:Location)" in q:  # FIR_LOCATIONS
            return [{"location": self._n("Location", {"location_id": "L1", "address": "MG Road"}), "rel": {}}]

        if "r:ASSOCIATES_WITH]-(a:Person)" in q:  # DIRECT_ASSOCIATES
            return [
                {"person": self._n("Person", self.people["P2"]), "relation_types": ["Gang"], "shared_connections": 2},
                {"person": self._n("Person", self.people["P3"]), "relation_types": ["Friend"], "shared_connections": 1},
            ]
        if "mutual:Person)" in q and "candidate:Person" in q:  # COMMON_ASSOCIATES
            return [{"person": self._n("Person", self.people["P3"]), "shared_connections": 1, "via": ["P2"]}]

        if "count(DISTINCT f) AS fir_count" in q:  # REPEAT_OFFENDERS
            return [{"person": self._n("Person", self.people["P1"]), "fir_count": 2, "fir_ids": ["F1", "F2"]}]

        if "person_a, p2 AS person_b, shared_firs" in q or "RETURN p1 AS person_a" in q:  # ORGANIZED_GROUPS
            return [{"person_a": self._n("Person", self.people["P1"]),
                     "person_b": self._n("Person", self.people["P2"]),
                     "shared_firs": 2}]
        if "r:ASSOCIATES_WITH]-(b:Person)" in q and "$ids" in q:  # GROUP_INTERNAL_EDGES
            return [{"source": "P1", "target": "P2", "relation_types": ["Gang"]}]
        if "p:Person) WHERE p.person_id IN $ids" in q:  # GROUP_NODES
            ids = params.get("ids", [])
            return [{"person": self._n("Person", self.people[i])} for i in ids if i in self.people]

        if "shortestPath" in q:  # SHORTEST_PATH
            src, dst = params.get("src_id"), params.get("dst_id")
            if dst == "UNREACHABLE":
                return []
            # path rendered as alternating [node, rel, node]
            return [{"path": [
                self._n("Person", self.people.get(src, {"person_id": src})),
                "ASSOCIATES_WITH",
                self._n("Person", self.people.get(dst, {"person_id": dst})),
            ]}]

        if "MATCH (n)" in q and "CONTAINS toLower($q)" in q:  # SEARCH
            term = params.get("q", "").lower()
            hits = [p for p in self.people.values() if term in p["name"].lower() or term in p["person_id"].lower()]
            return [{"node": self._n("Person", p), "labels": ["Person"]} for p in hits]

        if "collect(path) AS paths" in q:  # FULL_NETWORK
            return [{
                "root": self._n("Person", self.people["P1"]),
                "paths": [
                    [self._n("Person", self.people["P1"]), "ASSOCIATES_WITH", self._n("Person", self.people["P2"])],
                    [self._n("Person", self.people["P1"]), "ASSOCIATES_WITH", self._n("Person", self.people["P3"])],
                ],
            }]

        return []

    def run_write(self, query, params=None):
        return []


fake_conn = FakeConnection()
_fake_service = GraphService(GraphRepository(fake_conn))
app.dependency_overrides[get_graph_service] = lambda: _fake_service

client = TestClient(app)


# ── RBAC fixtures ──────────────────────────────────────────────────────────
def _seed():
    db = TestingSession()
    try:
        for code in ["graph:read", "graph:write", "rbac:manage"]:
            rbac_service.create_permission(db, code)
        rbac_service.create_role(db, "viewer", "read", ["graph:read"])
        rbac_service.create_role(db, "noaccess", "no graph", [])
        auth_service.register_user(db, username="alice", email="alice@example.com",
                                   password="Passw0rd1", role_names=["viewer"])
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
    graph_user = _token("alice")   # has graph:read
    no_user = _token("bob")        # lacks graph:read

    # ── Auth gating: unauthenticated → 401 ──
    assert client.get("/api/v1/graph/person/P1").status_code == 401
    print("unauthenticated blocked OK")

    # ── RBAC: user without graph:read → 403 ──
    r = client.get("/api/v1/graph/person/P1", headers=no_user)
    assert r.status_code == 403, r.text
    assert r.json()["error"]["code"] == "forbidden"
    print("RBAC gating OK (no graph:read -> 403)")

    # ── person profile ──
    r = client.get("/api/v1/graph/person/P1", headers=graph_user)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["person"]["id"] == "P1"
    assert [f["id"] for f in body["firs"]] == ["F1"]
    assert [a["id"] for a in body["associates"]] == ["P2"]
    assert body["phones"][0]["id"] == "PH1"
    assert body["accounts"][0]["id"] == "B1"
    assert body["graph"]["node_count"] == 5  # P1 + 4 neighbors
    print("person profile OK")

    # ── person not found → 404 ──
    r = client.get("/api/v1/graph/person/NOPE", headers=graph_user)
    assert r.status_code == 404 and r.json()["error"]["code"] == "graph_not_found"
    print("person 404 OK")

    # ── FIR profile ──
    r = client.get("/api/v1/graph/fir/F1", headers=graph_user)
    assert r.status_code == 200, r.text
    fir = r.json()
    assert {p["id"] for p in fir["accused"]} == {"P1", "P2"}
    assert [v["id"] for v in fir["victims"]] == ["P3"]
    assert fir["crimes"][0]["id"] == "murder"
    assert fir["locations"][0]["id"] == "L1"
    print("FIR profile OK")

    # ── associates ──
    r = client.get("/api/v1/graph/associates/P1", headers=graph_user)
    assert r.status_code == 200, r.text
    a = r.json()
    assert [x["person"]["id"] for x in a["direct_associates"]] == ["P2", "P3"]
    assert a["direct_associates"][0]["relation_types"] == ["Gang"]
    assert a["common_associates"][0]["person"]["id"] == "P3"
    print("associates OK")

    # ── repeat offenders ──
    r = client.get("/api/v1/graph/repeat-offenders?min_firs=2", headers=graph_user)
    assert r.status_code == 200, r.text
    ro = r.json()
    assert ro[0]["person"]["id"] == "P1" and ro[0]["fir_count"] == 2
    assert ro[0]["fir_ids"] == ["F1", "F2"]
    print("repeat offenders OK")

    # ── organized groups (union-find stitching) ──
    r = client.get("/api/v1/graph/organized-groups", headers=graph_user)
    assert r.status_code == 200, r.text
    groups = r.json()
    assert len(groups) == 1, groups
    g = groups[0]
    assert g["size"] == 2 and {m["id"] for m in g["members"]} == {"P1", "P2"}
    assert g["internal_edge_count"] == 1
    assert g["cohesion"] == 1.0  # 1 edge / max 1
    print("organized groups OK")

    # ── search ──
    r = client.get("/api/v1/graph/search?q=alp", headers=graph_user)
    assert r.status_code == 200, r.text
    s = r.json()
    assert s["count"] == 1 and s["results"][0]["node"]["id"] == "P1"
    print("search OK")

    # ── full network ──
    r = client.get("/api/v1/graph/network?root_id=P1&label=Person&depth=2", headers=graph_user)
    assert r.status_code == 200, r.text
    net = r.json()
    assert {n["id"] for n in net["nodes"]} == {"P1", "P2", "P3"}
    assert net["edge_count"] == 2
    print("full network OK")

    # ── shortest path (found) ──
    r = client.get("/api/v1/graph/path?source_id=P1&target_id=P2", headers=graph_user)
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["found"] is True and p["length"] == 1
    assert [h["node"]["id"] for h in p["hops"]] == ["P1", "P2"]
    print("shortest path (found) OK")

    # ── shortest path (not found) ──
    r = client.get("/api/v1/graph/path?source_id=P1&target_id=UNREACHABLE", headers=graph_user)
    # UNREACHABLE fails node_exists → 404
    assert r.status_code == 404, r.text
    print("shortest path unknown target -> 404 OK")

    # ── invalid label → 400 ──
    r = client.get("/api/v1/graph/network?root_id=P1&label=Wombat&depth=2", headers=graph_user)
    assert r.status_code == 400, r.text
    assert r.json()["error"]["code"] == "invalid_argument"
    print("invalid label -> 400 OK")

    # ── graph DB outage → 503 ──
    fake_conn.unavailable = True
    r = client.get("/api/v1/graph/person/P1", headers=graph_user)
    assert r.status_code == 503, r.text
    assert r.json()["error"]["code"] == "graph_unavailable"
    fake_conn.unavailable = False
    print("graph outage -> 503 OK")

    # ── audit log captured every query ──
    db = TestingSession()
    try:
        actions = {a for (a,) in db.execute(select(AuditLog.action)).all()}
    finally:
        db.close()
    for expected in [
        "graph.person", "graph.fir", "graph.associates", "graph.repeat_offenders",
        "graph.organized_groups", "graph.search", "graph.network", "graph.path",
    ]:
        assert expected in actions, f"missing audit action: {expected} in {actions}"
    print(f"audit logging OK ({len(actions)} distinct actions)")

    print("\nALL GRAPH TESTS PASSED")


def test_graph():
    run()


if __name__ == "__main__":
    run()
