const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_5_MOBILE_OVERLAY_CONTROLS";

const editorCandidates = [
  "src/components/feed/ImageCropEditor.tsx",
  "files/src/components/feed/ImageCropEditor.tsx",
  "payload/src/components/feed/ImageCropEditor.tsx",
];

const cssFile =
  "src/app/feed/feed-photo-confirm-1-0.css";

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
    return null;
  }
  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, suffix) {
  const file = abs(rel);
  const bak =
    file + suffix;
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
  }
}

function patchEditor(rel) {
  const source0 = read(rel);

  if (source0 == null) {
    console.log(`ℹ️ No existe: ${rel}`);
    return false;
  }

  let source = source0;

  if (source.includes(MARKER)) {
    console.log(`ℹ️ Ya parcheado: ${rel}`);
    return false;
  }

  if (
    !source.includes(
      'className="alumni-photo-confirm-dialog"'
    ) ||
    !source.includes(
      'className="alumni-photo-confirm-topbar"'
    ) ||
    !source.includes(
      'className="alumni-photo-confirm-body"'
    ) ||
    !source.includes(
      'className="alumni-photo-confirm-stage"'
    )
  ) {
    console.log(
      `ℹ️ Se omite ${rel}: estructura distinta del editor.`
    );
    return false;
  }

  const oldLayout = `      <div className="alumni-photo-confirm-dialog">
        <header className="alumni-photo-confirm-topbar">
          <button
            type="button"
            className="alumni-photo-confirm-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Salir"
          >
            <X
              size={21}
              strokeWidth={2}
            />
          </button>

          <div className="alumni-photo-confirm-actions">
            <button
              type="button"
              className="alumni-photo-confirm-add"
              onClick={
                onAddMore
              }
              disabled={saving}
              aria-label="Agregar otra foto o video"
            >
              <Plus
                size={21}
                strokeWidth={2}
              />
            </button>

            <button
              type="button"
              className="alumni-photo-confirm-accept"
              onClick={() =>
                void confirmPhoto()
              }
              disabled={
                saving ||
                !natural.width
              }
            >
              <Check
                size={16}
                strokeWidth={2.8}
              />
              <span>
                {saving
                  ? "Confirmando"
                  : "Confirmar"}
              </span>
            </button>
          </div>
        </header>

        <div className="alumni-photo-confirm-body">
          <div
            ref={stageRef}
            className="alumni-photo-confirm-stage"
            onPointerDown={
              pointerDown
            }
            onPointerMove={
              pointerMove
            }
            onPointerUp={
              pointerEnd
            }
            onPointerCancel={
              pointerEnd
            }
          >
            <img`;

  const newLayout = `      <div className="alumni-photo-confirm-dialog">
        <div className="alumni-photo-confirm-body">
          <div className="alumni-photo-confirm-stage-shell">
            <div className="alumni-photo-confirm-overlay-controls">
              <button
                type="button"
                className="alumni-photo-confirm-close"
                onClick={onClose}
                disabled={saving}
                aria-label="Salir"
              >
                <X
                  size={21}
                  strokeWidth={2}
                />
              </button>

              <div className="alumni-photo-confirm-actions">
                <button
                  type="button"
                  className="alumni-photo-confirm-add"
                  onClick={
                    onAddMore
                  }
                  disabled={saving}
                  aria-label="Agregar otra foto o video"
                >
                  <Plus
                    size={21}
                    strokeWidth={2}
                  />
                </button>

                <button
                  type="button"
                  className="alumni-photo-confirm-accept"
                  onClick={() =>
                    void confirmPhoto()
                  }
                  disabled={
                    saving ||
                    !natural.width
                  }
                  aria-label="Confirmar foto"
                >
                  <Check
                    size={18}
                    strokeWidth={2.8}
                  />
                  <span>
                    {saving
                      ? "Confirmando"
                      : "Confirmar"}
                  </span>
                </button>
              </div>
            </div>

            <div
              ref={stageRef}
              className="alumni-photo-confirm-stage"
              onPointerDown={
                pointerDown
              }
              onPointerMove={
                pointerMove
              }
              onPointerUp={
                pointerEnd
              }
              onPointerCancel={
                pointerEnd
              }
            >
              <img`;

  if (!source.includes(oldLayout)) {
    console.log(
      `ℹ️ Se omite ${rel}: no encontré el layout exacto esperado.`
    );
    return false;
  }

  source = source.replace(
    oldLayout,
    newLayout
  );

  const stageClose = `            <div
              className="alumni-photo-confirm-grid"
              aria-hidden="true"
            />
          </div>

          {error && (`

  const stageCloseNew = `            <div
              className="alumni-photo-confirm-grid"
              aria-hidden="true"
            />
            </div>
          </div>

          {error && (`

  if (!source.includes(stageClose)) {
    console.log(
      `ℹ️ Se omite ${rel}: no encontré el cierre esperado del stage.`
    );
    return false;
  }

  source = source.replace(
    stageClose,
    stageCloseNew
  );

  source += `\n/* ${MARKER} */\n`;

  try {
    const ts =
      require("typescript");
    const parsed =
      ts.createSourceFile(
        rel,
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
          ? parsed.getLineAndCharacterOfPosition(
              first.start
            )
          : null;
      fail(
        `${rel}: sintaxis inválida` +
          (pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : "") +
          `: ${message}`
      );
    }
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

  backup(
    rel,
    ".before-feed-photo-select-1.0.5.bak"
  );
  fs.writeFileSync(
    abs(rel),
    source,
    "utf8"
  );
  console.log(`✅ Editor corregido: ${rel}`);
  return true;
}

function patchCss() {
  let css = read(cssFile);
  if (css == null) {
    fail(
      "No encontré src/app/feed/feed-photo-confirm-1-0.css."
    );
  }

  if (css.includes(MARKER)) {
    console.log("ℹ️ CSS ya parcheado.");
    return false;
  }

  if (
    !css.includes(
      ".alumni-photo-confirm-stage"
    ) ||
    !css.includes(
      ".alumni-photo-confirm-body"
    )
  ) {
    fail(
      "No encontré la base CSS del selector de foto."
    );
  }

  css += `

/* =========================================================
   ${MARKER}
   Responsive real para teléfono + controles visibles sobre la foto.
   No toca la cuadrícula ni el comportamiento del stage.
   ========================================================= */

.alumni-photo-confirm-dialog {
  position: relative !important;
  overflow: hidden !important;
}

.alumni-photo-confirm-body {
  position: relative !important;
  display: flex !important;
  min-height: 0 !important;
  flex: 1 1 auto !important;
  align-items: center !important;
  justify-content: center !important;
  overflow: hidden !important;
}

.alumni-photo-confirm-stage-shell {
  position: relative !important;
  width: min(100vw, 620px) !important;
  flex: 0 0 auto !important;
}

.alumni-photo-confirm-overlay-controls {
  position: absolute !important;
  top: max(12px, env(safe-area-inset-top)) !important;
  left: 12px !important;
  right: 12px !important;
  z-index: 40 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 10px !important;
  pointer-events: none !important;
}

.alumni-photo-confirm-overlay-controls > * {
  pointer-events: auto !important;
}

.alumni-photo-confirm-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.alumni-photo-confirm-stage {
  width: 100% !important;
  max-width: 100% !important;
}

.alumni-photo-confirm-close,
.alumni-photo-confirm-add,
.alumni-photo-confirm-accept {
  position: relative !important;
  inset: auto !important;
  display: inline-flex !important;
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  min-height: 44px !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  border-radius: 999px !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.26) !important;
  -webkit-tap-highlight-color: transparent !important;
}

.alumni-photo-confirm-close,
.alumni-photo-confirm-add {
  border: 1px solid rgba(255,255,255,.18) !important;
  background: rgba(5,7,11,.74) !important;
  color: #fff !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
}

.alumni-photo-confirm-accept {
  border: 0 !important;
  background: var(--app-accent-fill) !important;
  color: var(--app-on-accent) !important;
}

.alumni-photo-confirm-close svg,
.alumni-photo-confirm-add svg,
.alumni-photo-confirm-accept svg {
  display: block !important;
  width: 21px !important;
  height: 21px !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.alumni-photo-confirm-accept > span {
  display: none !important;
}

.alumni-photo-confirm-error {
  width: min(100%, 620px) !important;
  padding: 0 12px !important;
}

@media (max-width: 699px) {
  .alumni-photo-confirm-dialog {
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
  }

  .alumni-photo-confirm-body {
    padding: 0 !important;
  }

  .alumni-photo-confirm-stage-shell {
    width: 100vw !important;
    max-width: 100vw !important;
  }

  .alumni-photo-confirm-stage {
    width: 100vw !important;
    max-width: 100vw !important;
    aspect-ratio: 4 / 5 !important;
  }
}

@media (max-width: 374px) {
  .alumni-photo-confirm-overlay-controls {
    top: max(10px, env(safe-area-inset-top)) !important;
    left: 10px !important;
    right: 10px !important;
  }

  .alumni-photo-confirm-close,
  .alumni-photo-confirm-add,
  .alumni-photo-confirm-accept {
    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;
  }
}

@media (min-width: 700px) {
  .alumni-photo-confirm-stage-shell {
    width: min(70vh, 560px) !important;
  }
}

/* ${MARKER} */
`;

  backup(
    cssFile,
    ".before-feed-photo-select-1.0.5.bak"
  );
  fs.writeFileSync(
    abs(cssFile),
    css,
    "utf8"
  );
  console.log("✅ CSS responsive reforzado.");
  return true;
}

let changed = 0;

for (const rel of editorCandidates) {
  if (patchEditor(rel)) {
    changed += 1;
  }
}

patchCss();

console.log("");
console.log("✅ ALUMNI Feed Photo Select 1.0.5 aplicado.");
console.log("✅ Controles X / + / OK montados como overlay real sobre la foto.");
console.log("✅ Responsive móvil corregido.");
console.log("✅ Foto y cuadrícula se mantienen intactas.");
console.log("");
console.log("Ahora ejecutá: npm run build");
