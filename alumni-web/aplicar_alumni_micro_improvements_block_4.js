const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const MAIN =
  "src/app/events/page.tsx";

const DETAIL =
  "src/app/events/[id]/page.tsx";

const CSS =
  "src/app/events/events-motion-3-0.css";

const MARKER =
  "ALUMNI_MICRO_IMPROVEMENTS_BLOCK_4";

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
    ".before-micro-improvements-block-4.bak";

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

let main =
  read(MAIN);

let detail =
  read(DETAIL);

backup(
  MAIN,
  main
);

backup(
  DETAIL,
  detail
);

/* CSS final after Interior UI */
if (
  !main.includes(
    'import "./events-motion-3-0.css";'
  )
) {
  main =
    replaceRequired(
      main,
      'import "../interior-ui-1-0.css";',
      'import "../interior-ui-1-0.css";\nimport "./events-motion-3-0.css";',
      "import final de Events"
    );
}

if (
  !detail.includes(
    'import "../events-motion-3-0.css";'
  )
) {
  detail =
    replaceRequired(
      detail,
      'import "../../interior-ui-1-0.css";',
      'import "../../interior-ui-1-0.css";\nimport "../events-motion-3-0.css";',
      "import final de Event Detail"
    );
}

/* Keep global auto-motion away; this module owns its motion. */
main =
  replaceRequired(
    main,
    '<main className="alumni-events-2 mx-auto w-full max-w-[920px]">',
    '<main className="alumni-events-2 mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">',
    "main de Eventos"
  );

detail =
  replaceRequired(
    detail,
    '<main className="event-detail mx-auto w-full max-w-[920px]">',
    '<main className="event-detail mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">',
    "main de Event Detail"
  );

if (
  !main.includes(
    MARKER
  )
) {
  main +=
    `\n/* ${MARKER}:EVENTS_HOME */\n`;
}

if (
  !detail.includes(
    MARKER
  )
) {
  detail +=
    `\n/* ${MARKER}:EVENT_DETAIL */\n`;
}

const css =
  "/*\n * ALUMNI_MICRO_IMPROVEMENTS_BLOCK_4\n * Eventos — discovery, detail y create.\n * Mobile-first, limpio, premium, motion explícito.\n */\n\n/* =========================================================\n   BASE / SAFETY\n   ========================================================= */\n\n.alumni-events-2,\n.event-detail {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  overflow-x: clip;\n}\n\n/* =========================================================\n   EVENTS HOME — HERO\n   ========================================================= */\n\n.events2-hero {\n  position: relative;\n  isolation: isolate;\n  align-items: center !important;\n  min-height: 104px;\n  gap: 16px !important;\n  padding:\n    17px 1px 22px !important;\n  overflow: hidden;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 78%,\n      transparent\n    ) !important;\n  animation:\n    alumniEventsHeroIn\n    .48s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-hero::before {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -76px;\n  right: -64px;\n  width: 190px;\n  height: 190px;\n  border-radius: 999px;\n  background:\n    radial-gradient(\n      circle,\n      color-mix(\n        in srgb,\n        var(--app-accent) 13%,\n        transparent\n      ) 0%,\n      color-mix(\n        in srgb,\n        var(--app-accent) 5%,\n        transparent\n      ) 40%,\n      transparent 72%\n    );\n  pointer-events: none;\n  animation:\n    alumniEventsGlowFloat\n    7s\n    ease-in-out\n    infinite;\n}\n\n.events2-hero::after {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  right: 62px;\n  bottom: 18px;\n  width: 52px;\n  height: 1px;\n  background:\n    linear-gradient(\n      90deg,\n      transparent,\n      color-mix(\n        in srgb,\n        var(--app-accent) 62%,\n        transparent\n      ),\n      transparent\n    );\n  opacity: .8;\n  pointer-events: none;\n  animation:\n    alumniEventsLinePulse\n    3.2s\n    ease-in-out\n    infinite;\n}\n\n.events2-hero h1 {\n  margin:\n    0 !important;\n  color:\n    var(--app-text);\n  font-size:\n    clamp(\n      34px,\n      10vw,\n      48px\n    ) !important;\n  font-weight:\n    950 !important;\n  line-height:\n    .98 !important;\n  letter-spacing:\n    -.055em !important;\n}\n\n.events2-primary-action {\n  position: relative;\n  display:\n    inline-flex !important;\n  min-height:\n    42px !important;\n  align-items:\n    center;\n  justify-content:\n    center;\n  gap:\n    7px !important;\n  padding:\n    0 14px !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    ) !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    ) !important;\n  border-radius:\n    999px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 11%,\n      var(--app-surface)\n    ) !important;\n  color:\n    var(--app-text) !important;\n  box-shadow:\n    0 9px 25px\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    border-color 160ms ease,\n    background-color 160ms ease,\n    box-shadow 180ms ease !important;\n}\n\n.events2-primary-action svg {\n  color:\n    var(--app-accent);\n  transition:\n    transform 200ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-primary-action:hover svg {\n  transform:\n    rotate(90deg);\n}\n\n.events2-primary-action:active {\n  transform:\n    scale(.95);\n  box-shadow:\n    0 5px 15px\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    );\n}\n\n/* =========================================================\n   NAV / SEARCH\n   ========================================================= */\n\n.events2-navigation {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  gap:\n    15px !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  animation:\n    alumniEventsSoftUp\n    .48s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .05s;\n}\n\n.events2-tabs {\n  min-width: 0;\n  gap:\n    20px !important;\n}\n\n.events2-tabs button {\n  transition:\n    color 160ms ease,\n    transform 150ms cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-tabs button:active {\n  transform:\n    scale(.96);\n}\n\n.events2-tabs\nbutton[data-active=\"true\"]::after {\n  border-radius:\n    999px;\n  box-shadow:\n    0 0 12px\n    color-mix(\n      in srgb,\n      var(--app-accent) 25%,\n      transparent\n    );\n  animation:\n    alumniEventsTabIn\n    .28s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-search {\n  position: relative;\n  min-width: 0;\n  transition:\n    color 160ms ease;\n}\n\n.events2-search::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: 4px;\n  left: 0;\n  height: 1px;\n  background:\n    var(--app-border);\n  transform-origin:\n    center;\n  transition:\n    background-color 160ms ease,\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-search:focus-within {\n  color:\n    var(--app-accent);\n}\n\n.events2-search:focus-within::after {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 58%,\n      var(--app-border)\n    );\n  transform:\n    scaleX(1.03);\n}\n\n.events2-search svg {\n  transition:\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-search:focus-within svg {\n  transform:\n    scale(1.08);\n}\n\n/* =========================================================\n   EVENT LIST\n   ========================================================= */\n\n.events2-list {\n  min-width: 0;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n}\n\n.events2-row {\n  position: relative;\n  min-width: 0;\n  overflow: hidden;\n  transition:\n    background-color 160ms ease,\n    transform 160ms cubic-bezier(.2,.8,.2,1) !important;\n  animation:\n    alumniEventRowIn\n    .42s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-row:nth-child(1) { animation-delay: .03s; }\n.events2-row:nth-child(2) { animation-delay: .06s; }\n.events2-row:nth-child(3) { animation-delay: .09s; }\n.events2-row:nth-child(4) { animation-delay: .12s; }\n.events2-row:nth-child(5) { animation-delay: .15s; }\n.events2-row:nth-child(6) { animation-delay: .18s; }\n.events2-row:nth-child(7) { animation-delay: .21s; }\n.events2-row:nth-child(8) { animation-delay: .24s; }\n\n.events2-row::after {\n  content: \"\";\n  position: absolute;\n  top: 14px;\n  bottom: 14px;\n  left: 0;\n  width: 2px;\n  border-radius: 99px;\n  background:\n    var(--app-accent);\n  opacity: 0;\n  transform:\n    scaleY(.35);\n  transition:\n    opacity 160ms ease,\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-row:hover::after,\n.events2-row:active::after {\n  opacity: .8;\n  transform:\n    scaleY(1);\n}\n\n.events2-row:active {\n  transform:\n    translate3d(2px,0,0);\n}\n\n.events2-date::before {\n  border-radius:\n    99px;\n  box-shadow:\n    0 0 12px\n    color-mix(\n      in srgb,\n      var(--app-accent) 22%,\n      transparent\n    );\n}\n\n.events2-row-title {\n  max-width:\n    100%;\n}\n\n.events2-row-side svg {\n  transition:\n    transform 170ms\n    cubic-bezier(.2,.8,.2,1),\n    color 160ms ease;\n}\n\n.events2-row:hover\n.events2-row-side svg,\n.events2-row:active\n.events2-row-side svg {\n  color:\n    var(--app-accent);\n  transform:\n    translateX(2px);\n}\n\n.events2-row-side em {\n  padding:\n    4px 7px;\n  border-radius:\n    999px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      transparent\n    );\n}\n\n/* =========================================================\n   EMPTY\n   ========================================================= */\n\n.events2-empty {\n  animation:\n    alumniEventsSoftUp\n    .42s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-empty svg {\n  color:\n    var(--app-accent);\n  filter:\n    drop-shadow(\n      0 5px 14px\n      color-mix(\n        in srgb,\n        var(--app-accent) 18%,\n        transparent\n      )\n    );\n  animation:\n    alumniEventsEmptyFloat\n    3.6s\n    ease-in-out\n    infinite;\n}\n\n/* =========================================================\n   CREATE EVENT\n   ========================================================= */\n\n.events2-editor-backdrop {\n  animation:\n    alumniEventsBackdropIn\n    .20s\n    ease-out\n    both;\n}\n\n.events2-editor {\n  animation:\n    alumniEventsEditorIn\n    .38s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-editor-header {\n  position: sticky;\n  top: 0;\n  z-index: 5;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 84%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n  -webkit-backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n}\n\n.events2-editor-back {\n  border-radius:\n    999px !important;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 160ms ease;\n}\n\n.events2-editor-back:active {\n  transform:\n    translateX(-2px)\n    scale(.97);\n  color:\n    var(--app-text);\n}\n\n.events2-editor-section {\n  animation:\n    alumniEventsEditorSectionIn\n    .44s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-editor-section:nth-child(2) {\n  animation-delay: .06s;\n}\n\n.events2-editor-section:nth-child(3) {\n  animation-delay: .12s;\n}\n\n.events2-step > strong {\n  text-shadow:\n    0 0 14px\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    );\n}\n\n.events2-field input,\n.events2-field textarea,\n.events2-field select {\n  transition:\n    border-color 180ms ease,\n    color 180ms ease !important;\n}\n\n.events2-type-grid button {\n  transition:\n    color 160ms ease,\n    transform 150ms cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-type-grid button:active {\n  transform:\n    scale(.94);\n}\n\n.events2-type-grid\nbutton[data-active=\"true\"] {\n  color:\n    var(--app-accent) !important;\n}\n\n.events2-type-grid\nbutton[data-active=\"true\"]::after {\n  border-radius:\n    999px;\n  box-shadow:\n    0 0 12px\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    );\n  animation:\n    alumniEventsTabIn\n    .24s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.events2-visibility button {\n  transition:\n    background-color 160ms ease,\n    transform 150ms cubic-bezier(.2,.8,.2,1);\n}\n\n.events2-visibility button:active {\n  transform:\n    scale(.992);\n}\n\n.events2-visibility\nbutton[data-active=\"true\"] {\n  background:\n    linear-gradient(\n      90deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 5%,\n        transparent\n      ),\n      transparent 74%\n    ) !important;\n}\n\n.events2-editor-footer {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 85%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n  -webkit-backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n}\n\n.events2-editor-footer button {\n  border-radius:\n    999px !important;\n  box-shadow:\n    0 9px 26px\n    color-mix(\n      in srgb,\n      var(--app-accent) 16%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    box-shadow 170ms ease,\n    opacity 150ms ease;\n}\n\n.events2-editor-footer\nbutton:not(:disabled):active {\n  transform:\n    scale(.95);\n  box-shadow:\n    0 5px 16px\n    color-mix(\n      in srgb,\n      var(--app-accent) 11%,\n      transparent\n    );\n}\n\n/* =========================================================\n   EVENT DETAIL — HERO\n   ========================================================= */\n\n.event-detail {\n  position: relative;\n}\n\n.event-detail-back {\n  position: relative;\n  min-height:\n    38px !important;\n  padding:\n    0 10px 0 8px;\n  border-radius:\n    999px;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 160ms ease,\n    background-color 160ms ease;\n  animation:\n    alumniEventsSoftUp\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.event-detail-back:active {\n  transform:\n    translateX(-2px)\n    scale(.96);\n  background:\n    var(--app-soft);\n  color:\n    var(--app-text);\n}\n\n.event-detail-header {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  padding:\n    16px 0 30px !important;\n  animation:\n    alumniEventsDetailHeroIn\n    .52s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.event-detail-header::before {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -110px;\n  right: -90px;\n  width: 250px;\n  height: 250px;\n  border-radius: 999px;\n  background:\n    radial-gradient(\n      circle,\n      color-mix(\n        in srgb,\n        var(--app-accent) 12%,\n        transparent\n      ),\n      transparent 68%\n    );\n  pointer-events: none;\n  animation:\n    alumniEventsGlowFloat\n    7.6s\n    ease-in-out\n    infinite;\n}\n\n.event-detail-header > span {\n  display:\n    inline-flex;\n  align-items:\n    center;\n  min-height:\n    24px;\n  padding:\n    0 8px;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      var(--app-border)\n    );\n  border-radius:\n    999px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 6%,\n      transparent\n    );\n  color:\n    var(--app-accent) !important;\n}\n\n.event-detail-header h1 {\n  max-width:\n    760px !important;\n  margin-top:\n    12px !important;\n  font-size:\n    clamp(\n      38px,\n      10vw,\n      62px\n    ) !important;\n  line-height:\n    .98 !important;\n  text-wrap:\n    balance;\n}\n\n.event-detail-meta {\n  gap:\n    10px 16px !important;\n}\n\n.event-detail-meta span {\n  position: relative;\n  transition:\n    color 160ms ease;\n}\n\n.event-detail-meta span svg {\n  color:\n    var(--app-accent);\n}\n\n.event-detail-header > p {\n  max-width:\n    680px !important;\n  font-size:\n    13.5px !important;\n  line-height:\n    1.68 !important;\n}\n\n.event-detail-community {\n  position: relative;\n  padding-bottom:\n    2px;\n  transition:\n    color 160ms ease;\n}\n\n.event-detail-community::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: -2px;\n  left: 0;\n  height: 1px;\n  background:\n    var(--app-accent);\n  transform:\n    scaleX(.35);\n  transform-origin:\n    left;\n  transition:\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.event-detail-community:hover::after,\n.event-detail-community:active::after {\n  transform:\n    scaleX(1);\n}\n\n/* =========================================================\n   RSVP\n   ========================================================= */\n\n.event-rsvp {\n  animation:\n    alumniEventsSoftUp\n    .48s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .07s;\n}\n\n.event-rsvp-heading p {\n  max-width:\n    260px;\n}\n\n.event-rsvp-choice {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    18px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 72%,\n      transparent\n    );\n}\n\n.event-rsvp-choice > button {\n  border-right:\n    1px solid\n    var(--app-border) !important;\n  transition:\n    background-color 160ms ease,\n    color 160ms ease,\n    transform 150ms cubic-bezier(.2,.8,.2,1);\n}\n\n.event-rsvp-choice\n> button:last-child {\n  border-right:\n    0 !important;\n}\n\n.event-rsvp-choice > button:active {\n  transform:\n    scale(.97);\n}\n\n.event-rsvp-choice\n> button[data-active=\"true\"] {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      transparent\n    );\n  color:\n    var(--app-accent) !important;\n}\n\n.event-rsvp-choice\n> button[data-active=\"true\"]::after {\n  right:\n    9px !important;\n  bottom:\n    5px !important;\n  left:\n    9px !important;\n  border-radius:\n    999px;\n  box-shadow:\n    0 0 12px\n    color-mix(\n      in srgb,\n      var(--app-accent) 23%,\n      transparent\n    );\n  animation:\n    alumniEventsTabIn\n    .25s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n/* =========================================================\n   ATTENDANCE\n   ========================================================= */\n\n.event-attendance {\n  animation:\n    alumniEventsSoftUp\n    .48s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .12s;\n}\n\n.event-attendance-actions {\n  flex-wrap: wrap;\n}\n\n.event-attendance-actions > button,\n.event-attendance-actions a {\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 160ms ease;\n}\n\n.event-attendance-actions > button:active,\n.event-attendance-actions a:active {\n  transform:\n    scale(.96);\n}\n\n.event-going-list a {\n  transition:\n    background-color 160ms ease,\n    transform 150ms cubic-bezier(.2,.8,.2,1);\n  animation:\n    alumniEventPersonIn\n    .35s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.event-going-list a:nth-child(2) { animation-delay: .03s; }\n.event-going-list a:nth-child(3) { animation-delay: .06s; }\n.event-going-list a:nth-child(4) { animation-delay: .09s; }\n.event-going-list a:nth-child(5) { animation-delay: .12s; }\n\n.event-going-list a:active {\n  transform:\n    translateX(2px);\n}\n\n.event-going-list a > span {\n  box-shadow:\n    0 5px 16px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 14%,\n      transparent\n    );\n}\n\n/* =========================================================\n   MOBILE\n   ========================================================= */\n\n@media (max-width: 620px) {\n  .events2-hero {\n    min-height: 92px;\n    padding-top:\n      12px !important;\n    padding-bottom:\n      17px !important;\n  }\n\n  .events2-hero h1 {\n    font-size:\n      34px !important;\n  }\n\n  .events2-primary-action {\n    width:\n      42px;\n    min-width:\n      42px;\n    padding:\n      0 !important;\n    font-size:\n      0 !important;\n  }\n\n  .events2-primary-action svg {\n    width: 18px;\n    height: 18px;\n  }\n\n  .events2-navigation {\n    display:\n      grid !important;\n    gap:\n      0 !important;\n    min-height:\n      0 !important;\n  }\n\n  .events2-tabs {\n    display:\n      grid !important;\n    grid-template-columns:\n      repeat(\n        3,\n        minmax(0,1fr)\n      );\n    width:\n      100%;\n    gap:\n      0 !important;\n  }\n\n  .events2-tabs button {\n    min-width:\n      0;\n    min-height:\n      48px !important;\n    font-size:\n      10.5px !important;\n  }\n\n  .events2-tabs\n  button[data-active=\"true\"]::after {\n    right:\n      14px !important;\n    left:\n      14px !important;\n  }\n\n  .events2-search {\n    width:\n      100% !important;\n    max-width:\n      none !important;\n    min-height:\n      49px !important;\n  }\n\n  .events2-search::after {\n    bottom:\n      0;\n  }\n\n  .events2-row {\n    grid-template-columns:\n      50px\n      minmax(0,1fr)\n      auto !important;\n    min-height:\n      91px !important;\n    gap:\n      11px !important;\n  }\n\n  .events2-row-title {\n    font-size:\n      14px !important;\n  }\n\n  .events2-row-meta {\n    max-width:\n      100%;\n  }\n\n  .events2-row-side {\n    gap:\n      6px !important;\n  }\n\n  .events2-row-side em {\n    display:\n      none;\n  }\n\n  .events2-editor-header {\n    grid-template-columns:\n      74px\n      minmax(0,1fr)\n      auto !important;\n    gap:\n      10px !important;\n    padding-left:\n      14px !important;\n    padding-right:\n      14px !important;\n  }\n\n  .events2-editor-body {\n    padding-inline:\n      14px !important;\n  }\n\n  .events2-editor-section {\n    grid-template-columns:\n      1fr !important;\n    gap:\n      16px !important;\n    padding:\n      24px 0 27px !important;\n  }\n\n  .events2-two-columns {\n    grid-template-columns:\n      1fr !important;\n    gap:\n      18px !important;\n  }\n\n  .events2-editor-footer {\n    padding-left:\n      14px !important;\n    padding-right:\n      14px !important;\n  }\n\n  .event-detail {\n    padding-top:\n      12px !important;\n  }\n\n  .event-detail-header {\n    padding-top:\n      10px !important;\n  }\n\n  .event-detail-header h1 {\n    font-size:\n      40px !important;\n  }\n\n  .event-detail-meta {\n    display:\n      grid !important;\n    gap:\n      9px !important;\n  }\n\n  .event-rsvp {\n    gap:\n      17px !important;\n  }\n\n  .event-rsvp-choice {\n    grid-template-columns:\n      repeat(\n        3,\n        minmax(0,1fr)\n      ) !important;\n    border-radius:\n      16px;\n  }\n\n  .event-rsvp-choice > button {\n    min-width:\n      0;\n    padding-inline:\n      7px !important;\n  }\n\n  .event-rsvp-choice strong {\n    font-size:\n      9.5px !important;\n  }\n}\n\n@media (max-width: 374px) {\n  .events2-hero h1 {\n    font-size:\n      32px !important;\n  }\n\n  .events2-row {\n    grid-template-columns:\n      46px\n      minmax(0,1fr)\n      18px !important;\n    gap:\n      9px !important;\n  }\n\n  .events2-date strong {\n    font-size:\n      23px !important;\n  }\n\n  .events2-row-kicker {\n    font-size:\n      8px !important;\n  }\n\n  .events2-row-title {\n    font-size:\n      13.5px !important;\n  }\n\n  .events2-row-side svg {\n    width:\n      16px;\n  }\n\n  .event-detail-header h1 {\n    font-size:\n      36px !important;\n  }\n\n  .event-rsvp-choice > button {\n    grid-template-columns:\n      1fr !important;\n    justify-items:\n      center;\n    text-align:\n      center !important;\n  }\n\n  .event-rsvp-choice > button svg {\n    margin-bottom:\n      2px;\n  }\n}\n\n/* =========================================================\n   MOTION\n   ========================================================= */\n\n@keyframes alumniEventsHeroIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsSoftUp {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,7px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventRowIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(8px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsTabIn {\n  from {\n    opacity: 0;\n    transform:\n      scaleX(.28);\n  }\n  to {\n    opacity: 1;\n    transform:\n      scaleX(1);\n  }\n}\n\n@keyframes alumniEventsGlowFloat {\n  0%, 100% {\n    transform:\n      translate3d(0,0,0)\n      scale(1);\n  }\n  50% {\n    transform:\n      translate3d(-10px,8px,0)\n      scale(1.05);\n  }\n}\n\n@keyframes alumniEventsLinePulse {\n  0%, 100% {\n    opacity: .38;\n    transform:\n      scaleX(.72);\n  }\n  50% {\n    opacity: .9;\n    transform:\n      scaleX(1);\n  }\n}\n\n@keyframes alumniEventsEmptyFloat {\n  0%, 100% {\n    transform:\n      translate3d(0,0,0)\n      rotate(0);\n  }\n  50% {\n    transform:\n      translate3d(0,-5px,0)\n      rotate(3deg);\n  }\n}\n\n@keyframes alumniEventsBackdropIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n@keyframes alumniEventsEditorIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,18px,0)\n      scale(.992);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0)\n      scale(1);\n  }\n}\n\n@keyframes alumniEventsEditorSectionIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,9px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventsDetailHeroIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniEventPersonIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(5px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .events2-hero,\n  .events2-navigation,\n  .events2-row,\n  .events2-empty,\n  .events2-empty svg,\n  .events2-editor-backdrop,\n  .events2-editor,\n  .events2-editor-section,\n  .event-detail-back,\n  .event-detail-header,\n  .event-rsvp,\n  .event-attendance,\n  .event-going-list a,\n  .events2-hero::before,\n  .events2-hero::after,\n  .event-detail-header::before {\n    animation:\n      none !important;\n  }\n\n  .events2-primary-action,\n  .events2-primary-action svg,\n  .events2-tabs button,\n  .events2-search,\n  .events2-search::after,\n  .events2-search svg,\n  .events2-row,\n  .events2-row::after,\n  .events2-row-side svg,\n  .events2-editor-back,\n  .events2-type-grid button,\n  .events2-visibility button,\n  .events2-editor-footer button,\n  .event-detail-back,\n  .event-detail-community::after,\n  .event-rsvp-choice > button,\n  .event-attendance-actions > button,\n  .event-going-list a {\n    transition:\n      none !important;\n  }\n}\n\n/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_4 */\n";

try {
  const ts =
    require(
      "typescript"
    );

  for (
    const [
      name,
      source,
    ] of [
      [MAIN, main],
      [DETAIL, detail],
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
      parsed.parseDiagnostics ||
      [];

    if (
      diagnostics.length
    ) {
      const first =
        diagnostics[0];

      fail(
        `${name}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Events válido"
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
  abs(MAIN),
  main,
  "utf8"
);

fs.writeFileSync(
  abs(DETAIL),
  detail,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ BLOQUE 4 aplicado."
);
console.log(
  "✅ Eventos principal con motion premium."
);
console.log(
  "✅ Filas y tabs refinadas."
);
console.log(
  "✅ Crear evento refinado."
);
console.log(
  "✅ Interior del evento mejorado."
);
console.log(
  "✅ RSVP y asistentes con motion."
);
console.log(
  "✅ Mobile 360–430px protegido."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
