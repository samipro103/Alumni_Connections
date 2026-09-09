@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ALUMNI 3.5.0B - Android JDK 21 Build

echo.
echo ============================================================
echo  ALUMNI 3.5.0B - ANDROID BUILD CON JDK 21
echo ============================================================
echo.

if not exist "android\gradlew.bat" (
  echo ERROR: Ejecuta este BAT desde la carpeta alumni-web.
  pause
  exit /b 1
)

set "JDK21="

REM Android Studio bundled JBR (normalmente JDK 21 en versiones actuales)
if exist "%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" (
  for /f "tokens=3" %%V in ('"%ProgramFiles%\Android\Android Studio\jbr\bin\java.exe" -version 2^>^&1 ^| findstr /i "version"') do (
    echo %%V | findstr /r /c:"\"21\." >nul
    if not errorlevel 1 set "JDK21=%ProgramFiles%\Android\Android Studio\jbr"
  )
)

REM Eclipse Adoptium
if not defined JDK21 (
  for /d %%D in ("%ProgramFiles%\Eclipse Adoptium\jdk-21*") do (
    if exist "%%~fD\bin\java.exe" set "JDK21=%%~fD"
  )
)

REM Microsoft OpenJDK
if not defined JDK21 (
  for /d %%D in ("%ProgramFiles%\Microsoft\jdk-21*") do (
    if exist "%%~fD\bin\java.exe" set "JDK21=%%~fD"
  )
)

REM Oracle / generic Java
if not defined JDK21 (
  for /d %%D in ("%ProgramFiles%\Java\jdk-21*") do (
    if exist "%%~fD\bin\java.exe" set "JDK21=%%~fD"
  )
)

REM Azul Zulu
if not defined JDK21 (
  for /d %%D in ("%ProgramFiles%\Zulu\zulu-21*") do (
    if exist "%%~fD\bin\java.exe" set "JDK21=%%~fD"
  )
)

if not defined JDK21 (
  echo ERROR: No encontre un JDK 21 instalado.
  echo.
  echo Ejecuta estos comandos y pasame el resultado:
  echo   java -version
  echo   where java
  echo   echo %%JAVA_HOME%%
  echo.
  echo Si tienes Android Studio, tambien dime si existe:
  echo   C:\Program Files\Android\Android Studio\jbr
  echo.
  pause
  exit /b 1
)

echo JDK 21 encontrado:
echo   %JDK21%
echo.

set "JAVA_HOME=%JDK21%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java que usaremos:
java -version
if errorlevel 1 (
  echo ERROR: No se pudo ejecutar el JDK seleccionado.
  pause
  exit /b 1
)

echo.
echo Deteniendo daemons Gradle anteriores...
pushd android
call gradlew.bat --stop >nul 2>&1

echo.
echo Verificando JVM de Gradle...
call gradlew.bat -version
if errorlevel 1 (
  popd
  echo.
  echo ERROR: Gradle no pudo iniciar con JDK 21.
  pause
  exit /b 1
)

echo.
echo Compilando APK debug...
call gradlew.bat assembleDebug
set "BUILD_RESULT=%ERRORLEVEL%"
popd

if not "%BUILD_RESULT%"=="0" (
  echo.
  echo ERROR: La compilacion Android fallo.
  echo NO HAGAS COMMIT.
  pause
  exit /b 1
)

if not exist "android\app\build\outputs\apk\debug\app-debug.apk" (
  echo.
  echo ERROR: Gradle termino pero no encontre app-debug.apk.
  echo NO HAGAS COMMIT.
  pause
  exit /b 1
)

echo.
echo Validando cambios del bloque 3.5.0...
git diff --check -- ^
package.json ^
package-lock.json ^
capacitor.config.ts ^
android\capacitor.settings.gradle ^
android\app\capacitor.build.gradle ^
android\app\src\main\res\values\strings.xml ^
android\app\src\main\res\values\styles.xml ^
src\lib\nativeExperience.ts ^
src\components\theme\ThemeProvider.tsx ^
src\components\ui\AlumniUXProvider.tsx ^
src\components\feed\FeedPost.tsx ^
src\app\feed\page.tsx

if errorlevel 1 (
  echo.
  echo ERROR: git diff --check fallo.
  echo NO HAGAS COMMIT.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  ALUMNI 3.5.0B - APK VALIDADO CON JDK 21
echo ============================================================
echo.
echo APK:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo JAVA_HOME global NO fue modificado.
echo.
echo Ya puedes hacer el commit de 3.5.0.
echo.
pause
