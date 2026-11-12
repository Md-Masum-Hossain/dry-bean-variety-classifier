"""Model training module for Dry Bean variety classification.

Trains classical Machine Learning models (Logistic Regression, KNN, SVM, Random Forest, XGBoost)
and a Deep Learning architecture (Multi-Layer Perceptron / ANN) on scaled geometric features.
"""

import logging
import time
from pathlib import Path
from typing import Dict, Any, Tuple

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from xgboost import XGBClassifier

from ml_pipeline.config import (
    MODELS_DIR,
    MODEL_HYPERPARAMETERS,
    RANDOM_STATE,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


def build_models() -> Dict[str, Any]:
    """Instantiate all required classifiers with calibrated hyperparameters."""
    models: Dict[str, Any] = {
        "Logistic Regression": LogisticRegression(
            **MODEL_HYPERPARAMETERS["Logistic Regression"]
        ),
        "K-Nearest Neighbors": KNeighborsClassifier(
            **MODEL_HYPERPARAMETERS["K-Nearest Neighbors"]
        ),
        "Support Vector Machine": SVC(
            **MODEL_HYPERPARAMETERS["Support Vector Machine"]
        ),
        "Random Forest": RandomForestClassifier(
            **MODEL_HYPERPARAMETERS["Random Forest"]
        ),
        "XGBoost": XGBClassifier(
            **MODEL_HYPERPARAMETERS["XGBoost"]
        ),
        "Deep Learning (MLP)": MLPClassifier(
            **MODEL_HYPERPARAMETERS["Deep Learning (MLP)"]
        ),
    }
    return models


def train_single_model(
    model_name: str,
    model: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
) -> Tuple[Any, float]:
    """Train a single model and record execution duration."""
    logger.info("Training %s...", model_name)
    start_time = time.perf_counter()
    model.fit(X_train, y_train)
    elapsed_time = round(time.perf_counter() - start_time, 3)
    logger.info("Completed %s training in %.3f seconds.", model_name, elapsed_time)
    return model, elapsed_time


def train_all_models(
    X_train: np.ndarray,
    y_train: np.ndarray,
    save_models: bool = True,
) -> Dict[str, Dict[str, Any]]:
    """Train all machine learning and deep learning models and optionally serialize them.

    Returns:
        Dict mapping model name to dict with 'model', 'training_time_sec', and 'file_path'.
    """
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    models = build_models()
    trained_registry: Dict[str, Dict[str, Any]] = {}

    for name, model_instance in models.items():
        fitted_model, elapsed = train_single_model(name, model_instance, X_train, y_train)

        slug = name.lower().replace(" ", "_").replace("(", "").replace(")", "")
        model_file = MODELS_DIR / f"{slug}.joblib"

        if save_models:
            joblib.dump(fitted_model, model_file)
            logger.info("Saved serialized model to %s", model_file)

        trained_registry[name] = {
            "model": fitted_model,
            "training_time_sec": elapsed,
            "file_path": str(model_file),
            "slug": slug,
        }

    return trained_registry


if __name__ == "__main__":
    from ml_pipeline.preprocess import get_preprocessed_data

    X_train_s, _, y_train_e, _, _, _ = get_preprocessed_data()
    train_all_models(X_train_s, y_train_e)
