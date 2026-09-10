const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_STORIES_THEME_1_4_4B_CLEAN_PUBLISH_DUAL_THEME";

const files = {
  composer: path.join(ROOT, "src", "components", "stories", "StoryComposer.tsx"),
  viewer: path.join(ROOT, "src", "components", "stories", "StoryViewer.tsx"),
  theme: path.join(ROOT, "src", "components", "theme", "ThemeProvider.tsx"),
  native: path.join(ROOT, "src", "lib", "nativeExperience.ts"),
  globals: path.join(ROOT, "src", "app", "globals.css"),
  stories10: path.join(ROOT, "src", "app", "feed", "stories-visual-1-0.css"),
  stories11: path.join(ROOT, "src", "app", "feed", "stories-visual-1-1.css"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`❌ No encontré ${name}: ${file}`);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let composer = fs.readFileSync(files.composer, "utf8");
let viewer = fs.readFileSync(files.viewer, "utf8");
let theme = fs.readFileSync(files.theme, "utf8");
let native = fs.readFileSync(files.native, "utf8");
let globals = fs.readFileSync(files.globals, "utf8");
let stories10 = fs.readFileSync(files.stories10, "utf8");
let stories11 = fs.readFileSync(files.stories11, "utf8");

function requiredReplace(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(from, to);
}

function replaceIfPresent(source, from, to, label) {
  if (source.includes(from)) {
    console.log(`✅ ${label}`);
    return source.replace(from, to);
  }
  return source;
}

/* ================================================================
   A) SOLO DOS TEMAS OFICIALES: OSCURO / CLARO
   ================================================================ */

if (!theme.includes(MARKER)) {
  theme = theme.replace(
    /export type AlumniTheme =\s*\n\s*\| "dark"\s*\n\s*\| "light"\s*\n\s*\| "pride";/,
    `export type AlumniTheme =
  | "dark"
  | "light";`
  );

  theme = theme.replace(
    /\n  \{\n    id: "pride",[\s\S]*?\n  \},(?=\n\];)/,
    ""
  );

  if (
    !theme.includes('id: "dark"') ||
    !theme.includes('id: "light"')
  ) {
    console.error("❌ No pude validar los temas Oscuro/Claro.");
    process.exit(1);
  }

  if (theme.includes('id: "pride"')) {
    console.error("❌ Pride todavía quedó activo en ALUMNI_THEMES.");
    process.exit(1);
  }

  theme += `\n/* ${MARKER} */\n`;
  console.log("✅ Solo Oscuro y Claro quedan disponibles");
}

if (!native.includes(MARKER)) {
  native = native.replace(
    /\n\s*pride:\s*"#120b16",/,
    ""
  );
  native += `\n/* ${MARKER} */\n`;
  console.log("✅ Tema nativo reducido a Oscuro/Claro");
}

/* Quitamos únicamente las definiciones de temas que ya no son seleccionables.
   No tocamos el resto del sistema global. */
if (!globals.includes(MARKER)) {
  for (const legacy of [
    "chill",
    "pride",
    "midnight",
    "emerald",
    "executive",
  ]) {
    const re = new RegExp(
      `\\nhtml\\[data-theme="${legacy}"\\] \\{[\\s\\S]*?\\n\\}\\n`,
      "m"
    );
    globals = globals.replace(re, "\n");
  }

  globals = globals.replace(
    "la aplicación esté en Light o Chill.",
    "la aplicación esté en tema Claro."
  );

  globals += `

/* ${MARKER}
   Contrato oficial de tema de ALUMNI: únicamente dark / light. */
html[data-theme="dark"] { color-scheme: dark; }
html[data-theme="light"] { color-scheme: light; }
`;
  console.log("✅ CSS global limpiado de temas legacy");
}

/* ================================================================
   B) STORY COMPOSER — PUBLICAR DIRECTO, SIN MODAL
   ================================================================ */

if (!composer.includes(MARKER)) {
  /* Quitamos el estado del modal si todavía existe. */
  composer = composer.replace(
    /\n\s*\/\/ ALUMNI_STORIES_1_3_0_OPTION_C_COMPOSER\s*\n\s*const \[\s*storyReviewOpen,\s*setStoryReviewOpen,\s*\] = useState\(false\);\s*\n/,
    "\n"
  );

  /* Quitamos cualquier cierre/reset del modal que ya deja de existir. */
  composer = composer.replace(
    /\s*setStoryReviewOpen\(\s*false\s*\);/g,
    ""
  );

  /* El botón principal deja de ser Siguiente y publica directamente. */
  const standardPublishRegex =
    /              <button\n                type="button"\n                onClick=\{\(\) => \{[\s\S]*?setStoryReviewOpen\(true\);\n                \}\}\n                className="ml-auto flex h-\[52px\] min-w-\[146px\][^"]*"\n              >\n                Siguiente\n                <span className="text-\[22px\] font-medium leading-none">→<\/span>\n              <\/button>/;

  if (standardPublishRegex.test(composer)) {
    composer = composer.replace(
      standardPublishRegex,
      `              <button
                type="button"
                onClick={publishStory}
                disabled={publishing || !hasMedia}
                className="alumni-story-publish-direct ml-auto flex h-[52px] min-w-[146px] items-center justify-center rounded-[16px] bg-[#6d7cff] px-6 text-[14px] font-black text-white shadow-[0_12px_34px_rgba(0,0,0,.20)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {publishing
                  ? "Publicando..."
                  : "Publicar"}
              </button>`
    );
    console.log("✅ Siguiente reemplazado por Publicar directo");
  } else if (!composer.includes("alumni-story-publish-direct")) {
    console.error("❌ No encontré el botón Siguiente actual.");
    process.exit(1);
  }

  /* Eliminamos completamente el modal de revisión. */
  const reviewRegex =
    /\n\s*\{storyReviewOpen && \([\s\S]*?\n\s*\)\}\n(?=\s*<HiddenInput)/;

  if (reviewRegex.test(composer)) {
    composer = composer.replace(reviewRegex, "\n");
    console.log("✅ Modal final de publicación eliminado");
  } else if (composer.includes("storyReviewOpen")) {
    console.error("❌ Quedó una referencia al modal storyReviewOpen.");
    process.exit(1);
  }

  /* Botón de publicar del editor legado: también solo texto. */
  const legacyPublishContent = `                {publishing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Send
                    size={15}
                  />
                )}

                {publishing
                  ? "Publicando..."
                  : "Publicar historia"}`;

  if (composer.includes(legacyPublishContent)) {
    composer = composer.replace(
      legacyPublishContent,
      `                {publishing
                  ? "Publicando..."
                  : "Publicar"}`
    );
    console.log("✅ Publicar sin icono en editor legado");
  }

  /* Send ya no debe usarse para publicar. */
  if (!composer.includes("<Send")) {
    composer = composer.replace(
      /\n\s*Send,\n/,
      "\n"
    );
  }

  /* ==============================================================
     C) CLASES TEMÁTICAS DEL CREADOR
     ============================================================== */

  composer = replaceIfPresent(
    composer,
    `className="fixed inset-0 z-[2147483000] overflow-hidden bg-black text-white"`,
    `className="alumni-story-creator-c fixed inset-0 z-[2147483000] overflow-hidden bg-black text-white"`,
    "Clase temática del creador fullscreen"
  );

  composer = replaceIfPresent(
    composer,
    `className="relative mx-auto h-[100dvh] w-full max-w-[460px] overflow-hidden bg-[#07090d] sm:border-x sm:border-white/[0.05]"`,
    `className="alumni-story-creator-stage relative mx-auto h-[100dvh] w-full max-w-[460px] overflow-hidden bg-[#07090d] sm:border-x sm:border-white/[0.05]"`,
    "Stage del creador marcado"
  );

  composer = replaceIfPresent(
    composer,
    `className="pointer-events-auto select-none text-[17px] font-black tracking-[-0.045em] text-white [text-shadow:none]"`,
    `className="alumni-story-creator-brand pointer-events-auto select-none text-[17px] font-black tracking-[-0.045em] text-white [text-shadow:none]"`,
    "Marca Alumni temática"
  );

  composer = replaceIfPresent(
    composer,
    `className="absolute left-[max(16px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white transition active:scale-95 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,.35))]"`,
    `className="alumni-story-creator-close absolute left-[max(16px,env(safe-area-inset-left))] top-[max(14px,env(safe-area-inset-top))] z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-white transition active:scale-95 [filter:drop-shadow(0_1px_4px_rgba(0,0,0,.35))]"`,
    "Cerrar creador marcado"
  );

  composer = replaceIfPresent(
    composer,
    `className="absolute right-[max(16px,env(safe-area-inset-right))] top-[38%] z-[88] flex -translate-y-1/2 flex-col gap-3"`,
    `className="alumni-story-creator-tools absolute right-[max(16px,env(safe-area-inset-right))] top-[38%] z-[88] flex -translate-y-1/2 flex-col gap-3"`,
    "Herramientas flotantes marcadas"
  );

  composer = replaceIfPresent(
    composer,
    `className="absolute left-1/2 top-[calc(100%+12px)] w-[min(88vw,330px)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#0b0f17]/94 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl"`,
    `className="alumni-story-mention-menu absolute left-1/2 top-[calc(100%+12px)] w-[min(88vw,330px)] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#0b0f17]/94 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl"`,
    "Menú de menciones marcado"
  );

  composer = replaceIfPresent(
    composer,
    `className="absolute right-[70px] top-[max(58px,calc(env(safe-area-inset-top)+46px))] z-[94] w-[218px] overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#0b0f17]/92 p-3 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl"`,
    `className="alumni-story-style-panel absolute right-[70px] top-[max(58px,calc(env(safe-area-inset-top)+46px))] z-[94] w-[218px] overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#0b0f17]/92 p-3 shadow-[0_24px_70px_rgba(0,0,0,.50)] backdrop-blur-2xl"`,
    "Panel de estilo marcado"
  );

  composer = replaceIfPresent(
    composer,
    `className="mx-auto flex max-w-[520px] gap-2 overflow-x-auto rounded-[24px] border border-white/[0.11] bg-[#0b0f17]/90 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-2xl"`,
    `className="alumni-story-filter-panel mx-auto flex max-w-[520px] gap-2 overflow-x-auto rounded-[24px] border border-white/[0.11] bg-[#0b0f17]/90 p-2.5 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-2xl"`,
    "Panel de filtros marcado"
  );

  composer = replaceIfPresent(
    composer,
    `className="absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-[100] flex items-end gap-3"`,
    `className="alumni-story-bottom-actions absolute bottom-[max(18px,env(safe-area-inset-bottom))] left-[max(16px,env(safe-area-inset-left))] right-[max(16px,env(safe-area-inset-right))] z-[100] flex items-end gap-3"`,
    "Barra inferior marcada"
  );

  /* Shell de Logros/Oportunidades: si existe el bloqueo dark, lo liberamos. */
  composer = composer.replace(
    `data-theme-lock="dark"\n      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-5"`,
    `data-story-theme="adaptive"
      className="alumni-story-studio-shell fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-5"`
  );

  composer = composer.replace(
    `className="relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]"`,
    `className="alumni-story-studio-shell-panel relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]"`
  );

  composer += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   D) STORY VIEWER — YA NO BLOQUEADO A DARK
   ================================================================ */

if (!viewer.includes(MARKER)) {
  if (viewer.includes('data-theme-lock="dark"')) {
    viewer = viewer.replace(
      'data-theme-lock="dark"',
      'data-story-theme="adaptive"'
    );
    console.log("✅ Visor liberado del bloqueo Dark");
  }

  viewer = viewer.replace(
    `className={\`alumni-story-viewer fixed inset-0`,
    `className={\`alumni-story-viewer alumni-story-viewer-adaptive fixed inset-0`
  );

  viewer += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   E) RAIL DE STORIES — SIN FONDO CLARO FORZADO
   ================================================================ */

if (!stories10.includes(MARKER)) {
  stories10 = stories10.replace(
    `  background:
    linear-gradient(180deg, rgba(249,250,251,.98), rgba(255,255,255,1));`,
    `  background: var(--app-surface);`
  );

  stories10 = stories10.replace(
    `  background: linear-gradient(145deg, rgba(37,99,235,.18), rgba(15,23,42,.06));`,
    `  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--app-accent) 18%, var(--app-surface)),
      var(--app-surface-2)
    );`
  );

  stories10 = stories10.replace(
    `  background: linear-gradient(145deg, rgba(148,163,184,.34), rgba(203,213,225,.4));`,
    `  background:
    linear-gradient(
      145deg,
      var(--app-soft-strong),
      var(--app-surface-2)
    );`
  );

  stories10 += `\n/* ${MARKER} */\n`;
  console.log("✅ Rail de Stories convertido a variables de tema");
}

/* ================================================================
   F) CAPA FINAL DE TEMA PARA TODO STORIES
   Se agrega al CSS que se importa al final para ganar especificidad.
   ================================================================ */

if (!stories11.includes(MARKER)) {
  stories11 += `

/* ================================================================
   ${MARKER}
   DARK/LIGHT CONTRACT — STORIES COMPLETO
   ================================================================ */

/* ---------- Rail / fuera del visor ---------- */
html[data-theme="dark"] .alumni-feed-page .alumni-stories-section[data-stories-design="c"],
html[data-theme="light"] .alumni-feed-page .alumni-stories-section[data-stories-design="c"] {
  background: var(--app-surface) !important;
  color: var(--app-text) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="dark"] .alumni-feed-page .alumni-story-compact-label,
html[data-theme="light"] .alumni-feed-page .alumni-story-compact-label {
  color: var(--app-text-soft) !important;
}

html[data-theme="dark"] .alumni-feed-page .alumni-story-compact-avatar,
html[data-theme="light"] .alumni-feed-page .alumni-story-compact-avatar {
  background: var(--app-surface-2) !important;
  color: var(--app-text) !important;
}

/* ---------- Creator fullscreen ---------- */
html[data-theme="dark"] .alumni-story-creator-c {
  --story-ui-surface: rgba(5,7,11,.72);
  --story-ui-surface-strong: rgba(5,7,11,.90);
  --story-ui-border: rgba(255,255,255,.13);
  --story-ui-text: #ffffff;
  --story-ui-muted: rgba(255,255,255,.58);
  --story-ui-shadow: rgba(0,0,0,.30);
  background: #05070b !important;
  color: #fff !important;
}

html[data-theme="light"] .alumni-story-creator-c {
  --story-ui-surface: rgba(255,255,255,.86);
  --story-ui-surface-strong: rgba(255,255,255,.96);
  --story-ui-border: rgba(15,23,42,.12);
  --story-ui-text: #10141b;
  --story-ui-muted: rgba(39,48,60,.64);
  --story-ui-shadow: rgba(15,23,42,.13);
  background: var(--app-bg) !important;
  color: var(--app-text) !important;
}

html[data-theme="dark"] .alumni-story-creator-stage {
  background: #07090d !important;
  border-color: rgba(255,255,255,.05) !important;
}

html[data-theme="light"] .alumni-story-creator-stage {
  background: var(--app-bg-2) !important;
  border-color: var(--app-border) !important;
}

.alumni-story-creator-c .alumni-story-creator-brand,
.alumni-story-creator-c .alumni-story-creator-close {
  color: var(--story-ui-text) !important;
}

html[data-theme="light"] .alumni-story-creator-c .alumni-story-creator-brand,
html[data-theme="light"] .alumni-story-creator-c .alumni-story-creator-close {
  filter: drop-shadow(0 1px 5px rgba(255,255,255,.55)) !important;
}

/* Herramientas flotantes y popovers: no mezclar negro con tema claro. */
.alumni-story-creator-c .alumni-story-creator-tools button,
.alumni-story-creator-c .alumni-story-style-panel,
.alumni-story-creator-c .alumni-story-filter-panel,
.alumni-story-creator-c .alumni-story-mention-menu {
  border-color: var(--story-ui-border) !important;
  background: var(--story-ui-surface-strong) !important;
  color: var(--story-ui-text) !important;
  box-shadow: 0 14px 38px var(--story-ui-shadow) !important;
}

.alumni-story-creator-c .alumni-story-style-panel p,
.alumni-story-creator-c .alumni-story-filter-panel button,
.alumni-story-creator-c .alumni-story-mention-menu p,
.alumni-story-creator-c .alumni-story-mention-menu span {
  color: var(--story-ui-muted);
}

/* Opciones seleccionadas conservan el acento Alumni. */
.alumni-story-creator-c .alumni-story-creator-tools button[class*="bg-[#6d7cff]"],
.alumni-story-creator-c .alumni-story-style-panel button[class*="bg-[#6d7cff]"],
.alumni-story-creator-c .alumni-story-filter-panel button[class*="bg-[#6d7cff]"] {
  background: var(--app-accent-soft) !important;
  border-color: color-mix(in srgb, var(--app-accent) 42%, var(--story-ui-border)) !important;
  color: var(--app-accent) !important;
}

/* Barra inferior */
.alumni-story-creator-c .alumni-story-bottom-actions > button:not(.alumni-story-publish-direct) {
  border-color: var(--story-ui-border) !important;
  background: var(--story-ui-surface) !important;
  color: var(--story-ui-text) !important;
  box-shadow: 0 10px 28px var(--story-ui-shadow) !important;
}

.alumni-story-creator-c .alumni-story-publish-direct {
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
}

/* ---------- Studio Logros / Oportunidades ---------- */
html[data-theme="dark"] .alumni-story-studio-shell {
  background: rgba(0,0,0,.90) !important;
}

html[data-theme="light"] .alumni-story-studio-shell {
  background: rgba(238,241,246,.94) !important;
}

html[data-theme="dark"] .alumni-story-studio-shell-panel,
html[data-theme="light"] .alumni-story-studio-shell-panel {
  background: var(--app-surface) !important;
  color: var(--app-text) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="light"] .alumni-story-studio-shell-panel [class*="bg-[#0b0e13]"],
html[data-theme="light"] .alumni-story-studio-shell-panel [class*="bg-white/[0.025]"],
html[data-theme="light"] .alumni-story-studio-shell-panel [class*="bg-white/[0.03]"],
html[data-theme="light"] .alumni-story-studio-shell-panel [class*="bg-white/[0.05]"] {
  background: var(--app-surface) !important;
}

html[data-theme="light"] .alumni-story-studio-shell-panel [class*="border-white"] {
  border-color: var(--app-border) !important;
}

html[data-theme="light"] .alumni-story-studio-shell-panel .text-white,
html[data-theme="light"] .alumni-story-studio-shell-panel [class*="text-white"] {
  color: var(--app-text) !important;
}

/* Preview multimedia del Studio conserva controles con contraste propio. */
.alumni-story-studio-shell-panel [class*="bg-black/"] {
  color: #fff !important;
}

/* ---------- Viewer ---------- */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] {
  background:
    radial-gradient(circle at 16% 18%, rgba(112,88,255,.16), transparent 34%),
    #05070b !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] {
  background:
    radial-gradient(circle at 16% 18%, rgba(82,103,232,.08), transparent 34%),
    var(--app-bg) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-stage-c {
  background: #05070b !important;
  border-color: rgba(255,255,255,.10) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-stage-c {
  background: var(--app-surface) !important;
  border-color: var(--app-border) !important;
  box-shadow: 0 28px 78px rgba(15,23,42,.13) !important;
}

/* El propietario queda SIN banda, blur o sombra en ambos temas. */
.alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean,
.alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:nth-of-type(2) {
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  box-shadow: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Texto/acciones de cabecera por tema. */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean {
  color: #fff !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean {
  color: #10141b !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean p,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean button {
  color: #fff !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean p,
html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-owner-clean button {
  color: #10141b !important;
}

/* Progress: dark = claro; light = tinta oscura. */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div {
  background: rgba(255,255,255,.22) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div {
  background: rgba(15,23,42,.18) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div > div {
  background: #fff !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-chrome-top:first-child > div > div > div {
  background: #10141b !important;
}

/* Reply / reacciones */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-editor,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reaction {
  border-color: rgba(255,255,255,.14) !important;
  background: rgba(14,16,22,.82) !important;
  color: #fff !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-editor,
html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reaction {
  border-color: rgba(15,23,42,.12) !important;
  background: rgba(255,255,255,.92) !important;
  color: #10141b !important;
  box-shadow: 0 12px 30px rgba(15,23,42,.12) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-input {
  color: #fff !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-input {
  color: #10141b !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-input::placeholder {
  color: rgba(255,255,255,.48) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-input::placeholder {
  color: rgba(39,48,60,.52) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-send,
html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-reply-send {
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
}

/* Tarjeta C: dark realmente dark; light realmente light. */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-card {
  --story-c-ink: var(--app-text);
  --story-c-muted: var(--app-muted);
  --story-c-paper: rgba(16,19,24,.96);
  border-color: rgba(255,255,255,.09) !important;
  box-shadow: 0 18px 52px rgba(0,0,0,.32) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-title,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-copy,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-kicker {
  color: var(--app-text) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-quick,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-owner-stat {
  background: var(--app-surface-2) !important;
  border-color: var(--app-border) !important;
  color: var(--app-text-soft) !important;
}

html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-owner-stat strong,
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-owner-stat span {
  color: var(--app-text) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-card {
  --story-c-ink: var(--app-text);
  --story-c-muted: var(--app-muted);
  --story-c-paper: rgba(255,255,255,.98);
  border-color: var(--app-border) !important;
  box-shadow: 0 18px 52px rgba(15,23,42,.13) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-quick,
html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] .alumni-story-c-owner-stat {
  background: #f4f6fa !important;
  border-color: var(--app-border) !important;
  color: var(--app-text-soft) !important;
}

/* Desktop arrows */
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Anterior"],
html[data-theme="dark"] .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Siguiente"] {
  background: rgba(8,10,14,.55) !important;
  color: #fff !important;
  border-color: rgba(255,255,255,.10) !important;
}

html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Anterior"],
html[data-theme="light"] .alumni-story-viewer[data-story-design="c-1-1"] button[aria-label="Siguiente"] {
  background: rgba(255,255,255,.92) !important;
  color: #10141b !important;
  border-color: rgba(15,23,42,.10) !important;
}

/* En móvil no dejamos transiciones de tema que produzcan flash oscuro/claro. */
.alumni-story-creator-c,
.alumni-story-viewer[data-story-design="c-1-1"],
.alumni-story-studio-shell,
.alumni-story-studio-shell-panel {
  transition:
    background-color .16s ease,
    border-color .16s ease,
    color .16s ease;
}
`;
  console.log("✅ Contrato visual Claro/Oscuro agregado a todo Stories");
}

/* ================================================================
   VALIDACIONES ANTES DE GUARDAR
   ================================================================ */

if (composer.includes("storyReviewOpen")) {
  console.error("❌ Validación: storyReviewOpen todavía existe.");
  process.exit(1);
}

if (!composer.includes("alumni-story-publish-direct")) {
  console.error("❌ Validación: no encontré el botón Publicar directo.");
  process.exit(1);
}

if (
  !composer.includes(
    'publishing\n                  ? "Publicando..."\n                  : "Publicar"'
  )
) {
  console.error("❌ Validación: el CTA final no quedó como Publicar.");
  process.exit(1);
}

if (composer.includes(">→<") || composer.includes("Siguiente\n")) {
  console.error("❌ Validación: todavía quedó el CTA Siguiente.");
  process.exit(1);
}

if (viewer.includes('data-theme-lock="dark"')) {
  console.error("❌ Validación: StoryViewer sigue bloqueado a dark.");
  process.exit(1);
}

if (theme.includes('id: "pride"')) {
  console.error("❌ Validación: Pride sigue disponible.");
  process.exit(1);
}

/* ================================================================
   GUARDADO AL FINAL
   ================================================================ */

fs.writeFileSync(files.composer, composer, "utf8");
fs.writeFileSync(files.viewer, viewer, "utf8");
fs.writeFileSync(files.theme, theme, "utf8");
fs.writeFileSync(files.native, native, "utf8");
fs.writeFileSync(files.globals, globals, "utf8");
fs.writeFileSync(files.stories10, stories10, "utf8");
fs.writeFileSync(files.stories11, stories11, "utf8");

console.log("");
console.log("✅ ALUMNI Stories/Theme 1.4.4B aplicado COMPLETO.");
console.log("✅ Sin modal final de publicación.");
console.log("✅ CTA final: Publicar.");
console.log("✅ CTA directo Publicar validado sin exigir borrar iconos de otros flujos.");
console.log("✅ Solo temas Oscuro y Claro.");
console.log("✅ Rail, creador, herramientas, paneles y visor revisados.");
console.log("✅ Sin bloqueo Dark dentro del visor.");
console.log("✅ Cabecera del propietario permanece sin sombreado.");
console.log("");
console.log("Ahora ejecutá: npm run build");
