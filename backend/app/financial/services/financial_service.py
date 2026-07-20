"""Financial Crime service layer.

Transforms repository records into API schemas and implements the composite
analytics (money-trail path walking, circular-flow assembly, suspicious-network
aggregation). Reuses the Graph module's node serialization helpers so node
handling is never duplicated.

Errors:
  * ``FinancialNotFoundError``       → HTTP 404 (subject entity missing)
  * ``GraphConnectionError`` (repo)  → HTTP 503 (bubbles up)
  * ``ValueError`` (bad label/arg)   → HTTP 400
"""
from __future__ import annotations

from typing import Any, Optional

from app.core.config import settings
from app.financial.models.entities import FINANCIAL_LABELS, NodeLabel
from app.financial.repositories.financial_repository import FinancialRepository
from app.financial.schemas.financial import (
    AccountProfile,
    CircularFlowOut,
    EdgeOut,
    FinancialNetworkResponse,
    FinancialPathResponse,
    FinancialSearchResponse,
    FinancialSearchResult,
    GraphResponse,
    MoneyTrailHop,
    MoneyTrailResponse,
    NodeOut,
    PersonFinancialProfile,
    SuspiciousResponse,
    TransactionListResponse,
    TransactionOut,
)

# Reuse the Graph module's node serialization — do not re-implement.
from app.graph.services.graph_service import _node_out  # noqa: F401


class FinancialNotFoundError(Exception):
    """Raised when a requested account or person does not exist."""


# ── Transaction serialization ──────────────────────────────────────────────
def _txn(src: Any, rel: Any, dst: Any) -> Optional[TransactionOut]:
    """Build a TransactionOut from (source node, relationship, target node)."""
    s = _node_out(src)
    d = _node_out(dst)
    props = rel if isinstance(rel, dict) else {}
    if s is None or d is None:
        return None
    return TransactionOut(
        transaction_id=props.get("transaction_id"),
        source_account=s.id,
        target_account=d.id,
        amount=float(props.get("amount") or 0),
        date=props.get("date"),
        method=props.get("method"),
        type=props.get("_type", "TRANSFERRED_TO"),
    )


class FinancialService:
    def __init__(self, repository: FinancialRepository) -> None:
        self._repo = repository

    # ── GET /financial/accounts/{account_no} ──────────────────────────────
    def get_account_profile(self, account_no: str) -> AccountProfile:
        if not self._repo.account_exists(account_no):
            raise FinancialNotFoundError(f"account '{account_no}' not found")

        rows = self._repo.account_profile(account_no)
        account = NodeOut(id=account_no, label=NodeLabel.BANK_ACCOUNT, properties={})
        owners: list[NodeOut] = []
        outgoing: list[TransactionOut] = []
        incoming: list[TransactionOut] = []

        if rows:
            row = rows[0]
            account = _node_out(row.get("account")) or account
            owners = [n for o in (row.get("owners") or []) if (n := _node_out(o))]
            for item in row.get("outgoing") or []:
                t = _txn(row.get("account"), item.get("rel"), item.get("node"))
                if t and t.target_account:
                    outgoing.append(t)
            for item in row.get("incoming") or []:
                t = _txn(item.get("node"), item.get("rel"), row.get("account"))
                if t and t.source_account:
                    incoming.append(t)

        linked = self._linked_accounts(account_no)
        total_in = round(sum(t.amount for t in incoming), 2)
        total_out = round(sum(t.amount for t in outgoing), 2)

        # Assemble a node-link graph: this account + counterparties + owners.
        nodes: dict[str, NodeOut] = {account.id: account}
        edges: list[EdgeOut] = []
        for o in owners:
            nodes.setdefault(o.id, o)
            edges.append(EdgeOut(source=o.id, target=account.id, type="OWNS_ACCOUNT"))
        for t in outgoing:
            nodes.setdefault(t.target_account, NodeOut(id=t.target_account, label=NodeLabel.BANK_ACCOUNT, properties={}))
            edges.append(self._txn_edge(t))
        for t in incoming:
            nodes.setdefault(t.source_account, NodeOut(id=t.source_account, label=NodeLabel.BANK_ACCOUNT, properties={}))
            edges.append(self._txn_edge(t))

        return AccountProfile(
            account=account,
            owners=owners,
            incoming=incoming,
            outgoing=outgoing,
            total_in=total_in,
            total_out=total_out,
            linked_accounts=linked,
            graph=self._assemble_graph(list(nodes.values()), edges),
        )

    def _linked_accounts(self, account_no: str) -> list[NodeOut]:
        rows = self._repo.linked_accounts(account_no)
        linked: list[NodeOut] = []
        seen: set[str] = set()
        if rows:
            for raw in rows[0].get("linked", []) or []:
                node = _node_out(raw)
                if node and node.id and node.id not in seen:
                    seen.add(node.id)
                    linked.append(node)
        return linked

    # ── GET /financial/person/{person_id} ─────────────────────────────────
    def get_person_financials(
        self, person_id: str, limit: Optional[int] = None
    ) -> PersonFinancialProfile:
        if not self._repo.person_exists(person_id):
            raise FinancialNotFoundError(f"person '{person_id}' not found")

        rows = self._repo.person_financials(person_id, limit)
        person = NodeOut(id=person_id, label=NodeLabel.PERSON, properties={})
        accounts: list[NodeOut] = []
        transactions: list[TransactionOut] = []

        if rows:
            row = rows[0]
            person = _node_out(row.get("person")) or person
            accounts = [n for a in (row.get("accounts") or []) if (n := _node_out(a))]
            for item in row.get("transactions") or []:
                t = _txn(item.get("src"), item.get("rel"), item.get("dst"))
                if t and t.source_account and t.target_account:
                    transactions.append(t)

        acc_ids = {a.id for a in accounts}
        total_out = round(sum(t.amount for t in transactions if t.source_account in acc_ids), 2)
        total_in = round(sum(t.amount for t in transactions if t.target_account in acc_ids), 2)

        # Graph: person -> owned accounts -> transactions.
        nodes: dict[str, NodeOut] = {person.id: person}
        edges: list[EdgeOut] = []
        for a in accounts:
            nodes.setdefault(a.id, a)
            edges.append(EdgeOut(source=person.id, target=a.id, type="OWNS_ACCOUNT"))
        for t in transactions:
            for acc in (t.source_account, t.target_account):
                nodes.setdefault(acc, NodeOut(id=acc, label=NodeLabel.BANK_ACCOUNT, properties={}))
            edges.append(self._txn_edge(t))

        return PersonFinancialProfile(
            person=person,
            accounts=accounts,
            transactions=transactions,
            total_in=total_in,
            total_out=total_out,
            graph=self._assemble_graph(list(nodes.values()), edges),
        )

    # ── GET /financial/transactions ───────────────────────────────────────
    def get_transactions(
        self,
        min_amount: float = 0.0,
        account: Optional[str] = None,
        method: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> TransactionListResponse:
        rows = self._repo.transactions(min_amount, account, method, limit)
        txns = [
            t for r in rows if (t := _txn(r.get("src"), r.get("rel"), r.get("dst")))
        ]
        return TransactionListResponse(
            count=len(txns),
            total_amount=round(sum(t.amount for t in txns), 2),
            transactions=txns,
        )

    # ── GET /financial/money-trail ────────────────────────────────────────
    def get_money_trail(
        self, account_no: str, depth: int = 3, min_amount: float = 0.0
    ) -> MoneyTrailResponse:
        if not self._repo.account_exists(account_no):
            raise FinancialNotFoundError(f"account '{account_no}' not found")

        rows = self._repo.money_trail(account_no, depth, min_amount)
        trails: list[list[MoneyTrailHop]] = []
        nodes: dict[str, NodeOut] = {}
        edges: dict[tuple[str, str], EdgeOut] = {}

        for row in rows:
            hops = self._path_to_hops(row.get("path"), nodes, edges)
            if hops:
                trails.append(hops)

        return MoneyTrailResponse(
            source_account=account_no,
            max_depth=min(int(depth), settings.GRAPH_MAX_DEPTH),
            trails=trails,
            trail_count=len(trails),
            graph=self._assemble_graph(list(nodes.values()), list(edges.values())),
        )

    # ── GET /financial/network ────────────────────────────────────────────
    def get_network(
        self, label: str, root_id: str, depth: int = 2
    ) -> FinancialNetworkResponse:
        # Validate the label up front so a bad label is a 400, not a 404.
        if label not in FINANCIAL_LABELS:
            raise ValueError(f"unsupported financial label: {label!r}")
        exists = (
            self._repo.account_exists(root_id)
            if label == NodeLabel.BANK_ACCOUNT
            else self._repo.person_exists(root_id)
        )
        if not exists:
            raise FinancialNotFoundError(f"{label} '{root_id}' not found")

        rows = self._repo.network(label, root_id, depth)
        nodes: dict[str, NodeOut] = {}
        edges: dict[tuple[str, str], EdgeOut] = {}
        for row in rows:
            root = _node_out(row.get("root"))
            if root:
                nodes.setdefault(root.id, root)
            for path in row.get("paths", []) or []:
                self._absorb_path(path, nodes, edges)

        base = self._assemble_graph(list(nodes.values()), list(edges.values()))
        return FinancialNetworkResponse(
            nodes=base.nodes,
            edges=base.edges,
            node_count=base.node_count,
            edge_count=base.edge_count,
            truncated=base.truncated,
            root_id=root_id,
            root_label=label,
        )

    # ── GET /financial/suspicious ─────────────────────────────────────────
    def get_suspicious(
        self, threshold: float, depth: int = 5, limit: Optional[int] = None
    ) -> SuspiciousResponse:
        high_rows = self._repo.suspicious_network(threshold, limit)
        high_value = [
            t for r in high_rows if (t := _txn(r.get("src"), r.get("rel"), r.get("dst")))
        ]

        circular = self._circular_flows(depth, threshold, limit)

        pass_rows = self._repo.pass_through_accounts(threshold, limit)
        pass_through = [
            n for r in pass_rows if (n := _node_out(r.get("account")))
        ]

        return SuspiciousResponse(
            high_value=high_value,
            circular_flows=circular,
            pass_through_accounts=pass_through,
            threshold=threshold,
        )

    def _circular_flows(
        self, depth: int, min_amount: float, limit: Optional[int]
    ) -> list[CircularFlowOut]:
        rows = self._repo.circular_flows(depth, min_amount, limit)
        out: list[CircularFlowOut] = []
        for row in rows:
            origin = _node_out(row.get("origin"))
            path = row.get("path")
            local_nodes: dict[str, NodeOut] = {}
            local_edges: dict[tuple[str, str], EdgeOut] = {}
            hops = self._path_to_hops(path, local_nodes, local_edges)
            accounts = [h.account.id for h in hops]
            txns = [h.via for h in hops if h.via is not None]
            out.append(
                CircularFlowOut(
                    account_no=origin.id if origin else (accounts[0] if accounts else ""),
                    length=max(len(accounts) - 1, 0),
                    total_amount=round(float(row.get("total") or 0), 2),
                    accounts=accounts,
                    transactions=txns,
                )
            )
        return out

    # ── GET /financial/search ─────────────────────────────────────────────
    def search(
        self, q: str, label: Optional[str] = None, limit: Optional[int] = None
    ) -> FinancialSearchResponse:
        results: list[FinancialSearchResult] = []
        for r in self._repo.search(q, label, limit):
            node = _node_out(r.get("node"))
            if node:
                results.append(FinancialSearchResult(node=node, score=1.0))
        return FinancialSearchResponse(
            query=q, label=label, results=results, count=len(results)
        )

    # ── GET /financial/path ───────────────────────────────────────────────
    def get_money_path(
        self, src_account: str, dst_account: str, max_depth: Optional[int] = None
    ) -> FinancialPathResponse:
        for acc in (src_account, dst_account):
            if not self._repo.account_exists(acc):
                raise FinancialNotFoundError(f"account '{acc}' not found")

        rows = self._repo.money_path(src_account, dst_account, max_depth)
        if not rows:
            return FinancialPathResponse(
                source_account=src_account,
                target_account=dst_account,
                found=False,
                length=0,
            )

        nodes: dict[str, NodeOut] = {}
        edges: dict[tuple[str, str], EdgeOut] = {}
        hops = self._path_to_hops(rows[0].get("path"), nodes, edges)
        total = round(sum(h.via.amount for h in hops if h.via), 2)

        return FinancialPathResponse(
            source_account=src_account,
            target_account=dst_account,
            found=True,
            length=max(len(hops) - 1, 0),
            hops=hops,
            total_amount=total,
            graph=self._assemble_graph(list(nodes.values()), list(edges.values())),
        )

    # ── internal helpers ──────────────────────────────────────────────────
    @staticmethod
    def _txn_edge(t: TransactionOut) -> EdgeOut:
        return EdgeOut(
            source=t.source_account,
            target=t.target_account,
            type=t.type,
            properties={
                "transaction_id": t.transaction_id,
                "amount": t.amount,
                "date": t.date,
                "method": t.method,
            },
        )

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

    def _path_to_hops(
        self,
        path: Any,
        nodes: dict[str, NodeOut],
        edges: dict[tuple[str, str], EdgeOut],
    ) -> list[MoneyTrailHop]:
        """Walk a ``_transform``-ed path (alternating [node, rel, node, ...])
        into a list of MoneyTrailHop, recording the incoming transaction on each
        non-root hop."""
        hops: list[MoneyTrailHop] = []
        if not isinstance(path, (list, tuple)):
            return hops
        prev_raw: Any = None
        prev_out: Optional[NodeOut] = None
        pending: Any = None
        for i, element in enumerate(path):
            if i % 2 == 0:  # node
                node = _node_out(element)
                if node is None:
                    continue
                nodes.setdefault(node.id, node)
                via = None
                if prev_raw is not None and pending is not None:
                    # Build the transaction from the RAW node elements, not the
                    # already-normalized NodeOut (which cannot be re-serialized).
                    via = _txn(prev_raw, pending, element)
                    if via and prev_out is not None:
                        edges.setdefault((prev_out.id, node.id), self._txn_edge(via))
                hops.append(MoneyTrailHop(account=node, via=via))
                prev_raw = element
                prev_out = node
                pending = None
            else:  # relationship dict
                pending = element
        return hops

    def _absorb_path(
        self,
        path: Any,
        nodes: dict[str, NodeOut],
        edges: dict[tuple[str, str], EdgeOut],
    ) -> None:
        """Fold a path into node/edge accumulators for the network endpoint.
        Handles OWNS_ACCOUNT (person↔account) as well as transaction edges."""
        if not isinstance(path, (list, tuple)):
            return
        prev: Optional[NodeOut] = None
        pending: Any = None
        for i, element in enumerate(path):
            if i % 2 == 0:
                node = _node_out(element)
                if node is None:
                    prev = None
                    continue
                nodes.setdefault(node.id, node)
                if prev is not None and pending is not None:
                    rel_type = pending.get("_type", "RELATED") if isinstance(pending, dict) else "RELATED"
                    props = {
                        k: v for k, v in (pending.items() if isinstance(pending, dict) else [])
                        if not k.startswith("_")
                    }
                    key = (prev.id, node.id)
                    edges.setdefault(
                        key,
                        EdgeOut(source=prev.id, target=node.id, type=rel_type, properties=props),
                    )
                prev = node
                pending = None
            else:
                pending = element
