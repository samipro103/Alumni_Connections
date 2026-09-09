@echo off
setlocal EnableExtensions
title ALUMNI - Restaurar acceso estable

echo.
echo ============================================================
echo   ALUMNI - RESTAURAR REGISTRO ESTABLE
echo ============================================================
echo.

set "HERE=%~dp0"
set "PROJECT="

if exist "%HERE%..\src\app\register\page.tsx" (
  for %%I in ("%HERE%..") do set "PROJECT=%%~fI"
)

if not defined PROJECT if exist "%HERE%src\app\register\page.tsx" (
  set "PROJECT=%HERE:~0,-1%"
)

if not defined PROJECT (
  echo ERROR: No pude encontrar alumni-web.
  echo Extrae esta carpeta dentro de alumni-web y vuelve a ejecutar.
  pause
  exit /b 1
)

if not exist "%HERE%payload\src\app\register\page.tsx" (
  echo ERROR: Falta el archivo de reemplazo.
  pause
  exit /b 1
)

set "BACKUP=%PROJECT%\.alumni_backups\restore_registro_estable"
if exist "%BACKUP%" rmdir /S /Q "%BACKUP%"
mkdir "%BACKUP%" >nul 2>&1

copy /Y "%PROJECT%\src\app\register\page.tsx" "%BACKUP%\page.tsx" >nul
if errorlevel 1 goto :error

copy /Y "%HERE%payload\src\app\register\page.tsx" "%PROJECT%\src\app\register\page.tsx" >nul
if errorlevel 1 goto :error

echo.
echo ============================================================
echo   REGISTRO ESTABLE RESTAURADO
echo ============================================================
echo.
echo Se modifico SOLO:
echo   src\app\register\page.tsx
echo.
echo Ahora Crear cuenta usa Supabase directamente.
echo No usa Resend, codigo por correo ni MFA.
echo.
echo NO se modifico el login.
echo NO se modificaron los iconos.
echo NO se modifico Android.
echo.
echo Siguiente:
echo   git status
echo.
pause
exit /b 0

:error
echo.
echo ERROR al aplicar el parche. No hagas commit.
pause
exit /b 1
