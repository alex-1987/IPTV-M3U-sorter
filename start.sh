#!/bin/bash

# IPTV M3U Sorter Startup Script for Linux
echo "🚀 Starting IPTV M3U Sorter..."
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not available"
    echo "Please install Docker Compose or use newer Docker with 'docker compose'"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 No .env file found. Running setup..."
    chmod +x setup-env.sh
    ./setup-env.sh
    echo
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose down 2>/dev/null || true
else
    docker compose down 2>/dev/null || true
fi

# Build and start containers
echo "🐳 Building and starting containers..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d --build
else
    docker compose up -d --build
fi

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check container status
echo "🏥 Checking container health..."
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi

# Get configuration
source .env 2>/dev/null || true
HOST_PORT=${HOST_PORT:-5000}
DOMAIN=${DOMAIN:-localhost}
URL_SCHEME=${URL_SCHEME:-http}

echo
echo "✅ IPTV M3U Sorter is running!"
echo "🌐 Local access: http://localhost:$HOST_PORT"
if [ "$DOMAIN" != "localhost" ]; then
    echo "🌍 Domain access: $URL_SCHEME://$DOMAIN"
fi
echo "🏥 Health check: http://localhost:$HOST_PORT/health"
echo
echo "📊 View logs: docker-compose logs -f (or docker compose logs -f)"
echo "🛑 Stop service: ./stop.sh"
echo "🔧 Reconfigure: ./setup-env.sh"
