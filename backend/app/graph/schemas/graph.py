"""Pydantic response/request schemas for the Graph Intelligence API."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Generic graph primitives ─────────────────────────────────────────────
class NodeOut(BaseModel):
    id: str = Field(..., description="Business id of the node (e.g. person_id)")
    label: str = Field(..., description="Neo4j node label, e.g. 'Person'")
    properties: dict[str, Any] = Field(default_factory=dict)


class EdgeOut(BaseModel):
    source: str = Field(..., description="Source node id")
    target: str = Field(..., description="Target node id")
    type: str = Field(..., description="Relationship type, e.g. 'ASSOCIATES_WITH'")
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphResponse(BaseModel):
    """A node-link graph payload consumable directly by the frontend."""

    nodes: list[NodeOut] = Field(default_factory=list)
    edges: list[EdgeOut] = Field(default_factory=list)
    node_count: int = 0
    edge_count: int = 0
    truncated: bool = Field(
        default=False,
        description="True if the result was capped by GRAPH_MAX_NODES.",
    )


# ── Endpoint-specific payloads ────────────────────────────────────────────
class PersonProfile(BaseModel):
    person: Optional[NodeOut] = None
    firs: list[NodeOut] = Field(default_factory=list)
    associates: list[NodeOut] = Field(default_factory=list)
    phones: list[NodeOut] = Field(default_factory=list)
    accounts: list[NodeOut] = Field(default_factory=list)
    graph: GraphResponse = Field(default_factory=GraphResponse)


class FIRProfile(BaseModel):
    fir: Optional[NodeOut] = None
    accused: list[NodeOut] = Field(default_factory=list)
    victims: list[NodeOut] = Field(default_factory=list)
    witnesses: list[NodeOut] = Field(default_factory=list)
    crimes: list[NodeOut] = Field(default_factory=list)
    locations: list[NodeOut] = Field(default_factory=list)
    graph: GraphResponse = Field(default_factory=GraphResponse)


class AssociateOut(BaseModel):
    person: NodeOut
    # Number of relationship hops / shared connections used to rank relevance.
    shared_connections: int = 0
    relation_types: list[str] = Field(default_factory=list)


class AssociatesResponse(BaseModel):
    person_id: str
    direct_associates: list[AssociateOut] = Field(default_factory=list)
    common_associates: list[AssociateOut] = Field(
        default_factory=list,
        description="Persons who share associates with the subject (2nd degree).",
    )


class RepeatOffenderOut(BaseModel):
    person: NodeOut
    fir_count: int
    fir_ids: list[str] = Field(default_factory=list)


class OrganizedGroupOut(BaseModel):
    group_id: int
    size: int
    members: list[NodeOut] = Field(default_factory=list)
    shared_fir_count: int = 0
    internal_edge_count: int = 0
    cohesion: float = Field(
        default=0.0,
        description="Ratio of internal edges to the max possible (0..1).",
    )


class SearchResultOut(BaseModel):
    node: NodeOut
    score: float = 1.0


class SearchResponse(BaseModel):
    query: str
    label: Optional[str] = None
    results: list[SearchResultOut] = Field(default_factory=list)
    count: int = 0


class PathHopOut(BaseModel):
    node: NodeOut
    # Relationship connecting the *previous* hop to this node (None for the root).
    via: Optional[EdgeOut] = None


class PathResponse(BaseModel):
    source_id: str
    target_id: str
    found: bool
    length: int = Field(default=0, description="Number of relationships in path")
    hops: list[PathHopOut] = Field(default_factory=list)
    graph: GraphResponse = Field(default_factory=GraphResponse)
