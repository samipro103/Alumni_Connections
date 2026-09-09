@echo off
setlocal
title ALUMNI 3.7.3 - Registrar migracion

echo.
echo ============================================================
echo  ALUMNI 3.7.3 - SECONDARY PERFORMANCE AND RELIABILITY
echo ============================================================
echo.

if not exist "package.json" (
  echo ERROR: Ejecuta este BAT desde la carpeta alumni-web.
  pause
  exit /b 1
)

if not exist "supabase\migrations" mkdir "supabase\migrations"

if exist "supabase\migrations\20260831161517_alumni_3_7_3_secondary_performance_reliability.sql" (
  echo La migracion ya existe localmente.
) else (
  copy /Y "%~dp020260831161517_alumni_3_7_3_secondary_performance_reliability.sql" "supabase\migrations\20260831161517_alumni_3_7_3_secondary_performance_reliability.sql" >nul
  if errorlevel 1 (
    echo ERROR: no pude copiar la migracion.
    pause
    exit /b 1
  )
  echo Migracion registrada.
)

echo.
echo IMPORTANTE:
echo Esta migracion YA FUE APLICADA y VALIDADA en Supabase produccion.
echo NO la vuelvas a ejecutar manualmente.
echo.

git diff --check -- "supabase\migrations\20260831161517_alumni_3_7_3_secondary_performance_reliability.sql"
if errorlevel 1 (
  echo.
  echo ERROR: git diff --check fallo.
  echo NO HAGAS COMMIT.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  ALUMNI 3.7.3 REGISTRADO LOCALMENTE
echo ============================================================
echo.
echo Archivo:
echo supabase\migrations\20260831161517_alumni_3_7_3_secondary_performance_reliability.sql
echo.
pause
