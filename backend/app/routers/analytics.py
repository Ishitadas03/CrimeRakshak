"""Block 3 — Crime Pattern & Trend Analytics REST API.

Exposes DuckDB aggregate statistics to the frontend charts.
"""
from fastapi import APIRouter, Depends, Query, Request
from app.core.dependencies import get_current_active_user, require_permissions
from app.models.rbac import User
from app.chat.data.query import run_query

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    # For now, require any basic authenticated role. 
    # In a real app we might have a specific analytics:read permission.
    dependencies=[Depends(get_current_active_user)], 
)

@router.get("/trends", summary="Crime trends across time")
def get_trends(
    request: Request,
    limit: int = Query(10, description="Top N rising crimes"),
    current_user: User = Depends(get_current_active_user)
):
    # Get the rising crimes (Jan 2026 vs Jan 2025)
    res = run_query(
        'SELECT category, january_2026 as current_month, january_2025 as prev_year_month '
        'FROM crime_review_summary '
        'WHERE january_2026 IS NOT NULL AND january_2025 IS NOT NULL '
        f'ORDER BY (january_2026 - january_2025) DESC LIMIT {limit}'
    )
    
    # Format for the frontend Trends chart
    return {
        "monthly_comparison": [
            {
                "crime": row.get("category", "Unknown"),
                "currentMonth": row.get("current_month", 0),
                "prevYearMonth": row.get("prev_year_month", 0)
            }
            for row in res.rows
        ]
    }

@router.get("/hotspots", summary="Crime hotspots by district")
def get_hotspots(
    request: Request,
    current_user: User = Depends(get_current_active_user)
):
    # Total IPC-type and SLL-type crime by district for the heatmap.
    # The dataset has per-crime columns (no pre-summed totals), so we add the
    # relevant columns here. IPC = body/property offences; SLL = special laws.
    ipc_cols = [
        "murder", "attempt_to_murder", "rape", "dacoity", "robbery",
        "burglary_day", "burglary_night", "theft", "riots", "cases_of_hurt",
        "cruelty_by_husband", "dowry_deaths", "molestation",
    ]
    sll_cols = ["sc_st", "gambling", "dp_act", "cyber_crime", "pocso", "pocso_rape"]
    ipc_sum = " + ".join(f'COALESCE("{c}", 0)' for c in ipc_cols)
    sll_sum = " + ".join(f'COALESCE("{c}", 0)' for c in sll_cols)
    res = run_query(
        f'SELECT district_units as name, ({ipc_sum}) as ipc, ({sll_sum}) as sll '
        'FROM district_major_heads_yearly '
        "WHERE district_units NOT ILIKE '%total%'"
    )
    
    return {
        "districts": [
            {
                "name": row.get("name"),
                "ipc": row.get("ipc", 0),
                "sll": row.get("sll", 0)
            }
            for row in res.rows
        ]
    }


# ── Block 3 extensions (synthetic case-level data) ────────────────────────
# The endpoints below analyse the SYNTHETIC dated case dataset (tables:
# cases, case_people) because the real KSP CSVs are single-period aggregates
# with no per-incident dates. Responses are flagged is_synthetic.

@router.get("/seasonal", summary="Seasonal crime trend analysis (monthly)")
def get_seasonal(
    crime_type: str | None = Query(None, description="Optional crime type filter"),
    current_user: User = Depends(get_current_active_user),
):
    where = "WHERE 1=1"
    if crime_type:
        where += f" AND crime_type ILIKE '%{crime_type.replace(chr(39), '')}%'"
    res = run_query(
        "SELECT strftime(CAST(date AS DATE), '%m') AS month, crime_type, COUNT(*) AS cases "
        f"FROM cases {where} GROUP BY month, crime_type ORDER BY month",
        max_rows=600,
    )
    # Pivot: month -> total + per-type map.
    months: dict[str, dict] = {f"{m:02d}": {"month": f"{m:02d}", "total": 0} for m in range(1, 13)}
    for row in res.rows:
        m = row["month"]
        months[m]["total"] += int(row["cases"])
        months[m][row["crime_type"]] = int(row["cases"])
    return {"is_synthetic": True, "monthly": list(months.values())}


@router.get("/mo-patterns", summary="Modus-operandi pattern analysis")
def get_mo_patterns(
    district: str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
):
    where = "WHERE 1=1"
    if district:
        where += f" AND district ILIKE '%{district.replace(chr(39), '')}%'"
    res = run_query(
        "SELECT crime_type, modus_operandi, COUNT(*) AS cases, "
        "LIST(DISTINCT district)[:5] AS districts "
        f"FROM cases {where} GROUP BY crime_type, modus_operandi "
        "ORDER BY cases DESC LIMIT 40",
        max_rows=60,
    )
    return {"is_synthetic": True, "patterns": res.rows}


@router.get("/emerging", summary="Emerging crime clusters (recent 90d vs prior 90d)")
def get_emerging(current_user: User = Depends(get_current_active_user)):
    res = run_query(
        "WITH recent AS ("
        "  SELECT district, crime_type, COUNT(*) AS c FROM cases "
        "  WHERE CAST(date AS DATE) >= (SELECT MAX(CAST(date AS DATE)) FROM cases) - INTERVAL 90 DAY "
        "  GROUP BY district, crime_type), "
        "prior AS ("
        "  SELECT district, crime_type, COUNT(*) AS c FROM cases "
        "  WHERE CAST(date AS DATE) < (SELECT MAX(CAST(date AS DATE)) FROM cases) - INTERVAL 90 DAY "
        "    AND CAST(date AS DATE) >= (SELECT MAX(CAST(date AS DATE)) FROM cases) - INTERVAL 180 DAY "
        "  GROUP BY district, crime_type) "
        "SELECT r.district, r.crime_type, r.c AS recent_cases, "
        "COALESCE(p.c, 0) AS prior_cases, (r.c - COALESCE(p.c, 0)) AS change "
        "FROM recent r LEFT JOIN prior p "
        "ON r.district = p.district AND r.crime_type = p.crime_type "
        "WHERE r.c - COALESCE(p.c, 0) > 0 ORDER BY change DESC LIMIT 15",
        max_rows=20,
    )
    return {"is_synthetic": True, "window": "90 days vs prior 90 days", "clusters": res.rows}
