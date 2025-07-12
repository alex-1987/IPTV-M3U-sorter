# 🐳 Docker Hub Deployment Guide

## 📋 Vorbereitung für Docker Hub

### 1. **Docker Hub Account**
- Registriere dich auf https://hub.docker.com
- Notiere dir deinen Docker Hub Username (z.B. `alex1987`)

### 2. **Repository Namen**
Empfohlene Namen für Docker Hub:
- `alex1987/iptv-m3u-sorter` (Hauptname)
- `alex1987/iptv-playlist-manager` (Alternative)

## 🚀 Build und Push Prozess

### Schritt 1: Docker Image bauen
```bash
# Multi-Platform Build (empfohlen für bessere Kompatibilität)
docker buildx build --platform linux/amd64,linux/arm64 -t alex1987/iptv-m3u-sorter:latest .

# Oder einfacher Build nur für deine Architektur
docker build -t alex1987/iptv-m3u-sorter:latest .
```

### Schritt 2: Docker Hub Login
```bash
docker login
# Gib deine Docker Hub Credentials ein
```

### Schritt 3: Tags erstellen
```bash
# Latest Tag
docker tag alex1987/iptv-m3u-sorter:latest alex1987/iptv-m3u-sorter:latest

# Version Tag
docker tag alex1987/iptv-m3u-sorter:latest alex1987/iptv-m3u-sorter:v2.0.0

# Zusätzliche Tags
docker tag alex1987/iptv-m3u-sorter:latest alex1987/iptv-m3u-sorter:stable
```

### Schritt 4: Push zu Docker Hub
```bash
# Push alle Tags
docker push alex1987/iptv-m3u-sorter:latest
docker push alex1987/iptv-m3u-sorter:v2.0.0
docker push alex1987/iptv-m3u-sorter:stable
```

## 📝 Docker Hub Repository Setup

### Repository Beschreibung
```markdown
🔥 Modern IPTV M3U Playlist Sorter with drag-and-drop interface, template system, and beautiful responsive design.

✨ Features:
• 🎯 Drag & drop channel sorting
• 🔍 Real-time search & filtering  
• 📋 Template system for playlist management
• 🌐 Online playlist sharing with URLs
• 📱 Mobile-optimized responsive design
• 🚀 One-click Docker deployment

🐳 Quick Start:
docker run -d -p 5000:5000 alex1987/iptv-m3u-sorter:latest

📚 Full docs: https://github.com/alex-1987/IPTV-M3U-sorter
```

### Tags zum Setzen
- `iptv`
- `m3u`
- `playlist`
- `docker`
- `flask`
- `web-app`
- `streaming`
- `media`

## 🔧 Optimierungen für Docker Hub

### Multi-Stage Build (Optional - für kleinere Images)
```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
RUN mkdir -p uploads saved_playlists
ENV PATH=/root/.local/bin:$PATH
EXPOSE 5000
CMD ["python", "app.py"]
```

## 🎯 Automatisierte Builds mit GitHub Actions

### .github/workflows/docker-publish.yml
```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: alex1987/iptv-m3u-sorter
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
```

## 📊 Docker Hub Best Practices

### 1. **README für Docker Hub**
- Kurze Beschreibung
- Quick Start Anleitung
- Environment Variables
- Volume Mounts
- Port Mapping

### 2. **Image Größe optimieren**
- Multi-stage builds verwenden
- .dockerignore richtig konfigurieren
- Unnötige Packages vermeiden

### 3. **Security**
- Regelmäßige Updates der Base Images
- Vulnerability Scanning aktivieren
- Non-root User verwenden (optional)

### 4. **Versioning**
- Semantic Versioning (v2.0.0, v2.0.1, etc.)
- Latest Tag für neueste stabile Version
- Entwicklungs-Tags (dev, beta) für Tests

## 🔄 Update Workflow

### Bei neuen Releases:
```bash
# 1. Code committen und pushen
git add .
git commit -m "Release v2.0.1: Bug fixes and improvements"
git tag v2.0.1
git push origin main --tags

# 2. Docker Image bauen und pushen
docker build -t alex1987/iptv-m3u-sorter:v2.0.1 .
docker tag alex1987/iptv-m3u-sorter:v2.0.1 alex1987/iptv-m3u-sorter:latest
docker push alex1987/iptv-m3u-sorter:v2.0.1
docker push alex1987/iptv-m3u-sorter:latest
```

## 📱 Verwendung für End-User

### Einfacher Start:
```bash
docker run -d -p 5000:5000 alex1987/iptv-m3u-sorter:latest
```

### Mit persistenten Daten:
```bash
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/saved_playlists:/app/saved_playlists \
  alex1987/iptv-m3u-sorter:latest
```

### Docker Compose (von Docker Hub):
```yaml
version: '3.8'
services:
  iptv-sorter:
    image: alex1987/iptv-m3u-sorter:latest
    ports:
      - "5000:5000"
    volumes:
      - ./uploads:/app/uploads
      - ./saved_playlists:/app/saved_playlists
    restart: unless-stopped
```

## ✅ Checkliste vor dem Upload

- [ ] Dockerfile getestet und optimiert
- [ ] .dockerignore konfiguriert
- [ ] Docker Hub Repository erstellt
- [ ] README für Docker Hub vorbereitet
- [ ] Tags und Beschreibung gesetzt
- [ ] Multi-platform Build getestet (optional)
- [ ] GitHub Actions konfiguriert (optional)

## 🎉 Nach dem Upload

1. **README in GitHub aktualisieren** mit Docker Hub Links
2. **Docker Hub URL zu GitHub Repository hinzufügen**
3. **Social Media teilen** (optional)
4. **Community benachrichtigen** (Reddit r/selfhosted, r/docker, etc.)

## 🔗 Wichtige Links

- **Docker Hub**: https://hub.docker.com/r/alex1987/iptv-m3u-sorter
- **GitHub**: https://github.com/alex-1987/IPTV-M3U-sorter
- **Pull Command**: `docker pull alex1987/iptv-m3u-sorter:latest`
