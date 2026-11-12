"""Configuration parameters, paths, and constants for Dry Bean ML Pipeline."""

import os
from pathlib import Path
from typing import Dict, List, Any

# Base directories
PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"
METRICS_DIR = ARTIFACTS_DIR / "metrics"

# File paths
RAW_DATA_XLSX = RAW_DATA_DIR / "Dry_Bean_Dataset.xlsx"
RAW_DATA_CSV = RAW_DATA_DIR / "Dry_Bean_Dataset.csv"

CLEANED_DATA_CSV = PROCESSED_DATA_DIR / "cleaned_beans.csv"
TRAIN_DATA_CSV = PROCESSED_DATA_DIR / "train.csv"
TEST_DATA_CSV = PROCESSED_DATA_DIR / "test.csv"
SAMPLE_RECORDS_JSON = PROCESSED_DATA_DIR / "sample_test_records.json"

SCALER_PATH = MODELS_DIR / "scaler.joblib"
LABEL_ENCODER_PATH = MODELS_DIR / "label_encoder.joblib"
BEST_MODEL_PATH = MODELS_DIR / "best_model.joblib"

EDA_METRICS_JSON = METRICS_DIR / "eda_stats.json"
FEATURE_IMPORTANCE_JSON = METRICS_DIR / "feature_importance.json"
MODEL_COMPARISON_JSON = METRICS_DIR / "model_comparison.json"

# Dataset Schema
FEATURE_NAMES: List[str] = [
    "Area",
    "Perimeter",
    "MajorAxisLength",
    "MinorAxisLength",
    "AspectRation",
    "Eccentricity",
    "ConvexArea",
    "EquivDiameter",
    "Extent",
    "Solidity",
    "roundness",
    "Compactness",
    "ShapeFactor1",
    "ShapeFactor2",
    "ShapeFactor3",
    "ShapeFactor4",
]

TARGET_COLUMN: str = "Class"

BEAN_CLASSES: List[str] = [
    "BARBUNYA",
    "BOMBAY",
    "CALI",
    "DERMOSAN",
    "HOROZ",
    "SEKER",
    "SIRA",
]

# Feature descriptions and units for UI/Analytics
FEATURE_DESCRIPTIONS: Dict[str, str] = {
    "Area": "The area of a bean zone and the number of pixels within its boundaries (px^2)",
    "Perimeter": "Bean circumference defined as the length of its border (px)",
    "MajorAxisLength": "Distance between the ends of the longest line that can be drawn from a bean (px)",
    "MinorAxisLength": "Longest line perpendicular to the major axis (px)",
    "AspectRation": "Ratio of MajorAxisLength to MinorAxisLength (MajorAxisLength / MinorAxisLength)",
    "Eccentricity": "Eccentricity of the ellipse having the same moments as the region [0, 1)",
    "ConvexArea": "Number of pixels in the smallest convex polygon bounding the bean (px^2)",
    "EquivDiameter": "Diameter of a circle with the same area as the bean seed (px)",
    "Extent": "Ratio of the pixels in the bounding box to the bean area (Area / BoundingBox)",
    "Solidity": "Ratio of pixels in the convex shell to those found in beans (Area / ConvexArea)",
    "roundness": "Calculated with the formula (4 * pi * Area) / (Perimeter^2)",
    "Compactness": "Measure of bean roundness: EquivDiameter / MajorAxisLength",
    "ShapeFactor1": "Morphological descriptor 1 (MajorAxisLength / Area)",
    "ShapeFactor2": "Morphological descriptor 2 (MinorAxisLength / Area)",
    "ShapeFactor3": "Morphological descriptor 3 (Area / ((MajorAxisLength / 2)^2 * pi))",
    "ShapeFactor4": "Morphological descriptor 4 (Area / ((MajorAxisLength / 2) * (MinorAxisLength / 2) * pi))",
}

# Training Hyperparameters
RANDOM_STATE: int = 42
TEST_SIZE: float = 0.20
CV_FOLDS: int = 5

MODEL_HYPERPARAMETERS: Dict[str, Dict[str, Any]] = {
    "Logistic Regression": {
        "max_iter": 1000,
        "solver": "lbfgs",
        "random_state": RANDOM_STATE,
        "C": 1.0,
    },
    "K-Nearest Neighbors": {
        "n_neighbors": 7,
        "weights": "distance",
        "metric": "minkowski",
    },
    "Support Vector Machine": {
        "C": 3.0,
        "kernel": "rbf",
        "gamma": "scale",
        "probability": True,
        "random_state": RANDOM_STATE,
    },
    "Random Forest": {
        "n_estimators": 200,
        "max_depth": 16,
        "min_samples_split": 4,
        "random_state": RANDOM_STATE,
        "n_jobs": -1,
    },
    "XGBoost": {
        "n_estimators": 200,
        "max_depth": 6,
        "learning_rate": 0.08,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "random_state": RANDOM_STATE,
        "eval_metric": "mlogloss",
        "n_jobs": -1,
    },
    "Deep Learning (MLP)": {
        "hidden_layer_sizes": (128, 64, 32),
        "activation": "relu",
        "solver": "adam",
        "alpha": 0.0005,
        "max_iter": 300,
        "early_stopping": True,
        "validation_fraction": 0.1,
        "random_state": RANDOM_STATE,
    },
}
