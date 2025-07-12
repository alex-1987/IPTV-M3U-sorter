@echo off
REM IPTV M3U Sorter - Start Server Script

echo ===================================
echo IPTV M3U Sorter - Starting Server
echo ===================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run setup.bat first.
    pause
    exit /b 1
)

echo Starting Flask development server...
echo Open your browser to: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

venv\Scripts\python.exe app.py
