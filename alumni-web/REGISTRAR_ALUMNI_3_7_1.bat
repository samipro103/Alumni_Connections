@echo off
setlocal
title ALUMNI 3.7.1 - Registrar migracion

echo.
echo ============================================================
echo  ALUMNI 3.7.1 - REGISTRAR MIGRACION EN GIT
echo ============================================================
echo.

if not exist "package.json" (
  echo ERROR: Ejecuta este BAT desde alumni-web.
  pause
  exit /b 1
)

if not exist "supabase\migrations" mkdir "supabase\migrations"

if exist "supabase\migrations\20260831154647_alumni_3_7_1_database_performance.sql" (
  echo La migracion ya existe localmente.
) else (
  copy /Y "%~dp020260831154647_alumni_3_7_1_database_performance.sql" "supabase\migrations\20260831154647_alumni_3_7_1_database_performance.sql" >nul
  if errorlevel 1 (
    echo ERROR: no pude copiar la migracion.
    pause
    exit /b 1
  )
  echo Migracion registrada.
)

echo.
echo Archivo:
echo supabase\migrations\20260831154647_alumni_3_7_1_database_performance.sql
echo.
echo IMPORTANTE:
echo Esta migracion YA FUE APLICADA a produccion por ChatGPT.
echo No la vuelvas a ejecutar manualmente en Supabase.
echo.
git diff --check -- "supabase\migrations\20260831154647_alumni_3_7_1_database_performance.sql"
if errorlevel 1 (
  echo ERROR: git diff --check fallo.
  pause
  exit /b 1
)

echo.
echo ALUMNI 3.7.1 REGISTRADO LOCALMENTE
echo.
pause
