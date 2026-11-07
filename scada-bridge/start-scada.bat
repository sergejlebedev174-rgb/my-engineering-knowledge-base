@echo off
chcp 65001 >nul
rem SCADA bridge Jurmalciems - start with auto-restart (ASCII only: cmd.exe reads .bat in OEM codepage)
title SCADA bridge Jurmalciems
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node.js from https://nodejs.org and run again.
  pause
  exit /b 1
)
if not exist config.json (
  copy config.example.json config.json >nul
  echo Created config.json from example - set gateway IP of Delock and register addresses.
)
:loop
echo [%date% %time%] Starting SCADA bridge...
node server.js
echo [%date% %time%] Bridge stopped - restart in 5 seconds (Ctrl+C to exit)
timeout /t 5 /nobreak >nul
goto loop
