@echo off
setlocal
cd /d "C:\Users\SAMI PC\Documents\Alumni_Connections\alumni-web"

if not exist package.json (
  echo ERROR: No se encontro package.json
  pause
  exit /b 1
)

echo.
echo ============================================================
echo ALUMNI 2.1.0 - COMUNIDADES ^& EVENTOS
echo ============================================================
echo.

node "%~dp0aplicar_alumni_2_1_0.js"

if errorlevel 1 (
  echo.
  echo ERROR: El instalador se detuvo para proteger Alumni.
  echo No hagas commit.
  echo.
  pause
  exit /b 1
)

echo.
echo Ejecuta ahora:
echo npm run build
echo.
pause
