"""Block 2 — Criminal Network & Relationship Analysis (CSV/DuckDB-backed).

Rebuilds the network-analysis features previously stubbed on Neo4j using the
synthetic case-level dataset in DuckDB (tables: cases, case_people,
case_accounts). Exposes:

  * GET /network/organized-groups  — co-offending communities (union-find over
    co-accused pairs) with a node/edge graph per group. Response shape matches
    the old Neo4j endpoint so the frontend renders it unchanged.
  * GET /network/repeat-offenders  — persons accused in >= min_firs cases.
  * GET /network/person/{person_id} — ego network for one person.

All data is SYNTHETIC demonstration data (is_synthetic=True in every row).
"""
from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends, Query

from app.chat.data.query import run_query
from app.core.dependencies import get_current_active_user
from app.core.logging import get_logger

logger = get_logger("network.api")

router = APIRouter(
    prefix="/network",
    tags=["network"],
    dependencies=[Depends(get_current_active_user)],
)


# ── Helpers ──────────────────────────────────────────────────────────────
def _risk_score(fir_count: int) -> int:
    """Map an accused person's FIR count to a 0-100 risk score."""
    return min(30 + fir_count * 15, 98)


def _co_accused_pairs() -> list[dict]:
    """Pairs of persons accused in the same FIR, with pair frequency."""
    res = run_query(
        "SELECT a.person_id AS p1, a.name AS n1, b.person_id AS p2, b.name AS n2, "
        "COUNT(DISTINCT a.fir_number) AS shared_firs "
        "FROM case_people a JOIN case_people b "
        "ON a.fir_number = b.fir_number AND a.person_id < b.person_id "
        "WHERE a.role = 'accused' AND b.role = 'accused' "
        "GROUP BY a.person_id, a.name, b.person_id, b.name",
        max_rows=5000,
    )
    return res.rows


def _accused_stats() -> dict[str, dict]:
    """person_id -> {name, fir_count, districts, firs} for all accused."""
    res = run_query(
        "SELECT person_id, ANY_VALUE(name) AS name, COUNT(DISTINCT fir_number) AS fir_count, "
        "LIST(DISTINCT fir_number) AS firs "
        "FROM case_people WHERE role = 'accused' GROUP BY person_id",
        max_rows=5000,
    )
    return {r["person_id"]: r for r in res.rows}


# ── Endpoints ────────────────────────────────────────────────────────────
@router.get("/organized-groups", summary="Detect organized co-offending groups")
def organized_groups(limit: int = Query(8, ge=1, le=25),
                     min_members: int = Query(3, ge=2, le=10)):
    pairs = _co_accused_pairs()
    stats = _accused_stats()

    # Union-find over co-accused pairs.
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for p in pairs:
        union(p["p1"], p["p2"])

    components: dict[str, set[str]] = defaultdict(set)
    for pid in parent:
        components[find(pid)].add(pid)

    groups = sorted((m for m in components.values() if len(m) >= min_members),
                    key=len, reverse=True)[:limit]

    out = []
    for gid, members in enumerate(groups, start=1):
        nodes, edges = [], []
        member_list = sorted(members)

        # Person nodes.
        for pid in member_list:
            s = stats.get(pid, {})
            nodes.append({
                "id": pid,
                "label": "Person",
                "properties": {
                    "name": s.get("name", pid),
                    "role": "accused",
                    "risk_score": _risk_score(int(s.get("fir_count", 1))),
                    "fir_count": int(s.get("fir_count", 1)),
                },
            })

        # Co-accused edges within the group.
        for p in pairs:
            if p["p1"] in members and p["p2"] in members:
                edges.append({"source": p["p1"], "target": p["p2"],
                              "type": "CO_ACCUSED", "weight": int(p["shared_firs"])})

        # Shared locations (areas where >= 2 members offended).
        placeholders = ",".join(f"'{pid}'" for pid in member_list)
        loc = run_query(
            "SELECT c.area AS area, c.district AS district, "
            "LIST(DISTINCT p.person_id) AS people "
            "FROM cases c JOIN case_people p ON c.fir_number = p.fir_number "
            f"WHERE p.role = 'accused' AND p.person_id IN ({placeholders}) "
            "GROUP BY c.area, c.district HAVING COUNT(DISTINCT p.person_id) >= 2",
            max_rows=50,
        )
        for row in loc.rows:
            loc_id = f"L-{row['area']}"
            nodes.append({"id": loc_id, "label": "Location",
                          "properties": {"name": f"{row['area']}, {row['district']}"}})
            for pid in row["people"]:
                edges.append({"source": pid, "target": loc_id, "type": "SHARED_LOCATION"})

        # Shared financial accounts.
        acc = run_query(
            "SELECT account_id, ANY_VALUE(bank) AS bank, ANY_VALUE(number_masked) AS number_masked, "
            "LIST(DISTINCT holder_person_id) AS holders "
            f"FROM case_accounts WHERE holder_person_id IN ({placeholders}) "
            "GROUP BY account_id",
            max_rows=50,
        )
        for row in acc.rows:
            acc_id = row["account_id"]
            nodes.append({"id": acc_id, "label": "BankAccount",
                          "properties": {"name": f"{row['bank']}-{row['number_masked']}",
                                         "account_no": row["number_masked"]}})
            for pid in row["holders"]:
                if pid in members:
                    edges.append({"source": pid, "target": acc_id, "type": "TRANSFERRED_TO"})

        shared_fir_total = sum(int(p["shared_firs"]) for p in pairs
                               if p["p1"] in members and p["p2"] in members)
        n = len(member_list)
        cohesion = round(len([e for e in edges if e["type"] == "CO_ACCUSED"]) / (n * (n - 1) / 2), 3) if n > 1 else 0

        out.append({
            "group_id": gid,
            "size": n,
            "shared_fir_count": shared_fir_total,
            "cohesion": min(cohesion, 1.0),
            "is_synthetic": True,
            "graph": {"nodes": nodes, "edges": edges,
                      "node_count": len(nodes), "edge_count": len(edges)},
        })
    return out


@router.get("/repeat-offenders", summary="Repeat offenders across cases")
def repeat_offenders(min_firs: int = Query(2, ge=2, le=10),
                     limit: int = Query(25, ge=1, le=100)):
    res = run_query(
        "SELECT p.person_id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.age) AS age, "
        "ANY_VALUE(p.district) AS home_district, "
        "COUNT(DISTINCT p.fir_number) AS fir_count, "
        "LIST(DISTINCT c.crime_type) AS crime_types, "
        "LIST(DISTINCT p.fir_number) AS firs "
        "FROM case_people p JOIN cases c ON p.fir_number = c.fir_number "
        "WHERE p.role = 'accused' GROUP BY p.person_id "
        f"HAVING COUNT(DISTINCT p.fir_number) >= {int(min_firs)} "
        f"ORDER BY fir_count DESC LIMIT {int(limit)}",
        max_rows=200,
    )
    return {
        "is_synthetic": True,
        "offenders": [
            {**row, "risk_score": _risk_score(int(row["fir_count"]))}
            for row in res.rows
        ],
    }


@router.get("/person/{person_id}", summary="Ego network for a person")
def person_network(person_id: str):
    safe = person_id.replace("'", "")
    firs = run_query(
        "SELECT c.fir_number, c.date, c.district, c.crime_type, c.status "
        "FROM cases c JOIN case_people p ON c.fir_number = p.fir_number "
        f"WHERE p.person_id = '{safe}' ORDER BY c.date",
        max_rows=100,
    )
    associates = run_query(
        "SELECT DISTINCT b.person_id, b.name, b.role "
        "FROM case_people a JOIN case_people b "
        "ON a.fir_number = b.fir_number AND b.person_id != a.person_id "
        f"WHERE a.person_id = '{safe}'",
        max_rows=100,
    )
    accounts = run_query(
        "SELECT DISTINCT account_id, bank, number_masked "
        f"FROM case_accounts WHERE holder_person_id = '{safe}'",
        max_rows=20,
    )
    return {
        "person_id": person_id,
        "is_synthetic": True,
        "cases": firs.rows,
        "associates": associates.rows,
        "accounts": accounts.rows,
    }


@router.get("/full", summary="Full criminal network graph (CSV/DuckDB-backed)")
def network_full(node_limit: int = Query(300, ge=50, le=800),
                 edge_limit: int = Query(800, ge=100, le=3000)):
    """Flat node/edge graph linking accused, victims, FIRs, districts and
    bank accounts — built entirely from the synthetic case CSVs in DuckDB.

    Node labels: Person (properties.role = accused|victim), FIR, Location,
    Account. Edge types: INVOLVED_IN (person→FIR), CO_ACCUSED (person↔person),
    HOLDS (person→account), IN_DISTRICT (FIR→location).

    The graph is focused on the most-connected subnetwork: top repeat
    offenders, their cases, co-accused, victims and accounts.
    """
    nodes: list[dict] = []
    edges: list[dict] = []
    seen: set[str] = set()

    def add_node(node_id: str, label: str, props: dict) -> None:
        if node_id not in seen:
            seen.add(node_id)
            nodes.append({"id": node_id, "label": label, "properties": props})

    # 1) Top accused by case count (the interesting core of the network).
    top_n_accused = max(20, node_limit // 6)
    accused = run_query(
        "SELECT p.person_id, ANY_VALUE(p.name) AS name, ANY_VALUE(p.age) AS age, "
        "ANY_VALUE(p.gender) AS gender, COUNT(DISTINCT p.fir_number) AS fir_count "
        "FROM case_people p WHERE p.role = 'accused' "
        "GROUP BY p.person_id ORDER BY fir_count DESC "
        f"LIMIT {top_n_accused}",
        max_rows=top_n_accused + 5,
    ).rows
    accused_ids = [r["person_id"] for r in accused]
    if not accused_ids:
        return {"nodes": [], "edges": [], "total_nodes": 0, "total_edges": 0,
                "accused_count": 0, "victim_count": 0, "fir_count": 0,
                "account_count": 0, "location_count": 0, "is_synthetic": True}
    placeholders = ",".join(f"'{p}'" for p in accused_ids)

    for r in accused:
        add_node(r["person_id"], "Person", {
            "name": r["name"], "role": "accused", "age": r["age"],
            "gender": r["gender"], "fir_count": int(r["fir_count"]),
            "risk_score": _risk_score(int(r["fir_count"])),
        })

    # 2) Their most recent FIRs (budgeted to roughly half the node limit).
    fir_budget = max(40, node_limit // 2 - len(nodes))
    firs = run_query(
        "SELECT DISTINCT c.fir_number, c.date, c.district, c.crime_type, c.status "
        "FROM cases c JOIN case_people p ON c.fir_number = p.fir_number "
        f"WHERE p.person_id IN ({placeholders}) AND p.role = 'accused' "
        f"ORDER BY c.date DESC LIMIT {fir_budget}",
        max_rows=fir_budget + 5,
    ).rows
    fir_ids = [r["fir_number"] for r in firs]
    fir_ph = ",".join(f"'{f}'" for f in fir_ids)
    for r in firs:
        add_node(r["fir_number"], "FIR", {
            "name": r["fir_number"], "date": str(r["date"]),
            "district": r["district"], "crime_type": r["crime_type"],
            "status": r["status"],
        })
        # District location node + IN_DISTRICT edge.
        loc_id = f"D-{r['district']}"
        add_node(loc_id, "Location", {"name": r["district"]})
        edges.append({"source": r["fir_number"], "target": loc_id,
                      "type": "IN_DISTRICT", "properties": {}})

    if fir_ids:
        # 3) All people on those FIRs (adds victims; caps applied by node room).
        people = run_query(
            "SELECT p.fir_number, p.person_id, p.name, p.role, p.age, p.gender "
            f"FROM case_people p WHERE p.fir_number IN ({fir_ph})",
            max_rows=3000,
        ).rows
        victim_room = max(0, node_limit - len(nodes) - 40)
        victims_added = 0
        for r in people:
            if r["role"] == "victim":
                if r["person_id"] not in seen and victims_added >= victim_room:
                    continue
                if r["person_id"] not in seen:
                    victims_added += 1
                add_node(r["person_id"], "Person", {
                    "name": r["name"], "role": "victim",
                    "age": r["age"], "gender": r["gender"],
                })
            if r["person_id"] in seen:
                edges.append({"source": r["person_id"], "target": r["fir_number"],
                              "type": "INVOLVED_IN", "properties": {"role": r["role"]}})

        # 4) Co-accused edges among the selected accused on those FIRs.
        by_fir: dict[str, list[str]] = defaultdict(list)
        for r in people:
            if r["role"] == "accused" and r["person_id"] in seen:
                by_fir[r["fir_number"]].append(r["person_id"])
        pair_seen: set[tuple[str, str]] = set()
        for members in by_fir.values():
            members = sorted(set(members))
            for i in range(len(members)):
                for j in range(i + 1, len(members)):
                    pair = (members[i], members[j])
                    if pair not in pair_seen:
                        pair_seen.add(pair)
                        edges.append({"source": pair[0], "target": pair[1],
                                      "type": "CO_ACCUSED", "properties": {}})

    # 5) Bank accounts held by the selected accused.
    accounts = run_query(
        "SELECT DISTINCT account_id, bank, number_masked, holder_person_id "
        f"FROM case_accounts WHERE holder_person_id IN ({placeholders})",
        max_rows=200,
    ).rows
    for r in accounts:
        if len(nodes) >= node_limit:
            break
        add_node(r["account_id"], "Account", {
            "name": f"{r['bank']}-{r['number_masked']}", "bank": r["bank"],
        })
        edges.append({"source": r["holder_person_id"], "target": r["account_id"],
                      "type": "HOLDS", "properties": {}})

    # Clamp edges to the requested limit and to known nodes only.
    edges = [e for e in edges if e["source"] in seen and e["target"] in seen][:edge_limit]

    def count(label: str, role: str | None = None) -> int:
        return sum(1 for n in nodes if n["label"] == label
                   and (role is None or n["properties"].get("role") == role))

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "total_edges": len(edges),
        "accused_count": count("Person", "accused"),
        "victim_count": count("Person", "victim"),
        "fir_count": count("FIR"),
        "account_count": count("Account"),
        "location_count": count("Location"),
        "is_synthetic": True,
    }
