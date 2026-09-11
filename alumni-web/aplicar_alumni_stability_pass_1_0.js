const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_STABILITY_PASS_1_0";

const FILES = {
  more:
    "src/app/more/page.tsx",
  moreCss:
    "src/app/more/more-premium.css",
  settings:
    "src/app/settings/page.tsx",
  settingsCss:
    "src/app/settings/settings-stability-3-0.css",
  feedback:
    "src/app/feedback/page.tsx",
  feedbackCss:
    "src/app/feedback/feedback-stability-3-1.css",
  director:
    "src/components/motion/AlumniMotionDirector.tsx",
  developer:
    "src/app/about/developer/page.tsx",
  topbar:
    "src/components/layout/TopBar.tsx",
  globals:
    "src/app/globals.css",
};

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
      `No encontré ${rel}`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(/\r\n/g, "\n");
}

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-stability-pass-1.0.bak";

  if (
    !fs.existsSync(
      target
    )
  ) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

function write(
  rel,
  content
) {
  fs.mkdirSync(
    path.dirname(
      abs(rel)
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    abs(rel),
    content,
    "utf8"
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

let settings =
  read(FILES.settings);
let feedback =
  read(FILES.feedback);
let developer =
  read(FILES.developer);
let topbar =
  read(FILES.topbar);
let globals =
  read(FILES.globals);

backup(
  FILES.more,
  read(FILES.more)
);
backup(
  FILES.moreCss,
  read(FILES.moreCss)
);
backup(
  FILES.settings,
  settings
);
backup(
  FILES.feedback,
  feedback
);
backup(
  FILES.director,
  read(FILES.director)
);
backup(
  FILES.developer,
  developer
);
backup(
  FILES.topbar,
  topbar
);
backup(
  FILES.globals,
  globals
);

/* ======================================================
   MORE
   ====================================================== */

const nextMore =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  Bell,\n  Bookmark,\n  BookOpen,\n  CalendarDays,\n  ChevronRight,\n  Info,\n  MessageCircleMore,\n  Settings2,\n  UsersRound,\n} from \"lucide-react\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"./more-premium.css\";\n\nconst settingsItems = [\n  {\n    href: \"/settings\",\n    label: \"Configuración\",\n    icon: Settings2,\n  },\n  {\n    href: \"/notifications\",\n    label: \"Notificaciones\",\n    icon: Bell,\n  },\n  {\n    href:\n      \"/settings?section=profile&view=saved\",\n    label: \"Guardados\",\n    icon: Bookmark,\n  },\n  {\n    href: \"/passport\",\n    label: \"Pasaporte Alumni\",\n    icon: BookOpen,\n  },\n  {\n    href: \"/feedback\",\n    label: \"Ayuda y feedback\",\n    icon: MessageCircleMore,\n  },\n  {\n    href: \"/about\",\n    label: \"Acerca de ALUMNI\",\n    icon: Info,\n  },\n];\n\nexport default function MorePage() {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <AppShell>\n      <main\n        className=\"alumni-more-clean mx-auto w-full max-w-[680px]\"\n        data-alumni-motion-ignore=\"true\"\n      >\n        <motion.header\n          className=\"alumni-more-clean-header\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: -6,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            duration: 0.4,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <h1>\n            Conecta con más\n          </h1>\n        </motion.header>\n\n        <section className=\"alumni-more-clean-featured\">\n          <motion.div\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 10,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.07,\n              duration: 0.4,\n            }}\n            whileTap={\n              reduceMotion\n                ? undefined\n                : {\n                    scale: 0.98,\n                  }\n            }\n          >\n            <Link\n              href=\"/events\"\n              className=\"alumni-more-clean-card\"\n            >\n              <span className=\"alumni-more-clean-card-icon\">\n                <CalendarDays\n                  size={21}\n                  strokeWidth={1.9}\n                />\n              </span>\n\n              <strong>\n                Eventos\n              </strong>\n\n              <ChevronRight\n                size={17}\n              />\n            </Link>\n          </motion.div>\n\n          <motion.div\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 10,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.12,\n              duration: 0.4,\n            }}\n            whileTap={\n              reduceMotion\n                ? undefined\n                : {\n                    scale: 0.98,\n                  }\n            }\n          >\n            <Link\n              href=\"/community\"\n              className=\"alumni-more-clean-card\"\n            >\n              <span className=\"alumni-more-clean-card-icon\">\n                <UsersRound\n                  size={21}\n                  strokeWidth={1.9}\n                />\n              </span>\n\n              <strong>\n                Comunidades\n              </strong>\n\n              <ChevronRight\n                size={17}\n              />\n            </Link>\n          </motion.div>\n        </section>\n\n        <motion.section\n          className=\"alumni-more-clean-settings\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 10,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.16,\n            duration: 0.42,\n          }}\n        >\n          <h2>Ajustes</h2>\n\n          <div className=\"alumni-more-clean-list\">\n            {settingsItems.map(\n              ({\n                href,\n                label,\n                icon: Icon,\n              }) => (\n                <Link\n                  key={href}\n                  href={href}\n                  className=\"alumni-more-clean-row\"\n                >\n                  <span className=\"alumni-more-clean-row-icon\">\n                    <Icon\n                      size={18}\n                      strokeWidth={1.9}\n                    />\n                  </span>\n\n                  <strong>\n                    {label}\n                  </strong>\n\n                  <ChevronRight\n                    size={17}\n                  />\n                </Link>\n              )\n            )}\n          </div>\n        </motion.section>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_MORE_CLEAN_2_1 */\n/* ALUMNI_STABILITY_PASS_1_0 */\n";
const nextMoreCss =
  ".alumni-more-clean {\n  --more-clean-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  width: 100%;\n  padding-bottom: 28px;\n}\n\n.alumni-more-clean-header {\n  display: flex;\n  min-height: 58px;\n  align-items: center;\n  padding: 2px 2px 4px;\n}\n\n.alumni-more-clean-header h1 {\n  margin: 0;\n  color: var(--app-text);\n  font-size:\n    clamp(\n      26px,\n      7.5vw,\n      34px\n    );\n  line-height: 1.04;\n  font-weight: 950;\n  letter-spacing: -.045em;\n}\n\n.alumni-more-clean-featured {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0, 1fr)\n    );\n  gap: 10px;\n  margin-top: 10px;\n}\n\n.alumni-more-clean-featured\n> div {\n  min-width: 0;\n}\n\n.alumni-more-clean-card {\n  display: grid;\n  width: 100%;\n  min-height: 106px;\n  grid-template-columns:\n    minmax(0, 1fr)\n    18px;\n  grid-template-rows:\n    1fr auto;\n  align-items: center;\n  gap: 8px;\n  padding: 15px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 19px;\n  background:\n    var(--app-surface);\n  color:\n    var(--app-text);\n  text-decoration: none;\n  transition:\n    background-color 160ms ease,\n    border-color 160ms ease;\n}\n\n.alumni-more-clean-card:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-more-clean-card-icon {\n  display: inline-flex;\n  width: 40px;\n  height: 40px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  background:\n    var(--more-clean-wash);\n  color:\n    var(--app-accent);\n}\n\n.alumni-more-clean-card\nstrong {\n  align-self: end;\n  font-size: 12.5px;\n  font-weight: 900;\n  letter-spacing: -.02em;\n}\n\n.alumni-more-clean-card\n> svg {\n  align-self: end;\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-more-clean-settings {\n  margin-top: 28px;\n}\n\n.alumni-more-clean-settings h2 {\n  margin:\n    0 0 9px\n    2px;\n  color:\n    var(--app-text);\n  font-size: 15px;\n  font-weight: 900;\n  letter-spacing: -.025em;\n}\n\n.alumni-more-clean-list {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-more-clean-row {\n  display: grid;\n  grid-template-columns:\n    36px\n    minmax(0, 1fr)\n    18px;\n  align-items: center;\n  gap: 11px;\n  min-height: 58px;\n  padding: 8px 13px;\n  border-top:\n    1px solid\n    var(--app-border);\n  color: inherit;\n  text-decoration: none;\n  transition:\n    background-color 150ms ease;\n}\n\n.alumni-more-clean-row:first-child {\n  border-top: 0;\n}\n\n.alumni-more-clean-row:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-more-clean-row-icon {\n  display: inline-flex;\n  width: 34px;\n  height: 34px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 11px;\n  background:\n    var(--app-soft);\n  color:\n    var(--app-text-soft);\n}\n\n.alumni-more-clean-row:nth-last-child(2)\n.alumni-more-clean-row-icon {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  color:\n    var(--app-accent);\n}\n\n.alumni-more-clean-row:last-child\n.alumni-more-clean-row-icon {\n  background:\n    var(--app-soft-strong);\n  color:\n    var(--app-muted);\n}\n\n.alumni-more-clean-row\nstrong {\n  overflow: hidden;\n  color:\n    var(--app-text);\n  font-size: 11.5px;\n  font-weight: 830;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-more-clean-row\n> svg {\n  color:\n    var(--app-muted-3);\n}\n\n@media (max-width: 390px) {\n  .alumni-more-clean-card {\n    min-height: 100px;\n    padding: 13px;\n  }\n\n  .alumni-more-clean-row {\n    min-height: 56px;\n    padding:\n      7px 12px;\n  }\n}\n\n/* ALUMNI_STABILITY_PASS_1_0 */\n";

/* ======================================================
   SETTINGS
   ====================================================== */

if (
  !settings.includes(
    `./settings-stability-3-0.css`
  )
) {
  const importNeedle =
    `import "./settings-edit-profile-repair-1-1.css";`;

  if (
    !settings.includes(
      importNeedle
    )
  ) {
    fail(
      "No encontré el último import CSS de Settings."
    );
  }

  settings =
    settings.replace(
      importNeedle,
      `${importNeedle}
import "./settings-stability-3-0.css";`
    );
}

/* Feedback belongs to More, not duplicated inside Configuración. */
if (
  settings.includes(
    `router.push("/feedback")`
  ) ||
  settings.includes(
    `router.push(\"/feedback\")`
  )
) {
  const anchorCandidates = [
    `router.push("/feedback")`,
    `router.push(\"/feedback\")`,
  ];

  const anchor =
    anchorCandidates.find(
      (candidate) =>
        settings.includes(
          candidate
        )
    );

  const anchorIndex =
    settings.indexOf(
      anchor
    );

  const buttonStart =
    settings.lastIndexOf(
      "<button",
      anchorIndex
    );

  const buttonEnd =
    settings.indexOf(
      "</button>",
      anchorIndex
    );

  if (
    buttonStart < 0 ||
    buttonEnd < 0
  ) {
    fail(
      "Encontré Feedback en Settings, pero no pude aislar su botón."
    );
  }

  const block =
    settings.slice(
      buttonStart,
      buttonEnd +
        "</button>".length
    );

  if (
    !block.includes(
      "alumni-settings-classic-row"
    )
  ) {
    fail(
      "El bloque Feedback de Settings no coincide con la estructura esperada."
    );
  }

  settings =
    settings.slice(
      0,
      buttonStart
    ) +
    settings.slice(
      buttonEnd +
        "</button>".length
    );
}

if (
  !settings.includes(
    "<CircleHelp"
  )
) {
  settings =
    settings.replace(
      `  CircleHelp,\n`,
      ""
    );
}

if (
  !settings.includes(
    `data-alumni-motion-ignore="true"`
  )
) {
  const settingsRoot =
    `        data-settings-design="option-1-classic"
      >`;

  if (
    !settings.includes(
      settingsRoot
    )
  ) {
    fail(
      "No encontré la raíz de Settings."
    );
  }

  settings =
    settings.replace(
      settingsRoot,
      `        data-settings-design="option-1-classic"
        data-alumni-motion-ignore="true"
      >`
    );
}

settings =
  settings.replace(
    `className="alumni-settings-loading py-16 text-center text-sm text-[var(--app-muted-2)]"`,
    `className="alumni-settings-loading py-16 text-center text-sm text-[var(--app-muted-2)]" data-alumni-motion-ignore="true"`
  );

settings +=
  `\n/* ${MARKER}:SETTINGS */\n`;

/* ======================================================
   FEEDBACK
   ====================================================== */

if (
  !feedback.includes(
    `./feedback-stability-3-1.css`
  )
) {
  const feedbackImport =
    `import "./feedback-pro-3-0.css";`;

  if (
    !feedback.includes(
      feedbackImport
    )
  ) {
    fail(
      "No encontré feedback-pro-3-0.css."
    );
  }

  feedback =
    feedback.replace(
      feedbackImport,
      `${feedbackImport}
import "./feedback-stability-3-1.css";`
    );
}

/* Make premium shell apply to success + normal states too. */
feedback =
  feedback.replaceAll(
    `className="alumni-help-v2"`,
    `className="alumni-help-v2 alumni-feedback-pro-shell"`
  );

feedback =
  feedback.replace(
    `<main className="alumni-help-v2 alumni-feedback-pro-shell">`,
    `<main className="alumni-help-v2 alumni-feedback-pro-shell" data-alumni-motion-ignore="true">`
  );

/* Normal state is multiline. */
feedback =
  feedback.replace(
    `        className="alumni-help-v2 alumni-feedback-pro-shell"
        data-feedback-view={` ,
    `        className="alumni-help-v2 alumni-feedback-pro-shell"
        data-alumni-motion-ignore="true"
        data-feedback-view={`
  );

/* In case success is a second one-line shell, mark it too. */
feedback =
  feedback.replaceAll(
    `<main className="alumni-help-v2 alumni-feedback-pro-shell">`,
    `<main className="alumni-help-v2 alumni-feedback-pro-shell" data-alumni-motion-ignore="true">`
  );

feedback +=
  `\n/* ${MARKER}:FEEDBACK */\n`;

/* ======================================================
   DEVELOPER — preserve the reference screen exactly
   ====================================================== */

if (
  !developer.includes(
    `data-alumni-motion-ignore="true"`
  )
) {
  const developerRoot =
    `<main className="alumni-about-page alumni-developer-page alumni-dev-showcase mx-auto w-full max-w-[680px]">`;

  if (
    !developer.includes(
      developerRoot
    )
  ) {
    fail(
      "No encontré la raíz de Desarrollador."
    );
  }

  developer =
    developer.replace(
      developerRoot,
      `<main className="alumni-about-page alumni-developer-page alumni-dev-showcase mx-auto w-full max-w-[680px]" data-alumni-motion-ignore="true">`
    );
}

developer +=
  `\n/* ${MARKER}:DEVELOPER */\n`;

/* ======================================================
   TOPBAR — keep interior pages stable
   ====================================================== */

const oldVisibleRule =
  `  const keepProfileNavVisible =
    pathname === "/profile" ||
    pathname.startsWith("/u/");`;

const newVisibleRule =
  `  const keepProfileNavVisible =
    pathname === "/profile" ||
    pathname.startsWith("/u/") ||
    pathname === "/more" ||
    pathname.startsWith("/more/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/feedback" ||
    pathname.startsWith("/feedback/") ||
    pathname === "/about" ||
    pathname.startsWith("/about/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/events" ||
    pathname.startsWith("/events/") ||
    pathname === "/passport" ||
    pathname.startsWith("/passport/");`;

if (
  topbar.includes(
    oldVisibleRule
  )
) {
  topbar =
    topbar.replace(
      oldVisibleRule,
      newVisibleRule
    );
} else if (
  !topbar.includes(
    `pathname.startsWith("/feedback/")`
  )
) {
  fail(
    "La regla de visibilidad del TopBar cambió y necesita revisión."
  );
}

topbar +=
  `\n/* ${MARKER}:TOPBAR */\n`;

/* ======================================================
   GLOBAL STABILITY
   ====================================================== */

if (
  !globals.includes(
    `${MARKER} */`
  )
) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    "\n/* =========================================================\n   ALUMNI Stability Pass 1.0\n   Motion without structural drift.\n   ========================================================= */\n\n[data-alumni-motion-auto=\"true\"][\n  data-alumni-motion-kind=\"card\"\n][data-alumni-motion-state=\"pending\"] {\n  transform:\n    translate3d(\n      0,\n      5px,\n      0\n    ) !important;\n}\n\n[data-alumni-motion-auto=\"true\"][\n  data-alumni-motion-kind=\"card\"\n][data-alumni-motion-state=\"visible\"] {\n  transform:\n    translate3d(\n      0,\n      0,\n      0\n    ) !important;\n}\n\n[data-alumni-topbar=\"true\"],\n[data-alumni-mobile-nav=\"true\"],\n.alumni-help-header,\n.alumni-settings-classic-header,\n.alumni-settings-detail-header {\n  transform-origin:\n    center center;\n}\n\n[data-alumni-motion-ignore=\"true\"]\n[data-alumni-motion-auto=\"true\"] {\n  opacity:\n    1 !important;\n  transform:\n    none !important;\n  transition-delay:\n    0ms !important;\n}\n\n/* Keep fixed navigation independent from content motion. */\n[data-alumni-mobile-nav=\"true\"] {\n  contain:\n    layout style;\n}\n\n/* ALUMNI_STABILITY_PASS_1_0 */\n".trim() +
    "\n";
}

/* ======================================================
   VALIDATE TSX
   ====================================================== */

const nextDirector =
  "\"use client\";\n\nimport {\n  useEffect,\n} from \"react\";\n\n/*\n * Stability-first motion director.\n *\n * Motion sigue siendo parte de ALUMNI, pero el director automático\n * ya no toca cualquier clase que contenga \"row\", \"profile\", \"item\", etc.\n * Esas coincidencias amplias podían animar contenedores estructurales.\n *\n * Las pantallas premium usan Framer Motion de forma explícita.\n * Este director queda como respaldo únicamente para superficies seguras.\n */\n\nconst SAFE_SELECTOR = [\n  \"[data-alumni-motion-auto-target='true']\",\n  \".alumni-feed-post-viewport\",\n  \".events2-row\",\n  \".community2-row\",\n  \"[role='dialog']\",\n  \"dialog\",\n  \"[role='alert']\",\n  \".alumni-pro-toast\",\n].join(\",\");\n\nfunction kindOf(\n  element: HTMLElement\n) {\n  const role =\n    element.getAttribute(\n      \"role\"\n    );\n\n  if (\n    role === \"dialog\" ||\n    element.tagName ===\n      \"DIALOG\"\n  ) {\n    return \"overlay\";\n  }\n\n  if (\n    role === \"alert\" ||\n    element.classList.contains(\n      \"alumni-pro-toast\"\n    )\n  ) {\n    return \"toast\";\n  }\n\n  return \"card\";\n}\n\nfunction shouldSkip(\n  element: HTMLElement\n) {\n  if (\n    element.closest(\n      \"[data-alumni-motion-ignore='true']\"\n    )\n  ) {\n    return true;\n  }\n\n  if (\n    element.closest(\n      \"[data-alumni-mobile-nav='true']\"\n    ) ||\n    element.closest(\n      \"[data-alumni-topbar='true']\"\n    )\n  ) {\n    return true;\n  }\n\n  if (\n    element.dataset\n      .alumniMotionAuto\n  ) {\n    return true;\n  }\n\n  const style =\n    window.getComputedStyle(\n      element\n    );\n\n  if (\n    style.position ===\n      \"fixed\" ||\n    style.position ===\n      \"sticky\"\n  ) {\n    return true;\n  }\n\n  return false;\n}\n\nexport default function AlumniMotionDirector() {\n  useEffect(() => {\n    const reduced =\n      window.matchMedia(\n        \"(prefers-reduced-motion: reduce)\"\n      ).matches;\n\n    const watched =\n      new WeakSet<HTMLElement>();\n\n    const observer =\n      new IntersectionObserver(\n        (entries) => {\n          for (\n            const entry\n            of entries\n          ) {\n            if (\n              !entry.isIntersecting\n            ) {\n              continue;\n            }\n\n            const element =\n              entry.target as HTMLElement;\n\n            element.dataset.alumniMotionState =\n              \"visible\";\n\n            observer.unobserve(\n              element\n            );\n          }\n        },\n        {\n          root: null,\n          rootMargin:\n            \"0px 0px -2% 0px\",\n          threshold: 0.04,\n        }\n      );\n\n    function register(\n      element: HTMLElement,\n      order = 0\n    ) {\n      if (\n        watched.has(\n          element\n        ) ||\n        shouldSkip(\n          element\n        )\n      ) {\n        return;\n      }\n\n      const rect =\n        element.getBoundingClientRect();\n\n      if (\n        rect.width === 0 &&\n        rect.height === 0\n      ) {\n        return;\n      }\n\n      watched.add(\n        element\n      );\n\n      element.dataset.alumniMotionAuto =\n        \"true\";\n      element.dataset.alumniMotionKind =\n        kindOf(\n          element\n        );\n\n      element.style.setProperty(\n        \"--alumni-motion-order\",\n        String(\n          Math.min(\n            order,\n            4\n          )\n        )\n      );\n\n      if (reduced) {\n        element.dataset.alumniMotionState =\n          \"visible\";\n        return;\n      }\n\n      element.dataset.alumniMotionState =\n        \"pending\";\n\n      observer.observe(\n        element\n      );\n    }\n\n    function scan(\n      root:\n        | Document\n        | HTMLElement\n    ) {\n      if (\n        root instanceof\n          HTMLElement &&\n        root.matches(\n          SAFE_SELECTOR\n        )\n      ) {\n        register(\n          root,\n          0\n        );\n      }\n\n      root\n        .querySelectorAll<HTMLElement>(\n          SAFE_SELECTOR\n        )\n        .forEach(\n          (\n            element,\n            index\n          ) =>\n            register(\n              element,\n              index % 5\n            )\n        );\n    }\n\n    scan(\n      document\n    );\n\n    const mutation =\n      new MutationObserver(\n        (changes) => {\n          for (\n            const change\n            of changes\n          ) {\n            if (\n              change.type !==\n              \"childList\"\n            ) {\n              continue;\n            }\n\n            for (\n              const node\n              of change.addedNodes\n            ) {\n              if (\n                node instanceof\n                  HTMLElement\n              ) {\n                scan(\n                  node\n                );\n              }\n            }\n          }\n        }\n      );\n\n    mutation.observe(\n      document.body,\n      {\n        subtree: true,\n        childList: true,\n      }\n    );\n\n    return () => {\n      mutation.disconnect();\n      observer.disconnect();\n    };\n  }, []);\n\n  return null;\n}\n\n/* ALUMNI_MOTION_PASS_2_0_FULL_APP */\n/* ALUMNI_STABILITY_PASS_1_0 */\n";

try {
  const ts =
    require(
      "typescript"
    );

  const candidates = [
    [
      FILES.more,
      nextMore,
    ],
    [
      FILES.settings,
      settings,
    ],
    [
      FILES.feedback,
      feedback,
    ],
    [
      FILES.director,
      nextDirector,
    ],
    [
      FILES.developer,
      developer,
    ],
    [
      FILES.topbar,
      topbar,
    ],
  ];

  for (
    const [
      rel,
      content,
    ] of candidates
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
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
        `${rel}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: archivos válidos"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

/* ======================================================
   WRITE
   ====================================================== */

write(
  FILES.more,
  nextMore
);
write(
  FILES.moreCss,
  nextMoreCss
);
write(
  FILES.settings,
  settings
);
write(
  FILES.settingsCss,
  "/*\n * ALUMNI Settings Stability 3.0\n * Stable geometry + clean hierarchy.\n */\n\n.alumni-settings-classic {\n  width: 100% !important;\n  max-width: 580px !important;\n  margin:\n    0 auto !important;\n  padding-bottom:\n    30px !important;\n}\n\n.alumni-settings-classic-header,\n.alumni-settings-detail-header {\n  position:\n    relative !important;\n  top:\n    auto !important;\n  z-index:\n    2 !important;\n  grid-template-columns:\n    40px\n    minmax(0, 1fr)\n    40px !important;\n  min-height:\n    50px !important;\n  margin-bottom:\n    12px;\n  border-bottom:\n    0 !important;\n  background:\n    transparent !important;\n  backdrop-filter:\n    none !important;\n  -webkit-backdrop-filter:\n    none !important;\n  box-shadow:\n    none !important;\n}\n\n.alumni-settings-classic-header h1,\n.alumni-settings-detail-header h1 {\n  font-size:\n    15px !important;\n  font-weight:\n    900 !important;\n  letter-spacing:\n    -.025em !important;\n}\n\n.alumni-settings-classic-back,\n.alumni-settings-detail-header\nbutton {\n  width:\n    38px !important;\n  height:\n    38px !important;\n  border:\n    0 !important;\n  border-radius:\n    12px !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-text) !important;\n  transition:\n    background-color 150ms ease,\n    transform 130ms\n      cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-settings-classic-back:active,\n.alumni-settings-detail-header\nbutton:active {\n  transform:\n    scale(.93);\n  background:\n    var(--app-soft) !important;\n}\n\n.alumni-settings-profile-row {\n  min-height:\n    82px !important;\n  margin:\n    0 0 12px !important;\n  padding:\n    12px !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    18px !important;\n  background:\n    var(--app-surface) !important;\n}\n\n.alumni-settings-profile-avatar {\n  width:\n    54px !important;\n  height:\n    54px !important;\n  flex:\n    0 0 54px !important;\n  border:\n    2px solid\n    var(--app-bg) !important;\n  box-shadow:\n    0 0 0 1px\n    var(--app-border);\n}\n\n.alumni-settings-classic-list {\n  overflow:\n    hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-settings-classic-row {\n  min-height:\n    62px !important;\n  padding:\n    9px 12px !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  background:\n    transparent !important;\n}\n\n.alumni-settings-classic-row:last-child {\n  border-bottom:\n    0 !important;\n}\n\n.alumni-settings-row-icon {\n  width:\n    34px !important;\n  height:\n    34px !important;\n  flex:\n    0 0 34px !important;\n  border-radius:\n    11px !important;\n  background:\n    var(--app-soft) !important;\n  color:\n    var(--app-text-soft) !important;\n}\n\n.alumni-settings-row-copy\nstrong {\n  font-size:\n    12px !important;\n  font-weight:\n    850 !important;\n}\n\n.alumni-settings-row-copy\nsmall {\n  margin-top:\n    3px !important;\n  color:\n    var(--app-muted) !important;\n  font-size:\n    9.5px !important;\n  line-height:\n    1.35 !important;\n}\n\n.alumni-settings-logout {\n  min-height:\n    60px !important;\n  margin-top:\n    12px !important;\n  padding:\n    9px 12px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-danger) 18%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    16px !important;\n  background:\n    transparent !important;\n}\n\n.alumni-settings-detail-content {\n  width:\n    100%;\n  min-width:\n    0;\n  padding-top:\n    0 !important;\n}\n\n.alumni-settings-classic\n.alumni-settings-panel,\n.alumni-settings-classic\n.alumni-profile-settings-hub {\n  width:\n    100% !important;\n  max-width:\n    100% !important;\n  margin:\n    0 !important;\n}\n\n.alumni-settings-section-intro {\n  padding-top:\n    4px !important;\n}\n\n.alumni-profile-editor-top {\n  position:\n    relative !important;\n  top:\n    auto !important;\n  z-index:\n    2 !important;\n}\n\n.alumni-settings-privacy-backdrop,\n.alumni-account-flow-backdrop,\n.alumni-settings-picker-backdrop {\n  transform:\n    none !important;\n}\n\n.alumni-settings-privacy-modal,\n.alumni-account-flow-sheet,\n.alumni-settings-picker-sheet {\n  width:\n    100%;\n  max-width:\n    520px;\n  margin:\n    0 auto;\n}\n\n@media (min-width: 640px) {\n  .alumni-settings-privacy-modal,\n  .alumni-account-flow-sheet,\n  .alumni-settings-picker-sheet {\n    border-radius:\n      22px !important;\n  }\n}\n\n/* ALUMNI_STABILITY_PASS_1_0 */\n"
);
write(
  FILES.feedback,
  feedback
);
write(
  FILES.feedbackCss,
  "/*\n * ALUMNI Feedback Stability 3.1\n * Keeps the premium look but restores predictable geometry.\n */\n\n.alumni-help-v2.alumni-feedback-pro-shell {\n  width:\n    100% !important;\n  max-width:\n    640px !important;\n  margin:\n    0 auto !important;\n  padding-bottom:\n    calc(\n      96px +\n      env(safe-area-inset-bottom)\n    ) !important;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-header {\n  position:\n    relative !important;\n  top:\n    auto !important;\n  z-index:\n    2 !important;\n  grid-template-columns:\n    40px\n    minmax(0, 1fr)\n    40px !important;\n  min-height:\n    50px !important;\n  margin-bottom:\n    12px;\n  border-bottom:\n    0 !important;\n  background:\n    transparent !important;\n  backdrop-filter:\n    none !important;\n  -webkit-backdrop-filter:\n    none !important;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-header\n> button {\n  width:\n    38px !important;\n  height:\n    38px !important;\n  border-radius:\n    12px !important;\n  transition:\n    transform 130ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color\n      150ms ease;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-header\n> button:active {\n  transform:\n    scale(.93);\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-header h1 {\n  font-size:\n    15px !important;\n  font-weight:\n    900 !important;\n}\n\n.alumni-feedback-pro-home {\n  padding-top:\n    0 !important;\n}\n\n.alumni-feedback-pro-hero {\n  padding:\n    24px 19px\n    21px !important;\n  border-radius:\n    22px !important;\n}\n\n.alumni-feedback-pro-hero h2 {\n  margin-top:\n    18px !important;\n  font-size:\n    clamp(\n      27px,\n      7.5vw,\n      38px\n    ) !important;\n}\n\n.alumni-feedback-pro-hero\n> p {\n  margin-top:\n    12px !important;\n  font-size:\n    11.5px !important;\n  line-height:\n    1.62 !important;\n}\n\n.alumni-feedback-pro-signal {\n  margin-top:\n    18px !important;\n}\n\n.alumni-feedback-pro-featured {\n  margin-top:\n    10px !important;\n}\n\n.alumni-feedback-pro-feature {\n  min-height:\n    72px;\n  padding:\n    13px 14px !important;\n  border-radius:\n    17px !important;\n}\n\n.alumni-feedback-pro-tools {\n  margin-top:\n    26px !important;\n}\n\n.alumni-feedback-pro-section-title {\n  padding-bottom:\n    9px !important;\n}\n\n.alumni-feedback-pro-tool-list {\n  border-radius:\n    17px !important;\n}\n\n.alumni-feedback-pro-tool-row {\n  min-height:\n    62px !important;\n  padding:\n    8px 13px !important;\n}\n\n.alumni-feedback-pro-direct {\n  padding:\n    13px !important;\n  border-radius:\n    17px !important;\n}\n\n.alumni-feedback-editorial,\n.alumni-help-detail,\n.alumni-help-success {\n  width:\n    100%;\n  max-width:\n    100%;\n  margin-right:\n    auto;\n  margin-left:\n    auto;\n}\n\n.alumni-feedback-editorial-hero,\n.alumni-help-detail-intro {\n  margin-top:\n    0 !important;\n}\n\n.alumni-help-faqs,\n.alumni-help-status-list,\n.alumni-help-legal-list {\n  width:\n    100%;\n}\n\n.alumni-feedback-editorial-field\ninput,\n.alumni-feedback-editorial-field\ntextarea {\n  width:\n    100%;\n  max-width:\n    100%;\n}\n\n.alumni-help-success {\n  max-width:\n    520px;\n}\n\n@media (max-width: 480px) {\n  .alumni-feedback-pro-hero {\n    padding:\n      22px 17px\n      20px !important;\n  }\n}\n\n/* ALUMNI_STABILITY_PASS_1_0 */\n"
);
write(
  FILES.director,
  nextDirector
);
write(
  FILES.developer,
  developer
);
write(
  FILES.topbar,
  topbar
);
write(
  FILES.globals,
  globals
);

console.log("");
console.log(
  "✅ ALUMNI Stability Pass 1.0 aplicado."
);
console.log(
  "✅ Motion automático estabilizado."
);
console.log(
  "✅ Headers interiores dejan de saltar."
);
console.log(
  "✅ TopBar estable en pantallas interiores."
);
console.log(
  "✅ Más: Conecta con más."
);
console.log(
  "✅ Feedback y Acerca de usan iconos distintos."
);
console.log(
  "✅ Feedback eliminado de Configuración para evitar duplicado."
);
console.log(
  "✅ Ajustes alineados y contenidos."
);
console.log(
  "✅ Feedback premium alineado y contenido."
);
console.log(
  "✅ Desarrollador protegido del motion automático."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
