"""Agent tools for the conversational interface.

Phase 1 exposes a single grounded tool, ``query_crime_stats``, which lets the
LLM run a validated read-only SQL query against the DuckDB crime-statistics
tables. The tool schema is what the model sees; execution goes through the
safe executor in :mod:`app.chat.data.query`.

Later phases register additional tools (Neo4j case-level tools for Block 6)
into ``TOOL_SPECS`` / ``TOOL_IMPLS`` here.
"""
from __future__ import annotations

import json
from functools import lru_cache

from app.chat.data.query import run_query, UnsafeQueryError
from app.chat.data.schema_card import generate_schema_card
from app.chat.data.loader import build_database
from app.chat import decision_tools
from app.chat import graph_tools


@lru_cache
def get_schema_card() -> str:
    """Build the DuckDB (once) and cache its schema card for the prompt."""
    labels = build_database()
    return generate_schema_card(labels=labels)


# ── Tool implementations ─────────────────────────────────────────────────
def _tool_query_crime_stats(sql: str) -> dict:
    """Execute a read-only SQL query and return rows + provenance."""
    try:
        result = run_query(sql)
    except UnsafeQueryError as exc:
        return {"error": str(exc), "hint": "Only SELECT/WITH queries are allowed."}
    except Exception as exc:  # DuckDB parse/binder errors → let the model retry.
        return {"error": f"Query failed: {exc}"}
    return {
        "sql": result.sql,
        "columns": result.columns,
        "rows": result.rows,
        "row_count": result.row_count,
        "truncated": result.truncated,
    }


# ── OpenAI tool specs ────────────────────────────────────────────────────
TOOL_SPECS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "query_crime_stats",
            "description": (
                "Run a read-only DuckDB SQL query against Karnataka State "
                "Police aggregate crime-statistics tables to answer questions "
                "about reported cases by district, crime type and period. "
                "Use ONLY the tables/columns from the provided schema. Column "
                "names are case-sensitive; quote them with double quotes. "
                "Exclude summary rows such as 'Total'/'Karnataka' when ranking "
                "or comparing districts."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "A single SELECT/WITH statement (no semicolon).",
                    }
                },
                "required": ["sql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "investigation_support",
            "description": (
                "Investigation / decision support for a district: an actionable "
                "briefing combining the district's crime profile, its worst "
                "crime concerns, and administrative bottlenecks (FIR/chargesheet "
                "e-sign completion, Sakala pendency) with recommended focus "
                "areas. Use whenever the user asks for investigation support, "
                "decision support, recommendations, priorities, what to focus "
                "on, or an action plan for a district."
            ),
            "parameters": {
                "type": "object",
                "properties": {"district": {"type": "string"}},
                "required": ["district"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "district_review_summary",
            "description": (
                "Decision support (real aggregate stats): summarise a district's "
                "crime profile — total reported cases and its worst crime types, "
                "ranked. Use for 'crime review for <district>' or 'what are the "
                "top crimes in <district>'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "district": {"type": "string"},
                    "top_n": {"type": "integer", "description": "How many top crime types (default 6)."},
                },
                "required": ["district"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "rising_crimes",
            "description": (
                "Decision support (real aggregate stats): the crime heads with "
                "the largest year-over-year increase (January 2026 vs January "
                "2025) at state level. Use for 'which crimes are rising / "
                "increasing / emerging'."
            ),
            "parameters": {
                "type": "object",
                "properties": {"top_n": {"type": "integer", "description": "How many (default 8)."}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "crime_trend",
            "description": (
                "Decision support (real aggregate stats): the trend for a crime "
                "head across January 2025, December 2025 and January 2026. Use "
                "for 'trend of murder' or 'how has <crime> changed'."
            ),
            "parameters": {
                "type": "object",
                "properties": {"crime_head": {"type": "string"}},
                "required": ["crime_head"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "disposal_analysis",
            "description": (
                "Decision support (real aggregate stats): FIR and chargesheet "
                "e-sign completion and Sakala service pendency for a police "
                "unit/district. Use for 'FIR e-sign status', 'chargesheet "
                "pendency', or 'disposal performance of <unit>'."
            ),
            "parameters": {
                "type": "object",
                "properties": {"unit": {"type": "string"}},
                "required": ["unit"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "case_summary",
            "description": (
                "Get a comprehensive case summary for an FIR (by fir_id). "
                "Returns the accused, victims, witnesses, crime category and location of the case."
            ),
            "parameters": {
                "type": "object",
                "properties": {"fir_id": {"type": "string", "description": "The FIR ID/Number (e.g. FIR-2024-1002)."}},
                "required": ["fir_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "investigation_timeline",
            "description": (
                "Get the investigation timeline for an FIR (by fir_id). "
                "Provides chronological milestones and links to prior criminal records of the accused."
            ),
            "parameters": {
                "type": "object",
                "properties": {"fir_id": {"type": "string", "description": "The FIR ID/Number."}},
                "required": ["fir_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "similar_cases",
            "description": (
                "Identify similar past cases to a given FIR (by fir_id). "
                "Finds and ranks related cases sharing similar accused profiles or crime categories."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "fir_id": {"type": "string", "description": "The FIR ID/Number."},
                    "limit": {"type": "integer", "description": "Maximum number of similar cases to return (default 10)."}
                },
                "required": ["fir_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "suggest_leads",
            "description": (
                "Generate actionable investigative leads for a given FIR (by fir_id). "
                "Recommends associates of the accused or persons sharing phone numbers/bank accounts who are not yet named in the case."
            ),
            "parameters": {
                "type": "object",
                "properties": {"fir_id": {"type": "string", "description": "The FIR ID/Number."}},
                "required": ["fir_id"],
            },
        },
    },
]

TOOL_IMPLS = {
    "query_crime_stats": _tool_query_crime_stats,
    "investigation_support": decision_tools.investigation_support,
    "district_review_summary": decision_tools.district_review_summary,
    "rising_crimes": decision_tools.rising_crimes,
    "crime_trend": decision_tools.crime_trend,
    "disposal_analysis": decision_tools.disposal_analysis,
    "case_summary": graph_tools.case_summary,
    "investigation_timeline": graph_tools.investigation_timeline,
    "similar_cases": graph_tools.similar_cases,
    "suggest_leads": graph_tools.suggest_leads,
}


def dispatch_tool(name: str, arguments: str) -> tuple[dict, list[str]]:
    """Run a tool by name. Returns (result_dict, source_refs)."""
    impl = TOOL_IMPLS.get(name)
    if impl is None:
        return {"error": f"Unknown tool: {name}"}, []
    try:
        args = json.loads(arguments or "{}")
    except json.JSONDecodeError:
        return {"error": "Malformed tool arguments."}, []

    result = impl(**args)
    # Provenance for Block 9 explainability.
    sources: list[str] = []
    if isinstance(result, dict):
        if result.get("sql"):
            sources.append(f"crime-stats SQL: {result['sql']}")
        for ref in result.get("_source", []) or []:
            sources.append(ref)
    return result, sources
