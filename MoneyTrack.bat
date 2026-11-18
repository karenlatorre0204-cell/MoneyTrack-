@echo off
title MoneyTrack - Control Inteligente de Finanzas Personales
cd /d "%~dp0"

:: 1. Ejecutable oficial de escritorio empaquetado (Electron)
if exist "dist\win-unpacked\MoneyTrack.exe" (
    start "" "dist\win-unpacked\MoneyTrack.exe"
    exit /b 0
)

:: 2. Si existe Electron en node_modules
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

:: 3. Fallback directo al navegador
start "" "%CD%\public\index.html"
exit /b 0
