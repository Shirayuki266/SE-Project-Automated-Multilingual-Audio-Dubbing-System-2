@echo off
title Viet Nam Quoc Tu - Backend Server (FastAPI + MongoDB)
echo ========================================================
echo  KHOI DONG BACKEND FASTAPI - VIET NAM QUOC TU
echo ========================================================
cd /d "%~dp0Backend"
if not exist "venv\Scripts\python.exe" (
    echo Dang khoi tao virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) else (
    call venv\Scripts\activate.bat
)
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
