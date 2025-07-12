@echo off
REM IPTV M3U Sorter - Setup Script for Windows

echo ===================================
echo IPTV M3U Sorter - Setup Script
echo ===================================
echo.

echo [1/3] Creating virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    echo Please make sure Python 3.7+ is installed and in PATH
    pause
    exit /b 1
)

echo [2/3] Installing dependencies...
venv\Scripts\pip.exe install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/3] Setup complete!
echo.
echo To start the application:
echo   1. Run: start_server.bat
echo   2. Open browser to: http://localhost:5000
echo.
echo You can also use the example_playlist.m3u file for testing.
echo.
pause
