@echo off
title MoneyTrack - Control Inteligente de Finanzas Personales
cd /d "%~dp0\.."

echo ========================================================
echo   MoneyTrack - Iniciando aplicacion de escritorio
echo   Estilo: 3D Effects and Depth
echo ========================================================

:: 1. Comprobar si Electron esta instalado localmente
if exist "node_modules\electron" (
    echo Iniciando entorno Electron...
    call npx electron .
    exit /b
)

:: 2. Si no esta instalado Node/Electron, abrir en ventana de aplicacion nativa (Edge/Chrome App Mode)
set "APP_URL=%CD%\public\index.html"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_URL%" --window-size=1320,860
    exit /b
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="file:///%APP_URL%" --window-size=1320,860
    exit /b
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="file:///%APP_URL%" --window-size=1320,860
    exit /b
)

:: 3. Fallback al navegador predeterminado
start "" "%APP_URL%"
