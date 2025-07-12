@echo off
echo Starting IPTV M3U Sorter Docker Container...

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Build and start the container
docker-compose up -d --build

if errorlevel 1 (
    echo Error: Failed to start the container.
    pause
    exit /b 1
)

echo.
echo IPTV M3U Sorter is now running!
echo.
echo Access the application at: http://localhost:5000
echo.
echo To stop the container, run: stop.bat
echo.
pause
