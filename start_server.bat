@echo off
cd /d "%~dp0"
echo Starting server in web directory...
echo Open http://localhost:9000 in your browser
python -m http.server 9000
pause
