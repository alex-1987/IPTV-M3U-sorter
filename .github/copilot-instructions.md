# Copilot Instructions for IPTV M3U Sorter

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an IPTV M3U Playlist Sorter web application built with Flask and modern frontend technologies. 
The Project is easy to use with docker compose


## Code Style Guidelines
- Use Python Flask for backend API endpoints
- Follow PEP 8 for Python code style
- Use modern ES6+ JavaScript for frontend
- Implement responsive CSS with Flexbox/Grid
- Use semantic HTML5 elements

## Architecture
- **Backend**: Flask web server with M3U parsing capabilities
- **Frontend**: Vanilla JavaScript with drag-and-drop functionality
- **File Structure**: Separate templates, static files, and Python modules
- **Data Flow**: Upload → Parse → Sort → Export/Download

## Key Features to Implement
- M3U playlist file upload and parsing
- Drag-and-drop channel sorting interface
- Category-based channel organization
- Search and filter functionality
- Export to M3U format
- Online playlist serving via URL
- Responsive design for mobile/desktop

## Security Considerations
- Validate uploaded M3U files
- Sanitize user input
- Implement file size limits
- Use secure file handling practices

## Performance Guidelines
- Optimize for large playlists (1000+ channels)
- Implement lazy loading for better UX
- Use efficient DOM manipulation
- Cache parsed playlist data appropriately
