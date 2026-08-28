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
echo ALUMNI 2.3.1 - PROFILE + PASSPORT POLISH
echo ============================================================
echo.

node "%~dp0aplicar_alumni_2_3_1.js"

if errorlevel 1 (
  echo.
  echo ERROR: El instalador se detuvo para proteger Alumni.
  echo No hagas commit.
  pause
  exit /b 1
)

echo.
echo Supabase ya esta actualizado. NO ejecutes SQL.
echo Ejecuta ahora:
echo npm run build
echo.
pause
