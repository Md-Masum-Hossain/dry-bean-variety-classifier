"""Feature selection and importance ranking module for Dry Bean dataset.

Computes univariate ANOVA F-test scores and tree-based Random Forest feature importances
to analyze which morphological features most strongly distinguish bean cultivars.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import f_classif

from ml_pipeline.config import (
    FEATURE_IMPORTANCE_JSON,
    FEATURE_NAMES,
    RANDOM_STATE,
    CLEANED_DATA_CSV,
    TARGET_COLUMN,
)
from ml_pipeline.preprocess import clean_and_prepare_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


def compute_feature_importance(
    df: Optional[pd.DataFrame] = None,
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Compute ANOVA F-test and Random Forest feature importance rankings."""
    if df is None:
        if CLEANED_DATA_CSV.exists():
            df = pd.read_csv(CLEANED_DATA_CSV)
        else:
            df = clean_and_prepare_data()

    out_file = output_path or FEATURE_IMPORTANCE_JSON
    out_file.parent.mkdir(parents=True, exist_ok=True)

    X = df[FEATURE_NAMES]
    y = df[TARGET_COLUMN]

    logger.info("Computing ANOVA F-test scores across %d features...", len(FEATURE_NAMES))
    f_scores, p_values = f_classif(X, y)

    # Normalize ANOVA scores to [0, 100] for intuitive visualization
    max_f = np.max(f_scores) if np.max(f_scores) > 0 else 1.0
    anova_results = []
    for feat, f_val, p_val in zip(FEATURE_NAMES, f_scores, p_values):
        anova_results.append({
            "feature": feat,
            "f_score": round(float(f_val), 2),
            "p_value": float(p_val),
            "score_normalized": round(float((f_val / max_f) * 100), 2),
        })
    # Sort descending
    anova_results.sort(key=lambda x: x["f_score"], reverse=True)
    for idx, item in enumerate(anova_results, start=1):
        item["rank"] = idx

    logger.info("Computing Random Forest feature importances (200 estimators)...")
    rf = RandomForestClassifier(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1)
    rf.fit(X, y)

    rf_results = []
    for feat, imp in zip(FEATURE_NAMES, rf.feature_importances_):
        rf_results.append({
            "feature": feat,
            "importance": round(float(imp), 4),
            "importance_percentage": round(float(imp * 100), 2),
        })
    rf_results.sort(key=lambda x: x["importance"], reverse=True)
    for idx, item in enumerate(rf_results, start=1):
        item["rank"] = idx

    # Calculate composite ranking (average rank from both methods)
    ranks = {}
    for item in anova_results:
        ranks[item["feature"]] = {"anova_rank": item["rank"]}
    for item in rf_results:
        ranks[item["feature"]]["rf_rank"] = item["rank"]

    composite_results = []
    for feat, r in ranks.items():
        avg_rank = (r["anova_rank"] + r["rf_rank"]) / 2.0
        composite_results.append({
            "feature": feat,
            "anova_rank": r["anova_rank"],
            "rf_rank": r["rf_rank"],
            "average_rank": avg_rank,
        })
    composite_results.sort(key=lambda x: x["average_rank"])
    for idx, item in enumerate(composite_results, start=1):
        item["final_rank"] = idx

    importance_payload = {
        "anova_f_test": anova_results,
        "random_forest_importance": rf_results,
        "composite_ranking": composite_results,
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(importance_payload, f, indent=2)

    logger.info("Feature importance saved to: %s", out_file)
    return importance_payload


if __name__ == "__main__":
    compute_feature_importance()
