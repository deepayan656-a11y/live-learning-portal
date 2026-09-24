@echo off
title Live Learning Portal Launcher
echo =============================================
echo   LAUNCHING LIVE LEARNING PORTAL SERVICES...
echo =============================================

:: 1. Launch the Backend API Server in a new window
echo Starting Express Backend on Port 5000...
start cmd /k "title Backend API && node server.js"

:: 2. Wait 2 seconds for backend database handshake
timeout /t 2 /nobreak > nul

:: 3. Navigate and launch the Vite React Frontend
echo Starting Vite React Frontend on Port 5173...
start cmd /k "title React Frontend && cd client && npm run dev"

echo =============================================
echo   All systems green! Have fun coding! 🚀
echo =============================================
pause