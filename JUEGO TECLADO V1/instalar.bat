@echo off
title Instalador - GRAVY PROTOCOL
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo        INSTALADOR OFICIAL: GRAVY PROTOCOL (CYBERPUNK)
echo ========================================================
echo.

echo [1/3] Verificando archivos del juego...
if not exist "dist\GravyProtocol.exe" (
    echo [!] Generando archivo ejecutable...
    python build_exe.py
)

echo [2/3] Instalando dependencias del sistema...
pip install -r requirements.txt --quiet

echo [3/3] Creando acceso directo en tu Escritorio...
powershell -ExecutionPolicy Bypass -File .\crear_acceso_directo.ps1

echo.
echo ========================================================
echo     ?INSTALACI?N COMPLETADA CON ?XITO!
echo ========================================================
echo Ya puedes iniciar el juego desde el icono en tu Escritorio:
echo "GRAVY PROTOCOL - Cyberpunk Typing"
echo.
pause
