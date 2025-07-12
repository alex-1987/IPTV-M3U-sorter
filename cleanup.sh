#!/bin/bash
# IPTV M3U Sorter - Cleanup und Setup Script

echo "🧹 IPTV M3U Sorter - Aufräumen und Setup"
echo "=========================================="

# Backup der aktuellen Dateien (falls vorhanden)
echo "📦 Erstelle Backups..."
if [ -f "app.py" ]; then
    cp app.py app.py.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✓ app.py gesichert"
fi

if [ -f "docker-compose.yml" ]; then
    cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✓ docker-compose.yml gesichert"
fi

if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   ✓ .env gesichert"
fi

# Ersetze mit den bereinigten Versionen
echo ""
echo "🔄 Ersetze Dateien mit bereinigten Versionen..."

if [ -f "app-clean.py" ]; then
    cp app-clean.py app.py
    echo "   ✓ app.py aktualisiert"
fi

if [ -f "docker-compose-clean.yml" ]; then
    cp docker-compose-clean.yml docker-compose.yml
    echo "   ✓ docker-compose.yml aktualisiert"
fi

# .env ist bereits erstellt, keine Aktion nötig
echo "   ✓ .env ist bereits aktuell"

# Lösche temporäre Dateien
echo ""
echo "🗑️  Lösche temporäre Dateien..."

# Lösche alle *-fixed.* Dateien
rm -f *-fixed.*
echo "   ✓ *-fixed.* Dateien entfernt"

# Lösche alle *-clean.* Dateien (außer die, die wir gerade kopiert haben)
rm -f app-clean.py docker-compose-clean.yml
echo "   ✓ *-clean.* Dateien entfernt"

# Stelle sicher, dass die Verzeichnisse existieren
echo ""
echo "📁 Erstelle notwendige Verzeichnisse..."
mkdir -p uploads saved_playlists
chmod 755 uploads saved_playlists
echo "   ✓ uploads/ und saved_playlists/ erstellt"

# Zeige den aktuellen Status
echo ""
echo "✅ Aufräumen abgeschlossen!"
echo ""
echo "📋 Aktuelle Dateien:"
echo "   📄 app.py (bereinigte Version)"
echo "   🐳 docker-compose.yml (bereinigte Version)"
echo "   ⚙️  .env (optimiert für iptv.home-lab.li)"
echo "   📁 uploads/ (für M3U Uploads)"
echo "   📁 saved_playlists/ (für gespeicherte Playlists)"
echo ""
echo "🚀 Bereit zum Starten mit:"
echo "   docker-compose up -d"
echo ""
echo "🏥 Health Check verfügbar unter:"
echo "   http://localhost:5000/ping-simple"
echo "   https://iptv.home-lab.li/ping-simple"