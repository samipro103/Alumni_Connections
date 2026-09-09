@echo off
setlocal
title ALUMNI 3.1.1A - Fix whitespace

echo.
echo ===============================================
echo  ALUMNI 3.1.1A - FIX WHITESPACE
echo ===============================================
echo.

node "%~dp0corregir-alumni-3-1-1a.js" "%CD%"
if errorlevel 1 (
  echo.
  echo ERROR: No hagas commit.
  echo.
  pause
  exit /b 1
)

echo.
echo Ahora ejecuta:
echo   npm run build
echo.
pause
