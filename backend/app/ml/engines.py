"""Forecasting engines trained on real series from DuckDB.

All engines share one contract: given a matrix of pooled series (all series at
the target's aggregation level), a target row, and calendar months, produce a
multi-step forecast with a per-step uncertainty estimate.

- "XGBoost"  -> gradient-boosted trees on lag/rolling/calendar features,
               pooled across series, Poisson objective (count data).
- "LSTM"     -> small PyTorch LSTM over sliding windows of all pooled series;
               falls back to a sklearn MLP window model if torch is missing.
- "Prophet"  -> Holt-Winters exponential smoothing (additive trend + monthly
               seasonality when the series is long enough) via statsmodels.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

import numpy as np

_LAGS = 3
_WINDOW = 6


@dataclass
class EngineResult:
    mean: np.ndarray    # (horizon,)
    sigma: np.ndarray   # (horizon,) one-step std widened with horizon
    engine: str         # engine actually used (for honest reporting)


def _month_feats(month_int: int) -> tuple[float, float]:
    ang = 2.0 * np.pi * (month_int - 1) / 12.0
    return float(np.sin(ang)), float(np.cos(ang))


def _widen(sigma: float, horizon: int, base: np.ndarray) -> np.ndarray:
    floor = np.sqrt(np.maximum(base, 0.5))  # Poisson-ish floor for count data
    steps = np.array([sigma * np.sqrt(1.0 + 0.15 * h) for h in range(horizon)])
    return np.maximum(steps, floor)


def _future_months(last_month_int: int, horizon: int) -> list[int]:
    return [((last_month_int - 1 + h + 1) % 12) + 1 for h in range(horizon)]


# ---------------------------------------------------------------- XGBoost ----

def _xgb_features(hist: np.ndarray, t_month: int, exp_mean: float) -> list[float]:
    sin_m, cos_m = _month_feats(t_month)
    return [
        float(hist[-1]),
        float(hist[-2]),
        float(hist[-3]),
        float(hist[-3:].mean()),
        float(hist[-6:].mean()),
        sin_m,
        cos_m,
        exp_mean,
    ]


def _fit_xgb(matrix: np.ndarray, month_ints: list[int]):
    from xgboost import XGBRegressor

    X, y = [], []
    n_series, T = matrix.shape
    for s in range(n_series):
        row = matrix[s]
        for t in range(_WINDOW, T):
            X.append(_xgb_features(row[:t], month_ints[t], float(row[:t].mean())))
            y.append(row[t])
    model = XGBRegressor(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.05,
        objective="count:poisson",
        random_state=42,
        n_jobs=2,
        verbosity=0,
    )
    model.fit(np.array(X), np.array(y))
    return model


def _forecast_xgb(matrix: np.ndarray, target_row: int, month_ints: list[int], horizon: int) -> EngineResult:
    model = _fit_xgb(matrix, month_ints)
    y = matrix[target_row].copy()

    # in-sample one-step residuals on the target series for sigma
    resid = []
    for t in range(_WINDOW, len(y)):
        f = model.predict(np.array([_xgb_features(y[:t], month_ints[t], float(y[:t].mean()))]))[0]
        resid.append(y[t] - f)
    sigma = float(np.std(resid)) if resid else float(np.sqrt(max(y.mean(), 1.0)))

    hist = y.copy()
    preds = []
    for m in _future_months(month_ints[-1], horizon):
        f = float(model.predict(np.array([_xgb_features(hist, m, float(hist.mean()))]))[0])
        f = max(0.0, f)
        preds.append(f)
        hist = np.append(hist, f)
    mean = np.array(preds)
    return EngineResult(mean=mean, sigma=_widen(sigma, horizon, mean), engine="xgboost")


# ------------------------------------------------------------------- LSTM ----

_LSTM_CACHE: dict[str, object] = {}


def _lstm_windows(matrix: np.ndarray, month_ints: list[int]):
    """Sliding windows over every pooled series, normalized per series."""
    xs, ys = [], []
    for row in matrix:
        scale = row.mean() + 1.0
        norm = row / scale
        for t in range(_WINDOW, len(row)):
            steps = []
            for k in range(t - _WINDOW, t):
                sin_m, cos_m = _month_feats(month_ints[k])
                steps.append([norm[k], sin_m, cos_m])
            xs.append(steps)
            ys.append(norm[t])
    return np.array(xs, dtype=np.float32), np.array(ys, dtype=np.float32)


def _fit_lstm_torch(matrix: np.ndarray, month_ints: list[int]):
    import torch
    import torch.nn as nn

    key = hashlib.md5(matrix.tobytes() + bytes(month_ints)).hexdigest()
    if key in _LSTM_CACHE:
        return _LSTM_CACHE[key]

    torch.manual_seed(1337)

    class TinyLSTM(nn.Module):
        def __init__(self):
            super().__init__()
            self.lstm = nn.LSTM(input_size=3, hidden_size=24, batch_first=True)
            self.head = nn.Linear(24, 1)

        def forward(self, x):
            out, _ = self.lstm(x)
            return self.head(out[:, -1, :]).squeeze(-1)

    xs, ys = _lstm_windows(matrix, month_ints)
    X = torch.from_numpy(xs)
    Y = torch.from_numpy(ys)
    model = TinyLSTM()
    opt = torch.optim.Adam(model.parameters(), lr=0.01)
    loss_fn = nn.MSELoss()
    model.train()
    for _ in range(120):
        opt.zero_grad()
        loss = loss_fn(model(X), Y)
        loss.backward()
        opt.step()
    model.eval()
    _LSTM_CACHE[key] = model
    if len(_LSTM_CACHE) > 16:
        _LSTM_CACHE.pop(next(iter(_LSTM_CACHE)))
    return model


def _forecast_lstm(matrix: np.ndarray, target_row: int, month_ints: list[int], horizon: int) -> EngineResult:
    try:
        import torch

        model = _fit_lstm_torch(matrix, month_ints)
        engine = "lstm-pytorch"

        def predict_window(win: np.ndarray) -> float:
            with torch.no_grad():
                x = torch.from_numpy(win[None, :, :].astype(np.float32))
                return float(model(x)[0])

    except ImportError:
        from sklearn.neural_network import MLPRegressor

        xs, ys = _lstm_windows(matrix, month_ints)
        flat = xs.reshape(len(xs), -1)
        mlp = MLPRegressor(hidden_layer_sizes=(32, 16), max_iter=800, random_state=42)
        mlp.fit(flat, ys)
        engine = "mlp-window (torch unavailable)"

        def predict_window(win: np.ndarray) -> float:
            return float(mlp.predict(win.reshape(1, -1))[0])

    y = matrix[target_row].astype(float)
    scale = y.mean() + 1.0
    norm = list(y / scale)
    m_ints = list(month_ints)

    def window_at(end: int) -> np.ndarray:
        steps = []
        for k in range(end - _WINDOW, end):
            sin_m, cos_m = _month_feats(m_ints[k])
            steps.append([norm[k], sin_m, cos_m])
        return np.array(steps, dtype=np.float32)

    resid = [y[t] - max(0.0, predict_window(window_at(t)) * scale) for t in range(_WINDOW, len(y))]
    sigma = float(np.std(resid)) if resid else float(np.sqrt(max(y.mean(), 1.0)))

    preds = []
    for m in _future_months(month_ints[-1], horizon):
        m_ints.append(m)
        f_norm = predict_window(window_at(len(norm)))
        f = max(0.0, f_norm * scale)
        preds.append(f)
        norm.append(f / scale)
    mean = np.array(preds)
    return EngineResult(mean=mean, sigma=_widen(sigma, horizon, mean), engine=engine)


# ----------------------------------------------------- Holt-Winters (Prophet option) ----

def _forecast_hw(matrix: np.ndarray, target_row: int, month_ints: list[int], horizon: int) -> EngineResult:
    y = matrix[target_row].astype(float)
    fitted = None
    engine = "holt-winters"
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        seasonal = "add" if len(y) >= 24 and np.count_nonzero(y) > len(y) // 2 else None
        model = ExponentialSmoothing(
            y,
            trend="add",
            damped_trend=True,
            seasonal=seasonal,
            seasonal_periods=12 if seasonal else None,
            initialization_method="estimated",
        ).fit(optimized=True)
        fitted = model
        if seasonal:
            engine = "holt-winters-seasonal"
    except Exception:
        from statsmodels.tsa.holtwinters import SimpleExpSmoothing

        fitted = SimpleExpSmoothing(y, initialization_method="estimated").fit()
        engine = "simple-exp-smoothing"

    mean = np.maximum(0.0, np.asarray(fitted.forecast(horizon), dtype=float))
    resid = y - np.asarray(fitted.fittedvalues, dtype=float)
    sigma = float(np.std(resid)) if len(resid) else float(np.sqrt(max(y.mean(), 1.0)))
    return EngineResult(mean=mean, sigma=_widen(sigma, horizon, mean), engine=engine)


# ------------------------------------------------------------- dispatcher ----

_ENGINES = {
    "LSTM": _forecast_lstm,
    "XGBoost": _forecast_xgb,
    "Prophet": _forecast_hw,
}


def forecast(model_type: str, matrix: np.ndarray, target_row: int, month_ints: list[int], horizon: int) -> EngineResult:
    fn = _ENGINES.get(model_type, _forecast_xgb)
    return fn(matrix, target_row, month_ints, horizon)


def backtest_smape(model_type: str, matrix: np.ndarray, target_row: int, month_ints: list[int], holdout: int = 3) -> float:
    """Refit on a truncated panel, forecast the held-out months, return
    smoothed sMAPE (%) against actuals — the basis for honest confidence."""
    if matrix.shape[1] <= _WINDOW + holdout + 2:
        return 60.0
    truncated = matrix[:, :-holdout]
    res = forecast(model_type, truncated, target_row, month_ints[:-holdout], holdout)
    actual = matrix[target_row, -holdout:].astype(float)
    f = res.mean
    return float(np.mean(2.0 * np.abs(f - actual) / (f + actual + 2.0)) * 100.0)
