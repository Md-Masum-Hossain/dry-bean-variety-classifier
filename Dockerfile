# ==============================================================================
# Production Dockerfile for Hugging Face Spaces
# Dry Bean Variety Classification & Analytics Platform - Backend API
# ==============================================================================

FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PORT=7860

WORKDIR /app

# Install lightweight system dependencies (curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pre-install Python dependencies for optimal Docker layer caching
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy only the backend application, serialized model artifacts, and processed sample data
COPY backend/ /app/backend/
COPY artifacts/ /app/artifacts/
COPY data/processed/ /app/data/processed/

# Create and switch to non-root user (Hugging Face Spaces runs as user 1000)
RUN useradd -m -u 1000 user && \
    chown -R user:user /app

USER user

# Hugging Face Spaces exposes port 7860
EXPOSE 7860

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Launch production ASGI server on Hugging Face Spaces port 7860
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
