"""Block 6 — Investigator Decision Support tools (case-level data).

These tools operate on the *case-level* graph (Person / FIR / BankAccount /
PhoneNumber) rather than the aggregate CSV stats. They are registered as agent
tools so the chatbot routes investigator questions ("summarise FIR-2024-1234",
"any leads?", "similar cases?") here automatically.

Data source strategy: the rich synthetic case CSVs (1200 FIRs with crime type,
modus operandi, accused/victims, districts) are the primary source via
:mod:`app.graph.csv_graph`. Neo4j is consulted only for FIRs the CSV graph does
not know (e.g. externally ingested ones). If neither source has the FIR the
tool returns a soft ``error`` so the agent can tell the user rather than crash.

Every tool returns grounded fields plus a ``_source`` list describing the query
used, for Block 9 explainability.
"""
from __future__ import annotations

from app.graph import csv_graph
from app.graph.connection import GraphConnectionError, graph_connection
from app.graph.repositories.graph_repository import GraphRepository
from app.graph.services.graph_service import GraphNotFoundError, GraphService
from app.core.logging import get_logger

logger = get_logger("chat.graph_tools")


def _service() -> GraphService:
    return GraphService(GraphRepository(graph_connection))


def _names(nodes) -> list[str]:
    """Human-readable labels for a list of NodeOut (name if present, else id)."""
    out = []
    for n in nodes:
        props = getattr(n, "properties", {}) or {}
        out.append(props.get("name") or props.get("fir_id") or n.id)
    return out


# ── case_summary ─────────────────────────────────────────────────────────
def case_summary(fir_id: str) -> dict:
    # Primary: rich CSV case graph.
    profile = csv_graph.get_fir_profile(fir_id)
    if profile is not None:
        fir_props = profile["fir"]["properties"]
        return {
            "fir_id": fir_id,
            "crime_type": fir_props.get("crime_type"),
            "modus_operandi": fir_props.get("modus_operandi"),
            "sections": fir_props.get("sections"),
            "status": fir_props.get("status"),
            "date": fir_props.get("date"),
            "district": fir_props.get("district"),
            "accused": [n["properties"].get("name", n["id"]) for n in profile["accused"]],
            "victims": [n["properties"].get("name", n["id"]) for n in profile["victims"]],
            "witnesses": [],
            "crimes": [n["properties"].get("name") for n in profile["crimes"]],
            "locations": [n["properties"].get("name") for n in profile["locations"]],
            "counts": {
                "accused": len(profile["accused"]),
                "victims": len(profile["victims"]),
                "witnesses": 0,
            },
            "_source": [f"case-csv: FIR profile of {fir_id}"],
        }
    # Fallback: Neo4j (externally ingested FIRs).
    try:
        p = _service().get_fir_profile(fir_id)
    except GraphNotFoundError as exc:
        return {"error": str(exc)}
    except GraphConnectionError:
        return {"error": f"FIR '{fir_id}' not found in case data and graph database unavailable"}
    return {
        "fir_id": fir_id,
        "accused": _names(p.accused),
        "victims": _names(p.victims),
        "witnesses": _names(p.witnesses),
        "crimes": _names(p.crimes),
        "locations": _names(p.locations),
        "counts": {
            "accused": len(p.accused),
            "victims": len(p.victims),
            "witnesses": len(p.witnesses),
        },
        "_source": [f"graph: FIR profile of {fir_id}"],
    }


# ── investigation_timeline ───────────────────────────────────────────────
_TIMELINE_CYPHER = """
MATCH (f:FIR {fir_id: $fir_id})
OPTIONAL MATCH (p:Person)-[:ACCUSED_IN]->(f)
OPTIONAL MATCH (p)-[:ACCUSED_IN]->(other:FIR)
WHERE other.fir_id <> $fir_id
RETURN f.date AS fir_date,
       collect(DISTINCT {person: p.name, fir_id: other.fir_id, date: other.date}) AS prior
"""


def investigation_timeline(fir_id: str) -> dict:
    # Primary: rich CSV case graph.
    result = csv_graph.get_fir_timeline(fir_id)
    if result is not None:
        return result
    # Fallback: Neo4j.
    try:
        rows = graph_connection.run_read(_TIMELINE_CYPHER, {"fir_id": fir_id})
    except GraphConnectionError:
        return {"error": f"FIR '{fir_id}' not found in case data and graph database unavailable"}
    if not rows:
        return {"error": f"FIR '{fir_id}' not found"}

    row = rows[0]
    events = [{"date": row.get("fir_date"), "event": f"FIR {fir_id} registered"}]
    for item in row.get("prior") or []:
        if item and item.get("fir_id"):
            events.append({
                "date": item.get("date"),
                "event": f"Accused {item.get('person')} also linked to {item.get('fir_id')}",
            })
    events.sort(key=lambda e: (e.get("date") is None, e.get("date")))
    return {
        "fir_id": fir_id,
        "timeline": events,
        "_source": [f"graph: timeline for {fir_id} (FIR + accused prior cases)"],
    }


# ── similar_cases ────────────────────────────────────────────────────────
_SIMILAR_CYPHER = """
MATCH (f:FIR {fir_id: $fir_id})
// 1) FIRs sharing an accused person
OPTIONAL MATCH (f)<-[:ACCUSED_IN]-(:Person)-[:ACCUSED_IN]->(g:FIR)
WHERE g.fir_id <> $fir_id
WITH f, collect(DISTINCT g.fir_id) AS shared_accused_firs
// 2) FIRs sharing a crime category
OPTIONAL MATCH (f)-[:CLASSIFIED_AS]->(c:CrimeCategory)<-[:CLASSIFIED_AS]-(h:FIR)
WHERE h.fir_id <> $fir_id
RETURN shared_accused_firs,
       collect(DISTINCT h.fir_id) AS same_category_firs
"""


def similar_cases(fir_id: str, limit: int = 10) -> dict:
    # Primary: rich CSV case graph.
    result = csv_graph.get_similar_cases(fir_id, limit)
    if result is not None:
        return result
    # Fallback: Neo4j.
    try:
        rows = graph_connection.run_read(_SIMILAR_CYPHER, {"fir_id": fir_id})
    except GraphConnectionError:
        return {"error": f"FIR '{fir_id}' not found in case data and graph database unavailable"}
    if not rows:
        return {"error": f"FIR '{fir_id}' not found"}

    shared = [x for x in (rows[0].get("shared_accused_firs") or []) if x]
    same_cat = [x for x in (rows[0].get("same_category_firs") or []) if x]

    # Rank: shared-accused matches are stronger than same-category matches.
    scored: dict[str, dict] = {}
    for fid in shared:
        scored.setdefault(fid, {"fir_id": fid, "reasons": [], "score": 0})
        scored[fid]["reasons"].append("shares an accused person")
        scored[fid]["score"] += 2
    for fid in same_cat:
        scored.setdefault(fid, {"fir_id": fid, "reasons": [], "score": 0})
        scored[fid]["reasons"].append("same crime category")
        scored[fid]["score"] += 1

    ranked = sorted(scored.values(), key=lambda x: x["score"], reverse=True)[:limit]
    return {
        "fir_id": fir_id,
        "similar_cases": ranked,
        "_source": [f"graph: similar cases to {fir_id} (shared accused / crime category)"],
    }


# ── suggest_leads ────────────────────────────────────────────────────────
_LEADS_ASSOCIATES_CYPHER = """
MATCH (f:FIR {fir_id: $fir_id})<-[:ACCUSED_IN]-(a:Person)
MATCH (a)-[r:ASSOCIATES_WITH]-(b:Person)
WHERE NOT (b)-[:ACCUSED_IN]->(f)
RETURN DISTINCT a.name AS accused, b.name AS lead,
       b.person_id AS lead_id, r.relation_type AS relation
LIMIT 25
"""

_LEADS_SHARED_ID_CYPHER = """
MATCH (f:FIR {fir_id: $fir_id})<-[:ACCUSED_IN]-(a:Person)
MATCH (a)-[:OWNS_PHONE|OWNS_ACCOUNT]->(x)<-[:OWNS_PHONE|OWNS_ACCOUNT]-(b:Person)
WHERE b <> a
RETURN DISTINCT a.name AS accused, b.name AS lead,
       b.person_id AS lead_id, labels(x)[0] AS shared_via
LIMIT 25
"""


def suggest_leads(fir_id: str) -> dict:
    # Primary: rich CSV case graph.
    result = csv_graph.get_fir_leads(fir_id)
    if result is not None:
        return result
    # Fallback: Neo4j.
    try:
        assoc = graph_connection.run_read(_LEADS_ASSOCIATES_CYPHER, {"fir_id": fir_id})
        shared = graph_connection.run_read(_LEADS_SHARED_ID_CYPHER, {"fir_id": fir_id})
    except GraphConnectionError:
        return {"error": f"FIR '{fir_id}' not found in case data and graph database unavailable"}

    leads = []
    for r in assoc:
        leads.append({
            "lead": r.get("lead"),
            "lead_id": r.get("lead_id"),
            "rationale": f"associate ({r.get('relation') or 'known'}) of accused {r.get('accused')}, not yet named in this FIR",
        })
    for r in shared:
        leads.append({
            "lead": r.get("lead"),
            "lead_id": r.get("lead_id"),
            "rationale": f"shares a {r.get('shared_via')} with accused {r.get('accused')}",
        })
    if not leads:
        return {"fir_id": fir_id, "leads": [], "note": "no unexplored associates or shared identifiers found",
                "_source": [f"graph: lead analysis for {fir_id}"]}
    return {
        "fir_id": fir_id,
        "leads": leads,
        "_source": [f"graph: lead analysis for {fir_id} (associates + shared phones/accounts)"],
    }
