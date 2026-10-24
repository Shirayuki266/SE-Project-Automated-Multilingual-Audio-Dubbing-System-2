@echo off
title Viet Nam Quoc Tu - He Thong Thuyet Minh Tu Dong
echo ========================================================
echo  KHOI DONG TOAN BO HE THONG - VIET NAM QUOC TU
echo ========================================================
echo [1/2] Dang khoi dong Backend API (Port 8000)...
start "VNQT Backend" cmd /k "call start_backend.bat"

timeout /t 3 /nobreak >nul

echo [2/2] Dang khoi dong Frontend PWA (Port 5173)...
start "VNQT Frontend" cmd /k "call start_frontend.bat"

timeout /t 2 /nobreak >nul
echo Mo trinh duyet chiem bai tai http://localhost:5173 ...
start http://localhost:5173
echo ========================================================
echo He thong da san sang!
