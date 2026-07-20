"""Domain constants and light-weight helpers for the graph model.

These describe the *canonical* Neo4j schema documented in
``db/neo4j_schema.cypher`` — node labels, relationship types, and the id
property used to look each node up. Repositories reference these constants so
that Cypher and application code stay in sync with the schema, and so a schema
change has a single edit point.

No ORM here: Neo4j is schema-flexible and the driver returns dict-shaped
records. Pydantic schemas (``app/graph/schemas``) handle serialization.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


# ── Node labels ──────────────────────────────────────────────────────────
class NodeLabel:
    PERSON = "Person"
    FIR = "FIR"
    BANK_ACCOUNT = "BankAccount"
    PHONE = "PhoneNumber"
    LOCATION = "Location"
    DISTRICT = "District"
    CRIME_CATEGORY = "CrimeCategory"


# ── Relationship types ───────────────────────────────────────────────────
class RelType:
    ASSOCIATES_WITH = "ASSOCIATES_WITH"
    ACCUSED_IN = "ACCUSED_IN"
    VICTIM_IN = "VICTIM_IN"
    WITNESS_IN = "WITNESS_IN"
    OWNS_PHONE = "OWNS_PHONE"
    CALLED = "CALLED"
    OWNS_ACCOUNT = "OWNS_ACCOUNT"
    TRANSFERRED_TO = "TRANSFERRED_TO"
    RECEIVED_FROM = "RECEIVED_FROM"
    OCCURRED_AT = "OCCURRED_AT"
    CONTAINS = "CONTAINS"
    RECORDED_CRIME = "RECORDED_CRIME"
    # FIR ↔ CrimeCategory classification (documented aggregate link reused for
    # case-level classification queries).
    CLASSIFIED_AS = "CLASSIFIED_AS"


# The unique-id property for each node label (see the Neo4j constraints).
NODE_ID_KEY: dict[str, str] = {
    NodeLabel.PERSON: "person_id",
    NodeLabel.FIR: "fir_id",
    NodeLabel.BANK_ACCOUNT: "account_no",
    NodeLabel.PHONE: "phone_no",
    NodeLabel.LOCATION: "location_id",
    NodeLabel.DISTRICT: "district_id",
    NodeLabel.CRIME_CATEGORY: "category_id",
}

# Labels that can be freely traversed by the generic network endpoints.
TRAVERSABLE_LABELS = frozenset(
    {
        NodeLabel.PERSON,
        NodeLabel.FIR,
        NodeLabel.BANK_ACCOUNT,
        NodeLabel.PHONE,
        NodeLabel.LOCATION,
        NodeLabel.CRIME_CATEGORY,
        NodeLabel.DISTRICT,
    }
)


@dataclass
class GraphNode:
    """Normalized representation of a Neo4j node for API responses."""

    id: str
    label: str
    properties: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_neo4j(cls, node: Any) -> "GraphNode":
        """Build from a ``neo4j.graph.Node`` or a ``dict`` produced by
        ``record.data()``. Chooses an id from the label's id key, falling back
        to the element id."""
        if node is None:
            return cls(id="", label="Unknown", properties={})

        # neo4j Node object exposes .labels and dict-like access.
        labels = list(getattr(node, "labels", []) or [])
        props = dict(node) if not isinstance(node, dict) else dict(node)
        label = labels[0] if labels else props.pop("_label", "Unknown")

        id_key = NODE_ID_KEY.get(label)
        node_id = None
        if id_key and id_key in props:
            node_id = props[id_key]
        if node_id is None:
            # Fallback: any *_id property, else element id.
            for k, v in props.items():
                if k.endswith("_id") or k in ("account_no", "phone_no"):
                    node_id = v
                    break
        if node_id is None:
            node_id = str(getattr(node, "element_id", "")) or "unknown"

        return cls(id=str(node_id), label=label, properties=props)


@dataclass
class GraphEdge:
    """Normalized representation of a Neo4j relationship."""

    source: str
    target: str
    type: str
    properties: dict[str, Any] = field(default_factory=dict)
