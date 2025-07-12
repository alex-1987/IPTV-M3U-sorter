# Server restart script
# To restart the Flask server, follow these steps:

print("=== IPTV M3U Sorter Server Restart ===")
print("1. Stop current server with Ctrl+C")
print("2. Run: python app.py")
print("3. Open browser: http://localhost:5000")
print("4. Hard refresh with Ctrl+F5 to clear cache")
print("==========================================")

if __name__ == "__main__":
    import os
    import sys
    
    # Add current directory to Python path
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # Import and run the Flask app
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5000)