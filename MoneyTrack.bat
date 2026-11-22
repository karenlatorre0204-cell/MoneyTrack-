@echo off
title MoneyTrack - Control Inteligente de Finanzas Personales
cd /d "%~dp0"

:: 1. Ejecutable oficial de escritorio empaquetado (Electron 3D)
if exist "%~dp0dist\win-unpacked\MoneyTrack.exe" (
    start "" "%~dp0dist\win-unpacked\MoneyTrack.exe"
    exit /b 0
)

:: 2. Si existe Electron en node_modules
if exist "%~dp0node_modules\electron\dist\electron.exe" (
    start "" "%~dp0node_modules\electron\dist\electron.exe" .
    exit /b 0
)

:: 3. Modo ventana de aplicacion de escritorio con Microsoft Edge
start msedge --new-window --app="file:///%~dp0public/index.html" 2>nul
if %errorlevel% equ 0 exit /b 0

:: 4. Fallback directo al navegador web predeterminado
start "" "%~dp0public\index.html"
exit /b 0
