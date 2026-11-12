"""Pydantic schemas and data validation models for Dry Bean inference and analytics API."""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class BeanFeatures(BaseModel):
    """16 geometric and morphological features of a dry bean sample."""

    Area: float = Field(..., description="Area of bean zone in pixels", ge=0.0)
    Perimeter: float = Field(..., description="Bean circumference in pixels", ge=0.0)
    MajorAxisLength: float = Field(..., description="Longest line distance in bean", ge=0.0)
    MinorAxisLength: float = Field(..., description="Longest line perpendicular to major axis", ge=0.0)
    AspectRation: float = Field(..., description="Ratio of MajorAxisLength to MinorAxisLength", ge=0.0)
    Eccentricity: float = Field(..., description="Eccentricity of fitted ellipse [0, 1)", ge=0.0, le=1.0)
    ConvexArea: float = Field(..., description="Smallest convex polygon pixel area", ge=0.0)
    EquivDiameter: float = Field(..., description="Equivalent circle diameter", ge=0.0)
    Extent: float = Field(..., description="Ratio of pixels in bounding box to area", ge=0.0, le=1.0)
    Solidity: float = Field(..., description="Convexity (Area / ConvexArea)", ge=0.0, le=1.0)
    roundness: float = Field(..., description="Roundness factor (4*pi*Area)/(Perimeter^2)", ge=0.0, le=1.5)
    Compactness: float = Field(..., description="Compactness (EquivDiameter / MajorAxisLength)", ge=0.0)
    ShapeFactor1: float = Field(..., description="Shape factor 1 (MajorAxisLength / Area)", ge=0.0)
    ShapeFactor2: float = Field(..., description="Shape factor 2 (MinorAxisLength / Area)", ge=0.0)
    ShapeFactor3: float = Field(..., description="Shape factor 3", ge=0.0)
    ShapeFactor4: float = Field(..., description="Shape factor 4", ge=0.0)

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "Area": 42339.0,
                "Perimeter": 759.526,
                "MajorAxisLength": 273.49,
                "MinorAxisLength": 197.66,
                "AspectRation": 1.3836,
                "Eccentricity": 0.6917,
                "ConvexArea": 42795.0,
                "EquivDiameter": 232.18,
                "Extent": 0.7634,
                "Solidity": 0.9893,
                "roundness": 0.9231,
                "Compactness": 0.8489,
                "ShapeFactor1": 0.006459,
                "ShapeFactor2": 0.002166,
                "ShapeFactor3": 0.7207,
                "ShapeFactor4": 0.9972,
            }
        },
    )


class PredictionRequest(BaseModel):
    """Inference request payload containing feature vector and optional model selector."""

    features: BeanFeatures
    model_name: Optional[str] = Field(
        default=None,
        description="Optional model selector: 'Support Vector Machine', 'Random Forest', 'XGBoost', 'Deep Learning (MLP)', 'Logistic Regression', 'K-Nearest Neighbors', or default best model.",
    )


class PredictionResponse(BaseModel):
    """Prediction result with winning class, confidence score, and full distribution."""

    predicted_class: str
    confidence: float
    class_probabilities: Dict[str, float]
    model_used: str
    inference_time_ms: float
    ground_truth: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    """Batch inference request payload."""

    samples: List[BeanFeatures]
    model_name: Optional[str] = None


class BatchPredictionResponse(BaseModel):
    """Batch inference response payload."""

    total_samples: int
    predictions: List[PredictionResponse]
    model_used: str
    total_time_ms: float


class HealthResponse(BaseModel):
    """API health and readiness check response."""

    status: str
    version: str
    models_loaded: List[str]
    default_model: str
