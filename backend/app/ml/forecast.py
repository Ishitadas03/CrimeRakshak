"""Forecast orchestration: request -> resolved series -> engine -> UI payload.

Every number in the response is computed from the DuckDB `cases` panel:
confidence comes from a rolling-origin backtest, risk from the cell's
percentile among its peers, factors from measured rates, hotspots from
area-level incident counts. Data is synthetic (flagged in meta).
"""
from __future__ import annotations

import math
from datetime import datetime

import numpy as np

from app.ml import engines
from app.ml.dataset import Panel, load_panel, resolve_crime, resolve_district, top_areas

_EPS = 1e-9


def _month_label(ym: str, offset: int = 0) -> str:
    dt = datetime.strptime(ym, "%Y-%m")
    y, m = dt.year, dt.month - 1 + offset
    y, m = y + m // 12, m % 12 + 1
    return datetime(y, m, 1).strftime("%b %Y")


def _month_ints(months: list[str]) -> list[int]:
    return [int(m.split("-")[1]) for m in months]


def _target_row(panel: Panel, d_idx: int | None, c_idx: int | None) -> int:
    if d_idx is not None and c_idx is not None:
        return d_idx * len(panel.crime_types) + c_idx
    if d_idx is not None:
        return d_idx
    if c_idx is not None:
        return c_idx
    return 0


def _seasonal_index(panel: Panel) -> np.ndarray:
    """Empirical month-of-year index from the statewide series (mean = 1)."""
    state = panel.series(None, None)
    m_ints = np.array(_month_ints(panel.months))
    idx = np.ones(13)
    overall = state.mean() + _EPS
    for m in range(1, 13):
        vals = state[m_ints == m]
        if len(vals):
            idx[m] = float(np.clip(vals.mean() / overall, 0.6, 1.6))
    return idx


def _tier(risk: int) -> str:
    if risk > 75:
        return "Critical"
    if risk > 50:
        return "High"
    if risk > 25:
        return "Medium"
    return "Low"


def _recommendations(crime_label: str, district_label: str, tier: str,
                     trend: float, peak_month: str, top_zone: str | None) -> list[str]:
    recs: list[str] = []
    delta = (trend - 1.0) * 100
    direction = "rising" if delta > 3 else ("falling" if delta < -3 else "stable")
    recs.append(
        f"Recent velocity is {direction} ({delta:+.0f}% vs prior 9-month average) — "
        + ("scale up preventive deployment now." if delta > 3 else
           "maintain current deployment with weekly review." if direction == "stable" else
           "opportunity to reallocate reserve units to higher-risk districts.")
    )
    if top_zone:
        recs.append(f"Concentrate beat patrols around {top_zone} — highest recorded incident density for this selection.")
    lc = crime_label.lower()
    if "cyber" in lc or "cheat" in lc or "fraud" in lc:
        recs.append("Alert bank nodal officers and activate cyber-cell triage for expected complaint volume.")
    elif any(k in lc for k in ("theft", "robbery", "snatch", "burglary")):
        recs.append("Prioritize night patrols and CCTV monitoring in commercial and transit corridors.")
    elif "ndps" in lc or "drug" in lc:
        recs.append("Coordinate with narcotics wing for supply-chain interdiction in flagged areas.")
    else:
        recs.append("Maintain rapid-response readiness and community liaison presence in flagged areas.")
    recs.append(f"Seasonal peak historically falls in {peak_month} — pre-position resources ahead of it.")
    if tier in ("Critical", "High"):
        recs.insert(0, f"{tier} risk tier for {district_label}: brief supervisory officers and raise patrol frequency by one band.")
    return recs[:4]


def run_forecast(district: str, crime_type: str, months: int, model_type: str,
                 include_environmental: bool = True, include_events: bool = False) -> dict:
    panel = load_panel()
    horizon = max(1, min(int(months), 12))

    resolved_d = resolve_district(panel, district)
    resolved_c = resolve_crime(panel, crime_type)
    d_idx = panel.districts.index(resolved_d) if resolved_d else None
    c_idx = panel.crime_types.index(resolved_c) if resolved_c else None

    # Model at the most specific aggregation level with enough signal — the
    # synthetic cases table is sparse per cell, and forecasting a near-all-zero
    # series is noise. Preference: cell -> crime statewide -> district -> state.
    MIN_MONTHLY = 2.5
    candidates = [(d_idx, c_idx), (None, c_idx), (d_idx, None), (None, None)]
    seen: set = set()
    model_d, model_c = None, None
    for dd, cc in candidates:
        if (dd, cc) in seen:
            continue
        seen.add((dd, cc))
        if panel.series(dd, cc).mean() >= MIN_MONTHLY:
            model_d, model_c = dd, cc
            break

    matrix = panel.level_matrix(model_d, model_c)
    row = _target_row(panel, model_d, model_c)
    m_ints = _month_ints(panel.months)
    y = matrix[row].astype(float)

    result = engines.forecast(model_type, matrix, row, m_ints, horizon)
    smape = engines.backtest_smape(model_type, matrix, row, m_ints)

    mean = result.mean.copy()
    sigma = result.sigma.copy()

    # Environmental toggle: apply the measured month-of-year index to forecast months.
    season = _seasonal_index(panel)
    future_m = [((m_ints[-1] - 1 + h + 1) % 12) + 1 for h in range(horizon)]
    env_factor = 1.0
    if include_environmental:
        idx = np.array([season[m] for m in future_m])
        mean = mean * idx
        env_factor = float(np.round(idx.mean(), 2))

    # Event toggle: measured recent anomaly (last month vs trailing median) widens the upper band.
    event_factor = None
    if include_events:
        med = float(np.median(y[-13:-1])) if len(y) >= 13 else float(np.median(y[:-1]) if len(y) > 1 else 1.0)
        event_factor = float(np.clip(y[-1] / (med + _EPS), 1.0, 2.0)) if med > 0 else 1.0
        event_factor = round(event_factor, 2)

    lower = np.maximum(0.0, mean - 1.96 * sigma)
    upper = mean + 1.96 * sigma
    if event_factor:
        upper = upper * event_factor

    # Factors (multiplier scale — the UI renders these as "N.NNx" on a 0..2 bar).
    recent = float(y[-3:].mean())
    prior = float(y[-12:-3].mean()) if len(y) >= 12 else float(y[:-3].mean() + _EPS)
    trend_factor = float(np.clip(recent / (prior + _EPS), 0.3, 2.0))

    district_factor = 1.0
    if d_idx is not None:
        d_rates = panel.counts.sum(axis=1).mean(axis=1)
        district_factor = float(np.clip(d_rates[d_idx] / (d_rates.mean() + _EPS), 0.3, 2.0))

    # Risk: percentile of forecast pressure among all series at this level, blended with trend.
    pressures = matrix[:, -6:].mean(axis=1)
    fm = float(mean.mean())
    # Single-series level (statewide total): rank the forecast against the
    # series' own history instead of across peers.
    percentile = float((pressures < fm).mean() * 100) if len(pressures) > 1 else float((y < fm).mean() * 100)
    risk = int(np.clip(round(0.7 * percentile + 0.3 * np.clip(50 + (trend_factor - 1) * 100, 0, 100)), 1, 99))
    tier = _tier(risk)

    confidence = int(np.clip(round(95 - 0.4 * smape - 1.5 * (horizon - 1)), 45, 95))

    # Chart series: last 6 observed months, a bridge point, then the forecast.
    forecast_data = []
    hist_window = panel.months[-6:]
    for i, ym in enumerate(hist_window):
        val = int(y[len(y) - 6 + i])
        is_bridge = i == len(hist_window) - 1
        forecast_data.append({
            "month": _month_label(ym),
            "historical": val,
            "predicted": val if is_bridge else None,
            "lowerBound": val if is_bridge else None,
            "upperBound": val if is_bridge else None,
        })
    for h in range(horizon):
        forecast_data.append({
            "month": _month_label(panel.months[-1], h + 1),
            "historical": None,
            "predicted": int(round(mean[h])),
            "lowerBound": int(round(lower[h])),
            "upperBound": int(round(upper[h])),
        })

    zones = top_areas(panel, resolved_d, resolved_c)
    hotspots = [f"{area} — {n} recorded incidents" for area, n in zones] or \
               ["No area-level records for this selection"]

    peak_month = datetime(2000, int(np.argmax(season[1:]) + 1), 1).strftime("%B")
    district_label = resolved_d or "Karnataka (statewide)"
    crime_label = resolved_c or crime_type

    factors = {
        "historical": round(float(y.mean()), 2),
        "environmental": env_factor,
        "district": round(district_factor, 2),
        "trend": round(trend_factor, 2),
    }
    if event_factor:
        factors["eventAnomaly"] = event_factor

    return {
        "riskScore": risk,
        "predictedCount": int(round(mean.sum())),
        "confidence": confidence,
        "factors": factors,
        "tier": tier,
        "forecastData": forecast_data,
        "resourceRecommendations": _recommendations(
            crime_label, district_label, tier, trend_factor, peak_month,
            zones[0][0] if zones else None),
        "hotspots": [h for h in hotspots][:5],
        "meta": {
            "engine": result.engine,
            "modelType": model_type,
            "resolvedDistrict": resolved_d,
            "resolvedCrimeType": resolved_c,
            "aggregationLevel": (
                "district+crime" if model_d is not None and model_c is not None
                else "district" if model_d is not None
                else "crime" if model_c is not None
                else "statewide"),
            "escalated": (model_d, model_c) != (d_idx, c_idx),
            "modeledSeries": " — ".join(filter(None, [
                panel.crime_types[model_c] if model_c is not None else "All crime types",
                panel.districts[model_d] if model_d is not None else "Karnataka statewide",
            ])),
            "backtestSMAPE": round(smape, 1),
            "trainingMonths": len(panel.months),
            "pooledSeries": int(matrix.shape[0]),
            "isSynthetic": True,
        },
    }


# ------------------------------------------------------------ early warning ----

def _poisson_sf(x: int, lam: float) -> float:
    """P(X >= x) for Poisson(lam)."""
    if lam <= 0:
        return 1.0 if x <= 0 else 0.05
    cum = 0.0
    for k in range(x):
        cum += math.exp(-lam) * lam ** k / math.factorial(k)
    return max(0.0, 1.0 - cum)


_UNITS = {
    "Cyber Fraud": ["Cyber Cell", "Bank Liaison Officer"],
    "Cheating": ["Economic Offences Wing", "Local PS Investigation Team"],
    "NDPS": ["Narcotics Wing", "Special Task Force"],
    "Murder": ["Homicide Squad", "Forensic Unit"],
    "Rioting": ["Riot Control (KSRP)", "Intelligence Wing"],
}
_DEFAULT_UNITS = ["Hoysala Patrol", "Beat Constabulary"]


def early_warning(min_probability: float = 0.10) -> dict:
    """Scan every district x crime cell: flag cells whose latest month is a
    statistically significant surge over the trailing 6-month Poisson baseline."""
    panel = load_panel()
    last_ym = panel.months[-1]
    alerts = []
    for di, district in enumerate(panel.districts):
        for ci, crime in enumerate(panel.crime_types):
            series = panel.counts[di, ci].astype(float)
            last = int(series[-1])
            baseline = float(series[-7:-1].mean())
            if last < 2:
                continue
            p = _poisson_sf(last, baseline if baseline > 0 else 0.3)
            if p >= min_probability:
                continue
            change = (last - baseline) / (baseline + _EPS) * 100
            severity = "Critical" if p < 0.001 else "High" if p < 0.01 else "Moderate"
            zones = top_areas(panel, district, crime, limit=1)
            alerts.append({
                "id": f"{district}-{crime}-{last_ym}".replace(" ", "_"),
                "district": district,
                "crime": crime,
                "location": zones[0][0] if zones else district,
                "currentMonth": last,
                "prevMonth": round(baseline, 1),
                "change": round(change, 1),
                "probability": round(p, 4),
                "severity": severity,
                "month": _month_label(last_ym),
                "slaMinutes": 30 if severity == "Critical" else 120 if severity == "High" else 480,
                "suggestedUnits": _UNITS.get(crime, _DEFAULT_UNITS),
            })
    alerts.sort(key=lambda a: a["probability"])
    return {
        "generatedFor": _month_label(last_ym),
        "baselineWindowMonths": 6,
        "method": "poisson-surge-test",
        "isSynthetic": True,
        "alerts": alerts,
    }
