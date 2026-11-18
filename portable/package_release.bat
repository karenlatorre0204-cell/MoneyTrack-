@echo off
set "ROOT=%~dp0.."
set "STAGE=%TEMP%\MoneyTrack-Release-Stage"
set "ZIP=%ROOT%\MoneyTrack-v1.0.0-Windows-Portable.zip"

echo Preparando directorio de empaquetado...
if exist "%STAGE%" rmdir /s /q "%STAGE%"
mkdir "%STAGE%\MoneyTrack"

echo Copiando archivos de la aplicacion portable...
xcopy "%ROOT%\dist\win-unpacked\*" "%STAGE%\MoneyTrack\" /e /i /y /q
copy "%ROOT%\MoneyTrack.bat" "%STAGE%\MoneyTrack\" /y
copy "%ROOT%\README.md" "%STAGE%\MoneyTrack\" /y

echo Comprimiendo en formato ZIP para GitHub Releases...
if exist "%ZIP%" del /f /q "%ZIP%"
powershell -NoProfile -Command "Compress-Archive -Path '%STAGE%\MoneyTrack' -DestinationPath '%ZIP%' -Force"

echo Limpiando temporales...
rmdir /s /q "%STAGE%"
echo Paquete generado con exito en: %ZIP%
