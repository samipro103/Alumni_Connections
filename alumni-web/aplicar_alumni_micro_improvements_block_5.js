const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const MAIN =
  "src/app/community/page.tsx";

const DETAIL =
  "src/app/community/[slug]/page.tsx";

const CSS =
  "src/app/community/community-motion-3-0.css";

const MARKER =
  "ALUMNI_MICRO_IMPROVEMENTS_BLOCK_5";

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
    ".before-micro-improvements-block-5.bak";

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
    'import "./community-motion-3-0.css";'
  )
) {
  main =
    replaceRequired(
      main,
      'import "../interior-ui-1-0.css";',
      'import "../interior-ui-1-0.css";\nimport "./community-motion-3-0.css";',
      "import final de Community"
    );
}

if (
  !detail.includes(
    'import "../community-motion-3-0.css";'
  )
) {
  detail =
    replaceRequired(
      detail,
      'import "../../interior-ui-1-0.css";',
      'import "../../interior-ui-1-0.css";\nimport "../community-motion-3-0.css";',
      "import final de Community Detail"
    );
}

/* Explicit authored motion only. */
main =
  replaceRequired(
    main,
    '<main className="alumni-community-2 mx-auto w-full max-w-[920px]">',
    '<main className="alumni-community-2 mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">',
    "main de Comunidades"
  );

detail =
  replaceRequired(
    detail,
    '<main className="community-detail mx-auto w-full max-w-[920px]">',
    '<main className="community-detail mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">',
    "main de Community Detail"
  );

if (
  !main.includes(
    MARKER
  )
) {
  main +=
    `\n/* ${MARKER}:COMMUNITY_HOME */\n`;
}

if (
  !detail.includes(
    MARKER
  )
) {
  detail +=
    `\n/* ${MARKER}:COMMUNITY_DETAIL */\n`;
}

const css =
  "/*\n * ALUMNI_MICRO_IMPROVEMENTS_BLOCK_5\n * Comunidades — discovery, detail y create.\n * Mobile-first, limpio, premium, motion explícito.\n */\n\n.alumni-community-2,\n.community-detail {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  overflow-x: clip;\n}\n\n/* =========================================================\n   COMMUNITY HOME — HERO\n   ========================================================= */\n\n.community2-hero {\n  position: relative;\n  isolation: isolate;\n  align-items: center !important;\n  min-height: 104px;\n  gap: 16px !important;\n  padding:\n    17px 1px 22px !important;\n  overflow: hidden;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 78%,\n      transparent\n    ) !important;\n  animation:\n    alumniCommunityHeroIn\n    .48s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-hero::before,\n.community2-hero::after {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  pointer-events: none;\n}\n\n.community2-hero::before {\n  top: -78px;\n  right: -66px;\n  width: 196px;\n  height: 196px;\n  border-radius: 999px;\n  background:\n    radial-gradient(\n      circle,\n      color-mix(\n        in srgb,\n        var(--app-accent) 13%,\n        transparent\n      ) 0%,\n      color-mix(\n        in srgb,\n        var(--app-accent) 4%,\n        transparent\n      ) 42%,\n      transparent 72%\n    );\n  animation:\n    alumniCommunityGlowFloat\n    7.4s\n    ease-in-out\n    infinite;\n}\n\n.community2-hero::after {\n  right: 64px;\n  bottom: 18px;\n  width: 56px;\n  height: 20px;\n  background:\n    radial-gradient(\n      circle at 6px 10px,\n      color-mix(\n        in srgb,\n        var(--app-accent) 68%,\n        transparent\n      ) 0 2px,\n      transparent 2.5px\n    ),\n    radial-gradient(\n      circle at 28px 4px,\n      color-mix(\n        in srgb,\n        var(--app-accent) 44%,\n        transparent\n      ) 0 2px,\n      transparent 2.5px\n    ),\n    radial-gradient(\n      circle at 50px 15px,\n      color-mix(\n        in srgb,\n        var(--app-accent) 58%,\n        transparent\n      ) 0 2px,\n      transparent 2.5px\n    ),\n    linear-gradient(\n      25deg,\n      transparent 0 28%,\n      color-mix(\n        in srgb,\n        var(--app-accent) 20%,\n        transparent\n      ) 29% 31%,\n      transparent 32% 100%\n    );\n  opacity: .8;\n  animation:\n    alumniCommunityNodesPulse\n    3.6s\n    ease-in-out\n    infinite;\n}\n\n.community2-hero h1 {\n  margin: 0 !important;\n  color: var(--app-text);\n  font-size:\n    clamp(\n      34px,\n      10vw,\n      48px\n    ) !important;\n  font-weight:\n    950 !important;\n  line-height:\n    .98 !important;\n  letter-spacing:\n    -.055em !important;\n}\n\n.community2-primary-action {\n  display: inline-flex !important;\n  min-height: 42px !important;\n  align-items: center;\n  justify-content: center;\n  gap: 7px !important;\n  padding:\n    0 14px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    ) !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    ) !important;\n  border-radius:\n    999px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 11%,\n      var(--app-surface)\n    ) !important;\n  color:\n    var(--app-text) !important;\n  box-shadow:\n    0 9px 25px\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    border-color 160ms ease,\n    background-color 160ms ease,\n    box-shadow 180ms ease !important;\n}\n\n.community2-primary-action svg {\n  color:\n    var(--app-accent);\n  transition:\n    transform 200ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-primary-action:hover svg {\n  transform:\n    rotate(90deg);\n}\n\n.community2-primary-action:active {\n  transform:\n    scale(.95);\n  box-shadow:\n    0 5px 15px\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    );\n}\n\n/* =========================================================\n   NAV / SEARCH\n   ========================================================= */\n\n.community2-navigation {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  gap:\n    15px !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  animation:\n    alumniCommunitySoftUp\n    .46s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .05s;\n}\n\n.community2-tabs {\n  min-width: 0;\n}\n\n.community2-tabs button {\n  transition:\n    color 160ms ease,\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-tabs button:active {\n  transform:\n    scale(.96);\n}\n\n.community2-tabs\nbutton[data-active=\"true\"]::after {\n  border-radius:\n    999px;\n  box-shadow:\n    0 0 12px\n    color-mix(\n      in srgb,\n      var(--app-accent) 25%,\n      transparent\n    );\n  animation:\n    alumniCommunityTabIn\n    .28s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-search {\n  position: relative;\n  min-width: 0;\n  transition:\n    color 160ms ease;\n}\n\n.community2-search::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: 4px;\n  left: 0;\n  height: 1px;\n  background:\n    var(--app-border);\n  transform-origin:\n    center;\n  transition:\n    background-color 160ms ease,\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-search:focus-within {\n  color:\n    var(--app-accent);\n}\n\n.community2-search:focus-within::after {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 58%,\n      var(--app-border)\n    );\n  transform:\n    scaleX(1.03);\n}\n\n.community2-search svg {\n  transition:\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-search:focus-within svg {\n  transform:\n    scale(1.08);\n}\n\n/* =========================================================\n   COMMUNITY LIST\n   ========================================================= */\n\n.community2-list {\n  min-width: 0;\n}\n\n.community2-row {\n  position: relative;\n  min-width: 0;\n  overflow: hidden;\n  transition:\n    background-color 160ms ease,\n    transform 160ms\n    cubic-bezier(.2,.8,.2,1) !important;\n  animation:\n    alumniCommunityRowIn\n    .42s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-row:nth-child(1) { animation-delay: .03s; }\n.community2-row:nth-child(2) { animation-delay: .06s; }\n.community2-row:nth-child(3) { animation-delay: .09s; }\n.community2-row:nth-child(4) { animation-delay: .12s; }\n.community2-row:nth-child(5) { animation-delay: .15s; }\n.community2-row:nth-child(6) { animation-delay: .18s; }\n.community2-row:nth-child(7) { animation-delay: .21s; }\n.community2-row:nth-child(8) { animation-delay: .24s; }\n\n.community2-row::before {\n  content: \"\";\n  position: absolute;\n  top: 14px;\n  bottom: 14px;\n  left: 0;\n  width: 2px;\n  border-radius: 99px;\n  background:\n    var(--app-accent);\n  opacity: 0;\n  transform:\n    scaleY(.35);\n  transition:\n    opacity 160ms ease,\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-row:hover::before,\n.community2-row:active::before {\n  opacity: .8;\n  transform:\n    scaleY(1);\n}\n\n.community2-row:active {\n  transform:\n    translate3d(2px,0,0);\n}\n\n.community2-mark {\n  position: relative;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      var(--app-border)\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 6%,\n      var(--app-surface)\n    );\n  box-shadow:\n    0 6px 18px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 12%,\n      transparent\n    );\n  transition:\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1),\n    border-color 160ms ease;\n}\n\n.community2-row:hover\n.community2-mark,\n.community2-row:active\n.community2-mark {\n  transform:\n    scale(1.04)\n    rotate(-2deg);\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 38%,\n      var(--app-border)\n    ) !important;\n}\n\n.community2-row-main > strong {\n  max-width: 100%;\n}\n\n.community2-row > svg {\n  transition:\n    transform 170ms\n    cubic-bezier(.2,.8,.2,1),\n    color 160ms ease;\n}\n\n.community2-row:hover > svg,\n.community2-row:active > svg {\n  color:\n    var(--app-accent);\n  transform:\n    translateX(2px);\n}\n\n/* =========================================================\n   EMPTY\n   ========================================================= */\n\n.community2-empty {\n  animation:\n    alumniCommunitySoftUp\n    .42s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-empty svg {\n  color:\n    var(--app-accent);\n  filter:\n    drop-shadow(\n      0 5px 14px\n      color-mix(\n        in srgb,\n        var(--app-accent) 18%,\n        transparent\n      )\n    );\n  animation:\n    alumniCommunityEmptyFloat\n    3.8s\n    ease-in-out\n    infinite;\n}\n\n/* =========================================================\n   CREATE COMMUNITY\n   ========================================================= */\n\n.community2-editor-backdrop {\n  animation:\n    alumniCommunityBackdropIn\n    .20s\n    ease-out\n    both;\n}\n\n.community2-editor {\n  animation:\n    alumniCommunityEditorIn\n    .38s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-editor-header {\n  position: sticky;\n  top: 0;\n  z-index: 5;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 84%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n  -webkit-backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n}\n\n.community2-editor-back {\n  border-radius:\n    999px !important;\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    color 160ms ease;\n}\n\n.community2-editor-back:active {\n  transform:\n    translateX(-2px)\n    scale(.97);\n  color:\n    var(--app-text);\n}\n\n.community2-editor-section {\n  animation:\n    alumniCommunityEditorSectionIn\n    .44s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-editor-section:nth-child(2) {\n  animation-delay: .06s;\n}\n\n.community2-editor-section:nth-child(3) {\n  animation-delay: .12s;\n}\n\n.community2-step > strong {\n  text-shadow:\n    0 0 14px\n    color-mix(\n      in srgb,\n      var(--app-accent) 24%,\n      transparent\n    );\n}\n\n.community2-field input,\n.community2-field textarea {\n  transition:\n    border-color 180ms ease,\n    color 180ms ease !important;\n}\n\n.community2-category-list button,\n.community2-access-list button {\n  transition:\n    background-color 160ms ease,\n    color 160ms ease,\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community2-category-list button:active,\n.community2-access-list button:active {\n  transform:\n    scale(.992);\n}\n\n.community2-category-list\nbutton[data-active=\"true\"],\n.community2-access-list\nbutton[data-active=\"true\"] {\n  background:\n    linear-gradient(\n      90deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 5%,\n        transparent\n      ),\n      transparent 74%\n    ) !important;\n}\n\n.community2-category-list\nbutton[data-active=\"true\"] svg,\n.community2-access-list\nbutton[data-active=\"true\"] svg {\n  filter:\n    drop-shadow(\n      0 0 8px\n      color-mix(\n        in srgb,\n        var(--app-accent) 28%,\n        transparent\n      )\n    );\n}\n\n.community2-category-list\nbutton[data-active=\"true\"]::after,\n.community2-access-list\nbutton[data-active=\"true\"]::after {\n  box-shadow:\n    0 0 0 4px\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  animation:\n    alumniCommunityChoicePop\n    .24s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community2-editor-footer {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 85%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n  -webkit-backdrop-filter:\n    blur(18px)\n    saturate(1.07) !important;\n}\n\n.community2-editor-footer button {\n  border-radius:\n    999px !important;\n  box-shadow:\n    0 9px 26px\n    color-mix(\n      in srgb,\n      var(--app-accent) 16%,\n      transparent\n    );\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    box-shadow 170ms ease,\n    opacity 150ms ease;\n}\n\n.community2-editor-footer\nbutton:not(:disabled):active {\n  transform:\n    scale(.95);\n  box-shadow:\n    0 5px 16px\n    color-mix(\n      in srgb,\n      var(--app-accent) 11%,\n      transparent\n    );\n}\n\n/* =========================================================\n   COMMUNITY DETAIL — HEADER\n   ========================================================= */\n\n.community-detail {\n  position: relative;\n}\n\n.community-detail-back {\n  min-height:\n    38px !important;\n  padding:\n    0 10px 0 8px;\n  border-radius:\n    999px;\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    color 160ms ease,\n    background-color 160ms ease;\n  animation:\n    alumniCommunitySoftUp\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-detail-back:active {\n  transform:\n    translateX(-2px)\n    scale(.96);\n  background:\n    var(--app-soft);\n  color:\n    var(--app-text);\n}\n\n.community-detail-header {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  padding:\n    16px 0 30px !important;\n  animation:\n    alumniCommunityDetailHeroIn\n    .52s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-detail-header::before {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -112px;\n  right: -92px;\n  width: 250px;\n  height: 250px;\n  border-radius: 999px;\n  background:\n    radial-gradient(\n      circle,\n      color-mix(\n        in srgb,\n        var(--app-accent) 12%,\n        transparent\n      ),\n      transparent 68%\n    );\n  pointer-events: none;\n  animation:\n    alumniCommunityGlowFloat\n    7.8s\n    ease-in-out\n    infinite;\n}\n\n.community-detail-title {\n  min-width: 0;\n}\n\n.community-detail-title > span {\n  display:\n    inline-flex !important;\n  width:\n    fit-content;\n  min-height:\n    24px;\n  padding:\n    0 8px;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      var(--app-border)\n    );\n  border-radius:\n    999px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 6%,\n      transparent\n    );\n  color:\n    var(--app-accent) !important;\n}\n\n.community-detail-title h1 {\n  max-width:\n    760px;\n  margin-top:\n    12px !important;\n  font-size:\n    clamp(\n      38px,\n      10vw,\n      60px\n    ) !important;\n  line-height:\n    .98 !important;\n  text-wrap:\n    balance;\n}\n\n.community-detail-title > p {\n  max-width:\n    680px !important;\n  font-size:\n    13.5px !important;\n  line-height:\n    1.68 !important;\n}\n\n.community-detail-meta {\n  gap:\n    9px 13px !important;\n}\n\n.community-detail-meta span,\n.community-detail-meta button {\n  min-width: 0;\n  transition:\n    color 160ms ease,\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community-detail-meta button:active {\n  transform:\n    scale(.96);\n  color:\n    var(--app-accent);\n}\n\n.community-detail-actions {\n  flex-wrap: wrap;\n}\n\n.community-detail-actions > *,\n.community-detail-join {\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    color 160ms ease,\n    background-color 160ms ease,\n    border-color 160ms ease;\n}\n\n.community-detail-actions > *:active,\n.community-detail-join:active {\n  transform:\n    scale(.96);\n}\n\n.community-detail-join {\n  min-height:\n    40px !important;\n  padding:\n    0 13px;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    999px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    ) !important;\n}\n\n.community-detail-join:disabled {\n  border-color:\n    var(--app-border) !important;\n  background:\n    transparent !important;\n}\n\n/* =========================================================\n   COMPOSER\n   ========================================================= */\n\n.community-composer {\n  position: relative;\n  padding:\n    21px 0 !important;\n  animation:\n    alumniCommunitySoftUp\n    .46s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .05s;\n}\n\n.community-composer textarea {\n  min-height:\n    100px !important;\n  padding:\n    10px 0 12px;\n  border:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  font-size:\n    14px !important;\n  transition:\n    color 160ms ease;\n}\n\n.community-composer > div {\n  border-top:\n    1px solid\n    var(--app-border) !important;\n}\n\n.community-composer button {\n  min-height:\n    36px;\n  padding:\n    0 10px;\n  border-radius:\n    999px;\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease,\n    color 160ms ease;\n}\n\n.community-composer\nbutton:not(:disabled):active {\n  transform:\n    scale(.94);\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 7%,\n      transparent\n    );\n}\n\n/* =========================================================\n   COMMUNITY EVENTS\n   ========================================================= */\n\n.community-events-strip {\n  animation:\n    alumniCommunitySoftUp\n    .46s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .10s;\n}\n\n.community-events-strip\n> header a {\n  position: relative;\n  padding-bottom:\n    2px;\n}\n\n.community-events-strip\n> header a::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: -2px;\n  left: 0;\n  height: 1px;\n  background:\n    var(--app-accent);\n  transform:\n    scaleX(.35);\n  transform-origin:\n    left;\n  transition:\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community-events-strip\n> header a:hover::after,\n.community-events-strip\n> header a:active::after {\n  transform:\n    scaleX(1);\n}\n\n.community-event-row {\n  position: relative;\n  transition:\n    background-color 160ms ease,\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1);\n  animation:\n    alumniCommunityEventIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-event-row:nth-child(2) { animation-delay: .03s; }\n.community-event-row:nth-child(3) { animation-delay: .06s; }\n.community-event-row:nth-child(4) { animation-delay: .09s; }\n\n.community-event-row:active {\n  transform:\n    translateX(2px);\n}\n\n.community-event-row > svg {\n  color:\n    var(--app-accent);\n  transition:\n    transform 160ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community-event-row:hover > svg,\n.community-event-row:active > svg {\n  transform:\n    scale(1.08);\n}\n\n/* =========================================================\n   COMMUNITY FEED\n   ========================================================= */\n\n.community-feed {\n  animation:\n    alumniCommunitySoftUp\n    .46s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .14s;\n}\n\n.community-post {\n  position: relative;\n  overflow: hidden;\n  animation:\n    alumniCommunityPostIn\n    .40s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-post:nth-of-type(2) { animation-delay: .03s; }\n.community-post:nth-of-type(3) { animation-delay: .06s; }\n.community-post:nth-of-type(4) { animation-delay: .09s; }\n.community-post:nth-of-type(5) { animation-delay: .12s; }\n\n.community-post::before {\n  content: \"\";\n  position: absolute;\n  top: 20px;\n  bottom: 20px;\n  left: 0;\n  width: 2px;\n  border-radius: 99px;\n  background:\n    var(--app-accent);\n  opacity: 0;\n  transform:\n    scaleY(.35);\n  transition:\n    opacity 160ms ease,\n    transform 180ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community-post:hover::before {\n  opacity: .55;\n  transform:\n    scaleY(1);\n}\n\n.community-post-avatar {\n  box-shadow:\n    0 5px 16px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 13%,\n      transparent\n    );\n  transition:\n    transform 170ms\n    cubic-bezier(.2,.8,.2,1);\n}\n\n.community-post > header a:active\n.community-post-avatar {\n  transform:\n    scale(.94);\n}\n\n/* =========================================================\n   MEMBERS MODAL\n   ========================================================= */\n\n.community2-modal-backdrop {\n  backdrop-filter:\n    blur(10px);\n  -webkit-backdrop-filter:\n    blur(10px);\n  animation:\n    alumniCommunityBackdropIn\n    .20s ease-out both;\n}\n\n.community-members-modal {\n  animation:\n    alumniCommunityMembersIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-member-row {\n  animation:\n    alumniCommunityMemberIn\n    .32s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.community-member-row:nth-child(2) { animation-delay: .025s; }\n.community-member-row:nth-child(3) { animation-delay: .05s; }\n.community-member-row:nth-child(4) { animation-delay: .075s; }\n.community-member-row:nth-child(5) { animation-delay: .10s; }\n\n.community-member-row button {\n  transition:\n    transform 150ms\n    cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease;\n}\n\n.community-member-row button:active {\n  transform:\n    scale(.92);\n}\n\n/* =========================================================\n   MOBILE\n   ========================================================= */\n\n@media (max-width: 680px) {\n  .alumni-community-2 {\n    padding-top:\n      0 !important;\n  }\n\n  .community2-hero {\n    min-height:\n      92px;\n    align-items:\n      center !important;\n    flex-direction:\n      row !important;\n    gap:\n      12px !important;\n    padding-top:\n      12px !important;\n    padding-bottom:\n      17px !important;\n  }\n\n  .community2-hero > div {\n    min-width: 0;\n    flex: 1 1 auto;\n  }\n\n  .community2-hero h1 {\n    font-size:\n      34px !important;\n  }\n\n  .community2-primary-action {\n    width:\n      42px;\n    min-width:\n      42px;\n    height:\n      42px;\n    padding:\n      0 !important;\n    font-size:\n      0 !important;\n  }\n\n  .community2-primary-action svg {\n    width: 18px;\n    height: 18px;\n  }\n\n  .community2-navigation {\n    display:\n      grid !important;\n    gap:\n      0 !important;\n    min-height:\n      0 !important;\n    padding-bottom:\n      0 !important;\n  }\n\n  .community2-tabs {\n    display:\n      grid !important;\n    grid-template-columns:\n      repeat(\n        2,\n        minmax(0,1fr)\n      );\n    width:\n      100%;\n    gap:\n      0 !important;\n  }\n\n  .community2-tabs button {\n    min-width:\n      0;\n    min-height:\n      48px !important;\n    font-size:\n      10.5px !important;\n  }\n\n  .community2-tabs\n  button[data-active=\"true\"]::after {\n    right:\n      16px !important;\n    left:\n      16px !important;\n  }\n\n  .community2-search {\n    width:\n      100% !important;\n    max-width:\n      none !important;\n    min-height:\n      49px !important;\n  }\n\n  .community2-search::after {\n    bottom:\n      0;\n  }\n\n  .community2-row {\n    grid-template-columns:\n      43px\n      minmax(0,1fr)\n      18px !important;\n    min-height:\n      88px !important;\n    gap:\n      10px !important;\n  }\n\n  .community2-mark {\n    width:\n      36px !important;\n    height:\n      36px !important;\n  }\n\n  .community2-row-main > strong {\n    font-size:\n      14px !important;\n  }\n\n  .community2-row-main > small {\n    max-width:\n      100%;\n  }\n\n  .community2-editor-header {\n    grid-template-columns:\n      74px\n      minmax(0,1fr)\n      auto !important;\n    gap:\n      10px !important;\n    padding-left:\n      14px !important;\n    padding-right:\n      14px !important;\n  }\n\n  .community2-editor-back {\n    grid-column:\n      auto !important;\n  }\n\n  .community2-editor-body {\n    padding-inline:\n      14px !important;\n  }\n\n  .community2-editor-section {\n    grid-template-columns:\n      1fr !important;\n    gap:\n      16px !important;\n    padding:\n      24px 0 27px !important;\n  }\n\n  .community2-step {\n    padding-bottom:\n      0 !important;\n    border-bottom:\n      0 !important;\n  }\n\n  .community2-context-fields {\n    grid-template-columns:\n      1fr !important;\n  }\n\n  .community2-editor-footer {\n    padding-left:\n      14px !important;\n    padding-right:\n      14px !important;\n  }\n\n  .community-detail {\n    padding-top:\n      12px !important;\n  }\n\n  .community-detail-header {\n    gap:\n      18px !important;\n    padding-top:\n      10px !important;\n  }\n\n  .community-detail-title h1 {\n    font-size:\n      40px !important;\n  }\n\n  .community-detail-meta {\n    display:\n      flex !important;\n    max-width:\n      100%;\n  }\n\n  .community-detail-actions {\n    width:\n      100%;\n    justify-content:\n      flex-start !important;\n  }\n\n  .community-composer textarea {\n    min-height:\n      92px !important;\n  }\n\n  .community-events-strip\n  > header,\n  .community-feed\n  > header {\n    min-width: 0;\n  }\n\n  .community-event-row {\n    min-width: 0;\n  }\n\n  .community-event-row span {\n    min-width: 0;\n  }\n\n  .community-event-row strong,\n  .community-event-row small {\n    overflow: hidden;\n    text-overflow: ellipsis;\n    white-space: nowrap;\n  }\n\n  .community-post > p {\n    font-size:\n      13.5px !important;\n    line-height:\n      1.6 !important;\n  }\n\n  .community-members-modal {\n    max-height:\n      88dvh;\n    border-radius:\n      26px 26px 0 0 !important;\n  }\n}\n\n@media (max-width: 374px) {\n  .community2-hero h1 {\n    font-size:\n      31px !important;\n  }\n\n  .community2-row {\n    grid-template-columns:\n      40px\n      minmax(0,1fr)\n      16px !important;\n    gap:\n      9px !important;\n  }\n\n  .community2-row-kicker {\n    font-size:\n      8px !important;\n  }\n\n  .community2-row-main > strong {\n    font-size:\n      13.5px !important;\n  }\n\n  .community-detail-title h1 {\n    font-size:\n      36px !important;\n  }\n\n  .community-detail-actions {\n    gap:\n      9px !important;\n  }\n}\n\n/* =========================================================\n   MOTION\n   ========================================================= */\n\n@keyframes alumniCommunityHeroIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunitySoftUp {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,7px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityRowIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(8px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityTabIn {\n  from {\n    opacity: 0;\n    transform:\n      scaleX(.28);\n  }\n  to {\n    opacity: 1;\n    transform:\n      scaleX(1);\n  }\n}\n\n@keyframes alumniCommunityGlowFloat {\n  0%,100% {\n    transform:\n      translate3d(0,0,0)\n      scale(1);\n  }\n  50% {\n    transform:\n      translate3d(-10px,8px,0)\n      scale(1.05);\n  }\n}\n\n@keyframes alumniCommunityNodesPulse {\n  0%,100% {\n    opacity: .42;\n    transform:\n      scale(.95);\n  }\n  50% {\n    opacity: .9;\n    transform:\n      scale(1.04);\n  }\n}\n\n@keyframes alumniCommunityEmptyFloat {\n  0%,100% {\n    transform:\n      translate3d(0,0,0);\n  }\n  50% {\n    transform:\n      translate3d(0,-5px,0)\n      rotate(-2deg);\n  }\n}\n\n@keyframes alumniCommunityBackdropIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n@keyframes alumniCommunityEditorIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,18px,0)\n      scale(.992);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0)\n      scale(1);\n  }\n}\n\n@keyframes alumniCommunityEditorSectionIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,9px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityChoicePop {\n  from {\n    transform:\n      scale(.55);\n  }\n  to {\n    transform:\n      scale(1);\n  }\n}\n\n@keyframes alumniCommunityDetailHeroIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,10px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityEventIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(5px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityPostIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,7px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniCommunityMembersIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,14px,0)\n      scale(.99);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0)\n      scale(1);\n  }\n}\n\n@keyframes alumniCommunityMemberIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(5px,0,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .community2-hero,\n  .community2-navigation,\n  .community2-row,\n  .community2-empty,\n  .community2-empty svg,\n  .community2-editor-backdrop,\n  .community2-editor,\n  .community2-editor-section,\n  .community-detail-back,\n  .community-detail-header,\n  .community-composer,\n  .community-events-strip,\n  .community-event-row,\n  .community-feed,\n  .community-post,\n  .community2-modal-backdrop,\n  .community-members-modal,\n  .community-member-row,\n  .community2-hero::before,\n  .community2-hero::after,\n  .community-detail-header::before {\n    animation:\n      none !important;\n  }\n\n  .community2-primary-action,\n  .community2-primary-action svg,\n  .community2-tabs button,\n  .community2-search,\n  .community2-search::after,\n  .community2-search svg,\n  .community2-row,\n  .community2-row::before,\n  .community2-mark,\n  .community2-row > svg,\n  .community2-editor-back,\n  .community2-category-list button,\n  .community2-access-list button,\n  .community2-editor-footer button,\n  .community-detail-back,\n  .community-detail-meta span,\n  .community-detail-meta button,\n  .community-detail-actions > *,\n  .community-detail-join,\n  .community-composer button,\n  .community-events-strip > header a::after,\n  .community-event-row,\n  .community-event-row > svg,\n  .community-post::before,\n  .community-post-avatar,\n  .community-member-row button {\n    transition:\n      none !important;\n  }\n}\n\n/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_5 */\n";

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
    "✅ Parser TypeScript: Community válido"
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
  "✅ BLOQUE 5 aplicado."
);
console.log(
  "✅ Comunidades principal mejorada."
);
console.log(
  "✅ Crear comunidad con motion."
);
console.log(
  "✅ Interior de comunidad mejorado."
);
console.log(
  "✅ Composer, eventos y feed refinados."
);
console.log(
  "✅ Miembros con motion."
);
console.log(
  "✅ Mobile 360–430px protegido."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
