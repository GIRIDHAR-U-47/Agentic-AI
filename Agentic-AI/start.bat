@echo off
title R-Lens - Academic Research Assistant Launcher
color 0B

echo ======================================================================
echo          R-Lens -- Academic Research Assistant Launcher
echo ======================================================================
echo.

cd /d "%~dp0"

:: Step 1: Backend Setup
echo [1/3] Preparing Backend - FastAPI...
cd /d "%~dp0backend"
if not exist "venv\Scripts\python.exe" (
    echo [*] Creating Python virtual environment in backend\venv...
    python -m venv venv
)

echo [*] Installing Python dependencies...
".\venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet

:: Step 2: Frontend Setup
echo.
echo [2/3] Preparing Frontend - React plus Vite...
cd /d "%~dp0frontend"
if not exist "node_modules\.bin\vite.cmd" (
    echo [*] Installing NPM packages. This is a one time setup...
    call npm install
)

:: Step 3: Launching servers
echo.
echo [3/3] Starting Backend and Frontend servers...
echo.

:: Start FastAPI Backend in a new window
start "R-Lens Backend - FastAPI :8000" /D "%~dp0backend" cmd /k "echo Starting FastAPI Backend on http://localhost:8000 && venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start Vite Frontend in a new window
start "R-Lens Frontend - Vite :5173" /D "%~dp0frontend" cmd /k "echo Starting React Vite Frontend on http://localhost:5173 && npm run dev"

echo ======================================================================
echo  R-Lens is running!
echo  - Web Application: http://localhost:5173
echo  - Backend API:     http://localhost:8000
echo  - API Docs:        http://localhost:8000/docs
echo ======================================================================
echo.
echo Opening browser in 3 seconds...
ping -n 4 127.0.0.1 >nul
start "" http://localhost:5173
