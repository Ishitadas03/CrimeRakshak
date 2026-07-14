@echo off
:: Helper launched by start-all.bat in its own window. Do not run directly
:: unless setup is already complete.
cd /d "%~dp0backend"
echo [Backend] Starting FastAPI on http://localhost:8000 ...
call venv\Scripts\activate.bat
python -m uvicorn app.main:app --reload --port 8000
pause
