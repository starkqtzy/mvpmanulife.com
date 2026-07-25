@echo off
chcp 65001 >nul 2>&1
setlocal EnableExtensions DisableDelayedExpansion

cd /d "%~dp0"

set "PHP_CMD="
where php >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "delims=" %%I in ('where php 2^>nul') do (
        if not defined PHP_CMD set "PHP_CMD=%%I"
    )
)

if not defined PHP_CMD (
    if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
        set "PHP_CMD=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe"
    )
)

if not defined PHP_CMD (
    if exist "C:\xampp\php\php.exe" (
        set "PHP_CMD=C:\xampp\php\php.exe"
    )
)

if not defined PHP_CMD (
    if exist "C:\wamp64\bin\php\php8.1.10\php.exe" (
        set "PHP_CMD=C:\wamp64\bin\php\php8.1.10\php.exe"
    )
)

if not defined PHP_CMD (
    echo.
    echo [ERROR] PHP executable was not found on this system.
    echo.
    echo Please install PHP or add its location to your PATH environment variable.
    echo Common Windows PHP install locations:
    echo   - C:\laragon\bin\php\php-8.x.x\php.exe
    echo   - C:\xampp\php\php.exe
    echo   - C:\wamp64\bin\php\php8.x.x\php.exe
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   MVP Falcon Unit Enterprise Website - PHP Dev Server
echo ============================================================
echo.
echo   PHP   : %PHP_CMD%
echo   Root  : %cd%
echo   URL   : http://localhost:8000
echo.
echo   Admin : http://localhost:8000/admin/leads_overview.html
echo.
echo   Press Ctrl+C to stop the server.
echo ============================================================
echo.

start "" "http://localhost:8000" 2>nul

"%PHP_CMD%" -S localhost:8000 -t "%cd%"

echo.
echo Server stopped.
pause
endlocal
exit /b 0
