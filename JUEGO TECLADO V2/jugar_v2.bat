@echo off
title GRAVY PROTOCOL REVOLUTION 2.0 - Cyberpunk Action Typing RPG
chcp 65001 >nul
cd /d "%~dp0"

echo ======================================================================
echo    INICIANDO GRAVY PROTOCOL REVOLUTION 2.0 - CYBERPUNK 2D ENGINE
echo ======================================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] No se detecto Python instalado en el sistema.
    pause
    exit /b
)

echo [1/2] Verificando dependencias graficas...
pip install -r requirements.txt --quiet

echo [2/2] Desplegando ventana grafica 2D Cyberpunk...
python main_v2.py

pause
