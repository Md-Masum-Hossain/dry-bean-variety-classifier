"""Exploratory Data Analysis (EDA) module for Dry Bean Dataset.

Generates comprehensive statistical summaries, class distributions, and correlation
matrices formatted as JSON for the web dashboard and analytics reporting.
"""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np
import pandas as pd

from ml_pipeline.config import (
    RAW_DATA_XLSX,
    RAW_DATA_CSV,
    EDA_METRICS_JSON,
    FEATURE_NAMES,
    TARGET_COLUMN,
    FEATURE_DESCRIPTIONS,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


def load_raw_dataset(file_path: Optional[Path] = None) -> pd.DataFrame:
    """Load the raw dataset from XLSX or CSV format."""
    path = file_path or (RAW_DATA_XLSX if RAW_DATA_XLSX.exists() else RAW_DATA_CSV)
    if not path.exists():
        raise FileNotFoundError(f"Raw dataset not found at {path}. Please provide Dry_Bean_Dataset.xlsx or .csv.")

    logger.info("Loading raw dataset from: %s", path)
    if path.suffix.lower() in [".xlsx", ".xls"]:
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)

    # Normalize column names if needed (e.g., AspectRatio vs AspectRation)
    column_mapping = {}
    for col in df.columns:
        if col.lower() == "aspectratio" or col.lower() == "aspectration":
            column_mapping[col] = "AspectRation"
        elif col.lower() == "class":
            column_mapping[col] = "Class"
        elif col.lower() == "roundness":
            column_mapping[col] = "roundness"
    if column_mapping:
        df = df.rename(columns=column_mapping)

    logger.info("Dataset loaded successfully with shape: %s", df.shape)
    return df


def generate_eda_report(
    raw_data_path: Optional[Path] = None,
    output_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Analyze dataset statistics, distributions, and correlation, and save to JSON.

    Returns the structured dictionary of EDA metrics.
    """
    df = load_raw_dataset(raw_data_path)
    out_file = output_path or EDA_METRICS_JSON
    out_file.parent.mkdir(parents=True, exist_ok=True)

    numeric_cols = [c for c in FEATURE_NAMES if c in df.columns]
    target_col = TARGET_COLUMN if TARGET_COLUMN in df.columns else df.columns[-1]

    # 1. High-level dataset metadata
    total_samples = int(len(df))
    num_features = len(numeric_cols)
    missing_values = int(df.isnull().sum().sum())
    duplicates_count = int(df.duplicated().sum())

    # 2. Class distribution
    class_counts = df[target_col].value_counts().to_dict()
    class_distribution = []
    for cls_name, count in sorted(class_counts.items(), key=lambda x: x[1], reverse=True):
        class_distribution.append({
            "class": str(cls_name),
            "count": int(count),
            "percentage": round(float(count / total_samples * 100), 2),
        })

    # 3. Overall Feature statistics
    feature_statistics = {}
    desc_df = df[numeric_cols].describe().T
    for feat in numeric_cols:
        series = df[feat].dropna()
        feature_statistics[feat] = {
            "name": feat,
            "description": FEATURE_DESCRIPTIONS.get(feat, ""),
            "mean": round(float(series.mean()), 4),
            "std": round(float(series.std()), 4),
            "min": round(float(series.min()), 4),
            "q25": round(float(series.quantile(0.25)), 4),
            "median": round(float(series.median()), 4),
            "q75": round(float(series.quantile(0.75)), 4),
            "max": round(float(series.max()), 4),
            "skewness": round(float(series.skew()), 4),
            "kurtosis": round(float(series.kurt()), 4),
        }

    # 4. Class-wise mean comparisons for radar / comparison charts
    class_means = df.groupby(target_col)[numeric_cols].mean().to_dict(orient="index")
    class_wise_means = {
        cls: {feat: round(float(val), 4) for feat, val in vals.items()}
        for cls, vals in class_means.items()
    }

    # 5. Correlation Matrix (Pearson)
    corr_matrix = df[numeric_cols].corr().round(4).to_dict()

    # Formatted correlation matrix for heatmap rendering (features list + 2D array)
    corr_grid = []
    for f1 in numeric_cols:
        row = []
        for f2 in numeric_cols:
            row.append(round(float(corr_matrix[f1][f2]), 4))
        corr_grid.append(row)

    eda_data: Dict[str, Any] = {
        "dataset_summary": {
            "total_samples": total_samples,
            "feature_count": num_features,
            "missing_values": missing_values,
            "duplicate_records": duplicates_count,
            "target_classes_count": len(class_distribution),
        },
        "class_distribution": class_distribution,
        "feature_statistics": feature_statistics,
        "class_wise_means": class_wise_means,
        "correlation": {
            "features": numeric_cols,
            "matrix": corr_grid,
        },
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(eda_data, f, indent=2)

    logger.info("EDA report successfully generated and saved to: %s", out_file)
    return eda_data


if __name__ == "__main__":
    generate_eda_report()
