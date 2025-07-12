# 📺 IPTV M3U Playlist Sorter

A modern, web-based application for sorting and managing IPTV M3U playlists with an intuitive drag-and-drop interface, template system, and Docker support.

![IPTV M3U Sorter](https://img.shields.io/badge/IPTV-M3U%20Sorter-blue?style=for-the-badge&logo=television)
![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker)
![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-2.3.3-000000?style=flat-square&logo=flask)

## ✨ Features

### 🎯 **Smart Playlist Management**
- **Upload M3U Files**: Easy file upload with drag-and-drop support
- **Drag & Drop Sorting**: Intuitive interface to reorder channels with visual feedback
- **Channel Numbering**: Click channel numbers to edit positions directly
- **Bulk Operations**: Move multiple channels efficiently

### 🔍 **Advanced Search & Filtering**
- **Real-time Search**: Find channels instantly by name
- **Category Filtering**: Filter by channel groups/categories
- **Smart Filters**: Visual indicators for active filters
- **Clear All**: Reset filters with one click

### 📋 **Template System**
- **Save Templates**: Save your current channel order as reusable templates
- **Apply Templates**: Quickly apply saved sorting to new playlists
- **Export/Import**: Download templates as JSON files and share with others
- **Template Management**: Create, delete, and organize multiple templates

### 🌐 **Online Playlist Sharing**
- **Named URLs**: Save playlists online with custom names
- **Direct M3U Access**: Generate URLs compatible with IPTV players
- **Persistent Storage**: Your saved playlists are stored permanently
- **Easy Sharing**: Share playlist URLs with friends and family

### 📱 **Modern Responsive Design**
- **Mobile-Friendly**: Touch-optimized interface for smartphones and tablets
- **Beautiful UI**: Modern gradient design with smooth animations
- **Dark/Light Themes**: Elegant styling that works in any environment
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Quick Start

### Option 1: Docker (Recommended)
The easiest way to get started:

1. **Prerequisites**: Make sure Docker and Docker Compose are installed
2. **Clone & Run**:
   ```bash
   git clone https://github.com/alex-1987/IPTV-M3U-sorter.git
   cd "IPTV M3U sorter"
   
   # Windows
   start.bat
   
   # Linux/Mac
   docker-compose up -d
   ```
3. **Access**: Open http://localhost:5000 in your browser

### Option 2: Manual Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/alex-1987/IPTV-M3U-sorter.git
   cd "IPTV M3U sorter"
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run Application**:
   ```bash
   python app.py
   ```

4. **Access**: Open http://localhost:5000 in your browser

## 🐳 Docker Commands

| Action | Windows | Linux/Mac |
|--------|---------|-----------|
| **Start** | `start.bat` | `docker-compose up -d` |
| **Stop** | `stop.bat` | `docker-compose down` |
| **Update** | `update.bat` | `docker-compose up -d --build` |
| **Logs** | `docker-compose logs -f` | `docker-compose logs -f` |

## 📁 Project Structure

```
IPTV M3U sorter/
├── 🐍 app.py                    # Flask backend application
├── 📋 requirements.txt          # Python dependencies
├── 📄 templates/
│   └── index.html              # Main web interface
├── 🎨 static/
│   ├── css/
│   │   └── style.css          # Beautiful responsive styling
│   └── js/
│       └── app.js             # Advanced frontend JavaScript
├── 🐳 docker-compose.yml       # Docker orchestration
├── 🐳 Dockerfile              # Container image definition
├── 🔧 *.bat                   # Windows management scripts
├── 📁 uploads/                # Uploaded M3U files
├── 📁 saved_playlists/        # Online saved playlists
└── 📁 templates/              # Template files storage
```

## 🛠️ Technology Stack

- **Backend**: Python 3.8+ with Flask 2.3.3
- **Frontend**: Modern HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Advanced CSS with Flexbox, Grid, and beautiful animations
- **Containerization**: Docker & Docker Compose for easy deployment
- **File Processing**: Robust M3U playlist parsing and generation
- **Storage**: Local file system with optional online storage

## 🎮 How to Use

### 1. **Upload Your Playlist**
- Click "Choose M3U File" or drag and drop your file
- The application will parse and display all channels

### 2. **Sort Your Channels**
- **Drag & Drop**: Simply drag channels to reorder them
- **Edit Numbers**: Click on channel numbers to edit positions directly
- **Search**: Use the search box to find specific channels
- **Filter**: Select categories to filter channels

### 3. **Save Templates**
- Click "Save as Template" to save your current sorting
- Name your template for easy identification
- Apply templates to other playlists later

### 4. **Export Your Work**
- **Download**: Get your sorted playlist as an M3U file
- **Save Online**: Upload to get a shareable URL
- **Share**: Give the URL to others or use in IPTV players

## 🌟 Advanced Features

### Template Management
```javascript
// Templates are stored locally and can be:
✅ Created from current channel order
✅ Applied to any playlist
✅ Exported as JSON files
✅ Imported from JSON files
✅ Shared between users
```

### Smart Drag & Drop
```javascript
// Enhanced drag and drop features:
✅ Visual feedback during dragging
✅ Smart position calculation
✅ Works with filtered lists
✅ Touch support for mobile
✅ Keyboard accessibility
```

### Online Storage
```javascript
// Save playlists online with:
✅ Custom names for easy identification
✅ Permanent storage
✅ Direct M3U URLs for players
✅ Easy sharing capabilities
```

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| **Chrome** | 80+ | ✅ Fully Supported |
| **Firefox** | 75+ | ✅ Fully Supported |
| **Safari** | 13+ | ✅ Fully Supported |
| **Edge** | 80+ | ✅ Fully Supported |

## 🐛 Troubleshooting

### Common Issues

1. **Port 5000 already in use**:
   ```bash
   # Edit docker-compose.yml and change port mapping
   ports:
     - "8080:5000"  # Change 5000 to 8080
   ```

2. **Docker not starting**:
   ```bash
   # Make sure Docker Desktop is running
   docker --version
   docker-compose --version
   ```

3. **Permission issues on Windows**:
   ```bash
   # Run batch files as Administrator
   # Right-click start.bat → "Run as administrator"
   ```

4. **View application logs**:
   ```bash
   docker-compose logs iptv-sorter
   ```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Setup
```bash
# Clone the repo
git clone https://github.com/alex-1987/IPTV-M3U-sorter.git

# Install development dependencies
pip install -r requirements.txt

# Run in development mode
export FLASK_ENV=development
python app.py
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Need help? Here's how to get support:

1. **Check the logs**: `docker-compose logs iptv-sorter`
2. **Read the documentation**: All features are documented above
3. **Create an issue**: Use GitHub issues for bug reports
4. **Join discussions**: Use GitHub Discussions for questions

## 📈 Changelog

### 🎉 v2.0.0 (Current)
- ✅ **Complete Docker containerization** with easy setup scripts
- ✅ **Enhanced drag-and-drop** with beautiful visual feedback
- ✅ **Template system** for saving and reusing sorting preferences
- ✅ **Improved search and filter** with real-time updates
- ✅ **Modern responsive UI** with animations and gradients
- ✅ **Named URL support** for saved playlists
- ✅ **Click-to-edit** channel numbering
- ✅ **Mobile optimization** with touch support

### v1.0.0
- ✅ Basic M3U playlist upload and parsing
- ✅ Simple drag-and-drop sorting
- ✅ Export functionality

## 🏆 Why Choose IPTV M3U Sorter?

- **🚀 Fast**: Lightweight and optimized for performance
- **🎨 Beautiful**: Modern UI that's a pleasure to use
- **🔧 Easy**: One-click Docker deployment
- **📱 Responsive**: Works perfectly on all devices
- **🔒 Private**: Your playlists stay on your server
- **🆓 Free**: Completely open source

---

<div align="center">

**Made with ❤️ for IPTV enthusiasts**

[![GitHub stars](https://img.shields.io/github/stars/alex-1987/IPTV-M3U-sorter?style=social)](https://github.com/alex-1987/IPTV-M3U-sorter/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/alex-1987/IPTV-M3U-sorter?style=social)](https://github.com/alex-1987/IPTV-M3U-sorter/network)

</div>
