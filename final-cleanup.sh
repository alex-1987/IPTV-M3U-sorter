#!/bin/bash
# IPTV M3U Sorter - Cleanup Script - Löscht alle temporären Dateien

echo "🗑️  IPTV M3U Sorter - Temporäre Dateien löschen"
echo "==============================================="

# Lösche alle temporären Dateien
echo "Lösche temporäre Dateien..."

# Lösche alle *-fixed.* Dateien
find . -name "*-fixed.*" -type f -delete 2>/dev/null
echo "   ✓ *-fixed.* Dateien entfernt"

# Lösche alle *-clean.* Dateien
find . -name "*-clean.*" -type f -delete 2>/dev/null
echo "   ✓ *-clean.* Dateien entfernt"

# Lösche Backup-Dateien (optional)
find . -name "*.backup*" -type f -delete 2>/dev/null
echo "   ✓ *.backup* Dateien entfernt"

# Lösche Cleanup-Scripts (sie haben ihren Zweck erfüllt)
rm -f cleanup.sh cleanup.bat 2>/dev/null
echo "   ✓ Cleanup-Scripts entfernt"

echo ""
echo "✅ Alle temporären Dateien wurden entfernt!"
echo ""
echo "📋 Verbleibende wichtige Dateien:"
ls -la | grep -E '\.(py|yml|env)$|^d' | head -10
echo ""
echo "🚀 Bereit zum Starten mit: docker-compose up -d"