#!/bin/bash
# IPTV M3U Sorter - Final Cleanup Script
# Löscht alle duplizierten und temporären Dateien

echo "🧹 IPTV M3U Sorter - Final Cleanup"
echo "=================================="
echo ""

# Backup wichtiger Dateien vor dem Cleanup
echo "📦 Erstelle Backups der wichtigen Dateien..."
mkdir -p .backup-$(date +%Y%m%d_%H%M%S)

# Kopiere wichtige Dateien ins Backup
if [ -f "app.py" ]; then
    cp app.py .backup-*/app.py.backup
    echo "   ✓ app.py gesichert"
fi

if [ -f ".env" ]; then
    cp .env .backup-*/.env.backup
    echo "   ✓ .env gesichert"
fi

echo ""
echo "🗑️  Lösche alle temporären und duplizierten Dateien..."

# Lösche alle Varianten von Dateien (behalte nur die Basis-Versionen)
rm -f *-fixed.* 2>/dev/null && echo "   ✓ *-fixed.* Dateien gelöscht"
rm -f *-clean.* 2>/dev/null && echo "   ✓ *-clean.* Dateien gelöscht"
rm -f *-final.* 2>/dev/null && echo "   ✓ *-final.* Dateien gelöscht"
rm -f docker-compose-*.yml 2>/dev/null && echo "   ✓ docker-compose-*.yml Varianten gelöscht"
rm -f .env-* 2>/dev/null && echo "   ✓ .env-* Varianten gelöscht"
rm -f app-*.py 2>/dev/null && echo "   ✓ app-*.py Varianten gelöscht"

# Lösche Backup-Dateien
rm -f *.backup* 2>/dev/null && echo "   ✓ *.backup* Dateien gelöscht"

# Lösche temporäre Cleanup-Scripts
rm -f cleanup.* 2>/dev/null && echo "   ✓ cleanup.* Scripts gelöscht"
rm -f final-cleanup.* 2>/dev/null && echo "   ✓ final-cleanup.* Scripts gelöscht"

# Lösche README-Duplikate
rm -f *README*.md 2>/dev/null && echo "   ✓ Temporäre README Dateien gelöscht"

echo ""
echo "📁 Erstelle fehlende Verzeichnisse..."
mkdir -p uploads saved_playlists
chmod 755 uploads saved_playlists 2>/dev/null
echo "   ✓ uploads/ und saved_playlists/ erstellt"

echo ""
echo "✅ Cleanup abgeschlossen!"
echo ""
echo "📋 Verbleibende wichtige Dateien:"
echo "=================================="
ls -la | grep -E '\.(py|yml|env|txt|md|json)$' | grep -v backup | head -20
echo ""
echo "📁 Verzeichnisse:"
ls -d */ 2>/dev/null | head -10
echo ""
echo "🎯 Finale Struktur:"
echo "   📄 app.py (Flask Anwendung)"
echo "   🐳 docker-compose.yml (Docker Konfiguration)"
echo "   ⚙️  .env (Umgebungsvariablen)"
echo "   📋 requirements.txt (Python Dependencies)"
echo "   🔨 Dockerfile (Docker Build)"
echo "   📁 uploads/ (Upload Verzeichnis)"
echo "   📁 saved_playlists/ (Gespeicherte Playlists)"
echo ""
echo "🚀 Bereit zum Starten mit:"
echo "   docker-compose up -d"
echo ""

# Selbst-Löschung des Cleanup-Scripts
rm -f ultimate-cleanup.sh 2>/dev/null