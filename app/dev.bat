@echo off
setlocal

:: Resolve directory of this script (app folder)
set "APP_DIR=%~dp0"

echo ========================================================
echo   Pasona Finance - Local Development Launcher
echo ========================================================
echo.

:: Check that required project folders exist
if not exist "%APP_DIR%backend" (
    echo [ERROR] Backend directory not found: %APP_DIR%backend
    pause
    exit /b 1
)

if not exist "%APP_DIR%frontend" (
    echo [ERROR] Frontend directory not found: %APP_DIR%frontend
    pause
    exit /b 1
)

:: Verify PHP availability
where php >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 'php' command was not found in PATH.
    echo Please make sure PHP 8.2+ is installed and added to PATH.
    pause
    exit /b 1
)

:: Determine frontend package manager command (prefer pnpm, fallback to npm)
where pnpm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "FRONTEND_CMD=pnpm dev"
) else (
    set "FRONTEND_CMD=npm run dev"
)

:: 1. Launch Laravel API Server
echo [1/2] Launching Backend API (Laravel on port 8000)...
start "Pasona Finance - API (Port 8000)" /D "%APP_DIR%backend" cmd /k "php artisan serve --port=8000"

:: 2. Launch Vite Frontend Server
echo [2/2] Launching Frontend Web (Vite on port 5173)...
start "Pasona Finance - Frontend (Port 5173)" /D "%APP_DIR%frontend" cmd /k "%FRONTEND_CMD%"

:: Optional: Launch Queue Worker if requested via --queue or --with-queue
if "%~1"=="--queue" goto launch_queue
if "%~1"=="--with-queue" goto launch_queue
if "%~1"=="-q" goto launch_queue
goto show_summary

:launch_queue
echo [+] Launching Background Queue Worker (php artisan queue:listen)...
start "Pasona Finance - Queue Worker" /D "%APP_DIR%backend" cmd /k "php artisan queue:listen"

:show_summary
echo.
echo ========================================================
echo   Both applications launched in dedicated terminal windows:
echo     * Backend API:  http://127.0.0.1:8000
echo     * Frontend Web: http://localhost:5173
echo.
echo   Tip: Run "dev.bat --queue" to also launch the queue worker.
echo   To stop either service, switch to its window and press Ctrl+C.
echo   You can safely close this launcher window at any time.
echo ========================================================
pause >nul
