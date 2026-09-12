const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const EVENTS_PAGE =
  "src/app/events/page.tsx";
const COMMUNITY_PAGE =
  "src/app/community/page.tsx";

const EVENTS_CSS =
  "src/app/events/events-mobile-pro-4-0.css";
const COMMUNITY_CSS =
  "src/app/community/community-mobile-pro-4-0.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
    );
  }

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const bak =
    abs(rel) +
    ".before-mobile-pro-4-0.bak";

  if (!fs.existsSync(bak)) {
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
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail(
      `No encontré ${label}. No escribí cambios.`
    );
  }

  return source.replace(
    before,
    after
  );
}

if (!fs.existsSync(abs("package.json"))) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let events =
  read(EVENTS_PAGE);
let community =
  read(COMMUNITY_PAGE);

backup(
  EVENTS_PAGE,
  events
);
backup(
  COMMUNITY_PAGE,
  community
);

/* =====================================================
   EVENTS
   - stop importing the prior weird visual layer
   - add the strict mobile-first layer
   ===================================================== */

events =
  events.replace(
    'import "./events-motion-3-0.css";\n',
    ""
  );

if (
  !events.includes(
    'import "./events-mobile-pro-4-0.css";'
  )
) {
  events =
    replaceRequired(
      events,
      'import "../interior-ui-1-0.css";',
      'import "../interior-ui-1-0.css";\nimport "./events-mobile-pro-4-0.css";',
      "import base de Eventos"
    );
}

events =
  replaceRequired(
    events,
    'className="alumni-events-2 mx-auto w-full max-w-[920px]"',
    'className="alumni-events-2 alumni-events-mobile-pro mx-auto w-full max-w-[920px]"',
    "clase raíz de Eventos"
  );

/* =====================================================
   COMMUNITY
   ===================================================== */

community =
  community.replace(
    'import "./community-motion-3-0.css";\n',
    ""
  );

if (
  !community.includes(
    'import "./community-mobile-pro-4-0.css";'
  )
) {
  community =
    replaceRequired(
      community,
      'import "../interior-ui-1-0.css";',
      'import "../interior-ui-1-0.css";\nimport "./community-mobile-pro-4-0.css";',
      "import base de Comunidades"
    );
}

community =
  replaceRequired(
    community,
    'className="alumni-community-2 mx-auto w-full max-w-[920px]"',
    'className="alumni-community-2 alumni-community-mobile-pro mx-auto w-full max-w-[920px]"',
    "clase raíz de Comunidades"
  );

/* Markers */
if (
  !events.includes(
    "ALUMNI_EVENTS_MOBILE_PRO_4_0"
  )
) {
  events +=
    "\n/* ALUMNI_EVENTS_MOBILE_PRO_4_0 */\n";
}

if (
  !community.includes(
    "ALUMNI_COMMUNITIES_MOBILE_PRO_4_0"
  )
) {
  community +=
    "\n/* ALUMNI_COMMUNITIES_MOBILE_PRO_4_0 */\n";
}

const eventsCss =
  "/*\n * ALUMNI_EVENTS_MOBILE_PRO_4_0\n * /events — phone-first, clean, professional.\n * Only the main Events page is affected.\n */\n\n.alumni-events-mobile-pro {\n  width: 100%;\n  max-width: 680px !important;\n  min-width: 0;\n  margin-inline: auto;\n  overflow-x: clip;\n  padding-top: 0 !important;\n  padding-bottom:\n    calc(\n      104px +\n      env(safe-area-inset-bottom)\n    ) !important;\n}\n\n/* ===== Header ===== */\n\n.alumni-events-mobile-pro .events2-hero {\n  display: flex !important;\n  min-height: 66px !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  gap: 12px !important;\n  padding: 8px 1px 10px !important;\n  overflow: visible !important;\n  border: 0 !important;\n  background: transparent !important;\n  animation:\n    alumniEventsMobileEnter\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-events-mobile-pro .events2-hero::before,\n.alumni-events-mobile-pro .events2-hero::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro .events2-hero > div {\n  min-width: 0;\n}\n\n.alumni-events-mobile-pro .events2-hero h1 {\n  margin: 0 !important;\n  color: var(--app-text) !important;\n  font-size: 29px !important;\n  font-weight: 950 !important;\n  line-height: 1 !important;\n  letter-spacing: -.048em !important;\n}\n\n.alumni-events-mobile-pro .events2-primary-action {\n  display: inline-flex !important;\n  width: 40px !important;\n  min-width: 40px !important;\n  height: 40px !important;\n  min-height: 40px !important;\n  align-items: center !important;\n  justify-content: center !important;\n  gap: 0 !important;\n  padding: 0 !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    ) !important;\n  border-radius: 14px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 82%,\n      transparent\n    ) !important;\n  color: var(--app-accent) !important;\n  box-shadow:\n    0 7px 20px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 12%,\n      transparent\n    ) !important;\n  font-size: 0 !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease,\n    border-color 150ms ease !important;\n}\n\n.alumni-events-mobile-pro .events2-primary-action svg {\n  width: 18px;\n  height: 18px;\n  transform: none !important;\n  transition:\n    transform 160ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-events-mobile-pro .events2-primary-action:active {\n  transform: scale(.92);\n  background: var(--app-soft) !important;\n}\n\n.alumni-events-mobile-pro .events2-primary-action:active svg {\n  transform: rotate(90deg) !important;\n}\n\n/* ===== Tabs + search ===== */\n\n.alumni-events-mobile-pro .events2-navigation {\n  display: block !important;\n  width: 100% !important;\n  min-width: 0;\n  min-height: 0 !important;\n  padding: 0 0 10px !important;\n  border: 0 !important;\n  background: transparent !important;\n  animation:\n    alumniEventsMobileEnter\n    .36s\n    .035s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-events-mobile-pro .events2-tabs {\n  display: grid !important;\n  width: 100%;\n  grid-template-columns: repeat(3,minmax(0,1fr));\n  gap: 0 !important;\n  padding: 3px !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 4%,\n      var(--app-border)\n    );\n  border-radius: 15px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-soft) 72%,\n      transparent\n    );\n}\n\n.alumni-events-mobile-pro .events2-tabs button {\n  position: relative;\n  min-width: 0;\n  min-height: 39px !important;\n  padding: 0 7px !important;\n  border: 0 !important;\n  border-radius: 12px !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  font-size: 10.5px !important;\n  font-weight: 820 !important;\n  line-height: 1 !important;\n  white-space: nowrap;\n  transition:\n    color 150ms ease,\n    background-color 150ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-events-mobile-pro\n.events2-tabs button::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro\n.events2-tabs button[data-active=\"true\"] {\n  background: var(--app-surface) !important;\n  color: var(--app-text) !important;\n  box-shadow:\n    0 3px 10px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 10%,\n      transparent\n    );\n}\n\n.alumni-events-mobile-pro\n.events2-tabs button:active {\n  transform: scale(.97);\n}\n\n.alumni-events-mobile-pro .events2-search {\n  position: relative;\n  display: flex !important;\n  width: 100% !important;\n  max-width: none !important;\n  min-height: 47px !important;\n  align-items: center !important;\n  gap: 9px !important;\n  margin-top: 7px;\n  padding: 0 3px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  transition:\n    border-color 150ms ease,\n    color 150ms ease !important;\n}\n\n.alumni-events-mobile-pro .events2-search::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro .events2-search:focus-within {\n  border-bottom-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 55%,\n      var(--app-border)\n    ) !important;\n  color: var(--app-accent) !important;\n}\n\n.alumni-events-mobile-pro .events2-search input {\n  width: 100%;\n  min-width: 0;\n  height: 45px;\n  border: 0;\n  outline: 0;\n  background: transparent !important;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 560;\n}\n\n.alumni-events-mobile-pro .events2-search input::placeholder {\n  color: var(--app-muted-3);\n}\n\n/* ===== List ===== */\n\n.alumni-events-mobile-pro .events2-list {\n  display: block;\n  width: 100%;\n  min-width: 0;\n  margin-top: 2px;\n  border: 0 !important;\n  background: transparent !important;\n}\n\n.alumni-events-mobile-pro .events2-row {\n  position: relative;\n  display: grid !important;\n  width: 100%;\n  min-width: 0;\n  min-height: 86px !important;\n  grid-template-columns:\n    48px\n    minmax(0,1fr)\n    auto !important;\n  align-items: center !important;\n  gap: 11px !important;\n  padding: 10px 1px !important;\n  overflow: hidden;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 78%,\n      transparent\n    ) !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  box-shadow: none !important;\n  animation:\n    alumniEventsMobileRowIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  transition:\n    background-color 140ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-events-mobile-pro .events2-row:nth-child(1) { animation-delay: .03s; }\n.alumni-events-mobile-pro .events2-row:nth-child(2) { animation-delay: .055s; }\n.alumni-events-mobile-pro .events2-row:nth-child(3) { animation-delay: .08s; }\n.alumni-events-mobile-pro .events2-row:nth-child(4) { animation-delay: .105s; }\n.alumni-events-mobile-pro .events2-row:nth-child(5) { animation-delay: .13s; }\n.alumni-events-mobile-pro .events2-row:nth-child(6) { animation-delay: .155s; }\n\n.alumni-events-mobile-pro .events2-row::before,\n.alumni-events-mobile-pro .events2-row::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro .events2-row:active {\n  transform: scale(.994);\n  background:\n    color-mix(\n      in srgb,\n      var(--app-soft) 52%,\n      transparent\n    ) !important;\n}\n\n.alumni-events-mobile-pro .events2-date {\n  display: flex;\n  width: 46px;\n  height: 54px;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  padding: 0 !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 4%,\n      var(--app-border)\n    );\n  border-radius: 14px;\n  background: var(--app-soft);\n}\n\n.alumni-events-mobile-pro .events2-date::before {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro .events2-date span {\n  color: var(--app-accent) !important;\n  font-size: 8px !important;\n  font-weight: 900 !important;\n  line-height: 1;\n  letter-spacing: .08em !important;\n  text-transform: uppercase;\n}\n\n.alumni-events-mobile-pro .events2-date strong {\n  margin-top: 4px !important;\n  color: var(--app-text) !important;\n  font-family: inherit !important;\n  font-size: 20px !important;\n  font-weight: 950 !important;\n  line-height: .92 !important;\n}\n\n.alumni-events-mobile-pro .events2-row-main {\n  display: block;\n  min-width: 0 !important;\n  overflow: hidden;\n}\n\n.alumni-events-mobile-pro .events2-row-kicker {\n  display: block !important;\n  max-width: 100%;\n  overflow: hidden;\n  color: var(--app-muted-2) !important;\n  font-size: 8px !important;\n  font-weight: 830 !important;\n  line-height: 1.25;\n  letter-spacing: .07em !important;\n  text-overflow: ellipsis;\n  text-transform: uppercase;\n  white-space: nowrap;\n}\n\n.alumni-events-mobile-pro .events2-row-title {\n  display: block;\n  max-width: 100%;\n  margin-top: 4px !important;\n  overflow: hidden;\n  color: var(--app-text) !important;\n  font-size: 14px !important;\n  font-weight: 880 !important;\n  line-height: 1.25;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-events-mobile-pro .events2-row-meta {\n  display: flex !important;\n  min-width: 0;\n  max-width: 100%;\n  align-items: center;\n  gap: 4px !important;\n  margin-top: 5px !important;\n  overflow: hidden;\n  color: var(--app-muted-2) !important;\n  font-size: 9px !important;\n  line-height: 1.2;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-events-mobile-pro .events2-row-meta svg {\n  width: 11px;\n  height: 11px;\n  flex: 0 0 auto;\n}\n\n.alumni-events-mobile-pro .events2-row-side {\n  display: flex !important;\n  min-width: 18px;\n  align-items: center !important;\n  justify-content: flex-end !important;\n  gap: 5px !important;\n  color: var(--app-muted-3) !important;\n}\n\n.alumni-events-mobile-pro .events2-row-side em {\n  display: none !important;\n}\n\n.alumni-events-mobile-pro .events2-row-side svg {\n  width: 16px;\n  height: 16px;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 150ms ease !important;\n}\n\n.alumni-events-mobile-pro .events2-row:active\n.events2-row-side svg {\n  transform: translateX(2px);\n  color: var(--app-accent);\n}\n\n/* ===== Empty ===== */\n\n.alumni-events-mobile-pro .events2-empty {\n  display: grid;\n  justify-items: center;\n  gap: 7px;\n  min-height: 240px;\n  place-content: center;\n  padding: 42px 12px !important;\n  color: var(--app-muted-2) !important;\n  text-align: center;\n  animation:\n    alumniEventsMobileEnter\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-events-mobile-pro .events2-empty svg {\n  margin: 0 !important;\n  color: var(--app-muted-3) !important;\n  filter: none !important;\n  animation: none !important;\n}\n\n.alumni-events-mobile-pro .events2-empty strong {\n  color: var(--app-text-soft) !important;\n  font-size: 12px !important;\n  font-weight: 820 !important;\n}\n\n/* ===== Create editor — mobile full screen ===== */\n\n.alumni-events-mobile-pro .events2-editor-backdrop {\n  position: fixed !important;\n  inset: 0 !important;\n  z-index: 2147482800 !important;\n  display: block !important;\n  padding: 0 !important;\n  overflow: hidden;\n  background: var(--app-bg) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  animation:\n    alumniEventsEditorBackdropIn\n    .18s ease-out both;\n}\n\n.alumni-events-mobile-pro .events2-editor {\n  display: flex !important;\n  width: 100% !important;\n  height: 100dvh !important;\n  max-width: none !important;\n  max-height: 100dvh !important;\n  flex-direction: column;\n  overflow: hidden;\n  border: 0 !important;\n  border-radius: 0 !important;\n  background: var(--app-bg) !important;\n  box-shadow: none !important;\n  animation:\n    alumniEventsEditorIn\n    .28s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-events-mobile-pro .events2-editor-header {\n  position: sticky !important;\n  top: 0;\n  z-index: 6;\n  display: grid !important;\n  grid-template-columns:\n    40px\n    minmax(0,1fr)\n    auto !important;\n  min-height: 62px;\n  align-items: center !important;\n  gap: 8px !important;\n  padding:\n    max(8px,env(safe-area-inset-top))\n    14px\n    8px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 74%,\n      transparent\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 87%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(16px);\n  -webkit-backdrop-filter:\n    blur(16px);\n}\n\n.alumni-events-mobile-pro .events2-editor-back {\n  display: inline-flex !important;\n  width: 38px !important;\n  height: 38px !important;\n  min-height: 38px !important;\n  align-items: center;\n  justify-content: center;\n  gap: 0 !important;\n  padding: 0 !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 13px !important;\n  background: var(--app-soft) !important;\n  color: var(--app-text) !important;\n  font-size: 0 !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-events-mobile-pro .events2-editor-back:active {\n  transform: scale(.92);\n}\n\n.alumni-events-mobile-pro .events2-editor-header > div {\n  min-width: 0;\n}\n\n.alumni-events-mobile-pro .events2-editor-header h2 {\n  margin: 0 !important;\n  overflow: hidden;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 930 !important;\n  line-height: 1.1;\n  letter-spacing: -.025em !important;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-events-mobile-pro .events2-editor-progress {\n  margin: 0 !important;\n  color: var(--app-muted-3) !important;\n  font-size: 8px !important;\n  font-weight: 820 !important;\n  letter-spacing: .08em !important;\n  white-space: nowrap;\n}\n\n.alumni-events-mobile-pro .events2-editor-body {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-x: hidden;\n  overflow-y: auto !important;\n  overscroll-behavior: contain;\n  padding:\n    0 15px 30px !important;\n  -webkit-overflow-scrolling: touch;\n}\n\n.alumni-events-mobile-pro .events2-editor-section {\n  display: block !important;\n  width: 100%;\n  max-width: none !important;\n  margin: 0 !important;\n  padding: 23px 0 25px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  animation:\n    alumniEventsEditorSectionIn\n    .31s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-events-mobile-pro .events2-editor-section:last-child {\n  border-bottom: 0 !important;\n}\n\n.alumni-events-mobile-pro .events2-step {\n  display: flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n  margin-bottom: 17px;\n  padding: 0 !important;\n  border: 0 !important;\n}\n\n.alumni-events-mobile-pro .events2-step > strong {\n  display: inline-flex;\n  min-width: 25px;\n  height: 25px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 9px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  color: var(--app-accent) !important;\n  font-family: inherit !important;\n  font-size: 8px !important;\n  font-weight: 900 !important;\n  text-shadow: none !important;\n}\n\n.alumni-events-mobile-pro .events2-step b {\n  color: var(--app-text) !important;\n  font-size: 12px !important;\n  font-weight: 900 !important;\n}\n\n.alumni-events-mobile-pro .events2-fields {\n  display: grid !important;\n  gap: 18px !important;\n}\n\n.alumni-events-mobile-pro .events2-two-columns {\n  display: grid !important;\n  grid-template-columns: 1fr !important;\n  gap: 18px !important;\n}\n\n.alumni-events-mobile-pro .events2-field {\n  min-width: 0;\n}\n\n.alumni-events-mobile-pro .events2-field > span,\n.alumni-events-mobile-pro .events2-choice-label {\n  color: var(--app-muted-2) !important;\n  font-size: 8.5px !important;\n  font-weight: 880 !important;\n  letter-spacing: .10em !important;\n  text-transform: uppercase;\n}\n\n.alumni-events-mobile-pro .events2-field input,\n.alumni-events-mobile-pro .events2-field textarea,\n.alumni-events-mobile-pro .events2-field select {\n  width: 100%;\n  min-width: 0;\n  margin-top: 6px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 0 !important;\n  outline: 0;\n  background: transparent !important;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 570;\n  transition:\n    border-color 150ms ease !important;\n}\n\n.alumni-events-mobile-pro .events2-field input,\n.alumni-events-mobile-pro .events2-field select {\n  min-height: 44px !important;\n}\n\n.alumni-events-mobile-pro .events2-field textarea {\n  min-height: 88px !important;\n  padding: 10px 0 !important;\n  resize: none !important;\n  line-height: 1.45;\n}\n\n.alumni-events-mobile-pro .events2-field input:focus,\n.alumni-events-mobile-pro .events2-field textarea:focus,\n.alumni-events-mobile-pro .events2-field select:focus {\n  border-bottom-color: var(--app-accent) !important;\n}\n\n.alumni-events-mobile-pro .events2-field-large input {\n  font-size: 17px !important;\n  font-weight: 700 !important;\n}\n\n.alumni-events-mobile-pro .events2-field > small {\n  right: 0 !important;\n  bottom: 9px !important;\n  color: var(--app-muted-3) !important;\n  font-size: 8px !important;\n}\n\n.alumni-events-mobile-pro .events2-field-icon > div,\n.alumni-events-mobile-pro .events2-capacity > div {\n  margin-top: 6px !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n}\n\n.alumni-events-mobile-pro .events2-field-icon > div:focus-within,\n.alumni-events-mobile-pro .events2-capacity > div:focus-within {\n  border-bottom-color: var(--app-accent) !important;\n}\n\n.alumni-events-mobile-pro .events2-type-grid {\n  display: flex !important;\n  flex-wrap: wrap !important;\n  gap: 7px !important;\n  margin-top: 10px !important;\n}\n\n.alumni-events-mobile-pro .events2-type-grid button {\n  min-height: 36px !important;\n  gap: 5px !important;\n  padding: 0 10px !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 999px !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  font-size: 9.5px !important;\n  font-weight: 820 !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    border-color 150ms ease,\n    background-color 150ms ease,\n    color 150ms ease !important;\n}\n\n.alumni-events-mobile-pro .events2-type-grid button::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-events-mobile-pro\n.events2-type-grid button[data-active=\"true\"] {\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 35%,\n      var(--app-border)\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      transparent\n    ) !important;\n  color: var(--app-accent) !important;\n}\n\n.alumni-events-mobile-pro\n.events2-type-grid button:active {\n  transform: scale(.95);\n}\n\n.alumni-events-mobile-pro .events2-visibility {\n  border-top:\n    1px solid\n    var(--app-border) !important;\n}\n\n.alumni-events-mobile-pro .events2-visibility button {\n  min-height: 64px !important;\n  padding: 0 2px !important;\n  background: transparent !important;\n  transition:\n    background-color 150ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-events-mobile-pro\n.events2-visibility button[data-active=\"true\"] {\n  background:\n    linear-gradient(\n      90deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 4%,\n        transparent\n      ),\n      transparent 70%\n    ) !important;\n}\n\n.alumni-events-mobile-pro\n.events2-visibility button:active {\n  transform: scale(.995);\n}\n\n.alumni-events-mobile-pro .events2-editor-footer {\n  position: sticky;\n  bottom: 0;\n  z-index: 6;\n  min-height: 67px !important;\n  padding:\n    9px 14px\n    max(9px,env(safe-area-inset-bottom))\n    !important;\n  border-top:\n    1px solid\n    var(--app-border) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 88%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(16px);\n  -webkit-backdrop-filter:\n    blur(16px);\n}\n\n.alumni-events-mobile-pro\n.events2-editor-footer > span {\n  max-width: 48%;\n  color: var(--app-muted-2) !important;\n  font-size: 8px !important;\n  line-height: 1.3;\n}\n\n.alumni-events-mobile-pro\n.events2-editor-footer button {\n  min-height: 41px !important;\n  padding: 0 15px !important;\n  border: 0 !important;\n  border-radius: 999px !important;\n  background: var(--app-accent-fill) !important;\n  color: var(--app-on-accent) !important;\n  font-size: 10px !important;\n  font-weight: 900 !important;\n  box-shadow:\n    0 7px 20px\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      transparent\n    );\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    opacity 150ms ease !important;\n}\n\n.alumni-events-mobile-pro\n.events2-editor-footer button:not(:disabled):active {\n  transform: scale(.95);\n}\n\n/* ===== Small phone ===== */\n\n@media (max-width: 374px) {\n  .alumni-events-mobile-pro .events2-hero h1 {\n    font-size: 27px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-tabs button {\n    font-size: 10px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-row {\n    grid-template-columns:\n      45px\n      minmax(0,1fr)\n      16px !important;\n    gap: 9px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-date {\n    width: 43px;\n    height: 52px;\n  }\n}\n\n/* ===== Desktop secondary ===== */\n\n@media (min-width: 700px) {\n  .alumni-events-mobile-pro {\n    max-width: 760px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-primary-action {\n    width: auto !important;\n    min-width: 0 !important;\n    padding: 0 14px !important;\n    gap: 7px !important;\n    font-size: 10px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-navigation {\n    display: grid !important;\n    grid-template-columns: minmax(0,1fr) 220px;\n    align-items: end;\n    gap: 20px !important;\n  }\n\n  .alumni-events-mobile-pro .events2-search {\n    margin-top: 0;\n  }\n\n  .alumni-events-mobile-pro .events2-editor {\n    max-width: 720px !important;\n    margin: 0 auto;\n  }\n}\n\n/* ===== Motion ===== */\n\n@keyframes alumniEventsMobileEnter {\n  from {\n    opacity: 0;\n    transform: translate3d(0,6px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsMobileRowIn {\n  from {\n    opacity: 0;\n    transform: translate3d(6px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsEditorBackdropIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n@keyframes alumniEventsEditorIn {\n  from {\n    opacity: 0;\n    transform: translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsEditorSectionIn {\n  from {\n    opacity: 0;\n    transform: translate3d(0,6px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-events-mobile-pro .events2-hero,\n  .alumni-events-mobile-pro .events2-navigation,\n  .alumni-events-mobile-pro .events2-row,\n  .alumni-events-mobile-pro .events2-empty,\n  .alumni-events-mobile-pro .events2-editor-backdrop,\n  .alumni-events-mobile-pro .events2-editor,\n  .alumni-events-mobile-pro .events2-editor-section {\n    animation: none !important;\n  }\n\n  .alumni-events-mobile-pro button,\n  .alumni-events-mobile-pro input,\n  .alumni-events-mobile-pro textarea,\n  .alumni-events-mobile-pro select,\n  .alumni-events-mobile-pro svg {\n    transition: none !important;\n  }\n}\n\n/* ALUMNI_EVENTS_MOBILE_PRO_4_0 */\n";

const communityCss =
  "/*\n * ALUMNI_COMMUNITIES_MOBILE_PRO_4_0\n * /community — phone-first, clean, professional.\n * Only the main Communities page is affected.\n */\n\n.alumni-community-mobile-pro {\n  width: 100%;\n  max-width: 680px !important;\n  min-width: 0;\n  margin-inline: auto;\n  overflow-x: clip;\n  padding-top: 0 !important;\n  padding-bottom:\n    calc(\n      104px +\n      env(safe-area-inset-bottom)\n    ) !important;\n}\n\n/* ===== Header ===== */\n\n.alumni-community-mobile-pro .community2-hero {\n  display: flex !important;\n  min-height: 66px !important;\n  align-items: center !important;\n  justify-content: space-between !important;\n  flex-direction: row !important;\n  gap: 12px !important;\n  padding: 8px 1px 10px !important;\n  overflow: visible !important;\n  border: 0 !important;\n  background: transparent !important;\n  animation:\n    alumniCommunitiesMobileEnter\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-community-mobile-pro .community2-hero::before,\n.alumni-community-mobile-pro .community2-hero::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-community-mobile-pro .community2-hero > div {\n  min-width: 0;\n}\n\n.alumni-community-mobile-pro .community2-hero h1 {\n  margin: 0 !important;\n  color: var(--app-text) !important;\n  font-size: 29px !important;\n  font-weight: 950 !important;\n  line-height: 1 !important;\n  letter-spacing: -.048em !important;\n}\n\n.alumni-community-mobile-pro .community2-primary-action {\n  display: inline-flex !important;\n  width: 40px !important;\n  min-width: 40px !important;\n  height: 40px !important;\n  min-height: 40px !important;\n  align-items: center !important;\n  justify-content: center !important;\n  gap: 0 !important;\n  padding: 0 !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    ) !important;\n  border-radius: 14px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 82%,\n      transparent\n    ) !important;\n  color: var(--app-accent) !important;\n  box-shadow:\n    0 7px 20px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 12%,\n      transparent\n    ) !important;\n  font-size: 0 !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease,\n    border-color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro .community2-primary-action svg {\n  width: 18px;\n  height: 18px;\n  transform: none !important;\n  transition:\n    transform 160ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-community-mobile-pro .community2-primary-action:active {\n  transform: scale(.92);\n  background: var(--app-soft) !important;\n}\n\n.alumni-community-mobile-pro\n.community2-primary-action:active svg {\n  transform: rotate(90deg) !important;\n}\n\n/* ===== Tabs + search ===== */\n\n.alumni-community-mobile-pro .community2-navigation {\n  display: block !important;\n  width: 100% !important;\n  min-width: 0;\n  min-height: 0 !important;\n  padding: 0 0 10px !important;\n  border: 0 !important;\n  background: transparent !important;\n  animation:\n    alumniCommunitiesMobileEnter\n    .36s\n    .035s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-community-mobile-pro .community2-tabs {\n  display: grid !important;\n  width: 100%;\n  grid-template-columns: repeat(2,minmax(0,1fr));\n  gap: 0 !important;\n  padding: 3px !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 4%,\n      var(--app-border)\n    );\n  border-radius: 15px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-soft) 72%,\n      transparent\n    );\n}\n\n.alumni-community-mobile-pro .community2-tabs button {\n  position: relative;\n  min-width: 0;\n  min-height: 39px !important;\n  padding: 0 7px !important;\n  border: 0 !important;\n  border-radius: 12px !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  font-size: 10.5px !important;\n  font-weight: 820 !important;\n  line-height: 1 !important;\n  white-space: nowrap;\n  transition:\n    color 150ms ease,\n    background-color 150ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-community-mobile-pro\n.community2-tabs button::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-community-mobile-pro\n.community2-tabs button[data-active=\"true\"] {\n  background: var(--app-surface) !important;\n  color: var(--app-text) !important;\n  box-shadow:\n    0 3px 10px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 10%,\n      transparent\n    );\n}\n\n.alumni-community-mobile-pro\n.community2-tabs button:active {\n  transform: scale(.97);\n}\n\n.alumni-community-mobile-pro .community2-search {\n  position: relative;\n  display: flex !important;\n  width: 100% !important;\n  max-width: none !important;\n  min-height: 47px !important;\n  align-items: center !important;\n  gap: 9px !important;\n  margin-top: 7px;\n  padding: 0 3px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  transition:\n    border-color 150ms ease,\n    color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro .community2-search::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-community-mobile-pro .community2-search:focus-within {\n  border-bottom-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 55%,\n      var(--app-border)\n    ) !important;\n  color: var(--app-accent) !important;\n}\n\n.alumni-community-mobile-pro .community2-search input {\n  width: 100%;\n  min-width: 0;\n  height: 45px;\n  border: 0;\n  outline: 0;\n  background: transparent !important;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 560;\n}\n\n.alumni-community-mobile-pro .community2-search input::placeholder {\n  color: var(--app-muted-3);\n}\n\n/* ===== Community list ===== */\n\n.alumni-community-mobile-pro .community2-list {\n  display: block;\n  width: 100%;\n  min-width: 0;\n  margin-top: 2px;\n  border: 0 !important;\n}\n\n.alumni-community-mobile-pro .community2-row {\n  position: relative;\n  display: grid !important;\n  width: 100%;\n  min-width: 0;\n  min-height: 82px !important;\n  grid-template-columns:\n    43px\n    minmax(0,1fr)\n    17px !important;\n  align-items: center !important;\n  gap: 11px !important;\n  padding: 9px 1px !important;\n  overflow: hidden;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 78%,\n      transparent\n    ) !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  box-shadow: none !important;\n  animation:\n    alumniCommunitiesMobileRowIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  transition:\n    background-color 140ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-community-mobile-pro .community2-row:nth-child(1) { animation-delay: .03s; }\n.alumni-community-mobile-pro .community2-row:nth-child(2) { animation-delay: .055s; }\n.alumni-community-mobile-pro .community2-row:nth-child(3) { animation-delay: .08s; }\n.alumni-community-mobile-pro .community2-row:nth-child(4) { animation-delay: .105s; }\n.alumni-community-mobile-pro .community2-row:nth-child(5) { animation-delay: .13s; }\n.alumni-community-mobile-pro .community2-row:nth-child(6) { animation-delay: .155s; }\n\n.alumni-community-mobile-pro .community2-row::before,\n.alumni-community-mobile-pro .community2-row::after {\n  display: none !important;\n  content: none !important;\n}\n\n.alumni-community-mobile-pro .community2-row:active {\n  transform: scale(.994);\n  background:\n    color-mix(\n      in srgb,\n      var(--app-soft) 52%,\n      transparent\n    ) !important;\n}\n\n.alumni-community-mobile-pro .community2-mark {\n  display: flex !important;\n  width: 40px !important;\n  height: 40px !important;\n  align-items: center;\n  justify-content: center;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      var(--app-border)\n    ) !important;\n  border-radius: 13px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 6%,\n      var(--app-soft)\n    ) !important;\n  color: var(--app-text) !important;\n  box-shadow: none !important;\n  font-size: 12px !important;\n  font-weight: 950 !important;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    border-color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro .community2-row:active\n.community2-mark {\n  transform: scale(.96);\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 32%,\n      var(--app-border)\n    ) !important;\n}\n\n.alumni-community-mobile-pro .community2-row-main {\n  display: block;\n  min-width: 0 !important;\n  overflow: hidden;\n}\n\n.alumni-community-mobile-pro .community2-row-kicker {\n  display: flex !important;\n  max-width: 100%;\n  align-items: center;\n  gap: 3px !important;\n  overflow: hidden;\n  color: var(--app-muted-2) !important;\n  font-size: 8px !important;\n  font-weight: 830 !important;\n  line-height: 1.25;\n  letter-spacing: .07em !important;\n  text-overflow: ellipsis;\n  text-transform: uppercase;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro\n.community2-row-main > strong {\n  display: block;\n  max-width: 100%;\n  margin-top: 4px !important;\n  overflow: hidden;\n  color: var(--app-text) !important;\n  font-size: 14px !important;\n  font-weight: 880 !important;\n  line-height: 1.25;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro\n.community2-row-main > small {\n  display: block;\n  max-width: 100%;\n  margin-top: 4px !important;\n  overflow: hidden;\n  color: var(--app-muted-2) !important;\n  font-size: 9px !important;\n  line-height: 1.25;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro .community2-row > svg {\n  width: 16px;\n  height: 16px;\n  color: var(--app-muted-3) !important;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro .community2-row:active > svg {\n  transform: translateX(2px);\n  color: var(--app-accent) !important;\n}\n\n/* ===== Empty ===== */\n\n.alumni-community-mobile-pro .community2-empty {\n  display: grid;\n  justify-items: center;\n  gap: 7px;\n  min-height: 240px;\n  place-content: center;\n  padding: 42px 12px !important;\n  color: var(--app-muted-2) !important;\n  text-align: center;\n  animation:\n    alumniCommunitiesMobileEnter\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-community-mobile-pro .community2-empty svg {\n  margin: 0 !important;\n  color: var(--app-muted-3) !important;\n  filter: none !important;\n  animation: none !important;\n}\n\n.alumni-community-mobile-pro .community2-empty strong {\n  color: var(--app-text-soft) !important;\n  font-size: 12px !important;\n  font-weight: 820 !important;\n}\n\n/* ===== Create editor ===== */\n\n.alumni-community-mobile-pro .community2-editor-backdrop {\n  position: fixed !important;\n  inset: 0 !important;\n  z-index: 2147482800 !important;\n  display: block !important;\n  padding: 0 !important;\n  overflow: hidden;\n  background: var(--app-bg) !important;\n  backdrop-filter: none !important;\n  -webkit-backdrop-filter: none !important;\n  animation:\n    alumniCommunitiesEditorBackdropIn\n    .18s ease-out both;\n}\n\n.alumni-community-mobile-pro .community2-editor {\n  display: flex !important;\n  width: 100% !important;\n  height: 100dvh !important;\n  max-width: none !important;\n  max-height: 100dvh !important;\n  flex-direction: column;\n  overflow: hidden;\n  border: 0 !important;\n  border-radius: 0 !important;\n  background: var(--app-bg) !important;\n  box-shadow: none !important;\n  animation:\n    alumniCommunitiesEditorIn\n    .28s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-community-mobile-pro .community2-editor-header {\n  position: sticky !important;\n  top: 0;\n  z-index: 6;\n  display: grid !important;\n  grid-template-columns:\n    40px\n    minmax(0,1fr)\n    auto !important;\n  min-height: 62px;\n  align-items: center !important;\n  gap: 8px !important;\n  padding:\n    max(8px,env(safe-area-inset-top))\n    14px\n    8px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 74%,\n      transparent\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 87%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(16px);\n  -webkit-backdrop-filter:\n    blur(16px);\n}\n\n.alumni-community-mobile-pro .community2-editor-back {\n  grid-column: auto !important;\n  display: inline-flex !important;\n  width: 38px !important;\n  height: 38px !important;\n  min-height: 38px !important;\n  align-items: center;\n  justify-content: center;\n  gap: 0 !important;\n  padding: 0 !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 13px !important;\n  background: var(--app-soft) !important;\n  color: var(--app-text) !important;\n  font-size: 0 !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-community-mobile-pro .community2-editor-back:active {\n  transform: scale(.92);\n}\n\n.alumni-community-mobile-pro .community2-editor-header > div {\n  min-width: 0;\n}\n\n.alumni-community-mobile-pro .community2-editor-header h2 {\n  margin: 0 !important;\n  overflow: hidden;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 930 !important;\n  line-height: 1.1;\n  letter-spacing: -.025em !important;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro .community2-editor-progress {\n  margin: 0 !important;\n  color: var(--app-muted-3) !important;\n  font-size: 8px !important;\n  font-weight: 820 !important;\n  letter-spacing: .08em !important;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro .community2-editor-body {\n  flex: 1 1 auto;\n  min-height: 0;\n  overflow-x: hidden;\n  overflow-y: auto !important;\n  overscroll-behavior: contain;\n  padding:\n    0 15px 30px !important;\n  -webkit-overflow-scrolling: touch;\n}\n\n.alumni-community-mobile-pro .community2-editor-section {\n  display: block !important;\n  width: 100%;\n  max-width: none !important;\n  margin: 0 !important;\n  padding: 23px 0 25px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  animation:\n    alumniCommunitiesEditorSectionIn\n    .31s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-community-mobile-pro .community2-editor-section:last-child {\n  border-bottom: 0 !important;\n}\n\n.alumni-community-mobile-pro .community2-step {\n  display: flex !important;\n  align-items: center !important;\n  gap: 8px !important;\n  margin-bottom: 17px;\n  padding: 0 !important;\n  border: 0 !important;\n}\n\n.alumni-community-mobile-pro .community2-step > strong {\n  display: inline-flex;\n  min-width: 25px;\n  height: 25px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 9px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  color: var(--app-accent) !important;\n  font-family: inherit !important;\n  font-size: 8px !important;\n  font-weight: 900 !important;\n  text-shadow: none !important;\n}\n\n.alumni-community-mobile-pro .community2-step b {\n  color: var(--app-text) !important;\n  font-size: 12px !important;\n  font-weight: 900 !important;\n}\n\n.alumni-community-mobile-pro .community2-fields {\n  display: grid !important;\n  gap: 18px !important;\n}\n\n.alumni-community-mobile-pro .community2-field > span {\n  color: var(--app-muted-2) !important;\n  font-size: 8.5px !important;\n  font-weight: 880 !important;\n  letter-spacing: .10em !important;\n  text-transform: uppercase;\n}\n\n.alumni-community-mobile-pro .community2-field input,\n.alumni-community-mobile-pro .community2-field textarea {\n  width: 100%;\n  min-width: 0;\n  margin-top: 6px !important;\n  border: 0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 0 !important;\n  outline: 0;\n  background: transparent !important;\n  color: var(--app-text) !important;\n  font-size: 16px !important;\n  font-weight: 570;\n  transition:\n    border-color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro .community2-field input {\n  min-height: 44px !important;\n}\n\n.alumni-community-mobile-pro .community2-field textarea {\n  min-height: 88px !important;\n  padding: 10px 0 !important;\n  resize: none !important;\n  line-height: 1.45;\n}\n\n.alumni-community-mobile-pro .community2-field input:focus,\n.alumni-community-mobile-pro .community2-field textarea:focus {\n  border-bottom-color: var(--app-accent) !important;\n}\n\n.alumni-community-mobile-pro .community2-field-large input {\n  font-size: 17px !important;\n  font-weight: 700 !important;\n}\n\n.alumni-community-mobile-pro .community2-field > small {\n  right: 0 !important;\n  bottom: 9px !important;\n  color: var(--app-muted-3) !important;\n  font-size: 8px !important;\n}\n\n.alumni-community-mobile-pro .community2-category-list {\n  display: grid !important;\n  grid-template-columns:\n    repeat(2,minmax(0,1fr));\n  gap: 7px !important;\n  border: 0 !important;\n}\n\n.alumni-community-mobile-pro .community2-category-list button {\n  display: grid !important;\n  width: 100%;\n  min-width: 0;\n  grid-template-columns:\n    24px\n    minmax(0,1fr)\n    8px !important;\n  min-height: 50px !important;\n  gap: 6px !important;\n  padding: 0 9px !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius: 13px !important;\n  background: transparent !important;\n  color: var(--app-muted-2) !important;\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    border-color 150ms ease,\n    background-color 150ms ease !important;\n}\n\n.alumni-community-mobile-pro\n.community2-category-list button[data-active=\"true\"] {\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 34%,\n      var(--app-border)\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    ) !important;\n  color: var(--app-accent) !important;\n}\n\n.alumni-community-mobile-pro\n.community2-category-list button:active {\n  transform: scale(.97);\n}\n\n.alumni-community-mobile-pro\n.community2-category-list button::after {\n  width: 6px !important;\n  height: 6px !important;\n}\n\n.alumni-community-mobile-pro\n.community2-category-list strong {\n  overflow: hidden;\n  color: var(--app-text) !important;\n  font-size: 9.5px !important;\n  font-weight: 830 !important;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-community-mobile-pro .community2-context-fields {\n  display: grid !important;\n  grid-template-columns: 1fr !important;\n  gap: 17px !important;\n}\n\n.alumni-community-mobile-pro .community2-access-list {\n  display: grid !important;\n  grid-template-columns: 1fr !important;\n  border-top:\n    1px solid\n    var(--app-border) !important;\n}\n\n.alumni-community-mobile-pro .community2-access-list button {\n  min-height: 65px !important;\n  padding: 0 2px !important;\n  background: transparent !important;\n  transition:\n    background-color 150ms ease,\n    transform 140ms cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-community-mobile-pro\n.community2-access-list button[data-active=\"true\"] {\n  background:\n    linear-gradient(\n      90deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 4%,\n        transparent\n      ),\n      transparent 70%\n    ) !important;\n}\n\n.alumni-community-mobile-pro\n.community2-access-list button:active {\n  transform: scale(.995);\n}\n\n.alumni-community-mobile-pro .community2-editor-footer {\n  position: sticky;\n  bottom: 0;\n  z-index: 6;\n  min-height: 67px !important;\n  padding:\n    9px 14px\n    max(9px,env(safe-area-inset-bottom))\n    !important;\n  border-top:\n    1px solid\n    var(--app-border) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 88%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(16px);\n  -webkit-backdrop-filter:\n    blur(16px);\n}\n\n.alumni-community-mobile-pro\n.community2-editor-footer > span {\n  max-width: 48%;\n  color: var(--app-muted-2) !important;\n  font-size: 8px !important;\n  line-height: 1.3;\n}\n\n.alumni-community-mobile-pro\n.community2-editor-footer button {\n  min-height: 41px !important;\n  padding: 0 15px !important;\n  border: 0 !important;\n  border-radius: 999px !important;\n  background: var(--app-accent-fill) !important;\n  color: var(--app-on-accent) !important;\n  font-size: 10px !important;\n  font-weight: 900 !important;\n  box-shadow:\n    0 7px 20px\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      transparent\n    );\n  transition:\n    transform 140ms cubic-bezier(.2,.8,.2,1),\n    opacity 150ms ease !important;\n}\n\n.alumni-community-mobile-pro\n.community2-editor-footer button:not(:disabled):active {\n  transform: scale(.95);\n}\n\n/* ===== Small phone ===== */\n\n@media (max-width: 374px) {\n  .alumni-community-mobile-pro .community2-hero h1 {\n    font-size: 26px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-tabs button {\n    font-size: 10px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-row {\n    grid-template-columns:\n      40px\n      minmax(0,1fr)\n      15px !important;\n    gap: 9px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-mark {\n    width: 37px !important;\n    height: 37px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-category-list {\n    grid-template-columns: 1fr !important;\n  }\n}\n\n/* ===== Desktop secondary ===== */\n\n@media (min-width: 700px) {\n  .alumni-community-mobile-pro {\n    max-width: 760px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-primary-action {\n    width: auto !important;\n    min-width: 0 !important;\n    padding: 0 14px !important;\n    gap: 7px !important;\n    font-size: 10px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-navigation {\n    display: grid !important;\n    grid-template-columns: minmax(0,1fr) 220px;\n    align-items: end;\n    gap: 20px !important;\n  }\n\n  .alumni-community-mobile-pro .community2-search {\n    margin-top: 0;\n  }\n\n  .alumni-community-mobile-pro .community2-editor {\n    max-width: 720px !important;\n    margin: 0 auto;\n  }\n}\n\n/* ===== Motion ===== */\n\n@keyframes alumniCommunitiesMobileEnter {\n  from {\n    opacity: 0;\n    transform: translate3d(0,6px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunitiesMobileRowIn {\n  from {\n    opacity: 0;\n    transform: translate3d(6px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunitiesEditorBackdropIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n@keyframes alumniCommunitiesEditorIn {\n  from {\n    opacity: 0;\n    transform: translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunitiesEditorSectionIn {\n  from {\n    opacity: 0;\n    transform: translate3d(0,6px,0);\n  }\n  to {\n    opacity: 1;\n    transform: translate3d(0,0,0);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-community-mobile-pro .community2-hero,\n  .alumni-community-mobile-pro .community2-navigation,\n  .alumni-community-mobile-pro .community2-row,\n  .alumni-community-mobile-pro .community2-empty,\n  .alumni-community-mobile-pro .community2-editor-backdrop,\n  .alumni-community-mobile-pro .community2-editor,\n  .alumni-community-mobile-pro .community2-editor-section {\n    animation: none !important;\n  }\n\n  .alumni-community-mobile-pro button,\n  .alumni-community-mobile-pro input,\n  .alumni-community-mobile-pro textarea,\n  .alumni-community-mobile-pro svg {\n    transition: none !important;\n  }\n}\n\n/* ALUMNI_COMMUNITIES_MOBILE_PRO_4_0 */\n";

/* Parse TSX before writing */
try {
  const ts = require("typescript");

  for (
    const [name, source]
    of [
      [EVENTS_PAGE, events],
      [COMMUNITY_PAGE, community],
    ]
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
      const first = diagnostics[0];

      fail(
        `${name}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Eventos y Comunidades válidos"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(
  abs(EVENTS_PAGE),
  events,
  "utf8"
);

fs.writeFileSync(
  abs(COMMUNITY_PAGE),
  community,
  "utf8"
);

fs.writeFileSync(
  abs(EVENTS_CSS),
  eventsCss,
  "utf8"
);

fs.writeFileSync(
  abs(COMMUNITY_CSS),
  communityCss,
  "utf8"
);

console.log("");
console.log(
  "✅ Eventos / Comunidades Mobile Pro 4.0 aplicado."
);
console.log(
  "✅ Eliminada la capa visual rara anterior de las pantallas principales."
);
console.log(
  "✅ /events rehecho phone-first."
);
console.log(
  "✅ /community rehecho phone-first."
);
console.log(
  "✅ Crear evento y crear comunidad optimizados para teléfono."
);
console.log(
  "✅ Motion corto e intencional."
);
console.log(
  "✅ No toca /events/[id]."
);
console.log(
  "✅ No toca /community/[slug]."
);
console.log(
  "✅ No toca lógica Supabase."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
