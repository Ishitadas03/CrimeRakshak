"""Centralized Cypher catalog for Financial Crime & Transaction Link Analysis.

Written against the canonical Neo4j schema (``db/neo4j_schema.cypher``):

    (Person)-[:OWNS_ACCOUNT]->(BankAccount)
    (BankAccount)-[:TRANSFERRED_TO {transaction_id, amount, date, method}]->(BankAccount)
    (BankAccount)-[:RECEIVED_FROM {transaction_id, amount, date, method}]->(BankAccount)

Conventions (identical to the Graph module):
  * All values are bound parameters (``$param``) — never string-formatted.
  * The only interpolated tokens are validated integer traversal depths, which
    Cypher cannot parameterize; callers clamp them to ``GRAPH_MAX_DEPTH`` first.
  * ``OPTIONAL MATCH`` is used wherever the synthetic data may be sparse so
    queries degrade to empty collections instead of dropping the subject.
"""
from __future__ import annotations

# ── Existence check (mirrors graph, scoped to financial labels) ────────────
ACCOUNT_EXISTS = """
MATCH (b:BankAccount {account_no: $account_no}) RETURN count(b) AS c
"""
PERSON_EXISTS = """
MATCH (p:Person {person_id: $person_id}) RETURN count(p) AS c
"""

# ── Bank account relationship analysis / profile ──────────────────────────
ACCOUNT_PROFILE = """
MATCH (b:BankAccount {account_no: $account_no})
OPTIONAL MATCH (owner:Person)-[:OWNS_ACCOUNT]->(b)
WITH b, collect(DISTINCT owner) AS owners
OPTIONAL MATCH (b)-[out:TRANSFERRED_TO]->(dst:BankAccount)
WITH b, owners, collect(DISTINCT {rel: out, node: dst}) AS outgoing
OPTIONAL MATCH (src:BankAccount)-[inc:TRANSFERRED_TO]->(b)
RETURN b AS account,
       owners,
       outgoing,
       collect(DISTINCT {rel: inc, node: src}) AS incoming
"""

# ── Linked account discovery (transaction- or owner-linked, 1..2 hops) ─────
LINKED_ACCOUNTS = """
MATCH (b:BankAccount {account_no: $account_no})
OPTIONAL MATCH (b)-[:TRANSFERRED_TO|RECEIVED_FROM*1..2]-(linked:BankAccount)
WHERE linked.account_no <> $account_no
WITH b, collect(DISTINCT linked) AS tx_linked
OPTIONAL MATCH (owner:Person)-[:OWNS_ACCOUNT]->(b)
OPTIONAL MATCH (owner)-[:OWNS_ACCOUNT]->(co:BankAccount)
WHERE co.account_no <> $account_no
RETURN tx_linked + collect(DISTINCT co) AS linked
"""

# ── Person ↔ BankAccount ↔ Transaction traversal ───────────────────────────
PERSON_FINANCIALS = """
MATCH (p:Person {person_id: $person_id})-[:OWNS_ACCOUNT]->(b:BankAccount)
WITH p, collect(DISTINCT b) AS accounts, collect(DISTINCT b.account_no) AS acc_nos
OPTIONAL MATCH (a:BankAccount)-[t:TRANSFERRED_TO]->(c:BankAccount)
WHERE a.account_no IN acc_nos OR c.account_no IN acc_nos
RETURN p AS person, accounts,
       collect(DISTINCT {src: a, rel: t, dst: c})[0..$limit] AS transactions
"""

# ── Financial transaction lookup / high-value filtering ────────────────────
# Single query drives both /transactions and the high-value slice of
# /suspicious via parameters ($account NULL-able, $method NULL-able).
TRANSACTIONS = """
MATCH (a:BankAccount)-[t:TRANSFERRED_TO]->(b:BankAccount)
WHERE coalesce(t.amount, 0) >= $min_amount
  AND ($account IS NULL OR a.account_no = $account OR b.account_no = $account)
  AND ($method IS NULL OR t.method = $method)
RETURN a AS src, t AS rel, b AS dst
ORDER BY coalesce(t.amount, 0) DESC
LIMIT $limit
"""

# ── Money trail analysis / multi-hop tracing (directional, downstream) ─────
# ``$depth`` interpolated (validated int). Follows the direction of funds.
MONEY_TRAIL_TEMPLATE = """
MATCH (a:BankAccount {{account_no: $account_no}})
CALL {{
    WITH a
    MATCH path = (a)-[:TRANSFERRED_TO*1..{depth}]->(b:BankAccount)
    WHERE coalesce(
        reduce(m = 999999999.0, r IN relationships(path) | CASE WHEN coalesce(r.amount,0) < m THEN r.amount ELSE m END),
        0) >= $min_amount
    RETURN path
    LIMIT $path_limit
}}
RETURN path
"""

# ── Circular money flow detection (funds return to origin) ─────────────────
CIRCULAR_FLOW_TEMPLATE = """
MATCH path = (a:BankAccount)-[:TRANSFERRED_TO*2..{depth}]->(a)
WITH path, a,
     reduce(s = 0.0, r IN relationships(path) | s + coalesce(r.amount, 0)) AS total
WHERE total >= $min_amount
RETURN a AS origin, path, total
ORDER BY total DESC
LIMIT $limit
"""

# ── Pass-through / layering accounts (large in AND large out) ──────────────
PASS_THROUGH_ACCOUNTS = """
MATCH (src:BankAccount)-[inc:TRANSFERRED_TO]->(b:BankAccount)
WHERE coalesce(inc.amount, 0) >= $threshold
WITH b, sum(coalesce(inc.amount, 0)) AS total_in, count(inc) AS in_count
MATCH (b)-[out:TRANSFERRED_TO]->(dst:BankAccount)
WHERE coalesce(out.amount, 0) >= $threshold
WITH b, total_in, in_count,
     sum(coalesce(out.amount, 0)) AS total_out, count(out) AS out_count
WHERE in_count >= 1 AND out_count >= 1
RETURN b AS account, total_in, total_out, in_count, out_count
ORDER BY total_in + total_out DESC
LIMIT $limit
"""

# ── Financial network traversal around a root (account or person) ──────────
ACCOUNT_NETWORK_TEMPLATE = """
MATCH (root:BankAccount {{account_no: $root_id}})
CALL {{
    WITH root
    MATCH path = (root)-[:TRANSFERRED_TO|RECEIVED_FROM|OWNS_ACCOUNT*1..{depth}]-(n)
    RETURN path
    LIMIT $path_limit
}}
RETURN root, collect(path) AS paths
"""

PERSON_NETWORK_TEMPLATE = """
MATCH (root:Person {{person_id: $root_id}})
CALL {{
    WITH root
    MATCH path = (root)-[:OWNS_ACCOUNT|TRANSFERRED_TO|RECEIVED_FROM*1..{depth}]-(n)
    RETURN path
    LIMIT $path_limit
}}
RETURN root, collect(path) AS paths
"""

# ── Shortest money path between two accounts (directional TRANSFERRED_TO) ───
MONEY_PATH_TEMPLATE = """
MATCH (a:BankAccount {{account_no: $src_id}}), (b:BankAccount {{account_no: $dst_id}})
MATCH path = shortestPath((a)-[:TRANSFERRED_TO*..{max_depth}]->(b))
RETURN path
"""

# ── Suspicious network (subgraph of high-value transactions) ───────────────
SUSPICIOUS_NETWORK = """
MATCH (a:BankAccount)-[t:TRANSFERRED_TO]->(b:BankAccount)
WHERE coalesce(t.amount, 0) >= $threshold
RETURN a AS src, t AS rel, b AS dst
ORDER BY coalesce(t.amount, 0) DESC
LIMIT $limit
"""

# ── Search (accounts / persons / transaction ids) ──────────────────────────
SEARCH_ANY = """
MATCH (n)
WHERE (n:BankAccount OR n:Person)
  AND (
    toLower(coalesce(n.account_no, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.bank_name, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.person_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.name, '')) CONTAINS toLower($q)
  )
RETURN n AS node
LIMIT $limit
"""

SEARCH_BY_LABEL = """
MATCH (n)
WHERE $label IN labels(n)
  AND (
    toLower(coalesce(n.account_no, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.bank_name, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.person_id, '')) CONTAINS toLower($q)
    OR toLower(coalesce(n.name, '')) CONTAINS toLower($q)
  )
RETURN n AS node
LIMIT $limit
"""

# Search transactions by transaction_id (relationship-scoped).
SEARCH_TRANSACTIONS = """
MATCH (a:BankAccount)-[t:TRANSFERRED_TO]->(b:BankAccount)
WHERE toLower(coalesce(t.transaction_id, '')) CONTAINS toLower($q)
RETURN a AS src, t AS rel, b AS dst
LIMIT $limit
"""
