# 🐳 Docker Hub Deployment Guide

## 🚀 Schneller Start mit Docker Hub Image

### Option 1: Direkt mit Docker Run
```bash
# Einfacher Start
docker run -d \
  --name iptv-m3u-sorter \
  -p 5000:5000 \
  alexfl1987/iptv-m3u-sorter:latest-stable

# Mit persistenten Daten
docker run -d \
  --name iptv-m3u-sorter \
  -p 5000:5000 \
  -v ./uploads:/app/uploads \
  -v ./saved_playlists:/app/saved_playlists \
  alexfl1987/iptv-m3u-sorter:latest-stable
```

### Option 2: Mit Docker Compose (Empfohlen)
```bash
# 1. Dateien herunterladen
wget https://raw.githubusercontent.com/alex-1987/IPTV-M3U-sorter/main/docker-compose.dockerhub.yml
wget https://raw.githubusercontent.com/alex-1987/IPTV-M3U-sorter/main/.env.dockerhub

# 2. Dateien umbenennen
mv docker-compose.dockerhub.yml docker-compose.yml
mv .env.dockerhub .env

# 3. Konfiguration anpassen
nano .env

# 4. Starten
docker-compose up -d
```

## ⚙️ Konfiguration

### Minimale .env Konfiguration:
```bash
# Domain (wichtig für Reverse Proxy)
DOMAIN=your-domain.com

# Secret Key (WICHTIG für Production!)
SECRET_KEY=your-super-secret-key-here

# HTTPS (falls Reverse Proxy verwendet)
HTTPS_ENABLED=true
URL_SCHEME=https

# Port (falls geändert werden soll)
HOST_PORT=5000
```

### Erweiterte Konfiguration:
```bash
# Performance Tuning
WORKERS=8
WORKER_CONNECTIONS=2000

# User Permissions (Linux)
USER_UID=1000
USER_GID=1000

# Security
SECURE_HEADERS=true
ENABLE_CSRF_PROTECTION=true
```

## 🔒 Reverse Proxy Setup

### Mit Caddy:
```caddyfile
iptv.your-domain.com {
    reverse_proxy localhost:5000
}
```

### Mit Nginx Proxy Manager:
1. Add Proxy Host
2. Domain: `iptv.your-domain.com`
3. Forward to: `your-server-ip:5000`
4. Enable SSL

### Mit Traefik:
```yaml
# Bereits vorkonfiguriert mit Labels in docker-compose.yml
# Einfach DOMAIN in .env setzen
```

## 📁 Verzeichnisse

Nach dem Start werden automatisch erstellt:
```
./uploads/         # Hochgeladene M3U Dateien
./saved_playlists/ # Gespeicherte Online-Playlists
./templates/       # Template-Dateien (falls verwendet)
```

## 🏥 Health Check

```bash
# Status prüfen
curl http://localhost:5000/health

# Logs anzeigen
docker logs iptv-m3u-sorter

# Container Stats
docker stats iptv-m3u-sorter
```

## 🔄 Updates

```bash
# Image updaten
docker pull alexfl1987/iptv-m3u-sorter:latest-stable

# Container neu starten
docker-compose down
docker-compose up -d
```

## 🐛 Troubleshooting

### Volume Permissions (Linux):
```bash
# Verzeichnisse korrekte Rechte geben
sudo chown -R $(id -u):$(id -g) ./uploads ./saved_playlists

# Oder in .env setzen:
USER_UID=$(id -u)
USER_GID=$(id -g)
```

### Port bereits belegt:
```bash
# In .env ändern:
HOST_PORT=8080
```

### Container startet nicht:
```bash
# Logs prüfen
docker logs iptv-m3u-sorter

# Health Check testen
docker exec iptv-m3u-sorter curl -f http://localhost:5000/health
```

## 🌟 Production Ready Features

✅ **Gunicorn WSGI Server** - Keine Development Warnungen  
✅ **Multi-Worker Support** - Skaliert automatisch  
✅ **Reverse Proxy Ready** - Funktioniert mit allen gängigen Proxies  
✅ **Security Headers** - Production-sichere Einstellungen  
✅ **Health Checks** - Monitoring und Restart-fähig  
✅ **Non-Root Container** - Sicherheit durch User-Isolation  

## 📋 Vollständiges Beispiel

```bash
# 1. Verzeichnis erstellen
mkdir iptv-sorter && cd iptv-sorter

# 2. docker-compose.yml erstellen
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  iptv-sorter:
    image: alexfl1987/iptv-m3u-sorter:latest-stable
    container_name: iptv-m3u-sorter
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./saved_playlists:/app/saved_playlists
    environment:
      - SECRET_KEY=your-secret-key-here
      - DOMAIN=localhost
    restart: unless-stopped
EOF

# 3. Starten
docker-compose up -d

# 4. Zugriff: http://localhost:5000
```
