# Financial Crime & Transaction Link Analysis (Feature 7)

Money-trail, transaction-network, and suspicious-activity analysis over the
existing **Neo4j** graph. Fully additive: the only existing file touched is
`app/main.py` (one router registration).

> Read-only over the graph. Does not modify the Neo4j schema, ingestion,
> PostgreSQL schema, Auth/RBAC, or the Graph module.

## Reuse (no duplication)

| Reused from | What |
|---|---|
| `app.graph.connection` | `Neo4jConnectionManager`, `get_graph`, `GraphConnectionError` — same driver/pool |
| `app.graph.models.entities` | `NodeLabel`, `RelType`, `NODE_ID_KEY`, `GraphNode` normalizer |
| `app.graph.services.graph_service` | `_node_out` node serialization |
| `app.graph.schemas.graph` | `NodeOut`, `EdgeOut`, `GraphResponse` payload primitives |
| `app.core.dependencies` | `require_permissions`, `get_current_active_user`, `get_client_ip` |
| `app.services.audit` | `audit.record` |

## Layout

```
app/financial/
├── dependencies.py            # get_financial_service (reuses get_graph)
├── models/entities.py         # financial-scoped constants (reuses graph vocab)
├── schemas/financial.py       # TransactionOut, AccountProfile, MoneyTrail, ...
├── repositories/
│   ├── cypher.py              # centralized, parameterized Cypher catalog
│   └── financial_repository.py
├── services/financial_service.py   # shaping + money-trail/circular/suspicious logic
└── routers/financial.py            # 8 REST endpoints (financial:read + audited)
```

## Endpoints (prefix `/api/v1`, all require `financial:read`)

| Method & Path | Purpose |
|---|---|
| `GET /financial/accounts/{account_no}` | Account profile: owners, in/out txns, linked accounts |
| `GET /financial/person/{person_id}` | Person ↔ account ↔ transaction traversal |
| `GET /financial/transactions` | Transaction lookup (amount / method / account filters) |
| `GET /financial/money-trail` | Multi-hop downstream tracing from an account |
| `GET /financial/network` | Financial network around an account or person |
| `GET /financial/suspicious` | High-value + circular flows + pass-through accounts |
| `GET /financial/search` | Search accounts / persons |
| `GET /financial/path` | Shortest directional money path between two accounts |

## Cypher coverage (`repositories/cypher.py`)

Transaction lookup · account relationship analysis · money trail · multi-hop
tracing · linked-account discovery · suspicious-network detection · circular
money-flow detection · high-value filtering · Person↔Account↔Transaction traversal.

## Design notes

- **Transactions are relationships** (`TRANSFERRED_TO` / `RECEIVED_FROM` with
  `{transaction_id, amount, date, method}`). Queries return the endpoint account
  nodes alongside each relationship so `TransactionOut` carries real
  `source_account` / `target_account`.
- **Money-trail & path** follow the *direction* of funds (`-[:TRANSFERRED_TO]->`),
  walking `_transform`-ed alternating paths into `MoneyTrailHop` lists.
- **Circular flows**: `(a)-[:TRANSFERRED_TO*2..N]->(a)` with an amount floor.
- **Suspicious** combines high-value transfers, circular flows, and
  pass-through/layering accounts (large in *and* large out).
- **Same guardrails as the Graph module**: bound parameters only; labels/depths
  validated + clamped (`GRAPH_MAX_DEPTH`, `GRAPH_MAX_NODES`); `OPTIONAL MATCH`
  for sparse edges; 404 / 400 / 503 error mapping, each also audited.

## Test

```bash
cd backend
python tests/test_financial.py       # fake Neo4j + in-memory SQLite; no services
# or isolated:  python -m pytest tests/test_financial.py -v
```

Covers auth 401, RBAC 403, all 8 endpoints, filtering, money-trail hop
correctness, circular-flow + suspicious detection, 404/400/503, and audit
capture (16 checks).
