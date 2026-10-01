@echo off
title R-Lens Academic Research Assistant - Launcher
color 0B

echo ===============================================================================
echo                R-LENS: AGENTIC AI RESEARCH ASSISTANT
echo                     Unified Full-Stack Launcher
echo ===============================================================================
echo.

:: Resolve absolute script directory path
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

:: Locate project root
if exist "%SCRIPT_DIR%\backend\main.py" (
    set "PROJECT_ROOT=%SCRIPT_DIR%"
) else if exist "%SCRIPT_DIR%\Agentic-AI\backend\main.py" (
    set "PROJECT_ROOT=%SCRIPT_DIR%\Agentic-AI"
) else (
    set "PROJECT_ROOT=%SCRIPT_DIR%"
)

set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"

echo [*] Project Root : %PROJECT_ROOT%
echo [*] Backend Dir  : %BACKEND_DIR%
echo [*] Frontend Dir : %FRONTEND_DIR%
echo.

:: -----------------------------------------------------------------------------
:: Check Prerequisites
:: -----------------------------------------------------------------------------
where python >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PY_CMD=python"
) else (
    where py >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        set "PY_CMD=py"
    ) else (
        echo [ERROR] Python was not found in your PATH.
        echo Please install Python 3.10+ from https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    )
)

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js / npm was not found in your PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

:: -----------------------------------------------------------------------------
:: Step 1: Environment Configuration Sync
:: -----------------------------------------------------------------------------
echo [1/4] Checking Environment Configurations...

if not exist "%BACKEND_DIR%\.env" (
    if exist "%PROJECT_ROOT%\.env" (
        copy /y "%PROJECT_ROOT%\.env" "%BACKEND_DIR%\.env" >nul
        echo     [+] Copied root .env to backend\.env
    )
)
if not exist "%BACKEND_DIR%\.env" (
    if exist "%BACKEND_DIR%\.env.example" (
        copy /y "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
        echo     [+] Created backend\.env from .env.example template
    )
)

if not exist "%FRONTEND_DIR%\.env" (
    if exist "%PROJECT_ROOT%\frontend\.env" (
        copy /y "%PROJECT_ROOT%\frontend\.env" "%FRONTEND_DIR%\.env" >nul
        echo     [+] Copied frontend\.env configuration
    ) else (
        echo VITE_GEMINI_API_KEY= > "%FRONTEND_DIR%\.env"
        echo     [+] Created initial frontend\.env
    )
)

echo     [+] Environment files verified.

:: -----------------------------------------------------------------------------
:: Step 2: Backend Setup
:: -----------------------------------------------------------------------------
echo.
echo [2/4] Preparing Backend - FastAPI and Agentic Engine...
cd /d "%BACKEND_DIR%"

if not exist "%BACKEND_DIR%\venv\Scripts\python.exe" (
    echo     [*] Creating Python virtual environment venv...
    %PY_CMD% -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo     [*] Checking Python dependencies...
"%BACKEND_DIR%\venv\Scripts\python.exe" -m pip install -r requirements.txt --quiet

if not exist "%BACKEND_DIR%\data\rlens.sqlite3" (
    echo     [*] Initializing SQLite database and pinned research corpus...
    "%BACKEND_DIR%\venv\Scripts\python.exe" scripts\fetch_corpus.py
)

:: -----------------------------------------------------------------------------
:: Step 3: Frontend Setup
:: -----------------------------------------------------------------------------
echo.
echo [3/4] Preparing Frontend - React and Vite...
cd /d "%FRONTEND_DIR%"

if not exist "%FRONTEND_DIR%\node_modules" (
    echo     [*] Installing Node.js packages...
    call npm install --no-audit
    if errorlevel 1 (
        echo [ERROR] NPM install failed.
        pause
        exit /b 1
    )
)

:: -----------------------------------------------------------------------------
:: Step 4: Launching Services
:: -----------------------------------------------------------------------------
echo.
echo [4/4] Starting Backend and Frontend services...
echo.

:: Launch Backend in separate window
start "R-Lens Backend" /D "%BACKEND_DIR%" cmd /k "color 0A && title R-Lens Backend [FastAPI :8000] && echo ====================================================================== && echo   R-Lens Backend running at http://localhost:8000 && echo   Swagger Docs: http://localhost:8000/docs && echo ====================================================================== && echo. && venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Launch Frontend in separate window
start "R-Lens Frontend" /D "%FRONTEND_DIR%" cmd /k "color 09 && title R-Lens Frontend [Vite :5173] && echo ====================================================================== && echo   R-Lens Frontend UI running at http://localhost:5173 && echo ====================================================================== && echo. && npm run dev"

echo ===============================================================================
echo                       R-LENS SERVICES ARE RUNNING!
echo ===============================================================================
echo.
echo   * Web Application UI : http://localhost:5173
echo   * Backend REST API   : http://localhost:8000
echo   * Interactive Docs   : http://localhost:8000/docs
echo   * Health Endpoint    : http://localhost:8000/
echo.
echo ===============================================================================
echo.
echo Launching Web Browser at http://localhost:5173 in 3 seconds...
ping -n 4 127.0.0.1 >nul
start "" http://localhost:5173

echo.
echo [i] Keep this window and the server windows open while working.
echo [i] To stop all servers, close the respective terminal windows.
echo.
pause
