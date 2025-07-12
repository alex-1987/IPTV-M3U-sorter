@echo off
echo Stopping IPTV M3U Sorter Docker Container...

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running.
    pause
    exit /b 1
)

:: Stop and remove the container
docker-compose down

if errorlevel 1 (
    echo Error: Failed to stop the container.
    pause
    exit /b 1
)

echo.
echo IPTV M3U Sorter has been stopped successfully!
echo.
pause
