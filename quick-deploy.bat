@echo off
echo 🚀 IPTV M3U Sorter - Docker Hub Deployment
echo ==========================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker ist nicht installiert oder nicht im PATH!
    echo Bitte installiere Docker Desktop: https://docs.docker.com/desktop/windows/
    pause
    exit /b 1
)

echo 📋 Setup Konfiguration...
echo.

set /p domain="Domain/IP (default: localhost): "
set /p port="Port (default: 5000): "
set /p https="HTTPS aktiviert? (y/n, default: n): "

if "%domain%"=="" set domain=localhost
if "%port%"=="" set port=5000
if "%https%"=="" set https=n

REM Generate secret key (simple random)
set secret_key=secret-key-%RANDOM%%RANDOM%%RANDOM%

echo.
echo 📝 Erstelle Konfiguration...

REM Create directories
if not exist uploads mkdir uploads
if not exist saved_playlists mkdir saved_playlists

REM Create .env file
echo # IPTV M3U Sorter Configuration > .env
echo DOMAIN=%domain% >> .env
echo HOST_PORT=%port% >> .env
echo SECRET_KEY=%secret_key% >> .env

if /i "%https%"=="y" (
    echo HTTPS_ENABLED=true >> .env
    echo URL_SCHEME=https >> .env
) else (
    echo HTTPS_ENABLED=false >> .env
    echo URL_SCHEME=http >> .env
)

REM Create docker-compose.yml
echo version: '3.8' > docker-compose.yml
echo. >> docker-compose.yml
echo services: >> docker-compose.yml
echo   iptv-sorter: >> docker-compose.yml
echo     image: alexfl1987/iptv-m3u-sorter:latest-stable >> docker-compose.yml
echo     container_name: iptv-m3u-sorter >> docker-compose.yml
echo     ports: >> docker-compose.yml
echo       - "${HOST_PORT:-5000}:5000" >> docker-compose.yml
echo     volumes: >> docker-compose.yml
echo       - ./uploads:/app/uploads >> docker-compose.yml
echo       - ./saved_playlists:/app/saved_playlists >> docker-compose.yml
echo     environment: >> docker-compose.yml
echo       - SECRET_KEY=${SECRET_KEY} >> docker-compose.yml
echo       - DOMAIN=${DOMAIN} >> docker-compose.yml
echo       - HTTPS_ENABLED=${HTTPS_ENABLED:-false} >> docker-compose.yml
echo       - URL_SCHEME=${URL_SCHEME:-http} >> docker-compose.yml
echo       - SECURE_HEADERS=true >> docker-compose.yml
echo     restart: unless-stopped >> docker-compose.yml
echo     healthcheck: >> docker-compose.yml
echo       test: ["CMD", "curl", "-f", "http://localhost:5000/health"] >> docker-compose.yml
echo       interval: 30s >> docker-compose.yml
echo       timeout: 10s >> docker-compose.yml
echo       retries: 3 >> docker-compose.yml
echo       start_period: 40s >> docker-compose.yml

echo.
echo 🐳 Starte Container...
echo.

REM Stop any existing container
docker-compose down >nul 2>&1

REM Start the container
docker-compose up -d
if errorlevel 1 (
    echo ❌ Fehler beim Starten des Containers!
    echo Prüfe die Logs mit: docker-compose logs
    pause
    exit /b 1
)

echo.
echo ✅ IPTV M3U Sorter erfolgreich gestartet!
echo.
echo 🌐 Zugriff:
if /i "%https%"=="y" (
    echo    https://%domain%:%port%
) else (
    echo    http://%domain%:%port%
)
echo.
echo 🏥 Health Check: http://%domain%:%port%/health
echo 📊 Logs anzeigen: docker-compose logs -f
echo 🛑 Stoppen: docker-compose down
echo.
echo 📁 Daten werden gespeichert in:
echo    ./uploads/ (Hochgeladene Dateien)
echo    ./saved_playlists/ (Gespeicherte Playlists)
echo.
pause
