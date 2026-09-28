@echo off
chcp 65001 >nul
title CineClue - Server Locale
cd /d "%~dp0"

echo.
echo  ============================================
echo       CineClue - Film del Giorno
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo  [ERRORE] Node.js non trovato.
    echo  Installalo da https://nodejs.org e riprova.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo  Prima esecuzione: installo le dipendenze, attendi...
    call npm install --no-audit --no-fund
)

echo  Avvio del server su http://localhost:3000 ...
echo  (lascia aperta questa finestra; chiudila per fermare il server)
echo. 

start /b cmd /c "timeout /t 4 /nobreak >nul & start "" http://localhost:3001"
call npm run dev -- -p 3001

echo.
echo  Server fermato.
pause