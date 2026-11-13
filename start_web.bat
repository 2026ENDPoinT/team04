@echo off
title SEOULTECH CSE System Launcher

set "PROJECT_DIR=C:\Users\choij\Desktop\team04"

if not exist "%PROJECT_DIR%\backend\package.json" (
    set "PROJECT_DIR=%~dp0"
)

echo [1/3] Starting Backend Server (Port 5000)...
start "SEOULTECH-Backend" cmd /k "cd /d %PROJECT_DIR%\backend && npm start"

echo [2/3] Starting Frontend Server (Port 5173)...
start "SEOULTECH-Frontend" cmd /k "cd /d %PROJECT_DIR%\frontend && npm run dev"

echo [3/3] Opening Web Browser in 4 seconds...
timeout /t 4 /nobreak >nul
start "" "http://localhost:5173"

exit