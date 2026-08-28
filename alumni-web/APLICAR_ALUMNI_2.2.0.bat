@echo off
setlocal
cd /d "C:\Users\SAMI PC\Documents\Alumni_Connections\alumni-web"

echo.
echo ============================================================
echo ALUMNI 2.2.0 - RADAR + PASAPORTE + RECOMENDACIONES
echo ============================================================
echo.

if not exist package.json (
  echo ERROR: No se encontro package.json en alumni-web
  pause
  exit /b 1
)

node "%~dp0aplicar_alumni_2_2_0.js"

if errorlevel 1 (
  echo.
  echo ERROR: El instalador se detuvo para proteger Alumni.
  echo No hagas commit.
  echo.
  pause
  exit /b 1
)

echo.
echo Ahora:
echo 1) Ejecuta en Supabase el archivo:
echo    supabase\alumni_2_2_0_radar_passport_recommendations.sql
echo 2) Ejecuta:
echo    npm run build
echo.
pause
