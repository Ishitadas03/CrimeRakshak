"""Safe, read-only execution of LLM-generated SQL against the crime-stats DB.

The LLM proposes a SQL string; it is **never** trusted. Before execution we:
  * strip comments and a trailing semicolon,
  * reject anything that is not a single ``SELECT`` / ``WITH`` statement,
  * reject statements containing write / DDL keywords,
and we open the DuckDB connection ``read_only=True`` as defence in depth.

Results are capped so a stray ``SELECT *`` can't return a huge payload.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import duckdb

from app.core.config import settings

MAX_ROWS = 200

_FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|create|alter|attach|copy|"
    r"pragma|install|load|export|call|replace|truncate|grant)\b",
    re.IGNORECASE,
)
_COMMENT = re.compile(r"--[^\n]*|/\*.*?\*/", re.DOTALL)


class UnsafeQueryError(ValueError):
    """Raised when a proposed query is not a safe read-only statement."""


@dataclass
class QueryResult:
    columns: list[str]
    rows: list[dict]
    row_count: int
    sql: str
    truncated: bool


def _sanitize(sql: str) -> str:
    stripped = _COMMENT.sub(" ", sql).strip().rstrip(";").strip()
    if not stripped:
        raise UnsafeQueryError("Empty query.")
    if ";" in stripped:
        raise UnsafeQueryError("Only a single statement is allowed.")
    if not re.match(r"^\s*(select|with)\b", stripped, re.IGNORECASE):
        raise UnsafeQueryError("Only SELECT/WITH queries are allowed.")
    if _FORBIDDEN.search(stripped):
        raise UnsafeQueryError("Query contains a forbidden keyword.")
    return stripped


def run_query(sql: str, duckdb_path: str | None = None, max_rows: int = MAX_ROWS) -> QueryResult:
    """Validate and execute a read-only query; return capped, dict-shaped rows."""
    safe_sql = _sanitize(sql)
    db_path = duckdb_path or settings.DUCKDB_PATH

    con = duckdb.connect(db_path, read_only=True)
    try:
        cur = con.execute(safe_sql)
        columns = [d[0] for d in cur.description]
        fetched = cur.fetchmany(max_rows + 1)
    finally:
        con.close()

    truncated = len(fetched) > max_rows
    fetched = fetched[:max_rows]
    rows = [dict(zip(columns, r)) for r in fetched]
    return QueryResult(
        columns=columns,
        rows=rows,
        row_count=len(rows),
        sql=safe_sql,
        truncated=truncated,
    )
