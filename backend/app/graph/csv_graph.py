"""CSV-based Crime Network Graph Builder.

Reads the three synthetic case CSVs once at module load and builds an in-memory
graph.  All public functions return plain dicts / lists that match the existing
Pydantic schemas in ``app.graph.schemas.graph`` so the router layer needs no
changes.

Graph model
-----------
Nodes
  - Person    : accused and victims from case_people.csv
  - FIR       : cases from cases.csv
  - Location  : distinct district values
  - Account   : bank accounts from case_accounts.csv

Edges
  - Person  -[INVOLVED_IN {role}]-> FIR
  - Accused -[CO_ACCUSED  {shared_firs}]-> Accused  (share ≥1 FIR)
  - Person  -[HOLDS]-> Account
  - FIR     -[IN_DISTRICT]-> Location
"""
from __future__ import annotations

import os
from collections import defaultdict
from typing import Any

import pandas as pd

# ---------------------------------------------------------------------------
# Paths – datasets live two directories above the backend package
# ---------------------------------------------------------------------------
_BASE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
_SYNTH = os.path.join(_BASE, "datasets", "synthetic_cases")

_CASES_CSV    = os.path.join(_SYNTH, "cases.csv")
_PEOPLE_CSV   = os.path.join(_SYNTH, "case_people.csv")
_ACCOUNTS_CSV = os.path.join(_SYNTH, "case_accounts.csv")


# ---------------------------------------------------------------------------
# Internal graph representation
# ---------------------------------------------------------------------------
class _Graph:
    def __init__(self) -> None:
        # nodes[id] = {"id": ..., "label": ..., "properties": {...}}
        self.nodes: dict[str, dict] = {}
        # edges = [{"source": ..., "target": ..., "type": ..., "properties": {...}}]
        self.edges: list[dict] = []

    def add_node(self, node_id: str, label: str, **props: Any) -> None:
        if node_id not in self.nodes:
            self.nodes[node_id] = {"id": node_id, "label": label, "properties": props}

    def add_edge(self, source: str, target: str, rel_type: str, **props: Any) -> None:
        self.edges.append({"source": source, "target": target, "type": rel_type, "properties": props})


# ---------------------------------------------------------------------------
# Build the graph (lazy-loaded singleton)
# ---------------------------------------------------------------------------
_GRAPH: _Graph | None = None


def _build() -> _Graph:
    g = _Graph()

    # ── Load CSVs ──────────────────────────────────────────────────────────
    try:
        cases_df   = pd.read_csv(_CASES_CSV)
        people_df  = pd.read_csv(_PEOPLE_CSV)
        accounts_df = pd.read_csv(_ACCOUNTS_CSV)
    except FileNotFoundError as exc:
        raise RuntimeError(f"Synthetic CSV not found: {exc}") from exc

    # ── FIR nodes + Location nodes ─────────────────────────────────────────
    for _, row in cases_df.iterrows():
        fir_id   = str(row["fir_number"])
        district = str(row.get("district", "Unknown"))
        crime    = str(row.get("crime_type", "Unknown"))
        status   = str(row.get("status", "Unknown"))
        mo       = str(row.get("modus_operandi", ""))
        sections = str(row.get("sections", ""))
        date     = str(row.get("date", ""))

        g.add_node(fir_id, "FIR",
                   fir_number=fir_id, crime_type=crime, status=status,
                   modus_operandi=mo, sections=sections, date=date,
                   district=district)

        loc_id = f"LOC-{district.upper().replace(' ', '_')}"
        g.add_node(loc_id, "Location", name=district, district=district)

        g.add_edge(fir_id, loc_id, "IN_DISTRICT")

    # ── Person nodes + INVOLVED_IN edges ──────────────────────────────────
    # Track accused → set of FIRs for later CO_ACCUSED edges
    accused_firs: dict[str, set[str]] = defaultdict(set)

    for _, row in people_df.iterrows():
        fir_id    = str(row["fir_number"])
        person_id = str(row["person_id"])
        name      = str(row.get("name", person_id))
        role      = str(row.get("role", "unknown"))
        age       = int(row["age"]) if pd.notna(row.get("age")) else 0
        gender    = str(row.get("gender", ""))
        district  = str(row.get("district", ""))

        g.add_node(person_id, "Person",
                   name=name, role=role, age=age, gender=gender,
                   district=district, person_id=person_id)

        if fir_id in g.nodes:
            g.add_edge(person_id, fir_id, "INVOLVED_IN", role=role)

        if role == "accused":
            accused_firs[person_id].add(fir_id)

    # ── Account nodes + HOLDS edges ────────────────────────────────────────
    for _, row in accounts_df.iterrows():
        acc_id    = str(row["account_id"])
        fir_id    = str(row["fir_number"])
        bank      = str(row.get("bank", ""))
        masked    = str(row.get("number_masked", ""))
        holder_id = str(row.get("holder_person_id", ""))

        g.add_node(acc_id, "Account",
                   account_id=acc_id, bank=bank, number_masked=masked,
                   holder_person_id=holder_id)

        if holder_id and holder_id in g.nodes:
            g.add_edge(holder_id, acc_id, "HOLDS")

    # ── CO_ACCUSED edges (accused sharing ≥1 FIR) ─────────────────────────
    accused_list = list(accused_firs.keys())
    for i, a in enumerate(accused_list):
        for b in accused_list[i + 1:]:
            shared = accused_firs[a] & accused_firs[b]
            if shared:
                g.add_edge(a, b, "CO_ACCUSED", shared_firs=len(shared))

    return g


def _get_graph() -> _Graph:
    global _GRAPH
    if _GRAPH is None:
        _GRAPH = _build()
    return _GRAPH


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_organized_groups(min_shared_firs: int = 1, limit: int = 50) -> list[dict]:
    """Return groups of accused who share FIRs, shaped like OrganizedGroupOut."""
    g = _get_graph()

    # Build adjacency for accused via CO_ACCUSED edges
    adj: dict[str, set[str]] = defaultdict(set)
    shared_count: dict[tuple, int] = {}
    for edge in g.edges:
        if edge["type"] == "CO_ACCUSED":
            sc = edge["properties"].get("shared_firs", 1)
            if sc >= min_shared_firs:
                adj[edge["source"]].add(edge["target"])
                adj[edge["target"]].add(edge["source"])
                shared_count[(edge["source"], edge["target"])] = sc

    # Connected-component detection (BFS)
    visited: set[str] = set()
    components: list[set[str]] = []

    accused_nodes = {
        nid for nid, n in g.nodes.items()
        if n["label"] == "Person" and n["properties"].get("role") == "accused"
    }

    for start in accused_nodes:
        if start in visited:
            continue
        component: set[str] = set()
        queue = [start]
        while queue:
            cur = queue.pop()
            if cur in visited:
                continue
            visited.add(cur)
            component.add(cur)
            queue.extend(adj[cur] - visited)
        if len(component) >= 2:          # only multi-person groups
            components.append(component)

    # Sort by size descending, cap at limit
    components.sort(key=len, reverse=True)
    components = components[:limit]

    # Build OrganizedGroupOut-compatible dicts
    result: list[dict] = []
    for gid, members in enumerate(components, start=1):
        member_nodes = [g.nodes[m] for m in members if m in g.nodes]

        # Collect internal edges
        internal_edges = [
            e for e in g.edges
            if e["source"] in members and e["target"] in members
        ]

        # Collect FIRs touched by group members
        fir_ids: set[str] = set()
        for e in g.edges:
            if e["type"] == "INVOLVED_IN" and e["source"] in members:
                fir_ids.add(e["target"])

        max_possible = len(members) * (len(members) - 1) / 2
        cohesion = len(internal_edges) / max_possible if max_possible > 0 else 0.0

        # Build NodeOut-compatible list for members
        members_out = [
            {
                "id":         n["id"],
                "label":      n["label"],
                "properties": n["properties"],
            }
            for n in member_nodes
        ]

        # Build a subgraph (nodes + edges) for the group
        graph_nodes = list(members_out)
        graph_edge_objs = []

        for e in internal_edges:
            graph_edge_objs.append({
                "source":     e["source"],
                "target":     e["target"],
                "type":       e["type"],
                "properties": e["properties"],
            })

        # Attach FIR nodes & their edges to graph
        for fir_id in list(fir_ids)[:20]:   # cap per group
            if fir_id in g.nodes:
                graph_nodes.append({
                    "id":         fir_id,
                    "label":      g.nodes[fir_id]["label"],
                    "properties": g.nodes[fir_id]["properties"],
                })
                for e in g.edges:
                    if e["type"] == "INVOLVED_IN" and e["target"] == fir_id and e["source"] in members:
                        graph_edge_objs.append({
                            "source":     e["source"],
                            "target":     fir_id,
                            "type":       e["type"],
                            "properties": e["properties"],
                        })

        graph_payload = {
            "nodes":      graph_nodes,
            "edges":      graph_edge_objs,
            "node_count": len(graph_nodes),
            "edge_count": len(graph_edge_objs),
            "truncated":  False,
        }

        result.append({
            "group_id":           gid,
            "size":               len(members),
            "members":            members_out,
            "shared_fir_count":   len(fir_ids),
            "internal_edge_count": len(internal_edges),
            "cohesion":           round(cohesion, 4),
            "graph":              graph_payload,
        })

    return result


def get_network_summary() -> dict:
    """Return aggregate stats about the full network."""
    g = _get_graph()
    persons  = [n for n in g.nodes.values() if n["label"] == "Person"]
    accused  = [n for n in persons if n["properties"].get("role") == "accused"]
    victims  = [n for n in persons if n["properties"].get("role") == "victim"]
    firs     = [n for n in g.nodes.values() if n["label"] == "FIR"]
    accounts = [n for n in g.nodes.values() if n["label"] == "Account"]
    locs     = [n for n in g.nodes.values() if n["label"] == "Location"]

    return {
        "total_nodes":    len(g.nodes),
        "total_edges":    len(g.edges),
        "accused_count":  len(accused),
        "victim_count":   len(victims),
        "fir_count":      len(firs),
        "account_count":  len(accounts),
        "location_count": len(locs),
    }


def get_all_nodes_flat(limit: int = 300) -> list[dict]:
    """Return all nodes as a flat list (for full-network visualization)."""
    g = _get_graph()
    nodes = list(g.nodes.values())[:limit]
    return [{"id": n["id"], "label": n["label"], "properties": n["properties"]} for n in nodes]


def get_all_edges_flat(limit: int = 800) -> list[dict]:
    """Return all edges as a flat list (for full-network visualization)."""
    g = _get_graph()
    return [
        {"source": e["source"], "target": e["target"],
         "type": e["type"], "properties": e["properties"]}
        for e in g.edges[:limit]
    ]
