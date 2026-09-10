const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(),"src","components","stories","StoryComposer.tsx");
const MARKER = "ALUMNI_STORIES_1_3_3B_OPTION_C_EXACT_CREATOR";

if (!fs.existsSync(file)) {
  console.error("❌ No encontré src/components/stories/StoryComposer.tsx");
  console.error("Ejecutá este parche desde la carpeta alumni-web.");
  process.exit(1);
}

let source = fs.readFileSync(file, "utf8");

if (source.includes(MARKER)) {
  console.log("ℹ️ Stories 1.3.3B ya está aplicado.");
  process.exit(0);
}

function exact(from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  source = source.replace(from, to);
  console.log(`✅ ${label}`);
}

function rx(re, to, label) {
  if (!re.test(source)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  source = source.replace(re, to);
  console.log(`✅ ${label}`);
}

/* Entrada directa */
rx(
  /const \[kind, setKind\] =\s*useState<StoryKind \| null>\(\s*(?:null|"standard")\s*\);/,
  `const [kind, setKind] =
    useState<StoryKind | null>(
      "standard"
    );`,
  "Entrada directa a Opción C"
);

rx(
  /function resetAll\(\) \{\s*(?:\/\/[^\n]*\n\s*)?setKind\((?:null|"standard")\);/,
  `function resetAll() {
    setKind("standard");`,
  "Reset directo a Opción C"
);

/* Stage */
exact(
`      <div
        className="fixed inset-0 z-[2147483000] overflow-hidden bg-[#05070b] text-white"
        data-pull-refresh-lock="true"
      >
        <div className="relative mx-auto h-[100dvh] w-full max-w-[520px] overflow-hidden bg-black">`,
`      <div
        className="fixed inset-0 z-[2147483000] overflow-hidden bg-black text-white"
        data-pull-refresh-lock="true"
        data-story-creator="${MARKER}"
      >
        <div className="relative mx-auto h-[100dvh] w-full max-w-[460px] overflow-hidden bg-[#07090d] sm:border-x sm:border-white/[0.05]">`,
"Stage fullscreen Opción C"
);

/* Foto fullscreen limpia */
exact(
`              <>
                <img
                  src={previewUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    filter:
                      STORY_FILTER_CSS[
                        storyFilter
                      ],
                  }}
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-55 blur-3xl"
                />

                <div className="absolute inset-0 bg-black/15" />

                <img
                  src={previewUrl}
                  alt=""
                  draggable={false}
                  style={{
                    filter:
                      STORY_FILTER_CSS[
                        storyFilter
                      ],
                  }}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </>`,
`              <img
                src={previewUrl}
                alt=""
                draggable={false}
                style={{
                  filter:
                    STORY_FILTER_CSS[
                      storyFilter
                    ],
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />`,
"Foto fullscreen limpia"
);

/* Estado inicial */
exact(
`            <button
              type="button"
              onClick={() =>
                mediaInputRef.current?.click()
              }
              className="absolute inset-0 flex flex-col items-center justify-center bg-[#090c12]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/[0.08] bg-white/[0.045] text-[#aeb6ff] shadow-[0_18px_50px_rgba(0,0,0,.35)]">
                <ImagePlus
                  size={26}
                />
              </span>

              <p className="mt-4 text-sm font-black">
                Elegir foto o video
              </p>

              <p className="mt-1 text-[10px] text-zinc-600">
                Se conserva la calidad original
              </p>
            </button>`,
`            <button
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

              <p className="mt-1 text-[10px] text-white/35">
                Toca para comenzar tu historia
              </p>
            </button>`,
"Estado inicial integrado"
);

/* Botones superiores */
exact(
`className="absolute left-[max(16px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-black/18 text-white/95 backdrop-blur-md transition active:scale-95"`,
`className="absolute left-[max(16px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white transition active:scale-95 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,.35))]"`,
"Botón X limpio"
);

exact(
`            onClick={() => {
              setStoryTextEditing(false);
              setStoryStyleOpen(false);
              setStoryFilterOpen(false);
              setKind(null);
            }}
            className="absolute right-[max(16px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 flex-col items-center justify-center gap-[3px] rounded-full bg-black/18 text-white/90 backdrop-blur-md transition active:scale-95"
            aria-label="Cambiar tipo de historia"`,
`            onClick={() => {
              setStoryTextEditing(false);
              setStoryStyleOpen(false);
              setStoryFilterOpen(false);
            }}
            className="absolute right-[max(16px,env(safe-area-inset-right))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 flex-col items-center justify-center gap-[3px] rounded-full bg-transparent text-white transition active:scale-95 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,.35))]"
            aria-label="Opciones de historia"`,
"Menú superior limpio"
);

/* Barra inferior */
exact(
`          {hasMedia && (
            <div className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-[100] flex items-end gap-3">`,
`          {(
            <div className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-[100] flex items-end gap-3">`,
"Barra inferior siempre visible"
);

rx(
  /className="relative h-\[62px\] w-\[52px\] shrink-0 overflow-hidden rounded-\[12px\] border-2 border-white\/90 bg-black\/35 shadow-\[0_10px_30px_rgba\(0,0,0,.30\)\]"/,
  `className="relative h-[58px] w-[48px] shrink-0 overflow-hidden rounded-[11px] border-2 border-white/90 bg-black/45 shadow-[0_10px_30px_rgba(0,0,0,.22)]"`,
  "Miniatura inferior"
);

/* BOTÓN + robusto */
rx(
  /(<button\s+type="button"\s+onClick=\{\(\) => mediaInputRef\.current\?\.click\(\)\}\s+)className="[^"]*"\s+aria-label="Agregar foto o video"/,
  `$1className="flex h-[58px] w-[48px] shrink-0 items-center justify-center rounded-[11px] border border-white/18 bg-black/38 text-[28px] font-light leading-none text-white backdrop-blur-2xl transition active:scale-95"
                aria-label="Agregar foto o video"`,
  "Botón + inferior"
);

/* Siguiente robusto */
rx(
  /onClick=\{\(\) => \{\s*setStoryTextEditing\(false\);\s*setStoryStyleOpen\(false\);\s*setStoryFilterOpen\(false\);\s*setStoryReviewOpen\(true\);\s*\}\}\s+className="ml-auto flex h-\[54px\] min-w-\[142px\][^"]*"/,
  `onClick={() => {
                  if (!hasMedia) {
                    mediaInputRef.current?.click();
                    return;
                  }

                  setStoryTextEditing(false);
                  setStoryStyleOpen(false);
                  setStoryFilterOpen(false);
                  setStoryReviewOpen(true);
                }}
                className="ml-auto flex h-[52px] min-w-[146px] items-center justify-center gap-3 rounded-[16px] bg-white px-5 text-[14px] font-black text-[#090b10] shadow-[0_12px_34px_rgba(0,0,0,.20)] transition active:scale-[0.98]"`,
  "Botón Siguiente"
);

/* Review */
source = source.replace(
  `className="absolute inset-0 z-[140] flex items-end bg-black/48 backdrop-blur-[2px]"`,
  `className="absolute inset-0 z-[140] flex items-end bg-black/36 backdrop-blur-[1px]"`
);

source = source.replace(
  `className="w-full rounded-t-[30px] border-t border-white/[0.10] bg-[#0b0e14]/98 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-24px_80px_rgba(0,0,0,.46)]"`,
  `className="w-full rounded-t-[28px] border-t border-white/[0.08] bg-[#0a0d13]/98 px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-4 shadow-[0_-18px_50px_rgba(0,0,0,.28)]"`
);

source = source.replace(
  `{/* ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER */}`,
  `{/* ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER */}\n          {/* ${MARKER} */}`
);

/* Solo guardamos cuando TODO pasó */
fs.writeFileSync(file, source, "utf8");

console.log("");
console.log("✅ ALUMNI Stories 1.3.3B aplicado COMPLETO.");
console.log("✅ StoryComposer.tsx guardado correctamente.");
console.log("✅ Ahora ejecutá: npm run build");
