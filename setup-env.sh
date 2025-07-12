#!/bin/bash

# IPTV M3U Sorter Environment Setup for Linux
echo "🔧 IPTV M3U Sorter Environment Setup"
echo

if [ -f .env ]; then
    echo "⚠️  .env file already exists. Create backup? (y/n)"
    read -r backup
    if [[ $backup =~ ^[Yy]$ ]]; then
        cp .env .env.backup
        echo "💾 Backup created: .env.backup"
    fi
fi

echo "📋 Creating .env configuration..."
echo

read -p "Enter your domain (or localhost for local use): " domain
read -p "Enable HTTPS? (y/n): " https
read -p "Host port (default 5000): " port
echo
echo "🔐 Docker User Configuration (für Volume Permissions):"
read -p "User UID (default 1000, use 'id -u' to check): " user_uid
read -p "User GID (default 1000, use 'id -g' to check): " user_gid

# Set defaults
port=${port:-5000}
domain=${domain:-localhost}
user_uid=${user_uid:-1000}
user_gid=${user_gid:-1000}

echo
echo "📝 Generating configuration..."

cat > .env << EOF
# IPTV M3U Sorter Configuration
# Generated on $(date)

# Basic Settings
FLASK_ENV=production
FLASK_DEBUG=0
HOST_PORT=$port

# Security Settings
SECRET_KEY=$(openssl rand -hex 32)
MAX_FILE_SIZE=52428800

EOF

if [[ $https =~ ^[Yy]$ ]]; then
    cat >> .env << EOF
HTTPS_ENABLED=true
URL_SCHEME=https
EOF
else
    cat >> .env << EOF
HTTPS_ENABLED=false
URL_SCHEME=http
EOF
fi

cat >> .env << EOF

# Domain and Proxy Settings
SERVER_NAME=$domain
DOMAIN=$domain
APP_ROOT=/

# Reverse Proxy Settings
PROXY_FIX_ENABLED=true
PROXY_FIX_X_FOR=1
PROXY_FIX_X_PROTO=1
PROXY_FIX_X_HOST=1

# Security Headers
SECURE_HEADERS=true
ENABLE_CSRF_PROTECTION=true

# Docker User Configuration
USER_UID=$user_uid
USER_GID=$user_gid
EOF

echo
echo "✅ Configuration saved to .env"
echo
echo "📋 Your settings:"
echo "   Domain: $domain"
echo "   Port: $port"
echo "   HTTPS: $https"
echo
echo "🚀 Next steps:"
echo "   1. Configure your reverse proxy to point to localhost:$port"
echo "   2. Run: ./start.sh"
echo "   3. Access via your domain"
echo
echo "💡 See REVERSE_PROXY_EXAMPLES.md for proxy configuration help"
