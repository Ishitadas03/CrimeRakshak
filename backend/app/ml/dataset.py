"""Monthly crime panel built from the DuckDB `cases` table.

The synthetic case data is sparse at (district, crime_type) granularity
(~0.7 incidents/month per cell), so forecasting works on a panel of series
at the most specific level the request can support, and engines train
globally across all series of that level (standard pooled approach for
sparse count series).
"""
from __future__ import annotations

import difflib
import os
import re
from dataclasses import dataclass, field
from functools import lru_cache

import duckdb
import numpy as np
import pandas as pd

from app.core.config import settings

# Frontend district names come from a 37-entry mock list; DuckDB has 18.
# Aliases cover renamed cities and commissionerates whose HQ district differs.
_DISTRICT_ALIASES = {
    "bangalore": "bengaluru city",
    "bengaluru": "bengaluru city",
    "mangaluru": "dakshina kannada",
    "mangalore": "dakshina kannada",
    "hubli": "dharwad",
    "hubballi": "dharwad",
    "hubli dharwad": "dharwad",
    "hubballi dharwad": "dharwad",
    "gulbarga": "kalaburagi",
    "mysore": "mysuru",
    "tumkur": "tumakuru",
    "bellary": "ballari",
    "bijapur": "vijayapur",
    "belgaum": "belagavi",
    "shimoga": "shivamogga",
    "chikkaballapura": "chickballapura",
    "chikballapur": "chickballapura",
}

_CRIME_KEYWORDS = {
    "cyber": "Cyber Fraud",
    "fraud": "Cyber Fraud",
    "cheat": "Cheating",
    "riot": "Rioting",
    "snatch": "Chain Snatching",
    "burglar": "Burglary",
    "house break": "Burglary",
    "theft": "Theft",
    "robbery": "Robbery",
    "dacoity": "Robbery",
    "murder": "Murder",
    "extort": "Extortion",
    "ndps": "NDPS",
    "drug": "NDPS",
}


def _norm(name: str) -> str:
    s = re.sub(r"[^a-z\s]", " ", name.lower())
    s = re.sub(r"\b(city|dist|district|rural|urban)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


@dataclass
class Panel:
    """Complete monthly panel: every (district, crime_type) cell x every month."""

    months: list[str]                  # 'YYYY-MM', sorted
    districts: list[str]
    crime_types: list[str]
    counts: np.ndarray                 # shape (n_districts, n_crimes, n_months)
    areas: dict = field(default_factory=dict)  # district -> [(area, count), ...]

    def series(self, d_idx: int | None, c_idx: int | None) -> np.ndarray:
        """Series aggregated over unresolved dimensions."""
        m = self.counts
        if d_idx is not None:
            m = m[d_idx : d_idx + 1]
        if c_idx is not None:
            m = m[:, c_idx : c_idx + 1]
        return m.sum(axis=(0, 1)).astype(float)

    def level_matrix(self, d_idx: int | None, c_idx: int | None) -> np.ndarray:
        """All series at the same aggregation level as the target — the
        pooled training set for global engines. Shape (n_series, n_months)."""
        if d_idx is not None and c_idx is not None:
            return self.counts.reshape(-1, len(self.months)).astype(float)
        if d_idx is not None:
            return self.counts.sum(axis=1).astype(float)
        if c_idx is not None:
            return self.counts.sum(axis=0).astype(float)
        return self.counts.sum(axis=(0, 1)).reshape(1, -1).astype(float)


def _db_path() -> str:
    return settings.DUCKDB_PATH


@lru_cache(maxsize=2)
def _load_panel_cached(db_path: str, mtime: float) -> Panel:
    con = duckdb.connect(db_path, read_only=True)
    try:
        df = con.execute(
            """
            SELECT district, crime_type,
                   strftime(CAST(date AS DATE), '%Y-%m') AS ym,
                   COUNT(*) AS n
            FROM cases
            GROUP BY 1, 2, 3
            """
        ).fetch_df()
        areas_df = con.execute(
            """
            SELECT district, crime_type, area, COUNT(*) AS n
            FROM cases
            GROUP BY 1, 2, 3
            """
        ).fetch_df()
    finally:
        con.close()

    if df.empty:
        raise RuntimeError("cases table is empty — run the ingestion pipeline first")

    months = sorted(df["ym"].unique())
    districts = sorted(df["district"].unique())
    crimes = sorted(df["crime_type"].unique())
    d_ix = {d: i for i, d in enumerate(districts)}
    c_ix = {c: i for i, c in enumerate(crimes)}
    m_ix = {m: i for i, m in enumerate(months)}

    counts = np.zeros((len(districts), len(crimes), len(months)), dtype=np.int32)
    for row in df.itertuples(index=False):
        counts[d_ix[row.district], c_ix[row.crime_type], m_ix[row.ym]] = row.n

    areas: dict = {}
    for row in areas_df.itertuples(index=False):
        areas.setdefault((row.district, row.crime_type), []).append((row.area, int(row.n)))
    for key in areas:
        areas[key].sort(key=lambda t: -t[1])

    return Panel(months=months, districts=districts, crime_types=crimes, counts=counts, areas=areas)


def load_panel() -> Panel:
    path = _db_path()
    mtime = os.path.getmtime(path) if os.path.exists(path) else 0.0
    return _load_panel_cached(path, mtime)


def resolve_district(panel: Panel, name: str) -> str | None:
    """Map a frontend district label onto a DB district, or None → statewide."""
    q = _norm(name)
    if not q:
        return None
    q = _DISTRICT_ALIASES.get(q, q)
    by_norm = {_norm(d): d for d in panel.districts}
    if q in by_norm:
        return by_norm[q]
    close = difflib.get_close_matches(q, list(by_norm), n=1, cutoff=0.75)
    return by_norm[close[0]] if close else None


def resolve_crime(panel: Panel, name: str) -> str | None:
    """Map a frontend crime category onto a DB crime_type, or None → all crimes."""
    q = _norm(name)
    if not q:
        return None
    by_norm = {_norm(c): c for c in panel.crime_types}
    if q in by_norm:
        return by_norm[q]
    for kw, target in _CRIME_KEYWORDS.items():
        if kw in q and target in panel.crime_types:
            return target
    close = difflib.get_close_matches(q, list(by_norm), n=1, cutoff=0.8)
    return by_norm[close[0]] if close else None


def top_areas(panel: Panel, district: str | None, crime: str | None, limit: int = 5) -> list[tuple[str, int]]:
    """Real hotspot areas from case records, filtered to whatever resolved."""
    agg: dict[str, int] = {}
    for (d, c), pairs in panel.areas.items():
        if district is not None and d != district:
            continue
        if crime is not None and c != crime:
            continue
        for area, n in pairs:
            label = area if district is not None else f"{area}, {d}"
            agg[label] = agg.get(label, 0) + n
    return sorted(agg.items(), key=lambda t: -t[1])[:limit]
