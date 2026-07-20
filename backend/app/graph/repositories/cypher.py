"""Centralized Cypher query catalog.

Every query is written against the canonical Neo4j schema documented in
``db/neo4j_schema.cypher``. Where the synthetic data may not yet populate a
given edge (e.g. WITNESS_IN, OWNS_PHONE, OCCURRED_AT), the queries use
``OPTIONAL MATCH`` so they degrade gracefully to empty collections instead of
erroring or dropping the subject node.

All node/relationship parameters are bound (``$param``) — never string-formatted
— to prevent Cypher injection. The only value interpolated into query text is a
validated integer traversal depth (Cypher forbids parameterized variable-length
bounds), and it is clamped to ``GRAPH_MAX_DEPTH`` before interpolation.
"""
from __future__ import annotations

# ── 1. Criminal relationship discovery (ego network around a person) ──────
PERSON_NETWORK = """
MATCH (p:Person {person_id: $person_id})
OPTIONAL MATCH (p)-[r]-(n)
RETURN p AS root,
       collect(DISTINCT {rel: r, node: n}) AS connections
"""

# ── 2. Accused ↔ FIR ──────────────────────────────────────────────────────
ACCUSED_OF_FIR = """
MATCH (p:Person)-[r:ACCUSED_IN]->(f:FIR {fir_id: $fir_id})
RETURN p AS person, r AS rel
"""

PERSON_ACCUSED_FIRS = """
MATCH (p:Person {person_id: $person_id})-[r:ACCUSED_IN]->(f:FIR)
RETURN f AS fir, r AS rel
"""

# ── 3. Victim ↔ FIR ────────────────────────────────────────────────────────
VICTIMS_OF_FIR = """
MATCH (p:Person)-[r:VICTIM_IN]->(f:FIR {fir_id: $fir_id})
RETURN p AS person, r AS rel
"""

WITNESSES_OF_FIR = """
MATCH (p:Person)-[r:WITNESS_IN]->(f:FIR {fir_id: $fir_id})
RETURN p AS person, r AS rel
"""

# ── 4. FIR ↔ Crime (category) ──────────────────────────────────────────────
# Supports either an explicit CLASSIFIED_AS edge or the aggregate RECORDED_CRIME
# link, whichever the ingestion populated.
FIR_CRIMES = """
MATCH (f:FIR {fir_id: $fir_id})
OPTIONAL MATCH (f)-[rc:CLASSIFIED_AS]->(c:CrimeCategory)
OPTIONAL MATCH (f)-[:OCCURRED_AT]->(:Location)<-[:CONTAINS]-(:District)
      -[rr:RECORDED_CRIME]->(c2:CrimeCategory)
RETURN collect(DISTINCT c) + collect(DISTINCT c2) AS crimes
"""

# ── 5. Crime ↔ Location ────────────────────────────────────────────────────
FIR_LOCATIONS = """
MATCH (f:FIR {fir_id: $fir_id})-[r:OCCURRED_AT]->(l:Location)
RETURN l AS location, r AS rel
"""

CRIME_LOCATIONS = """
MATCH (c:CrimeCategory {category_id: $category_id})
OPTIONAL MATCH (f:FIR)-[:CLASSIFIED_AS]->(c)
OPTIONAL MATCH (f)-[:OCCURRED_AT]->(l:Location)
RETURN collect(DISTINCT l) AS locations
"""

# ── 6. Person ↔ Phone ──────────────────────────────────────────────────────
PERSON_PHONES = """
MATCH (p:Person {person_id: $person_id})-[r:OWNS_PHONE]->(ph:PhoneNumber)
RETURN ph AS phone, r AS rel
"""

# ── 7. Person ↔ Bank Account ───────────────────────────────────────────────
PERSON_ACCOUNTS = """
MATCH (p:Person {person_id: $person_id})-[r:OWNS_ACCOUNT]->(b:BankAccount)
RETURN b AS account, r AS rel
"""

# ── Person's direct associates ─────────────────────────────────────────────
DIRECT_ASSOCIATES = """
MATCH (p:Person {person_id: $person_id})-[r:ASSOCIATES_WITH]-(a:Person)
RETURN a AS person,
       collect(DISTINCT r.relation_type) AS relation_types,
       count(r) AS shared_connections
ORDER BY shared_connections DESC
LIMIT $limit
"""

# ── 8. Common associates (2nd-degree: people who share associates with subject)
COMMON_ASSOCIATES = """
MATCH (p:Person {person_id: $person_id})-[:ASSOCIATES_WITH]-(mutual:Person)
      -[:ASSOCIATES_WITH]-(candidate:Person)
WHERE candidate.person_id <> $person_id
  AND NOT (p)-[:ASSOCIATES_WITH]-(candidate)
RETURN candidate AS person,
       count(DISTINCT mutual) AS shared_connections,
       collect(DISTINCT mutual.person_id)[0..10] AS via
ORDER BY shared_connections DESC
LIMIT $limit
"""

# Common associates between TWO specific persons.
COMMON_ASSOCIATES_PAIR = """
MATCH (a:Person {person_id: $person_a})-[:ASSOCIATES_WITH]-(m:Person)
      -[:ASSOCIATES_WITH]-(b:Person {person_id: $person_b})
RETURN DISTINCT m AS person
LIMIT $limit
"""

# ── 9. Repeat offenders (accused in >= threshold FIRs) ─────────────────────
REPEAT_OFFENDERS = """
MATCH (p:Person)-[:ACCUSED_IN]->(f:FIR)
WITH p, count(DISTINCT f) AS fir_count, collect(DISTINCT f.fir_id) AS fir_ids
WHERE fir_count >= $min_firs
RETURN p AS person, fir_count, fir_ids
ORDER BY fir_count DESC
LIMIT $limit
"""

# ── 10. Organized crime group detection ────────────────────────────────────
# Heuristic community detection without GDS: find connected clusters of persons
# linked by ASSOCIATES_WITH that are also co-accused in shared FIRs. Groups are
# seeded from co-accused pairs, then expanded by shared association edges.
ORGANIZED_GROUPS = """
// Pairs of persons co-accused in the same FIR AND directly associated.
MATCH (p1:Person)-[:ACCUSED_IN]->(f:FIR)<-[:ACCUSED_IN]-(p2:Person)
WHERE p1.person_id < p2.person_id
  AND (p1)-[:ASSOCIATES_WITH]-(p2)
WITH p1, p2, count(DISTINCT f) AS shared_firs
WHERE shared_firs >= $min_shared_firs
// Collapse pairs into components via APOC-free iterative expansion is not
// available in plain Cypher; instead return the co-offending pairs and let the
// service layer stitch them into connected components.
RETURN p1 AS person_a, p2 AS person_b, shared_firs
ORDER BY shared_firs DESC
LIMIT $limit
"""

# Members + internal association edges for a given set of person ids
# (used by the service to compute cohesion for a detected component).
GROUP_INTERNAL_EDGES = """
MATCH (a:Person)-[r:ASSOCIATES_WITH]-(b:Person)
WHERE a.person_id IN $ids AND b.person_id IN $ids
  AND a.person_id < b.person_id
RETURN a.person_id AS source, b.person_id AS target,
       collect(DISTINCT r.relation_type) AS relation_types
"""

GROUP_NODES = """
MATCH (p:Person) WHERE p.person_id IN $ids
RETURN p AS person
"""

# ── 11. Full network traversal (variable-depth ego expansion) ──────────────
# ``$depth`` is interpolated (validated int) because Cypher cannot parameterize
# variable-length bounds. Node cap is enforced via LIMIT on the collected paths.
FULL_NETWORK_TEMPLATE = """
MATCH (root {{{id_key}: $root_id}})
CALL {{
    WITH root
    MATCH path = (root)-[*1..{depth}]-(n)
    RETURN path
    LIMIT $path_limit
}}
WITH collect(path) AS paths, root
RETURN root, paths
"""

# ── 12. Shortest path between two entities ─────────────────────────────────
# Labels/id-keys are validated against a whitelist before interpolation.
SHORTEST_PATH_TEMPLATE = """
MATCH (a {{{src_key}: $src_id}}), (b {{{dst_key}: $dst_id}})
MATCH path = shortestPath((a)-[*..{max_depth}]-(b))
RETURN path
"""

# ── Search (by id / name, optionally scoped to a label) ────────────────────
SEARCH_ANY = """
MATCH (n)
WHERE (
    toLower(coalesce(n.name, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.person_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.fir_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.account_no, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.phone_no, '')) CONTAINS toLower($q)
)
RETURN n AS node, labels(n) AS labels
LIMIT $limit
"""

SEARCH_BY_LABEL = """
MATCH (n)
WHERE $label IN labels(n)
  AND (
    toLower(coalesce(n.name, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.person_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.fir_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.account_no, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.phone_no, '')) CONTAINS toLower($q)
  )
RETURN n AS node, labels(n) AS labels
LIMIT $limit
"""

# ── Existence check for a node (used to return 404 cleanly) ────────────────
NODE_EXISTS_TEMPLATE = """
MATCH (n {{{id_key}: $node_id}}) RETURN count(n) AS c
"""
