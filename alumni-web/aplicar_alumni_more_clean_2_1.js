const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PAGE =
  "src/app/more/page.tsx";
const CSS =
  "src/app/more/more-premium.css";

const MARKER =
  "ALUMNI_MORE_CLEAN_2_1";

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

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-more-clean-2.1.bak";

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

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

if (
  !fs.existsSync(
    abs(PAGE)
  )
) {
  fail(
    `No encontré ${PAGE}`
  );
}

const current =
  fs.readFileSync(
    abs(PAGE),
    "utf8"
  );

if (
  current.includes(
    MARKER
  )
) {
  console.log(
    "✅ Más Clean 2.1 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  PAGE,
  current
);

if (
  fs.existsSync(
    abs(CSS)
  )
) {
  backup(
    CSS,
    fs.readFileSync(
      abs(CSS),
      "utf8"
    )
  );
}

const nextPage =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  Bell,\n  Bookmark,\n  BookOpen,\n  CalendarDays,\n  ChevronRight,\n  CircleHelp,\n  Info,\n  Settings2,\n  UsersRound,\n} from \"lucide-react\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"./more-premium.css\";\n\nconst settingsItems = [\n  {\n    href: \"/settings\",\n    label: \"Configuración\",\n    icon: Settings2,\n  },\n  {\n    href: \"/notifications\",\n    label: \"Notificaciones\",\n    icon: Bell,\n  },\n  {\n    href:\n      \"/settings?section=profile&view=saved\",\n    label: \"Guardados\",\n    icon: Bookmark,\n  },\n  {\n    href: \"/passport\",\n    label: \"Pasaporte Alumni\",\n    icon: BookOpen,\n  },\n  {\n    href: \"/feedback\",\n    label: \"Ayuda y feedback\",\n    icon: CircleHelp,\n  },\n  {\n    href: \"/about\",\n    label: \"Acerca de ALUMNI\",\n    icon: Info,\n  },\n];\n\nexport default function MorePage() {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <AppShell>\n      <main className=\"alumni-more-clean mx-auto w-full max-w-[680px]\">\n        <motion.header\n          className=\"alumni-more-clean-header\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: -8,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            duration: 0.42,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <h1>Más</h1>\n        </motion.header>\n\n        <section className=\"alumni-more-clean-featured\">\n          <motion.div\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 16,\n                    scale: 0.985,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n              scale: 1,\n            }}\n            transition={{\n              delay: 0.08,\n              duration: 0.45,\n              ease: [\n                0.2,\n                0.8,\n                0.2,\n                1,\n              ],\n            }}\n            whileTap={\n              reduceMotion\n                ? undefined\n                : {\n                    scale: 0.975,\n                  }\n            }\n          >\n            <Link\n              href=\"/events\"\n              className=\"alumni-more-clean-card\"\n            >\n              <span className=\"alumni-more-clean-card-icon\">\n                <CalendarDays\n                  size={22}\n                  strokeWidth={1.9}\n                />\n              </span>\n\n              <strong>\n                Eventos\n              </strong>\n\n              <ChevronRight\n                size={17}\n              />\n            </Link>\n          </motion.div>\n\n          <motion.div\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 16,\n                    scale: 0.985,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n              scale: 1,\n            }}\n            transition={{\n              delay: 0.13,\n              duration: 0.45,\n              ease: [\n                0.2,\n                0.8,\n                0.2,\n                1,\n              ],\n            }}\n            whileTap={\n              reduceMotion\n                ? undefined\n                : {\n                    scale: 0.975,\n                  }\n            }\n          >\n            <Link\n              href=\"/community\"\n              className=\"alumni-more-clean-card\"\n            >\n              <span className=\"alumni-more-clean-card-icon\">\n                <UsersRound\n                  size={22}\n                  strokeWidth={1.9}\n                />\n              </span>\n\n              <strong>\n                Comunidades\n              </strong>\n\n              <ChevronRight\n                size={17}\n              />\n            </Link>\n          </motion.div>\n        </section>\n\n        <motion.section\n          className=\"alumni-more-clean-settings\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 18,\n                }\n          }\n          whileInView={{\n            opacity: 1,\n            y: 0,\n          }}\n          viewport={{\n            once: true,\n            amount: 0.2,\n          }}\n          transition={{\n            duration: 0.48,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <h2>Ajustes</h2>\n\n          <div className=\"alumni-more-clean-list\">\n            {settingsItems.map(\n              (\n                {\n                  href,\n                  label,\n                  icon: Icon,\n                },\n                index\n              ) => (\n                <motion.div\n                  key={href}\n                  initial={\n                    reduceMotion\n                      ? false\n                      : {\n                          opacity: 0,\n                          x: -10,\n                        }\n                  }\n                  whileInView={{\n                    opacity: 1,\n                    x: 0,\n                  }}\n                  viewport={{\n                    once: true,\n                  }}\n                  transition={{\n                    delay:\n                      reduceMotion\n                        ? 0\n                        : index *\n                          0.035,\n                    duration: 0.32,\n                  }}\n                >\n                  <Link\n                    href={href}\n                    className=\"alumni-more-clean-row\"\n                  >\n                    <span className=\"alumni-more-clean-row-icon\">\n                      <Icon\n                        size={18}\n                        strokeWidth={1.9}\n                      />\n                    </span>\n\n                    <strong>\n                      {label}\n                    </strong>\n\n                    <ChevronRight\n                      size={17}\n                    />\n                  </Link>\n                </motion.div>\n              )\n            )}\n          </div>\n        </motion.section>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_MORE_CLEAN_2_1 */\n";
const nextCss =
  ".alumni-more-clean {\n  --more-clean-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  padding-bottom:\n    28px;\n}\n\n.alumni-more-clean-header {\n  display: flex;\n  min-height: 54px;\n  align-items: center;\n  padding: 0 2px;\n}\n\n.alumni-more-clean-header h1 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: 30px;\n  line-height: 1;\n  font-weight: 950;\n  letter-spacing: -.05em;\n}\n\n.alumni-more-clean-featured {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0,1fr)\n    );\n  gap: 10px;\n  margin-top: 12px;\n}\n\n.alumni-more-clean-card {\n  display: grid;\n  min-height: 116px;\n  grid-template-columns:\n    minmax(0,1fr)\n    18px;\n  grid-template-rows:\n    1fr auto;\n  align-items: center;\n  gap: 8px;\n  padding: 16px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 20px;\n  background:\n    var(--app-surface);\n  color:\n    var(--app-text);\n  text-decoration: none;\n}\n\n.alumni-more-clean-card-icon {\n  display: inline-flex;\n  width: 42px;\n  height: 42px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 13px;\n  background:\n    var(--more-clean-wash);\n  color:\n    var(--app-accent);\n}\n\n.alumni-more-clean-card\nstrong {\n  align-self: end;\n  font-size: 13px;\n  font-weight: 900;\n  letter-spacing: -.02em;\n}\n\n.alumni-more-clean-card\n> svg {\n  align-self: end;\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-more-clean-settings {\n  margin-top: 30px;\n}\n\n.alumni-more-clean-settings h2 {\n  margin:\n    0 0 10px\n    2px;\n  color:\n    var(--app-text);\n  font-size: 16px;\n  font-weight: 900;\n  letter-spacing: -.025em;\n}\n\n.alumni-more-clean-list {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-more-clean-row {\n  display: grid;\n  grid-template-columns:\n    36px\n    minmax(0,1fr)\n    18px;\n  align-items: center;\n  gap: 11px;\n  min-height: 60px;\n  padding:\n    8px 14px;\n  border-top:\n    1px solid\n    var(--app-border);\n  color:\n    inherit;\n  text-decoration: none;\n}\n\n.alumni-more-clean-list\n> div:first-child\n.alumni-more-clean-row {\n  border-top: 0;\n}\n\n.alumni-more-clean-row:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-more-clean-row-icon {\n  display: inline-flex;\n  width: 34px;\n  height: 34px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 11px;\n  background:\n    var(--app-soft);\n  color:\n    var(--app-accent);\n}\n\n.alumni-more-clean-row\nstrong {\n  overflow: hidden;\n  color:\n    var(--app-text);\n  font-size: 11.5px;\n  font-weight: 830;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-more-clean-row\n> svg {\n  color:\n    var(--app-muted-3);\n}\n\n@media (max-width: 390px) {\n  .alumni-more-clean-card {\n    min-height: 108px;\n    padding: 14px;\n  }\n\n  .alumni-more-clean-row {\n    min-height: 58px;\n    padding:\n      8px 12px;\n  }\n}\n\n/* ALUMNI_MORE_CLEAN_2_1 */\n";

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      PAGE,
      nextPage,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics || [];

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
    "✅ Parser TypeScript: archivo válido"
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

fs.mkdirSync(
  path.dirname(
    abs(CSS)
  ),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  abs(PAGE),
  nextPage,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  nextCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Más Clean 2.1 aplicado."
);
console.log(
  "✅ Buscar y Mensajes eliminados de Más."
);
console.log(
  "✅ Eventos + Comunidades arriba."
);
console.log(
  "✅ Ajustes compactos abajo."
);
console.log(
  "✅ Menos texto."
);
console.log(
  "✅ Motion preservado."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
