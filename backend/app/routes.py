"""FastAPI REST API route handlers for Dry Bean predictions and metrics."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from backend.app.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionRequest,
    BatchPredictionResponse,
    HealthResponse,
)
from backend.app.predictor import get_predictor, PROJECT_ROOT, METRICS_DIR

logger = logging.getLogger(__name__)
router = APIRouter()

SAMPLE_RECORDS_PATH = PROJECT_ROOT / "data" / "processed" / "sample_test_records.json"


def _read_json_file(file_path: Path) -> Dict[str, Any]:
    """Helper to safely read and parse a JSON metric file."""
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artifact not found at {file_path.name}. Please ensure the ML pipeline has executed.",
        )
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read %s: %s", file_path, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading artifact {file_path.name}: {str(e)}",
        )


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check() -> HealthResponse:
    """Return system readiness, version, and loaded model registry."""
    predictor = get_predictor()
    models = predictor.get_loaded_models()
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        models_loaded=models,
        default_model=predictor.default_model_name,
    )


@router.get("/metrics/eda", tags=["Metrics"])
def get_eda_metrics() -> Dict[str, Any]:
    """Return exploratory data analysis stats, class distributions, and correlation matrix."""
    return _read_json_file(METRICS_DIR / "eda_stats.json")


@router.get("/metrics/models", tags=["Metrics"])
def get_model_benchmarks() -> Dict[str, Any]:
    """Return evaluation metrics, cross-validation scores, and confusion matrices for all models."""
    return _read_json_file(METRICS_DIR / "model_comparison.json")


@router.get("/metrics/features", tags=["Metrics"])
def get_feature_importance() -> Dict[str, Any]:
    """Return ANOVA F-test and Random Forest feature importance rankings."""
    return _read_json_file(METRICS_DIR / "feature_importance.json")


@router.get("/sample-data", tags=["Sample Data"])
def get_sample_data() -> List[Dict[str, Any]]:
    """Return pre-extracted test samples across all 7 bean varieties for 1-click test drives."""
    if not SAMPLE_RECORDS_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sample records not found. Please run the ML pipeline first.",
        )
    with open(SAMPLE_RECORDS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@router.post("/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_single(request: PredictionRequest) -> PredictionResponse:
    """Execute real-time classification on 16 geometric bean features."""
    try:
        predictor = get_predictor()
        feature_dict = request.features.model_dump()
        result = predictor.predict(
            features=feature_dict,
            model_name=request.model_name,
        )
        return PredictionResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error("Inference failed: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Inference error: {str(e)}")


@router.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Inference"])
def predict_batch(request: BatchPredictionRequest) -> BatchPredictionResponse:
    """Execute batch classification on an array of bean feature records."""
    if not request.samples:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No samples provided.")

    try:
        predictor = get_predictor()
        predictions: List[PredictionResponse] = []
        import time
        start_batch = time.perf_counter()

        for sample in request.samples:
            feature_dict = sample.model_dump()
            res = predictor.predict(features=feature_dict, model_name=request.model_name)
            predictions.append(PredictionResponse(**res))

        total_ms = round((time.perf_counter() - start_batch) * 1000, 3)
        model_used = predictions[0].model_used if predictions else (request.model_name or predictor.default_model_name)

        return BatchPredictionResponse(
            total_samples=len(predictions),
            predictions=predictions,
            model_used=model_used,
            total_time_ms=total_ms,
        )
    except Exception as e:
        logger.error("Batch inference failed: %s", e, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Batch error: {str(e)}")
