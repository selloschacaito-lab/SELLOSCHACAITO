@echo off
echo ========================================================
echo   INSTALADOR DE PLUGIN: SELLOS CHACAITO PARA ILLUSTRATOR
echo ========================================================
echo.

echo [1/3] Habilitando modo desarrollador CEP en Windows Registry...
for /L %%i in (6,1,16) do (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.%%i" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
)
echo Modo depuracion habilitado.

echo.
echo [2/3] Creando carpeta de extensiones CEP...
set "TARGET=%APPDATA%\Adobe\CEP\extensions\com.selloschacaito.impresion"
if not exist "%TARGET%" mkdir "%TARGET%"

echo.
echo [3/3] Copiando archivos...
set "SRC=%~dp0"
xcopy "%SRC%CSXS" "%TARGET%\CSXS\" /E /I /Y /Q >nul
xcopy "%SRC%css" "%TARGET%\css\" /E /I /Y /Q >nul
xcopy "%SRC%js" "%TARGET%\js\" /E /I /Y /Q >nul
xcopy "%SRC%jsx" "%TARGET%\jsx\" /E /I /Y /Q >nul
copy /Y "%SRC%index.html" "%TARGET%\" >nul

echo.
echo ========================================================
echo   INSTALACION COMPLETADA
echo ========================================================
echo.
echo Para usar el plugin:
echo 1. Abre (o reinicia) Adobe Illustrator.
echo 2. Ve a: Ventana -^> Extensiones -^> Sellos Chacaito - Impresion
echo.
pause
