@echo off
setlocal
title ALUMNI 3.7.4 - Registrar migracion

if not exist "package.json" (
  echo ERROR: Ejecuta este BAT desde alumni-web.
  pause
  exit /b 1
)

if not exist "supabase\migrations" mkdir "supabase\migrations"

copy /Y "%~dp020260831172901_alumni_3_7_4_events_rls_and_rpc_surface_hardening.sql" "supabase\migrations\20260831172901_alumni_3_7_4_events_rls_and_rpc_surface_hardening.sql" >nul
if errorlevel 1 (
  echo ERROR: no pude copiar la migracion.
  pause
  exit /b 1
)

git diff --check -- "supabase\migrations\20260831172901_alumni_3_7_4_events_rls_and_rpc_surface_hardening.sql"
if errorlevel 1 (
  echo ERROR: git diff --check fallo.
  echo NO HAGAS COMMIT.
  pause
  exit /b 1
)

echo.
echo ALUMNI 3.7.4 REGISTRADO LOCALMENTE
echo.
echo Esta migracion YA FUE APLICADA en Supabase produccion.
pause
