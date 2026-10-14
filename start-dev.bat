@echo off
chcp 65001 >nul
title CRM System - Khoi dong he thong
echo ====================================================
echo    HE THONG QUAN LY KHACH HANG (CRM ENTERPRISE)
echo ====================================================
echo.

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

REM 1. Kiem tra MySQL
echo [1/3] Kiem tra co so du lieu MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       [OK] MySQL dang chay.
) else (
    echo       [*] Dang khoi dong MySQL tu C:\xampp...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /D "C:\xampp" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 >nul
        echo       [OK] Da gui lenh khoi dong MySQL.
    ) else (
        echo       [!] Canh bao: Khong tim thay C:\xampp\mysql\bin\mysqld.exe. Vui long bat MySQL thu cong.
    )
)

REM 2. Tim duong dan PHP
set PHP_BIN=php
if exist "C:\xampp\php\php.exe" (
    set PHP_BIN=C:\xampp\php\php.exe
)

REM 3. Khoi dong Backend Laravel
echo.
echo [2/3] Dang khoi dong Backend Laravel tai http://127.0.0.1:8000 ...
start "CRM Backend - Laravel (Port 8000)" cmd /k "cd /d %BACKEND_DIR% && %PHP_BIN% artisan serve --host=127.0.0.1 --port=8000"

REM 4. Khoi dong Frontend Vite
echo.
echo [3/3] Dang khoi dong Frontend Vite tai http://localhost:5173 ...
start "CRM Frontend - Vite (Port 5173)" cmd /k "cd /d %FRONTEND_DIR% && npm.cmd run dev"

echo.
echo ====================================================
echo [THANH CONG] He thong CRM da duoc khoi dong!
echo - Frontend:    http://localhost:5173
echo - Backend API: http://127.0.0.1:8000
echo ====================================================
echo.
echo Dang tu dong mo trinh duyet...
timeout /t 2 >nul
start http://localhost:5173

