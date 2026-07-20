"""Repository layer: executes Cypher and returns normalized dict/records.

The repository is the ONLY place that talks to the Neo4j connection manager. It
never imports FastAPI or Pydantic — it returns raw ``neo4j`` node objects (via
``record.data()``) or primitive dicts, leaving shaping/serialization to the
service and schema layers.

Label and id-key interpolation (needed for variable-depth traversal and
shortest-path, which Cypher cannot parameterize) is guarded by
``_validate_label`` against the whitelist in ``app.graph.models.entities`` to
prevent injection.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.config import settings
from app.graph.connection import Neo4jConnectionManager
from app.graph.models.entities import NODE_ID_KEY, TRAVERSABLE_LABELS
from app.graph.repositories import cypher


class GraphRepository:
    def __init__(self, connection: Neo4jConnectionManager) -> None:
        self._conn = connection

    # ── Validation helpers ────────────────────────────────────────────────
    @staticmethod
    def _validate_label(label: str) -> str:
        if label not in TRAVERSABLE_LABELS:
            raise ValueError(f"unsupported node label: {label!r}")
        return label

    @staticmethod
    def _id_key(label: str) -> str:
        key = NODE_ID_KEY.get(label)
        if not key:
            raise ValueError(f"no id key configured for label {label!r}")
        return key

    @staticmethod
    def _clamp_depth(depth: int) -> int:
        return max(1, min(int(depth), settings.GRAPH_MAX_DEPTH))

    # ── Existence ─────────────────────────────────────────────────────────
    def node_exists(self, label: str, node_id: str) -> bool:
        self._validate_label(label)
        query = cypher.NODE_EXISTS_TEMPLATE.format(id_key=self._id_key(label))
        rows = self._conn.run_read(query, {"node_id": node_id})
        return bool(rows and rows[0].get("c", 0) > 0)

    # ── 1. Person ego network ─────────────────────────────────────────────
    def person_network(self, person_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.PERSON_NETWORK, {"person_id": person_id})

    # ── 2. Accused ↔ FIR ──────────────────────────────────────────────────
    def accused_of_fir(self, fir_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.ACCUSED_OF_FIR, {"fir_id": fir_id})

    def person_accused_firs(self, person_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.PERSON_ACCUSED_FIRS, {"person_id": person_id}
        )

    # ── 3. Victim / Witness ↔ FIR ─────────────────────────────────────────
    def victims_of_fir(self, fir_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.VICTIMS_OF_FIR, {"fir_id": fir_id})

    def witnesses_of_fir(self, fir_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.WITNESSES_OF_FIR, {"fir_id": fir_id})

    # ── 4. FIR ↔ Crime ────────────────────────────────────────────────────
    def fir_crimes(self, fir_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.FIR_CRIMES, {"fir_id": fir_id})

    # ── 5. Crime ↔ Location ───────────────────────────────────────────────
    def fir_locations(self, fir_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.FIR_LOCATIONS, {"fir_id": fir_id})

    def crime_locations(self, category_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.CRIME_LOCATIONS, {"category_id": category_id}
        )

    # ── 6/7. Person ↔ Phone / Account ─────────────────────────────────────
    def person_phones(self, person_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.PERSON_PHONES, {"person_id": person_id})

    def person_accounts(self, person_id: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.PERSON_ACCOUNTS, {"person_id": person_id})

    # ── Associates ────────────────────────────────────────────────────────
    def direct_associates(
        self, person_id: str, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.DIRECT_ASSOCIATES,
            {"person_id": person_id, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    # ── 8. Common associates ──────────────────────────────────────────────
    def common_associates(
        self, person_id: str, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.COMMON_ASSOCIATES,
            {"person_id": person_id, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    def common_associates_pair(
        self, person_a: str, person_b: str, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.COMMON_ASSOCIATES_PAIR,
            {
                "person_a": person_a,
                "person_b": person_b,
                "limit": limit or settings.GRAPH_DEFAULT_LIMIT,
            },
        )

    # ── 9. Repeat offenders ───────────────────────────────────────────────
    def repeat_offenders(
        self, min_firs: int = 2, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.REPEAT_OFFENDERS,
            {"min_firs": min_firs, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    # ── 10. Organized crime groups ────────────────────────────────────────
    def organized_group_pairs(
        self, min_shared_firs: int = 1, limit: int = 500
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.ORGANIZED_GROUPS,
            {"min_shared_firs": min_shared_firs, "limit": limit},
        )

    def group_internal_edges(self, ids: list[str]) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.GROUP_INTERNAL_EDGES, {"ids": ids})

    def group_nodes(self, ids: list[str]) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.GROUP_NODES, {"ids": ids})

    # ── 11. Full network traversal ────────────────────────────────────────
    def full_network(
        self, label: str, root_id: str, depth: int, path_limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        self._validate_label(label)
        query = cypher.FULL_NETWORK_TEMPLATE.format(
            id_key=self._id_key(label), depth=self._clamp_depth(depth)
        )
        return self._conn.run_read(
            query,
            {
                "root_id": root_id,
                "path_limit": path_limit or settings.GRAPH_MAX_NODES,
            },
        )

    # ── 12. Shortest path ─────────────────────────────────────────────────
    def shortest_path(
        self,
        src_label: str,
        src_id: str,
        dst_label: str,
        dst_id: str,
        max_depth: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        self._validate_label(src_label)
        self._validate_label(dst_label)
        query = cypher.SHORTEST_PATH_TEMPLATE.format(
            src_key=self._id_key(src_label),
            dst_key=self._id_key(dst_label),
            max_depth=self._clamp_depth(max_depth or settings.GRAPH_MAX_DEPTH),
        )
        return self._conn.run_read(query, {"src_id": src_id, "dst_id": dst_id})

    # ── Search ────────────────────────────────────────────────────────────
    def search(
        self, q: str, label: Optional[str] = None, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        params = {"q": q, "limit": limit or settings.GRAPH_DEFAULT_LIMIT}
        if label:
            self._validate_label(label)
            params["label"] = label
            return self._conn.run_read(cypher.SEARCH_BY_LABEL, params)
        return self._conn.run_read(cypher.SEARCH_ANY, params)

    def list_firs(self, limit: int = 100) -> list[dict[str, Any]]:
        query = """
        MATCH (f:FIR)
        RETURN f.fir_id AS fir_id,
               f.crime_type AS crime_type,
               f.sections AS sections,
               f.status AS status,
               f.date AS date,
               f.modus_operandi AS modus_operandi,
               f.district AS district
        ORDER BY f.date DESC
        LIMIT $limit
        """
        return self._conn.run_read(query, {"limit": limit})

