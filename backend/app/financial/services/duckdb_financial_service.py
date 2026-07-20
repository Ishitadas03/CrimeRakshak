"""DuckDB-backed Financial Crime service (no Neo4j).

Implements the same public interface and Pydantic response contracts as the
Neo4j ``FinancialService`` so the router, RBAC and audit layers stay
untouched. Data comes from the synthetic case tables in DuckDB:

  case_accounts     account_id, bank, number_masked, holder_person_id, fir_number
  case_people       person_id, name, role, age, gender, district
  case_transactions transaction_id, from_account, to_account, amount, date,
                    method, fir_number

The whole ledger (~2.5k transactions) is cached in memory per DB mtime;
graph traversals (money trails, cycles, shortest paths) run as plain BFS/DFS.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import date
from functools import lru_cache
from typing import Optional

import duckdb

from app.core.config import settings
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
    StructuringFlagOut,
    SuspiciousResponse,
    TransactionListResponse,
    TransactionOut,
)
from app.financial.services.financial_service import FinancialNotFoundError
from app.graph.connection import GraphConnectionError

_ACCOUNT_KINDS = (("VAC", "victim"), ("COA", "cash-out"), ("AC", "mule"))


def _account_kind(acc_id: str) -> str:
    for prefix, kind in _ACCOUNT_KINDS:
        if acc_id.startswith(prefix):
            return kind
    return "unknown"


@dataclass
class _Ledger:
    accounts: dict = field(default_factory=dict)   # id -> {bank, masked, holders:set, firs:set}
    persons: dict = field(default_factory=dict)    # id -> {name, role, district}
    txns: list = field(default_factory=list)       # dicts
    out_adj: dict = field(default_factory=dict)    # account -> [txn index]
    in_adj: dict = field(default_factory=dict)
    accounts_of: dict = field(default_factory=dict)  # person -> [account ids]


@lru_cache(maxsize=2)
def _load_ledger(db_path: str, mtime: float) -> _Ledger:
    con = duckdb.connect(db_path, read_only=True)
    try:
        acc_rows = con.execute(
            "SELECT account_id, bank, number_masked, holder_person_id, fir_number FROM case_accounts"
        ).fetchall()
        person_rows = con.execute(
            "SELECT DISTINCT person_id, name, role, district FROM case_people"
        ).fetchall()
        txn_rows = con.execute(
            "SELECT transaction_id, from_account, to_account, amount, date, method, fir_number "
            "FROM case_transactions ORDER BY date"
        ).fetchall()
    finally:
        con.close()

    led = _Ledger()
    for pid, name, role, district in person_rows:
        # accused entries win over victim ones if an id ever appears twice
        if pid not in led.persons or role == "accused":
            led.persons[pid] = {"name": name, "role": role, "district": district}
    for acc_id, bank, masked, holder, fir in acc_rows:
        entry = led.accounts.setdefault(
            acc_id, {"bank": bank, "masked": masked, "holders": set(), "firs": set()}
        )
        if holder:
            entry["holders"].add(holder)
            led.accounts_of.setdefault(holder, [])
            if acc_id not in led.accounts_of[holder]:
                led.accounts_of[holder].append(acc_id)
        if fir:
            entry["firs"].add(fir)
    for i, (tid, src, dst, amount, dt, method, fir) in enumerate(txn_rows):
        led.txns.append({
            "transaction_id": tid, "src": src, "dst": dst,
            "amount": round(float(amount or 0), 2), "date": dt,
            "method": method, "fir_number": fir or None,
        })
        led.out_adj.setdefault(src, []).append(i)
        led.in_adj.setdefault(dst, []).append(i)
    return led


class DuckDBFinancialService:
    """Drop-in replacement for the Neo4j FinancialService."""

    def __init__(self) -> None:
        try:
            path = settings.DUCKDB_PATH
            self._led = _load_ledger(path, os.path.getmtime(path))
        except Exception as exc:  # missing file/table -> 503 at the router
            raise GraphConnectionError(f"financial data unavailable: {exc}") from exc

    # ── serialization helpers ─────────────────────────────────────────────
    def _account_node(self, acc_id: str) -> NodeOut:
        a = self._led.accounts.get(acc_id, {})
        holders = sorted(a.get("holders", ()))
        return NodeOut(id=acc_id, label="BankAccount", properties={
            "account_no": acc_id,
            "bank_name": a.get("bank"),
            "number_masked": a.get("masked"),
            "account_type": _account_kind(acc_id),
            "holder_ids": holders,
            "holder_names": [self._led.persons.get(h, {}).get("name") for h in holders],
            "fir_count": len(a.get("firs", ())),
            "is_synthetic": True,
        })

    def _person_node(self, pid: str) -> NodeOut:
        p = self._led.persons.get(pid, {})
        return NodeOut(id=pid, label="Person", properties={
            "person_id": pid, "name": p.get("name"), "role": p.get("role"),
            "district": p.get("district"), "is_synthetic": True,
        })

    def _holder_name(self, acc_id: str) -> Optional[str]:
        holders = self._led.accounts.get(acc_id, {}).get("holders", ())
        for h in sorted(holders):
            name = self._led.persons.get(h, {}).get("name")
            if name:
                return name
        return None

    def _txn_out(self, t: dict) -> TransactionOut:
        return TransactionOut(
            transaction_id=t["transaction_id"], source_account=t["src"],
            target_account=t["dst"], amount=t["amount"], date=t["date"],
            method=t["method"], fir_number=t.get("fir_number"),
            source_holder=self._holder_name(t["src"]),
            target_holder=self._holder_name(t["dst"]),
        )

    def _txn_edge(self, t: dict) -> EdgeOut:
        return EdgeOut(source=t["src"], target=t["dst"], type="TRANSFERRED_TO",
                       properties={"transaction_id": t["transaction_id"],
                                   "amount": t["amount"], "date": t["date"],
                                   "method": t["method"]})

    def _graph(self, account_ids: set, person_ids: set, txn_idx: list) -> GraphResponse:
        cap = settings.GRAPH_MAX_NODES
        truncated = len(account_ids) + len(person_ids) > cap
        acc_list = sorted(account_ids)[: cap]
        per_list = sorted(person_ids)[: max(0, cap - len(acc_list))]
        kept = set(acc_list)
        nodes = [self._account_node(a) for a in acc_list] + [self._person_node(p) for p in per_list]
        edges = [self._txn_edge(self._led.txns[i]) for i in txn_idx
                 if self._led.txns[i]["src"] in kept and self._led.txns[i]["dst"] in kept]
        for pid in per_list:
            for acc in self._led.accounts_of.get(pid, []):
                if acc in kept:
                    edges.append(EdgeOut(source=pid, target=acc, type="OWNS_ACCOUNT"))
        return GraphResponse(nodes=nodes, edges=edges, node_count=len(nodes),
                             edge_count=len(edges), truncated=truncated)

    def _require_account(self, account_no: str) -> None:
        if account_no not in self._led.accounts:
            raise FinancialNotFoundError(f"account '{account_no}' not found")

    # ── endpoint implementations ──────────────────────────────────────────
    def get_account_profile(self, account_no: str) -> AccountProfile:
        self._require_account(account_no)
        led = self._led
        inc = [led.txns[i] for i in led.in_adj.get(account_no, [])]
        out = [led.txns[i] for i in led.out_adj.get(account_no, [])]
        owners = sorted(led.accounts[account_no]["holders"])
        counterparties = {t["src"] for t in inc} | {t["dst"] for t in out}
        co_owned = {a for o in owners for a in led.accounts_of.get(o, []) if a != account_no}
        linked = sorted((counterparties | co_owned) - {account_no})
        txn_idx = led.in_adj.get(account_no, []) + led.out_adj.get(account_no, [])
        return AccountProfile(
            account=self._account_node(account_no),
            owners=[self._person_node(o) for o in owners],
            incoming=[self._txn_out(t) for t in sorted(inc, key=lambda t: -t["amount"])[:100]],
            outgoing=[self._txn_out(t) for t in sorted(out, key=lambda t: -t["amount"])[:100]],
            total_in=round(sum(t["amount"] for t in inc), 2),
            total_out=round(sum(t["amount"] for t in out), 2),
            linked_accounts=[self._account_node(a) for a in linked[:50]],
            graph=self._graph({account_no, *linked}, set(owners), txn_idx),
        )

    def get_person_financials(self, person_id: str, limit: int = 100) -> PersonFinancialProfile:
        led = self._led
        if person_id not in led.persons:
            raise FinancialNotFoundError(f"person '{person_id}' not found")
        accts = led.accounts_of.get(person_id, [])
        txn_idx: list[int] = []
        for a in accts:
            txn_idx += led.in_adj.get(a, []) + led.out_adj.get(a, [])
        txn_idx = sorted(set(txn_idx), key=lambda i: -led.txns[i]["amount"])
        txns = [led.txns[i] for i in txn_idx[:limit]]
        total_in = round(sum(led.txns[i]["amount"] for a in accts for i in led.in_adj.get(a, [])), 2)
        total_out = round(sum(led.txns[i]["amount"] for a in accts for i in led.out_adj.get(a, [])), 2)
        counterparties = {t["src"] for t in txns} | {t["dst"] for t in txns}
        return PersonFinancialProfile(
            person=self._person_node(person_id),
            accounts=[self._account_node(a) for a in accts],
            transactions=[self._txn_out(t) for t in txns],
            total_in=total_in, total_out=total_out,
            graph=self._graph(set(accts) | counterparties, {person_id}, txn_idx[:200]),
        )

    def get_transactions(self, min_amount: float = 0.0, account: Optional[str] = None,
                         method: Optional[str] = None, limit: int = 100) -> TransactionListResponse:
        rows = [t for t in self._led.txns
                if t["amount"] >= min_amount
                and (account is None or account in (t["src"], t["dst"]))
                and (method is None or (t["method"] or "").upper() == method.upper())]
        rows.sort(key=lambda t: -t["amount"])
        rows = rows[:limit]
        return TransactionListResponse(
            count=len(rows),
            total_amount=round(sum(t["amount"] for t in rows), 2),
            transactions=[self._txn_out(t) for t in rows],
        )

    def get_money_trail(self, account_no: str, depth: int = 3,
                        min_amount: float = 0.0) -> MoneyTrailResponse:
        self._require_account(account_no)
        led = self._led
        depth = min(depth, settings.GRAPH_MAX_DEPTH)
        trails: list[list[MoneyTrailHop]] = []
        seen_accounts: set = {account_no}
        seen_txns: list[int] = []

        def dfs(acc: str, path: list[MoneyTrailHop], visited: set) -> None:
            if len(trails) >= 25:
                return
            nxt = [i for i in led.out_adj.get(acc, [])
                   if led.txns[i]["amount"] >= min_amount and led.txns[i]["dst"] not in visited]
            if not nxt or len(path) > depth:
                if len(path) > 1:
                    trails.append(list(path))
                return
            for i in sorted(nxt, key=lambda i: -led.txns[i]["amount"])[:4]:
                t = led.txns[i]
                seen_accounts.add(t["dst"])
                seen_txns.append(i)
                path.append(MoneyTrailHop(account=self._account_node(t["dst"]), via=self._txn_out(t)))
                dfs(t["dst"], path, visited | {t["dst"]})
                path.pop()

        dfs(account_no, [MoneyTrailHop(account=self._account_node(account_no))], {account_no})
        return MoneyTrailResponse(
            source_account=account_no, max_depth=depth, trails=trails,
            graph=self._graph(seen_accounts, set(), sorted(set(seen_txns))),
            trail_count=len(trails),
        )

    def get_network(self, label: str, root_id: str, depth: int = 2) -> FinancialNetworkResponse:
        if label not in ("Person", "BankAccount"):
            raise ValueError(f"label must be Person or BankAccount, got '{label}'")
        led = self._led
        depth = min(depth, settings.GRAPH_MAX_DEPTH)
        if label == "Person":
            if root_id not in led.persons:
                raise FinancialNotFoundError(f"person '{root_id}' not found")
            frontier = set(led.accounts_of.get(root_id, []))
            persons = {root_id}
        else:
            self._require_account(root_id)
            frontier = {root_id}
            persons = set()
        accounts = set(frontier)
        txn_idx: set = set()
        for _ in range(depth):
            new_frontier: set = set()
            for acc in frontier:
                for i in led.out_adj.get(acc, []) + led.in_adj.get(acc, []):
                    t = led.txns[i]
                    txn_idx.add(i)
                    for peer in (t["src"], t["dst"]):
                        if peer not in accounts:
                            new_frontier.add(peer)
                persons.update(led.accounts.get(acc, {}).get("holders", ()))
            accounts |= new_frontier
            frontier = new_frontier
            if len(accounts) > settings.GRAPH_MAX_NODES:
                break
        g = self._graph(accounts, persons, sorted(txn_idx))
        return FinancialNetworkResponse(
            **g.model_dump(), root_id=root_id, root_label=label,
        )

    def get_suspicious(self, threshold: float = 100000.0, depth: int = 5,
                       limit: int = 100) -> SuspiciousResponse:
        led = self._led
        depth = min(depth, settings.GRAPH_MAX_DEPTH)

        high = sorted((t for t in led.txns if t["amount"] >= threshold),
                      key=lambda t: -t["amount"])[:limit]

        # Circular flows: directed cycles up to `depth` hops, deduped by node set.
        cycles: list[CircularFlowOut] = []
        seen_rings: set = set()
        for origin in sorted(led.out_adj):
            if len(cycles) >= 20:
                break

            def walk(acc: str, path_txns: list[int], visited: set) -> None:
                if len(cycles) >= 20 or len(path_txns) >= depth:
                    return
                for i in led.out_adj.get(acc, []):
                    t = led.txns[i]
                    if t["dst"] == origin and len(path_txns) >= 1:
                        ring = [led.txns[j] for j in path_txns] + [t]
                        key = frozenset(x["src"] for x in ring)
                        if key in seen_rings:
                            continue
                        seen_rings.add(key)
                        cycles.append(CircularFlowOut(
                            account_no=origin, length=len(ring),
                            total_amount=round(sum(x["amount"] for x in ring), 2),
                            accounts=[x["src"] for x in ring],
                            transactions=[self._txn_out(x) for x in ring],
                        ))
                    elif t["dst"] not in visited:
                        walk(t["dst"], path_txns + [i], visited | {t["dst"]})

            walk(origin, [], {origin})

        # Pass-through: at least one high-value transfer both in and out.
        pass_through = []
        for acc in sorted(led.accounts):
            max_in = max((led.txns[i]["amount"] for i in led.in_adj.get(acc, [])), default=0)
            max_out = max((led.txns[i]["amount"] for i in led.out_adj.get(acc, [])), default=0)
            if max_in >= threshold and max_out >= threshold:
                node = self._account_node(acc)
                node.properties["max_in"] = max_in
                node.properties["max_out"] = max_out
                pass_through.append(node)
        pass_through = pass_through[:limit]

        # Structuring: >=3 incoming transfers in the 40k-50k band within ~2 weeks.
        structuring: list[StructuringFlagOut] = []
        for acc in sorted(led.in_adj):
            band = sorted((led.txns[i] for i in led.in_adj[acc]
                           if 40_000 <= led.txns[i]["amount"] < 50_000),
                          key=lambda t: t["date"])
            if len(band) < 3:
                continue
            d0 = date.fromisoformat(band[0]["date"])
            d1 = date.fromisoformat(band[-1]["date"])
            span = (d1 - d0).days
            if span <= 15:
                structuring.append(StructuringFlagOut(
                    account_no=acc, txn_count=len(band),
                    total_amount=round(sum(t["amount"] for t in band), 2),
                    avg_amount=round(sum(t["amount"] for t in band) / len(band), 2),
                    span_days=span,
                ))
        structuring.sort(key=lambda s: -s.total_amount)

        return SuspiciousResponse(
            high_value=[self._txn_out(t) for t in high],
            circular_flows=cycles,
            pass_through_accounts=pass_through,
            structuring=structuring[:limit],
            threshold=threshold,
        )

    def search(self, q: str, label: Optional[str] = None, limit: int = 50) -> FinancialSearchResponse:
        if label is not None and label not in ("Person", "BankAccount"):
            raise ValueError(f"label must be Person or BankAccount, got '{label}'")
        ql = q.lower()
        results: list[FinancialSearchResult] = []
        if label in (None, "BankAccount"):
            for acc_id, a in self._led.accounts.items():
                hay = f"{acc_id} {a.get('bank') or ''} {a.get('masked') or ''}".lower()
                if ql in hay:
                    score = 1.0 if acc_id.lower().startswith(ql) else 0.8
                    results.append(FinancialSearchResult(node=self._account_node(acc_id), score=score))
        if label in (None, "Person"):
            for pid, p in self._led.persons.items():
                hay = f"{pid} {p.get('name') or ''}".lower()
                if ql in hay:
                    score = 1.0 if pid.lower().startswith(ql) else 0.8
                    results.append(FinancialSearchResult(node=self._person_node(pid), score=score))
        results.sort(key=lambda r: (-r.score, r.node.id))
        results = results[:limit]
        return FinancialSearchResponse(query=q, label=label, results=results, count=len(results))

    def get_money_path(self, source_account: str, target_account: str,
                       max_depth: int = 5) -> FinancialPathResponse:
        self._require_account(source_account)
        self._require_account(target_account)
        led = self._led
        max_depth = min(max_depth, settings.GRAPH_MAX_DEPTH)

        # BFS on directed transfers; keep the highest-amount edge per pair.
        parent: dict[str, tuple[str, int]] = {}
        frontier = [source_account]
        found = False
        for _ in range(max_depth):
            nxt: list[str] = []
            for acc in frontier:
                for i in led.out_adj.get(acc, []):
                    dst = led.txns[i]["dst"]
                    if dst == source_account or dst in parent:
                        continue
                    parent[dst] = (acc, i)
                    if dst == target_account:
                        found = True
                        break
                    nxt.append(dst)
                if found:
                    break
            if found or not nxt:
                break
            frontier = nxt

        hops: list[MoneyTrailHop] = []
        txn_idx: list[int] = []
        path_accounts: set = set()
        if found:
            # Walk back target -> source collecting (account, incoming txn) pairs.
            chain: list[tuple[str, Optional[int]]] = []
            cur = target_account
            while cur != source_account:
                prev, i = parent[cur]
                chain.append((cur, i))
                cur = prev
            chain.append((source_account, None))
            chain.reverse()
            for acc, i in chain:
                path_accounts.add(acc)
                via = self._txn_out(led.txns[i]) if i is not None else None
                hops.append(MoneyTrailHop(account=self._account_node(acc), via=via))
                if i is not None:
                    txn_idx.append(i)
        total = round(sum(h.via.amount for h in hops if h.via), 2)
        return FinancialPathResponse(
            source_account=source_account, target_account=target_account,
            found=found, length=max(0, len(hops) - 1), hops=hops, total_amount=total,
            graph=self._graph(path_accounts, set(), txn_idx),
        )
