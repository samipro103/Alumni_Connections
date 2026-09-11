const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_VISUAL_LANGUAGE_1_0_MORE_GROUPED";

const MORE =
  "src/app/more/page.tsx";
const MORE_CSS =
  "src/app/more/more-premium.css";
const GLOBALS =
  "src/app/globals.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(`No encontré ${rel}`);
  }

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const target =
    abs(rel) +
    ".before-visual-language-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

if (!fs.existsSync(abs("package.json"))) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

const currentMore = read(MORE);
let globals = read(GLOBALS);

if (
  currentMore.includes(MARKER) &&
  globals.includes(MARKER)
) {
  console.log(
    "✅ Visual Language 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(MORE, currentMore);
backup(GLOBALS, globals);

const nextMore =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  CalendarDays,\n  ChevronRight,\n  CircleHelp,\n  Info,\n  MessageCircleMore,\n  Search,\n  Settings2,\n  Sparkles,\n  UsersRound,\n} from \"lucide-react\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"./more-premium.css\";\n\ntype MoreItem = {\n  href: string;\n  label: string;\n  description: string;\n  icon: React.ComponentType<{\n    size?: number;\n    strokeWidth?: number;\n  }>;\n  tag?: string;\n};\n\nconst exploreItems: MoreItem[] = [\n  {\n    href: \"/search\",\n    label: \"Buscar\",\n    description:\n      \"Descubre personas, publicaciones y conexiones.\",\n    icon: Search,\n  },\n  {\n    href: \"/messages\",\n    label: \"Mensajes\",\n    description:\n      \"Sigue conversaciones y mantén el contacto.\",\n    icon: MessageCircleMore,\n  },\n];\n\nconst communityItems: MoreItem[] = [\n  {\n    href: \"/communities\",\n    label: \"Comunidades\",\n    description:\n      \"Participa en grupos y espacios compartidos.\",\n    icon: UsersRound,\n  },\n  {\n    href: \"/events\",\n    label: \"Eventos\",\n    description:\n      \"Encuentra encuentros, actividades y experiencias.\",\n    icon: CalendarDays,\n  },\n];\n\nconst systemItems: MoreItem[] = [\n  {\n    href: \"/feedback\",\n    label: \"Feedback\",\n    description:\n      \"Reporta problemas y propón mejoras para ALUMNI.\",\n    icon: CircleHelp,\n  },\n  {\n    href: \"/about\",\n    label: \"Acerca de ALUMNI\",\n    description:\n      \"Conoce la app, su autor y el camino del proyecto.\",\n    icon: Info,\n    tag: \"Nuevo\",\n  },\n  {\n    href: \"/settings\",\n    label: \"Ajustes\",\n    description:\n      \"Personaliza tu experiencia, notificaciones y cuenta.\",\n    icon: Settings2,\n  },\n];\n\nfunction Section({\n  eyebrow,\n  title,\n  copy,\n  items,\n  delay = 0,\n}: {\n  eyebrow: string;\n  title: string;\n  copy: string;\n  items: MoreItem[];\n  delay?: number;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.section\n      className=\"alumni-more-premium-section\"\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 18,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.18,\n      }}\n      transition={{\n        duration: 0.46,\n        delay:\n          reduceMotion\n            ? 0\n            : delay,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      <header className=\"alumni-more-premium-section-head\">\n        <small>{eyebrow}</small>\n        <h2>{title}</h2>\n        <p>{copy}</p>\n      </header>\n\n      <div className=\"alumni-more-premium-list\">\n        {items.map(\n          (\n            {\n              href,\n              label,\n              description,\n              icon: Icon,\n              tag,\n            },\n            index\n          ) => (\n            <motion.div\n              key={href}\n              initial={\n                reduceMotion\n                  ? false\n                  : {\n                      opacity: 0,\n                      y: 12,\n                    }\n              }\n              whileInView={{\n                opacity: 1,\n                y: 0,\n              }}\n              viewport={{\n                once: true,\n              }}\n              transition={{\n                duration: 0.34,\n                delay:\n                  reduceMotion\n                    ? 0\n                    : delay +\n                      index * 0.05,\n              }}\n            >\n              <Link\n                href={href}\n                className=\"alumni-more-premium-row\"\n                data-alumni-motion=\"card\"\n              >\n                <span className=\"alumni-more-premium-row-icon\">\n                  <Icon\n                    size={18}\n                    strokeWidth={1.9}\n                  />\n                </span>\n\n                <span className=\"alumni-more-premium-row-copy\">\n                  <span className=\"alumni-more-premium-row-top\">\n                    <strong>{label}</strong>\n\n                    {tag && (\n                      <em>{tag}</em>\n                    )}\n                  </span>\n\n                  <small>\n                    {description}\n                  </small>\n                </span>\n\n                <ChevronRight\n                  size={18}\n                  className=\"alumni-more-premium-row-chevron\"\n                />\n              </Link>\n            </motion.div>\n          )\n        )}\n      </div>\n    </motion.section>\n  );\n}\n\nexport default function MorePage() {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <AppShell>\n      <main className=\"alumni-more-premium-page mx-auto w-full max-w-[680px]\">\n        <motion.section\n          className=\"alumni-more-premium-hero\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 18,\n                  scale: 0.992,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n            scale: 1,\n          }}\n          transition={{\n            duration: 0.58,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <div\n            className=\"alumni-more-premium-orbit alumni-more-premium-orbit-a\"\n            aria-hidden=\"true\"\n          />\n          <div\n            className=\"alumni-more-premium-orbit alumni-more-premium-orbit-b\"\n            aria-hidden=\"true\"\n          />\n\n          <motion.span\n            className=\"alumni-more-premium-badge\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    scale: 0.9,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              scale: 1,\n            }}\n            transition={{\n              delay: 0.12,\n              duration: 0.38,\n            }}\n          >\n            <Sparkles size={13} />\n            Más claridad, menos ruido\n          </motion.span>\n\n          <h1>Más</h1>\n\n          <p>\n            Un espacio limpio para acceder a funciones,\n            comunidad y soporte sin que todo se vea\n            amontonado.\n          </p>\n\n          <div className=\"alumni-more-premium-note\">\n            Separé las opciones normales de las opciones del\n            sistema para que la navegación se sienta más\n            profesional y enfocada.\n          </div>\n        </motion.section>\n\n        <Section\n          eyebrow=\"ACCESO RÁPIDO\"\n          title=\"Explorar y conectar\"\n          copy=\"Lo principal para moverte dentro de la experiencia diaria de ALUMNI.\"\n          items={exploreItems}\n          delay={0.05}\n        />\n\n        <Section\n          eyebrow=\"COMUNIDAD\"\n          title=\"Espacios y actividades\"\n          copy=\"Todo lo relacionado con participación, grupos y encuentros.\"\n          items={communityItems}\n          delay={0.08}\n        />\n\n        <Section\n          eyebrow=\"SOPORTE Y SISTEMA\"\n          title=\"Cuenta, ayuda y producto\"\n          copy=\"Aquí viven las opciones de ajustes, feedback y la información de ALUMNI.\"\n          items={systemItems}\n          delay={0.11}\n        />\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_VISUAL_LANGUAGE_1_0_MORE_GROUPED */\n";
const moreCss =
  ".alumni-more-premium-page {\n  --more-accent-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  --more-accent-line:\n    color-mix(\n      in srgb,\n      var(--app-accent) 28%,\n      var(--app-border)\n    );\n  padding-bottom: 28px;\n}\n\n.alumni-more-premium-hero {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  margin-bottom: 32px;\n  padding: 30px 22px 24px;\n  border: 1px solid var(--app-border);\n  border-radius: 28px;\n  background: var(--app-surface);\n}\n\n.alumni-more-premium-hero::before {\n  content: \"\";\n  position: absolute;\n  z-index: -2;\n  top: -108px;\n  right: -110px;\n  width: 230px;\n  height: 230px;\n  border: 1px solid var(--more-accent-line);\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n.alumni-more-premium-orbit {\n  position: absolute;\n  z-index: -1;\n  border: 1px solid var(--app-border);\n  border-radius: 50%;\n  opacity: 0.65;\n  pointer-events: none;\n}\n\n.alumni-more-premium-orbit::after {\n  content: \"\";\n  position: absolute;\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: var(--app-accent);\n  box-shadow:\n    0 0 0 5px var(--more-accent-wash);\n}\n\n.alumni-more-premium-orbit-a {\n  left: -62px;\n  bottom: 14px;\n  width: 112px;\n  height: 112px;\n}\n\n.alumni-more-premium-orbit-a::after {\n  top: 16px;\n  right: 9px;\n}\n\n.alumni-more-premium-orbit-b {\n  right: 10px;\n  bottom: -42px;\n  width: 82px;\n  height: 82px;\n}\n\n.alumni-more-premium-orbit-b::after {\n  top: 9px;\n  left: 10px;\n}\n\n.alumni-more-premium-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 28px;\n  padding: 0 10px;\n  border: 1px solid var(--more-accent-line);\n  border-radius: 999px;\n  background: var(--more-accent-wash);\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n}\n\n.alumni-more-premium-hero h1 {\n  margin: 24px 0 0;\n  color: var(--app-text);\n  font-size: clamp(34px, 9vw, 48px);\n  line-height: 0.98;\n  font-weight: 950;\n  letter-spacing: -0.055em;\n}\n\n.alumni-more-premium-hero > p {\n  max-width: 520px;\n  margin: 13px 0 0;\n  color: var(--app-text-soft);\n  font-size: 13px;\n  line-height: 1.7;\n}\n\n.alumni-more-premium-note {\n  display: inline-flex;\n  max-width: 500px;\n  margin-top: 22px;\n  padding: 11px 13px;\n  border-radius: 14px;\n  background: var(--app-soft);\n  color: var(--app-muted);\n  font-size: 10px;\n  line-height: 1.6;\n}\n\n.alumni-more-premium-section + .alumni-more-premium-section {\n  margin-top: 34px;\n}\n\n.alumni-more-premium-section-head {\n  padding: 0 2px 14px;\n}\n\n.alumni-more-premium-section-head small {\n  display: block;\n  margin-bottom: 7px;\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.15em;\n  text-transform: uppercase;\n}\n\n.alumni-more-premium-section-head h2 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: clamp(24px, 7vw, 32px);\n  line-height: 1.05;\n  font-weight: 940;\n  letter-spacing: -0.045em;\n}\n\n.alumni-more-premium-section-head p {\n  max-width: 520px;\n  margin: 9px 0 0;\n  color: var(--app-muted);\n  font-size: 12px;\n  line-height: 1.65;\n}\n\n.alumni-more-premium-list {\n  overflow: hidden;\n  border: 1px solid var(--app-border);\n  border-radius: 22px;\n  background: var(--app-surface);\n}\n\n.alumni-more-premium-row {\n  display: grid;\n  grid-template-columns: 42px minmax(0, 1fr) 18px;\n  align-items: center;\n  gap: 13px;\n  min-height: 82px;\n  padding: 14px 16px;\n  border-top: 1px solid var(--app-border);\n  color: inherit;\n  text-decoration: none;\n}\n\n.alumni-more-premium-list > :first-child .alumni-more-premium-row {\n  border-top: 0;\n}\n\n.alumni-more-premium-row:active {\n  background: var(--app-soft);\n}\n\n.alumni-more-premium-row-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 40px;\n  height: 40px;\n  border-radius: 13px;\n  background: var(--more-accent-wash);\n  color: var(--app-accent);\n}\n\n.alumni-more-premium-row-copy {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.alumni-more-premium-row-top {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 0;\n}\n\n.alumni-more-premium-row-copy strong {\n  overflow: hidden;\n  color: var(--app-text);\n  font-size: 13px;\n  font-weight: 900;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-more-premium-row-copy em {\n  display: inline-flex;\n  align-items: center;\n  min-height: 20px;\n  padding: 0 7px;\n  border-radius: 999px;\n  background: var(--app-accent-fill);\n  color: var(--app-on-accent);\n  font-size: 8px;\n  font-style: normal;\n  font-weight: 900;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.alumni-more-premium-row-copy small {\n  color: var(--app-muted);\n  font-size: 10px;\n  line-height: 1.55;\n}\n\n.alumni-more-premium-row-chevron {\n  color: var(--app-muted-3);\n}\n\n@media (max-width: 480px) {\n  .alumni-more-premium-hero {\n    padding: 26px 18px 22px;\n    border-radius: 24px;\n  }\n\n  .alumni-more-premium-row {\n    min-height: 78px;\n    padding: 13px 14px;\n  }\n\n  .alumni-more-premium-list {\n    border-radius: 19px;\n  }\n}\n\n/* ALUMNI_VISUAL_LANGUAGE_1_0_MORE_GROUPED */\n";
const extraGlobals =
  "\n/* =========================================================\n   ALUMNI Visual Language 1.0\n   Inspired by Developer showcase clarity.\n   Reusable premium page language for the rest of the app.\n   ========================================================= */\n\n.alumni-page-premium-hero {\n  position: relative;\n  overflow: hidden;\n  border: 1px solid var(--app-border);\n  border-radius: 26px;\n  background: var(--app-surface);\n}\n\n.alumni-page-premium-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 28px;\n  padding: 0 10px;\n  border-radius: 999px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}\n\n.alumni-page-premium-section-title small {\n  display: block;\n  margin-bottom: 7px;\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.15em;\n  text-transform: uppercase;\n}\n\n.alumni-page-premium-section-title h2 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: clamp(24px, 7vw, 32px);\n  line-height: 1.05;\n  font-weight: 940;\n  letter-spacing: -0.045em;\n}\n\n.alumni-page-premium-section-title p {\n  margin: 10px 0 0;\n  color: var(--app-muted);\n  font-size: 12px;\n  line-height: 1.65;\n}\n\n.alumni-page-premium-list {\n  overflow: hidden;\n  border: 1px solid var(--app-border);\n  border-radius: 22px;\n  background: var(--app-surface);\n}\n\n.alumni-page-premium-row {\n  display: grid;\n  grid-template-columns: 42px minmax(0, 1fr) 18px;\n  align-items: center;\n  gap: 12px;\n  min-height: 80px;\n  padding: 14px 16px;\n  border-top: 1px solid var(--app-border);\n}\n\n.alumni-page-premium-row:first-child {\n  border-top: 0;\n}\n\n/* ALUMNI_VISUAL_LANGUAGE_1_0_MORE_GROUPED */\n";

try {
  const ts = require("typescript");

  const parsed =
    ts.createSourceFile(
      MORE,
      nextMore,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics || [];

  if (diagnostics.length) {
    const first =
      diagnostics[0];

    fail(
      `${MORE}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: archivo válido"
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

if (!globals.includes(MARKER)) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    extraGlobals.trim() +
    "\n";
}

fs.mkdirSync(
  path.dirname(abs(MORE_CSS)),
  { recursive: true }
);

fs.writeFileSync(
  abs(MORE),
  nextMore,
  "utf8"
);

fs.writeFileSync(
  abs(MORE_CSS),
  moreCss,
  "utf8"
);

fs.writeFileSync(
  abs(GLOBALS),
  globals,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Visual Language 1.0 aplicado."
);
console.log(
  "✅ /more reconstruido con diseño premium."
);
console.log(
  "✅ Opciones separadas por grupos."
);
console.log(
  "✅ Feedback / Acerca de / Ajustes ya no se ven amontonados."
);
console.log(
  "✅ Base visual reusable para otras pantallas."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
