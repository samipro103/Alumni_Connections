const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_THEME_1_4_3_DARK_LIGHT_FEED_STORIES";

const files = {
  theme: path.join(ROOT, "src", "components", "theme", "ThemeProvider.tsx"),
  native: path.join(ROOT, "src", "lib", "nativeExperience.ts"),
  globals: path.join(ROOT, "src", "app", "globals.css"),
  composer: path.join(ROOT, "src", "components", "stories", "StoryComposer.tsx"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`❌ No encontré ${name}: ${file}`);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let theme = fs.readFileSync(files.theme, "utf8");
let native = fs.readFileSync(files.native, "utf8");
let globals = fs.readFileSync(files.globals, "utf8");
let composer = fs.readFileSync(files.composer, "utf8");

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(from, to);
}

function regexRequired(source, regex, to, label) {
  if (!regex.test(source)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  console.log(`✅ ${label}`);
  return source.replace(regex, to);
}

/* ================================================================
   1) SOLO DOS TEMAS OFICIALES: DARK + LIGHT
   ================================================================ */

if (!theme.includes(MARKER)) {
  theme = regexRequired(
    theme,
    /export type AlumniTheme =\s*\n\s*\| "dark"\s*\n\s*\| "light"\s*\n\s*\| "pride";/,
    `export type AlumniTheme =
  | "dark"
  | "light";`,
    "ThemeProvider limitado a Oscuro y Claro"
  );

  theme = regexRequired(
    theme,
    /\n  \{\n    id: "pride",[\s\S]*?\n  \},(?=\n\];)/,
    "",
    "Pride retirado del selector de temas"
  );

  theme = theme.replace(
    "/* ALUMNI_1_4_2_THREE_THEMES */",
    `/* ${MARKER} */`
  );

  if (!theme.includes(MARKER)) {
    theme += `\n/* ${MARKER} */\n`;
  }
}

/* ================================================================
   2) TEMA NATIVO: SOLO DARK + LIGHT
   ================================================================ */

if (!native.includes(MARKER)) {
  native = native.replace(
    /\n\s*pride:\s*"#120b16",/,
    ""
  );

  native += `\n/* ${MARKER} */\n`;
  console.log("✅ Colores nativos reducidos a Oscuro y Claro");
}

/* ================================================================
   3) LIMPIEZA DE TEMAS LEGACY EN GLOBALS.CSS
   ================================================================ */

if (!globals.includes(MARKER)) {
  const legacyThemes = [
    "chill",
    "pride",
    "midnight",
    "emerald",
    "executive",
  ];

  for (const legacy of legacyThemes) {
    const regex = new RegExp(
      `\\nhtml\\[data-theme="${legacy}"\\] \\{[\\s\\S]*?\\n\\}\\n`,
      "m"
    );

    if (regex.test(globals)) {
      globals = globals.replace(regex, "\n");
      console.log(`✅ Tema legacy eliminado de CSS: ${legacy}`);
    }
  }

  globals = globals.replace(
    "la aplicación esté en Light o Chill.",
    "la aplicación esté en tema Claro."
  );

  const dualThemeCss = `

/* ================================================================
   ${MARKER}
   Contrato visual oficial: Oscuro + Claro.
   Feed y rail de Stories usan variables globales.
   El visor multimedia de Stories permanece oscuro por contraste.
   ================================================================ */

html[data-theme="dark"],
html[data-theme="light"] {
  color-scheme: light dark;
}

html[data-theme="dark"] {
  color-scheme: dark;
}

html[data-theme="light"] {
  color-scheme: light;
}

/* ---------- FEED ---------- */
html[data-theme="dark"] .alumni-feed-page,
html[data-theme="light"] .alumni-feed-page {
  color: var(--app-text);
  background: var(--app-surface) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="dark"] .alumni-feed-page .alumni-pro-feed-list,
html[data-theme="light"] .alumni-feed-page .alumni-pro-feed-list,
html[data-theme="dark"] .alumni-feed-page .alumni-stories-section,
html[data-theme="light"] .alumni-feed-page .alumni-stories-section,
html[data-theme="dark"] .alumni-feed-page .alumni-pro-composer,
html[data-theme="light"] .alumni-feed-page .alumni-pro-composer,
html[data-theme="dark"] .alumni-feed-page .alumni-pro-feed-tabs,
html[data-theme="light"] .alumni-feed-page .alumni-pro-feed-tabs {
  color: var(--app-text);
  background: var(--app-surface) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="light"] .alumni-feed-page .alumni-pro-post {
  color: var(--app-text);
}

html[data-theme="light"] .alumni-feed-page .alumni-pro-caption,
html[data-theme="light"] .alumni-feed-page .alumni-pro-author a,
html[data-theme="light"] .alumni-feed-page .alumni-link-preview-copy strong {
  color: var(--app-text-soft) !important;
}

html[data-theme="light"] .alumni-feed-page .alumni-pro-media-shell,
html[data-theme="light"] .alumni-feed-page .alumni-pro-image-button {
  background: var(--app-bg-2) !important;
}

html[data-theme="dark"] .alumni-feed-page .alumni-pro-media-shell,
html[data-theme="dark"] .alumni-feed-page .alumni-pro-image-button {
  background: #05070b !important;
}

/* Los badges y controles que viven ENCIMA de foto/video conservan contraste. */
.alumni-feed-page .alumni-pro-composer-preview > button,
.alumni-feed-page .alumni-pro-composer-video-badge,
.alumni-feed-page .alumni-pro-composer-order,
.alumni-feed-page .alumni-feed-video-mute {
  color: #fff !important;
}

/* ---------- STORIES RAIL ---------- */
html[data-theme="dark"] .alumni-stories-section,
html[data-theme="light"] .alumni-stories-section {
  color: var(--app-text);
}

html[data-theme="light"] .alumni-story-compact-ring-unseen,
html[data-theme="light"] .alumni-story-compact-ring-viewed,
html[data-theme="light"] .alumni-story-compact-ring-empty,
html[data-theme="light"] .alumni-story-compact-avatar {
  background: var(--app-surface) !important;
  border-color: var(--app-border) !important;
}

/* ---------- STORIES COMPOSER ---------- */
html[data-theme="dark"] .alumni-story-composer-modal {
  color: var(--app-text);
  background: rgba(0,0,0,.90) !important;
}

html[data-theme="light"] .alumni-story-composer-modal {
  color: var(--app-text);
  background: rgba(238,241,246,.94) !important;
}

html[data-theme="dark"] .alumni-story-composer-panel,
html[data-theme="light"] .alumni-story-composer-panel {
  color: var(--app-text);
  background: var(--app-surface) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="light"] .alumni-story-composer-panel {
  box-shadow: 0 24px 72px rgba(15,23,42,.14) !important;
}

/*
 * El canvas/foto/video del editor puede seguir oscuro:
 * es contenido multimedia, no una superficie de navegación.
 * Los controles alrededor sí heredan el tema Claro/Oscuro.
 */
html[data-theme="light"] .alumni-story-composer-modal input,
html[data-theme="light"] .alumni-story-composer-modal textarea,
html[data-theme="light"] .alumni-story-composer-modal select {
  color: var(--app-text) !important;
  border-color: var(--app-border) !important;
}

html[data-theme="light"] .alumni-story-composer-modal input::placeholder,
html[data-theme="light"] .alumni-story-composer-modal textarea::placeholder {
  color: var(--app-muted) !important;
}

/* ---------- ACCESIBILIDAD / TRANSICIÓN ---------- */
.alumni-feed-page,
.alumni-stories-section,
.alumni-story-composer-panel {
  transition:
    background-color .18s ease,
    border-color .18s ease,
    color .18s ease;
}
`;

  globals += dualThemeCss;
  console.log("✅ Contrato visual Dark/Light agregado para Feed + Stories");
}

/* ================================================================
   4) STORY COMPOSER: DEJAR DE FORZAR DARK
   ================================================================ */

if (!composer.includes(MARKER)) {
  if (composer.includes('data-theme-lock="dark"')) {
    composer = composer.replace(
      'data-theme-lock="dark"',
      'data-story-theme="adaptive"'
    );
    console.log("✅ Creador de Stories ya respeta Claro/Oscuro");
  } else if (!composer.includes('data-story-theme="adaptive"')) {
    console.error("❌ No encontré el bloqueo de tema del StoryComposer.");
    process.exit(1);
  }

  if (
    !composer.includes(
      'className="alumni-story-composer-modal fixed inset-0 z-[100]'
    )
  ) {
    composer = replaceRequired(
      composer,
      'className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-5"',
      'className="alumni-story-composer-modal fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-0 backdrop-blur-xl sm:p-5"',
      "Clase temática agregada al modal de Stories"
    );
  }

  if (
    !composer.includes(
      'className="alumni-story-composer-panel relative flex h-[100dvh]'
    )
  ) {
    composer = replaceRequired(
      composer,
      'className="relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]"',
      'className="alumni-story-composer-panel relative flex h-[100dvh] w-full max-w-[980px] flex-col overflow-hidden bg-[#0b0e13] shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:h-[calc(100dvh-40px)] sm:rounded-[30px] sm:border sm:border-white/[0.09]"',
      "Clase temática agregada al panel de Stories"
    );
  }

  composer += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   GUARDAR
   ================================================================ */

fs.writeFileSync(files.theme, theme, "utf8");
fs.writeFileSync(files.native, native, "utf8");
fs.writeFileSync(files.globals, globals, "utf8");
fs.writeFileSync(files.composer, composer, "utf8");

console.log("");
console.log("✅ ALUMNI Theme 1.4.3 aplicado.");
console.log("✅ Solo quedan disponibles Oscuro y Claro.");
console.log("✅ Feed reforzado para ambos temas.");
console.log("✅ Rail y creador de Stories reforzados para ambos temas.");
console.log("✅ Visor multimedia de Stories permanece oscuro por contraste.");
console.log("✅ Temas legacy eliminados del CSS principal.");
console.log("");
console.log("Ahora ejecutá: npm run build");
