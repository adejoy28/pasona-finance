@echo off
setlocal
if exist "%~dp0app\dev.bat" (
    call "%~dp0app\dev.bat" %*
) else (
    echo [ERROR] app\dev.bat not found at "%~dp0app\dev.bat".
    pause
    exit /b 1
)
