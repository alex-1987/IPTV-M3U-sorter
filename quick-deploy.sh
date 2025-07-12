#!/bin/bash

# IPTV M3U Sorter - Docker Hub Quick Deploy Script
echo "🚀 IPTV M3U Sorter - Docker Hub Deployment"
echo "=========================================="
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker ist nicht installiert!"
    echo "Bitte installiere Docker zuerst: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "📋 Setup Konfiguration..."
echo

# Get configuration
read -p "Domain/IP (default: localhost): " domain
read -p "Port (default: 5000): " port
read -p "HTTPS aktiviert? (y/n, default: n): " https

# Set defaults
domain=${domain:-localhost}
port=${port:-5000}
https=${https:-n}

# Generate secret key
secret_key=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")

echo
echo "📝 Erstelle Konfiguration..."

# Create directory structure
mkdir -p uploads saved_playlists

# Create .env file
cat > .env << EOF
# IPTV M3U Sorter Configuration
DOMAIN=$domain
HOST_PORT=$port
SECRET_KEY=$secret_key
EOF

if [[ $https =~ ^[Yy]$ ]]; then
    cat >> .env << EOF
HTTPS_ENABLED=true
URL_SCHEME=https
EOF
else
    cat >> .env << EOF
HTTPS_ENABLED=false
URL_SCHEME=http
EOF
fi

# Add user configuration for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    cat >> .env << EOF
USER_UID=$(id -u)
USER_GID=$(id -g)
EOF
fi

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  iptv-sorter:
    image: alexfl1987/iptv-m3u-sorter:latest-stable
    container_name: iptv-m3u-sorter
    user: "${USER_UID:-1000}:${USER_GID:-1000}"
    ports:
      - "${HOST_PORT:-5000}:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./saved_playlists:/app/saved_playlists
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DOMAIN=${DOMAIN}
      - HTTPS_ENABLED=${HTTPS_ENABLED:-false}
      - URL_SCHEME=${URL_SCHEME:-http}
      - SECURE_HEADERS=true
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

echo "🐳 Starte Container..."
echo

# Stop any existing container
docker-compose down 2>/dev/null || true

# Start the container
if docker-compose up -d; then
    echo
    echo "✅ IPTV M3U Sorter erfolgreich gestartet!"
    echo
    echo "🌐 Zugriff:"
    if [[ $https =~ ^[Yy]$ ]]; then
        echo "   https://$domain:$port"
    else
        echo "   http://$domain:$port"
    fi
    echo
    echo "🏥 Health Check: http://$domain:$port/health"
    echo "📊 Logs anzeigen: docker-compose logs -f"
    echo "🛑 Stoppen: docker-compose down"
    echo
    echo "📁 Daten werden gespeichert in:"
    echo "   ./uploads/ (Hochgeladene Dateien)"
    echo "   ./saved_playlists/ (Gespeicherte Playlists)"
else
    echo "❌ Fehler beim Starten des Containers!"
    echo "Prüfe die Logs mit: docker-compose logs"
fi
