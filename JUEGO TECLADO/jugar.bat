@echo off
title GRAVY PROTOCOL - Cyberpunk Typing Game
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================================
echo       INICIANDO GRAVY PROTOCOL - CYBERPUNK TYPING
echo ========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se detecto Python instalado en el sistema.
    echo Por favor, instala Python 3.8+ o ejecuta el archivo .exe compilado.
    pause
    exit /b
)

echo [OK] Comprobando dependencias...
pip install -r requirements.txt --quiet

echo [OK] Desplegando interfaz de terminal...
python main.py

pause
