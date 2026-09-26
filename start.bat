@echo off
title R-Lens - Academic Research Assistant Launcher
color 0B

echo ======================================================================
echo          R-Lens -- Academic Research Assistant Launcher
echo ======================================================================
echo.

cd /d "%~dp0"

:: Step 1: Backend Setup
echo [1/3] Preparing Backend (FastAPI)...
cd /d "%~dp0backend"
if not exist "venv" (
    echo [*] Creating Python virtual environment in backend\venv...
    python -m venv venv
)

echo [*] Activating virtual environment & verifying dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

:: Step 2: Frontend Setup
echo.
echo [2/3] Preparing Frontend (React + Vite)...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [*] Installing NPM packages (one-time setup)...
    call npm install
)

:: Step 3: Launching servers
echo.
echo [3/3] Starting Backend and Frontend servers...
echo.

:: Start FastAPI Backend in a new window
start "R-Lens Backend (FastAPI :8000)" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && echo Starting FastAPI Backend on http://localhost:8000 && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Start Vite Frontend in a new window
start "R-Lens Frontend (Vite :5173)" cmd /k "cd /d "%~dp0frontend" && echo Starting React Vite Frontend on http://localhost:5173 && npm run dev"

echo ======================================================================
echo  R-Lens is running!
echo  - Web Application: http://localhost:5173
echo  - Backend API:     http://localhost:8000
echo  - API Docs:        http://localhost:8000/docs
echo ======================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:5173
