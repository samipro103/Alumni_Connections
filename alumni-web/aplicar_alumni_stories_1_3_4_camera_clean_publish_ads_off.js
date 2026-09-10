const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const composerFile = path.join(
  ROOT,
  "src",
  "components",
  "stories",
  "StoryComposer.tsx"
);

const adsFile = path.join(
  ROOT,
  "src",
  "components",
  "ads",
  "AdSenseSlot.tsx"
);

const manifestFile = path.join(
  ROOT,
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml"
);

const MARKER = "ALUMNI_STORIES_1_3_4_CAMERA_CLEAN_PUBLISH_ADS_OFF";

for (const file of [composerFile, adsFile, manifestFile]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let composer = fs.readFileSync(composerFile, "utf8");
let ads = fs.readFileSync(adsFile, "utf8");
let manifest = fs.readFileSync(manifestFile, "utf8");

if (
  composer.includes(MARKER) &&
  ads.includes(MARKER) &&
  manifest.includes(MARKER)
) {
  console.log("ℹ️ Stories 1.3.4 ya está aplicado.");
  process.exit(0);
}

function mustReplace(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(from, to);
}

function mustRegex(source, regex, to, label) {
  if (!regex.test(source)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(regex, to);
}

/* ================================================================
   STORY COMPOSER
   ================================================================ */

if (!composer.includes(MARKER)) {
  /* --------------------------------------------------------------
     1. Refs para cámara
     -------------------------------------------------------------- */
  composer = mustRegex(
    composer,
    /(  const mediaInputRef =\s*\n\s*useRef<HTMLInputElement>\(null\);\s*\n)/,
    `$1
  // ${MARKER}
  const cameraVideoRef =
    useRef<HTMLVideoElement>(null);

  const cameraStreamRef =
    useRef<MediaStream | null>(null);
`,
    "Refs de cámara móvil"
  );

  /* --------------------------------------------------------------
     2. Estados para cámara
     -------------------------------------------------------------- */
  composer = mustRegex(
    composer,
    /(  const \[\s*storyReviewOpen,\s*setStoryReviewOpen,\s*\] = useState\(false\);\s*\n)/,
    `$1
  const [
    mobileCameraActive,
    setMobileCameraActive,
  ] = useState(false);

  const [
    mobileCameraError,
    setMobileCameraError,
  ] = useState("");
`,
    "Estados de cámara móvil"
  );

  /* --------------------------------------------------------------
     3. Efectos de cámara antes del efecto de cierre/reset
     -------------------------------------------------------------- */
  const cameraEffects = `
  useEffect(() => {
    if (
      !open ||
      kind !== "standard" ||
      file ||
      sharedPost ||
      collageFiles.length >= 2
    ) {
      const stream =
        cameraStreamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
        cameraStreamRef.current =
          null;
      }

      setMobileCameraActive(false);
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined"
    ) {
      return;
    }

    const phoneLike =
      /Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      ) ||
      (
        window.matchMedia(
          "(pointer: coarse)"
        ).matches &&
        window.matchMedia(
          "(max-width: 900px)"
        ).matches
      );

    if (
      !phoneLike ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setMobileCameraError("");

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: {
                ideal: "environment",
              },
              width: {
                ideal: 1080,
              },
              height: {
                ideal: 1920,
              },
            },
            audio: false,
          });

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );
          return;
        }

        cameraStreamRef.current =
          stream;

        setMobileCameraActive(true);
      } catch (error) {
        console.warn(
          "[Alumni Stories] Cámara no disponible:",
          error
        );

        setMobileCameraActive(false);
        setMobileCameraError(
          "No pudimos abrir la cámara. Puedes elegir una foto de tu galería."
        );
      }
    })();

    return () => {
      cancelled = true;

      const stream =
        cameraStreamRef.current;

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        cameraStreamRef.current =
          null;
      }
    };
  }, [
    open,
    kind,
    file,
    sharedPost,
    collageFiles.length,
  ]);

  useEffect(() => {
    if (
      !mobileCameraActive ||
      !cameraVideoRef.current ||
      !cameraStreamRef.current
    ) {
      return;
    }

    const video =
      cameraVideoRef.current;

    video.srcObject =
      cameraStreamRef.current;

    void video.play().catch(() => {
      // playsInline + muted suele permitir autoplay;
      // si el navegador lo bloquea, el usuario aún puede usar galería.
    });
  }, [mobileCameraActive]);

`;

  const resetEffectRegex =
    /  useEffect\(\(\) => \{\s*\n\s*if \(!open\) \{\s*\n\s*resetAll\(\);\s*\n\s*\}\s*\n\s*\}, \[open\]\);/;

  if (!resetEffectRegex.test(composer)) {
    console.error(
      "❌ No encontré el efecto de apertura/cierre para insertar cámara."
    );
    process.exit(1);
  }

  composer = composer.replace(
    resetEffectRegex,
    cameraEffects +
      `  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open]);`
  );
  console.log("✅ Inicio automático de cámara en móvil");

  /* --------------------------------------------------------------
     4. Helpers: detener cámara + capturar foto
     -------------------------------------------------------------- */
  const cameraFunctions = `
  function stopMobileCamera() {
    const stream =
      cameraStreamRef.current;

    if (stream) {
      stream
        .getTracks()
        .forEach((track) =>
          track.stop()
        );

      cameraStreamRef.current =
        null;
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject =
        null;
    }

    setMobileCameraActive(false);
  }

  function captureMobileCameraPhoto() {
    const video =
      cameraVideoRef.current;

    if (
      !video ||
      video.readyState < 2 ||
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      video.videoWidth;

    canvas.height =
      video.videoHeight;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }

        const capturedFile =
          new File(
            [blob],
            \`alumni-story-camera-\${Date.now()}.jpg\`,
            {
              type: "image/jpeg",
              lastModified:
                Date.now(),
            }
          );

        stopMobileCamera();
        setFile(capturedFile);
      },
      "image/jpeg",
      0.95
    );
  }

`;

  if (!composer.includes("  function resetAll() {")) {
    console.error(
      "❌ No encontré resetAll() para insertar funciones de cámara."
    );
    process.exit(1);
  }

  composer = composer.replace(
    "  function resetAll() {",
    cameraFunctions +
      "  function resetAll() {"
  );
  console.log("✅ Captura fotográfica desde cámara");

  /* --------------------------------------------------------------
     5. Reset de cámara
     -------------------------------------------------------------- */
  composer = mustRegex(
    composer,
    /(    setStoryReviewOpen\(\s*false\s*\);\s*\n)/,
    `$1    setMobileCameraActive(false);
    setMobileCameraError("");
`,
    "Reset de cámara"
  );

  /* --------------------------------------------------------------
     6. Quitar botón de tres puntos.
     Soporta tanto 1.3.2 como 1.3.3B.
     -------------------------------------------------------------- */
  const dotsRegex =
    /\n\s*<button\s*\n\s*type="button"\s*\n\s*onClick=\{\(\) => \{\s*\n\s*setStoryTextEditing\(false\);[\s\S]*?aria-label="(?:Cambiar tipo de historia|Opciones de historia)"\s*\n\s*>\s*[\s\S]*?<\/button>\s*\n/;

  if (!dotsRegex.test(composer)) {
    console.error(
      "❌ No encontré el botón de tres puntos del creador."
    );
    process.exit(1);
  }

  composer = composer.replace(
    dotsRegex,
    "\n"
  );
  console.log("✅ Tres puntos eliminados del creador");

  /* --------------------------------------------------------------
     7. Cámara visible en móvil cuando no hay contenido.
     Reemplazamos el empty-state actual, tolerando 1.3.2/1.3.3B.
     -------------------------------------------------------------- */
  const emptyStateRegex =
    /            <button\s*\n\s*type="button"\s*\n\s*onClick=\{\(\) =>\s*\n?\s*mediaInputRef\.current\?\.click\(\)\s*\n?\s*\}\s*\n\s*className="absolute inset-0 flex flex-col items-center justify-center[^"]*"(?:\s*\n\s*aria-label="Seleccionar foto o video")?\s*\n\s*>\s*[\s\S]*?            <\/button>/;

  if (!emptyStateRegex.test(composer)) {
    console.error(
      "❌ No encontré la pantalla inicial de foto/video."
    );
    process.exit(1);
  }

  const cameraEmptyState = `            <div className="absolute inset-0 overflow-hidden bg-[#07090d]">
              {mobileCameraActive ? (
                <>
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                  <div className="pointer-events-none absolute left-1/2 top-[max(76px,calc(env(safe-area-inset-top)+66px))] z-[65] -translate-x-1/2 rounded-full bg-black/24 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white/72 backdrop-blur-md">
                    Cámara
                  </div>

                  <button
                    type="button"
                    onClick={captureMobileCameraPhoto}
                    className="absolute bottom-[108px] left-1/2 z-[75] flex h-[74px] w-[74px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white bg-white/18 shadow-[0_10px_30px_rgba(0,0,0,.24)] backdrop-blur-sm transition active:scale-95"
                    aria-label="Tomar foto"
                  >
                    <span className="h-[58px] w-[58px] rounded-full bg-white" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      mediaInputRef.current?.click()
                    }
                    className="absolute bottom-[120px] left-[max(18px,env(safe-area-inset-left))] z-[75] flex h-12 w-12 items-center justify-center rounded-[15px] border border-white/14 bg-black/34 text-white backdrop-blur-xl transition active:scale-95"
                    aria-label="Abrir galería"
                  >
                    <Images size={20} />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    mediaInputRef.current?.click()
                  }
                  className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_38%,rgba(93,105,255,.12),transparent_30%),linear-gradient(180deg,#0a0d14_0%,#05070b_100%)]"
                  aria-label="Seleccionar foto o video"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.055] text-white/90 backdrop-blur-xl">
                    <ImagePlus size={23} />
                  </span>

                  <p className="mt-4 text-[13px] font-black tracking-[-0.02em] text-white/90">
                    Agregar foto o video
                  </p>

                  <p className="mt-1 max-w-[260px] px-4 text-center text-[10px] leading-4 text-white/35">
                    {mobileCameraError ||
                      "Toca para elegir contenido de tu galería"}
                  </p>
                </button>
              )}
            </div>`;

  composer = composer.replace(
    emptyStateRegex,
    cameraEmptyState
  );
  console.log("✅ Vista de cámara integrada al diseño C");

  /* --------------------------------------------------------------
     8. Siguiente: si la cámara está abierta y no hay foto,
        toma la foto. Si no hay cámara, abre galería.
     -------------------------------------------------------------- */
  composer = composer.replace(
    `if (!hasMedia) {
                    mediaInputRef.current?.click();
                    return;
                  }`,
    `if (!hasMedia) {
                    if (mobileCameraActive) {
                      captureMobileCameraPhoto();
                      return;
                    }

                    mediaInputRef.current?.click();
                    return;
                  }`
  );

  /* --------------------------------------------------------------
     9. Quitar comentario/caption del paso de publicación.
     -------------------------------------------------------------- */
  const captionTextareaRegex =
    /\n\s*<textarea\s*\n\s*value=\{caption\}[\s\S]*?\/>\s*\n/;

  if (!captionTextareaRegex.test(composer)) {
    console.error(
      "❌ No encontré el comentario opcional del paso de publicación."
    );
    process.exit(1);
  }

  composer = composer.replace(
    captionTextareaRegex,
    "\n"
  );

  composer = composer.replace(
    "Agrega un mensaje opcional o publícala directamente.",
    "Revisa tu historia y publícala cuando esté lista."
  );

  /* Nunca guardar caption en historias libres */
  composer = composer.replace(
    `            caption:
              caption.trim() ||
              null,`,
    `            caption:
              kind === "standard"
                ? null
                : caption.trim() ||
                  null,`
  );

  /* Limpiamos cualquier valor previo al abrir revisión */
  composer = composer.replace(
    `setStoryReviewOpen(true);`,
    `setCaption("");
                  setStoryReviewOpen(true);`
  );

  console.log("✅ Comentario eliminado del flujo de publicación");

  /* --------------------------------------------------------------
     10. Marca
     -------------------------------------------------------------- */
  const brandAnchor =
    `Alumni<span className="text-[#7b87ff]">.</span>`;

  if (!composer.includes(brandAnchor)) {
    console.error(
      "❌ No encontré la cabecera Alumni. para marcar la versión."
    );
    process.exit(1);
  }

  composer = composer.replace(
    brandAnchor,
    `${brandAnchor}
              {/* ${MARKER} */}`
  );
}

/* ================================================================
   ADS — DESHABILITAR, NO BORRAR
   ================================================================ */

if (!ads.includes(MARKER)) {
  ads = mustReplace(
    ads,
    `const ENABLED = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "1";`,
    `// ${MARKER}
const ALUMNI_ADS_TEMPORARILY_DISABLED = true;

const ENABLED =
  !ALUMNI_ADS_TEMPORARILY_DISABLED &&
  process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "1";`,
    "Anuncios deshabilitados temporalmente"
  );

  ads = mustReplace(
    ads,
    `const PREVIEW =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ADSENSE_PREVIEW === "1";`,
    `const PREVIEW =
  !ALUMNI_ADS_TEMPORARILY_DISABLED &&
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_ADSENSE_PREVIEW === "1";`,
    "Preview de anuncios también deshabilitado"
  );
}

/* ================================================================
   ANDROID — PERMISO CÁMARA
   ================================================================ */

if (!manifest.includes(MARKER)) {
  if (
    !manifest.includes(
      'android.permission.CAMERA'
    )
  ) {
    manifest = mustReplace(
      manifest,
      `    <uses-permission android:name="android.permission.INTERNET" />`,
      `    <!-- ${MARKER} -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera.any" android:required="false" />
    <uses-permission android:name="android.permission.INTERNET" />`,
      "Permiso de cámara Android"
    );
  } else {
    manifest = manifest.replace(
      `    <uses-permission android:name="android.permission.CAMERA" />`,
      `    <!-- ${MARKER} -->
    <uses-permission android:name="android.permission.CAMERA" />`
    );
    console.log(
      "✅ Permiso de cámara Android ya existía"
    );
  }
}

/* ================================================================
   GUARDADO ATÓMICO AL FINAL
   ================================================================ */

fs.writeFileSync(
  composerFile,
  composer,
  "utf8"
);

fs.writeFileSync(
  adsFile,
  ads,
  "utf8"
);

fs.writeFileSync(
  manifestFile,
  manifest,
  "utf8"
);

console.log("");
console.log("✅ ALUMNI Stories 1.3.4 aplicado COMPLETO.");
console.log("✅ 3 puntos quitados al crear historia.");
console.log("✅ Comentario quitado antes de publicar.");
console.log("✅ Anuncios deshabilitados sin borrar código.");
console.log("✅ Cámara trasera integrada en móvil.");
console.log("✅ Galería disponible como respaldo.");
console.log("");
console.log("Ahora ejecutá: npm run build");
