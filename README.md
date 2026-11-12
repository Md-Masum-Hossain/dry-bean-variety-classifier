# Dry Bean Variety Classification & Analytics Platform

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg)](https://nextjs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4+-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end, industry-grade Artificial Intelligence and analytics platform for classifying dry bean cultivars using computer-vision-extracted geometric and morphological features from the **Kaggle / UCI Machine Learning Dry Bean Dataset** (13,611 instances, 16 continuous features, 7 bean classes: *Seker, Barbunya, Bombay, Cali, Dermason, Horoz, Sira*).

---

## 🏛️ System Architecture

```text
dry-bean-ai-system/
├── data/
│   ├── raw/                  # Raw Dry_Bean_Dataset.xlsx / .csv
│   └── processed/            # Cleaned data (13,543 rows), train/test splits, sample test records JSON
├── ml_pipeline/
│   ├── __init__.py
│   ├── config.py             # Hyperparameters, paths, seeds, feature schemas
│   ├── eda.py                # EDA statistics, class distributions & Pearson correlation
│   ├── preprocess.py         # Cleaning, duplicate handling, StandardScaler & LabelEncoder
│   ├── feature_selection.py  # ANOVA F-test & Random Forest feature importance rankings
│   ├── train.py              # Model training (LR, KNN, SVM, Random Forest, XGBoost, MLP)
│   ├── evaluate.py           # Metrics calculation, 5-Fold CV, Confusion Matrices
│   └── run_pipeline.py       # Master orchestrator script to run entire pipeline
├── artifacts/
│   ├── models/               # Serialized models (.joblib), scaler, label_encoder, best_model
│   └── metrics/              # JSON outputs (eda_stats.json, feature_importance.json, model_comparison.json)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI entry point with CORS enabled
│   │   ├── schemas.py        # Pydantic v2 schemas for 16 bean features & inference responses
│   │   ├── predictor.py      # Multi-model inference engine
│   │   └── routes.py         # Endpoints: /health, /metrics/*, /predict, /sample-data
│   └── requirements.txt
├── frontend/                 # Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide + Recharts
│   ├── src/
│   │   ├── app/              # Layout, globals.css, dashboard page
│   │   ├── components/       # InferencePlayground, ModelBenchmarking, FeatureImportance, EdaExplorer
│   │   └── lib/              # API clients, TypeScript interfaces & fallback artifacts
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

---

## 🔬 Model Benchmark Results

All models were evaluated on an identical **20% stratified holdout test split** (2,709 instances) and validated via **5-fold stratified cross-validation** on the training set:

| Model | Test Accuracy | Weighted F1 | 5-Fold CV F1 | Training Time |
| :--- | :---: | :---: | :---: | :---: |
| 🏆 **Support Vector Machine (RBF)** | **92.40%** | **92.40%** | **93.18% (±0.5%)** | 3.11s |
| 🧠 **Deep Learning (MLP / ANN)** | **92.17%** | **92.20%** | **93.06% (±0.7%)** | 2.81s |
| ⚡ **XGBoost Classifier** | **91.95%** | **91.96%** | **92.84% (±0.5%)** | 2.24s |
| 📈 **Logistic Regression (L-BFGS)** | **91.92%** | **91.93%** | **92.47% (±0.3%)** | 0.28s |
| 🌲 **Random Forest (200 Trees)** | **91.88%** | **91.87%** | **92.46% (±0.6%)** | 1.15s |
| 📍 **K-Nearest Neighbors (k=7)** | **91.36%** | **91.38%** | **92.36% (±0.6%)** | 0.003s |

*Winning model:* **Support Vector Machine** persisted to `artifacts/models/best_model.joblib`.

---

## 📊 Top Discriminating Morphological Features

Based on combined ANOVA F-test statistical ranking and Random Forest Gini impurity importance:
1. **Perimeter**: Primary size and boundary discriminator.
2. **ConvexArea**: Distinguishes large varieties (Bombay, Cali) from compact cultivars.
3. **MinorAxisLength**: Distinguishes slender elongated seeds (Horoz) from spherical cultivars (Seker).
4. **MajorAxisLength**: Major axis elongation marker.
5. **Area**: Mass and pixel volume proxy.

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Run the Machine Learning Pipeline
```bash
# Navigate to repository
cd dry-bean-ai-system

# Activate virtual environment
# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Execute end-to-end ML pipeline
python ml_pipeline/run_pipeline.py
```

### 3. Launch the FastAPI Backend
```bash
# Start backend server on port 8000
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive Swagger UI documentation is available at: `http://localhost:8000/docs`

### 4. Launch the Next.js Frontend Dashboard
```bash
# In another terminal:
cd frontend
npm run dev
```
Open your browser at: `http://localhost:3000`

---

## 🌐 API Contract Summary

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | Health status and loaded model inventory |
| `/metrics/eda` | `GET` | Dataset summary, class distribution, correlation matrix |
| `/metrics/models` | `GET` | Benchmark comparison metrics, 5-Fold CV, confusion matrices |
| `/metrics/features` | `GET` | ANOVA and Random Forest feature importance rankings |
| `/sample-data` | `GET` | 14 ground-truth verified test specimens across all 7 cultivars |
| `/predict` | `POST` | Real-time classification on 16 features with confidence scores |
| `/predict/batch` | `POST` | Batch classification on multiple bean feature records |

---

## ☁️ Cloud Deployment Guide

### A. Deploy Backend to Hugging Face Spaces (Docker)
1. **Create Space**: Navigate to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. **Space Configuration**:
   - **Space SDK**: Select **Docker** (Blank template).
   - **Space Hardware**: Free CPU basic tier is fully sufficient.
3. **Push Repository**:
   - Clone your Space repository locally or link your GitHub repo.
   - The included root `Dockerfile` and `.dockerignore` automatically configure:
     - Python 3.11-slim base image
     - Fast layer caching with `backend/requirements.txt`
     - Non-root user (UID 1000) compatible with Hugging Face runtime
     - Lean context including only `backend/`, `artifacts/`, and `data/processed/`
     - Listening on port `7860`: `uvicorn backend.app.main:app --host 0.0.0.0 --port 7860`
4. **Health Check & Verification**:
   - Verify health at: `https://<your-hf-space-id>.hf.space/health`
   - Interactive docs: `https://<your-hf-space-id>.hf.space/docs`

#### Local Docker Run (Verification):
```bash
docker build -t dry-bean-backend .
docker run -p 7860:7860 dry-bean-backend
```

### B. Deploy Frontend to Vercel
1. **Import Project**: In the [Vercel Dashboard](https://vercel.com), click **Add New** > **Project** and import your Git repository.
2. **Framework & Root Directory**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
3. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` pointing to your deployed backend:
     ```env
     NEXT_PUBLIC_API_URL=https://<your-hf-space-id>.hf.space
     ```
     *(Note: Any trailing slash is automatically stripped by `@/lib/api.ts`)*
4. **Deploy**: Click **Deploy**. Vercel will build and host your production Next.js platform globally with edge caching.

---

## 📝 License
MIT License. Created for production-grade agricultural AI classification and research analytics.
