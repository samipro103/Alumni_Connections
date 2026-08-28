@echo off
setlocal EnableExtensions
echo.
echo ====================================================
echo       ALUMNI PWA PUSH IPHONE 1.0 - GRATIS
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta disponible.
  pause
  exit /b 1
)

node "%~dp0aplicar_pwa_push_iphone_1_0.js"
if errorlevel 1 (
  echo.
  echo ERROR: El parche no termino.
  pause
  exit /b 1
)

echo.
echo LISTO.
echo.
pause
endlocal
