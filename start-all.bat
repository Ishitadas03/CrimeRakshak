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
echo [5] Install / Update Python Dependencies (incl. ML: xgboost, statsmodels, torch)
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
cd /d "%~dp0"
echo.
echo Database setup completed successfully!
pause
goto menu

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

echo.
echo === Launching FastAPI Backend ===
start "CrimeRakshak Backend" cmd /c "%~dp0_run-backend.bat"

echo === Launching Next.js Frontend ===
start "CrimeRakshak Frontend" cmd /c "%~dp0_run-frontend.bat"

echo.
echo CrimeRakshak is starting up in separate terminal windows!
echo - Backend:        http://localhost:8000
echo - Frontend:       http://localhost:3000
echo - Forecast API:   POST http://localhost:8000/api/v1/predict
echo - Early Warning:  GET  http://localhost:8000/api/v1/predict/early-warning
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
