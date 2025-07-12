@echo off
REM IPTV M3U Sorter - Ultimate Cleanup Script
REM Löscht alle duplizierten und temporären Dateien

echo 🧹 IPTV M3U Sorter - Final Cleanup
echo ==================================
echo.

REM Backup wichtiger Dateien
echo 📦 Erstelle Backups der wichtigen Dateien...
set BACKUP_DIR=.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
mkdir "%BACKUP_DIR%" 2>nul

if exist "app.py" (
    copy "app.py" "%BACKUP_DIR%\app.py.backup" >nul
    echo    ✓ app.py gesichert
)

if exist ".env" (
    copy ".env" "%BACKUP_DIR%\.env.backup" >nul
    echo    ✓ .env gesichert
)

echo.
echo 🗑️  Lösche alle temporären und duplizierten Dateien...

REM Lösche alle Varianten von Dateien
del /q *-fixed.* 2>nul && echo    ✓ *-fixed.* Dateien gelöscht
del /q *-clean.* 2>nul && echo    ✓ *-clean.* Dateien gelöscht
del /q *-final.* 2>nul && echo    ✓ *-final.* Dateien gelöscht
del /q docker-compose-*.yml 2>nul && echo    ✓ docker-compose-*.yml Varianten gelöscht
del /q .env-* 2>nul && echo    ✓ .env-* Varianten gelöscht
del /q app-*.py 2>nul && echo    ✓ app-*.py Varianten gelöscht

REM Lösche Backup-Dateien
del /q *.backup* 2>nul && echo    ✓ *.backup* Dateien gelöscht

REM Lösche Cleanup-Scripts
del /q cleanup.* 2>nul && echo    ✓ cleanup.* Scripts gelöscht
del /q final-cleanup.* 2>nul && echo    ✓ final-cleanup.* Scripts gelöscht

REM Lösche README-Duplikate
del /q *README*.md 2>nul && echo    ✓ Temporäre README Dateien gelöscht

echo.
echo 📁 Erstelle fehlende Verzeichnisse...
if not exist "uploads" mkdir uploads
if not exist "saved_playlists" mkdir saved_playlists
echo    ✓ uploads\ und saved_playlists\ erstellt

echo.
echo ✅ Cleanup abgeschlossen!
echo.
echo 📋 Verbleibende wichtige Dateien:
echo ==================================
dir *.py *.yml *.env *.txt *.md *.json 2>nul | findstr /v backup | head -20
echo.
echo 📁 Verzeichnisse:
dir /ad 2>nul
echo.
echo 🎯 Finale Struktur:
echo    📄 app.py (Flask Anwendung^)
echo    🐳 docker-compose.yml (Docker Konfiguration^)
echo    ⚙️  .env (Umgebungsvariablen^)
echo    📋 requirements.txt (Python Dependencies^)
echo    🔨 Dockerfile (Docker Build^)
echo    📁 uploads\ (Upload Verzeichnis^)
echo    📁 saved_playlists\ (Gespeicherte Playlists^)
echo.
echo 🚀 Bereit zum Starten mit:
echo    docker-compose up -d
echo.

REM Selbst-Löschung
del "%~f0" 2>nul

pause