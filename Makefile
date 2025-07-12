.PHONY: help setup start stop restart logs clean update health

# Default target
help:
	@echo "🔧 IPTV M3U Sorter - Available Commands:"
	@echo ""
	@echo "  make setup    - Initial environment setup"
	@echo "  make start    - Start the application"
	@echo "  make stop     - Stop the application"
	@echo "  make restart  - Restart the application"
	@echo "  make logs     - View application logs"
	@echo "  make health   - Check application health"
	@echo "  make update   - Update and rebuild"
	@echo "  make clean    - Clean up containers and images"
	@echo ""

# Setup environment
setup:
	@echo "🔧 Setting up environment..."
	@chmod +x *.sh
	@./setup-env.sh

# Start application
start:
	@echo "🚀 Starting IPTV M3U Sorter..."
	@chmod +x *.sh
	@./start.sh

# Stop application
stop:
	@echo "🛑 Stopping IPTV M3U Sorter..."
	@chmod +x *.sh
	@./stop.sh

# Restart application
restart: stop start

# View logs
logs:
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose logs -f; \
	else \
		docker compose logs -f; \
	fi

# Check health
health:
	@echo "🏥 Checking application health..."
	@source .env 2>/dev/null; \
	PORT=$${HOST_PORT:-5000}; \
	curl -s http://localhost:$$PORT/health | jq . || echo "Health check failed or jq not installed"

# Update application
update:
	@echo "🔄 Updating IPTV M3U Sorter..."
	@chmod +x *.sh
	@./update.sh

# Clean up
clean:
	@echo "🧹 Cleaning up containers and images..."
	@if command -v docker-compose >/dev/null 2>&1; then \
		docker-compose down --rmi all --volumes --remove-orphans; \
	else \
		docker compose down --rmi all --volumes --remove-orphans; \
	fi
	@docker system prune -f
	@echo "✅ Cleanup completed!"
