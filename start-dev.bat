@echo off
title CRM System - Khoi dong he thong
echo ====================================================
echo    HE THONG QUAN LY KHACH HANG (CRM ENTERPRISE)
echo ====================================================
echo.

set "SCRIPT_DIR=%~dp0"
if exist "%SCRIPT_DIR%develop\backend" (
    set "BACKEND_DIR=%SCRIPT_DIR%develop\backend"
    set "FRONTEND_DIR=%SCRIPT_DIR%develop\frontend"
) else if exist "%SCRIPT_DIR%backend" (
    set "BACKEND_DIR=%SCRIPT_DIR%backend"
    set "FRONTEND_DIR=%SCRIPT_DIR%frontend"
) else if exist "%SCRIPT_DIR%..\develop\backend" (
    set "BACKEND_DIR=%SCRIPT_DIR%..\develop\backend"
    set "FRONTEND_DIR=%SCRIPT_DIR%..\develop\frontend"
) else (
    set "BACKEND_DIR=%CD%\backend"
    set "FRONTEND_DIR=%CD%\frontend"
)

echo [*] Thu muc Backend:  %BACKEND_DIR%
echo [*] Thu muc Frontend: %FRONTEND_DIR%
echo.

REM 1. Kiem tra MySQL
echo [1/4] Kiem tra dich vu MySQL...
netstat -ano | findstr :3306 | findstr LISTENING >nul
if "%ERRORLEVEL%"=="0" (
    echo       [OK] MySQL dang hoat dong tren cong 3306.
) else (
    echo       [*] Dang khoi dong MySQL tu C:\xampp...
    if exist "C:\xampp\mysql_start.bat" (
        start "" /B "C:\xampp\mysql_start.bat"
    ) else if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /D "C:\xampp" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    ) else (
        echo       [!] Canh bao: Khong tim thay MySQL XAMPP. Vui long bat MySQL thu cong.
    )
    ping -n 3 127.0.0.1 >nul
)

REM 2. Tim duong dan PHP
set "PHP_BIN=php"
if exist "C:\xampp\php\php.exe" (
    set "PHP_BIN=C:\xampp\php\php.exe"
)

REM 3. Don dep tien trinh cu tren cong 8000 va 5173
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :8000 ^| findstr LISTENING') do (
    echo [*] Don dep tien trinh cu tren cong 8000 PID %%a
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :5173 ^| findstr LISTENING') do (
    echo [*] Don dep tien trinh cu tren cong 5173 PID %%a
    taskkill /F /PID %%a >nul 2>&1
)

REM 4. Khoi dong Backend Laravel
echo.
echo [2/4] Dang khoi dong Backend Laravel tai http://127.0.0.1:8000
cd /d "%BACKEND_DIR%"
start "CRM Backend - Laravel (Port 8000)" cmd /k ""%PHP_BIN%" artisan serve --host=127.0.0.1 --port=8000"

REM 5. Khoi dong Frontend Vite
echo.
echo [3/4] Dang khoi dong Frontend Vite tai http://localhost:5173
cd /d "%FRONTEND_DIR%"
start "CRM Frontend - Vite (Port 5173)" cmd /k "npm.cmd run dev"

REM 6. Cho ca Backend va Frontend san sang
echo.
echo [4/4] Dang kiem tra trang thai may chu...
set /a attempts=0

:WAIT_BACKEND_LOOP
ping -n 2 127.0.0.1 >nul
netstat -ano | findstr :8000 | findstr LISTENING >nul
if "%ERRORLEVEL%"=="0" goto BACKEND_OK
set /a attempts+=1
if %attempts% geq 15 goto BACKEND_TIMEOUT
goto WAIT_BACKEND_LOOP

:BACKEND_TIMEOUT
echo       [!] Backend dang khoi dong, vui long cho vai giay.
goto WAIT_FRONTEND_CHECK

:BACKEND_OK
echo       [OK] Backend Laravel da san sang cong 8000.

:WAIT_FRONTEND_CHECK
set /a attempts=0

:WAIT_FRONTEND_LOOP
ping -n 2 127.0.0.1 >nul
netstat -ano | findstr :5173 | findstr LISTENING >nul
if "%ERRORLEVEL%"=="0" goto FRONTEND_OK
set /a attempts+=1
if %attempts% geq 15 goto OPEN_APP
goto WAIT_FRONTEND_LOOP

:FRONTEND_OK
echo       [OK] Frontend Vite da san sang cong 5173.

:OPEN_APP
echo.
echo ====================================================
echo [THANH CONG] Toan bo he thong CRM da khoi dong xong!
echo - Frontend:    http://localhost:5173
echo - Backend API: http://127.0.0.1:8000
echo ====================================================
echo.
start http://localhost:5173
pause