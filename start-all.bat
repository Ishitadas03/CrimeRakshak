@echo off
title CrimeRakshak - Project Startup Control Center
cls
echo ======================================================================
echo           CRIMERAKSHAK - SYSTEM STARTUP CONTROL CENTER
echo ======================================================================
echo.

:menu
echo Choose an option to proceed:
echo [1] Quick Start (Start databases and launch servers)
echo [2] Full Setup + Run (Databases, deps, init DBs, ingest, seed, launch)
echo [3] Database Setup Only (Init database schemas, run ingestion and seed)
echo [4] Start Application Servers Only (FastAPI backend + Next.js frontend)
echo [5] Install / Update Dependencies (Python incl. ML + frontend npm packages)
echo [6] Stop Databases (docker-compose down)
echo [7] Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto quickstart
if "%choice%"=="2" goto fullsetup
if "%choice%"=="3" goto dbsetup
if "%choice%"=="4" goto startservers
if "%choice%"=="5" goto installdeps
if "%choice%"=="6" goto stopdb
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
echo.
goto menu

:quickstart
echo.
echo === Starting Databases via Docker Compose ===
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Failed to run 'docker compose up -d'. Ensure Docker Desktop is running.
    pause
)
goto startservers

:fullsetup
echo.
echo === Starting Databases via Docker Compose ===
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to run 'docker compose up -d'. Ensure Docker Desktop is running.
    pause
    goto menu
)

call :dodeps
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Dependency installation failed.
    pause
    goto menu
)

echo.
echo === Initializing Databases ===
echo Running schema migrations, cypher constraints, and seeds...
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python initialize_db.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database initialization failed.
    cd /d "%~dp0"
    pause
    goto menu
)

echo.
echo === Seeding RBAC / Initial Superuser ===
python -m app.seed
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Seeding failed.
    cd /d "%~dp0"
    pause
    goto menu
)

echo.
echo === Running Data Ingestion Pipeline ===
python ingest.py
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Data ingestion pipeline failed. Moving forward...
)

call :doduck
cd /d "%~dp0"
goto startservers

:dbsetup
echo.
echo === Initializing Databases ===
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python initialize_db.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database initialization failed.
    cd /d "%~dp0"
    pause
    goto menu
)

echo.
echo === Seeding RBAC / Initial Superuser ===
python -m app.seed
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Seeding failed.
    cd /d "%~dp0"
    pause
    goto menu
)

echo.
echo === Running Data Ingestion Pipeline ===
python ingest.py
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Data ingestion pipeline failed.
)
call :doduck
cd /d "%~dp0"
echo.
echo Database setup completed successfully!
pause
goto menu

:: Subroutine: synthetic case data + DuckDB analytics database.
:: Run from backend dir with venv active. Powers chat, analytics, network,
:: forecasting AND the financial-crime module (case_transactions).
:doduck
echo.
echo === Generating Synthetic Case Data (cases, people, accounts, transactions) ===
python -m app.chat.data.case_generator
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Synthetic case generation failed.
)
echo.
echo === Building DuckDB Analytics Database (crime_stats.duckdb, 13 tables) ===
python -m app.chat.data.loader
if %ERRORLEVEL% neq 0 (
    echo [WARNING] DuckDB build failed - chat/analytics/financial APIs may 503.
)
exit /b 0

:installdeps
call :dodeps
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Dependency installation failed. Check the output above.
) else (
    echo.
    echo Dependencies installed successfully!
)
pause
goto menu

:: Subroutine: install backend requirements + optional CPU torch for the LSTM engine
:: + frontend npm packages (incl. react-force-graph-2d for the network graph)
:dodeps
echo.
echo === Installing Python Dependencies (backend/requirements.txt) ===
cd /d "%~dp0backend"
call venv\Scripts\activate.bat
python -m pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    cd /d "%~dp0"
    exit /b 1
)
echo.
echo === Installing PyTorch CPU (optional - powers the LSTM forecast engine) ===
python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
if %ERRORLEVEL% neq 0 (
    echo [WARNING] PyTorch install failed. The LSTM model will fall back to a sklearn MLP.
)
echo.
echo === Installing Frontend Dependencies (npm install) ===
cd /d "%~dp0frontend"
call npm install
if %ERRORLEVEL% neq 0 (
    echo [WARNING] npm install failed - the Criminal Network graph page needs
    echo           react-force-graph-2d and d3-force-3d to render.
)
cd /d "%~dp0"
exit /b 0

:startservers
echo.
echo === Preflight: Forecasting ML dependencies ===
"%~dp0backend\venv\Scripts\python.exe" -c "import sklearn, xgboost, statsmodels" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] ML packages missing in backend venv - /api/v1/predict will fail.
    echo           Run option [5] to install them, then restart the servers.
) else (
    echo ML dependencies OK.
)

echo === Preflight: DuckDB analytics data ===
"%~dp0backend\venv\Scripts\python.exe" -c "import duckdb; con = duckdb.connect(r'%~dp0backend\crime_stats.duckdb', read_only=True); con.execute('SELECT 1 FROM case_transactions LIMIT 1'); con.close()" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [WARNING] crime_stats.duckdb missing or lacks case_transactions -
    echo           chat/analytics/financial APIs will return 503.
    echo           Run option [3] Database Setup to build it.
) else (
    echo DuckDB data OK - financial transaction ledger present.
)

echo === Preflight: Synthetic case CSVs (Case Intelligence data) ===
if exist "%~dp0datasets\synthetic_cases\cases.csv" (
    if exist "%~dp0datasets\synthetic_cases\case_people.csv" (
        echo Case CSVs OK - FIR profiles, timelines, similar cases and leads available.
    ) else (
        echo [WARNING] case_people.csv missing - Case Intelligence panels will be empty.
        echo           Run option [3] Database Setup to regenerate synthetic cases.
    )
) else (
    echo [WARNING] datasets\synthetic_cases\cases.csv missing -
    echo           /graph/firs/list and /graph/fir/{id} fall back to bare Neo4j
    echo           stubs and the Case Intelligence page will look empty.
    echo           Run option [3] Database Setup to generate them.
)

echo === Preflight: Frontend network-graph dependencies ===
if exist "%~dp0frontend\node_modules\react-force-graph-2d" (
    if exist "%~dp0frontend\node_modules\d3-force-3d" (
        echo Frontend graph libraries OK - react-force-graph-2d + d3-force-3d present.
    ) else (
        echo [WARNING] d3-force-3d missing - the Criminal Network page will not compile.
        echo           Run option [5] Install Dependencies to fix.
    )
) else (
    echo [WARNING] react-force-graph-2d missing - the Criminal Network page will not compile.
    echo           Run option [5] Install Dependencies to fix.
)

echo.
echo === Launching FastAPI Backend ===
start "CrimeRakshak Backend" cmd /c "%~dp0_run-backend.bat"

echo === Launching Next.js Frontend ===
start "CrimeRakshak Frontend" cmd /c "%~dp0_run-frontend.bat"

echo.
echo CrimeRakshak is starting up in separate terminal windows!
echo - Backend:        http://localhost:8001
echo - Frontend:       http://localhost:3000
echo - Forecast API:   POST http://localhost:8001/api/v1/predict
echo - Early Warning:  GET  http://localhost:8001/api/v1/predict/early-warning
echo - Financial API:  GET  http://localhost:8001/api/v1/financial/suspicious
echo - Money Trail:    GET  http://localhost:8001/api/v1/financial/money-trail
echo - Network Graph:  GET  http://localhost:8001/api/v1/network/full  (Criminal Network page)
echo - Case Intel:     GET  http://localhost:8001/api/v1/graph/firs/list  (CSV-backed, 1200 FIRs)
echo - Chat + Trace:   POST http://localhost:8001/api/v1/chat  (answers include reasoning trace)
echo - Audit Trail:    GET  http://localhost:8001/api/v1/admin/audit-logs  (Explainability page)
echo.
echo Explainable AI: every chat answer returns a step-by-step tool trace,
echo is written to the persistent audit log, and is visualized on the
echo /explainability and /ai-assistant pages.
echo.
echo Case Intelligence: FIR profiles, timelines, similar cases and AI leads
echo are served from the rich synthetic case CSVs first, with Neo4j as
echo fallback for externally ingested FIRs.
echo.
echo Feel free to close this menu.
pause
goto menu

:stopdb
echo.
echo === Stopping Docker Databases ===
docker compose down
echo Databases stopped.
pause
goto menu

:exit
exit
