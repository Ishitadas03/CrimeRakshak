"""Repository layer for the Financial Crime module.

Talks only to the shared Neo4j connection manager (reused from the Graph
module). Returns raw ``_transform``-ed records; shaping is left to the service.
Depth interpolation is clamped to ``GRAPH_MAX_DEPTH`` and only ever an integer,
so no injection surface is introduced.
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.config import settings
from app.financial.models.entities import FINANCIAL_LABELS
from app.financial.repositories import cypher
from app.graph.connection import Neo4jConnectionManager


class FinancialRepository:
    def __init__(self, connection: Neo4jConnectionManager) -> None:
        self._conn = connection

    # ── helpers ───────────────────────────────────────────────────────────
    @staticmethod
    def _clamp_depth(depth: int) -> int:
        return max(1, min(int(depth), settings.GRAPH_MAX_DEPTH))

    @staticmethod
    def _validate_label(label: str) -> str:
        if label not in FINANCIAL_LABELS:
            raise ValueError(f"unsupported financial label: {label!r}")
        return label

    # ── existence ─────────────────────────────────────────────────────────
    def account_exists(self, account_no: str) -> bool:
        rows = self._conn.run_read(cypher.ACCOUNT_EXISTS, {"account_no": account_no})
        return bool(rows and rows[0].get("c", 0) > 0)

    def person_exists(self, person_id: str) -> bool:
        rows = self._conn.run_read(cypher.PERSON_EXISTS, {"person_id": person_id})
        return bool(rows and rows[0].get("c", 0) > 0)

    # ── account / person profiles ─────────────────────────────────────────
    def account_profile(self, account_no: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.ACCOUNT_PROFILE, {"account_no": account_no})

    def linked_accounts(self, account_no: str) -> list[dict[str, Any]]:
        return self._conn.run_read(cypher.LINKED_ACCOUNTS, {"account_no": account_no})

    def person_financials(
        self, person_id: str, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.PERSON_FINANCIALS,
            {"person_id": person_id, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    # ── transaction lookup / high-value ───────────────────────────────────
    def transactions(
        self,
        min_amount: float = 0.0,
        account: Optional[str] = None,
        method: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.TRANSACTIONS,
            {
                "min_amount": min_amount,
                "account": account,
                "method": method,
                "limit": limit or settings.GRAPH_DEFAULT_LIMIT,
            },
        )

    # ── money trail / multi-hop tracing ───────────────────────────────────
    def money_trail(
        self,
        account_no: str,
        depth: int,
        min_amount: float = 0.0,
        path_limit: Optional[int] = None,
    ) -> list[dict[str, Any]]:
        query = cypher.MONEY_TRAIL_TEMPLATE.format(depth=self._clamp_depth(depth))
        return self._conn.run_read(
            query,
            {
                "account_no": account_no,
                "min_amount": min_amount,
                "path_limit": path_limit or settings.GRAPH_MAX_NODES,
            },
        )

    # ── circular flow ─────────────────────────────────────────────────────
    def circular_flows(
        self, depth: int = 5, min_amount: float = 0.0, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        query = cypher.CIRCULAR_FLOW_TEMPLATE.format(depth=self._clamp_depth(depth))
        return self._conn.run_read(
            query,
            {"min_amount": min_amount, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    # ── pass-through / layering accounts ──────────────────────────────────
    def pass_through_accounts(
        self, threshold: float, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.PASS_THROUGH_ACCOUNTS,
            {"threshold": threshold, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    def suspicious_network(
        self, threshold: float, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.SUSPICIOUS_NETWORK,
            {"threshold": threshold, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )

    # ── network traversal ─────────────────────────────────────────────────
    def network(
        self, label: str, root_id: str, depth: int, path_limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        self._validate_label(label)
        clamped = self._clamp_depth(depth)
        template = (
            cypher.ACCOUNT_NETWORK_TEMPLATE
            if label == "BankAccount"
            else cypher.PERSON_NETWORK_TEMPLATE
        )
        query = template.format(depth=clamped)
        return self._conn.run_read(
            query,
            {"root_id": root_id, "path_limit": path_limit or settings.GRAPH_MAX_NODES},
        )

    # ── shortest money path ───────────────────────────────────────────────
    def money_path(
        self, src_account: str, dst_account: str, max_depth: Optional[int] = None
    ) -> list[dict[str, Any]]:
        query = cypher.MONEY_PATH_TEMPLATE.format(
            max_depth=self._clamp_depth(max_depth or settings.GRAPH_MAX_DEPTH)
        )
        return self._conn.run_read(query, {"src_id": src_account, "dst_id": dst_account})

    # ── search ────────────────────────────────────────────────────────────
    def search(
        self, q: str, label: Optional[str] = None, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        params = {"q": q, "limit": limit or settings.GRAPH_DEFAULT_LIMIT}
        if label:
            self._validate_label(label)
            params["label"] = label
            return self._conn.run_read(cypher.SEARCH_BY_LABEL, params)
        return self._conn.run_read(cypher.SEARCH_ANY, params)

    def search_transactions(
        self, q: str, limit: Optional[int] = None
    ) -> list[dict[str, Any]]:
        return self._conn.run_read(
            cypher.SEARCH_TRANSACTIONS,
            {"q": q, "limit": limit or settings.GRAPH_DEFAULT_LIMIT},
        )
