"""Graph Intelligence service layer.

Transforms raw repository records into API schemas, applies node-count caps, and
implements the composite analytics (organized-group community stitching, network
assembly, path shaping). Routers call this layer only.

Errors:
  * ``GraphNotFoundError``  → HTTP 404 (subject entity missing)
  * ``GraphConnectionError`` (from the repo/connection) bubbles up → HTTP 503
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.config import settings
from app.graph.models.entities import GraphNode, NodeLabel
from app.graph.repositories.graph_repository import GraphRepository
from app.graph.schemas.graph import (
    AssociateOut,
    AssociatesResponse,
    EdgeOut,
    FIRProfile,
    GraphResponse,
    NodeOut,
    OrganizedGroupOut,
    PathHopOut,
    PathResponse,
    PersonProfile,
    RepeatOffenderOut,
    SearchResponse,
    SearchResultOut,
)


class GraphNotFoundError(Exception):
    """Raised when a requested entity does not exist in the graph."""


# ── Serialization helpers ─────────────────────────────────────────────────
def _node_out(raw: Any) -> Optional[NodeOut]:
    if raw is None:
        return None
    gn = GraphNode.from_neo4j(raw)
    return NodeOut(id=gn.id, label=gn.label, properties=gn.properties)


def _node_id(raw: Any) -> Optional[str]:
    out = _node_out(raw)
    return out.id if out else None


class GraphService:
    def __init__(self, repository: GraphRepository) -> None:
        self._repo = repository

    # ── Person profile / ego network ─────────────────────────────────────
    def get_person_profile(self, person_id: str) -> PersonProfile:
        if not self._repo.node_exists(NodeLabel.PERSON, person_id):
            raise GraphNotFoundError(f"person '{person_id}' not found")

        rows = self._repo.person_network(person_id)
        person_node: Optional[NodeOut] = None
        firs: list[NodeOut] = []
        associates: list[NodeOut] = []
        phones: list[NodeOut] = []
        accounts: list[NodeOut] = []

        nodes: dict[str, NodeOut] = {}
        edges: list[EdgeOut] = []

        if rows:
            row = rows[0]
            person_node = _node_out(row.get("root"))
            if person_node:
                nodes[person_node.id] = person_node

            for conn in row.get("connections", []) or []:
                neighbor = _node_out(conn.get("node"))
                rel = conn.get("rel")
                if neighbor is None:
                    continue
                nodes.setdefault(neighbor.id, neighbor)
                if person_node is not None and rel is not None:
                    rel_type = rel[1] if isinstance(rel, (list, tuple)) and len(rel) == 3 else "RELATED"
                    edges.append(
                        EdgeOut(
                            source=person_node.id,
                            target=neighbor.id,
                            type=rel_type,
                            properties={},
                        )
                    )
                # Bucket neighbors by label.
                if neighbor.label == NodeLabel.FIR:
                    firs.append(neighbor)
                elif neighbor.label == NodeLabel.PERSON:
                    associates.append(neighbor)
                elif neighbor.label == NodeLabel.PHONE:
                    phones.append(neighbor)
                elif neighbor.label == NodeLabel.BANK_ACCOUNT:
                    accounts.append(neighbor)

        graph = self._assemble_graph(list(nodes.values()), edges)
        return PersonProfile(
            person=person_node,
            firs=firs,
            associates=associates,
            phones=phones,
            accounts=accounts,
            graph=graph,
        )

    # ── FIR profile ───────────────────────────────────────────────────────
    def get_fir_profile(self, fir_id: str) -> FIRProfile:
        if not self._repo.node_exists(NodeLabel.FIR, fir_id):
            raise GraphNotFoundError(f"FIR '{fir_id}' not found")

        fir_node = NodeOut(id=fir_id, label=NodeLabel.FIR, properties={})
        accused = [
            n for r in self._repo.accused_of_fir(fir_id) if (n := _node_out(r.get("person")))
        ]
        victims = [
            n for r in self._repo.victims_of_fir(fir_id) if (n := _node_out(r.get("person")))
        ]
        witnesses = [
            n for r in self._repo.witnesses_of_fir(fir_id) if (n := _node_out(r.get("person")))
        ]

        crime_rows = self._repo.fir_crimes(fir_id)
        crimes: list[NodeOut] = []
        if crime_rows:
            for raw in crime_rows[0].get("crimes", []) or []:
                node = _node_out(raw)
                if node and node.id:
                    crimes.append(node)

        locations = [
            n for r in self._repo.fir_locations(fir_id) if (n := _node_out(r.get("location")))
        ]

        # Assemble a small graph: FIR at center, everything else spoked to it.
        nodes = {fir_node.id: fir_node}
        edges: list[EdgeOut] = []
        for group, rel in (
            (accused, "ACCUSED_IN"),
            (victims, "VICTIM_IN"),
            (witnesses, "WITNESS_IN"),
            (crimes, "CLASSIFIED_AS"),
            (locations, "OCCURRED_AT"),
        ):
            for n in group:
                nodes.setdefault(n.id, n)
                # Person→FIR direction for people; FIR→x for crimes/locations.
                if rel in ("ACCUSED_IN", "VICTIM_IN", "WITNESS_IN"):
                    edges.append(EdgeOut(source=n.id, target=fir_node.id, type=rel))
                else:
                    edges.append(EdgeOut(source=fir_node.id, target=n.id, type=rel))

        return FIRProfile(
            fir=fir_node,
            accused=accused,
            victims=victims,
            witnesses=witnesses,
            crimes=crimes,
            locations=locations,
            graph=self._assemble_graph(list(nodes.values()), edges),
        )

    # ── Associates (direct + common/2nd-degree) ──────────────────────────
    def get_associates(
        self, person_id: str, limit: Optional[int] = None
    ) -> AssociatesResponse:
        if not self._repo.node_exists(NodeLabel.PERSON, person_id):
            raise GraphNotFoundError(f"person '{person_id}' not found")

        direct: list[AssociateOut] = []
        for r in self._repo.direct_associates(person_id, limit):
            node = _node_out(r.get("person"))
            if node:
                direct.append(
                    AssociateOut(
                        person=node,
                        shared_connections=int(r.get("shared_connections", 0) or 0),
                        relation_types=[t for t in (r.get("relation_types") or []) if t],
                    )
                )

        common: list[AssociateOut] = []
        for r in self._repo.common_associates(person_id, limit):
            node = _node_out(r.get("person"))
            if node:
                common.append(
                    AssociateOut(
                        person=node,
                        shared_connections=int(r.get("shared_connections", 0) or 0),
                        relation_types=[],
                    )
                )

        return AssociatesResponse(
            person_id=person_id,
            direct_associates=direct,
            common_associates=common,
        )

    # ── Repeat offenders ──────────────────────────────────────────────────
    def get_repeat_offenders(
        self, min_firs: int = 2, limit: Optional[int] = None
    ) -> list[RepeatOffenderOut]:
        out: list[RepeatOffenderOut] = []
        for r in self._repo.repeat_offenders(min_firs, limit):
            node = _node_out(r.get("person"))
            if node:
                out.append(
                    RepeatOffenderOut(
                        person=node,
                        fir_count=int(r.get("fir_count", 0) or 0),
                        fir_ids=[i for i in (r.get("fir_ids") or []) if i],
                    )
                )
        return out

    # ── Organized crime groups ────────────────────────────────────────────
    def get_organized_groups(
        self, min_shared_firs: int = 1, limit: int = 50
    ) -> list[OrganizedGroupOut]:
        """Detect co-offending communities.

        1. Fetch co-accused + associated person pairs from Neo4j.
        2. Stitch pairs into connected components (union-find) in Python — plain
           Cypher can't compute components without GDS/APOC.
        3. For each component, pull member nodes + internal association edges and
           compute a cohesion score.
        """
        pairs = self._repo.organized_group_pairs(min_shared_firs=min_shared_firs)
        if not pairs:
            return []

        # ── Union-Find over person ids ──
        parent: dict[str, str] = {}
        shared_firs_by_pair: dict[tuple[str, str], int] = {}

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

        for row in pairs:
            a = _node_id(row.get("person_a"))
            b = _node_id(row.get("person_b"))
            if not a or not b:
                continue
            union(a, b)
            shared_firs_by_pair[tuple(sorted((a, b)))] = int(
                row.get("shared_firs", 0) or 0
            )

        # Group members by component root.
        components: dict[str, set[str]] = {}
        for node_id in list(parent.keys()):
            components.setdefault(find(node_id), set()).add(node_id)

        # Rank by size, keep only real groups (>= 2 members).
        ranked = sorted(
            (m for m in components.values() if len(m) >= 2),
            key=len,
            reverse=True,
        )[:limit]

        groups: list[OrganizedGroupOut] = []
        for idx, member_ids in enumerate(ranked, start=1):
            ids = sorted(member_ids)
            member_nodes = [
                n for r in self._repo.group_nodes(ids) if (n := _node_out(r.get("person")))
            ]
            edge_rows = self._repo.group_internal_edges(ids)
            internal_edges = len(edge_rows)
            shared_fir_total = sum(
                v for (a, b), v in shared_firs_by_pair.items() if a in member_ids and b in member_ids
            )
            n = len(ids)
            max_edges = n * (n - 1) / 2 if n > 1 else 1
            cohesion = round(internal_edges / max_edges, 3) if max_edges else 0.0
            groups.append(
                OrganizedGroupOut(
                    group_id=idx,
                    size=n,
                    members=member_nodes,
                    shared_fir_count=shared_fir_total,
                    internal_edge_count=internal_edges,
                    cohesion=min(cohesion, 1.0),
                )
            )
        return groups

    # ── Full network traversal ────────────────────────────────────────────
    def get_network(
        self, label: str, root_id: str, depth: int
    ) -> GraphResponse:
        if not self._repo.node_exists(label, root_id):
            raise GraphNotFoundError(f"{label} '{root_id}' not found")

        rows = self._repo.full_network(label, root_id, depth)
        nodes: dict[str, NodeOut] = {}
        edges: dict[tuple[str, str, str], EdgeOut] = {}

        for row in rows:
            root = _node_out(row.get("root"))
            if root:
                nodes.setdefault(root.id, root)
            for path in row.get("paths", []) or []:
                self._absorb_path(path, nodes, edges)

        return self._assemble_graph(list(nodes.values()), list(edges.values()))

    # ── Shortest path ─────────────────────────────────────────────────────
    def get_shortest_path(
        self,
        src_label: str,
        src_id: str,
        dst_label: str,
        dst_id: str,
        max_depth: Optional[int] = None,
    ) -> PathResponse:
        for label, nid in ((src_label, src_id), (dst_label, dst_id)):
            if not self._repo.node_exists(label, nid):
                raise GraphNotFoundError(f"{label} '{nid}' not found")

        rows = self._repo.shortest_path(src_label, src_id, dst_label, dst_id, max_depth)
        if not rows:
            return PathResponse(
                source_id=src_id, target_id=dst_id, found=False, length=0
            )

        path = rows[0].get("path")
        nodes: dict[str, NodeOut] = {}
        edges: dict[tuple[str, str, str], EdgeOut] = {}
        hops = self._path_to_hops(path, nodes, edges)

        return PathResponse(
            source_id=src_id,
            target_id=dst_id,
            found=True,
            length=max(len(hops) - 1, 0),
            hops=hops,
            graph=self._assemble_graph(list(nodes.values()), list(edges.values())),
        )

    # ── Search ────────────────────────────────────────────────────────────
    def search(
        self, q: str, label: Optional[str] = None, limit: Optional[int] = None
    ) -> SearchResponse:
        results: list[SearchResultOut] = []
        for r in self._repo.search(q, label, limit):
            node = _node_out(r.get("node"))
            if node:
                results.append(SearchResultOut(node=node, score=1.0))
        return SearchResponse(
            query=q, label=label, results=results, count=len(results)
        )

    # ── Internal graph-assembly utilities ─────────────────────────────────
    def _assemble_graph(
        self, nodes: list[NodeOut], edges: list[EdgeOut]
    ) -> GraphResponse:
        truncated = False
        if len(nodes) > settings.GRAPH_MAX_NODES:
            keep = {n.id for n in nodes[: settings.GRAPH_MAX_NODES]}
            nodes = nodes[: settings.GRAPH_MAX_NODES]
            edges = [e for e in edges if e.source in keep and e.target in keep]
            truncated = True
        return GraphResponse(
            nodes=nodes,
            edges=edges,
            node_count=len(nodes),
            edge_count=len(edges),
            truncated=truncated,
        )

    def _absorb_path(
        self,
        path: Any,
        nodes: dict[str, NodeOut],
        edges: dict[tuple[str, str, str], EdgeOut],
    ) -> None:
        """Fold a neo4j Path (from record.data(), rendered as a list) into the
        node/edge accumulators. ``record.data()`` renders a path as an
        alternating ``[node, rel, node, rel, node, ...]`` list."""
        if not isinstance(path, (list, tuple)):
            return
        prev_node: Optional[NodeOut] = None
        pending_rel: Optional[str] = None
        for i, element in enumerate(path):
            if i % 2 == 0:  # node position
                node = _node_out(element)
                if node is None:
                    prev_node = None
                    continue
                nodes.setdefault(node.id, node)
                if prev_node is not None and pending_rel is not None:
                    key = (prev_node.id, node.id, pending_rel)
                    edges.setdefault(
                        key,
                        EdgeOut(source=prev_node.id, target=node.id, type=pending_rel),
                    )
                prev_node = node
                pending_rel = None
            else:  # relationship position (dict of props from data())
                pending_rel = self._rel_type(element)

    def _path_to_hops(
        self,
        path: Any,
        nodes: dict[str, NodeOut],
        edges: dict[tuple[str, str, str], EdgeOut],
    ) -> list[PathHopOut]:
        hops: list[PathHopOut] = []
        if not isinstance(path, (list, tuple)):
            return hops
        prev_node: Optional[NodeOut] = None
        pending_rel: Optional[str] = None
        for i, element in enumerate(path):
            if i % 2 == 0:
                node = _node_out(element)
                if node is None:
                    continue
                nodes.setdefault(node.id, node)
                via = None
                if prev_node is not None and pending_rel is not None:
                    edge = EdgeOut(
                        source=prev_node.id, target=node.id, type=pending_rel
                    )
                    edges.setdefault((prev_node.id, node.id, pending_rel), edge)
                    via = edge
                hops.append(PathHopOut(node=node, via=via))
                prev_node = node
                pending_rel = None
            else:
                pending_rel = self._rel_type(element)
        return hops

    @staticmethod
    def _rel_type(element: Any) -> str:
        """Extract a relationship type from a data()-rendered relationship.

        ``record.data()`` renders a relationship as its type string when part of
        a path segment, or as a props dict; handle both defensively.
        """
        if isinstance(element, str):
            return element
        if isinstance(element, dict):
            return element.get("_type") or element.get("type") or "RELATED"
        return "RELATED"

    def list_firs(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = self._repo.list_firs(limit)
        return [
            {
                "fir_id": r.get("fir_id"),
                "crime_type": r.get("crime_type"),
                "sections": r.get("sections"),
                "status": r.get("status"),
                "date": r.get("date"),
                "modus_operandi": r.get("modus_operandi"),
                "district": r.get("district"),
            }
            for r in rows
        ]

