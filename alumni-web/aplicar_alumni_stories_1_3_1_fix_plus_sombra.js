const fs = require("fs");
const path = require("path");

const composer = path.join(
  process.cwd(),
  "src",
  "components",
  "stories",
  "StoryComposer.tsx"
);

const viewer = path.join(
  process.cwd(),
  "src",
  "components",
  "stories",
  "StoryViewer.tsx"
);

for (const file of [composer, viewer]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let composerSource = fs.readFileSync(composer, "utf8");
let viewerSource = fs.readFileSync(viewer, "utf8");

let composerChanges = 0;
let viewerChanges = 0;

/* -------------------------------------------------------------
   FIX 1 — Botón + del creador Opción C
   Antes abría el selector de collage.
   Ahora abre correctamente el selector normal de foto/video.
------------------------------------------------------------- */
const oldPlus = `              <button
                type="button"
                onClick={() => collageInputRef.current?.click()}
                className="flex h-[62px] w-[52px] shrink-0 items-center justify-center rounded-[12px] border border-white/22 bg-black/30 text-[30px] font-light leading-none text-white backdrop-blur-xl transition active:scale-95"
                aria-label="Crear collage"
              >
                +
              </button>`;

const newPlus = `              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="flex h-[62px] w-[52px] shrink-0 items-center justify-center rounded-[12px] border border-white/22 bg-black/30 text-[30px] font-light leading-none text-white backdrop-blur-xl transition active:scale-95"
                aria-label="Agregar foto o video"
              >
                +
              </button>`;

if (composerSource.includes(oldPlus)) {
  composerSource = composerSource.replace(oldPlus, newPlus);
  composerChanges++;
} else if (
  composerSource.includes('onClick={() => mediaInputRef.current?.click()}') &&
  composerSource.includes('aria-label="Agregar foto o video"')
) {
  console.log("ℹ️ El botón + ya estaba corregido.");
} else {
  console.error("❌ No encontré el botón + esperado en StoryComposer.tsx");
  process.exit(1);
}

/* -------------------------------------------------------------
   FIX 2 — Visor sin sombreado visual detrás del propietario
   Quitamos la copia ampliada/desenfocada y la capa negra.
   La foto real queda limpia sobre fondo negro.
------------------------------------------------------------- */
const oldPhotoBlock = `            <img
              src={story.media_url}
              alt=""
              aria-hidden="true"
              style={{
                filter:
                  mediaFilterCss,
              }}
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-3xl"
            />
            <div className="absolute inset-0 bg-black/15" />
            <img
              src={story.media_url}`;

const newPhotoBlock = `            <img
              src={story.media_url}`;

if (viewerSource.includes(oldPhotoBlock)) {
  viewerSource = viewerSource.replace(oldPhotoBlock, newPhotoBlock);
  viewerChanges++;
} else if (!viewerSource.includes("opacity-60 blur-3xl")) {
  console.log("ℹ️ El fondo sombreado/desenfocado del visor ya no está.");
} else {
  console.error("❌ No encontré el bloque de sombreado esperado en StoryViewer.tsx");
  process.exit(1);
}

/* -------------------------------------------------------------
   FIX 3 — Nombre y hora del propietario sin text-shadow/filter
------------------------------------------------------------- */
const oldOwnerName =
  `            <p className="truncate text-sm font-black text-white">`;

const newOwnerName =
  `            <p className="truncate text-sm font-black text-white [text-shadow:none] [filter:none]">`;

if (viewerSource.includes(oldOwnerName)) {
  viewerSource = viewerSource.replace(oldOwnerName, newOwnerName);
  viewerChanges++;
}

const oldOwnerTime =
  `            <p className="text-[10px] text-white/45">`;

const newOwnerTime =
  `            <p className="text-[10px] text-white/45 [text-shadow:none] [filter:none]">`;

if (viewerSource.includes(oldOwnerTime)) {
  viewerSource = viewerSource.replace(oldOwnerTime, newOwnerTime);
  viewerChanges++;
}

/* Marca */
if (!viewerSource.includes("ALUMNI_STORIES_1_3_1_FIX_PLUS_NO_OWNER_SHADOW")) {
  viewerSource = viewerSource.replace(
    `      data-story-design="c-1-1"`,
    `      data-story-design="c-1-1"\n      data-story-fix="ALUMNI_STORIES_1_3_1_FIX_PLUS_NO_OWNER_SHADOW"`
  );
  viewerChanges++;
}

fs.writeFileSync(composer, composerSource, "utf8");
fs.writeFileSync(viewer, viewerSource, "utf8");

console.log("");
console.log("✅ ALUMNI Stories 1.3.1 aplicado.");
console.log(`✅ StoryComposer cambios: ${composerChanges}`);
console.log(`✅ StoryViewer cambios: ${viewerChanges}`);
console.log("✅ Botón + ahora abre foto/video.");
console.log("✅ Eliminado sombreado/desenfoque detrás del propietario.");
console.log("✅ Nombre y hora quedan sin text-shadow.");
console.log("");
console.log("Ahora ejecutá: npm run build");
