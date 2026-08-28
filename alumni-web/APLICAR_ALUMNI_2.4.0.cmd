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
echo ALUMNI 2.4.0 - EMAIL 2FA
echo ============================================================
echo.

node "%~dp0aplicar_alumni_2_4_0.js"

if errorlevel 1 (
  echo.
  echo ERROR: El instalador se detuvo para proteger Alumni.
  echo No hagas commit.
  pause
  exit /b 1
)

echo.
echo IMPORTANTE:
echo NO hagas push hasta configurar el correo del servidor.
echo.
echo Luego ejecuta:
echo npm run build
echo.
pause
