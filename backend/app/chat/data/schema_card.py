"""Generate a *schema card* describing the DuckDB crime-stats tables.

The schema card is injected into the LLM prompt so the model can translate a
natural-language question into a **read-only SQL query** against a known set of
tables and columns — it never sees the raw database and never invents tables.

For each table we emit: its description, and for every column the clean name,
its type, the original human-readable header, and a few sample values.
"""
from __future__ import annotations

import duckdb

from app.core.config import settings
from app.chat.data.loader import CATALOG, build_database


def _sample_values(con: duckdb.DuckDBPyConnection, table: str, column: str, n: int = 4) -> list[str]:
    rows = con.execute(
        f'SELECT DISTINCT "{column}" FROM "{table}" '
        f'WHERE "{column}" IS NOT NULL LIMIT {n}'
    ).fetchall()
    return [str(r[0]) for r in rows]


def generate_schema_card(duckdb_path: str | None = None,
                         labels: dict[str, dict[str, str]] | None = None) -> str:
    """Return a human/LLM-readable description of every table in the database.

    ``labels`` maps ``{table: {clean_col: original_label}}`` (from
    :func:`build_database`). If omitted, the DB is rebuilt to obtain it.
    """
    db_path = duckdb_path or settings.DUCKDB_PATH
    if labels is None:
        labels = build_database(duckdb_path=db_path)

    descriptions = {ds.table: ds.description for ds in CATALOG}
    con = duckdb.connect(db_path, read_only=True)
    lines: list[str] = [
        "You can query the following read-only DuckDB tables of Karnataka State "
        "Police (KSP) AGGREGATE crime statistics. All figures are counts of "
        "reported cases, not individual case records.",
        "",
    ]
    try:
        for table in labels:
            info = con.execute(f'PRAGMA table_info("{table}")').fetchall()
            n_rows = con.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            lines.append(f"TABLE {table}  ({n_rows} rows)")
            lines.append(f"  purpose: {descriptions.get(table, '')}")
            for row in info:
                col, col_type = row[1], row[2]
                original = labels[table].get(col, col)
                samples = _sample_values(con, table, col)
                sample_txt = ", ".join(samples[:4])
                label_txt = "" if original == col else f' [label: "{original}"]'
                lines.append(
                    f'  - {col} {col_type}{label_txt}  e.g. {sample_txt}'
                )
            lines.append("")
    finally:
        con.close()

    lines.append(
        "Rules: use ONLY these tables/columns; DuckDB SQL dialect; SELECT-only; "
        "column names are case-sensitive — quote them with double quotes."
    )
    return "\n".join(lines)


if __name__ == "__main__":
    print(generate_schema_card())
