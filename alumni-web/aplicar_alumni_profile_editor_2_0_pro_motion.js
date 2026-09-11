const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_PROFILE_EDITOR_2_0_PRO_MOTION";

const paths = {
  settings:
    "src/app/settings/page.tsx",
  css:
    "src/app/settings/settings-edit-profile-pro-2-0.css",
};

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  const file = abs(rel);

  if (!fs.existsSync(file)) {
    fail(
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const bak =
    abs(rel) +
    ".before-profile-editor-2.0.bak";

  if (!fs.existsSync(bak)) {
    fs.writeFileSync(
      bak,
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

let settings =
  read(paths.settings);

if (
  settings.includes(
    MARKER
  ) &&
  fs.existsSync(
    abs(paths.css)
  )
) {
  console.log(
    "✅ Profile Editor 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  paths.settings,
  settings
);

const anchorImport =
  settings.includes(
    'import "./settings-edit-profile-repair-1-1.css";'
  )
    ? 'import "./settings-edit-profile-repair-1-1.css";'
    : settings.includes(
        'import "./settings-edit-profile-option-1.css";'
      )
    ? 'import "./settings-edit-profile-option-1.css";'
    : null;

if (!anchorImport) {
  fail(
    "No encontré la base esperada de Editar Perfil."
  );
}

if (
  !settings.includes(
    'import "./settings-edit-profile-pro-2-0.css";'
  )
) {
  settings =
    settings.replace(
      anchorImport,
      `${anchorImport}
import "./settings-edit-profile-pro-2-0.css";`
    );
}

settings +=
  `\n/* ${MARKER} */\n`;

const css =
  "/*\n * ALUMNI_PROFILE_EDITOR_2_0_PRO_MOTION\n *\n * Editar perfil — visual polish pro, mobile-first,\n * con motion y menos texto.\n */\n\n.alumni-profile-editor {\n  --editor-radius: 24px;\n  --editor-radius-sm: 18px;\n  --editor-chip-bg:\n    color-mix(\n      in srgb,\n      var(--app-surface) 88%,\n      transparent\n    );\n  --editor-glow:\n    color-mix(\n      in srgb,\n      var(--app-accent) 16%,\n      transparent\n    );\n\n  width: 100%;\n  min-width: 0;\n  overflow-x: clip;\n  padding-bottom:\n    calc(\n      116px +\n      env(safe-area-inset-bottom)\n    );\n}\n\n/* ======================================================\n   TOP BAR — cleaner, premium, sticky glass\n   ====================================================== */\n\n.alumni-profile-editor-top {\n  position: sticky;\n  top: 0;\n  z-index: 35;\n\n  display: grid !important;\n  grid-template-columns:\n    42px minmax(0, 1fr) auto !important;\n  align-items: center;\n  gap: 10px;\n\n  min-height: 58px;\n  padding:\n    6px 2px 10px !important;\n\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 82%,\n      transparent\n    );\n\n  -webkit-backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n  backdrop-filter:\n    blur(16px)\n    saturate(1.06);\n}\n\nhtml[data-theme=\"light\"]\n.alumni-profile-editor-top {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-bg) 87%,\n      transparent\n    );\n}\n\n.alumni-profile-editor-top::after {\n  content: \"\";\n  position: absolute;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  height: 1px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-border) 76%,\n      transparent\n    );\n}\n\n.alumni-profile-editor-top > button:first-child,\n.alumni-profile-editor-top\na:first-child {\n  display: inline-flex;\n  width: 40px;\n  height: 40px;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    );\n  border-radius: 14px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 76%,\n      transparent\n    );\n  color:\n    var(--app-text);\n  box-shadow:\n    0 8px 22px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 26%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease,\n    border-color 160ms ease;\n}\n\n.alumni-profile-editor-top > button:first-child:active,\n.alumni-profile-editor-top a:first-child:active {\n  transform: scale(.94);\n}\n\n.alumni-profile-editor-top-copy {\n  min-width: 0;\n  text-align: center;\n}\n\n.alumni-profile-editor-top-copy p {\n  margin: 0;\n  overflow: hidden;\n  color:\n    var(--app-text);\n  font-size: 17px !important;\n  font-weight: 950 !important;\n  line-height: 1.08;\n  letter-spacing: -.035em;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-profile-editor-top-copy small,\n.alumni-profile-editor-top-copy span:not(:first-child) {\n  display: none !important;\n}\n\n.alumni-profile-editor-save {\n  display: inline-flex !important;\n  min-width: 80px !important;\n  min-height: 40px !important;\n  align-items: center !important;\n  justify-content: center !important;\n  gap: 6px !important;\n  padding:\n    0 14px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-accent) 14%,\n      transparent\n    ) !important;\n  border-radius:\n    999px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 13%,\n      transparent\n    ) !important;\n  color:\n    var(--app-accent) !important;\n  box-shadow:\n    0 10px 28px\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    background-color 160ms ease,\n    border-color 160ms ease,\n    box-shadow 180ms ease;\n}\n\n.alumni-profile-editor-save:hover {\n  box-shadow:\n    0 14px 34px\n    color-mix(\n      in srgb,\n      var(--app-accent) 12%,\n      transparent\n    );\n}\n\n.alumni-profile-editor-save:active {\n  transform: scale(.96);\n}\n\n.alumni-profile-editor-save span {\n  font-size: 11px !important;\n  font-weight: 900;\n  letter-spacing: -.01em;\n}\n\n/* ======================================================\n   HERO MEDIA\n   ====================================================== */\n\n.alumni-profile-editor-media {\n  position: relative;\n  margin-top: 10px !important;\n  padding-top: 2px;\n  animation:\n    alumniEditorFadeUp\n    .46s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-profile-editor-banner {\n  position: relative;\n  overflow: hidden;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    );\n  border-radius:\n    26px !important;\n  background:\n    linear-gradient(\n      180deg,\n      color-mix(\n        in srgb,\n        var(--app-surface-2) 88%,\n        transparent\n      ),\n      color-mix(\n        in srgb,\n        var(--app-surface) 92%,\n        transparent\n      )\n    );\n  box-shadow:\n    0 20px 54px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 16%,\n      transparent\n    );\n}\n\n.alumni-profile-editor-banner::after {\n  content: \"\";\n  position: absolute;\n  inset: 0;\n  pointer-events: none;\n  background:\n    linear-gradient(\n      180deg,\n      rgba(255,255,255,.08),\n      transparent 28%,\n      rgba(0,0,0,.06)\n    );\n}\n\n.alumni-profile-editor-banner-button,\n.alumni-profile-editor-banner > button.alumni-profile-editor-banner-button {\n  height: 168px !important;\n  min-height: 168px !important;\n  transition:\n    transform 240ms cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-profile-editor-banner-button:active {\n  transform: scale(.995);\n}\n\n.alumni-profile-editor-banner-action {\n  right: 12px !important;\n  bottom: 12px !important;\n  height: 34px !important;\n  min-height: 34px !important;\n  padding:\n    0 11px !important;\n  border:\n    1px solid\n    rgba(255,255,255,.18) !important;\n  border-radius:\n    999px !important;\n  background:\n    rgba(8,10,16,.54) !important;\n  color: #fff !important;\n  font-size: 9.5px !important;\n  letter-spacing: .01em;\n  backdrop-filter:\n    blur(14px);\n  -webkit-backdrop-filter:\n    blur(14px);\n}\n\n.alumni-profile-editor-photo-row {\n  position: relative;\n  display: flex !important;\n  align-items: flex-end !important;\n  justify-content: space-between;\n  gap: 12px;\n  margin-top: -42px !important;\n  padding:\n    0 12px !important;\n  animation:\n    alumniEditorFadeUp\n    .52s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .05s;\n}\n\n.alumni-profile-editor-avatar-cluster {\n  position: relative;\n  flex: 0 0 auto;\n}\n\n.alumni-profile-editor-avatar {\n  width: 94px !important;\n  height: 94px !important;\n  flex: 0 0 94px !important;\n  overflow: hidden;\n  border:\n    4px solid\n    var(--app-bg) !important;\n  border-radius:\n    999px !important;\n  box-shadow:\n    0 16px 40px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 22%,\n      transparent\n    );\n  background:\n    var(--app-surface);\n}\n\n.alumni-profile-editor-camera {\n  right: 1px !important;\n  bottom: 3px !important;\n  width: 32px !important;\n  height: 32px !important;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    );\n  border-radius:\n    999px !important;\n  background:\n    var(--editor-chip-bg) !important;\n  color:\n    var(--app-text) !important;\n  box-shadow:\n    0 8px 20px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 18%,\n      transparent\n    );\n  backdrop-filter:\n    blur(12px);\n  -webkit-backdrop-filter:\n    blur(12px);\n}\n\n.alumni-profile-editor-photo-copy {\n  display: none !important;\n}\n\n/* ======================================================\n   FIELDS\n   ====================================================== */\n\n.alumni-profile-editor-fields {\n  margin-top: 16px !important;\n  animation:\n    alumniEditorFadeUp\n    .58s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n  animation-delay:\n    .09s;\n}\n\n.alumni-editor-section {\n  margin: 0 !important;\n  padding:\n    18px 0 0 !important;\n  border: 0 !important;\n  background:\n    transparent !important;\n}\n\n.alumni-editor-section + .alumni-editor-section {\n  margin-top: 4px !important;\n}\n\n.alumni-editor-section-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding:\n    0 2px 10px !important;\n}\n\n.alumni-editor-section-head h3 {\n  margin: 0;\n  color:\n    var(--app-muted-2) !important;\n  font-size:\n    10px !important;\n  font-weight:\n    950 !important;\n  letter-spacing:\n    .18em;\n  text-transform:\n    uppercase;\n}\n\n.alumni-editor-section-head p,\n.alumni-editor-section-head small {\n  display: none !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-text,\n.alumni-profile-editor .alumni-edit-row-picker {\n  position: relative;\n  overflow: hidden;\n  border-top:\n    1px solid\n    var(--app-border) !important;\n  border-bottom:\n    0 !important;\n  transition:\n    background-color 160ms ease,\n    border-color 160ms ease,\n    transform 170ms cubic-bezier(.2,.8,.2,1);\n}\n\n.alumni-profile-editor .alumni-edit-row-text:last-child,\n.alumni-profile-editor .alumni-edit-row-picker:last-child {\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-text::before,\n.alumni-profile-editor .alumni-edit-row-picker::before {\n  content: \"\";\n  position: absolute;\n  inset: 0 auto 0 0;\n  width: 0;\n  background:\n    linear-gradient(\n      180deg,\n      color-mix(\n        in srgb,\n        var(--app-accent) 42%,\n        transparent\n      ),\n      color-mix(\n        in srgb,\n        var(--app-accent) 14%,\n        transparent\n      )\n    );\n  transition: width 160ms ease;\n}\n\n.alumni-profile-editor .alumni-edit-row-text:focus-within,\n.alumni-profile-editor .alumni-edit-row-picker:focus-within {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 3%,\n      transparent\n    ) !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-text:focus-within::before,\n.alumni-profile-editor .alumni-edit-row-picker:focus-within::before {\n  width: 3px;\n}\n\n.alumni-profile-editor .alumni-edit-row-text > span:first-child,\n.alumni-profile-editor .alumni-edit-row-picker > span:first-child {\n  color:\n    var(--app-muted-2) !important;\n  font-size:\n    10px !important;\n  font-weight:\n    800 !important;\n  letter-spacing: .01em;\n}\n\n.alumni-profile-editor .alumni-edit-row-text input,\n.alumni-profile-editor .alumni-edit-row-text textarea,\n.alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1) {\n  color:\n    var(--app-text) !important;\n  font-size:\n    15px !important;\n  font-weight:\n    720 !important;\n  line-height:\n    1.35 !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-text input::placeholder,\n.alumni-profile-editor .alumni-edit-row-text textarea::placeholder {\n  color:\n    var(--app-muted-3) !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-textarea {\n  min-height: 98px !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-textarea textarea {\n  min-height: 74px !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1) {\n  justify-content: flex-start !important;\n}\n\n.alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1) svg {\n  transition:\n    transform 150ms cubic-bezier(.2,.8,.2,1),\n    color 150ms ease;\n}\n\n.alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1):active svg {\n  transform: translateX(2px);\n}\n\n.alumni-profile-editor .alumni-edit-row-picker > button:last-child:not(:first-of-type) {\n  border-radius: 12px !important;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 84%,\n      transparent\n    );\n}\n\n/* subtle stagger */\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-text,\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-picker,\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-text,\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-picker,\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-text,\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-picker {\n  animation:\n    alumniEditorFadeUp\n    .44s\n    cubic-bezier(.2,.8,.2,1)\n    both;\n}\n\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-text:nth-child(2),\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-picker:nth-child(2) {\n  animation-delay: .04s;\n}\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-text:nth-child(3),\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-picker:nth-child(3) {\n  animation-delay: .07s;\n}\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-text:nth-child(4),\n.alumni-editor-section:nth-of-type(1) .alumni-edit-row-picker:nth-child(4) {\n  animation-delay: .10s;\n}\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-text:nth-child(2),\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-picker:nth-child(2) {\n  animation-delay: .12s;\n}\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-text:nth-child(3),\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-picker:nth-child(3) {\n  animation-delay: .15s;\n}\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-text:nth-child(4),\n.alumni-editor-section:nth-of-type(2) .alumni-edit-row-picker:nth-child(4) {\n  animation-delay: .18s;\n}\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-text:nth-child(2),\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-picker:nth-child(2) {\n  animation-delay: .20s;\n}\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-text:nth-child(3),\n.alumni-editor-section:nth-of-type(3) .alumni-edit-row-picker:nth-child(3) {\n  animation-delay: .23s;\n}\n\n/* pickers modal */\n.alumni-settings-picker-backdrop-profile {\n  background:\n    rgba(0,0,0,.46) !important;\n  backdrop-filter:\n    blur(12px);\n  -webkit-backdrop-filter:\n    blur(12px);\n}\n\n.alumni-settings-picker-backdrop-profile .alumni-settings-picker-sheet {\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-text) 6%,\n      var(--app-border)\n    ) !important;\n  border-bottom:\n    0 !important;\n  border-radius:\n    28px 28px 0 0 !important;\n  box-shadow:\n    0 30px 90px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 32%,\n      transparent\n    );\n}\n\n.alumni-settings-picker-backdrop-profile .alumni-settings-picker-search {\n  border-radius:\n    16px !important;\n}\n\n/* ======================================================\n   MOTION REDUCE\n   ====================================================== */\n\n@keyframes alumniEditorFadeUp {\n  from {\n    opacity: 0;\n    transform:\n      translate3d(0, 12px, 0)\n      scale(.992);\n  }\n\n  to {\n    opacity: 1;\n    transform:\n      translate3d(0, 0, 0)\n      scale(1);\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-profile-editor-media,\n  .alumni-profile-editor-photo-row,\n  .alumni-profile-editor-fields,\n  .alumni-editor-section .alumni-edit-row-text,\n  .alumni-editor-section .alumni-edit-row-picker {\n    animation: none !important;\n  }\n\n  .alumni-profile-editor-top > button:first-child,\n  .alumni-profile-editor-top a:first-child,\n  .alumni-profile-editor-save,\n  .alumni-profile-editor-banner-button,\n  .alumni-profile-editor .alumni-edit-row-text,\n  .alumni-profile-editor .alumni-edit-row-picker,\n  .alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1) svg {\n    transition: none !important;\n  }\n}\n\n/* ======================================================\n   360–430px\n   ====================================================== */\n\n@media (max-width: 430px) {\n  .alumni-profile-editor-top-copy p {\n    font-size: 16px !important;\n  }\n\n  .alumni-profile-editor-save {\n    min-width: 72px !important;\n    min-height: 38px !important;\n    padding-inline: 12px !important;\n  }\n\n  .alumni-profile-editor-banner-button,\n  .alumni-profile-editor-banner > button.alumni-profile-editor-banner-button {\n    height: 160px !important;\n    min-height: 160px !important;\n  }\n\n  .alumni-profile-editor-avatar {\n    width: 88px !important;\n    height: 88px !important;\n    flex-basis: 88px !important;\n  }\n}\n\n@media (max-width: 374px) {\n  .alumni-profile-editor .alumni-edit-row-text {\n    grid-template-columns:\n      90px minmax(0, 1fr) !important;\n  }\n\n  .alumni-profile-editor .alumni-edit-row-picker {\n    grid-template-columns:\n      90px minmax(0, 1fr) auto !important;\n  }\n\n  .alumni-profile-editor .alumni-edit-row-text input,\n  .alumni-profile-editor .alumni-edit-row-text textarea,\n  .alumni-profile-editor .alumni-edit-row-picker button:nth-of-type(1) {\n    font-size: 14px !important;\n  }\n}\n";

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      paths.settings,
      settings,
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
      `${paths.settings}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: settings válido"
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
    abs(paths.css)
  ),
  { recursive: true }
);

fs.writeFileSync(
  abs(paths.settings),
  settings,
  "utf8"
);

fs.writeFileSync(
  abs(paths.css),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Editar Perfil 2.0 aplicado."
);
console.log(
  "✅ Pantalla más limpia y profesional."
);
console.log(
  "✅ Menos texto auxiliar."
);
console.log(
  "✅ Motion y entrada escalonada."
);
console.log(
  "✅ Top bar glass."
);
console.log(
  "✅ Hero de portada y avatar más pro."
);
console.log(
  "✅ Campos refinados para móvil."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
