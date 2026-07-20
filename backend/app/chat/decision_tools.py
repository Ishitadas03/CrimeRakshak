"""Block 6 — Investigator/Supervisor Decision Support over REAL aggregate CSVs.

Where :mod:`app.chat.graph_tools` supports case-level investigation on the
(synthetic) graph, these tools provide *analytical* decision support grounded in
the real KSP aggregate statistics loaded into DuckDB: district crime reviews,
rising-crime detection, crime trends and administrative disposal analysis.

Each returns structured, grounded fields plus a ``_source`` list (the SQL used)
for Block 9 explainability.
"""
from __future__ import annotations

from app.chat.data.query import run_query
from app.core.logging import get_logger

logger = get_logger("chat.decision_tools")

# Rows that are aggregates/totals rather than real districts.
_TOTAL_LIKE = ("total", "karnataka", "grand total", "state total")


def _is_total(name: str | None) -> bool:
    return bool(name) and name.strip().lower() in _TOTAL_LIKE


# ── district_review_summary ──────────────────────────────────────────────
def district_review_summary(district: str, top_n: int = 6) -> dict:
    """Rank a district's crime types and highlight its worst categories."""
    res = run_query(
        'SELECT * FROM district_crime_matrix '
        f"WHERE district ILIKE '%{district.replace(chr(39), '')}%' LIMIT 1"
    )
    if not res.rows:
        return {"error": f"district '{district}' not found in district_crime_matrix"}

    row = res.rows[0]
    name = row.get("district")
    crimes = [
        {"crime_type": k, "cases": int(v)}
        for k, v in row.items()
        if k != "district" and isinstance(v, (int, float)) and v is not None
    ]
    crimes.sort(key=lambda c: c["cases"], reverse=True)
    total = sum(c["cases"] for c in crimes)
    return {
        "district": name,
        "total_reported_cases": total,
        "top_crime_types": crimes[:top_n],
        "_source": [f"crime-stats SQL: district review of {name} (district_crime_matrix)"],
    }


# ── rising_crimes ────────────────────────────────────────────────────────
def rising_crimes(top_n: int = 8) -> dict:
    """Crime heads with the largest year-over-year increase (Jan 2026 vs 2025)."""
    res = run_query(
        'SELECT crime_head, category, january_2026, january_2025, '
        '(january_2026 - january_2025) AS change '
        'FROM crime_review_summary '
        'WHERE january_2026 IS NOT NULL AND january_2025 IS NOT NULL '
        f'ORDER BY change DESC LIMIT {int(top_n)}'
    )
    return {
        "basis": "January 2026 vs January 2025",
        "rising": res.rows,
        "_source": [f"crime-stats SQL: {res.sql}"],
    }


# ── crime_trend ──────────────────────────────────────────────────────────
def crime_trend(crime_head: str) -> dict:
    """Three-point trend (Jan 2025 -> Dec 2025 -> Jan 2026) for a crime head."""
    res = run_query(
        'SELECT crime_head, category, january_2025, december_2025, january_2026 '
        'FROM crime_review_summary '
        f"WHERE crime_head ILIKE '%{crime_head.replace(chr(39), '')}%'"
    )
    if not res.rows:
        return {"error": f"crime head '{crime_head}' not found in crime_review_summary"}
    return {
        "crime_head": crime_head,
        "series": res.rows,
        "_source": [f"crime-stats SQL: {res.sql}"],
    }


# ── disposal_analysis ────────────────────────────────────────────────────
def disposal_analysis(unit: str) -> dict:
    """FIR & chargesheet e-sign completion plus Sakala pendency for a unit."""
    safe = unit.replace(chr(39), "")
    fir = run_query(
        'SELECT unit_name, fir_registered, fir_esign, percentage '
        f"FROM esign_fir WHERE unit_name ILIKE '%{safe}%' LIMIT 1"
    )
    cs = run_query(
        'SELECT unit_name, chargesheet_registered, chargesheet_esign, percentage '
        f"FROM esign_chargesheet WHERE unit_name ILIKE '%{safe}%' LIMIT 1"
    )
    sakala = run_query(
        'SELECT district, sakala_receipts, sakala_disposals, '
        '"pendency_after_due_date_31_01_2026" AS pendency '
        f"FROM sakala_disposals WHERE district ILIKE '%{safe}%' LIMIT 1"
    )
    if not (fir.rows or cs.rows or sakala.rows):
        return {"error": f"no administrative records found for '{unit}'"}
    return {
        "unit": unit,
        "fir_esign": fir.rows[0] if fir.rows else None,
        "chargesheet_esign": cs.rows[0] if cs.rows else None,
        "sakala": sakala.rows[0] if sakala.rows else None,
        "_source": ["crime-stats SQL: esign_fir + esign_chargesheet + sakala_disposals"],
    }


# ── investigation_support ────────────────────────────────────────────────
def investigation_support(district: str) -> dict:
    """Actionable decision-support briefing for a district.

    Combines the district's crime profile, its worst crime concerns, and its
    administrative bottlenecks (FIR/chargesheet e-sign completion, Sakala
    pendency) into one grounded package the model turns into a briefing.
    Grounded entirely in the real aggregate CSV statistics.
    """
    safe = district.replace(chr(39), "")

    # 1) Crime profile (this-period matrix) + yearly major heads.
    matrix = run_query(
        'SELECT * FROM district_crime_matrix '
        f"WHERE district ILIKE '%{safe}%' LIMIT 1"
    )
    yearly = run_query(
        'SELECT * FROM district_major_heads_yearly '
        f"WHERE district_units ILIKE '%{safe}%' LIMIT 1"
    )
    if not (matrix.rows or yearly.rows):
        return {"error": f"district '{district}' not found"}

    def _top_crimes(rows, key_col, n=5):
        if not rows:
            return []
        row = rows[0]
        items = [
            {"crime_type": k.replace("_", " ").title(), "cases": int(v)}
            for k, v in row.items()
            if k not in (key_col,) and isinstance(v, (int, float)) and v
        ]
        items.sort(key=lambda c: c["cases"], reverse=True)
        return items[:n]

    top_recent = _top_crimes(matrix.rows, "district")
    top_yearly = _top_crimes(yearly.rows, "district_units")

    # 2) Administrative bottlenecks.
    fir = run_query(
        'SELECT unit_name, fir_registered, fir_esign, percentage '
        f"FROM esign_fir WHERE unit_name ILIKE '%{safe}%' LIMIT 1"
    )
    cs = run_query(
        'SELECT unit_name, chargesheet_registered, chargesheet_esign, percentage '
        f"FROM esign_chargesheet WHERE unit_name ILIKE '%{safe}%' LIMIT 1"
    )
    sakala = run_query(
        'SELECT district, sakala_receipts, sakala_disposals, '
        '"pendency_after_due_date_31_01_2026" AS pendency '
        f"FROM sakala_disposals WHERE district ILIKE '%{safe}%' LIMIT 1"
    )

    return {
        "district": district,
        "top_crime_concerns_recent": top_recent,
        "top_crime_concerns_yearly": top_yearly,
        "fir_esign": fir.rows[0] if fir.rows else None,
        "chargesheet_esign": cs.rows[0] if cs.rows else None,
        "sakala": sakala.rows[0] if sakala.rows else None,
        "guidance": (
            "Use the crime concerns to recommend investigative focus areas, and "
            "use low e-sign percentages or high Sakala pendency to flag "
            "administrative bottlenecks needing supervisor attention."
        ),
        "_source": [
            f"crime-stats: investigation-support briefing for {district} "
            "(district_crime_matrix + district_major_heads_yearly + esign_fir "
            "+ esign_chargesheet + sakala_disposals)"
        ],
    }
