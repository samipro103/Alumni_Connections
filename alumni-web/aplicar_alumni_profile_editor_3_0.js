const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PAGE =
  "src/app/settings/page.tsx";

const COMPONENT =
  "src/components/settings/ProfileEditorPro.tsx";

const CSS =
  "src/app/settings/settings-edit-profile-pro-3-0.css";

const MARKER =
  "ALUMNI_PROFILE_EDITOR_3_0_PRO_CLEAN_MOTION";

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
    ".before-profile-editor-3-0.bak";

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

let page =
  read(PAGE);

let component =
  read(COMPONENT);

backup(
  PAGE,
  page
);

backup(
  COMPONENT,
  component
);

/* ======================================================
   1. CSS FINAL — IMPORTAR DESPUÉS DE STABILITY
   ====================================================== */

if (
  !page.includes(
    'import "./settings-edit-profile-pro-3-0.css";'
  )
) {
  page =
    replaceRequired(
      page,
      'import "./settings-stability-3-0.css";',
      'import "./settings-stability-3-0.css";\nimport "./settings-edit-profile-pro-3-0.css";',
      "import settings-stability-3-0.css"
    );
}

/* ======================================================
   2. FRAMER MOTION EN EL EDITOR
   ====================================================== */

if (
  !component.includes(
    'from "framer-motion";'
  )
) {
  component =
    replaceRequired(
      component,
      'import { useEffect, useMemo, useRef, useState } from "react";',
      'import { useEffect, useMemo, useRef, useState } from "react";\nimport { motion, useReducedMotion } from "framer-motion";',
      "import de React"
    );
}

if (
  !component.includes(
    "const reduceMotion =\n    useReducedMotion();"
  )
) {
  component =
    replaceRequired(
      component,
      `  const avatarInput = useRef<HTMLInputElement>(null);`,
      `  const reduceMotion =
    useReducedMotion();

  const avatarInput = useRef<HTMLInputElement>(null);`,
      "inicio de ProfileEditorPro"
    );
}

/* Root with authored motion + global motion protection */
component =
  replaceRequired(
    component,
    `  return (
    <div
  className="alumni-profile-editor"
  data-pull-refresh-lock="true"
>`,
    `  return (
    <motion.div
      className="alumni-profile-editor"
      data-pull-refresh-lock="true"
      data-alumni-motion-ignore="true"
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
        duration: .38,
        ease: [
          .2,
          .8,
          .2,
          1,
        ],
      }}
    >`,
    "raíz del editor"
  );

/* Media motion */
component =
  replaceRequired(
    component,
    `      <div className="alumni-profile-editor-media">`,
    `      <motion.div
        className="alumni-profile-editor-media"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 7,
                scale: .995,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: .44,
          delay: .04,
          ease: [
            .2,
            .8,
            .2,
            1,
          ],
        }}
      >`,
    "media del editor"
  );

component =
  replaceRequired(
    component,
    `        </div>
      </div>

      <div className="alumni-profile-editor-fields">`,
    `        </div>
      </motion.div>

      <motion.div
        className="alumni-profile-editor-fields"
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
          duration: .46,
          delay: .08,
          ease: [
            .2,
            .8,
            .2,
            1,
          ],
        }}
      >`,
    "cierre media / apertura fields"
  );

component =
  replaceRequired(
    component,
    `        </section>
      </div>

      {picker === "institution" && (`,
    `        </section>
      </motion.div>

      {picker === "institution" && (`,
    "cierre de fields"
  );

/* Root close: only the root immediately before TextRow */
component =
  replaceRequired(
    component,
    `      )}
    </div>
  );
}

function TextRow({`,
    `      )}
    </motion.div>
  );
}

function TextRow({`,
    "cierre raíz del editor"
  );

/* Picker motion */
if (
  !component.includes(
    "const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.div className=\"alumni-settings-picker-backdrop"
  )
) {
  component =
    replaceRequired(
      component,
      `function PickerShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="alumni-settings-picker-backdrop alumni-settings-picker-backdrop-profile fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">
      <div className="alumni-settings-picker-sheet flex h-[78dvh] w-full max-w-[520px] flex-col p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:h-[70dvh] sm:p-5">`,
      `function PickerShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.div
      className="alumni-settings-picker-backdrop alumni-settings-picker-backdrop-profile fixed inset-0 flex items-end justify-center sm:items-center sm:p-5"
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
            }
      }
      animate={{
        opacity: 1,
      }}
      transition={{
        duration: .18,
      }}
    >
      <motion.div
        className="alumni-settings-picker-sheet flex h-[78dvh] w-full max-w-[520px] flex-col p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:h-[70dvh] sm:p-5"
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 18,
                scale: .99,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: .32,
          ease: [
            .2,
            .8,
            .2,
            1,
          ],
        }}
      >`,
      "PickerShell"
    );

  component =
    replaceRequired(
      component,
      `        {children}
      </div>
    </div>
  );
}

function SearchBox({`,
      `        {children}
      </motion.div>
    </motion.div>
  );
}

function SearchBox({`,
      "cierre PickerShell"
    );
}

if (
  !component.includes(
    MARKER
  )
) {
  component +=
    `\n/* ${MARKER} */\n`;
}

const css =
  "/*\n * ALUMNI_PROFILE_EDITOR_3_0_PRO_CLEAN_MOTION\n * Editar perfil — diseño final profesional, limpio y mobile-first.\n * Motion explícito; sin movimiento estructural global.\n */\n\n.alumni-profile-editor {\n  --profile-editor-max: 700px;\n  --profile-editor-radius: 22px;\n\n  width: 100%;\n  max-width: var(--profile-editor-max);\n  min-width: 0;\n  margin: 0 auto;\n  overflow-x: clip;\n  padding:\n    0 0\n    calc(\n      110px +\n      env(safe-area-inset-bottom)\n    );\n  color: var(--app-text);\n}\n\n/* =========================================================\n   TOP BAR\n   ========================================================= */\n\n.alumni-profile-editor-top {\n  position: sticky !important;\n  top: 0;\n  z-index: 40;\n  display: grid !important;\n  grid-template-columns:\n    42px\n    minmax(0, 1fr)\n    auto !important;\n  min-height: 62px !important;\n  align-items: center !important;\n  gap: 9px !important;\n  padding:\n    7px 0 9px !important;\n  border: 0 !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 84%,\n      transparent\n    ) !important;\n  backdrop-filter:\n    blur(18px)\n    saturate(1.08);\n  -webkit-backdrop-filter:\n    blur(18px)\n    saturate(1.08);\n  animation:\n    alumniProfileEditorTopIn\n    .34s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-profile-editor-top::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 1px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-border) 70%,\n      transparent\n    );\n}\n\n.alumni-profile-editor-top\n> button:first-child {\n  display: inline-flex !important;\n  width: 40px !important;\n  height: 40px !important;\n  align-items: center;\n  justify-content: center;\n  padding: 0 !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 5%,\n      var(--app-border)\n    ) !important;\n  border-radius: 14px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 76%,\n      transparent\n    ) !important;\n  color:\n    var(--app-text) !important;\n  box-shadow:\n    0 7px 22px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 14%,\n      transparent\n    );\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease,\n    border-color 160ms ease !important;\n}\n\n.alumni-profile-editor-top\n> button:first-child:active {\n  transform:\n    translateX(-1px)\n    scale(.93);\n  background:\n    var(--app-soft) !important;\n}\n\n.alumni-profile-editor-top-copy {\n  min-width: 0;\n  text-align: center;\n}\n\n.alumni-profile-editor-top-copy p {\n  margin: 0 !important;\n  color:\n    var(--app-text) !important;\n  font-size:\n    16px !important;\n  font-weight:\n    930 !important;\n  line-height:\n    1.1 !important;\n  letter-spacing:\n    -.035em !important;\n}\n\n.alumni-profile-editor-save {\n  display: inline-flex !important;\n  min-width: 88px !important;\n  min-height: 40px !important;\n  align-items: center !important;\n  justify-content: center !important;\n  gap: 6px !important;\n  padding:\n    0 14px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 22%,\n      transparent\n    ) !important;\n  border-radius:\n    999px !important;\n  background:\n    var(--app-accent-fill) !important;\n  color:\n    var(--app-on-accent) !important;\n  box-shadow:\n    0 8px 24px\n    color-mix(\n      in srgb,\n      var(--app-accent) 16%,\n      transparent\n    ) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    box-shadow 170ms ease,\n    opacity 150ms ease !important;\n}\n\n.alumni-profile-editor-save\nspan {\n  font-size:\n    10.5px !important;\n  font-weight:\n    900 !important;\n}\n\n.alumni-profile-editor-save:not(:disabled):active {\n  transform:\n    scale(.95);\n  box-shadow:\n    0 4px 14px\n    color-mix(\n      in srgb,\n      var(--app-accent) 12%,\n      transparent\n    ) !important;\n}\n\n.alumni-profile-editor-save:disabled {\n  opacity: .5;\n  box-shadow: none !important;\n}\n\n/* =========================================================\n   PROFILE MEDIA\n   ========================================================= */\n\n.alumni-profile-editor-media {\n  position: relative;\n  margin-top:\n    14px !important;\n  padding:\n    0 0 8px !important;\n}\n\n.alumni-profile-editor-banner {\n  position: relative;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 5%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    24px !important;\n  background:\n    var(--app-surface-2) !important;\n  box-shadow:\n    0 16px 40px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 15%,\n      transparent\n    ) !important;\n}\n\n.alumni-profile-editor-banner::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  z-index: 2;\n  pointer-events: none;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255,255,255,.035),\n      transparent 44%,\n      rgba(0,0,0,.09)\n    );\n}\n\n.alumni-profile-editor-banner-button {\n  position: relative;\n  display: block !important;\n  width: 100%;\n  height:\n    clamp(\n      146px,\n      42vw,\n      184px\n    ) !important;\n  min-height:\n    146px !important;\n  max-height:\n    184px !important;\n  overflow: hidden;\n  border: 0 !important;\n  background:\n    var(--app-soft-strong) !important;\n  transition:\n    transform 220ms\n      cubic-bezier(.2,.8,.2,1),\n    filter 180ms ease !important;\n}\n\n.alumni-profile-editor-banner-button\nimg {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  transition:\n    transform 360ms\n      cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-profile-editor-banner-button:active\nimg {\n  transform:\n    scale(1.012);\n}\n\n.alumni-profile-editor-banner-action {\n  z-index: 4;\n  right: 11px !important;\n  bottom: 11px !important;\n  display: inline-flex !important;\n  height: 34px !important;\n  min-height: 34px !important;\n  align-items: center;\n  gap: 6px !important;\n  padding:\n    0 11px !important;\n  border:\n    1px solid\n    rgba(255,255,255,.16) !important;\n  border-radius:\n    999px !important;\n  background:\n    rgba(5,8,12,.56) !important;\n  color:\n    #fff !important;\n  font-size:\n    9px !important;\n  font-weight:\n    850 !important;\n  backdrop-filter:\n    blur(14px);\n  -webkit-backdrop-filter:\n    blur(14px);\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease !important;\n}\n\n.alumni-profile-editor-banner-button:active\n.alumni-profile-editor-banner-action {\n  transform:\n    scale(.95);\n}\n\n.alumni-profile-editor-photo-row {\n  position: relative;\n  z-index: 5;\n  display: flex !important;\n  align-items: flex-end !important;\n  justify-content: flex-start !important;\n  min-height: 54px;\n  gap: 10px !important;\n  margin-top:\n    -39px !important;\n  padding:\n    0 14px !important;\n}\n\n.alumni-profile-editor-avatar-cluster {\n  position: relative;\n  width: 92px;\n  height: 92px;\n  flex:\n    0 0 92px;\n}\n\n.alumni-profile-editor-avatar {\n  display: flex;\n  width:\n    92px !important;\n  height:\n    92px !important;\n  flex:\n    0 0 92px !important;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  border:\n    4px solid\n    var(--app-bg) !important;\n  border-radius:\n    999px !important;\n  background:\n    var(--app-surface) !important;\n  box-shadow:\n    0 13px 34px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 20%,\n      transparent\n    ) !important;\n  transition:\n    transform 180ms\n      cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-profile-editor-avatar\nimg {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.alumni-profile-editor-avatar-cluster:active\n.alumni-profile-editor-avatar {\n  transform:\n    scale(.985);\n}\n\n.alumni-profile-editor-camera {\n  position: absolute !important;\n  right:\n    -1px !important;\n  bottom:\n    2px !important;\n  display: inline-flex !important;\n  width:\n    32px !important;\n  height:\n    32px !important;\n  align-items: center;\n  justify-content: center;\n  padding: 0 !important;\n  border:\n    2px solid\n    var(--app-bg) !important;\n  border-radius:\n    999px !important;\n  background:\n    var(--app-accent-fill) !important;\n  color:\n    var(--app-on-accent) !important;\n  box-shadow:\n    0 6px 16px\n    color-mix(\n      in srgb,\n      var(--app-accent) 18%,\n      transparent\n    ) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-profile-editor-camera:active {\n  transform:\n    scale(.9);\n}\n\n.alumni-profile-editor-photo-copy {\n  display:\n    none !important;\n}\n\n/* =========================================================\n   SECTIONS\n   ========================================================= */\n\n.alumni-profile-editor-fields {\n  margin-top:\n    8px !important;\n}\n\n.alumni-editor-section {\n  position: relative;\n  margin:\n    0 !important;\n  padding:\n    22px 0 5px !important;\n  border:\n    0 !important;\n  background:\n    transparent !important;\n}\n\n.alumni-editor-section +\n.alumni-editor-section {\n  margin-top:\n    6px !important;\n}\n\n.alumni-editor-section-head {\n  display: flex;\n  min-height: 28px;\n  align-items: center;\n  justify-content: space-between;\n  padding:\n    0 2px 9px !important;\n  border: 0 !important;\n}\n\n.alumni-editor-section-head\nh3 {\n  margin: 0 !important;\n  color:\n    var(--app-muted-2) !important;\n  font-size:\n    9px !important;\n  font-weight:\n    900 !important;\n  line-height:\n    1 !important;\n  letter-spacing:\n    .16em !important;\n  text-transform:\n    uppercase;\n}\n\n.alumni-editor-section-head\np,\n.alumni-editor-section-head\nsmall {\n  display:\n    none !important;\n}\n\n.alumni-editor-grid-2 {\n  display: grid !important;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0,1fr)\n    ) !important;\n  gap:\n    0 18px !important;\n}\n\n/* =========================================================\n   TEXT / PICKER ROWS — NO HEAVY BOXES\n   ========================================================= */\n\n.alumni-profile-editor\n.alumni-edit-row {\n  min-width: 0;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text,\n.alumni-profile-editor\n.alumni-edit-row-picker {\n  position: relative;\n  display: flex !important;\n  min-height:\n    68px !important;\n  align-items:\n    center !important;\n  gap:\n    12px !important;\n  overflow:\n    visible !important;\n  padding:\n    9px 1px !important;\n  border-top:\n    0 !important;\n  border-right:\n    0 !important;\n  border-bottom:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-border) 82%,\n      transparent\n    ) !important;\n  border-left:\n    0 !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  box-shadow:\n    none !important;\n  transition:\n    border-color 170ms ease,\n    background-color 170ms ease,\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text::before,\n.alumni-profile-editor\n.alumni-edit-row-picker::before {\n  display:\n    none !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text:focus-within,\n.alumni-profile-editor\n.alumni-edit-row-picker:focus-within {\n  border-bottom-color:\n    color-mix(\n      in srgb,\n      var(--app-accent) 54%,\n      var(--app-border)\n    ) !important;\n  background:\n    linear-gradient(\n      180deg,\n      transparent,\n      color-mix(\n        in srgb,\n        var(--app-accent) 3%,\n        transparent\n      )\n    ) !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text\n> span:first-child,\n.alumni-profile-editor\n.alumni-edit-row-picker\n> span:first-child {\n  width:\n    108px !important;\n  flex:\n    0 0 108px !important;\n  color:\n    var(--app-muted-2) !important;\n  font-size:\n    9.5px !important;\n  font-weight:\n    820 !important;\n  line-height:\n    1.2 !important;\n  letter-spacing:\n    .01em !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text\n> span:nth-child(2),\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type {\n  min-width: 0 !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text input,\n.alumni-profile-editor\n.alumni-edit-row-text textarea {\n  width: 100%;\n  min-width: 0;\n  border: 0 !important;\n  outline: 0 !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-text) !important;\n  font-size:\n    14px !important;\n  font-weight:\n    650 !important;\n  line-height:\n    1.4 !important;\n  caret-color:\n    var(--app-accent);\n}\n\n.alumni-profile-editor\n.alumni-edit-row-text\ninput::placeholder,\n.alumni-profile-editor\n.alumni-edit-row-text\ntextarea::placeholder {\n  color:\n    var(--app-muted-3) !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-textarea {\n  min-height:\n    100px !important;\n  align-items:\n    flex-start !important;\n  padding-top:\n    13px !important;\n  padding-bottom:\n    12px !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-textarea\n> span:first-child {\n  padding-top:\n    3px !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-textarea\ntextarea {\n  min-height:\n    72px !important;\n  resize: none;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type {\n  display: flex !important;\n  min-height:\n    46px;\n  flex:\n    1 1 auto;\n  align-items:\n    center;\n  justify-content:\n    flex-start !important;\n  gap:\n    9px !important;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-text) !important;\n  text-align:\n    left;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type:active {\n  transform:\n    translateX(2px);\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type\n> span:last-of-type {\n  font-size:\n    13.5px !important;\n  font-weight:\n    680 !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type\n> svg:last-child {\n  color:\n    var(--app-muted-3) !important;\n  transition:\n    transform 160ms\n      cubic-bezier(.2,.8,.2,1),\n    color 160ms ease !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:first-of-type:active\n> svg:last-child {\n  color:\n    var(--app-accent) !important;\n  transform:\n    translateX(2px);\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:last-child:not(:first-of-type) {\n  display: inline-flex;\n  width:\n    32px !important;\n  height:\n    32px !important;\n  flex:\n    0 0 32px;\n  align-items: center;\n  justify-content: center;\n  padding:\n    0 !important;\n  border:\n    0 !important;\n  border-radius:\n    999px !important;\n  background:\n    transparent !important;\n  color:\n    var(--app-muted-3) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease !important;\n}\n\n.alumni-profile-editor\n.alumni-edit-row-picker\n> button:last-child:not(:first-of-type):active {\n  transform:\n    scale(.9);\n  background:\n    var(--app-soft) !important;\n}\n\n/* =========================================================\n   PICKERS\n   ========================================================= */\n\n.alumni-settings-picker-backdrop-profile {\n  z-index:\n    2147483200 !important;\n  background:\n    rgba(0,0,0,.42) !important;\n  backdrop-filter:\n    blur(8px);\n  -webkit-backdrop-filter:\n    blur(8px);\n}\n\n.alumni-settings-picker-backdrop-profile\n.alumni-settings-picker-sheet {\n  width: 100% !important;\n  max-width:\n    540px !important;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 5%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    26px 26px 0 0 !important;\n  background:\n    var(--app-bg) !important;\n  box-shadow:\n    0 -20px 70px\n    color-mix(\n      in srgb,\n      black 34%,\n      transparent\n    ) !important;\n}\n\n.alumni-settings-picker-backdrop-profile\n.alumni-settings-picker-sheet\n> div:first-child {\n  min-height:\n    48px;\n}\n\n.alumni-settings-picker-backdrop-profile\n.alumni-settings-picker-sheet\n> div:first-child\nh3 {\n  font-size:\n    16px !important;\n  font-weight:\n    930 !important;\n  letter-spacing:\n    -.025em !important;\n}\n\n.alumni-settings-picker-backdrop-profile\n.alumni-settings-picker-sheet\n> div:first-child\nbutton {\n  border:\n    1px solid\n    var(--app-border) !important;\n  background:\n    var(--app-soft) !important;\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1) !important;\n}\n\n.alumni-settings-picker-backdrop-profile\n.alumni-settings-picker-sheet\n> div:first-child\nbutton:active {\n  transform:\n    scale(.92);\n}\n\n.alumni-settings-picker-search {\n  position: relative;\n  min-height:\n    46px !important;\n  margin-top:\n    12px !important;\n  padding:\n    0 2px;\n  border:\n    0 !important;\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n  border-radius:\n    0 !important;\n  background:\n    transparent !important;\n  transition:\n    border-color 160ms ease;\n}\n\n.alumni-settings-picker-search:focus-within {\n  border-bottom-color:\n    var(--app-accent) !important;\n}\n\n.alumni-settings-picker-search\ninput {\n  font-size:\n    16px !important;\n}\n\n/* rows inside pickers */\n.alumni-settings-picker-sheet\nbutton.border-b {\n  min-height:\n    58px;\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-border) 80%,\n      transparent\n    ) !important;\n  transition:\n    background-color 160ms ease,\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-settings-picker-sheet\nbutton.border-b:active {\n  transform:\n    translateX(2px);\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 4%,\n      transparent\n    );\n}\n\n/* =========================================================\n   MOBILE 360–430\n   ========================================================= */\n\n@media (max-width: 560px) {\n  .alumni-profile-editor {\n    max-width: none;\n  }\n\n  .alumni-profile-editor-top {\n    min-height:\n      58px !important;\n  }\n\n  .alumni-profile-editor-media {\n    margin-top:\n      9px !important;\n  }\n\n  .alumni-profile-editor-banner {\n    border-radius:\n      20px !important;\n  }\n\n  .alumni-profile-editor-banner-button {\n    height:\n      154px !important;\n    min-height:\n      154px !important;\n  }\n\n  .alumni-profile-editor-photo-row {\n    margin-top:\n      -37px !important;\n    padding-inline:\n      12px !important;\n  }\n\n  .alumni-profile-editor-avatar-cluster,\n  .alumni-profile-editor-avatar {\n    width:\n      88px !important;\n    height:\n      88px !important;\n    flex-basis:\n      88px !important;\n  }\n\n  .alumni-profile-editor-fields {\n    margin-top:\n      5px !important;\n  }\n\n  .alumni-editor-grid-2 {\n    grid-template-columns:\n      1fr !important;\n    gap:\n      0 !important;\n  }\n\n  .alumni-editor-section {\n    padding-top:\n      21px !important;\n  }\n\n  .alumni-profile-editor\n  .alumni-edit-row-text,\n  .alumni-profile-editor\n  .alumni-edit-row-picker {\n    min-height:\n      66px !important;\n  }\n\n  .alumni-profile-editor\n  .alumni-edit-row-text\n  > span:first-child,\n  .alumni-profile-editor\n  .alumni-edit-row-picker\n  > span:first-child {\n    width:\n      104px !important;\n    flex-basis:\n      104px !important;\n  }\n\n  .alumni-settings-picker-backdrop-profile\n  .alumni-settings-picker-sheet {\n    height:\n      min(\n        86dvh,\n        760px\n      ) !important;\n    max-height:\n      86dvh !important;\n  }\n}\n\n@media (max-width: 374px) {\n  .alumni-profile-editor-save {\n    min-width:\n      42px !important;\n    width:\n      42px !important;\n    padding:\n      0 !important;\n  }\n\n  .alumni-profile-editor-save\n  span {\n    display:\n      none !important;\n  }\n\n  .alumni-profile-editor-banner-button {\n    height:\n      146px !important;\n    min-height:\n      146px !important;\n  }\n\n  .alumni-profile-editor-banner-action {\n    width:\n      34px !important;\n    padding:\n      0 !important;\n    justify-content:\n      center;\n    font-size:\n      0 !important;\n  }\n\n  .alumni-profile-editor\n  .alumni-edit-row-text,\n  .alumni-profile-editor\n  .alumni-edit-row-picker {\n    gap:\n      9px !important;\n  }\n\n  .alumni-profile-editor\n  .alumni-edit-row-text\n  > span:first-child,\n  .alumni-profile-editor\n  .alumni-edit-row-picker\n  > span:first-child {\n    width:\n      92px !important;\n    flex-basis:\n      92px !important;\n    font-size:\n      9px !important;\n  }\n\n  .alumni-profile-editor\n  .alumni-edit-row-text\n  input,\n  .alumni-profile-editor\n  .alumni-edit-row-text\n  textarea,\n  .alumni-profile-editor\n  .alumni-edit-row-picker\n  > button:first-of-type\n  > span:last-of-type {\n    font-size:\n      13px !important;\n  }\n}\n\n/* =========================================================\n   EXPLICIT MOTION\n   ========================================================= */\n\n@keyframes alumniProfileEditorTopIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,-5px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n@keyframes alumniProfileEditorSectionIn {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0,7px,0);\n  }\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0,0,0);\n  }\n}\n\n.alumni-editor-section {\n  animation:\n    alumniProfileEditorSectionIn\n    .40s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-editor-section:nth-child(2) {\n  animation-delay: .04s;\n}\n\n.alumni-editor-section:nth-child(3) {\n  animation-delay: .08s;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-profile-editor-top,\n  .alumni-editor-section {\n    animation:\n      none !important;\n  }\n\n  .alumni-profile-editor-top\n  > button:first-child,\n  .alumni-profile-editor-save,\n  .alumni-profile-editor-banner-button,\n  .alumni-profile-editor-banner-button\n  img,\n  .alumni-profile-editor-banner-action,\n  .alumni-profile-editor-avatar,\n  .alumni-profile-editor-camera,\n  .alumni-profile-editor\n  .alumni-edit-row-text,\n  .alumni-profile-editor\n  .alumni-edit-row-picker,\n  .alumni-profile-editor\n  .alumni-edit-row-picker\n  > button:first-of-type,\n  .alumni-profile-editor\n  .alumni-edit-row-picker\n  > button:last-child,\n  .alumni-settings-picker-backdrop-profile\n  .alumni-settings-picker-sheet\n  button {\n    transition:\n      none !important;\n  }\n}\n\n/* ALUMNI_PROFILE_EDITOR_3_0_PRO_CLEAN_MOTION */\n";

/* ======================================================
   3. VALIDAR TSX ANTES DE ESCRIBIR
   ====================================================== */

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
      [PAGE, page],
      [COMPONENT, component],
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
    "✅ Parser TypeScript: editor válido"
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

/* ======================================================
   4. ESCRIBIR
   ====================================================== */

fs.writeFileSync(
  abs(PAGE),
  page,
  "utf8"
);

fs.writeFileSync(
  abs(COMPONENT),
  component,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ PROFILE EDITOR 3.0 aplicado."
);
console.log(
  "✅ Diseño limpio y profesional."
);
console.log(
  "✅ Banner/avatar refinados."
);
console.log(
  "✅ Campos sin cajas pesadas."
);
console.log(
  "✅ Secciones y pickers refinados."
);
console.log(
  "✅ Framer Motion en página y pickers."
);
console.log(
  "✅ Motion global bloqueado en esta pantalla."
);
console.log(
  "✅ Mobile 360–430px protegido."
);
console.log(
  "✅ Lógica de guardado/fotos/Supabase intacta."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
