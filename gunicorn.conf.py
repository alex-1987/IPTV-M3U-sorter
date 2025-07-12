import os
import multiprocessing

# Server socket
bind = "0.0.0.0:5000"
backlog = 2048

# Worker processes
workers = int(os.environ.get('WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = os.environ.get('WORKER_CLASS', 'gevent')
worker_connections = int(os.environ.get('WORKER_CONNECTIONS', 1000))
timeout = int(os.environ.get('TIMEOUT', 120))
keepalive = int(os.environ.get('KEEPALIVE', 5))

# Restart workers after this many requests, to help prevent memory leaks
max_requests = int(os.environ.get('MAX_REQUESTS', 1000))
max_requests_jitter = int(os.environ.get('MAX_REQUESTS_JITTER', 100))

# Load application code before the worker processes are forked
preload_app = True

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = 'iptv-m3u-sorter'

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (if needed)
keyfile = None
certfile = None
