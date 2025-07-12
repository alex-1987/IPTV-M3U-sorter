@echo off
echo Updating IPTV M3U Sorter Docker Container...

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

:: Stop current container
echo Stopping current container...
docker-compose down

:: Rebuild and start with fresh image
echo Rebuilding and starting container...
docker-compose up -d --build --force-recreate

if errorlevel 1 (
    echo Error: Failed to update the container.
    pause
    exit /b 1
)

echo.
echo IPTV M3U Sorter has been updated and is now running!
echo.
echo Access the application at: http://localhost:5000
echo.
pause
