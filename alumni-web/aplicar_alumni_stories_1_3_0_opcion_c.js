const fs = require("fs");
const path = require("path");

const file = path.join(
  process.cwd(),
  "src",
  "components",
  "stories",
  "StoryComposer.tsx"
);

if (!fs.existsSync(file)) {
  console.error("❌ No encontré src/components/stories/StoryComposer.tsx");
  console.error("Ejecutá este parche desde la carpeta alumni-web.");
  process.exit(1);
}

let source = fs.readFileSync(file, "utf8");

if (source.includes("ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER")) {
  console.log("ℹ️ Stories 1.3.0 Option C ya está aplicado.");
  process.exit(0);
}

let changes = 0;

function replaceExact(from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  source = source.replace(from, to);
  changes++;
}

function replaceRegex(regex, to, label) {
  if (!regex.test(source)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  source = source.replace(regex, to);
  changes++;
}

/* 1) Estado del paso final */
replaceRegex(
  /const \[\s*storyFilterOpen,\s*setStoryFilterOpen,\s*\] = useState\(false\);/,
  `const [
    storyFilterOpen,
    setStoryFilterOpen,
  ] = useState(false);

  // ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER
  const [
    storyReviewOpen,
    setStoryReviewOpen,
  ] = useState(false);`,
  "estado storyFilterOpen"
);

/* 2) Reset completo */
replaceRegex(
  /setStoryFilter\(\s*"original"\s*\);\s*setStoryFilterOpen\(\s*false\s*\);\s*setCollageFiles\(\[\]\);/,
  `setStoryFilter(
      "original"
    );
    setStoryFilterOpen(
      false
    );
    setStoryReviewOpen(
      false
    );
    setCollageFiles([]);`,
  "reset del editor"
);

/* 3) Al publicar correctamente cierra el paso final */
replaceExact(
  `      await onPublished();`,
  `      setStoryReviewOpen(false);
      await onPublished();`,
  "cierre de review al publicar"
);

/* 4) Stage limpio y centrado */
replaceExact(
  `        <div className="relative mx-auto h-[100dvh] w-full max-w-[560px] overflow-hidden bg-black shadow-[0_0_90px_rgba(0,0,0,.55)]">`,
  `        <div className="relative mx-auto h-[100dvh] w-full max-w-[520px] overflow-hidden bg-black">`,
  "contenedor principal"
);

/* 5) Gradientes mucho más sutiles, como propuesta C */
replaceExact(
  `          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-40 bg-gradient-to-b from-black/70 via-black/20 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-48 bg-gradient-to-t from-black/72 via-black/24 to-transparent" />`,
  `          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-black/35 via-black/5 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-t from-black/40 via-black/8 to-transparent" />`,
  "gradientes del editor"
);

/* 6) Cabecera opción C */
replaceRegex(
  /          <div className="absolute left-\[max\(14px,env\(safe-area-inset-left\)\)\] top-\[max\(14px,env\(safe-area-inset-top\)\)\] z-\[80\] flex items-center gap-2">[\s\S]*?          <\/div>\s*\n\s*          \{hasMedia && \(/,
  `          {/* ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER */}
          <div className="pointer-events-none absolute inset-x-0 top-[max(14px,env(safe-area-inset-top))] z-[85] flex h-11 items-center justify-center">
            <div className="pointer-events-auto select-none text-[17px] font-black tracking-[-0.045em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,.45)]">
              Alumni<span className="text-[#7b87ff]">.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute left-[max(16px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-black/18 text-white/95 backdrop-blur-md transition active:scale-95"
            aria-label="Cerrar"
          >
            <X size={25} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={() => {
              setStoryTextEditing(false);
              setStoryStyleOpen(false);
              setStoryFilterOpen(false);
              setKind(null);
            }}
            className="absolute right-[max(16px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 flex-col items-center justify-center gap-[3px] rounded-full bg-black/18 text-white/90 backdrop-blur-md transition active:scale-95"
            aria-label="Cambiar tipo de historia"
          >
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
          </button>

          {hasMedia && (`,
  "cabecera del editor libre"
);

/* 7) Herramientas flotantes derecha: visual C, funcionalidad existente */
replaceRegex(
  /          \{hasMedia && \(\s*<div className="absolute right-\[max\(14px,env\(safe-area-inset-right\)\)\] top-\[max\(14px,env\(safe-area-inset-top\)\)\] z-\[80\] flex flex-col gap-2">[\s\S]*?          \)\}\s*\n\s*          \{\/\*\s*\n\s*            PC: controles auxiliares\./,
  `          {hasMedia && (
            <div className="absolute right-[max(16px,env(safe-area-inset-right))] top-[38%] z-[88] flex -translate-y-1/2 flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setStoryTextEditing(true);
                  setStoryStyleOpen(false);
                  setStoryFilterOpen(false);
                }}
                className={\`flex h-12 w-12 items-center justify-center rounded-[17px] border text-[18px] font-semibold tracking-[-0.06em] backdrop-blur-xl transition active:scale-95 \${
                  storyTextEditing
                    ? "border-[#aeb6ff]/45 bg-[#6d7cff]/28 text-white"
                    : "border-white/[0.12] bg-black/30 text-white"
                }\`}
                aria-label="Texto"
              >
                Aa
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryText((current) =>
                    current
                      ? current.endsWith(" ")
                        ? current + "@"
                        : current + " @"
                      : "@"
                  );
                  setStoryTextEditing(true);
                  setStoryStyleOpen(false);
                  setStoryFilterOpen(false);
                }}
                className="flex h-12 w-12 items-center justify-center rounded-[17px] border border-white/[0.12] bg-black/30 text-[22px] font-medium text-white backdrop-blur-xl transition active:scale-95"
                aria-label="Mencionar persona"
              >
                @
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryStyleOpen((value) => !value);
                  setStoryTextEditing(false);
                  setStoryFilterOpen(false);
                }}
                className={\`flex h-12 w-12 items-center justify-center rounded-[17px] border backdrop-blur-xl transition active:scale-95 \${
                  storyStyleOpen
                    ? "border-[#aeb6ff]/45 bg-[#6d7cff]/28 text-white"
                    : "border-white/[0.12] bg-black/30 text-white"
                }\`}
                aria-label="Estilo"
              >
                <Palette size={20} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryFilterOpen((value) => !value);
                  setStoryTextEditing(false);
                  setStoryStyleOpen(false);
                }}
                className={\`flex h-12 w-12 items-center justify-center rounded-[17px] border backdrop-blur-xl transition active:scale-95 \${
                  storyFilterOpen
                    ? "border-[#aeb6ff]/45 bg-[#6d7cff]/28 text-white"
                    : "border-white/[0.12] bg-black/30 text-white"
                }\`}
                aria-label="Filtros"
              >
                <SlidersHorizontal size={20} />
              </button>
            </div>
          )}

          {/*
            PC: controles auxiliares.`,
  "herramientas flotantes"
);

/* 8) Sustituir botón Publicar por miniatura + collage + Siguiente */
replaceRegex(
  /          \{hasMedia && \(\s*<button\s*type="button"\s*onClick=\{\s*publishStory\s*\}[\s\S]*?<\/button>\s*\)\}/,
  `          {hasMedia && (
            <div className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-[100] flex items-end gap-3">
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="relative h-[62px] w-[52px] shrink-0 overflow-hidden rounded-[12px] border-2 border-white/90 bg-black/35 shadow-[0_10px_30px_rgba(0,0,0,.30)]"
                aria-label="Cambiar foto o video"
              >
                {previewUrl ? (
                  file?.type.startsWith("video/") ? (
                    <video
                      src={previewUrl}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )
                ) : collagePreviewUrls[0] ? (
                  <img
                    src={collagePreviewUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-white/60">
                    <ImagePlus size={18} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => collageInputRef.current?.click()}
                className="flex h-[62px] w-[52px] shrink-0 items-center justify-center rounded-[12px] border border-white/22 bg-black/30 text-[30px] font-light leading-none text-white backdrop-blur-xl transition active:scale-95"
                aria-label="Crear collage"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryTextEditing(false);
                  setStoryStyleOpen(false);
                  setStoryFilterOpen(false);
                  setStoryReviewOpen(true);
                }}
                className="ml-auto flex h-[54px] min-w-[142px] items-center justify-center gap-3 rounded-[18px] bg-white px-5 text-[14px] font-black text-[#090b10] shadow-[0_16px_40px_rgba(0,0,0,.28)] transition active:scale-[0.98]"
              >
                Siguiente
                <span className="text-[22px] font-medium leading-none">→</span>
              </button>
            </div>
          )}`,
  "botón publicar del editor libre"
);

/* 9) Paso final después de Siguiente */
const hiddenInputAnchor = `          <HiddenInput
            inputRef={
              mediaInputRef
            }
            onPick={
              chooseMedia
            }
          />`;

const review = `          {storyReviewOpen && (
            <div
              className="absolute inset-0 z-[140] flex items-end bg-black/48 backdrop-blur-[2px]"
              onClick={() => setStoryReviewOpen(false)}
            >
              <div
                className="w-full rounded-t-[30px] border-t border-white/[0.10] bg-[#0b0e14]/98 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_80px_rgba(0,0,0,.46)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/18" />

                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[18px] font-black tracking-[-0.03em] text-white">
                      Publicar historia
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-white/40">
                      Agrega un mensaje opcional o publícala directamente.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStoryReviewOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/65"
                    aria-label="Volver al editor"
                  >
                    <X size={16} />
                  </button>
                </div>

                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value.slice(0, 280))}
                  placeholder="Escribe un mensaje (opcional)"
                  rows={3}
                  className="mt-5 w-full resize-none rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[13px] leading-5 text-white outline-none placeholder:text-white/25 focus:border-[#8792ff]/35"
                />

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStoryReviewOpen(false)}
                    className="h-12 rounded-[16px] border border-white/[0.09] px-5 text-[12px] font-black text-white/65"
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={publishStory}
                    disabled={publishing}
                    className="ml-auto flex h-12 min-w-[170px] items-center justify-center gap-2 rounded-[16px] bg-[#6d7cff] px-5 text-[12px] font-black text-white shadow-[0_16px_38px_rgba(80,91,220,.32)] transition active:scale-[0.98] disabled:opacity-60"
                  >
                    {publishing ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Publicando...
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Publicar historia
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

`;

replaceExact(
  hiddenInputAnchor,
  review + hiddenInputAnchor,
  "inserción del paso final"
);

fs.writeFileSync(file, source, "utf8");

console.log("");
console.log("✅ ALUMNI Stories 1.3.0 aplicado.");
console.log("✅ Creador Historia libre cambiado a Opción C.");
console.log("✅ Cabecera: X + Alumni. + menú.");
console.log("✅ Herramientas flotantes laterales.");
console.log("✅ Miniatura + botón collage + Siguiente.");
console.log("✅ Paso final de publicación agregado.");
console.log(`✅ Bloques modificados: ${changes}`);
console.log("");
console.log("Ahora ejecutá: npm run build");
