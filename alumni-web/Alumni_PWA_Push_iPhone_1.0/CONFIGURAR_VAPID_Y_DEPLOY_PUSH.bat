@echo off
setlocal EnableExtensions
set "PROJECT=C:\Users\SAMI PC\Documents\Alumni_Connections\alumni-web"
set "PROJECT_REF=qmsvoytjdivfhqgmvcge"

echo.
echo ====================================================
echo   CONFIGURAR VAPID + DEPLOY PUSH EN SUPABASE
echo ====================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js no esta disponible.
  pause
  exit /b 1
)

node "%~dp0generar_vapid.js"
if errorlevel 1 (
  echo ERROR: No se pudieron generar las claves VAPID.
  pause
  exit /b 1
)

if not exist "%~dp0VAPID_TEMP.cmd" (
  echo ERROR: No se creo VAPID_TEMP.cmd.
  pause
  exit /b 1
)

call "%~dp0VAPID_TEMP.cmd"

pushd "%PROJECT%"

echo.
echo [1/2] Guardando secretos VAPID en Supabase...
call npx supabase secrets set --project-ref "%PROJECT_REF%" WEB_PUSH_VAPID_PUBLIC_KEY="%WEB_PUSH_VAPID_PUBLIC_KEY%" WEB_PUSH_VAPID_PRIVATE_KEY="%WEB_PUSH_VAPID_PRIVATE_KEY%"
if errorlevel 1 (
  echo.
  echo ERROR: No se pudieron guardar los secretos VAPID.
  popd
  del /q "%~dp0VAPID_TEMP.cmd" >nul 2>nul
  pause
  exit /b 1
)

echo.
echo [2/2] Desplegando la funcion push actualizada...
call npx supabase functions deploy push --no-verify-jwt --use-api

if errorlevel 1 (
  echo.
  echo Reintentando sin --use-api...
  call npx supabase functions deploy push --no-verify-jwt
)

if errorlevel 1 (
  echo.
  echo ERROR: No se pudo desplegar la funcion push.
  popd
  del /q "%~dp0VAPID_TEMP.cmd" >nul 2>nul
  pause
  exit /b 1
)

popd
del /q "%~dp0VAPID_TEMP.cmd" >nul 2>nul

echo.
echo ================================================
echo  OK: VAPID + PUSH CONFIGURADOS EN SUPABASE
echo ================================================
echo.
pause
endlocal
