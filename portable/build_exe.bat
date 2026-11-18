@echo off
set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
set "SRC=%~dp0Launcher.cs"
set "OUT1=%~dp0..\MoneyTrack.exe"
set "OUT2=%~dp0MoneyTrack.exe"

echo Compilando MoneyTrack.exe en la raiz...
"%CSC%" /target:winexe /out:"%OUT1%" "%SRC%"

echo Compilando MoneyTrack.exe en portable...
"%CSC%" /target:winexe /out:"%OUT2%" "%SRC%"

echo Proceso finalizado con exito.
