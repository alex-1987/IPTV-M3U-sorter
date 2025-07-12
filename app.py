#!/usr/bin/env python3
"""
IPTV M3U Playlist Sorter
A web application for uploading, sorting, and managing IPTV M3U playlists
"""

from flask import Flask, render_template, request, jsonify, send_file, url_for
from werkzeug.middleware.proxy_fix import ProxyFix
import os
import re
import json
import uuid
from datetime import datetime
from urllib.parse import urlparse
import tempfile
import io
import time
import logging

app = Flask(__name__)

# Configure logging for production
if not app.debug:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s %(message)s'
    )

# Configure for reverse proxy compatibility
app.wsgi_app = ProxyFix(
    app.wsgi_app, 
    x_for=int(os.environ.get('PROXY_FIX_X_FOR', 1)),
    x_proto=int(os.environ.get('PROXY_FIX_X_PROTO', 1)),
    x_host=int(os.environ.get('PROXY_FIX_X_HOST', 1)),
    x_prefix=int(os.environ.get('PROXY_FIX_X_PREFIX', 1))
)

# Enhanced security configuration
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', os.urandom(24)),
    MAX_CONTENT_LENGTH=int(os.environ.get('MAX_FILE_SIZE', 50 * 1024 * 1024)),  # 50MB default
    UPLOAD_FOLDER=os.environ.get('UPLOAD_FOLDER', 'uploads'),
    SAVED_PLAYLISTS_FOLDER=os.environ.get('SAVED_PLAYLISTS_FOLDER', 'saved_playlists'),
    
    # Production security settings
    SESSION_COOKIE_SECURE=os.environ.get('HTTPS_ENABLED', 'false').lower() == 'true',
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    
    # Enhanced reverse proxy settings
    PREFERRED_URL_SCHEME=os.environ.get('URL_SCHEME', 'http'),
    APPLICATION_ROOT=os.environ.get('APP_ROOT', '/'),
)

# Enhanced SERVER_NAME handling for Caddy reverse proxy

# Handle SERVER_NAME configuration properly for reverse proxy
server_name = os.environ.get('SERVER_NAME')
if server_name and server_name.strip():
    # Only set SERVER_NAME if explicitly provided and not empty
    app.config['SERVER_NAME'] = server_name.strip()
    app.logger.info(f"SERVER_NAME configured: {server_name}")
else:
    # Don't set SERVER_NAME for localhost/container access
    # This prevents warnings when accessing via localhost:5000
    app.config['SERVER_NAME'] = None
    app.logger.info("SERVER_NAME not set - using default behavior for reverse proxy")

# Add request context processor for URL generation
@app.before_request
def handle_reverse_proxy():
    """Handle reverse proxy URL generation"""
    if not app.config.get('SERVER_NAME'):
        # For reverse proxy setups without SERVER_NAME
        # Flask will use the Host header from the request
        pass

# Security headers middleware
@app.after_request
def add_security_headers(response):
    """Add security headers for production"""
    if os.environ.get('SECURE_HEADERS', 'true').lower() == 'true':
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
        
        # Add HSTS for HTTPS
        if os.environ.get('HTTPS_ENABLED', 'false').lower() == 'true':
            security_headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        for header, value in security_headers.items():
            if not response.headers.get(header):
                response.headers[header] = value
    
    return response

# Ensure upload directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['SAVED_PLAYLISTS_FOLDER'], exist_ok=True)

# Store playlists in memory (in production, use a database)
playlists = {}
named_playlists = {}  # New: Store playlists by name

# Health check endpoints (compatible with all reverse proxies)
@app.route('/health')
@app.route('/healthz')  # Kubernetes style
@app.route('/ping')     # Simple ping
def health_check():
    """Production health check endpoint for reverse proxies and load balancers"""
    try:
        # Check if required directories exist and are writable
        upload_dir = app.config['UPLOAD_FOLDER']
        playlists_dir = app.config['SAVED_PLAYLISTS_FOLDER']
        
        for directory in [upload_dir, playlists_dir]:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
            
            # Test write permissions
            test_file = os.path.join(directory, '.health_check')
            with open(test_file, 'w') as f:
                f.write('ok')
            os.remove(test_file)
        
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0',
            'server': 'gunicorn',
            'directories': {
                'uploads': upload_dir,
                'playlists': playlists_dir
            }
        }, 200
        
    except Exception as e:
        app.logger.error(f"Health check failed: {str(e)}")
        return {
            'status': 'unhealthy',
            'timestamp': datetime.now().isoformat(),
            'error': str(e),
            'server': 'gunicorn'
        }, 503

# Input validation and sanitization
def validate_m3u_content(content):
    """Validate M3U file content for security"""
    if not content:
        return False, "Empty content"
    
    # Check file size
    if len(content) > app.config['MAX_CONTENT_LENGTH']:
        return False, "File too large"
    
    # Basic M3U validation
    if not content.strip().startswith('#EXTM3U'):
        return False, "Not a valid M3U file"
    
    # Check for potentially dangerous content
    dangerous_patterns = ['<script', 'javascript:', 'data:text/html']
    content_lower = content.lower()
    for pattern in dangerous_patterns:
        if pattern in content_lower:
            return False, f"Potentially dangerous content detected: {pattern}"
    
    return True, "Valid"

def parse_m3u_content(content):
    """Parse M3U file content and extract channel information."""
    channels = []
    lines = content.strip().split('\n')
    
    current_extinf = None
    
    for line in lines:
        line = line.strip()
        
        if line.startswith('#EXTINF:'):
            current_extinf = line
        elif line and not line.startswith('#') and current_extinf:
            # Extract channel information from EXTINF line
            channel_info = parse_extinf_line(current_extinf)
            channel_info['url'] = line
            channels.append(channel_info)
            current_extinf = None
    
    return channels

def parse_extinf_line(extinf_line):
    """Parse EXTINF line to extract channel name, group, and logo."""
    # Example: #EXTINF:-1 tvg-name="ARD" tvg-logo="logo.png" group-title="German",ARD HD
    
    channel_info = {
        'name': '',
        'group': None,
        'logo': None,
        'tvg_name': None,
        'tvg_id': None
    }
    
    # Extract the channel name (after the last comma)
    if ',' in extinf_line:
        parts = extinf_line.rsplit(',', 1)
        if len(parts) == 2:
            channel_info['name'] = parts[1].strip()
    
    # Extract attributes using regex
    # group-title="..."
    group_match = re.search(r'group-title="([^"]*)"', extinf_line)
    if group_match:
        channel_info['group'] = group_match.group(1)
    
    # tvg-logo="..."
    logo_match = re.search(r'tvg-logo="([^"]*)"', extinf_line)
    if logo_match:
        channel_info['logo'] = logo_match.group(1)
    
    # tvg-name="..."
    tvg_name_match = re.search(r'tvg-name="([^"]*)"', extinf_line)
    if tvg_name_match:
        channel_info['tvg_name'] = tvg_name_match.group(1)
    
    # tvg-id="..."
    tvg_id_match = re.search(r'tvg-id="([^"]*)"', extinf_line)
    if tvg_id_match:
        channel_info['tvg_id'] = tvg_id_match.group(1)
    
    return channel_info

def sanitize_playlist_name(name):
    """Sanitize playlist name for use in URLs."""
    # Remove special characters and replace spaces with underscores
    sanitized = re.sub(r'[^\w\s-]', '', name)
    sanitized = re.sub(r'[-\s]+', '_', sanitized)
    return sanitized.strip('_')

def generate_m3u_content(channels):
    """Generate M3U content from channels list."""
    lines = ['#EXTM3U']
    
    for channel in channels:
        # Build EXTINF line
        extinf_parts = ['#EXTINF:-1']
        
        if channel.get('tvg_id'):
            extinf_parts.append(f'tvg-id="{channel["tvg_id"]}"')
        
        if channel.get('tvg_name'):
            extinf_parts.append(f'tvg-name="{channel["tvg_name"]}"')
        
        if channel.get('logo'):
            extinf_parts.append(f'tvg-logo="{channel["logo"]}"')
        
        if channel.get('group'):
            extinf_parts.append(f'group-title="{channel["group"]}"')
        
        extinf_line = ' '.join(extinf_parts) + f',{channel["name"]}'
        
        lines.append(extinf_line)
        lines.append(channel['url'])
    
    return '\n'.join(lines)

# Add cache buster to template context
@app.context_processor
def inject_cache_buster():
    return {'cache_buster': str(int(time.time()))}

@app.route('/')
def index():
    """Main page for uploading and sorting playlists"""
    return render_template('index.html')

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle M3U file upload and parsing."""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'Keine Datei hochgeladen'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Keine Datei ausgewählt'}), 400
        
        if not file.filename.lower().endswith(('.m3u', '.m3u8')):
            return jsonify({'success': False, 'error': 'Datei muss eine M3U Playlist sein'}), 400
        
        # Read and parse file content
        content = file.read().decode('utf-8', errors='ignore')
        
        # Validate content
        is_valid, validation_message = validate_m3u_content(content)
        if not is_valid:
            return jsonify({'success': False, 'error': validation_message}), 400
        
        channels = parse_m3u_content(content)
        
        if not channels:
            return jsonify({'success': False, 'error': 'Keine gültigen Kanäle in der Playlist gefunden'}), 400
        
        return jsonify({
            'success': True,
            'channels': channels,
            'message': f'{len(channels)} Kanäle erfolgreich geladen'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Fehler beim Verarbeiten der Datei: {str(e)}'}), 500

@app.route('/api/check_playlist_name/<playlist_name>')
def check_playlist_name(playlist_name):
    """Check if a playlist name already exists."""
    sanitized_name = sanitize_playlist_name(playlist_name)
    exists = sanitized_name in named_playlists
    
    return jsonify({
        'exists': exists,
        'sanitized_name': sanitized_name
    })

@app.route('/api/save', methods=['POST'])
def save_playlist():
    """Save playlist with custom name."""
    try:
        data = request.get_json()
        
        if not data or 'channels' not in data:
            return jsonify({'success': False, 'error': 'Keine Playlist-Daten bereitgestellt'}), 400
        
        channels = data['channels']
        playlist_name = data.get('name', f'Playlist_{datetime.now().strftime("%Y%m%d_%H%M%S")}')
        replace_existing = data.get('replace_existing', False)
        
        # Sanitize the name for URL usage
        sanitized_name = sanitize_playlist_name(playlist_name)
        
        # Check if name already exists and replacement not allowed
        if sanitized_name in named_playlists and not replace_existing:
            return jsonify({
                'success': False, 
                'error': f'Playlist-Name "{playlist_name}" ist bereits vergeben'
            })
        
        # Generate unique ID for internal storage
        playlist_id = str(uuid.uuid4())
        
        playlist_data = {
            'id': playlist_id,
            'name': playlist_name,
            'sanitized_name': sanitized_name,
            'channels': channels,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Store in both dictionaries
        playlists[playlist_id] = playlist_data
        named_playlists[sanitized_name] = playlist_data
        
        return jsonify({
            'success': True,
            'playlist_id': playlist_id,
            'playlist_name': sanitized_name,
            'supports_named_urls': True,
            'url': url_for('serve_playlist_by_name', playlist_name=f'{sanitized_name}.m3u', _external=True)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Fehler beim Speichern der Playlist: {str(e)}'}), 500

@app.route('/api/export', methods=['POST'])
def export_playlist():
    """Export playlist as M3U file."""
    try:
        data = request.get_json()
        
        if not data or 'channels' not in data:
            return jsonify({'success': False, 'error': 'Keine Playlist-Daten bereitgestellt'}), 400
        
        channels = data['channels']
        m3u_content = generate_m3u_content(channels)
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.m3u', delete=False, encoding='utf-8')
        temp_file.write(m3u_content)
        temp_file.close()
        
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name='sorted_playlist.m3u',
            mimetype='audio/x-mpegurl'
        )
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Fehler beim Exportieren: {str(e)}'}), 500
    finally:
        # Clean up temporary file
        try:
            if 'temp_file' in locals():
                os.unlink(temp_file.name)
        except:
            pass

@app.route('/playlist/<playlist_name>')
@app.route('/playlist/<playlist_name>.m3u')
def serve_playlist_by_name(playlist_name):
    """Serve playlist by name with .m3u extension support."""
    # Remove .m3u extension if present for lookup
    if playlist_name.endswith('.m3u'):
        playlist_name = playlist_name[:-4]
    
    sanitized_name = sanitize_playlist_name(playlist_name)
    
    if sanitized_name not in named_playlists:
        return "Playlist not found", 404
    
    playlist_data = named_playlists[sanitized_name]
    channels = playlist_data['channels']
    
    m3u_content = generate_m3u_content(channels)
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.m3u', delete=False, encoding='utf-8')
    temp_file.write(m3u_content)
    temp_file.close()
    
    try:
        return send_file(
            temp_file.name,
            as_attachment=False,
            download_name=f'{sanitized_name}.m3u',
            mimetype='audio/x-mpegurl'
        )
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file.name)
        except:
            pass

@app.route('/playlist/<playlist_id>')
def serve_playlist_by_id(playlist_id):
    """Serve playlist by ID (legacy support)."""
    if playlist_id not in playlists:
        return "Playlist not found", 404
    
    playlist_data = playlists[playlist_id]
    channels = playlist_data['channels']
    
    m3u_content = generate_m3u_content(channels)
    
    # Create temporary file
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.m3u', delete=False, encoding='utf-8')
    temp_file.write(m3u_content)
    temp_file.close()
    
    try:
        return send_file(
            temp_file.name,
            as_attachment=False,
            download_name=f'{playlist_data["sanitized_name"]}.m3u',
            mimetype='audio/x-mpegurl'
        )
    finally:
        # Clean up temporary file
        try:
            os.unlink(temp_file.name)
        except:
            pass

if __name__ == '__main__':
    # Development mode only - Gunicorn handles production
    app.run(debug=True, host='0.0.0.0', port=5000)
