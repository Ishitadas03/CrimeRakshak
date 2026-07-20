"""Crime Forecasting & Early Warning API.

Real ML pipeline over the DuckDB `cases` panel (see app/ml/):
- POST /predict            -> LSTM (PyTorch) / XGBoost / Holt-Winters forecast
- GET  /predict/early-warning -> Poisson surge detection across all cells
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.dependencies import get_current_active_user
from app.core.logging import get_logger
from app.ml.forecast import early_warning, run_forecast
from app.models.rbac import User

logger = get_logger("api.predict")

router = APIRouter(
    prefix="/predict",
    tags=["forecasting"],
    dependencies=[Depends(get_current_active_user)],
)


class PredictionInput(BaseModel):
    district: str
    crimeType: str
    months: int = Field(default=3, ge=1, le=12)
    modelType: str = Field(default="XGBoost", pattern="^(LSTM|XGBoost|Prophet)$")
    includeEnvironmental: bool = True
    includeEvents: bool = False


@router.post("", summary="Run ML crime forecast")
def run_prediction(req: PredictionInput, current_user: User = Depends(get_current_active_user)):
    try:
        result = run_forecast(
            district=req.district,
            crime_type=req.crimeType,
            months=req.months,
            model_type=req.modelType,
            include_environmental=req.includeEnvironmental,
            include_events=req.includeEvents,
        )
    except Exception as exc:
        logger.error("forecast failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=503, detail=f"Forecasting engine unavailable: {exc}") from exc
    logger.info(
        "forecast by %s: %s/%s model=%s engine=%s level=%s",
        current_user.username, req.district, req.crimeType,
        req.modelType, result["meta"]["engine"], result["meta"]["aggregationLevel"],
    )
    return result


@router.get("/early-warning", summary="Surge alerts across all district/crime cells")
def get_early_warning(current_user: User = Depends(get_current_active_user)):
    try:
        return early_warning()
    except Exception as exc:
        logger.error("early-warning scan failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=503, detail=f"Early-warning scan unavailable: {exc}") from exc
