# 🌐 Reverse Proxy Configuration Examples

This document provides configuration examples for popular reverse proxies to use with IPTV M3U Sorter.

## Prerequisites

1. **IPTV M3U Sorter running**: Use `docker-compose up -d` to start the application
2. **Domain configured**: Point your domain's A record to your server's IP
3. **Ports open**: Ensure ports 80 and 443 are accessible from the internet

## 🔒 Caddy

### Basic Configuration
```caddyfile
# /etc/caddy/Caddyfile or ./Caddyfile
your-domain.com {
    reverse_proxy localhost:5000
    encode gzip
}
```

### Advanced Configuration with Security
```caddyfile
your-domain.com {
    # Reverse proxy to IPTV sorter
    reverse_proxy localhost:5000 {
        health_uri /health
        health_interval 30s
    }
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    
    # Rate limiting
    rate_limit {
        zone upload {
            key {remote_host}
            events 10
            window 1m
        }
    }
    
    # Apply rate limit to upload endpoint
    handle /upload* {
        rate_limit upload
        reverse_proxy localhost:5000
    }
    
    # Compression and logging
    encode gzip zstd
    log
}

# Redirect www to non-www
www.your-domain.com {
    redir https://your-domain.com{uri} permanent
}
```

### Installation and Setup
```bash
# Install Caddy (Ubuntu/Debian)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Configure and start
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 🔧 Nginx Proxy Manager

### Web Interface Setup
1. **Access NPM**: Usually at `http://your-server:81`
2. **Add Proxy Host**:
   - **Domain Names**: `your-domain.com`
   - **Scheme**: `http`
   - **Forward Hostname/IP**: `localhost` or `host.docker.internal`
   - **Forward Port**: `5000`
   - **Block Common Exploits**: ✅ Enable
   - **Websockets Support**: ✅ Enable

3. **SSL Tab**:
   - **SSL Certificate**: Request a new SSL Certificate with Let's Encrypt
   - **Force SSL**: ✅ Enable
   - **HTTP/2 Support**: ✅ Enable
   - **HSTS Enabled**: ✅ Enable

4. **Advanced Tab** (Optional):
   ```nginx
   # Rate limiting
   limit_req_zone $binary_remote_addr zone=iptv_upload:10m rate=10r/m;
   
   location /upload {
       limit_req zone=iptv_upload burst=5 nodelay;
       proxy_pass http://localhost:5000;
   }
   
   # Additional security headers
   add_header X-Frame-Options SAMEORIGIN always;
   add_header X-Content-Type-Options nosniff always;
   add_header Referrer-Policy strict-origin-when-cross-origin always;
   
   # Health check endpoint
   location /health {
       access_log off;
       proxy_pass http://localhost:5000;
   }
   ```

### Docker Compose for NPM
```yaml
version: '3.8'
services:
  npm:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

## 🐳 Traefik

### Docker Compose with Traefik
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./acme.json:/acme.json"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.your-domain.com`)"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"

  iptv-sorter:
    build: .
    container_name: iptv-m3u-sorter
    volumes:
      - ./uploads:/app/uploads
      - ./saved_playlists:/app/saved_playlists
    environment:
      - FLASK_ENV=production
      - HTTPS_ENABLED=true
      - URL_SCHEME=https
      - SERVER_NAME=iptv.your-domain.com
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.iptv.rule=Host(`iptv.your-domain.com`)"
      - "traefik.http.routers.iptv.entrypoints=websecure"
      - "traefik.http.routers.iptv.tls.certresolver=letsencrypt"
      - "traefik.http.services.iptv.loadbalancer.server.port=5000"
      
      # Rate limiting
      - "traefik.http.middlewares.iptv-ratelimit.ratelimit.burst=100"
      - "traefik.http.middlewares.iptv-ratelimit.ratelimit.average=10"
      - "traefik.http.routers.iptv.middlewares=iptv-ratelimit"
```

## 🌐 Apache

### Virtual Host Configuration
```apache
# /etc/apache2/sites-available/iptv.conf

<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-domain.crt
    SSLCertificateKeyFile /etc/ssl/private/your-domain.key
    
    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set Referrer-Policy strict-origin-when-cross-origin
    
    # Proxy configuration
    ProxyPreserveHost On
    ProxyRequests Off
    
    # Health check (no logging)
    ProxyPass /health http://localhost:5000/health
    ProxyPassReverse /health http://localhost:5000/health
    SetEnvIf Request_URI "^/health" dontlog
    
    # Main application
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # Rate limiting with mod_security (optional)
    SecRuleEngine On
    SecRule REQUEST_URI "^/upload" "id:1001,phase:1,deny,status:429,msg:'Upload rate limit exceeded'"
    
    # Logging
    CustomLog ${APACHE_LOG_DIR}/iptv_access.log combined env=!dontlog
    ErrorLog ${APACHE_LOG_DIR}/iptv_error.log
</VirtualHost>
```

### Enable Required Modules
```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2ensite iptv.conf
sudo systemctl reload apache2
```

## ☁️ Cloudflare Tunnel

### Setup Cloudflare Tunnel
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create iptv-sorter

# Configure tunnel
nano ~/.cloudflared/config.yml
```

### Tunnel Configuration
```yaml
# ~/.cloudflared/config.yml
tunnel: YOUR-TUNNEL-ID
credentials-file: /home/user/.cloudflared/YOUR-TUNNEL-ID.json

ingress:
  - hostname: iptv.your-domain.com
    service: http://localhost:5000
    originRequest:
      httpHostHeader: iptv.your-domain.com
      connectTimeout: 30s
      tlsTimeout: 10s
      
  # Health check endpoint
  - hostname: iptv.your-domain.com
    path: /health
    service: http://localhost:5000
    
  # Catch-all rule
  - service: http_status:404
```

### Run Tunnel
```bash
# Test configuration
cloudflared tunnel ingress validate

# Run tunnel
cloudflared tunnel run iptv-sorter

# Install as service
sudo cloudflared service install
```

## 🔨 HAProxy

### Configuration
```haproxy
# /etc/haproxy/haproxy.cfg

global
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog

frontend iptv_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/your-domain.pem
    
    # Redirect HTTP to HTTPS
    redirect scheme https if !{ ssl_fc }
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 20 }
    
    # Security headers
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains"
    http-response set-header X-Content-Type-Options nosniff
    http-response set-header X-Frame-Options SAMEORIGIN
    
    default_backend iptv_backend

backend iptv_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server iptv1 localhost:5000 check
```

## 🔧 Environment Variables by Setup

### Local Development
```bash
# .env
FLASK_ENV=development
FLASK_DEBUG=1
HOST_PORT=5000
HTTPS_ENABLED=false
URL_SCHEME=http
DOMAIN=localhost
```

### Production with Domain
```bash
# .env
FLASK_ENV=production
FLASK_DEBUG=0
HOST_PORT=5000
HTTPS_ENABLED=true
URL_SCHEME=https
SERVER_NAME=iptv.your-domain.com
DOMAIN=iptv.your-domain.com
SECRET_KEY=your-super-secure-secret-key
```

### Subdirectory Setup
```bash
# .env for domain.com/iptv
APP_ROOT=/iptv
SERVER_NAME=your-domain.com
DOMAIN=your-domain.com/iptv
```

## 🏥 Health Check URLs

Test these endpoints to verify your setup:

- `https://your-domain.com/health` - Main health check
- `https://your-domain.com/healthz` - Kubernetes-style health check
- `https://your-domain.com/ping` - Simple ping endpoint

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T10:30:00",
  "version": "2.0.0",
  "app": "iptv-m3u-sorter",
  "checks": {
    "directories": "ok",
    "permissions": "ok"
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - Check if IPTV sorter is running: `docker-compose ps`
   - Verify port 5000 is accessible: `curl http://localhost:5000/health`

2. **SSL Certificate Issues**
   - Ensure domain points to correct IP
   - Check DNS propagation: https://dnschecker.org
   - Verify ports 80/443 are open

3. **CORS Issues**
   - Add appropriate CORS headers in reverse proxy
   - Check that `URL_SCHEME` and `SERVER_NAME` match your domain

4. **Upload Issues**
   - Check file size limits in both app and reverse proxy
   - Verify write permissions on upload directories

### Debugging Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f iptv-sorter

# Test health endpoint
curl -v http://localhost:5000/health

# Check reverse proxy logs
# Caddy: sudo journalctl -u caddy -f
# Nginx: sudo tail -f /var/log/nginx/error.log
# Apache: sudo tail -f /var/log/apache2/error.log
```
