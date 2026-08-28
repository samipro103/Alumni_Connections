@echo off
setlocal EnableExtensions
title Revertir Story Audio 11.2 - Alumni

set "APP=C:\Users\SAMI PC\Documents\Alumni_Connections\alumni-web"

echo.
echo ======================================================
echo        REVERTIR STORY AUDIO 11.2 - ALUMNI
echo ======================================================
echo.
echo Este BAT elimina SOLO los cambios del intento de subir MP3
echo y vuelve esos archivos al ultimo commit confirmado en Git.
echo.
echo NO toca publicaciones, chat, temas ni el nuevo diseno de historias.
echo.

cd /d "%APP%"

git restore --source=HEAD -- src/components/stories/StoryComposer.tsx
if errorlevel 1 goto :error

git restore --source=HEAD -- src/components/stories/StoryViewer.tsx
if errorlevel 1 goto :error

git restore --source=HEAD -- src/components/feed/StoriesRail.tsx
if errorlevel 1 goto :error

if exist "src\components\stories\StoryUploadedAudioPlayer.tsx" (
  del /f /q "src\components\stories\StoryUploadedAudioPlayer.tsx"
)

echo.
echo OK: Se revirtio el intento de MP3.
echo.
echo Ahora ejecuta:
echo npm run build
echo.
pause
exit /b 0

:error
echo.
echo ERROR: No se pudo completar la reversion.
echo No hagas commit.
echo.
pause
exit /b 1
