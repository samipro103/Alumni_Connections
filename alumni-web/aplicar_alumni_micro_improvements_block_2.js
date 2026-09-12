const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const MARKER =
  "ALUMNI_MICRO_IMPROVEMENTS_BLOCK_2";

const PAGE =
  "src/app/notifications/page.tsx";

const CSS =
  "src/app/notifications/notifications-clean-motion-3-0.css";

function abs(rel) {
  return path.join(
    ROOT,
    rel
  );
}

function fail(message) {
  console.error(
    "❌ " + message
  );
  process.exit(1);
}

function read(rel) {
  if (
    !fs.existsSync(
      abs(rel)
    )
  ) {
    fail(
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(
      /\r\n/g,
      "\n"
    );
}

function backup(
  rel,
  content
) {
  const bak =
    abs(rel) +
    ".before-micro-improvements-block-2.bak";

  if (
    !fs.existsSync(
      bak
    )
  ) {
    fs.writeFileSync(
      bak,
      content,
      "utf8"
    );
  }
}

function replaceRequired(
  source,
  before,
  after,
  label
) {
  if (
    source.includes(
      after
    )
  ) {
    return source;
  }

  if (
    !source.includes(
      before
    )
  ) {
    fail(
      `No encontré ${label}. No escribí cambios.`
    );
  }

  return source.replace(
    before,
    after
  );
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let page =
  read(PAGE);

backup(
  PAGE,
  page
);

/* ======================================================
   1. ICONO ATRÁS PARA PREFERENCIAS
   ====================================================== */

if (
  !page.includes(
    "  ArrowLeft,\n"
  )
) {
  page =
    replaceRequired(
      page,
      "import {\n  AtSign,\n",
      "import {\n  ArrowLeft,\n  AtSign,\n",
      "imports de iconos"
    );
}

page =
  page.replace(
    "  X,\n",
    ""
  );

/* ======================================================
   2. CSS FINAL, después de Interior UI
   ====================================================== */

if (
  !page.includes(
    'import "./notifications-clean-motion-3-0.css";'
  )
) {
  page =
    replaceRequired(
      page,
      'import "../interior-ui-1-0.css";',
      'import "../interior-ui-1-0.css";\nimport "./notifications-clean-motion-3-0.css";',
      "import de Interior UI"
    );
}

/* ======================================================
   3. PROTEGER DE MOTION GLOBAL
   ====================================================== */

page =
  replaceRequired(
    page,
    '<main className="alumni-notifications-pro mx-auto w-full max-w-[860px]">',
    '<main className="alumni-notifications-pro mx-auto w-full max-w-[860px]" data-alumni-motion-ignore="true">',
    "main de notificaciones"
  );

/* ======================================================
   4. PREFERENCIAS: botón atrás real
   ====================================================== */

const oldHeader = `              <header>
                <div>
                  <p>Preferencias</p>
                  <h2>Qué quieres recibir</h2>
                </div>

                <button
                  type="button"
                  onClick={() => closePreferences()}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </header>`;

const newHeader = `              <header>
                <button
                  type="button"
                  onClick={() => closePreferences()}
                  aria-label="Volver"
                >
                  <ArrowLeft
                    size={19}
                    strokeWidth={2}
                  />
                </button>

                <div>
                  <p>Notificaciones</p>
                  <h2>Qué quieres recibir</h2>
                </div>
              </header>`;

page =
  replaceRequired(
    page,
    oldHeader,
    newHeader,
    "header de preferencias"
  );

if (
  !page.includes(
    MARKER
  )
) {
  page +=
    `\n/* ${MARKER} */\n`;
}

const css =
  "/*\n * ALUMNI_MICRO_IMPROVEMENTS_BLOCK_2\n * Notifications + notification preferences.\n * Clean, flat, mobile-first, explicit motion.\n */\n\n.alumni-notifications-pro {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  overflow-x: clip;\n  padding-bottom:\n    calc(\n      42px +\n      env(safe-area-inset-bottom)\n    );\n}\n\n/* ======================================================\n   NOTIFICATIONS HEADER — flat, no card\n   ====================================================== */\n\n.alumni-notifications-header {\n  display: flex !important;\n  width: 100%;\n  min-width: 0;\n  align-items: center !important;\n  justify-content: space-between;\n  gap: 12px !important;\n  padding:\n    10px 1px 12px !important;\n  border: 0 !important;\n  border-radius: 0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n  animation:\n    alumniNotificationsReveal\n    .38s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-notifications-header\n.alumni-notifications-eyebrow,\n.alumni-notifications-header\np:not(.alumni-notifications-eyebrow) {\n  display:\n    none !important;\n}\n\n.alumni-notifications-header h1 {\n  margin:\n    0 !important;\n  color:\n    var(--app-text);\n  font-size:\n    clamp(\n      26px,\n      7vw,\n      32px\n    ) !important;\n  font-weight:\n    950 !important;\n  line-height:\n    1.04 !important;\n  letter-spacing:\n    -.045em !important;\n}\n\n.alumni-notifications-header\n> div:first-child {\n  min-width: 0;\n}\n\n.alumni-notifications-header\n> div:last-child {\n  min-width: 0;\n}\n\n.alumni-notification-header-action,\n.alumni-notification-icon-button {\n  min-height:\n    38px !important;\n  border:\n    0 !important;\n  border-radius:\n    999px !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-muted-2) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease,\n    color 150ms ease !important;\n}\n\n.alumni-notification-header-action {\n  padding:\n    0 9px !important;\n}\n\n.alumni-notification-icon-button {\n  width:\n    38px !important;\n}\n\n.alumni-notification-header-action:active,\n.alumni-notification-icon-button:active {\n  transform:\n    scale(.92);\n  background:\n    var(--app-soft) !important;\n  color:\n    var(--app-text) !important;\n}\n\n/* ======================================================\n   TABS — no overflow outside phone\n   ====================================================== */\n\n.alumni-notification-tabs {\n  display: flex !important;\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  min-height:\n    47px !important;\n  align-items:\n    flex-end !important;\n  gap:\n    19px !important;\n  padding:\n    0 1px;\n  border-top:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  overflow-x:\n    auto !important;\n  overflow-y:\n    hidden !important;\n  overscroll-behavior-x:\n    contain;\n  scrollbar-width:\n    none;\n  -webkit-overflow-scrolling:\n    touch;\n  animation:\n    alumniNotificationsReveal\n    .42s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .04s;\n}\n\n.alumni-notification-tabs::-webkit-scrollbar {\n  display: none;\n}\n\n.alumni-notification-tabs button {\n  min-height:\n    44px !important;\n  flex:\n    0 0 auto !important;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-muted-2);\n  font-size:\n    11.5px !important;\n  font-weight:\n    820 !important;\n  white-space:\n    nowrap !important;\n}\n\n.alumni-notification-tabs\nbutton[data-active=\"true\"] {\n  color:\n    var(--app-text);\n}\n\n.alumni-notification-tabs\nbutton[data-active=\"true\"]::after {\n  right:\n    0 !important;\n  left:\n    0 !important;\n  height:\n    2px !important;\n  background:\n    var(--app-accent);\n}\n\n/* ======================================================\n   UNREAD / ROWS — flat\n   ====================================================== */\n\n.alumni-notification-unread-summary {\n  min-height:\n    40px !important;\n  padding:\n    0 1px;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 76%,\n      transparent\n    ) !important;\n  background:\n    transparent !important;\n}\n\n.alumni-notification-day {\n  min-width: 0;\n  padding-top:\n    17px !important;\n}\n\n.alumni-notification-day > h2 {\n  margin:\n    0 0 5px 1px !important;\n  font-size:\n    9px !important;\n  letter-spacing:\n    .15em !important;\n}\n\n.alumni-notification-row {\n  min-width: 0;\n  overflow:\n    hidden;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n  animation:\n    alumniNotificationRowReveal\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-notification-row:nth-child(2) {\n  animation-delay:\n    .025s;\n}\n.alumni-notification-row:nth-child(3) {\n  animation-delay:\n    .05s;\n}\n.alumni-notification-row:nth-child(4) {\n  animation-delay:\n    .075s;\n}\n.alumni-notification-row:nth-child(5) {\n  animation-delay:\n    .10s;\n}\n\n.alumni-notification-row[data-unread=\"true\"] {\n  background:\n    linear-gradient(\n      90deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 4%,\n        transparent\n      ),\n      transparent 52%\n    ) !important;\n}\n\n.alumni-notification-main {\n  width:\n    100% !important;\n  max-width:\n    100% !important;\n  min-width:\n    0 !important;\n  overflow:\n    hidden;\n}\n\n.alumni-notification-copy {\n  min-width:\n    0 !important;\n  overflow-wrap:\n    anywhere;\n  word-break:\n    normal;\n}\n\n.alumni-notification-copy\n> span {\n  display:\n    block;\n  max-width:\n    100%;\n}\n\n.alumni-notification-preview {\n  flex:\n    0 0 auto;\n}\n\n/* ======================================================\n   PREFERENCES — full-screen, scrollable, no modal box\n   ====================================================== */\n\n.alumni-notification-settings-backdrop {\n  position:\n    fixed !important;\n  inset:\n    0 !important;\n  z-index:\n    2147482400 !important;\n  display:\n    block !important;\n  width:\n    100%;\n  height:\n    100dvh;\n  padding:\n    0 !important;\n  overflow-x:\n    hidden;\n  overflow-y:\n    auto !important;\n  overscroll-behavior:\n    contain;\n  background:\n    var(--app-bg) !important;\n  backdrop-filter:\n    none !important;\n  -webkit-backdrop-filter:\n    none !important;\n  -webkit-overflow-scrolling:\n    touch;\n  animation:\n    alumniPreferencesBackdropIn\n    .20s\n    ease-out\n    both;\n}\n\n.alumni-notification-settings {\n  display:\n    block;\n  width:\n    100% !important;\n  min-width:\n    0;\n  min-height:\n    100dvh !important;\n  max-width:\n    none !important;\n  max-height:\n    none !important;\n  overflow:\n    visible !important;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    var(--app-bg) !important;\n  box-shadow:\n    none !important;\n  animation:\n    alumniPreferencesPageIn\n    .36s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-notification-settings > header {\n  position:\n    sticky;\n  top:\n    0;\n  z-index:\n    5;\n  display:\n    grid !important;\n  grid-template-columns:\n    42px minmax(0, 1fr) !important;\n  align-items:\n    center !important;\n  justify-content:\n    initial !important;\n  gap:\n    10px !important;\n  min-height:\n    66px;\n  padding:\n    calc(\n      env(safe-area-inset-top) +\n      8px\n    )\n    14px\n    9px !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 76%,\n      transparent\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 86%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n  -webkit-backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n}\n\n.alumni-notification-settings\n> header\n> button {\n  grid-column:\n    1;\n  grid-row:\n    1;\n  display:\n    inline-flex !important;\n  width:\n    40px !important;\n  height:\n    40px !important;\n  align-items:\n    center;\n  justify-content:\n    center;\n  padding:\n    0;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    14px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 72%,\n      transparent\n    ) !important;\n  color:\n    var(--app-text) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease;\n}\n\n.alumni-notification-settings\n> header\n> button:active {\n  transform:\n    scale(.93);\n  background:\n    var(--app-soft) !important;\n}\n\n.alumni-notification-settings\n> header\n> div {\n  grid-column:\n    2;\n  grid-row:\n    1;\n  min-width:\n    0;\n}\n\n.alumni-notification-settings\n> header p {\n  display:\n    none !important;\n}\n\n.alumni-notification-settings\n> header h2 {\n  margin:\n    0 !important;\n  overflow:\n    hidden;\n  color:\n    var(--app-text) !important;\n  font-size:\n    17px !important;\n  font-weight:\n    930 !important;\n  line-height:\n    1.1;\n  letter-spacing:\n    -.025em;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-notification-preferences-list {\n  width:\n    min(\n      100%,\n      660px\n    );\n  margin:\n    0 auto;\n  padding:\n    10px 16px\n    max(\n      34px,\n      env(safe-area-inset-bottom)\n    ) !important;\n}\n\n.alumni-notification-preferences-list\n> button {\n  position:\n    relative;\n  display:\n    flex;\n  width:\n    100%;\n  min-width:\n    0;\n  min-height:\n    68px !important;\n  align-items:\n    center;\n  justify-content:\n    space-between;\n  gap:\n    14px !important;\n  padding:\n    10px 1px !important;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n  text-align:\n    left;\n  animation:\n    alumniPreferenceRowIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  transition:\n    opacity 150ms ease;\n}\n\n.alumni-notification-preferences-list\n> button:nth-child(2) {\n  animation-delay:\n    .025s;\n}\n.alumni-notification-preferences-list\n> button:nth-child(3) {\n  animation-delay:\n    .05s;\n}\n.alumni-notification-preferences-list\n> button:nth-child(4) {\n  animation-delay:\n    .075s;\n}\n.alumni-notification-preferences-list\n> button:nth-child(5) {\n  animation-delay:\n    .10s;\n}\n.alumni-notification-preferences-list\n> button:nth-child(6) {\n  animation-delay:\n    .125s;\n}\n.alumni-notification-preferences-list\n> button:nth-child(7) {\n  animation-delay:\n    .15s;\n}\n\n.alumni-notification-preferences-list\n> button\n> span {\n  min-width:\n    0 !important;\n  max-width:\n    calc(\n      100% - 58px\n    );\n}\n\n.alumni-notification-preferences-list\nstrong {\n  display:\n    block;\n  overflow:\n    hidden;\n  color:\n    var(--app-text);\n  font-size:\n    13px !important;\n  font-weight:\n    850 !important;\n  line-height:\n    1.25;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-notification-preferences-list\nsmall {\n  display:\n    block;\n  margin-top:\n    3px !important;\n  overflow:\n    hidden;\n  color:\n    var(--app-muted-2);\n  font-size:\n    10.5px !important;\n  line-height:\n    1.35 !important;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-notification-preferences-list\ni {\n  width:\n    42px !important;\n  height:\n    24px !important;\n  flex:\n    0 0 42px !important;\n  transition:\n    background-color .18s ease,\n    transform .16s\n      cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-notification-preferences-list\n> button:active\ni {\n  transform:\n    scale(.94);\n}\n\n/* ======================================================\n   MOBILE 360–430\n   ====================================================== */\n\n@media (max-width: 560px) {\n  .alumni-notifications-pro {\n    width:\n      100% !important;\n    max-width:\n      100% !important;\n  }\n\n  .alumni-notifications-header {\n    align-items:\n      center !important;\n  }\n\n  .alumni-notifications-header h1 {\n    font-size:\n      27px !important;\n  }\n\n  .alumni-notification-tabs {\n    gap:\n      18px !important;\n  }\n\n  .alumni-notification-main {\n    grid-template-columns:\n      50px\n      minmax(0, 1fr)\n      auto !important;\n    gap:\n      9px !important;\n    padding:\n      10px 1px !important;\n  }\n\n  .alumni-notification-preview {\n    width:\n      38px !important;\n    height:\n      38px !important;\n  }\n\n  .alumni-notification-preferences-list {\n    padding-inline:\n      15px !important;\n  }\n}\n\n@media (max-width: 374px) {\n  .alumni-notification-tabs {\n    gap:\n      16px !important;\n  }\n\n  .alumni-notification-tabs button {\n    font-size:\n      11px !important;\n  }\n\n  .alumni-notification-preferences-list\n  strong {\n    font-size:\n      12.5px !important;\n  }\n\n  .alumni-notification-preferences-list\n  small {\n    font-size:\n      10px !important;\n  }\n}\n\n/* ======================================================\n   MOTION\n   ====================================================== */\n\n@keyframes alumniNotificationsReveal {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(\n        0,\n        7px,\n        0\n      );\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(\n        0,\n        0,\n        0\n      );\n  }\n}\n\n@keyframes alumniNotificationRowReveal {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(\n        0,\n        5px,\n        0\n      );\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(\n        0,\n        0,\n        0\n      );\n  }\n}\n\n@keyframes alumniPreferencesBackdropIn {\n  from {\n    opacity: 0;\n  }\n  to {\n    opacity: 1;\n  }\n}\n\n@keyframes alumniPreferencesPageIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(\n        0,\n        10px,\n        0\n      );\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(\n        0,\n        0,\n        0\n      );\n  }\n}\n\n@keyframes alumniPreferenceRowIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(\n        6px,\n        0,\n        0\n      );\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(\n        0,\n        0,\n        0\n      );\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-notifications-header,\n  .alumni-notification-tabs,\n  .alumni-notification-row,\n  .alumni-notification-settings-backdrop,\n  .alumni-notification-settings,\n  .alumni-notification-preferences-list\n  > button {\n    animation:\n      none !important;\n  }\n\n  .alumni-notification-header-action,\n  .alumni-notification-icon-button,\n  .alumni-notification-settings\n  > header\n  > button,\n  .alumni-notification-preferences-list\n  i {\n    transition:\n      none !important;\n  }\n}\n\n/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_2 */\n";

/* ======================================================
   5. PARSER TSX SI TYPESCRIPT ESTÁ DISPONIBLE
   ====================================================== */

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      PAGE,
      page,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics ||
    [];

  if (
    diagnostics.length
  ) {
    const first =
      diagnostics[0];

    fail(
      `${PAGE}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: notifications válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error ===
        "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(
  abs(PAGE),
  page,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ BLOQUE 2 aplicado."
);
console.log(
  "✅ Notificaciones sin caja pesada."
);
console.log(
  "✅ Tabs sin desborde."
);
console.log(
  "✅ Preferencias ahora es pantalla completa."
);
console.log(
  "✅ Preferencias sí scrollea."
);
console.log(
  "✅ Botón atrás agregado."
);
console.log(
  "✅ Motion explícito agregado."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
