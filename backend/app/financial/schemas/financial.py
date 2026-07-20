"""Pydantic schemas for the Financial Crime & Transaction Link Analysis API.

Reuses ``NodeOut`` / ``EdgeOut`` / ``GraphResponse`` from the Graph module for
node-link payloads (no duplication) and adds transaction-centric models.
"""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

# Reuse the graph node-link primitives.
from app.graph.schemas.graph import EdgeOut, GraphResponse, NodeOut  # noqa: F401


class TransactionOut(BaseModel):
    """A single money movement (a TRANSFERRED_TO / RECEIVED_FROM edge)."""

    transaction_id: Optional[str] = None
    source_account: str = Field(..., description="Debited account_no")
    target_account: str = Field(..., description="Credited account_no")
    amount: float = 0.0
    date: Optional[str] = None
    method: Optional[str] = Field(None, description="e.g. NEFT / UPI / IMPS")
    type: str = Field(default="TRANSFERRED_TO", description="Relationship type")


class TransactionListResponse(BaseModel):
    count: int = 0
    total_amount: float = 0.0
    transactions: list[TransactionOut] = Field(default_factory=list)


class AccountProfile(BaseModel):
    account: Optional[NodeOut] = None
    owners: list[NodeOut] = Field(default_factory=list)
    incoming: list[TransactionOut] = Field(default_factory=list)
    outgoing: list[TransactionOut] = Field(default_factory=list)
    total_in: float = 0.0
    total_out: float = 0.0
    linked_accounts: list[NodeOut] = Field(default_factory=list)
    graph: GraphResponse = Field(default_factory=GraphResponse)


class PersonFinancialProfile(BaseModel):
    person: Optional[NodeOut] = None
    accounts: list[NodeOut] = Field(default_factory=list)
    transactions: list[TransactionOut] = Field(default_factory=list)
    total_in: float = 0.0
    total_out: float = 0.0
    graph: GraphResponse = Field(default_factory=GraphResponse)


class MoneyTrailHop(BaseModel):
    account: NodeOut
    # Transaction that moved money INTO this account from the previous hop.
    via: Optional[TransactionOut] = None


class MoneyTrailResponse(BaseModel):
    source_account: str
    max_depth: int
    trails: list[list[MoneyTrailHop]] = Field(
        default_factory=list,
        description="Each inner list is one downstream money path.",
    )
    graph: GraphResponse = Field(default_factory=GraphResponse)
    trail_count: int = 0


class CircularFlowOut(BaseModel):
    account_no: str
    length: int
    total_amount: float = 0.0
    accounts: list[str] = Field(default_factory=list)
    transactions: list[TransactionOut] = Field(default_factory=list)


class SuspiciousResponse(BaseModel):
    high_value: list[TransactionOut] = Field(default_factory=list)
    circular_flows: list[CircularFlowOut] = Field(default_factory=list)
    # Accounts that both receive and forward large sums (layering / pass-through).
    pass_through_accounts: list[NodeOut] = Field(default_factory=list)
    threshold: float = 0.0


class FinancialNetworkResponse(GraphResponse):
    """Node-link graph of accounts + transactions around a root entity."""

    root_id: str = ""
    root_label: str = ""


class FinancialSearchResult(BaseModel):
    node: NodeOut
    score: float = 1.0


class FinancialSearchResponse(BaseModel):
    query: str
    label: Optional[str] = None
    results: list[FinancialSearchResult] = Field(default_factory=list)
    count: int = 0


class FinancialPathResponse(BaseModel):
    source_account: str
    target_account: str
    found: bool
    length: int = 0
    hops: list[MoneyTrailHop] = Field(default_factory=list)
    total_amount: float = 0.0
    graph: GraphResponse = Field(default_factory=GraphResponse)
