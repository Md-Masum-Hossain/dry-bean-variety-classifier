@echo off
title Dry Bean Variety Classification Platform
echo ===================================================
echo Starting Dry Bean AI Platform (Backend + Frontend)
echo ===================================================

echo [1/2] Launching FastAPI Backend on port 8000...
start "Dry Bean - Backend API" cmd /k "cd /d %~dp0 && .venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Next.js Frontend on port 3000...
start "Dry Bean - Frontend Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo System successfully launched!
echo Frontend Dashboard : http://localhost:3000
echo Backend API Docs   : http://localhost:8000/docs
echo ===================================================
