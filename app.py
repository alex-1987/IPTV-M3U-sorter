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

# Enhanced SERVER_NAME handling for Caddy reverse proxy - CORRECTED

# Handle SERVER_NAME configuration properly for reverse proxy
server_name = os.environ.get('SERVER_NAME')
if server_name and server_name.strip():
    # Only set SERVER_NAME if explicitly provided and not empty
    app.config['SERVER_NAME'] = server_name.strip()
    app.logger.info(f"SERVER_NAME configured: {server_name.strip()}")
else:
    # Set to None instead of deleting to avoid KeyError
    app.config['SERVER_NAME'] = None
    app.logger.info("SERVER_NAME set to None - using Flask default behavior for reverse proxy")

# Enhanced request context handler for reverse proxy
@app.before_request
def handle_reverse_proxy():
    """Handle reverse proxy URL generation and prevent SERVER_NAME conflicts"""
    # For reverse proxy setups, let Flask use the Host header from the request
    # This allows both localhost:5000 and domain.com access without warnings
    pass

# Add URL generation context for reverse proxy
@app.context_processor
def inject_url_helpers():
    """Inject URL helpers that work with reverse proxy"""
    def external_url_for(endpoint, **values):
        """Generate external URLs that work with reverse proxy"""
        try:
            if app.config.get('SERVER_NAME'):
                return url_for(endpoint, _external=True, **values)
            else:
                # For reverse proxy without SERVER_NAME, use request context
                return url_for(endpoint, _external=True, **values)
        except Exception as e:
            app.logger.warning(f"URL generation warning: {str(e)}")
            # Fallback to relative URL
            return url_for(endpoint, **values)
    
    return dict(external_url_for=external_url_for)

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

# Vereinfachte Health Check Endpoints

@app.route('/health')
@app.route('/healthz')
@app.route('/ping')
def health_check():
    """Enhanced health check with proper error handling"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0',
            'server': 'gunicorn',
            'app': 'iptv-m3u-sorter',
            'checks': {}
        }
        
        # Basic Flask checks
        health_status['checks']['flask'] = 'ok'
        health_status['checks']['routing'] = 'ok'
        
        # Configuration checks
        try:
            server_name = app.config.get('SERVER_NAME')
            health_status['checks']['server_name'] = 'configured' if server_name else 'default'
        except Exception as e:
            health_status['checks']['server_name'] = f'error: {str(e)}'
        
        # Optional filesystem checks
        enable_fs_checks = os.environ.get('ENABLE_FS_HEALTH_CHECKS', 'false').lower() == 'true'
        
        if enable_fs_checks:
            try:
                upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
                playlists_dir = app.config.get('SAVED_PLAYLISTS_FOLDER', 'saved_playlists')
                
                for directory in [upload_dir, playlists_dir]:
                    try:
                        if os.path.exists(directory):
                            health_status['checks'][f'{directory}_exists'] = 'ok'
                            
                            # Test write permissions if enabled
                            if os.access(directory, os.W_OK):
                                health_status['checks'][f'{directory}_writable'] = 'ok'
                            else:
                                health_status['checks'][f'{directory}_writable'] = 'readonly'
                        else:
                            health_status['checks'][f'{directory}_exists'] = 'missing'
                            
                    except OSError as e:
                        health_status['checks'][f'{directory}_error'] = str(e)
                        
            except Exception as fs_error:
                app.logger.warning(f"Filesystem check warning: {str(fs_error)}")
                health_status['checks']['filesystem'] = f'limited: {str(fs_error)}'
        else:
            health_status['checks']['filesystem_checks'] = 'disabled'
        
        # Memory usage check
        try:
            playlist_count = len(playlists) if 'playlists' in globals() else 0
            named_playlist_count = len(named_playlists) if 'named_playlists' in globals() else 0
            health_status['checks']['playlists_in_memory'] = playlist_count
            health_status['checks']['named_playlists_in_memory'] = named_playlist_count
        except Exception as e:
            health_status['checks']['memory_check'] = f'error: {str(e)}'
        
        return health_status, 200
        
    except Exception as e:
        app.logger.error(f"Health check failed: {str(e)}")
        return {
            'status': 'error',
            'timestamp': datetime.now().isoformat(),
            'error': str(e),
            'app': 'iptv-m3u-sorter'
        }, 200  # Return 200 for Docker health check compatibility

@app.route('/ping-simple')
def ping_simple():
    """Ultra-simple health check that never fails"""
    return {
        'status': 'ok', 
        'timestamp': datetime.now().isoformat(),
        'app': 'iptv-m3u-sorter',
        'version': '2.0.0'
    }, 200

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

# Ensure safe application initialization

def initialize_app():
    """Initialize application with proper error handling"""
    try:
        # Ensure upload directories exist with proper error handling
        upload_dir = app.config['UPLOAD_FOLDER']
        playlists_dir = app.config['SAVED_PLAYLISTS_FOLDER']
        
        for directory in [upload_dir, playlists_dir]:
            try:
                os.makedirs(directory, exist_ok=True)
                app.logger.info(f"Directory initialized: {directory}")
            except OSError as e:
                app.logger.warning(f"Could not create directory {directory}: {str(e)}")
                # Continue without failing - directory might be read-only in container
        
        # Test basic Flask functionality
        with app.test_request_context():
            try:
                url_for('index')
                app.logger.info("Flask URL routing initialized successfully")
            except Exception as e:
                app.logger.warning(f"URL routing test failed: {str(e)}")
        
        app.logger.info("IPTV M3U Sorter application initialized successfully")
        
    except Exception as e:
        app.logger.error(f"Application initialization failed: {str(e)}")
        # Don't fail completely - let the app start in degraded mode

# Initialize the application
initialize_app()

# Add error handlers for production stability

@app.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors gracefully"""
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': 'API endpoint not found',
            'path': request.path
        }), 404
    
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors gracefully"""
    app.logger.error(f"Internal server error: {str(error)}")
    
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'Please try again later'
        }), 500
    
    return render_template('index.html'), 500

@app.errorhandler(413)
def file_too_large_error(error):
    """Handle file size limit errors"""
    max_size_mb = app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
    
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': f'File too large. Maximum size is {max_size_mb}MB'
        }), 413
    
    return render_template('index.html'), 413

@app.errorhandler(KeyError)
def key_error_handler(error):
    """Handle KeyError exceptions gracefully"""
    app.logger.error(f"KeyError: {str(error)}")
    
    if request.path.startswith('/api/'):
        return jsonify({
            'success': False,
            'error': 'Configuration error',
            'message': 'Please contact administrator'
        }), 500
    
    return render_template('index.html'), 500

if __name__ == '__main__':
    # Development mode only - Gunicorn handles production
    app.run(debug=True, host='0.0.0.0', port=5000)
