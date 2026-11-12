"""FastAPI main entry point for the Dry Bean Variety Classification & Analytics Platform."""

import logging
import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure root directory is on sys.path dynamically relative to this file
CURRENT_FILE = Path(__file__).resolve()
PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", str(CURRENT_FILE.parent.parent.parent))).resolve()
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.routes import router
from backend.app.predictor import get_predictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize ML predictor and pre-load serialized models."""
    logger.info("Initializing Dry Bean Inference Engine and loading artifacts...")
    predictor = get_predictor()
    loaded = predictor.get_loaded_models()
    logger.info("Inference engine ready. %d models loaded: %s", len(loaded), loaded)
    yield
    logger.info("Shutting down Dry Bean Backend Service.")


app = FastAPI(
    title="Dry Bean Variety Classification & Analytics Platform API",
    description=(
        "Production-grade REST API serving real-time and batch predictions, exploratory data analytics, "
        "feature importance metrics, and comprehensive model benchmarking across 7 dry bean cultivars."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable Cross-Origin Resource Sharing (CORS) for frontend integrations:
# - Supports local dev (localhost:3000), Vercel deployments (*.vercel.app),
# - Public demo access (*), and custom domain overrides via CORS_ALLOWED_ORIGINS
cors_origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
custom_origins = [orig.strip() for orig in cors_origins_env.split(",") if orig.strip()]

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
] + custom_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API endpoints under root / and /api prefix for flexibility
app.include_router(router, prefix="")
app.include_router(router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    """Root health and discovery endpoint."""
    return JSONResponse(
        content={
            "platform": "Dry Bean Variety Classification & Analytics Platform",
            "version": "1.0.0",
            "status": "online",
            "docs_url": "/docs",
            "endpoints": [
                "/health",
                "/metrics/eda",
                "/metrics/models",
                "/metrics/features",
                "/sample-data",
                "/predict",
                "/predict/batch",
            ],
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
