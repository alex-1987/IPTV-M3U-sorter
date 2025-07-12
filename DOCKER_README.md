# IPTV M3U Sorter - Docker Setup

Your IPTV M3U Playlist Sorter is now fully containerized with Docker! This makes it easy to deploy and run the application anywhere.

## Quick Start

1. **Start the application:**
   ```bash
   # Double-click start.bat or run in terminal:
   start.bat
   ```

2. **Access the application:**
   - Open your web browser
   - Go to: http://localhost:5000

3. **Stop the application:**
   ```bash
   # Double-click stop.bat or run in terminal:
   stop.bat
   ```

## Docker Files Overview

- **Dockerfile**: Defines the container image with Python 3.11 and Flask
- **docker-compose.yml**: Orchestrates the container with proper volumes and networking
- **.dockerignore**: Optimizes build process by excluding unnecessary files
- **start.bat**: Windows batch script to start the container
- **stop.bat**: Windows batch script to stop the container
- **update.bat**: Windows batch script to rebuild and restart the container

## Container Features

- **Persistent Data**: Your uploaded playlists, saved playlists, and templates are stored in local folders
- **Health Checks**: Automatic monitoring to ensure the container is running properly
- **Auto-Restart**: Container automatically restarts if it crashes
- **Port Mapping**: Application accessible on localhost:5000

## Volume Mounts

The following folders are mounted to persist your data:
- `./uploads` - Uploaded M3U files
- `./saved_playlists` - Saved playlists accessible via URL
- `./templates` - Template files (already mounted from your project)
- `./static` - Static assets (already mounted from your project)

## Manual Docker Commands

If you prefer using Docker commands directly:

```bash
# Build the image
docker-compose build

# Start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Rebuild and restart
docker-compose up -d --build --force-recreate
```

## Troubleshooting

1. **Port already in use**: If port 5000 is already used, edit `docker-compose.yml` and change the port mapping (e.g., "8080:5000")

2. **Docker not running**: Make sure Docker Desktop is installed and running

3. **Permission issues**: On Windows, you might need to run the batch files as administrator

4. **View container logs**:
   ```bash
   docker-compose logs iptv-sorter
   ```

## Development Mode

To run in development mode with auto-reload:

1. Edit `docker-compose.yml`
2. Change `FLASK_ENV=production` to `FLASK_ENV=development`
3. Change `FLASK_DEBUG=0` to `FLASK_DEBUG=1`
4. Run `update.bat` to apply changes

Enjoy your containerized IPTV M3U Playlist Sorter! 🐳📺
