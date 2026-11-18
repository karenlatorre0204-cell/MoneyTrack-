@echo off
title MoneyTrack - Control Inteligente de Finanzas Personales
cd /d "%~dp0\.."

echo ========================================================
echo   Iniciando MoneyTrack...
echo ========================================================

:: 1. Si Electron esta instalado, abrir aplicacion de escritorio nativa
if exist "node_modules\electron\dist\electron.exe" (
    echo Abriendo ventana de escritorio con Electron...
    start "" "node_modules\electron\dist\electron.exe" .
    exit /b 0
)

:: 2. Si no, abrir directamente la aplicacion en el navegador
set "HTML_FILE=%CD%\public\index.html"
echo Abriendo aplicacion MoneyTrack...
start "" "%HTML_FILE%"
exit /b 0
