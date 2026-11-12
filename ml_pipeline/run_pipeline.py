"""Master Orchestrator script for the Dry Bean Machine Learning Pipeline.

Executes the complete machine learning lifecycle:
  1. Exploratory Data Analysis & Statistical Profiling
  2. Data Cleaning, Preprocessing, Scaling & Train/Test Splitting
  3. Feature Importance Analysis (ANOVA F-test + Random Forest)
  4. Multi-model Training (Logistic Regression, KNN, SVM, RF, XGBoost, Deep Learning MLP)
  5. Evaluation, Cross-Validation, Metrics Export & Best Model Serialization
"""

import logging
import sys
import time
from pathlib import Path

# Add project root to sys.path so modules can import cleanly
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = CURRENT_FILE.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml_pipeline.config import (
    RAW_DATA_XLSX,
    RAW_DATA_CSV,
    ARTIFACTS_DIR,
    MODELS_DIR,
    METRICS_DIR,
    PROCESSED_DATA_DIR,
)
from ml_pipeline.eda import generate_eda_report
from ml_pipeline.preprocess import clean_and_prepare_data, split_scale_and_persist
from ml_pipeline.feature_selection import compute_feature_importance
from ml_pipeline.train import train_all_models
from ml_pipeline.evaluate import evaluate_and_compare_all_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ml_pipeline.orchestrator")


def run_full_pipeline() -> None:
    """Run the entire end-to-end ML pipeline."""
    total_start_time = time.perf_counter()
    logger.info("=" * 70)
    logger.info("STARTING DRY BEAN CLASSIFICATION & ANALYTICS ML PIPELINE")
    logger.info("=" * 70)

    # Ensure output directories exist
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)

    # Check raw data availability
    if not RAW_DATA_XLSX.exists() and not RAW_DATA_CSV.exists():
        logger.error(
            "Raw dataset not found! Please place Dry_Bean_Dataset.xlsx or Dry_Bean_Dataset.csv in %s",
            RAW_DATA_XLSX.parent,
        )
        sys.exit(1)

    # -------------------------------------------------------------
    # Step 1: Exploratory Data Analysis
    # -------------------------------------------------------------
    logger.info("\n>>> [STEP 1/5] Running Exploratory Data Analysis (EDA)...")
    eda_stats = generate_eda_report()
    summary = eda_stats["dataset_summary"]
    logger.info(
        "EDA Complete: %d samples, %d features, %d duplicates detected.",
        summary["total_samples"],
        summary["feature_count"],
        summary["duplicate_records"],
    )

    # -------------------------------------------------------------
    # Step 2: Data Preprocessing, Scaling & Splitting
    # -------------------------------------------------------------
    logger.info("\n>>> [STEP 2/5] Cleaning, Preprocessing & Scaling Data...")
    df_cleaned = clean_and_prepare_data()
    X_train, X_test, y_train, y_test, scaler, label_encoder = split_scale_and_persist(df_cleaned)
    class_names = [str(cls) for cls in label_encoder.classes_]
    logger.info(
        "Preprocessing Complete: Train shape = %s, Test shape = %s, Classes = %s",
        X_train.shape,
        X_test.shape,
        class_names,
    )

    # -------------------------------------------------------------
    # Step 3: Feature Selection & Importance Ranking
    # -------------------------------------------------------------
    logger.info("\n>>> [STEP 3/5] Evaluating Feature Importance (ANOVA F-test & Random Forest)...")
    feature_importance = compute_feature_importance(df_cleaned)
    top_3_features = [item["feature"] for item in feature_importance["composite_ranking"][:3]]
    logger.info("Feature Ranking Complete. Top 3 discriminating features: %s", top_3_features)

    # -------------------------------------------------------------
    # Step 4: Model Training
    # -------------------------------------------------------------
    logger.info("\n>>> [STEP 4/5] Training Classifiers (ML & Deep Learning)...")
    trained_registry = train_all_models(X_train, y_train, save_models=True)
    logger.info("Training Complete: %d models successfully trained and serialized.", len(trained_registry))

    # -------------------------------------------------------------
    # Step 5: Model Evaluation & Benchmarking
    # -------------------------------------------------------------
    logger.info("\n>>> [STEP 5/5] Evaluating Models & Computing Benchmark Metrics...")
    benchmark_results = evaluate_and_compare_all_models(
        trained_registry=trained_registry,
        X_train=X_train,
        y_train=y_train,
        X_test=X_test,
        y_test=y_test,
        class_names=class_names,
    )

    total_time = round(time.perf_counter() - total_start_time, 2)
    logger.info("\n" + "=" * 70)
    logger.info("PIPELINE EXECUTION SUMMARY (Total Elapsed: %.2f seconds)", total_time)
    logger.info("=" * 70)
    logger.info("%-26s | %-10s | %-12s | %-12s", "Model Name", "Accuracy", "F1 (Weighted)", "5-Fold CV F1")
    logger.info("-" * 70)
    for model_info in benchmark_results["models"]:
        logger.info(
            "%-26s | %-10.4f | %-12.4f | %-12.4f",
            model_info["model_name"],
            model_info["accuracy"],
            model_info["f1_weighted"],
            model_info["cv_f1_mean"],
        )
    logger.info("-" * 70)
    logger.info("WINNING MODEL: %s (Test F1: %.4f)", benchmark_results["best_model"]["name"], benchmark_results["best_model"]["f1_weighted"])
    logger.info("All model weights and metric JSONs have been saved under 'artifacts/'.")
    logger.info("=" * 70)


if __name__ == "__main__":
    run_full_pipeline()
