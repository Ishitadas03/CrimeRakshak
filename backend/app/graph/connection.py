"""Neo4j connection manager.

A thin, process-wide singleton around the official Neo4j Python driver. The
driver itself is thread-safe and manages an internal connection pool, so a
single instance is shared for the app's lifetime and sessions are opened
per-query.

Configuration comes from :mod:`app.core.config` (the same ``NEO4J_*`` variables
used by the ingestion pipeline). The manager is created lazily so importing the
package never forces a connection — useful for unit tests and for running the
Postgres-only auth module without a live graph database.
"""
from __future__ import annotations

from typing import Any, Optional

from neo4j import Driver, GraphDatabase
from neo4j.exceptions import Neo4jError, ServiceUnavailable
from neo4j.graph import Node, Path, Relationship

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("graph.connection")


def _transform(value: Any) -> Any:
    """Convert neo4j graph types into plain, label-preserving Python structures.

    The driver's built-in ``record.data()`` renders a ``Node`` as ``dict(node)``,
    which DROPS the labels, and a ``Relationship`` without its type. Downstream
    normalization needs both, so we render:

      * Node          -> ``{**props, "_label": <first label>, "_labels": [...]}``
      * Relationship  -> ``{**props, "_type": <TYPE>, "_start": .., "_end": ..}``
      * Path          -> alternating ``[node, rel, node, rel, ...]`` list
      * containers     -> recursively transformed
    """
    if isinstance(value, Node):
        props = dict(value)
        labels = list(value.labels)
        props["_label"] = labels[0] if labels else "Unknown"
        props["_labels"] = labels
        props["_element_id"] = value.element_id
        return props
    if isinstance(value, Relationship):
        props = dict(value)
        props["_type"] = value.type
        props["_start"] = value.start_node.element_id if value.start_node else None
        props["_end"] = value.end_node.element_id if value.end_node else None
        return props
    if isinstance(value, Path):
        out: list[Any] = [_transform(value.start_node)]
        for i, rel in enumerate(value.relationships):
            out.append(_transform(rel))
            out.append(_transform(value.nodes[i + 1]))
        return out
    if isinstance(value, (list, tuple)):
        return [_transform(v) for v in value]
    if isinstance(value, dict):
        return {k: _transform(v) for k, v in value.items()}
    return value


def _record_to_dict(record: Any) -> dict[str, Any]:
    """Materialize a neo4j Record into a plain dict, preserving labels/types."""
    return {key: _transform(record[key]) for key in record.keys()}


class GraphConnectionError(RuntimeError):
    """Raised when the graph database is unreachable or a query fails at the
    driver level. Services translate this into an HTTP 503."""


class Neo4jConnectionManager:
    """Owns the shared Neo4j driver and exposes helpers to run queries."""

    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        database: Optional[str] = None,
    ) -> None:
        self._uri = uri or settings.NEO4J_URI
        self._user = user or settings.NEO4J_USER
        self._password = password or settings.NEO4J_PASSWORD
        self._database = database or settings.NEO4J_DATABASE
        self._driver: Optional[Driver] = None

    # ── Lifecycle ────────────────────────────────────────────────────────
    @property
    def driver(self) -> Driver:
        """Return the shared driver, connecting lazily on first use."""
        if self._driver is None:
            self.connect()
        return self._driver  # type: ignore[return-value]

    def connect(self) -> None:
        if not settings.USE_NEO4J:
            raise GraphConnectionError("Neo4j is disabled in settings (USE_NEO4J=False)")
        if self._driver is not None:
            return
        try:
            self._driver = GraphDatabase.driver(
                self._uri,
                auth=(self._user, self._password),
                max_connection_pool_size=50,
                connection_acquisition_timeout=30,
                max_connection_lifetime=200,  # Recycles idle connections before Aura drops them
                keep_alive=True,               # Sends periodic pings to keep sockets open
            )
            logger.info("Neo4j driver initialized for %s", self._uri)
        except Exception as exc:  # pragma: no cover - driver init rarely fails
            logger.error("Failed to initialize Neo4j driver: %s", exc)
            raise GraphConnectionError(str(exc)) from exc

    def close(self) -> None:
        if self._driver is not None:
            self._driver.close()
            self._driver = None
            logger.info("Neo4j driver closed.")

    def verify_connectivity(self) -> bool:
        """Ping the server. Returns ``True`` if reachable, else ``False``."""
        if not settings.USE_NEO4J:
            logger.info("Neo4j connectivity check skipped (disabled in settings)")
            return False
        try:
            self.driver.verify_connectivity()
            return True
        except Exception as exc:
            logger.warning("Neo4j connectivity check failed: %s", exc)
            return False

    # ── Query helpers ────────────────────────────────────────────────────
    def run_read(
        self, query: str, parameters: Optional[dict[str, Any]] = None
    ) -> list[dict[str, Any]]:
        """Execute a read query in a managed read transaction.

        Returns a list of plain dicts (records materialized inside the session so
        nothing lazily references a closed transaction).
        """
        params = parameters or {}
        try:
            with self.driver.session(database=self._database) as session:
                result = session.execute_read(
                    lambda tx: [_record_to_dict(record) for record in tx.run(query, params)]
                )
            return result
        except (ServiceUnavailable, OSError) as exc:
            logger.error("Neo4j unavailable during read: %s", exc)
            raise GraphConnectionError("graph database is unavailable") from exc
        except Neo4jError as exc:
            logger.error("Neo4j query error: %s", exc)
            raise GraphConnectionError(f"graph query failed: {exc.code}") from exc

    def run_write(
        self, query: str, parameters: Optional[dict[str, Any]] = None
    ) -> list[dict[str, Any]]:
        """Execute a write query in a managed write transaction."""
        params = parameters or {}
        try:
            with self.driver.session(database=self._database) as session:
                result = session.execute_write(
                    lambda tx: [_record_to_dict(record) for record in tx.run(query, params)]
                )
            return result
        except (ServiceUnavailable, OSError) as exc:
            logger.error("Neo4j unavailable during write: %s", exc)
            raise GraphConnectionError("graph database is unavailable") from exc
        except Neo4jError as exc:
            logger.error("Neo4j query error: %s", exc)
            raise GraphConnectionError(f"graph query failed: {exc.code}") from exc


# Process-wide singleton.
graph_connection = Neo4jConnectionManager()


def get_graph() -> Neo4jConnectionManager:
    """FastAPI dependency returning the shared connection manager."""
    return graph_connection
