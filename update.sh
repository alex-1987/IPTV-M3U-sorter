#!/bin/bash

# IPTV M3U Sorter Update Script for Linux
echo "🔄 Updating IPTV M3U Sorter..."

# Pull latest changes (if in git repository)
if [ -d .git ]; then
    echo "📥 Pulling latest changes from Git..."
    git pull
fi

# Stop containers
echo "🛑 Stopping containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

# Remove old images
echo "🗑️  Removing old images..."
docker image prune -f

# Rebuild and start
echo "🔨 Rebuilding and starting..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

echo "✅ Update completed!"
