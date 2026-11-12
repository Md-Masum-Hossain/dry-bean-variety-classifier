# Dry Bean AI Platform Launcher Script
$root = $PSScriptRoot
$pythonExe = Join-Path $root ".venv\Scripts\python.exe"
$frontendDir = Join-Path $root "frontend"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting Dry Bean AI Platform (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

# Start Backend
Write-Host "[1/2] Starting FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root'; & '$pythonExe' -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/2] Starting Next.js Frontend Dashboard on port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendDir'; npm run dev"

Write-Host "`nSystem successfully launched!" -ForegroundColor Cyan
Write-Host "Frontend Dashboard : http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API Docs   : http://localhost:8000/docs" -ForegroundColor Yellow
