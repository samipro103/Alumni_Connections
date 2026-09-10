const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_STORIES_1_4_5_MOBILE_FIRST_REPAIR";

const composerFile = path.join(
  ROOT,
  "src",
  "components",
  "stories",
  "StoryComposer.tsx"
);

const storiesCssFile = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  "stories-visual-1-1.css"
);

for (const file of [composerFile, storiesCssFile]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let composer = fs.readFileSync(composerFile, "utf8");
let css = fs.readFileSync(storiesCssFile, "utf8");

if (
  composer.includes(MARKER) &&
  css.includes(MARKER)
) {
  console.log("ℹ️ Stories 1.4.5 Mobile First Repair ya está aplicado.");
  process.exit(0);
}

function requiredReplace(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }

  console.log(`✅ ${label}`);
  return source.replace(from, to);
}

/* ================================================================
   1) STORY COMPOSER — IDENTIFICAR ESTADO PARA CSS MOBILE FIRST
   ================================================================ */

if (!composer.includes(MARKER)) {
  composer = requiredReplace(
    composer,
    `        data-pull-refresh-lock="true"
        data-story-creator="ALUMNI_STORIES_1_3_3B_OPTION_C_EXACT_CREATOR"
      >`,
    `        data-pull-refresh-lock="true"
        data-story-creator="ALUMNI_STORIES_1_3_3B_OPTION_C_EXACT_CREATOR"
        data-mobile-first="true"
        data-has-media={hasMedia ? "true" : "false"}
        data-camera-active={mobileCameraActive ? "true" : "false"}
      >`,
    "Estado mobile-first agregado al creador"
  );

  /* Quitamos responsive estructural de la caja principal.
     Desktop se manejará únicamente desde CSS >= 700px. */
  composer = requiredReplace(
    composer,
    `className="alumni-story-creator-stage relative mx-auto h-[100dvh] w-full max-w-[460px] overflow-hidden bg-[#07090d] sm:border-x sm:border-white/[0.05]"`,
    `className="alumni-story-creator-stage relative mx-auto h-[100dvh] w-full overflow-hidden bg-[#07090d]"`,
    "Stage sin responsive estructural de Tailwind"
  );

  /* ==============================================================
     2) RESTAURAR HERRAMIENTAS QUE EL 1.4.4 SE LLEVÓ POR ERROR
     ============================================================== */

  const brokenTools = `          {hasMedia && (
            <div className="alumni-story-creator-tools absolute right-[max(16px,env(safe-area-inset-right))] top-[38%] z-[88] flex -translate-y-1/2 flex-col gap-3">
              <button
                type="button"
                onClick={publishStory}
                disabled={publishing || !hasMedia}
                className="alumni-story-publish-direct ml-auto flex h-[52px] min-w-[146px] items-center justify-center rounded-[16px] bg-[#6d7cff] px-6 text-[14px] font-black text-white shadow-[0_12px_34px_rgba(0,0,0,.20)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {publishing
                  ? "Publicando..."
                  : "Publicar"}
              </button>
            </div>
          )}`;

  const restoredTools = `          {hasMedia && (
            <div className="alumni-story-creator-tools absolute z-[88] flex flex-col">
              <button
                type="button"
                onClick={() => {
                  setStoryTextEditing(true);
                  setStoryStyleOpen(false);
                  setStoryFilterOpen(false);
                }}
                className={\`alumni-story-tool-button \${
                  storyTextEditing ? "is-active" : ""
                }\`}
                aria-label="Texto"
              >
                <span className="text-[17px] font-black tracking-[-0.06em]">
                  Aa
                </span>
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
                className="alumni-story-tool-button"
                aria-label="Mencionar persona"
              >
                <span className="text-[20px] font-semibold">@</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryStyleOpen((value) => !value);
                  setStoryTextEditing(false);
                  setStoryFilterOpen(false);
                }}
                className={\`alumni-story-tool-button \${
                  storyStyleOpen ? "is-active" : ""
                }\`}
                aria-label="Estilo"
              >
                <Palette size={19} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setStoryFilterOpen((value) => !value);
                  setStoryTextEditing(false);
                  setStoryStyleOpen(false);
                }}
                className={\`alumni-story-tool-button \${
                  storyFilterOpen ? "is-active" : ""
                }\`}
                aria-label="Filtros"
              >
                <SlidersHorizontal size={19} />
              </button>
            </div>
          )}`;

  composer = requiredReplace(
    composer,
    brokenTools,
    restoredTools,
    "Herramientas Aa / @ / Estilo / Filtros restauradas"
  );

  /* ==============================================================
     3) QUITAR HINT MÓVIL QUE SE MONTABA CON LA BARRA INFERIOR
     ============================================================== */

  const mobileHintRegex =
    /\n\s*\{storyText &&\s*\n\s*!storyTextEditing && \(\s*\n\s*<div className="pointer-events-none absolute bottom-\[max\(88px,calc\(env\(safe-area-inset-bottom\)\+76px\)\)\] left-\[max\(14px,env\(safe-area-inset-left\)\)\] z-\[70\] max-w-\[235px\] sm:hidden">[\s\S]*?<\/div>\s*\n\s*\)\}/;

  if (mobileHintRegex.test(composer)) {
    composer = composer.replace(mobileHintRegex, "");
    console.log("✅ Hint móvil superpuesto eliminado");
  }

  /* ==============================================================
     4) RESTAURAR BARRA INFERIOR MOBILE-FIRST
     Solo aparece cuando ya hay foto/video/collage/post.
     ============================================================== */

  const insertionAnchor = `          {sharedPost && (
            <button`;

  if (!composer.includes(insertionAnchor)) {
    console.error("❌ No encontré el punto para restaurar la barra inferior.");
    process.exit(1);
  }

  const bottomActions = `          {hasMedia && (
            <div className="alumni-story-bottom-actions absolute z-[100] flex items-center">
              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="alumni-story-media-thumb relative shrink-0 overflow-hidden"
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
                  <span className="flex h-full w-full items-center justify-center">
                    <ImagePlus size={17} />
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => mediaInputRef.current?.click()}
                className="alumni-story-add-media shrink-0"
                aria-label="Agregar foto o video"
              >
                +
              </button>

              <button
                type="button"
                onClick={publishStory}
                disabled={publishing || !hasMedia}
                className="alumni-story-publish-direct ml-auto"
              >
                {publishing
                  ? "Publicando..."
                  : "Publicar"}
              </button>
            </div>
          )}

`;

  composer = composer.replace(
    insertionAnchor,
    bottomActions + insertionAnchor
  );
  console.log("✅ Barra inferior móvil restaurada");

  /* Marca de reparación. */
  composer = composer.replace(
    `{/* ALUMNI_STORIES_1_3_3B_OPTION_C_EXACT_CREATOR */}`,
    `{/* ALUMNI_STORIES_1_3_3B_OPTION_C_EXACT_CREATOR */}
          {/* ${MARKER} */}`
  );
}

/* ================================================================
   5) CSS — MOBILE FIRST REAL
   Base = teléfono. Desktop solo amplía sin cambiar estructura.
   ================================================================ */

if (!css.includes(MARKER)) {
  css += `

/* ================================================================
   ${MARKER}
   MOBILE FIRST: 360–430px es la referencia principal.
   Ningún control esencial depende de sm:/md:/lg: para existir.
   ================================================================ */

/* ---------------------------------------------------------------
   CREAR HISTORIA — BASE MÓVIL
   --------------------------------------------------------------- */

.alumni-story-creator-c[data-mobile-first="true"] {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  min-height: 100dvh !important;
  overflow: hidden !important;
  padding: 0 !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-stage {
  width: 100vw !important;
  max-width: none !important;
  height: 100dvh !important;
  min-height: 100dvh !important;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
}

/* Cabecera: zona reservada, siempre visible y sin invadir herramientas. */
.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-brand {
  position: relative;
  z-index: 2;
  white-space: nowrap;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-close {
  width: 44px !important;
  height: 44px !important;
  left: max(10px, env(safe-area-inset-left)) !important;
  top: max(10px, env(safe-area-inset-top)) !important;
}

/* Herramientas: debajo de cabecera, no centradas verticalmente.
   Así no cambian de posición según la altura del teléfono. */
.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-tools {
  top: max(82px, calc(env(safe-area-inset-top) + 68px)) !important;
  right: max(10px, env(safe-area-inset-right)) !important;
  gap: 8px !important;
  transform: none !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-tool-button {
  display: flex !important;
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  border: 1px solid var(--story-ui-border) !important;
  border-radius: 15px !important;
  background: var(--story-ui-surface-strong) !important;
  color: var(--story-ui-text) !important;
  box-shadow: 0 8px 22px var(--story-ui-shadow) !important;
  backdrop-filter: blur(18px) saturate(120%) !important;
  -webkit-backdrop-filter: blur(18px) saturate(120%) !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-tool-button.is-active {
  border-color: color-mix(in srgb, var(--app-accent) 48%, var(--story-ui-border)) !important;
  background: var(--app-accent-soft) !important;
  color: var(--app-accent) !important;
}

/* Barra inferior: una sola fila, dentro del safe area.
   48 + 48 + espacio + botón flexible = cabe incluso en 360px. */
.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-bottom-actions {
  left: max(10px, env(safe-area-inset-left)) !important;
  right: max(10px, env(safe-area-inset-right)) !important;
  bottom: max(10px, env(safe-area-inset-bottom)) !important;
  gap: 8px !important;
  min-width: 0 !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-media-thumb,
.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-add-media {
  width: 46px !important;
  height: 48px !important;
  min-width: 46px !important;
  border: 1px solid var(--story-ui-border) !important;
  border-radius: 13px !important;
  background: var(--story-ui-surface) !important;
  color: var(--story-ui-text) !important;
  box-shadow: 0 8px 20px var(--story-ui-shadow) !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-media-thumb {
  overflow: hidden !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-add-media {
  font-size: 27px !important;
  font-weight: 300 !important;
  line-height: 1 !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-publish-direct {
  display: flex !important;
  min-width: 0 !important;
  height: 48px !important;
  flex: 1 1 auto !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 18px !important;
  border: 0 !important;
  border-radius: 14px !important;
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
  font-size: 13px !important;
  font-weight: 900 !important;
  white-space: nowrap !important;
  box-shadow: 0 10px 26px var(--story-ui-shadow) !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-publish-direct:disabled {
  opacity: .44 !important;
}

/* Popovers: respetan el ancho real del teléfono. */
.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-style-panel {
  top: max(82px, calc(env(safe-area-inset-top) + 68px)) !important;
  right: max(62px, calc(env(safe-area-inset-right) + 58px)) !important;
  left: max(10px, env(safe-area-inset-left)) !important;
  width: auto !important;
  max-width: 260px !important;
  max-height: min(58dvh, 430px) !important;
  overflow-y: auto !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-filter-panel {
  width: calc(100vw - 20px) !important;
  max-width: none !important;
  margin: 0 auto !important;
}

.alumni-story-creator-c[data-mobile-first="true"] .alumni-story-mention-menu {
  width: min(calc(100vw - 24px), 330px) !important;
  max-height: 42dvh !important;
  overflow-y: auto !important;
}

/* La edición de texto nunca sale del viewport. */
.alumni-story-creator-c[data-mobile-first="true"] textarea {
  max-width: 100% !important;
}

/* Cámara: zona de captura separada de la barra inferior.
   La cámara solo ocupa el canvas, no crea otra estructura responsive. */
.alumni-story-creator-c[data-mobile-first="true"][data-camera-active="true"] video {
  width: 100% !important;
  height: 100% !important;
}

/* ---------------------------------------------------------------
   VISOR — BASE MÓVIL
   --------------------------------------------------------------- */

.alumni-story-viewer[data-story-design="c-1-1"] {
  width: 100vw !important;
  height: 100dvh !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-stage-c {
  width: 100vw !important;
  max-width: none !important;
  height: 100dvh !important;
  max-height: none !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* En móvil la cabecera vive ENCIMA del medio.
   Se mantiene blanca para contraste; no se mezcla con el tema exterior. */
@media (max-width: 699px) {
  html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean,
  html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean,
  html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean p,
  html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean p,
  html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean button,
  html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean button {
    color: #fff !important;
    text-shadow: none !important;
  }

  html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div,
  html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div {
    background: rgba(255,255,255,.20) !important;
  }

  html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div > div,
  html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div > div {
    background: #fff !important;
  }

  /* No flechas desktop en teléfono. */
  .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Anterior"],
  .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Siguiente"] {
    display: none !important;
  }
}

/* ---------------------------------------------------------------
   DESKTOP — ADAPTACIÓN SECUNDARIA.
   No oculta, reordena ni sustituye controles móviles.
   --------------------------------------------------------------- */

@media (min-width: 700px) {
  .alumni-story-creator-c[data-mobile-first="true"] {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    background: var(--app-bg) !important;
  }

  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-stage {
    width: min(460px, calc(100vw - 32px)) !important;
    height: min(100dvh, 818px) !important;
    border: 1px solid var(--app-border) !important;
    border-radius: 24px !important;
    box-shadow: 0 28px 78px var(--app-shadow) !important;
  }

  .alumni-story-viewer[data-story-design="c-1-1"] {
    padding: 24px !important;
  }

  .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-stage-c {
    width: auto !important;
    height: min(760px, calc(100dvh - 48px)) !important;
    aspect-ratio: 9 / 16 !important;
    border: 1px solid var(--app-border) !important;
    border-radius: 26px !important;
    box-shadow: 0 28px 82px var(--app-shadow) !important;
  }
}

/* Pantallas muy angostas: aún más compacto, sin desaparecer nada. */
@media (max-width: 374px) {
  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-creator-tools {
    right: max(8px, env(safe-area-inset-right)) !important;
    gap: 7px !important;
  }

  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-tool-button {
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
  }

  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-bottom-actions {
    left: max(8px, env(safe-area-inset-left)) !important;
    right: max(8px, env(safe-area-inset-right)) !important;
    gap: 7px !important;
  }

  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-media-thumb,
  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-add-media {
    width: 43px !important;
    min-width: 43px !important;
  }

  .alumni-story-creator-c[data-mobile-first="true"] .alumni-story-publish-direct {
    padding-inline: 12px !important;
    font-size: 12px !important;
  }
}
`;

  console.log("✅ CSS mobile-first agregado");
}

/* ================================================================
   6) VALIDACIONES ESPECÍFICAS
   ================================================================ */

const requiredFragments = [
  "alumni-story-tool-button",
  'aria-label="Texto"',
  'aria-label="Mencionar persona"',
  'aria-label="Estilo"',
  'aria-label="Filtros"',
  "alumni-story-bottom-actions",
  "alumni-story-media-thumb",
  "alumni-story-add-media",
  "alumni-story-publish-direct",
  '? "Publicando..."',
  ': "Publicar"',
];

for (const fragment of requiredFragments) {
  if (!composer.includes(fragment)) {
    console.error(`❌ Validación: falta ${fragment}`);
    process.exit(1);
  }
}

/* Evita repetir el error del parche 1.4.4:
   Publicar NO puede estar dentro del rail lateral de herramientas. */
const toolsStart = composer.indexOf('className="alumni-story-creator-tools');
const toolsEnd = composer.indexOf("</div>", toolsStart);
const toolsBlock =
  toolsStart >= 0 && toolsEnd > toolsStart
    ? composer.slice(toolsStart, toolsEnd)
    : "";

if (
  toolsBlock.includes("publishStory") ||
  toolsBlock.includes("alumni-story-publish-direct")
) {
  console.error("❌ Validación: Publicar volvió a quedar dentro de herramientas laterales.");
  process.exit(1);
}

if (!css.includes("MOBILE FIRST: 360–430px")) {
  console.error("❌ Validación: no quedó aplicado el CSS mobile-first.");
  process.exit(1);
}

/* ================================================================
   7) GUARDADO SOLO DESPUÉS DE TODAS LAS VALIDACIONES
   ================================================================ */

fs.writeFileSync(composerFile, composer, "utf8");
fs.writeFileSync(storiesCssFile, css, "utf8");

console.log("");
console.log("✅ ALUMNI Stories 1.4.5 Mobile First Repair aplicado COMPLETO.");
console.log("✅ Herramientas restauradas.");
console.log("✅ Publicar volvió a la barra inferior.");
console.log("✅ Sin controles esenciales ocultos por responsive.");
console.log("✅ Layout base optimizado para 360–430 px.");
console.log("✅ Desktop queda como adaptación secundaria.");
console.log("");
console.log("Ahora ejecutá: npm run build");
