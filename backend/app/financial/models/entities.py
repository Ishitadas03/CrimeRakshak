"""Domain constants for the Financial Crime module.

Reuses the canonical labels/relationship-types and node normalizers from the
Graph module (``app.graph.models.entities``) — nothing is duplicated here. This
module only adds financial-specific groupings (the transaction relationship
types and the account/person id keys) so the repository/service layers read
cleanly.
"""
from __future__ import annotations

# Reuse the shared graph vocabulary — do NOT redefine labels/rel-types.
from app.graph.models.entities import (  # noqa: F401  (re-exported for callers)
    NODE_ID_KEY,
    GraphEdge,
    GraphNode,
    NodeLabel,
    RelType,
)

# Relationship types that represent a monetary movement between accounts.
TRANSACTION_RELS = (RelType.TRANSFERRED_TO, RelType.RECEIVED_FROM)

# Labels the financial endpoints accept as traversal roots / search scopes.
FINANCIAL_LABELS = frozenset({NodeLabel.PERSON, NodeLabel.BANK_ACCOUNT})

# Convenience id-key lookups (subset of the shared NODE_ID_KEY map).
ACCOUNT_ID_KEY = NODE_ID_KEY[NodeLabel.BANK_ACCOUNT]  # "account_no"
PERSON_ID_KEY = NODE_ID_KEY[NodeLabel.PERSON]         # "person_id"
