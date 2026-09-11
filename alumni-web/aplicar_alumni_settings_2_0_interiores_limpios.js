const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_SETTINGS_2_0_INTERIORES_LIMPIOS";

const paths = {
  page:
    "src/app/settings/page.tsx",
  classicCss:
    "src/app/settings/settings-classic-1-0.css",
  cleanCss:
    "src/app/settings/settings-clean-2-0.css",
  trust:
    "src/components/settings/AccountTrustPanel.tsx",
  editor:
    "src/components/settings/ProfileEditorPro.tsx",
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
      `No encontré ${label}. No escribí ningún archivo.`
    );
  }

  return source.replace(before, after);
}

function backup(rel) {
  const source = abs(rel);
  const target =
    source +
    ".before-settings-2.0.bak";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
}

let page = read(paths.page);
let trust = read(paths.trust);
let editor = read(paths.editor);
const classicCss = read(
  paths.classicCss
);

if (
  page.includes(MARKER) &&
  trust.includes(MARKER) &&
  editor.includes(MARKER) &&
  fs.existsSync(abs(paths.cleanCss))
) {
  console.log(
    "✅ ALUMNI Settings 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   1. SETTINGS PAGE — CSS FINAL + APARIENCIA LIMPIA
   ========================================================= */

if (
  !page.includes(
    'import "../interior-ui-1-0.css";'
  )
) {
  fail(
    "Settings no parece tener la base Internal UI esperada."
  );
}

if (
  !page.includes(
    'import "./settings-clean-2-0.css";'
  )
) {
  page = page.replace(
    'import "../interior-ui-1-0.css";',
    'import "../interior-ui-1-0.css";\nimport "./settings-clean-2-0.css";'
  );
}

/*
 * Loading state: no zinc fijo.
 */
page = page.replace(
  'className="py-16 text-center text-sm text-zinc-600"',
  'className="alumni-settings-loading py-16 text-center text-sm text-[var(--app-muted-2)]"'
);

/*
 * Privacy modal gets stable hooks.
 */
page = replaceRequired(
  page,
  'className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"',
  'className="alumni-settings-privacy-backdrop fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-5"',
  "backdrop del modal de privacidad"
);

page = replaceRequired(
  page,
  'className="w-full max-w-[460px] rounded-t-[28px] border border-white/[0.08] bg-[var(--app-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_30px_100px_rgba(0,0,0,.5)] sm:rounded-[28px] sm:p-6"',
  'className="alumni-settings-privacy-modal w-full max-w-[460px] p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:p-6"',
  "sheet del modal de privacidad"
);

/*
 * AppearancePanel is small and visually important.
 * Replace the legacy dark-style radio implementation
 * with the same clean-list language as More/Settings.
 */
const appearanceStart =
  page.indexOf(
    "function AppearancePanel({"
  );
const appearanceEnd =
  page.indexOf(
    "\nfunction ProfilePanel({",
    appearanceStart
  );

if (
  appearanceStart < 0 ||
  appearanceEnd < 0
) {
  fail(
    "No encontré AppearancePanel completo."
  );
}

const appearanceV2 = `function AppearancePanel({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: any) => void;
}) {
  return (
    <div className="alumni-settings-appearance-v2">
      <div className="alumni-settings-section-intro">
        <strong>Apariencia</strong>
        <p>
          Elige cómo quieres ver Alumni.
        </p>
      </div>

      <div
        className="alumni-settings-choice-list"
        role="radiogroup"
        aria-label="Tema de la aplicación"
      >
        {ALUMNI_THEMES.map((item) => {
          const selected =
            theme === item.id;

          const description =
            item.id === "light"
              ? "Fondo claro y contraste suave"
              : "Fondo oscuro y menor brillo";

          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={
                selected
                  ? "true"
                  : "false"
              }
              onClick={() =>
                setTheme(item.id)
              }
              className="alumni-settings-theme-row"
            >
              <span className="alumni-settings-theme-preview">
                {item.swatches
                  .slice(0, 2)
                  .map(
                    (
                      color,
                      index
                    ) => (
                      <i
                        key={\`\${item.id}-\${index}\`}
                        style={{
                          background:
                            color,
                        }}
                      />
                    )
                  )}
              </span>

              <span className="alumni-settings-theme-copy">
                <strong>
                  {item.name}
                </strong>
                <small>
                  {description}
                </small>
              </span>

              <span
                className="alumni-settings-theme-check"
                data-selected={
                  selected
                    ? "true"
                    : "false"
                }
                aria-hidden="true"
              >
                {selected && (
                  <Check
                    size={13}
                    strokeWidth={3}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
`;

page =
  page.slice(
    0,
    appearanceStart
  ) +
  appearanceV2 +
  page.slice(
    appearanceEnd
  );

/*
 * Convert remaining legacy colors inside settings file
 * to app tokens. These mostly belong to deep/legacy
 * sections that can still be reached by URL.
 */
const pageReplacements = [
  [
    "text-zinc-200",
    "text-[var(--app-text)]",
  ],
  [
    "text-zinc-300",
    "text-[var(--app-text-soft)]",
  ],
  [
    "text-zinc-400",
    "text-[var(--app-muted)]",
  ],
  [
    "text-zinc-500",
    "text-[var(--app-muted)]",
  ],
  [
    "text-zinc-600",
    "text-[var(--app-muted-2)]",
  ],
  [
    "text-zinc-700",
    "text-[var(--app-muted-3)]",
  ],
  [
    "divide-white/[0.06]",
    "divide-[var(--app-border)]",
  ],
  [
    "border-white/[0.06]",
    "border-[var(--app-border)]",
  ],
  [
    "border-white/[0.08]",
    "border-[var(--app-border)]",
  ],
  [
    "border-white/[0.12]",
    "border-[var(--app-border)]",
  ],
  [
    "text-[#8d98ff]",
    "text-[var(--app-accent)]",
  ],
  [
    "text-[#a8b0ff]",
    "text-[var(--app-accent)]",
  ],
];

for (
  const [before, after]
  of pageReplacements
) {
  page = page.replaceAll(
    before,
    after
  );
}

/* =========================================================
   2. ACCOUNT / SECURITY — STABLE SCOPES + DUAL THEME
   ========================================================= */

/*
 * Replace internal Panel chrome.
 */
trust = replaceRequired(
  trust,
  '<div className="rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:p-6">',
  '<section className="alumni-account-trust-section">',
  "Panel de Seguridad"
);

trust = trust.replace(
  "      {children}\n    </div>\n  );\n}",
  "      {children}\n    </section>\n  );\n}"
);

/*
 * Root class.
 */
trust = replaceRequired(
  trust,
  '<div className="space-y-5">',
  '<div className="alumni-account-trust">',
  "raíz de Seguridad"
);

/*
 * Account flow modal hooks.
 */
trust = replaceRequired(
  trust,
  'className="fixed inset-0 z-[2147483000] flex items-end justify-center bg-black/60 sm:items-center sm:p-5"',
  'className="alumni-account-flow-backdrop fixed inset-0 z-[2147483000] flex items-end justify-center sm:items-center sm:p-5"',
  "backdrop de Seguridad"
);

trust = replaceRequired(
  trust,
  'className="w-full max-w-[470px] overflow-hidden rounded-t-[24px] border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_28px_100px_rgba(0,0,0,.5)] sm:rounded-[24px]"',
  'className="alumni-account-flow-sheet w-full max-w-[470px] overflow-hidden"',
  "sheet de Seguridad"
);

/*
 * Remove dark-only utility colors from this component.
 */
const trustReplacements = [
  [
    "text-zinc-200",
    "text-[var(--app-text)]",
  ],
  [
    "text-zinc-300",
    "text-[var(--app-text-soft)]",
  ],
  [
    "text-zinc-400",
    "text-[var(--app-muted)]",
  ],
  [
    "text-zinc-500",
    "text-[var(--app-muted)]",
  ],
  [
    "text-zinc-600",
    "text-[var(--app-muted-2)]",
  ],
  [
    "text-zinc-700",
    "text-[var(--app-muted-3)]",
  ],
  [
    "text-[#8d98ff]",
    "text-[var(--app-accent)]",
  ],
  [
    "divide-white/[0.06]",
    "divide-[var(--app-border)]",
  ],
  [
    "border-white/[0.06]",
    "border-[var(--app-border)]",
  ],
  [
    "hover:text-zinc-300",
    "hover:text-[var(--app-text-soft)]",
  ],
  [
    "hover:text-white",
    "hover:text-[var(--app-text)]",
  ],
];

for (
  const [before, after]
  of trustReplacements
) {
  trust = trust.replaceAll(
    before,
    after
  );
}

/* =========================================================
   3. PROFILE EDITOR PICKERS — STABLE HOOKS
   ========================================================= */

editor = replaceRequired(
  editor,
  '<div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/65 sm:items-center sm:p-5">',
  '<div className="alumni-settings-picker-backdrop fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-5">',
  "backdrop del selector de Editar perfil"
);

editor = replaceRequired(
  editor,
  '<div className="flex h-[78dvh] w-full max-w-[520px] flex-col rounded-t-[28px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_28px_90px_rgba(0,0,0,.48)] sm:h-[70dvh] sm:rounded-[28px] sm:p-5">',
  '<div className="alumni-settings-picker-sheet flex h-[78dvh] w-full max-w-[520px] flex-col p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:h-[70dvh] sm:p-5">',
  "sheet del selector de Editar perfil"
);

editor = replaceRequired(
  editor,
  '<div className="mt-4 flex h-11 items-center gap-2 border-b border-[var(--app-border)]">',
  '<div className="alumni-settings-picker-search mt-4 flex h-11 items-center gap-2">',
  "buscador del selector de Editar perfil"
);

/* =========================================================
   4. FINAL CSS — LOADED LAST
   ========================================================= */

const cleanCss = `/*
 * ${MARKER}
 *
 * ALUMNI Settings 2.0
 * Interiores limpios y coherentes con Feed, Buscar, Mensajes y Más.
 * Mobile-first 360–430px.
 */

/* ======================================================
   PAGE / HOME
   ====================================================== */

.alumni-settings-classic {
  background:
    transparent !important;
}

html[data-theme="light"]
  .alumni-settings-classic,
html[data-theme="dark"]
  .alumni-settings-classic {
  background:
    transparent !important;
}

.alumni-settings-loading {
  color:
    var(--app-muted-2) !important;
}

.alumni-settings-classic-header,
.alumni-settings-detail-header {
  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    ) !important;
  border-color:
    var(--app-border) !important;
  box-shadow: none !important;
}

.alumni-settings-classic-row,
.alumni-settings-profile-row,
.alumni-settings-logout {
  transition:
    background-color .12s ease;
}

.alumni-settings-classic-row:active,
.alumni-settings-profile-row:active,
.alumni-settings-logout:active {
  background:
    var(--app-soft) !important;
}

.alumni-settings-row-icon {
  background:
    transparent !important;
  color:
    var(--app-text-soft) !important;
}

/* ======================================================
   DETAIL LANGUAGE
   Flat, not cards inside cards.
   ====================================================== */

.alumni-settings-detail-content {
  padding-top:
    0 !important;
}

.alumni-settings-classic
  .alumni-settings-panel,
.alumni-settings-classic
  .alumni-profile-settings-hub {
  overflow:
    visible !important;

  border:
    0 !important;
  border-radius:
    0 !important;

  background:
    transparent !important;

  box-shadow:
    none !important;
}

.alumni-settings-classic
  .alumni-settings-panel {
  padding:
    0 !important;
}

.alumni-settings-classic
  .alumni-setting-row {
  min-height:
    68px;
  padding:
    13px 2px !important;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-settings-classic
  .alumni-setting-row:first-child {
  border-top:
    0;
}

/* ======================================================
   APPEARANCE 2.0
   ====================================================== */

.alumni-settings-appearance-v2 {
  padding:
    18px 0 6px;
}

.alumni-settings-section-intro {
  padding:
    0 2px 16px;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-settings-section-intro
  > strong {
  display:
    block;
  color:
    var(--app-text);
  font-size:
    14px;
  font-weight:
    900;
  line-height:
    1.2;
}

.alumni-settings-section-intro
  > p {
  margin-top:
    5px;
  color:
    var(--app-muted-2);
  font-size:
    10.5px;
  line-height:
    1.45;
}

.alumni-settings-choice-list {
  display:
    block;
}

.alumni-settings-theme-row {
  display:
    grid;
  width:
    100%;

  grid-template-columns:
    50px minmax(0, 1fr) 26px;

  min-height:
    72px;
  align-items:
    center;
  gap:
    12px;

  padding:
    10px 2px;

  border:
    0;
  border-bottom:
    1px solid
    var(--app-border);

  background:
    transparent;

  color:
    inherit;
  text-align:
    left;
}

.alumni-settings-theme-row:active {
  background:
    var(--app-soft);
}

.alumni-settings-theme-preview {
  position:
    relative;
  display:
    flex;
  width:
    46px;
  height:
    36px;
  align-items:
    center;
  justify-content:
    center;
}

.alumni-settings-theme-preview
  i {
  display:
    block;
  width:
    30px;
  height:
    30px;
  border:
    1px solid
    var(--app-border);
  border-radius:
    999px;
  box-shadow:
    0 0 0 2px
    var(--app-bg);
}

.alumni-settings-theme-preview
  i + i {
  margin-left:
    -13px;
}

.alumni-settings-theme-copy {
  min-width:
    0;
}

.alumni-settings-theme-copy
  strong {
  display:
    block;
  color:
    var(--app-text);
  font-size:
    13px;
  font-weight:
    850;
}

.alumni-settings-theme-copy
  small {
  display:
    block;
  margin-top:
    4px;
  color:
    var(--app-muted-2);
  font-size:
    10px;
  line-height:
    1.3;
}

.alumni-settings-theme-check {
  display:
    flex;
  width:
    22px;
  height:
    22px;
  align-items:
    center;
  justify-content:
    center;

  border:
    1.5px solid
    var(--app-border);
  border-radius:
    999px;

  color:
    transparent;
}

.alumni-settings-theme-check[
  data-selected="true"
] {
  border-color:
    var(--app-accent);
  background:
    var(--app-accent-fill);
  color:
    var(--app-on-accent);
}

/* ======================================================
   PRIVACY
   ====================================================== */

.alumni-profile-settings-hub
  .alumni-privacy-switch {
  width:
    46px !important;
  height:
    26px !important;
  flex:
    0 0 46px;

  border:
    0 !important;
  border-radius:
    999px;

  background:
    var(--app-soft-strong) !important;

  transition:
    background-color .15s ease;
}

.alumni-profile-settings-hub
  .alumni-privacy-switch
  > span {
  top:
    3px !important;
  left:
    3px !important;

  width:
    20px !important;
  height:
    20px !important;

  background:
    var(--app-surface) !important;

  box-shadow:
    0 1px 4px
    var(--app-shadow);
}

.alumni-profile-settings-hub
  .alumni-privacy-switch.is-on {
  background:
    var(--app-accent-fill) !important;
}

.alumni-profile-settings-hub
  .alumni-privacy-switch.is-on
  > span {
  transform:
    translateX(
      20px
    ) !important;
}

.alumni-settings-privacy-backdrop,
.alumni-account-flow-backdrop,
.alumni-settings-picker-backdrop {
  background:
    rgba(
      0,
      0,
      0,
      .48
    ) !important;

  backdrop-filter:
    blur(8px);
  -webkit-backdrop-filter:
    blur(8px);
}

.alumni-settings-privacy-modal,
.alumni-account-flow-sheet,
.alumni-settings-picker-sheet {
  border:
    1px solid
    var(--app-border);

  background:
    var(--app-surface);

  color:
    var(--app-text);

  box-shadow:
    0 -18px 70px
    color-mix(
      in srgb,
      var(--app-shadow) 88%,
      transparent
    );
}

.alumni-settings-privacy-modal {
  border-radius:
    22px 22px 0 0;
}

.alumni-settings-privacy-modal
  > div:nth-last-child(1)
  button {
  min-height:
    46px;
  border-radius:
    12px;
}

/* ======================================================
   SECURITY / ACCOUNT TRUST
   ====================================================== */

.alumni-account-trust {
  display:
    block;
  padding:
    2px 0 18px;
}

.alumni-account-trust-section {
  padding:
    18px 2px;

  border:
    0;
  border-bottom:
    1px solid
    var(--app-border);

  background:
    transparent;

  color:
    var(--app-text);
}

.alumni-account-trust-section:last-of-type {
  border-bottom:
    0;
}

.alumni-account-trust-section
  > p:first-child {
  color:
    var(--app-text) !important;
  font-size:
    13px !important;
  font-weight:
    900 !important;
}

.alumni-account-trust-section
  button {
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-account-trust-section
  button:active {
  opacity:
    .72;
}

.alumni-account-trust
  [class~="text-zinc-200"] {
  color:
    var(--app-text) !important;
}

.alumni-account-trust
  [class~="text-zinc-300"] {
  color:
    var(--app-text-soft) !important;
}

.alumni-account-trust
  [class~="text-zinc-400"],
.alumni-account-trust
  [class~="text-zinc-500"] {
  color:
    var(--app-muted) !important;
}

.alumni-account-trust
  [class~="text-zinc-600"] {
  color:
    var(--app-muted-2) !important;
}

.alumni-account-trust
  [class~="text-zinc-700"] {
  color:
    var(--app-muted-3) !important;
}

.alumni-account-trust
  [class~="text-[#8d98ff]"] {
  color:
    var(--app-accent) !important;
}

.alumni-account-flow-sheet {
  max-height:
    min(
      88dvh,
      720px
    );

  border-radius:
    22px 22px 0 0;
}

.alumni-account-flow-sheet
  > header {
  background:
    color-mix(
      in srgb,
      var(--app-surface) 97%,
      transparent
    );
}

.alumni-account-flow-sheet
  input {
  border-color:
    var(--app-border) !important;

  background:
    var(--app-surface-2) !important;

  color:
    var(--app-text) !important;

  box-shadow:
    none !important;
}

.alumni-account-flow-sheet
  input:focus {
  border-color:
    var(--app-accent) !important;

  box-shadow:
    0 0 0 3px
    var(--app-accent-soft) !important;
}

/* ======================================================
   PROFILE EDITOR INSIDE SETTINGS
   ====================================================== */

.alumni-profile-editor {
  padding-bottom:
    24px;

  color:
    var(--app-text);
}

.alumni-profile-editor-top {
  min-height:
    56px !important;

  margin:
    0 !important;
  padding:
    7px 0 !important;

  border-bottom:
    1px solid
    var(--app-border) !important;

  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    ) !important;

  backdrop-filter:
    blur(18px);
}

.alumni-profile-editor-save {
  min-height:
    38px !important;

  padding:
    0 12px !important;

  border:
    0 !important;
  border-radius:
    11px !important;

  background:
    var(--app-accent-fill) !important;

  color:
    var(--app-on-accent) !important;

  font-size:
    10.5px !important;
  font-weight:
    900 !important;
}

.alumni-profile-editor-save:disabled {
  opacity:
    .45;
}

.alumni-profile-editor-media {
  margin-top:
    16px !important;
}

.alumni-profile-editor-banner {
  overflow:
    hidden;

  border:
    1px solid
    var(--app-border);

  border-radius:
    18px !important;

  background:
    var(--app-surface-2);

  box-shadow:
    none !important;
}

.alumni-profile-editor-photo-row {
  padding:
    13px 2px 0 !important;
}

.alumni-profile-editor-avatar {
  width:
    76px !important;
  height:
    76px !important;
  flex-basis:
    76px !important;

  border:
    3px solid
    var(--app-bg) !important;

  background:
    var(--app-surface-2);

  box-shadow:
    0 0 0 1px
    var(--app-border) !important;
}

.alumni-profile-editor-camera {
  border:
    2px solid
    var(--app-bg) !important;

  background:
    var(--app-surface) !important;

  color:
    var(--app-text) !important;

  box-shadow:
    0 2px 8px
    var(--app-shadow) !important;
}

.alumni-profile-editor-fields {
  margin-top:
    20px !important;
}

.alumni-editor-section {
  padding:
    18px 0 20px !important;

  border-bottom:
    1px solid
    var(--app-border) !important;
}

.alumni-editor-section:last-child {
  border-bottom:
    0 !important;
}

.alumni-editor-section-head {
  padding:
    0 2px 8px;
}

.alumni-editor-section-head
  h3 {
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

.alumni-profile-editor
  .alumni-edit-row {
  min-height:
    58px !important;

  padding:
    11px 2px !important;

  border-bottom:
    1px solid
    var(--app-border) !important;

  background:
    transparent !important;
}

.alumni-profile-editor
  .alumni-edit-row
  input,
.alumni-profile-editor
  .alumni-edit-row
  textarea {
  color:
    var(--app-text) !important;

  caret-color:
    var(--app-accent);
}

.alumni-profile-editor
  .alumni-edit-row
  input::placeholder,
.alumni-profile-editor
  .alumni-edit-row
  textarea::placeholder {
  color:
    var(--app-muted-3) !important;
}

/* Pickers */
.alumni-settings-picker-sheet {
  border-radius:
    22px 22px 0 0;
}

.alumni-settings-picker-search {
  min-height:
    44px;

  padding:
    0 12px;

  border:
    1px solid
    var(--app-border);

  border-radius:
    12px;

  background:
    var(--app-surface-2);
}

.alumni-settings-picker-search
  input {
  color:
    var(--app-text) !important;
}

.alumni-settings-picker-search
  input::placeholder {
  color:
    var(--app-muted-3) !important;
}

/* ======================================================
   SAVED POSTS
   ====================================================== */

.alumni-saved-posts-panel {
  padding:
    0 0 20px;
}

.alumni-saved-posts-panel
  > div:first-child {
  min-height:
    54px;

  margin-bottom:
    0 !important;

  padding-bottom:
    0 !important;

  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-saved-posts-panel
  article {
  padding:
    18px 2px !important;
}

.alumni-saved-posts-panel
  article:first-child {
  padding-top:
    14px !important;
}

.alumni-saved-posts-panel
  article
  > a,
.alumni-saved-posts-panel
  article
  video,
.alumni-saved-posts-panel
  article
  img {
  max-width:
    100%;
}

/* ======================================================
   LEGACY / DEEP SETTINGS: THEME SAFETY
   including Links, Academic and Spotify if reached by URL
   ====================================================== */

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-200"] {
  color:
    var(--app-text) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-300"] {
  color:
    var(--app-text-soft) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-400"],
.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-500"] {
  color:
    var(--app-muted) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-600"] {
  color:
    var(--app-muted-2) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="text-zinc-700"] {
  color:
    var(--app-muted-3) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="border-white/[0.06]"],
.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="border-white/[0.07]"],
.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="border-white/[0.08]"] {
  border-color:
    var(--app-border) !important;
}

.alumni-settings-classic
  .alumni-settings-detail-content
  [class~="bg-[#101318]/95"] {
  background:
    var(--app-surface) !important;
}

/* ======================================================
   MOBILE CANONICAL
   ====================================================== */

@media (
  max-width:
    699px
) {
  .alumni-settings-classic {
    max-width:
      none !important;

    padding-bottom:
      26px;
  }

  .alumni-settings-detail-header {
    position:
      sticky;
    top:
      0;

    min-height:
      52px;

    margin:
      0;

    backdrop-filter:
      blur(18px);
    -webkit-backdrop-filter:
      blur(18px);
  }

  .alumni-settings-detail-header
    h1 {
    font-size:
      14px;
  }

  .alumni-settings-detail-content {
    padding-inline:
      0;
  }

  .alumni-settings-privacy-modal,
  .alumni-account-flow-sheet,
  .alumni-settings-picker-sheet {
    width:
      100%;
    max-width:
      none;

    border-right:
      0;
    border-bottom:
      0;
    border-left:
      0;
  }

  .alumni-settings-picker-sheet {
    height:
      86dvh !important;
    max-height:
      86dvh;
  }

  .alumni-account-flow-sheet {
    max-height:
      88dvh;
    overflow-y:
      auto;
  }

  .alumni-editor-grid-2 {
    grid-template-columns:
      1fr !important;
    gap:
      0 !important;
  }

  .alumni-profile-editor
    .alumni-edit-row {
    display:
      grid !important;

    grid-template-columns:
      minmax(
        92px,
        108px
      )
      minmax(
        0,
        1fr
      );

    gap:
      9px;
  }

  .alumni-profile-editor
    .alumni-edit-row
    > span:first-child {
    width:
      auto !important;
  }

  .alumni-profile-editor-save
    span {
    display:
      none;
  }

  .alumni-profile-editor-save {
    width:
      40px;
    padding:
      0 !important;
  }
}

/* ======================================================
   DESKTOP SECONDARY
   ====================================================== */

@media (
  min-width:
    700px
) {
  .alumni-settings-classic {
    max-width:
      560px !important;
  }

  .alumni-settings-detail-content {
    padding:
      0 14px 24px;
  }

  .alumni-settings-privacy-modal,
  .alumni-account-flow-sheet,
  .alumni-settings-picker-sheet {
    border-radius:
      20px !important;
  }

  .alumni-account-trust-section {
    padding-inline:
      0;
  }
}

/* ${MARKER} */
`;

/* =========================================================
   5. PARSE BEFORE WRITE
   ========================================================= */

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [
        paths.page,
        page,
      ],
      [
        paths.trust,
        trust,
      ],
      [
        paths.editor,
        editor,
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

    if (diagnostics.length) {
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
    "✅ Parser TypeScript: Settings, Seguridad y Editor válidos"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code ===
      "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

/* Validation tokens */
for (
  const [label, source, token]
  of [
    [
      "Settings",
      page,
      'settings-clean-2-0.css',
    ],
    [
      "Appearance",
      page,
      'alumni-settings-appearance-v2',
    ],
    [
      "Security",
      trust,
      'alumni-account-trust',
    ],
    [
      "Security modal",
      trust,
      'alumni-account-flow-sheet',
    ],
    [
      "Profile picker",
      editor,
      'alumni-settings-picker-sheet',
    ],
  ]
) {
  if (!source.includes(token)) {
    fail(
      `Validación falló: ${label}.`
    );
  }
}

/* =========================================================
   6. BACKUP + WRITE
   ========================================================= */

for (const rel of [
  paths.page,
  paths.trust,
  paths.editor,
]) {
  backup(rel);
}

page +=
  `\n/* ${MARKER} */\n`;

trust +=
  `\n/* ${MARKER} */\n`;

editor +=
  `\n/* ${MARKER} */\n`;

fs.writeFileSync(
  abs(paths.page),
  page,
  "utf8"
);

fs.writeFileSync(
  abs(paths.trust),
  trust,
  "utf8"
);

fs.writeFileSync(
  abs(paths.editor),
  editor,
  "utf8"
);

fs.writeFileSync(
  abs(paths.cleanCss),
  cleanCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Settings 2.0 aplicado."
);
console.log(
  "✅ Portada Lista clásica preservada."
);
console.log(
  "✅ Apariencia reconstruida como lista limpia."
);
console.log(
  "✅ Privacidad sin card-inside-card."
);
console.log(
  "✅ Seguridad convertida a secciones planas."
);
console.log(
  "✅ Modales de Seguridad y Privacidad unificados."
);
console.log(
  "✅ Editar perfil y sus selectores refinados."
);
console.log(
  "✅ Guardados integrado al lenguaje visual."
);
console.log(
  "✅ Deep settings / Spotify protegidos para Dark y Light."
);
console.log(
  "✅ Mobile-first 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
