# 🐧 Linux Quick Start Guide

## 🚀 Super Einfacher Start

### Option 1: Mit Make (Empfohlen)
```bash
# Alles auf einmal
make setup    # Konfiguration erstellen
make start    # Starten

# Andere nützliche Befehle
make stop     # Stoppen
make restart  # Neustarten
make logs     # Logs anzeigen
make health   # Status prüfen
make update   # Update & Rebuild
```

### Option 2: Mit Shell Scripts
```bash
# Executable machen
chmod +x *.sh

# Setup und Start
./setup-env.sh   # Konfiguration
./start.sh       # Starten

# Stoppen
./stop.sh

# Update
./update.sh
```

### Option 3: Direkt mit Docker Compose
```bash
# .env erstellen (falls nicht vorhanden)
cp .env.example .env

# Starten
docker-compose up -d --build
# oder mit neuem Docker:
docker compose up -d --build
```

## 🔧 Konfiguration

### Automatische Konfiguration
```bash
./setup-env.sh
```

### Manuelle Konfiguration
```bash
# .env erstellen
cp .env.example .env
nano .env  # Anpassen
```

## 🌐 Zugriff

Nach dem Start ist die App verfügbar unter:
- **Lokal**: http://localhost:5000
- **Domain**: https://deine-domain.com (mit Reverse Proxy)
- **Health Check**: http://localhost:5000/health

## 🔄 Docker Hub

Falls du das Image von Docker Hub verwendest:
```bash
# docker-compose.yml anpassen:
services:
  iptv-sorter:
    image: alex1987/iptv-m3u-sorter:latest  # Statt build: .
    # ... rest bleibt gleich
```

## 🛠️ Reverse Proxy

Siehe `REVERSE_PROXY_EXAMPLES.md` für detaillierte Konfigurationen:
- Caddy
- Nginx Proxy Manager  
- Traefik
- Apache
- HAProxy

## 🐛 Probleme?

```bash
# Logs anzeigen
make logs
# oder
docker-compose logs -f

# Status prüfen
make health
# oder
curl http://localhost:5000/health

# Komplett neu starten
make clean
make start
```

## 📁 Wichtige Verzeichnisse

```
./uploads/         # Hochgeladene M3U Dateien
./saved_playlists/ # Gespeicherte Online-Playlists
./templates/       # Template-Dateien
```

Diese Verzeichnisse werden automatisch erstellt und sind persistent.

## 🚀 Production Server

Die App läuft jetzt mit **Gunicorn** als Production WSGI Server:

- ✅ **Keine Development Server Warnung mehr**
- ✅ **Multi-Worker Support** (4 Worker standardmäßig)
- ✅ **Gevent für bessere Performance**
- ✅ **Production-optimiert**
- ✅ **Automatic Worker Restarts**
- ✅ **Non-root Security**

### Performance Features:
- **Workers**: Automatisch basierend auf CPU-Kernen
- **Worker Class**: Gevent für async I/O
- **Connections**: 1000 gleichzeitige Verbindungen pro Worker
- **Memory Management**: Worker restart nach 1000 Requests

### Monitoring:
```bash
# Logs anzeigen
docker-compose logs -f iptv-sorter

# Container Stats
docker stats iptv-m3u-sorter

# Health Check
curl http://localhost:5000/health

# Erweiterte Logs (mit Gunicorn info)
make logs | grep gunicorn
```

### Konfiguration anpassen:
```bash
# .env editieren für Production tuning
nano .env

# Beispiel für High-Traffic Server:
WORKERS=8
WORKER_CONNECTIONS=2000
MAX_REQUESTS=500
TIMEOUT=180

# UID/GID für Volume Permissions anpassen:
USER_UID=1001
USER_GID=1001
```

## 🔐 User ID (UID) und Group ID (GID) Konfiguration

Das Docker Image unterstützt beliebige UID/GID für korrekte Volume-Permissions:

### Automatische Erkennung:
```bash
# Deine aktuelle UID/GID anzeigen
echo "Your UID: $(id -u)"
echo "Your GID: $(id -g)"

# Setup Script nutzt automatisch deine IDs
./setup-env.sh
```

### Manuelle Konfiguration:
```bash
# .env editieren
nano .env

# Beispiel für spezifische UID/GID:
USER_UID=1001
USER_GID=1001
```

### Docker Build mit benutzerdefinierten IDs:
```bash
# Direkter Build mit eigener UID/GID
docker build --build-arg USER_UID=$(id -u) --build-arg USER_GID=$(id -g) -t iptv-sorter .

# Docker Compose nutzt automatisch die .env Werte
docker-compose up -d --build
```

### Volume Permission Probleme lösen:
```bash
# Falls Permission-Probleme auftreten:
sudo chown -R $(id -u):$(id -g) ./uploads ./saved_playlists

# Oder mit spezifischen IDs:
sudo chown -R 1001:1001 ./uploads ./saved_playlists
```
