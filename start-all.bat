@echo off
setlocal enabledelayedexpansion
:: ========================================================
::   CrimeRakshak - START EVERYTHING (one click)
::   Starts database, backend and frontend. Runs first-time
::   setup automatically if it hasn't been done yet.
:: ========================================================
echo ========================================================
echo            CrimeRakshak - Starting all services
echo ========================================================
echo.

cd /d "%~dp0"

:: --- 1. Prerequisites ---
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running. Start it and retry.
    pause
    exit /b 1
)
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: --- 2. Env file ---
if not exist backend\.env (
    if exist .env.example (
        echo [INFO] Creating backend\.env from .env.example...
        copy .env.example backend\.env >nul
        echo [WARNING] Set GEMINI_API_KEY in backend\.env before using the AI chat.
    )
)

:: --- 3. Start PostgreSQL only (Neo4j is not used; saves memory) ---
echo [INFO] Starting PostgreSQL database...
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start PostgreSQL container.
    pause
    exit /b 1
)

echo [INFO] Waiting for PostgreSQL to be ready...
set PG_OK=0
for /L %%i in (1,1,20) do (
    docker exec crimerakshak-postgres pg_isready -U user -d crimerakshak >nul 2>&1
    if !errorlevel! equ 0 (
        set PG_OK=1
        goto pg_ready
    )
    timeout /t 2 >nul
)
:pg_ready
if !PG_OK! equ 0 (
    echo [WARNING] PostgreSQL did not report ready in time; continuing anyway.
) else (
    echo [SUCCESS] PostgreSQL is ready.
)

:: --- 4. Python virtual environment ---
if not exist backend\venv\Scripts\python.exe (
    echo [INFO] Creating Python virtual environment...
    python -m venv backend\venv
    echo [INFO] Installing backend dependencies (first time, may take a while)...
    backend\venv\Scripts\python.exe -m pip install --upgrade pip >nul
    backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
    if !errorlevel! neq 0 (
        echo [ERROR] Failed to install backend dependencies.
        pause
        exit /b 1
    )
)

:: --- 5. Initialize database (idempotent: safe to run every time) ---
echo [INFO] Ensuring database schema, migrations and seed data...
docker exec -i crimerakshak-postgres psql -U user -d crimerakshak < db\schema.sql >nul 2>&1
cd backend
venv\Scripts\python.exe -m alembic upgrade head
venv\Scripts\python.exe -m app.seed
echo [INFO] Building CSV analytics database (DuckDB)...
venv\Scripts\python.exe -m app.chat.data.loader
cd ..

:: --- 6. Frontend dependencies ---
node --version >nul 2>&1
set NODE_READY=%errorlevel%
if %NODE_READY% equ 0 (
    if not exist frontend\node_modules (
        echo [INFO] Installing frontend dependencies (first time)...
        cd frontend
        call npm install
        cd ..
    )
)

:: --- 7. Launch services ---
echo [INFO] Launching Backend API...
start "CrimeRakshak Backend API" cmd /k "cd /d \"%~dp0backend\" && venv\Scripts\uvicorn app.main:app --reload --port 8000"

if %NODE_READY% equ 0 (
    echo [INFO] Launching Frontend UI...
    start "CrimeRakshak Frontend UI" cmd /k "cd /d \"%~dp0frontend\" && call npm run dev:lowmem"
) else (
    echo [WARNING] Node.js not found - skipping frontend. Install Node.js to run the UI.
)

echo.
echo ========================================================
echo             CrimeRakshak is starting!
echo ========================================================
echo   [Frontend UI]  - http://localhost:3000/ai-assistant
echo   [Backend API]  - http://localhost:8000
echo   [API Docs]     - http://localhost:8000/docs
echo   [Login]        - username: admin
echo ========================================================
echo Servers run in their own windows. Close those windows to stop them.
echo To stop the database:  docker compose down
echo.
pause
