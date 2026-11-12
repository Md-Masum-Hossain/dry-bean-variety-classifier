"""Data preprocessing, cleaning, scaling, and splitting module for Dry Bean dataset."""

import json
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

from ml_pipeline.config import (
    RAW_DATA_XLSX,
    RAW_DATA_CSV,
    CLEANED_DATA_CSV,
    TRAIN_DATA_CSV,
    TEST_DATA_CSV,
    SAMPLE_RECORDS_JSON,
    SCALER_PATH,
    LABEL_ENCODER_PATH,
    FEATURE_NAMES,
    TARGET_COLUMN,
    RANDOM_STATE,
    TEST_SIZE,
)
from ml_pipeline.eda import load_raw_dataset

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger(__name__)


def clean_and_prepare_data(raw_data_path: Optional[Path] = None) -> pd.DataFrame:
    """Load raw data, normalize column names, and remove duplicate records."""
    df = load_raw_dataset(raw_data_path)

    initial_len = len(df)
    # Check and remove exact duplicates
    duplicates_count = df.duplicated().sum()
    if duplicates_count > 0:
        logger.info("Found %d duplicate rows. Removing duplicates...", duplicates_count)
        df = df.drop_duplicates().reset_index(drop=True)
        logger.info("Shape after duplicate removal: %s", df.shape)

    # Check for missing values
    missing_count = df.isnull().sum().sum()
    if missing_count > 0:
        logger.warning("Found %d missing values. Imputing with column median...", missing_count)
        numeric_cols = [c for c in FEATURE_NAMES if c in df.columns]
        df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    # Ensure all required features are present
    missing_features = [f for f in FEATURE_NAMES if f not in df.columns]
    if missing_features:
        raise ValueError(f"Missing expected features in dataset: {missing_features}")

    # Standardize target values to uppercase
    df[TARGET_COLUMN] = df[TARGET_COLUMN].astype(str).str.strip().str.upper()

    return df


def split_scale_and_persist(
    df: pd.DataFrame,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, StandardScaler, LabelEncoder]:
    """Split dataset into train and test sets, fit scaler & label encoder, and persist artifacts."""
    CLEANED_DATA_CSV.parent.mkdir(parents=True, exist_ok=True)
    SCALER_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Save cleaned full dataframe
    df.to_csv(CLEANED_DATA_CSV, index=False)
    logger.info("Cleaned dataset saved to: %s", CLEANED_DATA_CSV)

    X = df[FEATURE_NAMES].copy()
    y = df[TARGET_COLUMN].copy()

    # Stratified Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )
    logger.info("Dataset split: Train=%d, Test=%d (Stratified)", len(X_train), len(X_test))

    # Save unscaled raw train & test splits with target labels
    train_df = X_train.copy()
    train_df[TARGET_COLUMN] = y_train.values
    train_df.to_csv(TRAIN_DATA_CSV, index=False)

    test_df = X_test.copy()
    test_df[TARGET_COLUMN] = y_test.values
    test_df.to_csv(TEST_DATA_CSV, index=False)
    logger.info("Train and Test CSVs saved to %s and %s", TRAIN_DATA_CSV, TEST_DATA_CSV)

    # Generate sample records JSON for frontend test-drive & API benchmarking
    sample_records = []
    for cls_name in sorted(y.unique()):
        cls_samples = test_df[test_df[TARGET_COLUMN] == cls_name].head(2)
        for _, row in cls_samples.iterrows():
            record = {
                "ground_truth": cls_name,
                "features": {feat: float(row[feat]) for feat in FEATURE_NAMES},
            }
            sample_records.append(record)

    with open(SAMPLE_RECORDS_JSON, "w", encoding="utf-8") as f:
        json.dump(sample_records, f, indent=2)
    logger.info("Sample test records saved to: %s", SAMPLE_RECORDS_JSON)

    # Label Encoding
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_test_encoded = label_encoder.transform(y_test)
    joblib.dump(label_encoder, LABEL_ENCODER_PATH)
    logger.info("LabelEncoder fitted on %d classes and saved to: %s", len(label_encoder.classes_), LABEL_ENCODER_PATH)

    # Feature Scaling (StandardScaler)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("StandardScaler fitted and saved to: %s", SCALER_PATH)

    return X_train_scaled, X_test_scaled, y_train_encoded, y_test_encoded, scaler, label_encoder


def get_preprocessed_data() -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, StandardScaler, LabelEncoder]:
    """Orchestrate end-to-end data preparation workflow."""
    df = clean_and_prepare_data()
    return split_scale_and_persist(df)


if __name__ == "__main__":
    get_preprocessed_data()
