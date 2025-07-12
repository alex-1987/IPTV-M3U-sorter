@echo off
echo Testing Docker image locally before Docker Hub push...
echo.

:: Setze deine Docker Hub Benutzerdaten hier
set DOCKER_USER=alex1987
set IMAGE_NAME=iptv-m3u-sorter

echo Building Docker image...
docker build -t %DOCKER_USER%/%IMAGE_NAME%:test .
if errorlevel 1 (
    echo Error: Docker build failed.
    pause
    exit /b 1
)

echo.
echo Starting test container on port 5001...
docker run -d --name iptv-sorter-test -p 5001:5000 %DOCKER_USER%/%IMAGE_NAME%:test
if errorlevel 1 (
    echo Error: Failed to start test container.
    pause
    exit /b 1
)

echo.
echo ✅ Test container started successfully!
echo.
echo 🌐 Test your application at: http://localhost:5001
echo.
echo Press any key when you're done testing...
pause

echo.
echo Stopping and removing test container...
docker stop iptv-sorter-test
docker rm iptv-sorter-test

echo Removing test image...
docker rmi %DOCKER_USER%/%IMAGE_NAME%:test

echo.
echo ✅ Test cleanup completed!
echo.
echo If everything worked correctly, you can now run:
echo    docker-hub-push.bat
echo.
pause
