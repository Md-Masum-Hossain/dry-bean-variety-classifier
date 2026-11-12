"""Model evaluation and comparative metrics benchmarking module for Dry Bean classifiers.

Computes Accuracy, Precision, Recall, F1-Scores, Confusion Matrices, and 5-fold CV scores.
Selects and persists the best performing model to artifacts/models/best_model.joblib and
exports detailed benchmarking metrics to artifacts/metrics/model_comparison.json.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report,
)
from sklearn.model_selection import cross_val_score, StratifiedKFold

from ml_pipeline.config import (
    MODEL_COMPARISON_JSON,
    BEST_MODEL_PATH,
    CV_FOLDS,
    RANDOM_STATE,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


def evaluate_single_model(
    model_name: str,
    model: Any,
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    class_names: List[str],
    training_time_sec: float = 0.0,
) -> Dict[str, Any]:
    """Evaluate a trained model on test data and calculate metrics."""
    logger.info("Evaluating %s...", model_name)

    # Predictions
    y_pred = model.predict(X_test)

    # Primary metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    # Cross-validation on training set (5-fold stratified)
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="f1_weighted", n_jobs=-1)
    cv_mean = float(np.mean(cv_scores))
    cv_std = float(np.std(cv_scores))

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    cm_norm = confusion_matrix(y_test, y_pred, normalize="true")

    # Detailed per-class classification report
    report_dict = classification_report(
        y_test,
        y_pred,
        target_names=class_names,
        output_dict=True,
        zero_division=0,
    )

    per_class_metrics = {}
    for cls in class_names:
        if cls in report_dict:
            per_class_metrics[cls] = {
                "precision": round(float(report_dict[cls]["precision"]), 4),
                "recall": round(float(report_dict[cls]["recall"]), 4),
                "f1_score": round(float(report_dict[cls]["f1-score"]), 4),
                "support": int(report_dict[cls]["support"]),
            }

    model_metrics = {
        "model_name": model_name,
        "accuracy": round(acc, 4),
        "f1_weighted": round(f1_weighted, 4),
        "f1_macro": round(f1_macro, 4),
        "precision_weighted": round(prec_weighted, 4),
        "precision_macro": round(prec_macro, 4),
        "recall_weighted": round(rec_weighted, 4),
        "recall_macro": round(rec_macro, 4),
        "cv_f1_mean": round(cv_mean, 4),
        "cv_f1_std": round(cv_std, 4),
        "training_time_sec": round(training_time_sec, 3),
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_normalized": [[round(float(val), 4) for val in row] for row in cm_norm],
        "class_labels": class_names,
        "per_class_metrics": per_class_metrics,
    }

    logger.info(
        "%s - Acc: %.4f | F1 (Weighted): %.4f | 5-Fold CV F1: %.4f (+/- %.4f)",
        model_name,
        acc,
        f1_weighted,
        cv_mean,
        cv_std,
    )
    return model_metrics


def evaluate_and_compare_all_models(
    trained_registry: Dict[str, Dict[str, Any]],
    X_train: np.ndarray,
    y_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    class_names: List[str],
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Evaluate all trained models, rank them, persist best model, and write comparison JSON."""
    out_file = output_path or MODEL_COMPARISON_JSON
    out_file.parent.mkdir(parents=True, exist_ok=True)
    BEST_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    evaluated_models: List[Dict[str, Any]] = []

    for name, item in trained_registry.items():
        model = item["model"]
        training_time = item.get("training_time_sec", 0.0)
        metrics = evaluate_single_model(
            model_name=name,
            model=model,
            X_train=X_train,
            y_train=y_train,
            X_test=X_test,
            y_test=y_test,
            class_names=class_names,
            training_time_sec=training_time,
        )
        evaluated_models.append(metrics)

    # Rank models by test f1_weighted descending
    evaluated_models.sort(key=lambda m: (m["f1_weighted"], m["accuracy"]), reverse=True)
    for rank, m in enumerate(evaluated_models, start=1):
        m["rank"] = rank

    best_model_name = evaluated_models[0]["model_name"]
    best_model_obj = trained_registry[best_model_name]["model"]

    # Persist best model to standard path
    joblib.dump(best_model_obj, BEST_MODEL_PATH)
    logger.info("Persisted best model (%s) to: %s", best_model_name, BEST_MODEL_PATH)

    summary_payload = {
        "best_model": {
            "name": best_model_name,
            "accuracy": evaluated_models[0]["accuracy"],
            "f1_weighted": evaluated_models[0]["f1_weighted"],
            "cv_f1_mean": evaluated_models[0]["cv_f1_mean"],
        },
        "models": evaluated_models,
        "classes": class_names,
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)

    logger.info("Saved model comparison report to: %s", out_file)
    return summary_payload
