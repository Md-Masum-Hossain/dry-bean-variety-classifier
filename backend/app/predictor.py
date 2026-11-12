"""Inference engine for loading serialized models, scalers, and running real-time predictions."""

import logging
import os
import time
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple

import joblib
import numpy as np

# Project directories - resolved dynamically relative to this file
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", str(BACKEND_DIR.parent))).resolve()

ARTIFACTS_DIR = PROJECT_ROOT / "artifacts"
MODELS_DIR = ARTIFACTS_DIR / "models"
METRICS_DIR = ARTIFACTS_DIR / "metrics"

FEATURE_NAMES = [
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

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


class BeanPredictor:
    """Manages model artifacts, feature scaling, and multi-model inference."""

    def __init__(self, models_dir: Path = MODELS_DIR) -> None:
        self.models_dir = models_dir
        self.scaler = None
        self.label_encoder = None
        self.models: Dict[str, Any] = {}
        self.default_model_name: str = "Support Vector Machine"
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Load scaler, label encoder, and all available model weights into memory."""
        scaler_file = self.models_dir / "scaler.joblib"
        le_file = self.models_dir / "label_encoder.joblib"

        if scaler_file.exists():
            self.scaler = joblib.load(scaler_file)
            logger.info("Loaded StandardScaler from: %s", scaler_file)
        else:
            logger.warning("Scaler not found at %s", scaler_file)

        if le_file.exists():
            self.label_encoder = joblib.load(le_file)
            logger.info("Loaded LabelEncoder with classes: %s", list(self.label_encoder.classes_))
        else:
            logger.warning("Label encoder not found at %s", le_file)

        # Mapping of friendly names to file slugs
        model_files = {
            "Support Vector Machine": "support_vector_machine.joblib",
            "Random Forest": "random_forest.joblib",
            "XGBoost": "xgboost.joblib",
            "Deep Learning (MLP)": "deep_learning_mlp.joblib",
            "Logistic Regression": "logistic_regression.joblib",
            "K-Nearest Neighbors": "k-nearest_neighbors.joblib",
            "Best Model": "best_model.joblib",
        }

        for display_name, filename in model_files.items():
            path = self.models_dir / filename
            if path.exists():
                try:
                    self.models[display_name] = joblib.load(path)
                    logger.info("Loaded model '%s' from %s", display_name, path)
                except Exception as e:
                    logger.error("Failed to load %s: %s", filename, e)

        if "Best Model" in self.models:
            self.default_model_name = "Best Model"
        elif "Support Vector Machine" in self.models:
            self.default_model_name = "Support Vector Machine"
        elif self.models:
            self.default_model_name = next(iter(self.models.keys()))

    def get_loaded_models(self) -> List[str]:
        """Return list of active model names."""
        return list(self.models.keys())

    def predict(
        self,
        features: Dict[str, float],
        model_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute inference on a single feature dictionary."""
        if not self.scaler or not self.label_encoder:
            raise RuntimeError("Inference engine artifacts (scaler/encoder) are not loaded.")

        target_model_name = model_name or self.default_model_name
        # Match case-insensitively if needed
        model = self.models.get(target_model_name)
        if model is None:
            for k in self.models:
                if k.lower() == target_model_name.lower():
                    model = self.models[k]
                    target_model_name = k
                    break

        if model is None:
            raise ValueError(
                f"Model '{target_model_name}' not found. Available models: {list(self.models.keys())}"
            )

        # Build feature vector in correct order
        vector = []
        for feat in FEATURE_NAMES:
            # Check for slight naming variance
            if feat in features:
                vector.append(float(features[feat]))
            elif feat.lower() in features:
                vector.append(float(features[feat.lower()]))
            elif feat == "AspectRation" and "AspectRatio" in features:
                vector.append(float(features["AspectRatio"]))
            else:
                raise ValueError(f"Missing required feature: '{feat}'")

        import pandas as pd
        df_input = pd.DataFrame([vector], columns=FEATURE_NAMES)
        X_scaled = self.scaler.transform(df_input)

        start_time = time.perf_counter()

        # Class probabilities
        classes = list(self.label_encoder.classes_)
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X_scaled)[0]
        else:
            # Fallback for models without predict_proba
            pred_idx = model.predict(X_scaled)[0]
            probs = np.zeros(len(classes), dtype=np.float64)
            probs[pred_idx] = 1.0

        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 3)

        top_idx = int(np.argmax(probs))
        predicted_class = str(classes[top_idx])
        confidence = round(float(probs[top_idx]), 4)

        probabilities_dict = {
            str(cls): round(float(prob), 4) for cls, prob in zip(classes, probs)
        }

        return {
            "predicted_class": predicted_class,
            "confidence": confidence,
            "class_probabilities": probabilities_dict,
            "model_used": target_model_name,
            "inference_time_ms": inference_time_ms,
        }


# Singleton instance
_predictor_instance: Optional[BeanPredictor] = None


def get_predictor() -> BeanPredictor:
    """Return singleton BeanPredictor instance."""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = BeanPredictor()
    return _predictor_instance
