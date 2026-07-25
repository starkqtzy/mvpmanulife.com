# MVP Falcon Unit Enterprise Website - PHP Dev Server Launcher (PowerShell)
#
# How to run (if execution policy blocks):
#   Right-click this file -> "Run with PowerShell"
#   OR run in a PowerShell window:
#     powershell -ExecutionPolicy Bypass -File .\start-server.ps1

[CmdletBinding()]
param(
    [string]$Host = "localhost",
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

function Find-Php {
    $phpCmd = Get-Command php -ErrorAction SilentlyContinue
    if ($phpCmd) { return $phpCmd.Source }

    $candidates = @(
        "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe",
        "C:\laragon\bin\php\php-8.2.0-Win32-vs16-x64\php.exe",
        "C:\laragon\bin\php\php-8.0.0-Win32-vs16-x64\php.exe",
        "C:\xampp\php\php.exe",
        "C:\wamp64\bin\php\php8.1.10\php.exe",
        "C:\wamp64\bin\php\php8.2.0\php.exe",
        "C:\Program Files\PHP\php.exe",
        "C:\tools\php\php.exe"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    # Scan Laragon php folder for any installed version
    $laragonPhpRoot = "C:\laragon\bin\php"
    if (Test-Path -LiteralPath $laragonPhpRoot) {
        $found = Get-ChildItem -LiteralPath $laragonPhpRoot -Recurse -Filter php.exe -ErrorAction SilentlyContinue |
                 Sort-Object FullName -Descending |
                 Select-Object -First 1
        if ($found) { return $found.FullName }
    }

    return $null
}

$PhpPath = Find-Php

if (-not $PhpPath) {
    Write-Host ""
    Write-Host "[ERROR] PHP executable was not found on this system." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PHP or add its location to your PATH environment variable."
    Write-Host "Common Windows PHP install locations:"
    Write-Host "  - C:\laragon\bin\php\php-8.x.x\php.exe"
    Write-Host "  - C:\xampp\php\php.exe"
    Write-Host "  - C:\wamp64\bin\php\php8.x.x\php.exe"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    $PhpVersion = & $PhpPath -v 2>&1 | Select-Object -First 1
} catch {
    $PhpVersion = "PHP (version check failed)"
}

$ServerUrl = "http://${Host}:${Port}"
$AdminUrl  = "${ServerUrl}/admin/leads_overview.html"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MVP Falcon Unit Enterprise Website - PHP Dev Server"      -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  PHP   : " -NoNewline; Write-Host $PhpPath    -ForegroundColor Green
Write-Host "  Ver   : " -NoNewline; Write-Host $PhpVersion -ForegroundColor Green
Write-Host "  Root  : " -NoNewline; Write-Host $ProjectRoot -ForegroundColor Green
Write-Host "  URL   : " -NoNewline; Write-Host $ServerUrl   -ForegroundColor Yellow
Write-Host ""
Write-Host "  Admin : " -NoNewline; Write-Host $AdminUrl    -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server."
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    Start-Process $ServerUrl -ErrorAction SilentlyContinue
} catch { }

& $PhpPath -S "${Host}:${Port}" -t $ProjectRoot

Write-Host ""
Write-Host "Server stopped."
Read-Host "Press Enter to exit"
