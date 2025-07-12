#!/bin/bash

# IPTV M3U Sorter Stop Script for Linux
echo "🛑 Stopping IPTV M3U Sorter..."

if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo "✅ IPTV M3U Sorter stopped successfully!"
