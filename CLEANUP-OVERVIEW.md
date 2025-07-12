# IPTV M3U Sorter - Cleanup Übersicht

## 🗑️ Zu löschende Dateien

### Duplizierte Docker Compose Dateien:
- ❌ `docker-compose-fixed.yml`
- ❌ `docker-compose-clean.yml`
- ❌ `docker-compose-final.yml`
- ❌ Alle anderen `docker-compose-*.yml`

### Duplizierte App Dateien:
- ❌ `app-fixed.py`
- ❌ `app-clean.py`
- ❌ `app-final.py`
- ❌ Alle anderen `app-*.py`

### Duplizierte Environment Dateien:
- ❌ `.env-fixed`
- ❌ `.env-clean`
- ❌ `.env-final`
- ❌ Alle anderen `.env-*`

### Backup und temporäre Dateien:
- ❌ `*.backup*`
- ❌ `*-fixed.*`
- ❌ `*-clean.*`
- ❌ `*-final.*`

### Cleanup Scripts:
- ❌ `cleanup.sh`
- ❌ `cleanup.bat`
- ❌ `final-cleanup.sh`
- ❌ `final-cleanup.bat`
- ❌ `CLEANUP-README.md`

## ✅ Zu behaltende Dateien

### Hauptdateien:
- ✅ `app.py` - Flask Anwendung (finale Version)
- ✅ `docker-compose.yml` - Docker Konfiguration (finale Version)
- ✅ `.env` - Umgebungsvariablen (finale Version)

### Weitere wichtige Dateien:
- ✅ `requirements.txt` - Python Dependencies
- ✅ `Dockerfile` - Docker Build Instructions
- ✅ `wsgi.py` - Gunicorn Entry Point
- ✅ `README.md` - Projekt Dokumentation (falls vorhanden)

### Verzeichnisse:
- ✅ `uploads/` - Upload Verzeichnis
- ✅ `saved_playlists/` - Gespeicherte Playlists
- ✅ `templates/` - HTML Templates (falls vorhanden)
- ✅ `static/` - CSS/JS Dateien (falls vorhanden)

## 🚀 Nach dem Cleanup

Nach dem Ausführen des Cleanup-Scripts solltest du nur noch diese Struktur haben:

```
IPTV M3U sorter/
├── app.py                 # Flask Anwendung
├── docker-compose.yml     # Docker Konfiguration  
├── .env                   # Umgebungsvariablen
├── requirements.txt       # Python Dependencies
├── Dockerfile             # Docker Build
├── wsgi.py               # Gunicorn Entry Point
├── uploads/              # Upload Verzeichnis
├── saved_playlists/      # Gespeicherte Playlists
├── templates/            # HTML Templates (optional)
└── static/               # CSS/JS Dateien (optional)
```

## 🔧 Cleanup ausführen

**Linux/Mac:**
```bash
chmod +x ultimate-cleanup.sh
./ultimate-cleanup.sh
```

**Windows:**
```cmd
ultimate-cleanup.bat
```

Das Script erstellt automatisch ein Backup der wichtigen Dateien bevor es die Duplikate löscht!