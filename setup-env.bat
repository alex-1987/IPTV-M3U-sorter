@echo off
echo 🔧 IPTV M3U Sorter Environment Setup
echo.

if exist .env (
    echo ⚠️  .env file already exists. Create backup? (y/n)
    set /p backup=
    if /i "%backup%"=="y" (
        copy .env .env.backup
        echo 💾 Backup created: .env.backup
    )
)

echo 📋 Creating .env configuration...
echo.

set /p domain="Enter your domain (or localhost for local use): "
set /p https="Enable HTTPS? (y/n): "
set /p port="Host port (default 5000): "

if "%port%"=="" set port=5000
if "%domain%"=="" set domain=localhost

echo.
echo 📝 Generating configuration...

echo # IPTV M3U Sorter Configuration > .env
echo # Generated on %date% %time% >> .env
echo. >> .env

echo # Basic Settings >> .env
echo FLASK_ENV=production >> .env
echo FLASK_DEBUG=0 >> .env
echo HOST_PORT=%port% >> .env
echo. >> .env

echo # Security Settings >> .env
echo SECRET_KEY=%RANDOM%%RANDOM%%RANDOM%%RANDOM% >> .env
echo MAX_FILE_SIZE=52428800 >> .env

if /i "%https%"=="y" (
    echo HTTPS_ENABLED=true >> .env
    echo URL_SCHEME=https >> .env
) else (
    echo HTTPS_ENABLED=false >> .env
    echo URL_SCHEME=http >> .env
)

echo. >> .env
echo # Domain and Proxy Settings >> .env
echo SERVER_NAME=%domain% >> .env
echo DOMAIN=%domain% >> .env
echo APP_ROOT=/ >> .env

echo.
echo ✅ Configuration saved to .env
echo.
echo 📋 Your settings:
echo    Domain: %domain%
echo    Port: %port%
echo    HTTPS: %https%
echo.
echo 🚀 Next steps:
echo    1. Configure your reverse proxy to point to localhost:%port%
echo    2. Run: start.bat
echo    3. Access via your domain
echo.
echo 💡 See REVERSE_PROXY_EXAMPLES.md for proxy configuration help
pause
