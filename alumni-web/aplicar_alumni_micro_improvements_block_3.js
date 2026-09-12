const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAGE =
  "src/app/feedback/page.tsx";
const CSS =
  "src/app/feedback/feedback-inspire-5-0.css";
const MARKER =
  "ALUMNI_MICRO_IMPROVEMENTS_BLOCK_3";

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
  const target =
    abs(rel) +
    ".before-micro-improvements-block-3.bak";

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
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

let page = read(PAGE);
backup(PAGE, page);

/* icons */
page =
  page.replace(
    "  ImagePlus,\n",
    "  Plus,\n"
  );

page =
  page.replace(
    "  Send,\n",
    "  ArrowUp,\n  Sparkles,\n"
  );

/* css */
if (
  !page.includes(
    'import "./feedback-inspire-5-0.css";'
  )
) {
  page =
    replaceRequired(
      page,
      'import "./feedback-simple-4-0.css";',
      'import "./feedback-simple-4-0.css";\nimport "./feedback-inspire-5-0.css";',
      "import CSS base de Feedback"
    );
}

/* hero */
const oldPrompt = `          <p>
            Cuéntanos qué podemos mejorar.
          </p>

          <textarea`;

const newPrompt = `          <motion.div
            className="alumni-feedback-inspire"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: .42,
              ease: [
                .2,
                .8,
                .2,
                1,
              ],
            }}
          >
            <motion.div
              className="alumni-feedback-inspire-visual"
              aria-hidden="true"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      rotate: [
                        0,
                        2,
                        0,
                        -2,
                        0,
                      ],
                    }
              }
              transition={
                reduceMotion
                  ? undefined
                  : {
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            >
              <motion.span
                className="alumni-feedback-inspire-ring"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        scale: [
                          1,
                          1.05,
                          1,
                        ],
                        opacity: [
                          .65,
                          1,
                          .65,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />

              <span className="alumni-feedback-inspire-core">
                <Sparkles
                  size={18}
                  strokeWidth={1.9}
                />
              </span>

              <motion.span
                className="alumni-feedback-inspire-dot is-one"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [
                          0,
                          -4,
                          0,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
              <motion.span
                className="alumni-feedback-inspire-dot is-two"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        x: [
                          0,
                          4,
                          0,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
              <motion.span
                className="alumni-feedback-inspire-dot is-three"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [
                          0,
                          3,
                          0,
                        ],
                      }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 2.7,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            </motion.div>

            <h2>Haz Alumni mejor</h2>
            <p>
              Cuéntanos qué cambiarías.
            </p>
          </motion.div>

          <textarea`;

page =
  replaceRequired(
    page,
    oldPrompt,
    newPrompt,
    "prompt principal de Feedback"
  );

page =
  page.replace(
    'placeholder="Escribe aquí..."',
    'placeholder="¿Qué podemos mejorar?"'
  );

page =
  page.replace(
    "\n            autoFocus",
    ""
  );

/* photo */
const oldPhoto = `              <ImagePlus
                size={18}
              />
              Fotos
              {files.length >
                0 && (
                <span>
                  {files.length}/
                  {MAX_FILES}
                </span>
              )}`;

const newPhoto = `              <Plus
                size={20}
                strokeWidth={2}
              />
              {files.length >
                0 && (
                <span>
                  {files.length}
                </span>
              )}`;

page =
  replaceRequired(
    page,
    oldPhoto,
    newPhoto,
    "botón de fotos"
  );

page =
  page.replace(
    `            >
              <Plus`,
    `              aria-label="Añadir foto"
              title="Añadir foto"
            >
              <Plus`
  );

/* send */
const oldSend = `              <Send
                size={17}
              />
              {sending
                ? "Enviando..."
                : "Enviar"}`;

const newSend = `              <ArrowUp
                size={18}
                strokeWidth={2.3}
              />
              {sending
                ? "Enviando..."
                : "Enviar"}`;

page =
  replaceRequired(
    page,
    oldSend,
    newSend,
    "icono de enviar"
  );

if (!page.includes(MARKER)) {
  page +=
    `\n/* ${MARKER} */\n`;
}

const css = "/*\n * ALUMNI_MICRO_IMPROVEMENTS_BLOCK_3\n * Feedback — limpio, inspirador, mobile-first y con motion.\n */\n\n.alumni-feedback-simple {\n  width: 100%;\n  max-width: 560px;\n  min-width: 0;\n  overflow-x: clip;\n}\n\n.alumni-feedback-simple-header {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  min-height: 56px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 84%,\n      transparent\n    );\n  backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n  -webkit-backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n}\n\n.alumni-feedback-simple-header button {\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 5%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    14px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 74%,\n      transparent\n    ) !important;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease !important;\n}\n\n.alumni-feedback-simple-header button:active {\n  transform: scale(.93);\n}\n\n.alumni-feedback-simple-header h1 {\n  font-size: 16px !important;\n  font-weight: 930 !important;\n}\n\n/* ======================================================\n   HERO MOTION\n   ====================================================== */\n\n.alumni-feedback-inspire {\n  display: grid;\n  justify-items: center;\n  gap: 7px;\n  padding:\n    18px 4px 20px;\n  text-align: center;\n}\n\n.alumni-feedback-inspire-visual {\n  position: relative;\n  width: 78px;\n  height: 78px;\n  margin-bottom: 2px;\n}\n\n.alumni-feedback-inspire-core {\n  position: absolute;\n  inset: 20px;\n  display: grid;\n  place-items: center;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 28%,\n      transparent\n    );\n  border-radius: 22px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      var(--app-surface)\n    );\n  color:\n    var(--app-accent);\n  box-shadow:\n    0 12px 34px\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      transparent\n    );\n}\n\n.alumni-feedback-inspire-ring {\n  position: absolute;\n  inset: 7px;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 15%,\n      transparent\n    );\n  border-radius: 999px;\n}\n\n.alumni-feedback-inspire-dot {\n  position: absolute;\n  width: 7px;\n  height: 7px;\n  border-radius: 999px;\n  background: var(--app-accent);\n  box-shadow:\n    0 0 0 5px\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      transparent\n    );\n}\n\n.alumni-feedback-inspire-dot.is-one {\n  top: 9px;\n  left: 35px;\n}\n\n.alumni-feedback-inspire-dot.is-two {\n  right: 8px;\n  bottom: 22px;\n  width: 5px;\n  height: 5px;\n}\n\n.alumni-feedback-inspire-dot.is-three {\n  bottom: 10px;\n  left: 19px;\n  width: 4px;\n  height: 4px;\n}\n\n.alumni-feedback-inspire h2 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: 21px;\n  font-weight: 950;\n  line-height: 1.08;\n  letter-spacing: -.035em;\n}\n\n.alumni-feedback-inspire p {\n  margin: 0;\n  color: var(--app-muted);\n  font-size: 11px;\n  line-height: 1.45;\n}\n\n/* Hide old standalone helper copy */\n.alumni-feedback-simple-body > p {\n  display: none !important;\n}\n\n/* ======================================================\n   TEXTAREA — flat / premium\n   ====================================================== */\n\n.alumni-feedback-simple-body {\n  padding-top: 0 !important;\n}\n\n.alumni-feedback-simple-body textarea {\n  min-height: 190px !important;\n  padding: 17px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    22px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 86%,\n      transparent\n    ) !important;\n  box-shadow:\n    inset 0 1px 0\n    color-mix(\n      in srgb,\n      white 3%,\n      transparent\n    );\n  transition:\n    border-color 170ms ease,\n    background-color 170ms ease,\n    box-shadow 170ms ease !important;\n}\n\n.alumni-feedback-simple-body textarea:focus {\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 38%,\n      var(--app-border)\n    ) !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 94%,\n      transparent\n    ) !important;\n  box-shadow:\n    0 0 0 4px\n    color-mix(\n      in srgb,\n      var(--app-accent) 6%,\n      transparent\n    ) !important;\n}\n\n/* ======================================================\n   ACTIONS\n   ====================================================== */\n\n.alumni-feedback-simple-actions {\n  align-items: center !important;\n  margin-top: 13px !important;\n}\n\n.alumni-feedback-simple-photo {\n  position: relative;\n  width: 42px !important;\n  min-width: 42px;\n  height: 42px !important;\n  min-height: 42px !important;\n  padding: 0 !important;\n  border:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    999px !important;\n  background:\n    var(--app-soft) !important;\n  color:\n    var(--app-text-soft) !important;\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease !important;\n}\n\n.alumni-feedback-simple-photo:active {\n  transform: scale(.92);\n  background:\n    var(--app-soft-strong) !important;\n}\n\n.alumni-feedback-simple-photo > span {\n  position: absolute;\n  top: -5px;\n  right: -6px;\n  display: grid;\n  min-width: 19px;\n  height: 19px;\n  place-items: center;\n  padding: 0 5px;\n  border:\n    2px solid\n    var(--app-bg);\n  border-radius: 999px;\n  background:\n    var(--app-accent-fill);\n  color:\n    var(--app-on-accent) !important;\n  font-size:\n    8px !important;\n  font-weight: 900;\n}\n\n.alumni-feedback-simple-send {\n  min-width: 116px !important;\n  min-height: 42px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 20%,\n      transparent\n    ) !important;\n  border-radius:\n    999px !important;\n  box-shadow:\n    0 9px 26px\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    box-shadow 170ms ease,\n    opacity 150ms ease !important;\n}\n\n.alumni-feedback-simple-send:not(:disabled):active {\n  transform: scale(.95);\n  box-shadow:\n    0 5px 16px\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n}\n\n.alumni-feedback-simple-send:disabled {\n  box-shadow: none;\n}\n\n/* ======================================================\n   PREVIEWS\n   ====================================================== */\n\n.alumni-feedback-simple-previews {\n  margin-top: 12px !important;\n}\n\n.alumni-feedback-simple-preview {\n  border-radius: 16px !important;\n  animation:\n    alumniFeedbackPreviewIn\n    .28s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n/* ======================================================\n   SUCCESS\n   ====================================================== */\n\n.alumni-feedback-simple-success > span {\n  box-shadow:\n    0 0 0 10px\n    color-mix(\n      in srgb,\n      var(--app-success) 6%,\n      transparent\n    );\n}\n\n.alumni-feedback-simple-success button {\n  border-radius: 999px !important;\n}\n\n/* ======================================================\n   KEYFRAMES\n   ====================================================== */\n\n@keyframes alumniFeedbackPreviewIn {\n  from {\n    opacity: 0;\n    transform:\n      scale(.94)\n      translate3d(0, 5px, 0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      scale(1)\n      translate3d(0, 0, 0);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-feedback-simple-preview,\n  .alumni-feedback-simple-header button,\n  .alumni-feedback-simple-photo,\n  .alumni-feedback-simple-send,\n  .alumni-feedback-simple-body textarea {\n    animation: none !important;\n    transition: none !important;\n  }\n}\n\n@media (max-width: 390px) {\n  .alumni-feedback-inspire {\n    padding-top: 14px;\n  }\n\n  .alumni-feedback-inspire-visual {\n    width: 70px;\n    height: 70px;\n  }\n\n  .alumni-feedback-inspire-core {\n    inset: 18px;\n  }\n\n  .alumni-feedback-inspire h2 {\n    font-size: 20px;\n  }\n\n  .alumni-feedback-simple-body textarea {\n    min-height: 178px !important;\n  }\n}\n\n/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_3 */\n";

try {
  const ts = require("typescript");

  const parsed =
    ts.createSourceFile(
      PAGE,
      page,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics || [];

  if (diagnostics.length) {
    const first = diagnostics[0];

    fail(
      `${PAGE}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: Feedback válido"
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
  "✅ BLOQUE 3 aplicado."
);
console.log(
  "✅ Feedback más inspirador."
);
console.log(
  "✅ Motion premium y sutil."
);
console.log(
  "✅ Adjuntar ahora usa +."
);
console.log(
  "✅ Enviar ahora usa flecha arriba."
);
console.log(
  "✅ Mantiene la lógica original."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
