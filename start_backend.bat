@echo off
title R-Lens Backend (FastAPI)
color 0A

echo ======================================================================
echo          Starting R-Lens Backend (FastAPI on Port 8000)
echo ======================================================================
echo.

cd /d "%~dp0backend"

if not exist "venv" (
    echo [*] Creating virtual environment...
    python -m venv venv
)

echo [*] Activating venv and checking dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

echo.
echo Starting FastAPI server at http://localhost:8000
echo Swagger UI docs available at http://localhost:8000/docs
echo.
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
