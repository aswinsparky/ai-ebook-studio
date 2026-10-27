# Script to start AI Ebook Studio Backend
Write-Host "Starting AI Ebook Studio FastAPI Backend..." -ForegroundColor Cyan

$env:PYTHONPATH = "backend"
& "backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload

