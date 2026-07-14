@echo off
:: Helper launched by start-all.bat in its own window. Do not run directly
:: unless setup is already complete.
cd /d "%~dp0frontend"
echo [Frontend] Starting Next.js on http://localhost:3000 ...
call npm run dev:lowmem
pause
