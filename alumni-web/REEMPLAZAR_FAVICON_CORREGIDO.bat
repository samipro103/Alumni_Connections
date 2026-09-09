@echo off
setlocal EnableExtensions
chcp 65001 >nul
title ALUMNI - Favicon corregido

echo.
echo ================================================
echo   ALUMNI - CORRECCION FAVICON PARA VERCEL
echo ================================================
echo.

set "HERE=%~dp0"
set "PROJECT="

REM Si la carpeta del parche esta dentro de alumni-web
if exist "%HERE%..\src\app\layout.tsx" (
  for %%I in ("%HERE%..") do set "PROJECT=%%~fI"
)

REM Si el BAT esta directamente dentro de alumni-web
if not defined PROJECT if exist "%HERE%src\app\layout.tsx" set "PROJECT=%HERE%"

if not defined PROJECT (
  echo ERROR: No pude encontrar alumni-web.
  echo Coloca esta carpeta dentro de alumni-web y vuelve a ejecutar.
  pause
  exit /b 1
)

if not exist "%HERE%favicon.ico" (
  echo ERROR: Falta favicon.ico junto al BAT.
  pause
  exit /b 1
)

echo Proyecto:
echo   %PROJECT%
echo.

copy /Y "%HERE%favicon.ico" "%PROJECT%\src\app\favicon.ico" >nul
if errorlevel 1 (
  echo ERROR: No se pudo reemplazar el favicon.
  pause
  exit /b 1
)

echo ================================================
echo   FAVICON CORREGIDO APLICADO
echo ================================================
echo.
echo Siguiente:
echo   git add src/app/favicon.ico
echo   git commit -m "v1.0.13 - Corrige favicon para Vercel"
echo   git push origin main
echo.
pause
