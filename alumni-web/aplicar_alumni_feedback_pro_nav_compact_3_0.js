const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEEDBACK_PRO_NAV_COMPACT_3_0";

const ABOUT =
  "src/app/about/page.tsx";
const FEEDBACK =
  "src/app/feedback/page.tsx";
const FEEDBACK_CSS =
  "src/app/feedback/feedback-pro-3-0.css";
const NAV =
  "src/components/layout/MobileNav.tsx";

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
    ".before-feedback-pro-nav-3.0.bak";

  if (!fs.existsSync(target)) {
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
  if (!source.includes(before)) {
    fail(
      `No encontré bloque esperado: ${label}`
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

let about =
  read(ABOUT);
let feedback =
  read(FEEDBACK);
let nav =
  read(NAV);

if (
  feedback.includes(MARKER) &&
  nav.includes(MARKER)
) {
  console.log(
    "✅ Feedback Pro + Navbar Compact ya estaba aplicado."
  );
  process.exit(0);
}

backup(ABOUT, about);
backup(FEEDBACK, feedback);
backup(NAV, nav);

/* ======================================================
   ABOUT: direct contact email
   ====================================================== */

about = replaceExact(
  about,
  `  MessageCircle,`,
  `  Mail,`,
  "About MessageCircle import"
);

about = replaceExact(
  about,
  `          <Link
            href="/feedback"
            className="alumni-about-store-row"
          >
            <span className="alumni-about-store-icon">
              <MessageCircle size={18} />
            </span>

            <span className="alumni-about-store-copy">
              <small>Contacto</small>
              <strong>Ayuda y feedback</strong>
              <span>Cuéntanos qué podemos mejorar</span>
            </span>

            <ChevronRight
              size={17}
              className="alumni-about-chevron"
            />
          </Link>`,
  `          <a
            href="mailto:samuel.riiveraa@hotmail.com"
            className="alumni-about-store-row"
          >
            <span className="alumni-about-store-icon">
              <Mail size={18} />
            </span>

            <span className="alumni-about-store-copy">
              <small>Contacto</small>
              <strong>samuel.riiveraa@hotmail.com</strong>
              <span>Correo directo del desarrollador</span>
            </span>

            <ChevronRight
              size={17}
              className="alumni-about-chevron"
            />
          </a>`,
  "About contact row"
);

about +=
  `\n/* ${MARKER} */\n`;

/* ======================================================
   FEEDBACK: Framer Motion + premium hub
   ====================================================== */

feedback = replaceExact(
  feedback,
  `import Link from "next/link";`,
  `import Link from "next/link";
import {
  motion,
  useReducedMotion,
} from "framer-motion";`,
  "feedback framer-motion import"
);

feedback = replaceExact(
  feedback,
  `  Send,
  ShieldCheck,`,
  `  Send,
  ShieldCheck,
  Sparkles,`,
  "feedback Sparkles import"
);

feedback = replaceExact(
  feedback,
  `import "./feedback-form-editorial-2-1.css";`,
  `import "./feedback-form-editorial-2-1.css";
import "./feedback-pro-3-0.css";`,
  "feedback pro css import"
);

feedback = feedback.replace(
  `className="alumni-help-v2"`,
  `className="alumni-help-v2 alumni-feedback-pro-shell"`
);

const helpStart =
  feedback.indexOf(
    "function HelpHome({"
  );

const formStart =
  feedback.indexOf(
    "function FeedbackForm({"
  );

if (
  helpStart < 0 ||
  formStart < 0 ||
  formStart <= helpStart
) {
  fail(
    "No encontré HelpHome / FeedbackForm."
  );
}

feedback =
  feedback.slice(
    0,
    helpStart
  ) +
  "function HelpHome({\n  onHelp,\n  onProblem,\n  onIdea,\n  onStatus,\n  onSupport,\n  onLegal,\n}: {\n  onHelp: () => void;\n  onProblem: () => void;\n  onIdea: () => void;\n  onStatus: () => void;\n  onSupport: () => void;\n  onLegal: () => void;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  const utilityRows = [\n    {\n      label:\n        \"Centro de ayuda\",\n      description:\n        \"Respuestas rápidas para resolver dudas\",\n      icon:\n        BookOpen,\n      onClick:\n        onHelp,\n    },\n    {\n      label:\n        \"Estado de la app\",\n      description:\n        \"Versión y diagnóstico de tu sesión\",\n      icon:\n        Activity,\n      onClick:\n        onStatus,\n    },\n    {\n      label:\n        \"Contactar soporte\",\n      description:\n        \"Cuéntanos directamente qué necesitas\",\n      icon:\n        Mail,\n      onClick:\n        onSupport,\n    },\n  ] as const;\n\n  return (\n    <div className=\"alumni-feedback-pro-home\">\n      <motion.section\n        className=\"alumni-feedback-pro-hero\"\n        initial={\n          reduceMotion\n            ? false\n            : {\n                opacity: 0,\n                y: 18,\n                scale: 0.99,\n              }\n        }\n        animate={{\n          opacity: 1,\n          y: 0,\n          scale: 1,\n        }}\n        transition={{\n          duration: 0.58,\n          ease: [\n            0.2,\n            0.8,\n            0.2,\n            1,\n          ],\n        }}\n      >\n        <div\n          className=\"alumni-feedback-pro-orbit alumni-feedback-pro-orbit-a\"\n          aria-hidden=\"true\"\n        />\n        <div\n          className=\"alumni-feedback-pro-orbit alumni-feedback-pro-orbit-b\"\n          aria-hidden=\"true\"\n        />\n\n        <motion.span\n          className=\"alumni-feedback-pro-badge\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  scale: 0.92,\n                }\n          }\n          animate={{\n            opacity: 1,\n            scale: 1,\n          }}\n          transition={{\n            delay: 0.12,\n            duration: 0.38,\n          }}\n        >\n          <Sparkles size={13} />\n          Tu voz construye ALUMNI\n        </motion.span>\n\n        <motion.h2\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 12,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.17,\n            duration: 0.48,\n          }}\n        >\n          Hagamos que la siguiente versión sea mejor.\n        </motion.h2>\n\n        <motion.p\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 10,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.24,\n            duration: 0.48,\n          }}\n        >\n          Encontraste un problema, tienes una idea o\n          simplemente hay algo que podría sentirse mejor.\n          Queremos saberlo.\n        </motion.p>\n\n        <div className=\"alumni-feedback-pro-signal\">\n          <span />\n          Canal directo de producto\n        </div>\n      </motion.section>\n\n      <section className=\"alumni-feedback-pro-featured\">\n        <motion.button\n          type=\"button\"\n          className=\"alumni-feedback-pro-feature alumni-feedback-pro-feature-problem\"\n          onClick={onProblem}\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 20,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.3,\n            duration: 0.45,\n          }}\n          whileTap={\n            reduceMotion\n              ? undefined\n              : {\n                  scale: 0.985,\n                }\n          }\n        >\n          <span className=\"alumni-feedback-pro-feature-icon\">\n            <TriangleAlert\n              size={20}\n              strokeWidth={1.9}\n            />\n          </span>\n\n          <span className=\"alumni-feedback-pro-feature-copy\">\n            <small>ALGO FALLÓ</small>\n            <strong>\n              Reportar un problema\n            </strong>\n            <span>\n              Cuéntanos qué pasó y ayúdanos a encontrarlo.\n            </span>\n          </span>\n\n          <ChevronRight\n            size={18}\n          />\n        </motion.button>\n\n        <motion.button\n          type=\"button\"\n          className=\"alumni-feedback-pro-feature alumni-feedback-pro-feature-idea\"\n          onClick={onIdea}\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 20,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.36,\n            duration: 0.45,\n          }}\n          whileTap={\n            reduceMotion\n              ? undefined\n              : {\n                  scale: 0.985,\n                }\n          }\n        >\n          <span className=\"alumni-feedback-pro-feature-icon\">\n            <Lightbulb\n              size={20}\n              strokeWidth={1.9}\n            />\n          </span>\n\n          <span className=\"alumni-feedback-pro-feature-copy\">\n            <small>TIENES UNA IDEA</small>\n            <strong>\n              Proponer una mejora\n            </strong>\n            <span>\n              Las mejores versiones empiezan con una observación.\n            </span>\n          </span>\n\n          <ChevronRight\n            size={18}\n          />\n        </motion.button>\n      </section>\n\n      <motion.section\n        className=\"alumni-feedback-pro-tools\"\n        initial={\n          reduceMotion\n            ? false\n            : {\n                opacity: 0,\n                y: 18,\n              }\n        }\n        whileInView={{\n          opacity: 1,\n          y: 0,\n        }}\n        viewport={{\n          once: true,\n          amount: 0.3,\n        }}\n        transition={{\n          duration: 0.5,\n        }}\n      >\n        <div className=\"alumni-feedback-pro-section-title\">\n          <span>AYUDA</span>\n          <h3>\n            Encuentra lo que necesitas\n          </h3>\n        </div>\n\n        <div className=\"alumni-feedback-pro-tool-list\">\n          {utilityRows.map(\n            ({\n              label,\n              description,\n              icon: Icon,\n              onClick,\n            }) => (\n              <button\n                key={label}\n                type=\"button\"\n                className=\"alumni-feedback-pro-tool-row\"\n                onClick={onClick}\n              >\n                <span className=\"alumni-feedback-pro-tool-icon\">\n                  <Icon\n                    size={18}\n                    strokeWidth={1.8}\n                  />\n                </span>\n\n                <span>\n                  <strong>\n                    {label}\n                  </strong>\n                  <small>\n                    {description}\n                  </small>\n                </span>\n\n                <ChevronRight\n                  size={17}\n                />\n              </button>\n            )\n          )}\n        </div>\n      </motion.section>\n\n      <motion.a\n        href=\"mailto:samuel.riiveraa@hotmail.com\"\n        className=\"alumni-feedback-pro-direct\"\n        initial={\n          reduceMotion\n            ? false\n            : {\n                opacity: 0,\n                y: 18,\n              }\n        }\n        whileInView={{\n          opacity: 1,\n          y: 0,\n        }}\n        viewport={{\n          once: true,\n        }}\n        transition={{\n          duration: 0.48,\n        }}\n      >\n        <span className=\"alumni-feedback-pro-direct-icon\">\n          <Mail size={18} />\n        </span>\n\n        <span>\n          <small>CONTACTO DIRECTO</small>\n          <strong>\n            samuel.riiveraa@hotmail.com\n          </strong>\n          <span>\n            Para consultas que prefieras enviar por correo.\n          </span>\n        </span>\n\n        <ChevronRight\n          size={17}\n        />\n      </motion.a>\n\n      <motion.section\n        className=\"alumni-feedback-pro-legal\"\n        initial={\n          reduceMotion\n            ? false\n            : {\n                opacity: 0,\n              }\n        }\n        whileInView={{\n          opacity: 1,\n        }}\n        viewport={{\n          once: true,\n        }}\n      >\n        <button\n          type=\"button\"\n          onClick={onLegal}\n        >\n          <ShieldCheck\n            size={17}\n          />\n          <span>\n            <strong>\n              Privacidad, términos y comunidad\n            </strong>\n            <small>\n              Consulta cómo protegemos y cuidamos ALUMNI.\n            </small>\n          </span>\n          <ChevronRight\n            size={16}\n          />\n        </button>\n      </motion.section>\n\n      <footer className=\"alumni-feedback-pro-footer\">\n        <span>\n          Cada reporte llega al sistema de revisión de ALUMNI.\n        </span>\n      </footer>\n    </div>\n  );\n}" +
  "\n\n" +
  feedback.slice(
    formStart
  );

feedback +=
  `\n/* ${MARKER} */\n`;

/* ======================================================
   MOBILE NAV: smaller + About belongs to More
   ====================================================== */

nav = replaceExact(
  nav,
  `    pathname === "/feedback" ||
    pathname.startsWith("/feedback/")`,
  `    pathname === "/feedback" ||
    pathname.startsWith("/feedback/") ||
    pathname === "/about" ||
    pathname.startsWith("/about/")`,
  "More section About"
);

nav = replaceExact(
  nav,
  `bottom: "max(10px, env(safe-area-inset-bottom))",`,
  `bottom: "max(7px, env(safe-area-inset-bottom))",`,
  "navbar bottom"
);

nav = replaceExact(
  nav,
  `className="alumni-mobile-nav-clean fixed left-1/2 z-[2147482000] w-[calc(100%-16px)] max-w-[430px] -translate-x-1/2 rounded-[24px] border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_97%,transparent)] px-2 py-1.5 shadow-[0_16px_42px_var(--app-shadow)] backdrop-blur-xl [backface-visibility:hidden] lg:hidden"`,
  `className="alumni-mobile-nav-clean fixed left-1/2 z-[2147482000] w-[calc(100%-26px)] max-w-[390px] -translate-x-1/2 rounded-[20px] border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_97%,transparent)] px-1.5 py-1 shadow-[0_12px_32px_var(--app-shadow)] backdrop-blur-xl [backface-visibility:hidden] lg:hidden"`,
  "navbar shell class"
);

nav = replaceExact(
  nav,
  `className="alumni-mobile-nav-item flex min-h-[52px] items-center justify-center rounded-[18px]"`,
  `className="alumni-mobile-nav-item flex min-h-[46px] items-center justify-center rounded-[15px]"`,
  "navbar item"
);

nav = replaceExact(
  nav,
  `className="alumni-mobile-nav-icon relative flex h-10 w-12 items-center justify-center rounded-xl transition-colors duration-150"`,
  `className="alumni-mobile-nav-icon relative flex h-9 w-11 items-center justify-center rounded-[11px] transition-colors duration-150"`,
  "navbar icon shell"
);

nav = replaceExact(
  nav,
  `size={22}`,
  `size={20}`,
  "navbar icon size"
);

nav = replaceExact(
  nav,
  `className="absolute right-0.5 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-accent-fill)] px-1 text-[9px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]"`,
  `className="absolute right-0 top-0 flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--app-accent-fill)] px-1 text-[8px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]"`,
  "navbar unread badge"
);

nav +=
  `\n/* ${MARKER} */\n`;

/* ======================================================
   Files
   ====================================================== */

const feedbackCss =
  "/*\n * ALUMNI_FEEDBACK_PRO_3_0\n * Premium product-feedback experience.\n */\n\n.alumni-feedback-pro-home {\n  --feedback-accent-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  --feedback-accent-line:\n    color-mix(\n      in srgb,\n      var(--app-accent) 28%,\n      var(--app-border)\n    );\n  padding:\n    12px 0\n    20px;\n}\n\n.alumni-feedback-pro-hero {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  padding:\n    30px 22px\n    25px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    26px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-hero::before {\n  content: \"\";\n  position: absolute;\n  z-index: -2;\n  top: -118px;\n  right: -106px;\n  width: 236px;\n  height: 236px;\n  border:\n    1px solid\n    var(--feedback-accent-line);\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n.alumni-feedback-pro-orbit {\n  position: absolute;\n  z-index: -1;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 50%;\n  opacity: .65;\n  pointer-events: none;\n}\n\n.alumni-feedback-pro-orbit::after {\n  content: \"\";\n  position: absolute;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background:\n    var(--app-accent);\n  box-shadow:\n    0 0 0 5px\n    var(--feedback-accent-wash);\n}\n\n.alumni-feedback-pro-orbit-a {\n  width: 112px;\n  height: 112px;\n  left: -70px;\n  bottom: 20px;\n}\n\n.alumni-feedback-pro-orbit-a::after {\n  top: 14px;\n  right: 10px;\n}\n\n.alumni-feedback-pro-orbit-b {\n  width: 76px;\n  height: 76px;\n  right: 17px;\n  bottom: -46px;\n}\n\n.alumni-feedback-pro-orbit-b::after {\n  top: 8px;\n  left: 9px;\n}\n\n.alumni-feedback-pro-badge {\n  display:\n    inline-flex;\n  min-height: 27px;\n  align-items:\n    center;\n  gap: 6px;\n  padding:\n    0 10px;\n  border:\n    1px solid\n    var(--feedback-accent-line);\n  border-radius:\n    999px;\n  background:\n    var(--feedback-accent-wash);\n  color:\n    var(--app-accent);\n  font-size:\n    9px;\n  font-weight:\n    900;\n  letter-spacing:\n    .11em;\n  text-transform:\n    uppercase;\n}\n\n.alumni-feedback-pro-hero h2 {\n  max-width: 480px;\n  margin:\n    23px 0 0;\n  color:\n    var(--app-text);\n  font-size:\n    clamp(\n      30px,\n      8.5vw,\n      43px\n    );\n  font-weight:\n    950;\n  line-height:\n    1.02;\n  letter-spacing:\n    -.055em;\n}\n\n.alumni-feedback-pro-hero > p {\n  max-width: 470px;\n  margin:\n    16px 0 0;\n  color:\n    var(--app-text-soft);\n  font-size:\n    12px;\n  line-height:\n    1.7;\n}\n\n.alumni-feedback-pro-signal {\n  display:\n    inline-flex;\n  align-items:\n    center;\n  gap: 7px;\n  margin-top:\n    24px;\n  color:\n    var(--app-muted);\n  font-size:\n    9.5px;\n  font-weight:\n    750;\n}\n\n.alumni-feedback-pro-signal > span {\n  width: 7px;\n  height: 7px;\n  border-radius:\n    50%;\n  background:\n    var(--app-success);\n  box-shadow:\n    0 0 0 5px\n    color-mix(\n      in srgb,\n      var(--app-success) 10%,\n      transparent\n    );\n}\n\n.alumni-feedback-pro-featured {\n  display: grid;\n  gap: 9px;\n  margin-top: 14px;\n}\n\n.alumni-feedback-pro-feature {\n  display: grid;\n  width: 100%;\n  grid-template-columns:\n    42px\n    minmax(0,1fr)\n    20px;\n  align-items:\n    center;\n  gap: 12px;\n  padding:\n    16px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    19px;\n  background:\n    var(--app-surface);\n  color:\n    var(--app-text);\n  text-align:\n    left;\n}\n\n.alumni-feedback-pro-feature:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-feedback-pro-feature-icon {\n  display:\n    inline-flex;\n  width: 42px;\n  height: 42px;\n  align-items:\n    center;\n  justify-content:\n    center;\n  border-radius:\n    13px;\n}\n\n.alumni-feedback-pro-feature-problem\n.alumni-feedback-pro-feature-icon {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-danger) 10%,\n      transparent\n    );\n  color:\n    var(--app-danger);\n}\n\n.alumni-feedback-pro-feature-idea\n.alumni-feedback-pro-feature-icon {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-success) 11%,\n      transparent\n    );\n  color:\n    var(--app-success);\n}\n\n.alumni-feedback-pro-feature-copy {\n  display: flex;\n  min-width: 0;\n  flex-direction:\n    column;\n}\n\n.alumni-feedback-pro-feature-copy\n  small {\n  color:\n    var(--app-muted-3);\n  font-size:\n    8px;\n  font-weight:\n    900;\n  letter-spacing:\n    .12em;\n}\n\n.alumni-feedback-pro-feature-copy\n  strong {\n  margin-top: 4px;\n  color:\n    var(--app-text);\n  font-size:\n    13px;\n  font-weight:\n    900;\n}\n\n.alumni-feedback-pro-feature-copy\n  span {\n  margin-top: 4px;\n  color:\n    var(--app-muted);\n  font-size:\n    9.5px;\n  line-height:\n    1.45;\n}\n\n.alumni-feedback-pro-feature\n  > svg {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-feedback-pro-tools {\n  margin-top: 34px;\n}\n\n.alumni-feedback-pro-section-title {\n  padding:\n    0 3px\n    12px;\n}\n\n.alumni-feedback-pro-section-title\n  > span {\n  color:\n    var(--app-accent);\n  font-size:\n    8.5px;\n  font-weight:\n    900;\n  letter-spacing:\n    .14em;\n}\n\n.alumni-feedback-pro-section-title h3 {\n  margin:\n    5px 0 0;\n  color:\n    var(--app-text);\n  font-size:\n    19px;\n  font-weight:\n    930;\n  letter-spacing:\n    -.035em;\n}\n\n.alumni-feedback-pro-tool-list {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    19px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-tool-row {\n  display: grid;\n  width: 100%;\n  grid-template-columns:\n    36px\n    minmax(0,1fr)\n    18px;\n  align-items:\n    center;\n  gap: 11px;\n  min-height:\n    68px;\n  padding:\n    9px 14px;\n  border: 0;\n  border-bottom:\n    1px solid\n    var(--app-border);\n  background:\n    transparent;\n  color:\n    inherit;\n  text-align:\n    left;\n}\n\n.alumni-feedback-pro-tool-row:last-child {\n  border-bottom: 0;\n}\n\n.alumni-feedback-pro-tool-row:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-feedback-pro-tool-icon {\n  display:\n    inline-flex;\n  width: 35px;\n  height: 35px;\n  align-items:\n    center;\n  justify-content:\n    center;\n  border-radius:\n    11px;\n  background:\n    var(--app-soft);\n  color:\n    var(--app-accent);\n}\n\n.alumni-feedback-pro-tool-row\n  > span:nth-child(2) {\n  display: flex;\n  min-width: 0;\n  flex-direction:\n    column;\n  gap: 3px;\n}\n\n.alumni-feedback-pro-tool-row\n  strong {\n  color:\n    var(--app-text);\n  font-size:\n    11.5px;\n  font-weight:\n    850;\n}\n\n.alumni-feedback-pro-tool-row\n  small {\n  color:\n    var(--app-muted);\n  font-size:\n    9.5px;\n}\n\n.alumni-feedback-pro-tool-row\n  > svg {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-feedback-pro-direct {\n  display: grid;\n  grid-template-columns:\n    39px\n    minmax(0,1fr)\n    18px;\n  align-items:\n    center;\n  gap: 12px;\n  margin-top: 12px;\n  padding:\n    15px;\n  border:\n    1px solid\n    var(--feedback-accent-line);\n  border-radius:\n    18px;\n  background:\n    var(--feedback-accent-wash);\n  color:\n    inherit;\n  text-decoration:\n    none;\n}\n\n.alumni-feedback-pro-direct-icon {\n  display:\n    inline-flex;\n  width: 39px;\n  height: 39px;\n  align-items:\n    center;\n  justify-content:\n    center;\n  border-radius:\n    12px;\n  background:\n    var(--app-accent-fill);\n  color:\n    var(--app-on-accent);\n}\n\n.alumni-feedback-pro-direct\n  > span:nth-child(2) {\n  display: flex;\n  min-width: 0;\n  flex-direction:\n    column;\n}\n\n.alumni-feedback-pro-direct\n  small {\n  color:\n    var(--app-accent);\n  font-size:\n    8px;\n  font-weight:\n    900;\n  letter-spacing:\n    .12em;\n}\n\n.alumni-feedback-pro-direct\n  strong {\n  overflow: hidden;\n  margin-top: 4px;\n  color:\n    var(--app-text);\n  font-size:\n    11px;\n  font-weight:\n    900;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-feedback-pro-direct\n  span span {\n  margin-top: 3px;\n  color:\n    var(--app-muted);\n  font-size:\n    9px;\n}\n\n.alumni-feedback-pro-direct\n  > svg {\n  color:\n    var(--app-accent);\n}\n\n.alumni-feedback-pro-legal {\n  margin-top: 26px;\n}\n\n.alumni-feedback-pro-legal\n  button {\n  display: grid;\n  width: 100%;\n  grid-template-columns:\n    28px\n    minmax(0,1fr)\n    18px;\n  align-items:\n    center;\n  gap: 10px;\n  padding:\n    13px 3px;\n  border: 0;\n  border-top:\n    1px solid\n    var(--app-border);\n  border-bottom:\n    1px solid\n    var(--app-border);\n  background:\n    transparent;\n  color:\n    inherit;\n  text-align:\n    left;\n}\n\n.alumni-feedback-pro-legal\n  button > svg:first-child {\n  color:\n    var(--app-muted);\n}\n\n.alumni-feedback-pro-legal\n  button > span {\n  display: flex;\n  flex-direction:\n    column;\n  gap: 3px;\n}\n\n.alumni-feedback-pro-legal\n  strong {\n  color:\n    var(--app-text);\n  font-size:\n    10.5px;\n  font-weight:\n    850;\n}\n\n.alumni-feedback-pro-legal\n  small {\n  color:\n    var(--app-muted);\n  font-size:\n    9px;\n}\n\n.alumni-feedback-pro-legal\n  button > svg:last-child {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-feedback-pro-footer {\n  padding:\n    23px 8px\n    2px;\n  color:\n    var(--app-muted-3);\n  font-size:\n    9px;\n  font-weight:\n    650;\n  text-align:\n    center;\n}\n\n/* Upgrade inner feedback views */\n\n.alumni-help-v2[\n  data-feedback-view=\"form\"\n]\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial,\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial {\n  animation:\n    alumniFeedbackProEnter\n    .4s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-hero {\n  margin-top: 10px;\n  padding:\n    21px 18px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    20px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-note {\n  margin-top: 11px;\n  border-radius:\n    14px;\n}\n\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-field\n  input,\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-field\n  textarea {\n  border-radius:\n    15px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-attach {\n  border-radius:\n    16px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-feedback-editorial-send {\n  min-height:\n    49px;\n  border-radius:\n    15px;\n  box-shadow:\n    0 10px 28px\n    color-mix(\n      in srgb,\n      var(--app-accent) 14%,\n      transparent\n    );\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-detail {\n  animation:\n    alumniFeedbackProEnter\n    .36s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-detail-intro {\n  margin-top: 10px;\n  padding:\n    18px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-faqs {\n  margin-top: 12px;\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-faq {\n  padding-left: 15px;\n  padding-right: 15px;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-status-list,\n.alumni-feedback-pro-shell\n.alumni-help-legal-list {\n  margin-top: 12px;\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    18px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-status-list\n  > div,\n.alumni-feedback-pro-shell\n.alumni-help-legal-list\n  a {\n  padding-left: 15px;\n  padding-right: 15px;\n}\n\n.alumni-feedback-pro-shell\n.alumni-help-success {\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    25px;\n  background:\n    var(--app-surface);\n}\n\n@keyframes alumniFeedbackProEnter {\n  from {\n    opacity: 0;\n    transform:\n      translateY(12px);\n  }\n\n  to {\n    opacity: 1;\n    transform:\n      translateY(0);\n  }\n}\n\n@media (max-width: 480px) {\n  .alumni-feedback-pro-hero {\n    padding:\n      27px 18px\n      23px;\n    border-radius:\n      23px;\n  }\n\n  .alumni-feedback-pro-feature {\n    padding:\n      14px;\n  }\n}\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  .alumni-feedback-pro-shell\n  .alumni-feedback-editorial,\n  .alumni-feedback-pro-shell\n  .alumni-help-detail {\n    animation: none;\n  }\n}\n\n/* ALUMNI_FEEDBACK_PRO_NAV_COMPACT_3_0 */\n";

/* ======================================================
   Syntax validation
   ====================================================== */

try {
  const ts =
    require("typescript");

  for (
    const [rel, content] of [
      [ABOUT, about],
      [FEEDBACK, feedback],
      [NAV, nav],
    ]
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
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
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
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.mkdirSync(
  path.dirname(
    abs(FEEDBACK_CSS)
  ),
  { recursive: true }
);

fs.writeFileSync(
  abs(ABOUT),
  about,
  "utf8"
);

fs.writeFileSync(
  abs(FEEDBACK),
  feedback,
  "utf8"
);

fs.writeFileSync(
  abs(FEEDBACK_CSS),
  feedbackCss,
  "utf8"
);

fs.writeFileSync(
  abs(NAV),
  nav,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Feedback Pro 3.0 aplicado."
);
console.log(
  "✅ Contacto actualizado con correo de Samuel."
);
console.log(
  "✅ Feedback premium con motion."
);
console.log(
  "✅ Formulario y lógica preservados."
);
console.log(
  "✅ Navbar móvil más compacta."
);
console.log(
  "✅ /about ahora mantiene Más activo."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
