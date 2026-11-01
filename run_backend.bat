@echo off
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --reload --port 8000
