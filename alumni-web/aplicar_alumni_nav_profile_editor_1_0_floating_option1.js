const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_NAV_PROFILE_EDITOR_1_0_FLOATING_OPTION1";

const paths = {
  mobileNav: "src/components/layout/MobileNav.tsx",
  settingsPage: "src/app/settings/page.tsx",
  editCss: "src/app/settings/settings-edit-profile-option-1.css",
};

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  const file = abs(rel);
  if (!fs.existsSync(file)) {
    fail(`No encontré ${rel}. Ejecutá este parche desde alumni-web.`);
  }
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function backup(rel) {
  const file = abs(rel);
  const bak = file + ".before-nav-profile-editor-1.0.bak";
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
  }
}

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) {
    return source;
  }
  if (!source.includes(before)) {
    fail(`No encontré el bloque esperado: ${label}. No escribí ningún archivo.`);
  }
  return source.replace(before, after);
}

let nav = read(paths.mobileNav);
let page = read(paths.settingsPage);

if (nav.includes(MARKER) && page.includes(MARKER) && fs.existsSync(abs(paths.editCss))) {
  console.log("✅ Navbar + Editar perfil 1.0 ya estaba aplicado.");
  process.exit(0);
}

if (!nav.includes("ALUMNI_MORE_2_0_LISTA_LIMPIA")) {
  fail("Este parche espera que ALUMNI Más 2.0 ya esté aplicado en MobileNav.");
}

if (!page.includes("ALUMNI_SETTINGS_2_0_INTERIORES_LIMPIOS")) {
  fail("Este parche espera que ALUMNI Settings 2.0 ya esté aplicado.");
}

/* =========================================================
   1. FLOATING MOBILE NAV
   ========================================================= */

const oldNavOpen = `<nav
      data-alumni-mobile-nav="true"
      data-nav-design="clean-four"
      className="alumni-mobile-nav-clean fixed inset-x-0 bottom-0 z-[2147482000] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md [backface-visibility:hidden] [transform:translateZ(0)] lg:hidden"
    >`;

const newNavOpen = `<nav
      data-alumni-mobile-nav="true"
      data-nav-design="clean-four"
      style={{
        bottom: "max(10px, env(safe-area-inset-bottom))",
      }}
      className="alumni-mobile-nav-clean fixed left-1/2 z-[2147482000] w-[calc(100%-16px)] max-w-[430px] -translate-x-1/2 rounded-[24px] border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_97%,transparent)] px-2 py-1.5 shadow-[0_16px_42px_var(--app-shadow)] backdrop-blur-xl [backface-visibility:hidden] lg:hidden"
    >`;

nav = replaceRequired(
  nav,
  oldNavOpen,
  newNavOpen,
  "wrapper de MobileNav"
);

nav = replaceRequired(
  nav,
  '<div className="mx-auto grid max-w-lg grid-cols-4">',
  '<div className="grid w-full grid-cols-4">',
  "grid interna de MobileNav"
);

nav = nav.replace(
  'className="alumni-mobile-nav-item flex min-h-12 flex-col items-center justify-center gap-1"',
  'className="alumni-mobile-nav-item flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[18px]"'
);

nav += `\n/* ${MARKER} */\n`;

/* =========================================================
   2. IMPORT FINAL CSS FOR EDIT PROFILE OPTION 1
   ========================================================= */

if (!page.includes('import "./settings-edit-profile-option-1.css";')) {
  page = replaceRequired(
    page,
    'import "./settings-clean-2-0.css";',
    'import "./settings-clean-2-0.css";\nimport "./settings-edit-profile-option-1.css";',
    "import de settings-edit-profile-option-1.css"
  );
}

page += `\n/* ${MARKER} */\n`;

/* =========================================================
   3. CSS: EDIT PROFILE OPTION 1 + NAV FLOAT
   ========================================================= */

const css = `/*
 * ${MARKER}
 * Navbar flotante + Editar perfil Opción 1.
 * Mobile-first.
 */

/* ======================================================
   FLOATING BOTTOM NAV
   ====================================================== */

.alumni-mobile-nav-clean {
  border-color: var(--app-border) !important;
  background: color-mix(in srgb, var(--app-surface) 97%, transparent) !important;
  box-shadow:
    0 18px 42px color-mix(in srgb, var(--app-shadow) 42%, transparent),
    0 0 0 1px color-mix(in srgb, var(--app-border) 78%, transparent) !important;
  overflow: hidden;
}

.alumni-mobile-nav-clean .alumni-mobile-nav-item {
  color: var(--app-muted-2);
  transition: background-color .14s ease, color .14s ease, transform .12s ease;
}

.alumni-mobile-nav-clean .alumni-mobile-nav-item[data-active="true"] {
  color: var(--app-accent);
}

.alumni-mobile-nav-clean .alumni-mobile-nav-item[data-active="true"] .alumni-mobile-nav-icon {
  background: color-mix(in srgb, var(--app-accent-soft) 78%, transparent);
  color: var(--app-accent);
}

.alumni-mobile-nav-clean .alumni-mobile-nav-icon {
  width: 42px;
  height: 30px;
  border-radius: 999px;
  transition: background-color .15s ease, color .15s ease, transform .12s ease;
}

.alumni-mobile-nav-clean .alumni-mobile-nav-item:active {
  transform: scale(.98);
}

.alumni-mobile-nav-clean .alumni-mobile-nav-item:active .alumni-mobile-nav-icon {
  transform: scale(.96);
}

.alumni-mobile-nav-clean .alumni-mobile-nav-label {
  font-size: 10px;
  font-weight: 650;
}

@media (max-width: 374px) {
  .alumni-mobile-nav-clean {
    max-width: calc(100vw - 12px) !important;
  }
}

/* ======================================================
   EDIT PROFILE — OPTION 1 / CLEAN CLASSIC
   ====================================================== */

.alumni-profile-editor {
  padding-bottom: 28px;
  color: var(--app-text);
}

.alumni-profile-editor-top {
  position: sticky;
  top: 0;
  z-index: 28;
  min-height: 58px !important;
  margin: 0 !important;
  padding: 8px 2px !important;
  border-bottom: 1px solid var(--app-border) !important;
  background: color-mix(in srgb, var(--app-bg) 96%, transparent) !important;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.alumni-profile-editor-top h1,
.alumni-profile-editor-top h2,
.alumni-profile-editor-top [data-title] {
  color: var(--app-text) !important;
  font-size: 16px !important;
  font-weight: 900 !important;
  letter-spacing: -.025em;
}

.alumni-profile-editor-top > button:first-child,
.alumni-profile-editor-top a:first-child {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: var(--app-text) !important;
}

.alumni-profile-editor-save {
  width: auto !important;
  min-width: 82px !important;
  min-height: 34px !important;
  padding: 0 14px !important;
  border-radius: 999px !important;
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
  font-size: 11px !important;
  font-weight: 900 !important;
  box-shadow: none !important;
}

.alumni-profile-editor-save svg {
  display: none !important;
}

.alumni-profile-editor-save span {
  display: inline !important;
}

.alumni-profile-editor-media {
  margin-top: 12px !important;
}

.alumni-profile-editor-banner {
  position: relative;
  overflow: hidden;
  min-height: 148px;
  border: 1px solid var(--app-border) !important;
  border-radius: 20px !important;
  background: var(--app-surface-2);
  box-shadow: none !important;
}

.alumni-profile-editor-banner::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.16), rgba(0,0,0,.02) 42%, transparent 70%);
  pointer-events: none;
}

.alumni-profile-editor-banner button,
.alumni-profile-editor-banner [role="button"] {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid rgba(255,255,255,.22) !important;
  border-radius: 999px;
  background: rgba(17, 20, 27, .68) !important;
  color: #fff !important;
  box-shadow: none !important;
}

.alumni-profile-editor-photo-row {
  position: relative;
  z-index: 3;
  margin-top: -34px;
  padding: 0 10px 0 !important;
  align-items: flex-end !important;
}

.alumni-profile-editor-avatar {
  width: 92px !important;
  height: 92px !important;
  flex-basis: 92px !important;
  border: 4px solid var(--app-bg) !important;
  border-radius: 999px !important;
  background: var(--app-surface-2);
  box-shadow: 0 0 0 1px var(--app-border) !important;
}

.alumni-profile-editor-camera {
  width: 30px !important;
  height: 30px !important;
  border: 1px solid var(--app-border) !important;
  border-radius: 999px !important;
  background: var(--app-surface) !important;
  color: var(--app-text) !important;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--app-shadow) 28%, transparent) !important;
}

.alumni-profile-editor-fields {
  margin-top: 14px !important;
}

.alumni-editor-section {
  margin-top: 18px;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
}

.alumni-editor-section:first-child {
  margin-top: 14px;
}

.alumni-editor-section-head {
  padding: 0 4px 8px !important;
}

.alumni-editor-section-head h3 {
  color: var(--app-muted-2) !important;
  font-size: 10px !important;
  font-weight: 900 !important;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.alumni-editor-section > .alumni-edit-row:first-of-type {
  border-top: 1px solid var(--app-border) !important;
}

.alumni-profile-editor .alumni-edit-row {
  position: relative;
  display: grid !important;
  grid-template-columns: minmax(104px, 118px) minmax(0, 1fr) 16px;
  align-items: center;
  gap: 10px;
  min-height: 62px !important;
  margin: 0 !important;
  padding: 10px 4px !important;
  border-bottom: 1px solid var(--app-border) !important;
  background: transparent !important;
}

.alumni-profile-editor .alumni-edit-row::after {
  content: "›";
  position: static;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-muted-3);
  font-size: 18px;
  line-height: 1;
}

.alumni-profile-editor .alumni-edit-row > span:first-child,
.alumni-profile-editor .alumni-edit-row > label:first-child,
.alumni-profile-editor .alumni-edit-row > div:first-child > span:first-child {
  color: var(--app-muted-2) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  line-height: 1.25;
}

.alumni-profile-editor .alumni-edit-row input,
.alumni-profile-editor .alumni-edit-row textarea,
.alumni-profile-editor .alumni-edit-row select {
  width: 100%;
  border: 0 !important;
  outline: 0 !important;
  background: transparent !important;
  color: var(--app-text) !important;
  box-shadow: none !important;
  padding: 0 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 1.38 !important;
}

.alumni-profile-editor .alumni-edit-row input::placeholder,
.alumni-profile-editor .alumni-edit-row textarea::placeholder {
  color: var(--app-muted-3) !important;
}

.alumni-profile-editor .alumni-edit-row textarea {
  min-height: 42px !important;
  resize: none;
}

.alumni-profile-editor .alumni-edit-row:focus-within {
  background: var(--app-soft) !important;
}

.alumni-profile-editor .alumni-edit-row:focus-within::after {
  color: var(--app-accent);
}

.alumni-profile-editor .alumni-edit-row > :nth-child(2) {
  min-width: 0;
}

.alumni-profile-editor .alumni-edit-row > :nth-child(2) > * {
  min-width: 0;
}

.alumni-profile-editor .alumni-edit-row [data-value],
.alumni-profile-editor .alumni-edit-row .alumni-edit-value,
.alumni-profile-editor .alumni-edit-row p,
.alumni-profile-editor .alumni-edit-row small {
  color: var(--app-text) !important;
}

.alumni-settings-picker-sheet {
  border-radius: 24px 24px 0 0 !important;
}

.alumni-settings-picker-search {
  min-height: 46px;
  border-radius: 14px;
}

/* Tight mobile */
@media (max-width: 699px) {
  .alumni-profile-editor {
    padding-bottom: 24px;
  }

  .alumni-profile-editor-top {
    min-height: 56px !important;
  }

  .alumni-profile-editor-photo-row {
    padding-inline: 8px !important;
  }

  .alumni-profile-editor .alumni-edit-row {
    grid-template-columns: 96px minmax(0, 1fr) 16px;
    gap: 8px;
  }

  .alumni-profile-editor-save {
    min-width: 78px !important;
    padding-inline: 12px !important;
  }
}

@media (max-width: 374px) {
  .alumni-profile-editor-banner {
    min-height: 136px;
  }

  .alumni-profile-editor-avatar {
    width: 86px !important;
    height: 86px !important;
    flex-basis: 86px !important;
  }

  .alumni-profile-editor .alumni-edit-row {
    grid-template-columns: 88px minmax(0, 1fr) 14px;
  }

  .alumni-profile-editor .alumni-edit-row input,
  .alumni-profile-editor .alumni-edit-row textarea,
  .alumni-profile-editor .alumni-edit-row select {
    font-size: 13.5px !important;
  }
}

/* Desktop keeps same language, centered */
@media (min-width: 700px) {
  .alumni-profile-editor-top {
    border-radius: 18px 18px 0 0;
  }

  .alumni-profile-editor .alumni-edit-row {
    padding-inline: 6px !important;
  }
}

/* ${MARKER} */
`;

/* =========================================================
   4. PARSE TSX BEFORE WRITE
   ========================================================= */

try {
  const ts = require("typescript");

  for (const [name, source] of [
    [paths.mobileNav, nav],
    [paths.settingsPage, page],
  ]) {
    const parsed = ts.createSourceFile(
      name,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const diagnostics = parsed.parseDiagnostics || [];
    if (diagnostics.length) {
      const first = diagnostics[0];
      const message = ts.flattenDiagnosticMessageText(first.messageText, "\n");
      const pos = typeof first.start === "number"
        ? parsed.getLineAndCharacterOfPosition(first.start)
        : null;

      fail(
        `${name}: sintaxis inválida` +
          (pos ? ` línea ${pos.line + 1}, columna ${pos.character + 1}` : "") +
          `: ${message}`
      );
    }
  }

  console.log("✅ Parser TypeScript: MobileNav y Settings válidos");
} catch (error) {
  if (error && typeof error === "object" && error.code === "MODULE_NOT_FOUND") {
    console.warn("⚠️ TypeScript no disponible para validación extra.");
  } else {
    throw error;
  }
}

if (!nav.includes('style={{\n        bottom: "max(10px, env(safe-area-inset-bottom))",')) {
  fail("Validación: la nav flotante no quedó aplicada.");
}

if (!page.includes('settings-edit-profile-option-1.css')) {
  fail("Validación: el CSS del editor de perfil no quedó importado.");
}

/* =========================================================
   5. WRITE FILES
   ========================================================= */

backup(paths.mobileNav);
backup(paths.settingsPage);

fs.writeFileSync(abs(paths.mobileNav), nav, "utf8");
fs.writeFileSync(abs(paths.settingsPage), page, "utf8");
fs.writeFileSync(abs(paths.editCss), css, "utf8");

console.log("");
console.log("✅ ALUMNI Navbar + Editar perfil 1.0 aplicado.");
console.log("✅ Navbar inferior flotante, redondeada y despegada del suelo.");
console.log("✅ Sigue siendo Inicio · Mensajes · Buscar · Más.");
console.log("✅ Editar perfil movido a Opción 1 — vista limpia.");
console.log("✅ Guardar visible arriba a la derecha.");
console.log("✅ Banner + avatar + lista de campos más profesional.");
console.log("✅ Dark / Light preservados.");
console.log("");
console.log("Ahora ejecutá: npm run build");
