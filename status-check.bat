@echo off
REM IPTV M3U Sorter - Status Check after Cleanup

echo ✅ Cleanup erfolgreich abgeschlossen!
echo.
echo 📋 Verbleibende wichtige Dateien:
echo ==================================
echo.

REM Zeige alle wichtigen Dateien
if exist "app.py" echo    ✅ app.py (Flask Anwendung)
if exist "docker-compose.yml" echo    ✅ docker-compose.yml (Docker Konfiguration)
if exist ".env" echo    ✅ .env (Umgebungsvariablen)
if exist "requirements.txt" echo    ✅ requirements.txt (Python Dependencies)
if exist "Dockerfile" echo    ✅ Dockerfile (Docker Build)
if exist "wsgi.py" echo    ✅ wsgi.py (Gunicorn Entry Point)

echo.
echo 📁 Verzeichnisse:
if exist "uploads\" echo    ✅ uploads\ (Upload Verzeichnis)
if exist "saved_playlists\" echo    ✅ saved_playlists\ (Gespeicherte Playlists)
if exist "templates\" echo    ✅ templates\ (HTML Templates)
if exist "static\" echo    ✅ static\ (CSS/JS Dateien)

echo.
echo 📊 Datei-Details:
dir app.py docker-compose.yml .env 2>nul | findstr /v "Verzeichnis"

echo.
echo 🎯 Bereinigte Projektstruktur:
echo    📄 Nur eine app.py
echo    🐳 Nur eine docker-compose.yml  
echo    ⚙️  Nur eine .env
echo    📁 Saubere Verzeichnisse
echo.
echo 🚀 Bereit zum Starten mit:
echo    docker-compose up -d
echo.

pause