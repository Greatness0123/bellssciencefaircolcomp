# Sentinel AI Backend

FastAPI backend with SQLite database and Suricata event ingestion for the Sentinel AI Security Operations Console.

## Prerequisites
- Python 3.11+
- Virtual environment in `backend/venv`

## Quick Start

### 1. Activate Environment
Windows (PowerShell):
```powershell
backend\venv\Scripts\Activate.ps1
```

### 2. Start the API Server
Run either:
```powershell
.\run_backend.ps1
```
or via Python directly:
```powershell
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000
```
or via npm:
```powershell
npm run backend
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/api/docs`
- Health Endpoint: `http://localhost:8000/health`
- WebSocket Alerts: `ws://localhost:8000/ws/alerts`

### 3. Seed Accounts
Pre-configured user accounts:
- Admin: `admin@sentinel.ai` / `SentinelAdmin2026!`
- Analyst: `analyst@sentinel.ai` / `SentinelAnalyst2026!`
- Viewer: `viewer@sentinel.ai` / `SentinelViewer2026!`

To reseed the database at any time:
```powershell
backend/venv/Scripts/python backend/seed_data.py
```

