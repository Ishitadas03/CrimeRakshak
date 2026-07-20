# Graph Intelligence Module (Feature 2)

Criminal Network & Relationship Analysis over the existing **Neo4j** graph, built
into the same FastAPI backend as the Auth/RBAC module. Every endpoint reuses the
existing JWT authentication + RBAC middleware and records each query to the
PostgreSQL `audit_logs` table.

> This module only **reads** the graph. It does not modify the Neo4j schema, the
> ingestion pipeline, the PostgreSQL schema, or the Auth/RBAC module.

## Layout

```
app/graph/
├── connection.py              # Neo4jConnectionManager (lazy singleton driver)
│                              #   + label/type-preserving record transformer
├── dependencies.py            # get_graph_service / get_graph_repository
├── models/entities.py         # NodeLabel, RelType, NODE_ID_KEY, GraphNode/Edge
├── schemas/graph.py           # Pydantic response models
├── repositories/
│   ├── cypher.py              # centralized, parameterized Cypher catalog
│   └── graph_repository.py    # executes Cypher, validates labels (injection-safe)
├── services/graph_service.py  # shaping, node caps, union-find group detection
└── routers/graph.py           # 8 REST endpoints (RBAC-gated + audited)
```

## Endpoints (prefix `/api/v1`, all require `graph:read`)

| Method & Path | Purpose |
|---|---|
| `GET /graph/network?root_id=&label=&depth=` | Full network traversal around a root entity |
| `GET /graph/person/{person_id}` | Person profile: FIRs, associates, phones, accounts + ego graph |
| `GET /graph/fir/{fir_id}` | FIR profile: accused, victims, witnesses, crimes, locations |
| `GET /graph/associates/{person_id}` | Direct + common (2nd-degree) associates |
| `GET /graph/repeat-offenders?min_firs=` | Persons accused in ≥ N FIRs |
| `GET /graph/organized-groups?min_shared_firs=` | Co-offending communities |
| `GET /graph/search?q=&label=` | Search nodes by id/name |
| `GET /graph/path?source_id=&target_id=` | Shortest path between two entities |

## Cypher coverage (`repositories/cypher.py`)

Criminal relationship discovery · Accused↔FIR · Victim/Witness↔FIR · FIR↔Crime ·
Crime↔Location · Person↔Phone · Person↔BankAccount · Common associates ·
Repeat offenders · Organized-group seeding · Full-network traversal ·
Shortest path.

## Design notes

- **Connection manager** wraps the official driver (thread-safe, pooled) as a
  lazily-initialized process singleton. Importing the module never opens a
  connection, so the Postgres-only auth flows and unit tests run without Neo4j.
- **Injection safety**: all values are bound parameters (`$param`). The only
  interpolated tokens are node labels / id-keys / a clamped integer depth, each
  validated against a whitelist (`TRAVERSABLE_LABELS`) before use — Cypher can't
  parameterize labels or variable-length bounds.
- **Label/type preservation**: `record.data()` drops node labels and rel types;
  `connection._transform` renders neo4j `Node`/`Relationship`/`Path` into plain
  dicts carrying `_label` / `_type`, so serialization is lossless.
- **Organized-group detection** without GDS/APOC: Cypher returns co-offending +
  associated person *pairs*; the service stitches them into connected components
  via union-find and scores cohesion (internal edges / max possible).
- **Graceful degradation**: queries use `OPTIONAL MATCH` for edges the synthetic
  data may not populate yet (WITNESS_IN, OWNS_PHONE, OCCURRED_AT, …).
- **Error mapping**: subject missing → 404, invalid label/arg → 400, Neo4j
  unreachable → 503 — each also written to the audit log with `status=failure`.
- **Payload caps**: `GRAPH_MAX_NODES` / `GRAPH_MAX_DEPTH` guard huge traversals;
  responses set `truncated: true` when capped.

## Config (env, additive — see `.env.example`)

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
GRAPH_MAX_NODES=500
GRAPH_DEFAULT_LIMIT=100
GRAPH_MAX_DEPTH=5
```

## Test

```bash
cd backend
python tests/test_graph.py     # fake Neo4j + in-memory SQLite; no services needed
```

Health probe for the graph DB: `GET /health/graph`.
