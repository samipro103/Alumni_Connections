const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_MOTION_PASS_2_0_FULL_APP";

const APP_SHELL =
  "src/components/layout/AppShell.tsx";
const GLOBALS =
  "src/app/globals.css";
const BASE_MOTION =
  "src/components/motion/AlumniMotion.tsx";
const DIRECTOR =
  "src/components/motion/AlumniMotionDirector.tsx";

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
    ".before-motion-pass-2.0.bak";

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

function addAfter(
  source,
  needle,
  addition,
  label
) {
  if (
    source.includes(
      addition.trim()
    )
  ) {
    return source;
  }

  if (
    !source.includes(
      needle
    )
  ) {
    fail(
      `No encontré bloque esperado: ${label}`
    );
  }

  return source.replace(
    needle,
    needle + addition
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

let appShell =
  read(APP_SHELL);
let globals =
  read(GLOBALS);

if (
  appShell.includes(
    MARKER
  ) &&
  globals.includes(
    MARKER
  ) &&
  fs.existsSync(
    abs(DIRECTOR)
  )
) {
  console.log(
    "✅ Motion Pass 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  APP_SHELL,
  appShell
);
backup(
  GLOBALS,
  globals
);

/* ======================================================
   Guarantee Motion System 1.0 base
   ====================================================== */

if (
  !fs.existsSync(
    abs(BASE_MOTION)
  )
) {
  fs.mkdirSync(
    path.dirname(
      abs(BASE_MOTION)
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    abs(BASE_MOTION),
    "\"use client\";\n\nimport {\n  ReactNode,\n} from \"react\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  usePathname,\n} from \"next/navigation\";\n\ntype MotionBaseProps = {\n  children: ReactNode;\n  className?: string;\n};\n\nexport function AlumniRouteMotion({\n  children,\n  className = \"\",\n}: MotionBaseProps) {\n  const pathname =\n    usePathname();\n\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      key={pathname}\n      className={`alumni-motion-route ${className}`}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 8,\n              scale: 0.995,\n            }\n      }\n      animate={{\n        opacity: 1,\n        y: 0,\n        scale: 1,\n      }}\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.34,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionReveal({\n  children,\n  className = \"\",\n  delay = 0,\n}: MotionBaseProps & {\n  delay?: number;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 18,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.18,\n      }}\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.48,\n        delay:\n          reduceMotion\n            ? 0\n            : delay,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionCard({\n  children,\n  className = \"\",\n  delay = 0,\n}: MotionBaseProps & {\n  delay?: number;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 14,\n              scale: 0.99,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n        scale: 1,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.16,\n      }}\n      whileHover={\n        reduceMotion\n          ? undefined\n          : {\n              y: -2,\n            }\n      }\n      whileTap={\n        reduceMotion\n          ? undefined\n          : {\n              scale: 0.992,\n            }\n      }\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.38,\n        delay:\n          reduceMotion\n            ? 0\n            : delay,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionPressable({\n  children,\n  className = \"\",\n}: MotionBaseProps) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      whileTap={\n        reduceMotion\n          ? undefined\n          : {\n              scale: 0.975,\n            }\n      }\n      transition={{\n        duration: 0.13,\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\n/* ALUMNI_MOTION_SYSTEM_1_0 */\n/* ALUMNI_MOTION_PASS_2_0_FULL_APP */\n",
    "utf8"
  );
}

if (
  !appShell.includes(
    `@/components/motion/AlumniMotion"`
  )
) {
  appShell = addAfter(
    appShell,
    `import PushNotificationBootstrap from "@/components/notifications/PushNotificationBootstrap";`,
    `
import {
  AlumniRouteMotion,
} from "@/components/motion/AlumniMotion";`,
    "AlumniRouteMotion import"
  );
}

if (
  !appShell.includes(
    `<AlumniRouteMotion>`
  )
) {
  const before =
    `            <main className="min-w-0">
              {children}
            </main>`;

  const after =
    `            <main className="min-w-0">
              <AlumniRouteMotion>
                {children}
              </AlumniRouteMotion>
            </main>`;

  if (
    !appShell.includes(
      before
    )
  ) {
    fail(
      "No encontré el main central de AppShell."
    );
  }

  appShell =
    appShell.replace(
      before,
      after
    );
}

/* ======================================================
   Full-app Motion Director
   ====================================================== */

if (
  !appShell.includes(
    `AlumniMotionDirector`
  )
) {
  appShell = addAfter(
    appShell,
    `import {
  AlumniRouteMotion,
} from "@/components/motion/AlumniMotion";`,
    `
import AlumniMotionDirector from "@/components/motion/AlumniMotionDirector";`,
    "Motion Director import"
  );
}

if (
  !appShell.includes(
    `<AlumniMotionDirector />`
  )
) {
  const mountNeedle =
    `      <PushNotificationBootstrap />`;

  if (
    !appShell.includes(
      mountNeedle
    )
  ) {
    fail(
      "No encontré bootstrap de AppShell."
    );
  }

  appShell =
    appShell.replace(
      mountNeedle,
      `${mountNeedle}
      <AlumniMotionDirector />`
    );
}

appShell +=
  `\n/* ${MARKER} */\n`;

const director =
  "\"use client\";\n\nimport {\n  useEffect,\n} from \"react\";\n\nconst MOTION_SELECTOR = [\n  \"article\",\n  \"[role='dialog']\",\n  \"dialog\",\n  \"[role='alert']\",\n  \"[class*='card']\",\n  \"[class*='Card']\",\n  \"[class*='row']\",\n  \"[class*='Row']\",\n  \"[class*='item']\",\n  \"[class*='Item']\",\n  \"[class*='tile']\",\n  \"[class*='Tile']\",\n  \"[class*='result']\",\n  \"[class*='Result']\",\n  \"[class*='post']\",\n  \"[class*='Post']\",\n  \"[class*='message']\",\n  \"[class*='Message']\",\n  \"[class*='event']\",\n  \"[class*='Event']\",\n  \"[class*='community']\",\n  \"[class*='Community']\",\n  \"[class*='profile']\",\n  \"[class*='Profile']\",\n  \"[class*='modal']\",\n  \"[class*='Modal']\",\n  \"[class*='sheet']\",\n  \"[class*='Sheet']\",\n  \"[class*='drawer']\",\n  \"[class*='Drawer']\",\n  \"[class*='popover']\",\n  \"[class*='Popover']\",\n  \"[class*='toast']\",\n  \"[class*='Toast']\",\n  \"[class*='empty']\",\n  \"[class*='Empty']\",\n  \"[class*='loading']\",\n  \"[class*='Loading']\",\n  \"[class*='skeleton']\",\n  \"[class*='Skeleton']\",\n].join(\",\");\n\nconst EXCLUDED_HINTS = [\n  \"wrapper\",\n  \"container\",\n  \"layout\",\n  \"shell\",\n  \"grid\",\n  \"header\",\n  \"topbar\",\n  \"sidebar\",\n  \"rail\",\n  \"spacer\",\n  \"copy\",\n  \"icon\",\n  \"avatar\",\n  \"badge\",\n  \"counter\",\n  \"label\",\n  \"title\",\n];\n\nfunction classText(\n  element: HTMLElement\n) {\n  return String(\n    element.className || \"\"\n  ).toLowerCase();\n}\n\nfunction kindOf(\n  element: HTMLElement\n) {\n  const classes =\n    classText(element);\n\n  const role =\n    element.getAttribute(\n      \"role\"\n    );\n\n  if (\n    element.tagName ===\n      \"DIALOG\" ||\n    role ===\n      \"dialog\" ||\n    /modal|sheet|drawer|popover/.test(\n      classes\n    )\n  ) {\n    return \"overlay\";\n  }\n\n  if (\n    role === \"alert\" ||\n    /toast/.test(\n      classes\n    )\n  ) {\n    return \"toast\";\n  }\n\n  if (\n    /loading|skeleton/.test(\n      classes\n    )\n  ) {\n    return \"loading\";\n  }\n\n  if (\n    /empty/.test(\n      classes\n    )\n  ) {\n    return \"status\";\n  }\n\n  if (\n    /message|comment/.test(\n      classes\n    )\n  ) {\n    return \"conversation\";\n  }\n\n  if (\n    /post|card|event|community|profile/.test(\n      classes\n    ) ||\n    element.tagName ===\n      \"ARTICLE\"\n  ) {\n    return \"card\";\n  }\n\n  return \"row\";\n}\n\nfunction shouldSkip(\n  element: HTMLElement\n) {\n  if (\n    element.dataset\n      .alumniMotionManual ===\n      \"true\" ||\n    element.closest(\n      \"[data-alumni-motion-ignore='true']\"\n    )\n  ) {\n    return true;\n  }\n\n  if (\n    element.dataset\n      .alumniMotionAuto\n  ) {\n    return true;\n  }\n\n  if (\n    element ===\n      document.body ||\n    element ===\n      document.documentElement\n  ) {\n    return true;\n  }\n\n  const classes =\n    classText(element);\n\n  const hasStrongHint =\n    /modal|sheet|drawer|popover|toast|loading|skeleton|empty/.test(\n      classes\n    ) ||\n    element.getAttribute(\n      \"role\"\n    ) ===\n      \"dialog\" ||\n    element.tagName ===\n      \"DIALOG\";\n\n  if (\n    !hasStrongHint &&\n    EXCLUDED_HINTS.some(\n      (hint) =>\n        classes.includes(\n          hint\n        )\n    )\n  ) {\n    return true;\n  }\n\n  if (\n    element.closest(\n      \"[data-alumni-mobile-nav='true']\"\n    )\n  ) {\n    return true;\n  }\n\n  return false;\n}\n\nexport default function AlumniMotionDirector() {\n  useEffect(() => {\n    const reduced =\n      window.matchMedia(\n        \"(prefers-reduced-motion: reduce)\"\n      ).matches;\n\n    let frame = 0;\n\n    const watched =\n      new WeakSet<HTMLElement>();\n\n    const intersection =\n      new IntersectionObserver(\n        (entries) => {\n          for (\n            const entry\n            of entries\n          ) {\n            if (\n              !entry.isIntersecting\n            ) {\n              continue;\n            }\n\n            const element =\n              entry.target as HTMLElement;\n\n            element.dataset.alumniMotionState =\n              \"visible\";\n\n            intersection.unobserve(\n              element\n            );\n          }\n        },\n        {\n          root: null,\n          rootMargin:\n            \"0px 0px -3% 0px\",\n          threshold: 0.04,\n        }\n      );\n\n    function register(\n      element: HTMLElement,\n      index = 0\n    ) {\n      if (\n        watched.has(\n          element\n        ) ||\n        shouldSkip(\n          element\n        )\n      ) {\n        return;\n      }\n\n      const rect =\n        element.getBoundingClientRect();\n\n      const classes =\n        classText(element);\n\n      const potentiallyHidden =\n        /modal|sheet|drawer|popover|toast/.test(\n          classes\n        ) ||\n        element.getAttribute(\n          \"role\"\n        ) ===\n          \"dialog\" ||\n        element.tagName ===\n          \"DIALOG\";\n\n      if (\n        !potentiallyHidden &&\n        (\n          rect.width < 56 ||\n          rect.height < 26\n        )\n      ) {\n        return;\n      }\n\n      if (\n        rect.width === 0 &&\n        rect.height === 0\n      ) {\n        return;\n      }\n\n      watched.add(\n        element\n      );\n\n      element.dataset.alumniMotionAuto =\n        \"true\";\n      element.dataset.alumniMotionKind =\n        kindOf(\n          element\n        );\n\n      element.style.setProperty(\n        \"--alumni-motion-order\",\n        String(\n          Math.min(\n            index,\n            5\n          )\n        )\n      );\n\n      if (reduced) {\n        element.dataset.alumniMotionState =\n          \"visible\";\n        return;\n      }\n\n      element.dataset.alumniMotionState =\n        \"pending\";\n\n      intersection.observe(\n        element\n      );\n    }\n\n    function scan(\n      root:\n        | Document\n        | HTMLElement\n    ) {\n      const candidates =\n        root.querySelectorAll<HTMLElement>(\n          MOTION_SELECTOR\n        );\n\n      candidates.forEach(\n        (\n          element,\n          index\n        ) => {\n          register(\n            element,\n            index % 6\n          );\n        }\n      );\n\n      if (\n        root instanceof\n          HTMLElement &&\n        root.matches(\n          MOTION_SELECTOR\n        )\n      ) {\n        register(\n          root\n        );\n      }\n    }\n\n    function scheduleScan(\n      root:\n        | Document\n        | HTMLElement =\n          document\n    ) {\n      window.cancelAnimationFrame(\n        frame\n      );\n\n      frame =\n        window.requestAnimationFrame(\n          () => {\n            scan(root);\n          }\n        );\n    }\n\n    scheduleScan(\n      document\n    );\n\n    const mutation =\n      new MutationObserver(\n        (mutations) => {\n          for (\n            const change\n            of mutations\n          ) {\n            if (\n              change.type ===\n                \"childList\"\n            ) {\n              for (\n                const node\n                of change.addedNodes\n              ) {\n                if (\n                  node instanceof\n                    HTMLElement\n                ) {\n                  scheduleScan(\n                    node\n                  );\n                }\n              }\n            }\n\n            if (\n              change.type ===\n                \"attributes\" &&\n              change.target instanceof\n                HTMLElement &&\n              !change.target.dataset\n                .alumniMotionAuto\n            ) {\n              scheduleScan(\n                change.target\n              );\n            }\n          }\n        }\n      );\n\n    mutation.observe(\n      document.body,\n      {\n        subtree: true,\n        childList: true,\n        attributes: true,\n        attributeFilter: [\n          \"class\",\n          \"style\",\n          \"open\",\n          \"aria-hidden\",\n          \"data-state\",\n        ],\n      }\n    );\n\n    return () => {\n      window.cancelAnimationFrame(\n        frame\n      );\n      mutation.disconnect();\n      intersection.disconnect();\n    };\n  }, []);\n\n  return null;\n}\n\n/* ALUMNI_MOTION_PASS_2_0_FULL_APP */\n";

fs.mkdirSync(
  path.dirname(
    abs(DIRECTOR)
  ),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  abs(DIRECTOR),
  director,
  "utf8"
);

/* ======================================================
   Global motion CSS
   ====================================================== */

const motionCss =
  "\n/* =========================================================\n   ALUMNI Motion Pass 2.0 — Full App\n   Feed / Profile / Messages / Search / More / Events /\n   Community / Modals / Lists / Loaders / Dynamic content\n   ========================================================= */\n\n:root {\n  --alumni-motion-fast: 130ms;\n  --alumni-motion-base: 180ms;\n  --alumni-motion-slow: 340ms;\n  --alumni-motion-reveal: 460ms;\n  --alumni-motion-ease:\n    cubic-bezier(.2,.8,.2,1);\n  --alumni-motion-spring:\n    cubic-bezier(.16,1,.3,1);\n}\n\n/* Route transition */\n\n.alumni-motion-route {\n  width: 100%;\n  min-width: 0;\n  transform-origin:\n    50% 18%;\n  will-change:\n    transform,\n    opacity;\n}\n\n/* Interactive micro-motion */\n\n:where(\n  button,\n  a,\n  input,\n  textarea,\n  select,\n  summary,\n  [role=\"button\"],\n  [tabindex]\n) {\n  transition:\n    background-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    border-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    opacity\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease),\n    box-shadow\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    filter\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease);\n}\n\n:where(\n  button:not(:disabled),\n  a[href],\n  summary,\n  [role=\"button\"]\n):active {\n  filter:\n    brightness(.965);\n}\n\n/* Auto motion surfaces */\n\n[data-alumni-motion-auto=\"true\"] {\n  --alumni-enter-delay:\n    calc(\n      var(\n        --alumni-motion-order,\n        0\n      ) * 32ms\n    );\n}\n\n[data-alumni-motion-auto=\"true\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  opacity: 0;\n  pointer-events:\n    inherit;\n}\n\n[data-alumni-motion-auto=\"true\"][\n  data-alumni-motion-state=\"visible\"\n] {\n  opacity: 1;\n  transform:\n    translate3d(\n      0,\n      0,\n      0\n    )\n    scale(1);\n}\n\n/* Cards: feed posts, profiles, events, community, cards */\n\n[data-alumni-motion-kind=\"card\"] {\n  transform-origin:\n    50% 30%;\n  transition:\n    opacity\n      var(--alumni-motion-reveal)\n      var(--alumni-motion-ease)\n      var(--alumni-enter-delay),\n    transform\n      var(--alumni-motion-reveal)\n      var(--alumni-motion-spring)\n      var(--alumni-enter-delay),\n    border-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    box-shadow\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n[data-alumni-motion-kind=\"card\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      14px,\n      0\n    )\n    scale(.992);\n}\n\n/* List rows, search results, More rows */\n\n[data-alumni-motion-kind=\"row\"] {\n  transition:\n    opacity\n      390ms\n      var(--alumni-motion-ease)\n      var(--alumni-enter-delay),\n    transform\n      390ms\n      var(--alumni-motion-spring)\n      var(--alumni-enter-delay),\n    background-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n[data-alumni-motion-kind=\"row\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      9px,\n      0\n    );\n}\n\n/* Messages and comments */\n\n[data-alumni-motion-kind=\"conversation\"] {\n  transform-origin:\n    50% 50%;\n  transition:\n    opacity\n      330ms\n      var(--alumni-motion-ease)\n      var(--alumni-enter-delay),\n    transform\n      360ms\n      var(--alumni-motion-spring)\n      var(--alumni-enter-delay);\n}\n\n[data-alumni-motion-kind=\"conversation\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      7px,\n      0\n    )\n    scale(.996);\n}\n\n/* Modals / sheets / popovers / drawers */\n\n[data-alumni-motion-kind=\"overlay\"] {\n  transform-origin:\n    50% 100%;\n  transition:\n    opacity\n      240ms\n      var(--alumni-motion-ease),\n    transform\n      330ms\n      var(--alumni-motion-spring);\n}\n\n[data-alumni-motion-kind=\"overlay\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      16px,\n      0\n    )\n    scale(.985);\n}\n\n/* Toasts */\n\n[data-alumni-motion-kind=\"toast\"] {\n  transition:\n    opacity\n      220ms\n      var(--alumni-motion-ease),\n    transform\n      300ms\n      var(--alumni-motion-spring);\n}\n\n[data-alumni-motion-kind=\"toast\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      -9px,\n      0\n    )\n    scale(.98);\n}\n\n/* Empty states */\n\n[data-alumni-motion-kind=\"status\"] {\n  transition:\n    opacity\n      400ms\n      var(--alumni-motion-ease),\n    transform\n      430ms\n      var(--alumni-motion-spring);\n}\n\n[data-alumni-motion-kind=\"status\"][\n  data-alumni-motion-state=\"pending\"\n] {\n  transform:\n    translate3d(\n      0,\n      10px,\n      0\n    )\n    scale(.99);\n}\n\n/* Loaders and skeletons */\n\n[data-alumni-motion-kind=\"loading\"][\n  data-alumni-motion-state=\"visible\"\n] {\n  animation:\n    alumniMotionLoadingBreathe\n    1.65s\n    ease-in-out\n    infinite;\n}\n\n@keyframes alumniMotionLoadingBreathe {\n  0%,\n  100% {\n    opacity: .62;\n  }\n\n  50% {\n    opacity: 1;\n  }\n}\n\n/* Feed reaction polish */\n\n.alumni-post-action-button,\n.alumni-pro-action,\n[class*=\"reaction\"],\n[class*=\"like-button\"],\n[class*=\"repost-button\"] {\n  transform-origin:\n    50% 50%;\n  transition:\n    transform\n      var(--alumni-motion-fast)\n      var(--alumni-motion-spring),\n    color\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease),\n    background-color\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease);\n}\n\n.alumni-post-action-button:active,\n.alumni-pro-action:active,\n[class*=\"reaction\"]:active,\n[class*=\"like-button\"]:active,\n[class*=\"repost-button\"]:active {\n  transform:\n    scale(.91);\n}\n\n/* Profile controls */\n\n[class*=\"profile\"] button:active,\n[class*=\"profile\"] a:active {\n  transform:\n    scale(.975);\n}\n\n/* Search results */\n\n[class*=\"search\"] [class*=\"result\"],\n[class*=\"explore\"] [class*=\"result\"] {\n  transform-origin:\n    50% 50%;\n}\n\n/* Mobile navigation */\n\n[data-alumni-mobile-nav=\"true\"] {\n  animation:\n    alumniMotionNavEnter\n    420ms\n    var(--alumni-motion-spring)\n    both;\n}\n\n[data-alumni-mobile-nav=\"true\"]\n.alumni-mobile-nav-icon {\n  transition:\n    transform\n      var(--alumni-motion-fast)\n      var(--alumni-motion-spring),\n    background-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n[data-alumni-mobile-nav=\"true\"]\n.alumni-mobile-nav-item[\n  data-active=\"true\"\n]\n.alumni-mobile-nav-icon {\n  transform:\n    translateY(-1px)\n    scale(1.045);\n}\n\n[data-alumni-mobile-nav=\"true\"]\n.alumni-mobile-nav-item:active\n.alumni-mobile-nav-icon {\n  transform:\n    scale(.91);\n}\n\n@keyframes alumniMotionNavEnter {\n  from {\n    opacity: 0;\n    transform:\n      translate(\n        -50%,\n        10px\n      )\n      scale(.985);\n  }\n\n  to {\n    opacity: 1;\n    transform:\n      translate(\n        -50%,\n        0\n      )\n      scale(1);\n  }\n}\n\n/* Media polish */\n\nimg,\nvideo {\n  transition:\n    opacity\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    filter\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n/* Focus feedback */\n\n:where(\n  input,\n  textarea,\n  select\n):focus {\n  transition-duration:\n    var(--alumni-motion-fast);\n}\n\n/* Manual utilities for all future work */\n\n[data-alumni-motion=\"press\"] {\n  transition:\n    transform\n      var(--alumni-motion-fast)\n      var(--alumni-motion-spring),\n    opacity\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease);\n}\n\n[data-alumni-motion=\"press\"]:active {\n  transform:\n    scale(.975);\n}\n\n[data-alumni-motion=\"card\"] {\n  transition:\n    transform\n      var(--alumni-motion-base)\n      var(--alumni-motion-spring),\n    border-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    box-shadow\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n@media (\n  hover: hover\n) and (\n  pointer: fine\n) {\n  [data-alumni-motion=\"card\"]:hover {\n    transform:\n      translateY(-2px);\n  }\n}\n\n/* Accessibility */\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  *,\n  *::before,\n  *::after {\n    scroll-behavior:\n      auto !important;\n  }\n\n  .alumni-motion-route,\n  [data-alumni-motion],\n  [data-alumni-motion-auto],\n  [data-alumni-mobile-nav=\"true\"] {\n    animation:\n      none !important;\n    transform:\n      none !important;\n    transition-duration:\n      .01ms !important;\n    transition-delay:\n      0ms !important;\n  }\n\n  [data-alumni-motion-auto] {\n    opacity:\n      1 !important;\n  }\n}\n\n/* ALUMNI_MOTION_SYSTEM_1_0 */\n/* ALUMNI_MOTION_PASS_2_0_FULL_APP */\n";

if (
  !globals.includes(
    MARKER
  )
) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    motionCss.trim() +
    "\n";
}

/* ======================================================
   Syntax validation
   ====================================================== */

try {
  const ts =
    require(
      "typescript"
    );

  for (
    const [
      rel,
      content,
    ] of [
      [
        APP_SHELL,
        appShell,
      ],
      [
        BASE_MOTION,
        fs.readFileSync(
          abs(BASE_MOTION),
          "utf8"
        ),
      ],
      [
        DIRECTOR,
        director,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget
          .Latest,
        true,
        ts.ScriptKind
          .TSX
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
  abs(APP_SHELL),
  appShell,
  "utf8"
);

fs.writeFileSync(
  abs(GLOBALS),
  globals,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Motion Pass 2.0 aplicado."
);
console.log(
  "✅ Feed y posts dinámicos."
);
console.log(
  "✅ Perfil."
);
console.log(
  "✅ Mensajes y comentarios."
);
console.log(
  "✅ Buscar y resultados."
);
console.log(
  "✅ Más."
);
console.log(
  "✅ Eventos."
);
console.log(
  "✅ Comunidades."
);
console.log(
  "✅ Cards y listas."
);
console.log(
  "✅ Modales, sheets y popovers."
);
console.log(
  "✅ Loaders, skeletons y estados vacíos."
);
console.log(
  "✅ Navbar."
);
console.log(
  "✅ Contenido futuro/dinámico."
);
console.log(
  "✅ prefers-reduced-motion."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
