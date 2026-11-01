@echo off
title System Command Center v2.5.0 - Windows 11 Workstation Engine
cd /d "%~dp0.."

echo ============================================================================
echo   SYSTEM COMMAND CENTER v2.5.0 (Neo's Noir Edition)
echo   Windows 11 System Intelligence, rclone G: Virtual Drive ^& Command Engine
echo ============================================================================

REM Start server in background if port 3000 is not already listening
netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [SCC] Starting local SQLite + rclone workstation server on port 3000...
    start "SCC Workstation Backend" /min cmd /c "npm start"
    timeout /t 3 /nobreak >nul
)

echo [SCC] Opening System Command Center native app window...
start msedge --app=http://localhost:3000 --window-size=1440,900
exit /b 0
