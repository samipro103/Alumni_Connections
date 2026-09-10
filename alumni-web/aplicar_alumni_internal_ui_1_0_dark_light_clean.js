const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_INTERNAL_UI_1_0_DARK_LIGHT_CLEAN";

const files = {
  layout: "src/app/layout.tsx",
  themeProvider: "src/components/theme/ThemeProvider.tsx",
  globals: "src/app/globals.css",
  leftSidebar: "src/components/layout/LeftSidebar.tsx",
  rightSidebar: "src/components/layout/RightSidebar.tsx",
  settings: "src/app/settings/page.tsx",
  feedback: "src/app/feedback/page.tsx",

  community: "src/app/community/page.tsx",
  communityDetail: "src/app/community/[slug]/page.tsx",
  events: "src/app/events/page.tsx",
  eventDetail: "src/app/events/[id]/page.tsx",
  messages: "src/app/messages/page.tsx",
  directChat: "src/app/messages/[username]/page.tsx",
  groupChat: "src/app/messages/group/[id]/page.tsx",
  notifications: "src/app/notifications/page.tsx",
  passport: "src/app/passport/page.tsx",
  explore: "src/app/explore/page.tsx",

  sharedCss: "src/app/interior-ui-1-0.css",
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
    fail(
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function replaceRequired(
  source,
  before,
  after,
  label
) {
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail(
      `No encontré el bloque esperado: ${label}. ` +
      "No escribí ningún archivo."
    );
  }

  return source.replace(before, after);
}

function addImport(
  source,
  anchor,
  importLine,
  label
) {
  if (source.includes(importLine)) {
    return source;
  }

  if (!source.includes(anchor)) {
    fail(
      `No encontré el import base para ${label}. ` +
      "No escribí ningún archivo."
    );
  }

  return source.replace(
    anchor,
    `${anchor}\n${importLine}`
  );
}

function backup(rel) {
  const source = abs(rel);
  const target =
    source +
    ".before-internal-ui-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
}

const original = {};
for (const [key, rel] of Object.entries(files)) {
  if (key === "sharedCss") continue;
  original[key] = read(rel);
}

if (
  fs.existsSync(abs(files.sharedCss)) &&
  fs
    .readFileSync(
      abs(files.sharedCss),
      "utf8"
    )
    .includes(MARKER) &&
  original.layout.includes(MARKER)
) {
  console.log(
    "✅ ALUMNI Internal UI 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

let layout = original.layout;
let themeProvider =
  original.themeProvider;
let globals = original.globals;
let leftSidebar =
  original.leftSidebar;
let rightSidebar =
  original.rightSidebar;
let settings = original.settings;
let feedback = original.feedback;

let community = original.community;
let communityDetail =
  original.communityDetail;
let events = original.events;
let eventDetail =
  original.eventDetail;
let messages = original.messages;
let directChat = original.directChat;
let groupChat = original.groupChat;
let notifications =
  original.notifications;
let passport = original.passport;
let explore = original.explore;

console.log(
  "✅ Rutas y componentes principales detectados"
);

/* ================================================================
   1. TEMA: SOLO DARK / LIGHT DE PRINCIPIO A FIN
   ================================================================ */

layout = replaceRequired(
  layout,
  `    var allowed = ["dark","light","pride"];
    var saved = localStorage.getItem("alumni-theme") || "dark";
    var theme = allowed.indexOf(saved) >= 0 ? saved : "dark";

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" || theme === "chill" ? "light" : "dark";`,
  `    var allowed = ["dark","light"];
    var saved = localStorage.getItem("alumni-theme") || "dark";
    var theme = allowed.indexOf(saved) >= 0 ? saved : "dark";

    if (theme !== saved) {
      localStorage.setItem("alumni-theme", theme);
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme =
      theme === "light" ? "light" : "dark";`,
  "inicialización Dark/Light de layout.tsx"
);

const themeNeedle = `  root.style.colorScheme =
    theme === "light"
      ? "light"
      : "dark";

  void syncNativeTheme(theme);`;

const themeReplacement = `  root.style.colorScheme =
    theme === "light"
      ? "light"
      : "dark";

  /*
   * Mantiene también la barra del navegador/PWA
   * alineada con el tema visual de ALUMNI.
   */
  const themeColor =
    theme === "light"
      ? "#f4f6fa"
      : "#090b0f";

  document
    .querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    )
    ?.setAttribute(
      "content",
      themeColor
    );

  void syncNativeTheme(theme);`;

themeProvider = replaceRequired(
  themeProvider,
  themeNeedle,
  themeReplacement,
  "sincronización de theme-color"
);

/* Limpieza de referencias de temas globales ya eliminados. */
globals = globals.replace(
  `html[data-theme="light"] img,
html[data-theme="chill"] img {`,
  `html[data-theme="light"] img {`
);

globals = globals.replace(
  `/* Pride: un pequeño detalle de marca sin sacrificar legibilidad. */
html[data-theme="pride"] [class~="bg-[#6d7cff]"],
html[data-theme="pride"] [class~="bg-[#7b87ff]"] {
  box-shadow: 0 8px 30px rgba(255,77,109,.10);
}

`,
  ""
);

globals = globals.replace(
  `   Capa global para que Dark, Light, Chill, Pride, Midnight, Emerald
   y Executive mantengan contraste, superficies y estados coherentes.`,
  `   Capa global para que Dark y Light mantengan
   contraste, superficies y estados coherentes.`
);

globals = globals.replace(
  `html[data-theme="light"] .alumni-original-logo-image,
html[data-theme="chill"] .alumni-original-logo-image {`,
  `html[data-theme="light"] .alumni-original-logo-image {`
);

globals = globals.replace(
  `html[data-theme="dark"] .alumni-original-logo-image,
html[data-theme="pride"] .alumni-original-logo-image,
html[data-theme="midnight"] .alumni-original-logo-image,
html[data-theme="emerald"] .alumni-original-logo-image,
html[data-theme="executive"] .alumni-original-logo-image {`,
  `html[data-theme="dark"] .alumni-original-logo-image {`
);

globals = globals.replace(
  /html\[data-theme="pride"\]\s+\.alumni-message-mine\s+\.alumni-reply-quote\s*\{[\s\S]*?\}\s*/g,
  ""
);

for (const oldTheme of [
  "chill",
  "pride",
  "midnight",
  "emerald",
  "executive",
]) {
  if (
    globals.includes(
      `data-theme="${oldTheme}"`
    )
  ) {
    fail(
      `globals.css todavía contiene el tema antiguo "${oldTheme}".`
    );
  }
}

console.log(
  "✅ Tema global reducido estrictamente a Dark / Light"
);

/* ================================================================
   2. SIDEBARS — ELIMINAR CHROME DARK-ONLY
   ================================================================ */

leftSidebar = replaceRequired(
  leftSidebar,
  `active ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"`,
  `active
                  ? "bg-[var(--app-soft-strong)] text-[var(--app-text)]"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-soft)] hover:text-[var(--app-text-soft)]"`,
  "colores de LeftSidebar"
);

rightSidebar = rightSidebar
  .replaceAll(
    "text-[#8d98ff]",
    "text-[var(--app-accent)]"
  )
  .replaceAll(
    "text-zinc-200",
    "text-[var(--app-text-soft)]"
  )
  .replaceAll(
    "text-zinc-100",
    "text-[var(--app-text)]"
  )
  .replaceAll(
    "text-zinc-300",
    "text-[var(--app-text-soft)]"
  )
  .replaceAll(
    "text-zinc-600",
    "text-[var(--app-muted-2)]"
  )
  .replaceAll(
    "hover:bg-white/[0.035]",
    "hover:bg-[var(--app-soft)]"
  )
  .replaceAll(
    "hover:text-white",
    "hover:text-[var(--app-text)]"
  )
  .replaceAll(
    "border-white/[0.07]",
    "border-[var(--app-border)]"
  );

rightSidebar = replaceRequired(
  rightSidebar,
  `bg-[#181d27] text-sm font-bold text-white ring-1 ring-white/10`,
  `bg-[var(--app-surface-2)] text-sm font-bold text-[var(--app-text)] ring-1 ring-[var(--app-border)]`,
  "avatar de RightSidebar"
);

rightSidebar = replaceRequired(
  rightSidebar,
  `className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[#6d7cff] hover:text-[var(--app-text)] disabled:opacity-50"`,
  `className="flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[var(--app-border)] bg-[var(--app-soft)] px-2.5 text-xs font-bold text-[var(--app-text-soft)] transition hover:border-transparent hover:bg-[var(--app-accent-fill)] hover:text-[var(--app-on-accent)] disabled:opacity-50"`,
  "botón Seguir de RightSidebar"
);

console.log(
  "✅ Sidebars convertidos a tokens Dark / Light"
);

/* ================================================================
   3. SETTINGS — PANEL INTERNO SIN FONDO DARK FIJO
   ================================================================ */

settings = replaceRequired(
  settings,
  `className="alumni-settings-panel rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:p-6"`,
  `className="alumni-settings-panel rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:p-5"`,
  "Panel interno de Configuración"
);

/* ================================================================
   4. FEEDBACK / AYUDA — CONVERSIÓN REAL A DUAL THEME
   ================================================================ */

feedback = addImport(
  feedback,
  `import { APP_VERSION } from "@/lib/appVersion";`,
  `import "../interior-ui-1-0.css";`,
  "Internal UI en Feedback"
);

feedback = feedback
  .replace(
    `className="py-16 text-center text-sm text-zinc-600"`,
    `className="alumni-feedback-pro alumni-feedback-loading py-16 text-center text-sm text-[var(--app-muted-2)]"`
  )
  .replace(
    `className="mx-auto max-w-xl py-10 text-center"`,
    `className="alumni-feedback-pro alumni-feedback-success mx-auto max-w-xl py-10 text-center"`
  )
  .replace(
    `className="mx-auto w-full max-w-[820px]"`,
    `className="alumni-feedback-pro mx-auto w-full max-w-[720px]"`
  )
  .replace(
    `className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400"`,
    `className="alumni-feedback-success-icon mx-auto flex h-16 w-16 items-center justify-center rounded-full"`
  )
  .replaceAll(
    "text-zinc-700",
    "text-[var(--app-muted-3)]"
  )
  .replaceAll(
    "text-zinc-600",
    "text-[var(--app-muted-2)]"
  )
  .replaceAll(
    "text-zinc-500",
    "text-[var(--app-muted)]"
  )
  .replaceAll(
    "text-zinc-300",
    "text-[var(--app-text-soft)]"
  )
  .replaceAll(
    "text-zinc-200",
    "text-[var(--app-text-soft)]"
  )
  .replaceAll(
    "text-[#8d98ff]",
    "text-[var(--app-accent)]"
  )
  .replaceAll(
    "text-[#a8b0ff]",
    "text-[var(--app-accent)]"
  )
  .replaceAll(
    "border-white/[0.07]",
    "border-[var(--app-border)]"
  )
  .replaceAll(
    "border-white/[0.08]",
    "border-[var(--app-border)]"
  )
  .replaceAll(
    "bg-white/[0.035]",
    "bg-[var(--app-soft)]"
  )
  .replaceAll(
    "bg-white/[0.03]",
    "bg-[var(--app-soft)]"
  )
  .replaceAll(
    "bg-white/[0.06]",
    "bg-[var(--app-soft-strong)]"
  )
  .replaceAll(
    "border-[#6d7cff]/40",
    "border-[var(--app-accent)]"
  )
  .replaceAll(
    "bg-[#6d7cff]/10",
    "bg-[var(--app-accent-soft)]"
  )
  .replaceAll(
    "focus:border-[#6d7cff]/45",
    "focus:border-[var(--app-accent)]"
  )
  .replaceAll(
    "bg-[#6d7cff]",
    "bg-[var(--app-accent-fill)]"
  )
  .replaceAll(
    "hover:bg-[#7b87ff]",
    "hover:brightness-105"
  );

if (
  !feedback.includes(
    "alumni-feedback-pro"
  )
) {
  fail(
    "No pude preparar la raíz visual de Feedback."
  );
}

console.log(
  "✅ Feedback/Ayuda convertido a dual theme real"
);

/* ================================================================
   5. IMPORTAR LA CAPA INTERNA DESPUÉS DEL CSS DE CADA FUNCIÓN
   ================================================================ */

community = addImport(
  community,
  `import "./community-2.css";`,
  `import "../interior-ui-1-0.css";`,
  "Comunidad"
);

communityDetail = addImport(
  communityDetail,
  `import "./community-detail.css";`,
  `import "../../interior-ui-1-0.css";`,
  "Detalle de Comunidad"
);

events = addImport(
  events,
  `import "./events-2.css";`,
  `import "../interior-ui-1-0.css";`,
  "Eventos"
);

eventDetail = addImport(
  eventDetail,
  `import "./event-detail.css";`,
  `import "../../interior-ui-1-0.css";`,
  "Detalle de Evento"
);

messages = addImport(
  messages,
  `import "./messages-design-1-6.css";`,
  `import "../interior-ui-1-0.css";`,
  "Inbox"
);

directChat = addImport(
  directChat,
  `import "../messages-design-1-6.css";`,
  `import "../../interior-ui-1-0.css";`,
  "Chat directo"
);

groupChat = addImport(
  groupChat,
  `import "../../messages-design-1-6.css";`,
  `import "../../../interior-ui-1-0.css";`,
  "Chat grupal"
);

notifications = addImport(
  notifications,
  `import "./notifications-pro.css";`,
  `import "../interior-ui-1-0.css";`,
  "Notificaciones"
);

settings = addImport(
  settings,
  `import "./settings-classic-1-0.css";`,
  `import "../interior-ui-1-0.css";`,
  "Configuración"
);

passport = addImport(
  passport,
  `import "./passport.css";`,
  `import "../interior-ui-1-0.css";`,
  "Pasaporte"
);

explore = addImport(
  explore,
  `import "./explore-pro.css";`,
  `import "../interior-ui-1-0.css";`,
  "Buscar"
);

/* ================================================================
   6. SISTEMA VISUAL INTERNO
   ================================================================ */

const sharedCss = `/*
 * ${MARKER}
 *
 * ALUMNI — Internal UI 1.0
 * Mobile-first 360–430 px.
 * Solo Dark / Light.
 *
 * Objetivo:
 * - conservar los diseños elegidos;
 * - limpiar los interiores de cada función;
 * - unificar formularios, modales, listas y detalles;
 * - evitar mezcla de superficies claras/oscuras;
 * - no alterar lógica de producto.
 */

/* =========================================================
   CORE
   ========================================================= */

:where(
  .alumni-community-2,
  .community-detail,
  .alumni-events-2,
  .event-detail,
  .alumni-notifications-pro,
  .alumni-inbox-clean,
  .alumni-chat-focused,
  .alumni-settings-classic,
  .alumni-passport,
  .alumni-feedback-pro,
  .alumni-explore-pro,
  .alumni-profile-editor
) {
  color: var(--app-text);
  font-family:
    var(--font-geist-sans),
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

html[data-theme="dark"]
  :where(
    .alumni-community-2,
    .community-detail,
    .alumni-events-2,
    .event-detail,
    .alumni-notifications-pro,
    .alumni-inbox-clean,
    .alumni-chat-focused,
    .alumni-settings-classic,
    .alumni-passport,
    .alumni-feedback-pro,
    .alumni-explore-pro,
    .alumni-profile-editor
  ) {
  color-scheme: dark;
}

html[data-theme="light"]
  :where(
    .alumni-community-2,
    .community-detail,
    .alumni-events-2,
    .event-detail,
    .alumni-notifications-pro,
    .alumni-inbox-clean,
    .alumni-chat-focused,
    .alumni-settings-classic,
    .alumni-passport,
    .alumni-feedback-pro,
    .alumni-explore-pro,
    .alumni-profile-editor
  ) {
  color-scheme: light;
}

:where(
  .alumni-community-2,
  .community-detail,
  .alumni-events-2,
  .event-detail,
  .alumni-notifications-pro,
  .alumni-inbox-clean,
  .alumni-chat-focused,
  .alumni-settings-classic,
  .alumni-passport,
  .alumni-feedback-pro,
  .alumni-explore-pro,
  .alumni-profile-editor
)
:where(button, input, textarea, select) {
  font: inherit;
}

:where(
  .alumni-community-2,
  .community-detail,
  .alumni-events-2,
  .event-detail,
  .alumni-notifications-pro,
  .alumni-inbox-clean,
  .alumni-chat-focused,
  .alumni-settings-classic,
  .alumni-passport,
  .alumni-feedback-pro,
  .alumni-explore-pro,
  .alumni-profile-editor
)
:where(button, a, input, textarea, select):focus-visible {
  outline:
    2px solid
    color-mix(
      in srgb,
      var(--app-accent) 70%,
      transparent
    );
  outline-offset: 2px;
}

/* =========================================================
   MAIN FUNCTION HEADERS — APP SCALE, NOT LANDING PAGE SCALE
   ========================================================= */

@media (max-width: 699px) {
  .community2-hero h1,
  .events2-hero h1,
  .alumni-notifications-header h1,
  .passport-hero h1 {
    margin: 0 !important;
    font-size: 28px !important;
    line-height: 1.05 !important;
    letter-spacing: -.04em !important;
  }

  .community-detail-title h1,
  .event-detail-header h1 {
    font-size: 31px !important;
    line-height: 1.02 !important;
    letter-spacing: -.045em !important;
  }

  .community2-hero,
  .events2-hero,
  .alumni-notifications-header,
  .passport-hero {
    min-height: 54px;
    padding:
      2px 0
      15px !important;
  }

  .community2-hero,
  .events2-hero,
  .passport-hero {
    flex-direction: row !important;
    align-items: center !important;
    justify-content:
      space-between !important;
    gap: 10px !important;
  }

  .community2-primary-action,
  .events2-primary-action,
  .passport-hero > button,
  .passport-album header > button {
    min-height: 40px !important;
    padding: 0 13px !important;
    border: 0 !important;
    border-radius: 12px !important;
    background:
      var(--app-accent-fill) !important;
    color:
      var(--app-on-accent) !important;
    font-size: 10.5px !important;
    white-space: nowrap;
  }
}

/* =========================================================
   COMMUNITY + EVENTS — LIST / SEARCH / TABS
   ========================================================= */

.community2-search,
.events2-search {
  border:
    1px solid
    var(--app-border);
  border-radius: 13px;
  background:
    var(--app-surface);
  padding: 0 12px;
}

.community2-search input,
.events2-search input {
  min-height: 42px;
}

.community2-search input::placeholder,
.events2-search input::placeholder {
  color: var(--app-muted-3);
}

.community2-row,
.events2-row {
  color: inherit;
}

@media (max-width: 680px) {
  .community2-navigation,
  .events2-navigation {
    gap: 9px !important;
    padding:
      8px 0 12px !important;
  }

  .community2-tabs,
  .events2-tabs {
    display: grid !important;
    width: 100%;
    gap: 0 !important;
    border:
      1px solid
      var(--app-border);
    border-radius: 13px;
    background: var(--app-soft);
    overflow: hidden;
  }

  .community2-tabs {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .events2-tabs {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .community2-tabs button,
  .events2-tabs button {
    min-height: 40px !important;
  }

  .community2-tabs
    button[data-active="true"],
  .events2-tabs
    button[data-active="true"] {
    background:
      var(--app-surface) !important;
  }

  .community2-tabs
    button[data-active="true"]::after,
  .events2-tabs
    button[data-active="true"]::after {
    right: 16px !important;
    left: 16px !important;
  }

  .community2-search,
  .events2-search {
    width: 100% !important;
  }

  .community2-row {
    min-height: 78px !important;
    grid-template-columns:
      44px minmax(0, 1fr) auto !important;
    gap: 11px !important;
  }

  .events2-row {
    min-height: 84px !important;
    grid-template-columns:
      48px minmax(0, 1fr) auto !important;
    gap: 11px !important;
  }
}

/* =========================================================
   COMMUNITY / EVENT CREATION EDITORS
   ========================================================= */

.community2-editor,
.events2-editor {
  color: var(--app-text);
  background:
    var(--app-bg) !important;
}

.community2-editor-header,
.events2-editor-header,
.community2-editor-footer,
.events2-editor-footer {
  border-color:
    var(--app-border) !important;
  background:
    color-mix(
      in srgb,
      var(--app-surface) 96%,
      transparent
    ) !important;
}

.community2-field input,
.community2-field textarea,
.events2-field input,
.events2-field textarea,
.events2-field select {
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 12px !important;
  background:
    var(--app-surface) !important;
  color:
    var(--app-text) !important;
  padding-inline: 12px !important;
}

.community2-field textarea,
.events2-field textarea {
  padding-block: 11px !important;
}

.community2-field input::placeholder,
.community2-field textarea::placeholder,
.events2-field input::placeholder,
.events2-field textarea::placeholder {
  color:
    var(--app-muted-3) !important;
}

.community2-field input:focus,
.community2-field textarea:focus,
.events2-field input:focus,
.events2-field textarea:focus,
.events2-field select:focus {
  border-color:
    var(--app-accent) !important;
  box-shadow:
    0 0 0 3px
    var(--app-accent-soft);
}

.community2-category-list,
.community2-access-list {
  display: grid;
  gap: 8px;
  border: 0 !important;
}

.community2-category-list button,
.community2-access-list button,
.events2-type-grid button,
.events2-visibility button {
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 13px !important;
  background:
    var(--app-surface) !important;
}

.community2-category-list button,
.community2-access-list button {
  min-height: 58px !important;
  padding:
    0 12px !important;
}

.community2-category-list
  button[data-active="true"],
.community2-access-list
  button[data-active="true"],
.events2-type-grid
  button[data-active="true"],
.events2-visibility
  button[data-active="true"] {
  border-color:
    color-mix(
      in srgb,
      var(--app-accent) 58%,
      var(--app-border)
    ) !important;
  background:
    var(--app-accent-soft) !important;
}

@media (max-width: 680px) {
  .community2-editor-header,
  .events2-editor-header {
    position: sticky;
    top: 0;
    z-index: 20;
    align-items: center !important;
    padding:
      max(
        10px,
        env(safe-area-inset-top)
      )
      14px 10px !important;
  }

  .community2-editor-body,
  .events2-editor-body {
    padding:
      0 14px
      calc(
        96px +
        env(safe-area-inset-bottom)
      ) !important;
  }

  .community2-editor-section,
  .events2-editor-section {
    gap: 13px !important;
    padding:
      19px 0 22px !important;
  }

  .community2-editor-footer,
  .events2-editor-footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 30;
    min-height: 70px;
    padding:
      10px 14px
      max(
        10px,
        env(safe-area-inset-bottom)
      ) !important;
  }

  .community2-editor-footer button,
  .events2-editor-footer button {
    min-height: 46px !important;
    border-radius: 13px !important;
  }
}

/* =========================================================
   COMMUNITY DETAIL
   ========================================================= */

.community-detail-back,
.event-detail-back {
  min-height: 38px !important;
  padding: 0 10px;
  border:
    1px solid
    var(--app-border);
  border-radius: 999px;
  background: var(--app-soft);
}

.community-composer {
  margin-top: 14px;
  padding: 14px !important;
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 16px;
  background:
    var(--app-surface);
}

.community-composer textarea {
  min-height: 88px;
  resize: none;
  color: var(--app-text);
}

.community-composer textarea::placeholder {
  color: var(--app-muted-3);
}

.community-post {
  background: var(--app-surface);
}

@media (max-width: 699px) {
  .community-detail,
  .event-detail {
    padding-top: 8px !important;
  }

  .community-detail-header {
    align-items:
      flex-start !important;
    flex-direction:
      column !important;
    gap: 13px !important;
    padding:
      6px 0 18px !important;
  }

  .community-detail-join {
    min-height: 40px;
    padding: 0 13px;
    border:
      1px solid
      var(--app-border);
    border-radius: 12px;
    background:
      var(--app-surface);
  }

  .community-events-strip,
  .community-feed {
    padding:
      18px 0 !important;
  }

  .community-post {
    margin-top: 10px;
    padding:
      14px !important;
    border:
      1px solid
      var(--app-border) !important;
    border-radius: 16px;
  }

  .community-post + .community-post {
    margin-top: 10px;
  }
}

/* =========================================================
   EVENT DETAIL / RSVP
   ========================================================= */

.event-detail-header {
  padding:
    6px 0 20px !important;
}

.event-rsvp-v2 {
  margin-top: 12px;
  padding:
    16px !important;
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 16px;
  background:
    var(--app-surface);
}

.event-rsvp-choice {
  overflow: hidden;
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 13px;
}

.event-rsvp-choice > button {
  background:
    transparent !important;
}

.event-rsvp-choice
  > button[data-active="true"] {
  background:
    var(--app-accent-soft) !important;
  color:
    var(--app-text) !important;
}

@media (max-width: 620px) {
  .event-rsvp-v2 {
    gap: 14px !important;
  }

  .event-rsvp-choice {
    width: 100% !important;
    grid-template-columns:
      1fr !important;
  }

  .event-rsvp-choice > button {
    min-height: 56px !important;
    border-right: 0 !important;
    border-bottom:
      1px solid
      var(--app-border) !important;
  }

  .event-rsvp-choice
    > button:last-child {
    border-bottom: 0 !important;
  }

  .event-going-list {
    gap: 0;
  }
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */

.alumni-notification-header-action,
.alumni-notification-icon-button {
  border:
    1px solid
    transparent;
}

.alumni-notification-header-action:hover,
.alumni-notification-icon-button:hover {
  border-color:
    var(--app-border);
}

.alumni-notification-settings {
  color: var(--app-text);
  background:
    var(--app-surface) !important;
}

@media (max-width: 560px) {
  .alumni-notifications-header {
    min-height: 54px;
    align-items:
      center !important;
  }

  .alumni-notification-tabs {
    gap: 18px !important;
  }

  .alumni-notification-main {
    min-height: 72px !important;
  }

  .alumni-notification-settings {
    max-height:
      min(86dvh, 720px) !important;
  }
}

/* =========================================================
   MESSAGES — KEEP SELECTED OPTION 1 / OPTION 2
   Only theme/focus reinforcement.
   ========================================================= */

.alumni-inbox-clean
  :where(input, textarea),
.alumni-chat-focused
  :where(input, textarea) {
  color: var(--app-text);
}

.alumni-inbox-clean
  :where(input, textarea)::placeholder,
.alumni-chat-focused
  :where(input, textarea)::placeholder {
  color: var(--app-muted-3);
}

.alumni-chat-focused
  .alumni-chat-focus-header,
.alumni-chat-focused
  .alumni-chat-focus-composer-shell {
  border-color:
    var(--app-border) !important;
}

/* =========================================================
   SETTINGS — OPTION 1 PRESERVED
   INNER DETAIL / PROFILE EDITOR CLEANUP
   ========================================================= */

.alumni-settings-classic
  .alumni-settings-panel,
.alumni-settings-classic
  .alumni-profile-settings-hub {
  color: var(--app-text);
}

.alumni-settings-classic
  .alumni-settings-panel
  :where(input, textarea, select),
.alumni-profile-editor
  :where(input, textarea, select) {
  color: var(--app-text);
}

.alumni-settings-classic
  .alumni-settings-panel
  :where(input, textarea, select)::placeholder,
.alumni-profile-editor
  :where(input, textarea, select)::placeholder {
  color: var(--app-muted-3);
}

.alumni-profile-editor {
  background: var(--app-bg);
}

.alumni-profile-editor
  .alumni-editor-section {
  border-color:
    var(--app-border) !important;
}

.alumni-profile-editor
  .alumni-edit-row {
  border-color:
    var(--app-border) !important;
}

@media (max-width: 639px) {
  .alumni-profile-editor-top {
    background:
      color-mix(
        in srgb,
        var(--app-bg) 96%,
        transparent
      ) !important;
  }

  .alumni-profile-editor-fields {
    margin-top: 20px !important;
  }

  .alumni-profile-editor
    .alumni-editor-section {
    padding:
      18px 0 !important;
  }
}

/* =========================================================
   PASSPORT — APP CHROME DARK/LIGHT, CONTENT MAY STAY COLORFUL
   ========================================================= */

.passport-modal,
.passport-country,
.passport-grid figure {
  color: var(--app-text);
}

.passport-body
  :where(input, textarea) {
  border:
    1px solid
    var(--app-border) !important;
  border-radius: 12px;
  background:
    var(--app-surface) !important;
  color: var(--app-text);
  padding-inline: 12px;
}

.passport-body textarea {
  padding-block: 11px !important;
}

.passport-body
  :where(input, textarea)::placeholder {
  color: var(--app-muted-3);
}

.passport-body
  :where(input, textarea):focus {
  border-color:
    var(--app-accent) !important;
  box-shadow:
    0 0 0 3px
    var(--app-accent-soft);
  outline: 0;
}

@media (max-width: 700px) {
  .passport-strip {
    display: flex !important;
    gap: 12px !important;
    overflow-x: auto;
    overflow-y: hidden;
    padding:
      18px 0 22px !important;
    scroll-snap-type:
      x proximity;
    scrollbar-width: none;
  }

  .passport-strip::-webkit-scrollbar {
    display: none;
  }

  .passport-country {
    width:
      min(74vw, 250px);
    flex:
      0 0
      min(74vw, 250px);
    scroll-snap-align: start;
    border-radius:
      18px !important;
  }

  .passport-cover {
    height:
      150px !important;
  }

  .passport-album {
    padding:
      20px 0 26px !important;
  }

  .passport-album > header {
    flex-direction:
      row !important;
    align-items:
      center !important;
    gap: 10px !important;
  }

  .passport-album h2 {
    font-size:
      23px !important;
  }

  .passport-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      ) !important;
    gap: 8px !important;
  }

  .passport-grid figure {
    border-radius:
      14px !important;
  }

  .passport-grid figcaption {
    padding: 9px !important;
  }
}

@media (max-width: 355px) {
  .passport-grid {
    grid-template-columns:
      1fr !important;
  }
}

/* =========================================================
   FEEDBACK / AYUDA — COMPLETE INTERNAL SCREEN
   ========================================================= */

.alumni-feedback-pro {
  color: var(--app-text);
}

.alumni-feedback-pro
  > div:first-child,
.alumni-feedback-pro
  > .border-b {
  border-color:
    var(--app-border) !important;
}

.alumni-feedback-pro h1,
.alumni-feedback-pro h2,
.alumni-feedback-pro
  [class*="font-black"] {
  color: var(--app-text);
}

.alumni-feedback-pro
  :where(input, textarea) {
  border:
    1px solid
    var(--app-border) !important;
  background:
    var(--app-surface) !important;
  color:
    var(--app-text) !important;
  box-shadow: none;
}

.alumni-feedback-pro
  :where(input, textarea)::placeholder {
  color:
    var(--app-muted-3) !important;
}

.alumni-feedback-pro
  :where(input, textarea):focus {
  border-color:
    var(--app-accent) !important;
  box-shadow:
    0 0 0 3px
    var(--app-accent-soft);
}

.alumni-feedback-pro
  section > p:first-child {
  color:
    var(--app-text-soft);
}

.alumni-feedback-pro
  section button {
  border-color:
    var(--app-border);
}

.alumni-feedback-success-icon {
  background:
    color-mix(
      in srgb,
      var(--app-success) 12%,
      transparent
    );
  color:
    var(--app-success);
}

.alumni-feedback-success {
  padding-inline: 16px;
}

@media (max-width: 639px) {
  .alumni-feedback-pro {
    padding-top: 5px;
  }

  .alumni-feedback-pro
    > button:first-child {
    min-height: 38px;
    margin-bottom:
      12px !important;
    padding: 0 10px;
    border:
      1px solid
      var(--app-border);
    border-radius: 999px;
    background:
      var(--app-soft);
  }

  .alumni-feedback-pro h1 {
    font-size:
      27px !important;
    line-height: 1.08;
  }

  .alumni-feedback-pro
    .border-b {
    padding-bottom:
      18px !important;
  }

  .alumni-feedback-pro
    .space-y-7 {
    margin-top:
      20px !important;
  }

  .alumni-feedback-pro
    :where(input, textarea) {
    border-radius:
      13px !important;
  }

  .alumni-feedback-pro
    section:last-child {
    padding-bottom:
      max(
        10px,
        env(safe-area-inset-bottom)
      );
  }
}

/* =========================================================
   SEARCH — PRESERVE OPTION 4, JUST THEME SAFETY
   ========================================================= */

.alumni-explore-pro
  :where(input, textarea) {
  color: var(--app-text);
}

.alumni-explore-pro
  :where(input, textarea)::placeholder {
  color: var(--app-muted-3);
}

/* =========================================================
   DESKTOP SECONDARY
   Same application language, simply more breathing room.
   ========================================================= */

@media (min-width: 700px) {
  .alumni-community-2,
  .community-detail,
  .alumni-events-2,
  .event-detail,
  .alumni-notifications-pro,
  .alumni-feedback-pro {
    max-width: 760px !important;
  }

  .community2-hero h1,
  .events2-hero h1,
  .passport-hero h1 {
    font-size:
      38px !important;
  }

  .community-detail-title h1,
  .event-detail-header h1 {
    font-size:
      42px !important;
  }
}

/* ${MARKER} */
`;

/* ================================================================
   7. MARCADORES + VALIDACIÓN TSX ANTES DE ESCRIBIR
   ================================================================ */

const candidates = {
  [files.layout]: layout,
  [files.themeProvider]:
    themeProvider,
  [files.leftSidebar]:
    leftSidebar,
  [files.rightSidebar]:
    rightSidebar,
  [files.settings]: settings,
  [files.feedback]: feedback,
  [files.community]: community,
  [files.communityDetail]:
    communityDetail,
  [files.events]: events,
  [files.eventDetail]:
    eventDetail,
  [files.messages]: messages,
  [files.directChat]: directChat,
  [files.groupChat]: groupChat,
  [files.notifications]:
    notifications,
  [files.passport]: passport,
  [files.explore]: explore,
};

try {
  const ts = require("typescript");

  for (
    const [name, source]
    of Object.entries(candidates)
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start === "number"
          ? parsed
              .getLineAndCharacterOfPosition(
                first.start
              )
          : null;

      fail(
        `${name}: sintaxis inválida` +
        (
          pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : ""
        ) +
        `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: todos los TSX válidos"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

if (
  !layout.includes(
    `var allowed = ["dark","light"];`
  )
) {
  fail(
    "Validación: layout no quedó limitado a Dark/Light."
  );
}

if (
  !settings.includes(
    `bg-[var(--app-surface)]`
  )
) {
  fail(
    "Validación: Settings no quedó tematizado."
  );
}

if (
  !feedback.includes(
    `alumni-feedback-pro`
  )
) {
  fail(
    "Validación: Feedback no quedó tematizado."
  );
}

for (const [name, source] of [
  ["Comunidad", community],
  [
    "Detalle comunidad",
    communityDetail,
  ],
  ["Eventos", events],
  ["Detalle evento", eventDetail],
  ["Mensajes", messages],
  ["Chat directo", directChat],
  ["Chat grupal", groupChat],
  ["Notificaciones", notifications],
  ["Configuración", settings],
  ["Pasaporte", passport],
  ["Buscar", explore],
]) {
  if (
    !source.includes(
      "interior-ui-1-0.css"
    )
  ) {
    fail(
      `Validación: ${name} no importó Internal UI.`
    );
  }
}

console.log(
  "✅ Validaciones funcionales superadas"
);

/* ================================================================
   8. BACKUPS + WRITE
   ================================================================ */

for (const rel of [
  files.layout,
  files.themeProvider,
  files.globals,
  files.leftSidebar,
  files.rightSidebar,
  files.settings,
  files.feedback,
  files.community,
  files.communityDetail,
  files.events,
  files.eventDetail,
  files.messages,
  files.directChat,
  files.groupChat,
  files.notifications,
  files.passport,
  files.explore,
]) {
  backup(rel);
}

layout +=
  `\n/* ${MARKER} */\n`;

themeProvider +=
  `\n/* ${MARKER} */\n`;

globals +=
  `\n/* ${MARKER} */\n`;

leftSidebar +=
  `\n/* ${MARKER} */\n`;

rightSidebar +=
  `\n/* ${MARKER} */\n`;

settings +=
  `\n/* ${MARKER} */\n`;

feedback +=
  `\n/* ${MARKER} */\n`;

for (const [rel, source] of [
  [files.layout, layout],
  [
    files.themeProvider,
    themeProvider,
  ],
  [files.globals, globals],
  [
    files.leftSidebar,
    leftSidebar,
  ],
  [
    files.rightSidebar,
    rightSidebar,
  ],
  [files.settings, settings],
  [files.feedback, feedback],
  [files.community, community],
  [
    files.communityDetail,
    communityDetail,
  ],
  [files.events, events],
  [
    files.eventDetail,
    eventDetail,
  ],
  [files.messages, messages],
  [
    files.directChat,
    directChat,
  ],
  [
    files.groupChat,
    groupChat,
  ],
  [
    files.notifications,
    notifications,
  ],
  [files.passport, passport],
  [files.explore, explore],
]) {
  fs.writeFileSync(
    abs(rel),
    source,
    "utf8"
  );
}

fs.writeFileSync(
  abs(files.sharedCss),
  sharedCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Internal UI 1.0 aplicado."
);
console.log(
  "✅ Tema global: SOLO Dark / Light."
);
console.log(
  "✅ Community: lista + creación + detalle."
);
console.log(
  "✅ Events: lista + creación + detalle + RSVP."
);
console.log(
  "✅ Messages: Inbox 1 + Chat 2 preservados."
);
console.log(
  "✅ Notifications: lista + preferencias."
);
console.log(
  "✅ Settings: lista clásica + interiores."
);
console.log(
  "✅ Profile editor: interiores tematizados."
);
console.log(
  "✅ Feedback/Ayuda: reconstruido para Dark/Light."
);
console.log(
  "✅ Passport: interior móvil más limpio."
);
console.log(
  "✅ Search Option 4 preservado."
);
console.log(
  "✅ Sidebars sin estilos Dark-only."
);
console.log(
  "✅ Mobile-first 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
