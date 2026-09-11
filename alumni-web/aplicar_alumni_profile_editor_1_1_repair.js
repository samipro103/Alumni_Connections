const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_PROFILE_EDITOR_1_1_REPAIR";

const paths = {
  editor:
    "src/components/settings/ProfileEditorPro.tsx",
  settings:
    "src/app/settings/page.tsx",
  css:
    "src/app/settings/settings-edit-profile-repair-1-1.css",
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

function backup(rel) {
  const file = abs(rel);
  const bak =
    file +
    ".before-profile-editor-1.1.bak";

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
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

let editor = read(paths.editor);
let settings = read(paths.settings);

if (
  editor.includes(MARKER) &&
  settings.includes(MARKER) &&
  fs.existsSync(abs(paths.css))
) {
  console.log(
    "✅ Profile Editor 1.1 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !settings.includes(
    'import "./settings-edit-profile-option-1.css";'
  )
) {
  fail(
    "No encontré la Opción 1 de Editar Perfil. Aplicá primero el parche anterior."
  );
}

/* =========================================================
   1. BANNER: stable hooks, don't style whole button as action pill
   ========================================================= */

editor = replaceRequired(
  editor,
  'className="group relative block h-44 w-full overflow-hidden bg-[var(--app-soft-strong)] sm:h-52"',
  'className="alumni-profile-editor-banner-button group relative block h-44 w-full overflow-hidden bg-[var(--app-soft-strong)] sm:h-52"',
  "clase del botón de portada"
);

editor = replaceRequired(
  editor,
  'className="absolute bottom-3 right-3 flex h-9 items-center gap-2 rounded-full bg-black/60 px-3 text-[10px] font-black text-white backdrop-blur-xl"',
  'className="alumni-profile-editor-banner-action absolute bottom-3 right-3 flex h-9 items-center gap-2 rounded-full bg-black/60 px-3 text-[10px] font-black text-white backdrop-blur-xl"',
  "acción Cambiar portada"
);

/* =========================================================
   2. SAVE: mobile-safe label and visible loading state
   ========================================================= */

editor = replaceRequired(
  editor,
  ': "Guardar cambios"}',
  ': "Guardar"}',
  "texto visible Guardar"
);

/* =========================================================
   3. Row type hooks
   ========================================================= */

editor = editor.replaceAll(
  '<label className="alumni-edit-row">',
  '<label className="alumni-edit-row alumni-edit-row-text">'
);

editor = editor.replaceAll(
  '<label className="alumni-edit-row items-start">',
  '<label className="alumni-edit-row alumni-edit-row-text alumni-edit-row-textarea items-start">'
);

editor = replaceRequired(
  editor,
  '<div className="alumni-edit-row">',
  '<div className="alumni-edit-row alumni-edit-row-picker">',
  "clase de PickerRow"
);

/* =========================================================
   4. Picker modal must sit above floating nav
   ========================================================= */

editor = replaceRequired(
  editor,
  '<div className="alumni-settings-picker-backdrop fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-5">',
  '<div className="alumni-settings-picker-backdrop alumni-settings-picker-backdrop-profile fixed inset-0 flex items-end justify-center sm:items-center sm:p-5">',
  "backdrop de picker"
);

/* =========================================================
   5. Import final repair CSS
   ========================================================= */

if (
  !settings.includes(
    'import "./settings-edit-profile-repair-1-1.css";'
  )
) {
  settings = settings.replace(
    'import "./settings-edit-profile-option-1.css";',
    'import "./settings-edit-profile-option-1.css";\nimport "./settings-edit-profile-repair-1-1.css";'
  );
}

editor +=
  `\n/* ${MARKER} */\n`;

settings +=
  `\n/* ${MARKER} */\n`;

const css = `/*
 * ${MARKER}
 *
 * Editar Perfil 1.1 — repair.
 * Fixes real layout/responsive conflicts from Option 1.
 */

/* ======================================================
   ROOT + MOBILE NAV CLEARANCE
   ====================================================== */

.alumni-profile-editor {
  width: 100%;
  min-width: 0;
  padding-bottom:
    calc(
      112px +
      env(safe-area-inset-bottom)
    ) !important;
  overflow-x: clip;
}

/* ======================================================
   TOP BAR
   ====================================================== */

.alumni-profile-editor-top {
  display: grid !important;
  grid-template-columns:
    44px minmax(0, 1fr) auto !important;
  align-items: center !important;
  gap: 8px !important;

  min-height: 58px !important;
  padding:
    7px 2px !important;
}

.alumni-profile-editor-top-copy {
  min-width: 0;
  text-align: center;
}

.alumni-profile-editor-top-copy p {
  margin: 0;
  overflow: hidden;
  color:
    var(--app-text) !important;
  font-size: 15px !important;
  font-weight: 900 !important;
  line-height: 1.1;
  letter-spacing: -.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-editor-save {
  display: inline-flex !important;
  width: auto !important;
  min-width: 72px !important;
  min-height: 36px !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;

  padding:
    0 12px !important;

  border-radius:
    999px !important;

  white-space: nowrap;
}

.alumni-profile-editor-save span {
  display: inline !important;
  font-size: 10.5px !important;
}

.alumni-profile-editor-save svg {
  display: block !important;
  flex: 0 0 auto;
}

/* ======================================================
   BANNER
   Critical fix: the whole image remains the whole button.
   ====================================================== */

.alumni-profile-editor-media {
  margin-top:
    10px !important;
}

.alumni-profile-editor-banner {
  position: relative !important;
  width: 100%;
  min-height: 0 !important;
  overflow: hidden !important;

  border:
    1px solid
    var(--app-border) !important;
  border-radius:
    18px !important;

  background:
    var(--app-surface-2) !important;
}

.alumni-profile-editor-banner-button {
  position: relative !important;
  inset: auto !important;

  display: block !important;
  width: 100% !important;
  height: 154px !important;
  min-height: 154px !important;

  padding: 0 !important;

  border: 0 !important;
  border-radius: 0 !important;

  background:
    var(--app-surface-2) !important;
  color: inherit !important;

  overflow: hidden !important;
  box-shadow: none !important;
}

.alumni-profile-editor-banner-button > img,
.alumni-profile-editor-banner-button
  > .profile-banner-fallback {
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.alumni-profile-editor-banner-action {
  position: absolute !important;
  right: 11px !important;
  bottom: 11px !important;
  left: auto !important;
  top: auto !important;
  z-index: 5 !important;

  display: inline-flex !important;
  width: auto !important;
  height: 32px !important;
  min-height: 32px !important;
  align-items: center !important;
  gap: 6px !important;

  padding:
    0 10px !important;

  border:
    1px solid
    rgba(255,255,255,.18) !important;
  border-radius:
    999px !important;

  background:
    rgba(5,7,11,.66) !important;
  color: #fff !important;

  font-size: 9.5px !important;
  font-weight: 850 !important;

  pointer-events: none;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Neutralize the broken broad selector from Option 1. */
.alumni-profile-editor-banner
  > button.alumni-profile-editor-banner-button {
  position: relative !important;
  right: auto !important;
  bottom: auto !important;
  min-height: 154px !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background:
    var(--app-surface-2) !important;
}

/* ======================================================
   AVATAR
   ====================================================== */

.alumni-profile-editor-photo-row {
  display: flex !important;
  min-height: 64px;
  align-items: flex-end !important;

  margin-top:
    -38px !important;

  padding:
    0 10px !important;
}

.alumni-profile-editor-avatar-cluster {
  position: relative;
  flex: 0 0 auto;
}

.alumni-profile-editor-avatar {
  display: flex !important;
  width: 90px !important;
  height: 90px !important;
  flex: 0 0 90px !important;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  border:
    4px solid
    var(--app-bg) !important;
  border-radius:
    999px !important;
}

.alumni-profile-editor-avatar
  img {
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.alumni-profile-editor-camera {
  position: absolute !important;
  right: 0 !important;
  bottom: 2px !important;
  z-index: 4;

  display: inline-flex !important;
  width: 30px !important;
  height: 30px !important;
  align-items: center !important;
  justify-content: center !important;

  padding: 0 !important;
}

.alumni-profile-editor-photo-copy {
  display: none !important;
}

/* ======================================================
   SECTIONS
   ====================================================== */

.alumni-profile-editor-fields {
  margin-top:
    12px !important;
}

.alumni-editor-section {
  margin: 0 !important;
  padding:
    18px 0 0 !important;
  border: 0 !important;
  background:
    transparent !important;
}

.alumni-editor-section + .alumni-editor-section {
  margin-top:
    2px !important;
}

.alumni-editor-section-head {
  padding:
    0 3px 8px !important;
}

.alumni-editor-section-head h3 {
  margin: 0;
  color:
    var(--app-muted-2) !important;
  font-size:
    9.5px !important;
  font-weight:
    900 !important;
  letter-spacing:
    .12em;
  text-transform:
    uppercase;
}

/* Remove the fake universal chevron added by Option 1. */
.alumni-profile-editor
  .alumni-edit-row::after {
  content: none !important;
  display: none !important;
}

/* ======================================================
   TEXT ROWS — exactly 2 columns, no chevron
   ====================================================== */

.alumni-profile-editor
  .alumni-edit-row-text {
  display: grid !important;
  grid-template-columns:
    104px minmax(0, 1fr) !important;
  align-items: center !important;
  gap: 10px !important;

  min-height:
    60px !important;

  padding:
    10px 3px !important;

  border-top: 0 !important;
  border-bottom:
    1px solid
    var(--app-border) !important;
}

.alumni-editor-section
  .alumni-edit-row-text:first-of-type,
.alumni-editor-section
  .alumni-edit-row-picker:first-of-type {
  border-top:
    1px solid
    var(--app-border) !important;
}

.alumni-profile-editor
  .alumni-edit-row-text
  > span:first-child {
  width: auto !important;
  color:
    var(--app-muted-2) !important;
  font-size:
    10.5px !important;
  font-weight:
    700 !important;
  line-height:
    1.25;
}

.alumni-profile-editor
  .alumni-edit-row-text
  > span:nth-child(2) {
  min-width: 0;
}

.alumni-profile-editor
  .alumni-edit-row-text
  input,
.alumni-profile-editor
  .alumni-edit-row-text
  textarea {
  min-width: 0;
  width: 100%;
  padding: 0 !important;

  border: 0 !important;
  outline: 0 !important;

  background:
    transparent !important;
  color:
    var(--app-text) !important;

  font-size:
    14px !important;
  font-weight:
    600 !important;

  box-shadow:
    none !important;
}

.alumni-profile-editor
  .alumni-edit-row-textarea {
  align-items:
    start !important;
  min-height:
    90px !important;
}

.alumni-profile-editor
  .alumni-edit-row-textarea
  > span:first-child {
  padding-top:
    3px !important;
}

.alumni-profile-editor
  .alumni-edit-row-textarea
  textarea {
  min-height:
    68px !important;
  line-height:
    1.45 !important;
}

/* ======================================================
   PICKER ROWS — component already has its own chevron
   ====================================================== */

.alumni-profile-editor
  .alumni-edit-row-picker {
  display: grid !important;
  grid-template-columns:
    104px minmax(0, 1fr) auto !important;
  align-items: center !important;
  gap: 9px !important;

  min-height:
    64px !important;

  padding:
    10px 3px !important;

  border-bottom:
    1px solid
    var(--app-border) !important;
}

.alumni-profile-editor
  .alumni-edit-row-picker
  > span:first-child {
  width: auto !important;
  color:
    var(--app-muted-2) !important;
  font-size:
    10.5px !important;
  font-weight:
    700 !important;
  line-height:
    1.25;
}

.alumni-profile-editor
  .alumni-edit-row-picker
  > button:nth-of-type(1) {
  min-width: 0;
  width: 100%;
}

.alumni-profile-editor
  .alumni-edit-row-picker
  > button:nth-of-type(1)
  > span {
  min-width: 0;
}

.alumni-profile-editor
  .alumni-edit-row-picker
  > button:nth-of-type(1)
  svg {
  flex: 0 0 auto;
}

.alumni-profile-editor
  .alumni-edit-row-picker
  > button:last-child:not(:first-of-type) {
  width: 32px;
  height: 32px;
  padding: 0;
}

/* ======================================================
   PICKERS — must overlay floating nav
   ====================================================== */

.alumni-settings-picker-backdrop-profile {
  z-index:
    2147483300 !important;

  padding: 0 !important;

  background:
    rgba(0,0,0,.54) !important;

  backdrop-filter:
    blur(8px);
  -webkit-backdrop-filter:
    blur(8px);
}

.alumni-settings-picker-backdrop-profile
  .alumni-settings-picker-sheet {
  position: relative;
  z-index: 1;

  width: 100% !important;
  max-width:
    520px !important;

  height:
    min(
      84dvh,
      760px
    ) !important;
  max-height:
    min(
      84dvh,
      760px
    ) !important;

  padding:
    16px 14px
    max(
      16px,
      env(safe-area-inset-bottom)
    ) !important;

  border:
    1px solid
    var(--app-border) !important;
  border-bottom:
    0 !important;
  border-radius:
    22px 22px 0 0 !important;

  background:
    var(--app-surface) !important;

  overflow: hidden !important;
}

.alumni-settings-picker-backdrop-profile
  .alumni-settings-picker-sheet
  > div:first-child {
  flex: 0 0 auto;
}

.alumni-settings-picker-backdrop-profile
  .alumni-settings-picker-search {
  flex: 0 0 auto;
  min-height:
    44px !important;
}

.alumni-settings-picker-backdrop-profile
  .alumni-settings-picker-sheet
  button {
  -webkit-tap-highlight-color:
    transparent;
}

/* ======================================================
   MOBILE CANONICAL 360–430
   ====================================================== */

@media (max-width: 699px) {
  .alumni-profile-editor-top {
    grid-template-columns:
      42px minmax(0, 1fr) auto !important;
    gap: 6px !important;
  }

  .alumni-profile-editor-save {
    min-width:
      68px !important;
    padding-inline:
      10px !important;
  }

  .alumni-profile-editor-save span {
    font-size:
      10px !important;
  }

  .alumni-profile-editor-banner-button,
  .alumni-profile-editor-banner
    > button.alumni-profile-editor-banner-button {
    height:
      148px !important;
    min-height:
      148px !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-text,
  .alumni-profile-editor
    .alumni-edit-row-picker {
    grid-template-columns:
      94px minmax(0, 1fr) auto !important;
    gap:
      8px !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-text {
    grid-template-columns:
      94px minmax(0, 1fr) !important;
  }

  .alumni-settings-picker-backdrop-profile
    .alumni-settings-picker-sheet {
    max-width:
      none !important;
  }
}

@media (max-width: 374px) {
  .alumni-profile-editor-save {
    min-width:
      64px !important;
    padding-inline:
      9px !important;
  }

  .alumni-profile-editor-banner-button,
  .alumni-profile-editor-banner
    > button.alumni-profile-editor-banner-button {
    height:
      136px !important;
    min-height:
      136px !important;
  }

  .alumni-profile-editor-avatar {
    width:
      84px !important;
    height:
      84px !important;
    flex-basis:
      84px !important;
  }

  .alumni-profile-editor-photo-row {
    margin-top:
      -35px !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-text {
    grid-template-columns:
      86px minmax(0, 1fr) !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-picker {
    grid-template-columns:
      86px minmax(0, 1fr) auto !important;
  }
}

/* ======================================================
   DESKTOP SECONDARY
   ====================================================== */

@media (min-width: 700px) {
  .alumni-profile-editor {
    padding-bottom:
      36px !important;
  }

  .alumni-profile-editor-banner-button,
  .alumni-profile-editor-banner
    > button.alumni-profile-editor-banner-button {
    height:
      184px !important;
    min-height:
      184px !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-text,
  .alumni-profile-editor
    .alumni-edit-row-picker {
    grid-template-columns:
      130px minmax(0, 1fr) auto !important;
  }

  .alumni-profile-editor
    .alumni-edit-row-text {
    grid-template-columns:
      130px minmax(0, 1fr) !important;
  }

  .alumni-settings-picker-backdrop-profile
    .alumni-settings-picker-sheet {
    border-bottom:
      1px solid
      var(--app-border) !important;
    border-radius:
      20px !important;
  }
}

/* ${MARKER} */
`;

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [
        paths.editor,
        editor,
      ],
      [
        paths.settings,
        settings,
      ],
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

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start ===
        "number"
          ? parsed
              .getLineAndCharacterOfPosition(
                first.start
              )
          : null;

      fail(
        `${name}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: editor y settings válidos"
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

if (
  !editor.includes(
    "alumni-profile-editor-banner-button"
  ) ||
  !editor.includes(
    "alumni-edit-row-picker"
  ) ||
  !editor.includes(
    "alumni-settings-picker-backdrop-profile"
  )
) {
  fail(
    "Validación: faltan hooks de reparación."
  );
}

backup(paths.editor);
backup(paths.settings);

fs.writeFileSync(
  abs(paths.editor),
  editor,
  "utf8"
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
  "✅ ALUMNI Profile Editor 1.1 aplicado."
);
console.log(
  "✅ Portada reparada."
);
console.log(
  "✅ Guardar responsive."
);
console.log(
  "✅ Filas de texto sin chevrons falsos."
);
console.log(
  "✅ Selectores sin flechas duplicadas."
);
console.log(
  "✅ Biografía alineada correctamente."
);
console.log(
  "✅ Pickers por encima de la navbar flotante."
);
console.log(
  "✅ Espacio inferior para navbar flotante."
);
console.log(
  "✅ Dark / Light preservados."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
