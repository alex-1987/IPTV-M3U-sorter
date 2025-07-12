@echo off
REM IPTV M3U Sorter - Final Cleanup Script

echo 🗑️  IPTV M3U Sorter - Temporäre Dateien löschen
echo ===============================================

echo Lösche temporäre Dateien...

REM Lösche alle *-fixed.* Dateien
del /q *-fixed.* 2>nul
echo    ✓ *-fixed.* Dateien entfernt

REM Lösche alle *-clean.* Dateien  
del /q *-clean.* 2>nul
echo    ✓ *-clean.* Dateien entfernt

REM Lösche Backup-Dateien
del /q *.backup* 2>nul
echo    ✓ *.backup* Dateien entfernt

REM Lösche Cleanup-Scripts
del /q cleanup.sh cleanup.bat final-cleanup.sh 2>nul
echo    ✓ Cleanup-Scripts entfernt

echo.
echo ✅ Alle temporären Dateien wurden entfernt!
echo.
echo 📋 Verbleibende wichtige Dateien:
dir *.py *.yml *.env 2>nul
echo.
echo 🚀 Bereit zum Starten mit: docker-compose up -d

pause