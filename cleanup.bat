@echo off
REM IPTV M3U Sorter - Cleanup und Setup Script

echo 🧹 IPTV M3U Sorter - Aufräumen und Setup
echo ==========================================

REM Backup der aktuellen Dateien (falls vorhanden)
echo 📦 Erstelle Backups...
if exist "app.py" (
    copy "app.py" "app.py.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo    ✓ app.py gesichert
)

if exist "docker-compose.yml" (
    copy "docker-compose.yml" "docker-compose.yml.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo    ✓ docker-compose.yml gesichert
)

if exist ".env" (
    copy ".env" ".env.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    echo    ✓ .env gesichert
)

echo.
echo 🔄 Ersetze Dateien mit bereinigten Versionen...

if exist "app-clean.py" (
    copy "app-clean.py" "app.py"
    echo    ✓ app.py aktualisiert
)

if exist "docker-compose-clean.yml" (
    copy "docker-compose-clean.yml" "docker-compose.yml"
    echo    ✓ docker-compose.yml aktualisiert
)

echo    ✓ .env ist bereits aktuell

echo.
echo 🗑️  Lösche temporäre Dateien...

REM Lösche alle *-fixed.* Dateien
del /q *-fixed.* 2>nul
echo    ✓ *-fixed.* Dateien entfernt

REM Lösche alle *-clean.* Dateien
del /q app-clean.py docker-compose-clean.yml 2>nul
echo    ✓ *-clean.* Dateien entfernt

echo.
echo 📁 Erstelle notwendige Verzeichnisse...
if not exist "uploads" mkdir uploads
if not exist "saved_playlists" mkdir saved_playlists
echo    ✓ uploads\ und saved_playlists\ erstellt

echo.
echo ✅ Aufräumen abgeschlossen!
echo.
echo 📋 Aktuelle Dateien:
echo    📄 app.py (bereinigte Version)
echo    🐳 docker-compose.yml (bereinigte Version)
echo    ⚙️  .env (optimiert für iptv.home-lab.li)
echo    📁 uploads\ (für M3U Uploads)
echo    📁 saved_playlists\ (für gespeicherte Playlists)
echo.
echo 🚀 Bereit zum Starten mit:
echo    docker-compose up -d
echo.
echo 🏥 Health Check verfügbar unter:
echo    http://localhost:5000/ping-simple
echo    https://iptv.home-lab.li/ping-simple

pause