@echo off
setlocal EnableExtensions
title ALUMNI - Generar APK con logo nuevo

echo.
echo ============================================================
echo   ALUMNI - GENERAR APK CON LOGO NUEVO
echo ============================================================
echo.

set "HERE=%~dp0"
set "PROJECT="

if exist "%HERE%..\android\gradlew.bat" (
  for %%I in ("%HERE%..") do set "PROJECT=%%~fI"
)

if not defined PROJECT (
  if exist "%HERE%android\gradlew.bat" set "PROJECT=%HERE:~0,-1%"
)

if not defined PROJECT (
  echo ERROR: No pude localizar alumni-web\android\gradlew.bat
  echo Extrae esta carpeta dentro de alumni-web y ejecuta este BAT.
  pause
  exit /b 1
)

echo Proyecto:
echo   %PROJECT%
echo.

echo Verificando Java...
java -version
if errorlevel 1 (
  echo.
  echo ERROR: Java no esta disponible en PATH.
  echo Capacitor 8 normalmente requiere JDK 21.
  pause
  exit /b 1
)

echo.
echo Compilando APK desde cero...
pushd "%PROJECT%\android"
call gradlew.bat clean assembleDebug
if errorlevel 1 (
  popd
  echo.
  echo ERROR: Gradle no pudo generar la APK.
  echo Copiame toda la salida de esta ventana.
  pause
  exit /b 1
)
popd

set "APK=%PROJECT%\android\app\build\outputs\apk\debug\app-debug.apk"

if not exist "%APK%" (
  echo.
  echo ERROR: Gradle termino pero no encontre:
  echo   %APK%
  pause
  exit /b 1
)

copy /Y "%APK%" "%PROJECT%\AlumniConnections_LOGO_NUEVO.apk" >nul

echo.
echo ============================================================
echo   APK GENERADA CORRECTAMENTE
echo ============================================================
echo.
echo Archivo:
echo   %PROJECT%\AlumniConnections_LOGO_NUEVO.apk
echo.
echo IMPORTANTE:
echo   Si Android sigue mostrando el icono anterior,
echo   desinstala la APK vieja y luego instala esta nueva.
echo.
pause
