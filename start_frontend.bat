@echo off
title Viet Nam Quoc Tu - Frontend PWA (React 19.2 + Vite 7)
echo ========================================================
echo  KHOI DONG FRONTEND PWA - VIET NAM QUOC TU
echo ========================================================
cd /d "%~dp0Frontend"
npm run dev -- --host 0.0.0.0 --port 5173
pause
