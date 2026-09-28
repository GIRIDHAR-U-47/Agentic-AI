@echo off
title R-Lens Frontend (React Vite)
color 0E

echo ======================================================================
echo          Starting R-Lens Frontend (Vite on Port 5173)
echo ======================================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [*] Installing NPM packages...
    call npm install
)

echo.
echo Starting Vite dev server at http://localhost:5173
echo.
npm run dev
pause
