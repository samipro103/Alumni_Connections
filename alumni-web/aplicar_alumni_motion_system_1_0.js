const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_MOTION_SYSTEM_1_0";

const APP_SHELL =
  "src/components/layout/AppShell.tsx";
const GLOBALS =
  "src/app/globals.css";
const MOTION =
  "src/components/motion/AlumniMotion.tsx";

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
    ".before-motion-system-1.0.bak";

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

function replaceExact(
  source,
  before,
  after,
  label
) {
  if (
    !source.includes(
      before
    )
  ) {
    fail(
      `No encontré bloque esperado: ${label}`
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
  )
) {
  console.log(
    "✅ Motion System 1.0 ya estaba aplicado."
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

appShell = replaceExact(
  appShell,
  `import PushNotificationBootstrap from "@/components/notifications/PushNotificationBootstrap";`,
  `import PushNotificationBootstrap from "@/components/notifications/PushNotificationBootstrap";
import {
  AlumniRouteMotion,
} from "@/components/motion/AlumniMotion";`,
  "AppShell Motion import"
);

appShell = replaceExact(
  appShell,
  `            <main className="min-w-0">
              {children}
            </main>`,
  `            <main className="min-w-0">
              <AlumniRouteMotion>
                {children}
              </AlumniRouteMotion>
            </main>`,
  "AppShell route wrapper"
);

appShell +=
  `\n/* ${MARKER} */\n`;

if (
  !globals.includes(
    MARKER
  )
) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    "\n/* =========================================================\n   ALUMNI Motion System 1.0\n   Motion is part of the product language.\n   ========================================================= */\n\n:root {\n  --alumni-motion-fast: 130ms;\n  --alumni-motion-base: 180ms;\n  --alumni-motion-slow: 340ms;\n  --alumni-motion-ease:\n    cubic-bezier(.2,.8,.2,1);\n  --alumni-motion-spring:\n    cubic-bezier(.16,1,.3,1);\n}\n\n.alumni-motion-route {\n  width: 100%;\n  min-width: 0;\n  transform-origin:\n    50% 18%;\n  will-change:\n    transform,\n    opacity;\n}\n\n:where(\n  button,\n  a,\n  input,\n  textarea,\n  select,\n  summary,\n  [role=\"button\"],\n  [tabindex]\n) {\n  transition:\n    background-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    border-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    opacity\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease),\n    box-shadow\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    filter\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease);\n}\n\n:where(\n  button:not(:disabled),\n  a[href],\n  summary,\n  [role=\"button\"]\n):active {\n  filter:\n    brightness(.965);\n}\n\n:where(\n  input,\n  textarea,\n  select\n):focus {\n  transition-duration:\n    var(--alumni-motion-fast);\n}\n\n[data-alumni-motion=\"press\"] {\n  transition:\n    transform\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease),\n    opacity\n      var(--alumni-motion-fast)\n      var(--alumni-motion-ease);\n}\n\n[data-alumni-motion=\"press\"]:active {\n  transform:\n    scale(.975);\n}\n\n[data-alumni-motion=\"card\"] {\n  transition:\n    transform\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    border-color\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease),\n    box-shadow\n      var(--alumni-motion-base)\n      var(--alumni-motion-ease);\n}\n\n@media (\n  hover: hover\n) and (\n  pointer: fine\n) {\n  [data-alumni-motion=\"card\"]:hover {\n    transform:\n      translateY(-2px);\n  }\n}\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  *,\n  *::before,\n  *::after {\n    scroll-behavior:\n      auto !important;\n  }\n\n  .alumni-motion-route,\n  [data-alumni-motion] {\n    transform:\n      none !important;\n    transition-duration:\n      0.01ms !important;\n    animation-duration:\n      0.01ms !important;\n    animation-iteration-count:\n      1 !important;\n  }\n}\n\n/* ALUMNI_MOTION_SYSTEM_1_0 */\n".trim() +
    "\n";
}

const motionFile =
  "\"use client\";\n\nimport {\n  ReactNode,\n} from \"react\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  usePathname,\n} from \"next/navigation\";\n\ntype MotionBaseProps = {\n  children: ReactNode;\n  className?: string;\n};\n\nexport function AlumniRouteMotion({\n  children,\n  className = \"\",\n}: MotionBaseProps) {\n  const pathname =\n    usePathname();\n\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      key={pathname}\n      className={`alumni-motion-route ${className}`}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 8,\n              scale: 0.995,\n            }\n      }\n      animate={{\n        opacity: 1,\n        y: 0,\n        scale: 1,\n      }}\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.34,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionReveal({\n  children,\n  className = \"\",\n  delay = 0,\n}: MotionBaseProps & {\n  delay?: number;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 18,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.18,\n      }}\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.48,\n        delay:\n          reduceMotion\n            ? 0\n            : delay,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionCard({\n  children,\n  className = \"\",\n  delay = 0,\n}: MotionBaseProps & {\n  delay?: number;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 14,\n              scale: 0.99,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n        scale: 1,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.16,\n      }}\n      whileHover={\n        reduceMotion\n          ? undefined\n          : {\n              y: -2,\n            }\n      }\n      whileTap={\n        reduceMotion\n          ? undefined\n          : {\n              scale: 0.992,\n            }\n      }\n      transition={{\n        duration:\n          reduceMotion\n            ? 0\n            : 0.38,\n        delay:\n          reduceMotion\n            ? 0\n            : delay,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport function MotionPressable({\n  children,\n  className = \"\",\n}: MotionBaseProps) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div\n      className={className}\n      whileTap={\n        reduceMotion\n          ? undefined\n          : {\n              scale: 0.975,\n            }\n      }\n      transition={{\n        duration: 0.13,\n      }}\n    >\n      {children}\n    </motion.div>\n  );\n}\n\nexport const alumniMotion = {\n  page: {\n    initial: {\n      opacity: 0,\n      y: 8,\n      scale: 0.995,\n    },\n    animate: {\n      opacity: 1,\n      y: 0,\n      scale: 1,\n    },\n    transition: {\n      duration: 0.34,\n      ease: [\n        0.2,\n        0.8,\n        0.2,\n        1,\n      ],\n    },\n  },\n  reveal: {\n    initial: {\n      opacity: 0,\n      y: 18,\n    },\n    animate: {\n      opacity: 1,\n      y: 0,\n    },\n  },\n  press: {\n    scale: 0.975,\n  },\n  cardHover: {\n    y: -2,\n  },\n} as const;\n\n/* ALUMNI_MOTION_SYSTEM_1_0 */\n";

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
        MOTION,
        motionFile,
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

fs.mkdirSync(
  path.dirname(
    abs(MOTION)
  ),
  {
    recursive: true,
  }
);

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

fs.writeFileSync(
  abs(MOTION),
  motionFile,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Motion System 1.0 aplicado."
);
console.log(
  "✅ Todas las rutas usan transición global."
);
console.log(
  "✅ Micro-motion global en controles."
);
console.log(
  "✅ MotionReveal disponible."
);
console.log(
  "✅ MotionCard disponible."
);
console.log(
  "✅ MotionPressable disponible."
);
console.log(
  "✅ prefers-reduced-motion respetado."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
