@echo off
echo Building and pushing IPTV M3U Sorter to Docker Hub...
echo.

:: Setze deine Docker Hub Benutzerdaten hier
set DOCKER_USER=alex1987
set IMAGE_NAME=iptv-m3u-sorter
set VERSION=v2.0.0

echo Docker Hub Login...
docker login
if errorlevel 1 (
    echo Error: Docker login failed.
    pause
    exit /b 1
)

echo.
echo Building Docker image...
docker build -t %DOCKER_USER%/%IMAGE_NAME%:latest .
if errorlevel 1 (
    echo Error: Docker build failed.
    pause
    exit /b 1
)

echo.
echo Creating version tag...
docker tag %DOCKER_USER%/%IMAGE_NAME%:latest %DOCKER_USER%/%IMAGE_NAME%:%VERSION%

echo.
echo Creating stable tag...
docker tag %DOCKER_USER%/%IMAGE_NAME%:latest %DOCKER_USER%/%IMAGE_NAME%:stable

echo.
echo Pushing to Docker Hub...
echo Pushing latest tag...
docker push %DOCKER_USER%/%IMAGE_NAME%:latest
if errorlevel 1 (
    echo Error: Failed to push latest tag.
    pause
    exit /b 1
)

echo Pushing version tag...
docker push %DOCKER_USER%/%IMAGE_NAME%:%VERSION%
if errorlevel 1 (
    echo Error: Failed to push version tag.
    pause
    exit /b 1
)

echo Pushing stable tag...
docker push %DOCKER_USER%/%IMAGE_NAME%:stable
if errorlevel 1 (
    echo Error: Failed to push stable tag.
    pause
    exit /b 1
)

echo.
echo ✅ Successfully pushed to Docker Hub!
echo.
echo 🔗 Your image is now available at:
echo    docker pull %DOCKER_USER%/%IMAGE_NAME%:latest
echo    docker pull %DOCKER_USER%/%IMAGE_NAME%:%VERSION%
echo    docker pull %DOCKER_USER%/%IMAGE_NAME%:stable
echo.
echo 🌐 Docker Hub: https://hub.docker.com/r/%DOCKER_USER%/%IMAGE_NAME%
echo.
pause
