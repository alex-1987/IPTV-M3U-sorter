FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads saved_playlists templates static

# Accept custom UID and GID as build arguments
ARG USER_UID=1000
ARG USER_GID=1000

# Create non-root user with configurable UID:GID
RUN groupadd --gid ${USER_GID} appgroup && \
    useradd --uid ${USER_UID} --gid appgroup --shell /bin/bash --create-home appuser && \
    chown -R appuser:appgroup /app
USER appuser

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use Gunicorn for production
CMD ["gunicorn", "--config", "gunicorn.conf.py", "wsgi:app"]
