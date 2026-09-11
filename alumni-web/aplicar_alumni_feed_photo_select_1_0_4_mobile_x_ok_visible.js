const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const CSS = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  "feed-photo-confirm-1-0.css"
);

const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_4_MOBILE_X_OK_VISIBLE";

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(CSS)) {
  fail(
    "No encontré src/app/feed/feed-photo-confirm-1-0.css. " +
    "Primero tené aplicado Feed Photo Select 1.0."
  );
}

let source = fs
  .readFileSync(CSS, "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes(MARKER)) {
  console.log("✅ 1.0.4 ya estaba aplicado.");
  process.exit(0);
}

if (
  !source.includes(".alumni-photo-confirm-topbar") ||
  !source.includes(".alumni-photo-confirm-close") ||
  !source.includes(".alumni-photo-confirm-accept")
) {
  fail(
    "No encontré la estructura esperada del editor de foto. No escribí cambios."
  );
}

source += `

/* =========================================================
   ${MARKER}
   Forzar visibilidad móvil de X y OK al publicar foto.
   No cambia cuadrícula, foto, recorte ni lógica.
   ========================================================= */

@media (max-width: 699px) {
  .alumni-photo-confirm-dialog {
    position: relative !important;
  }

  .alumni-photo-confirm-topbar {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 2147483600 !important;

    min-height: 0 !important;
    padding:
      max(12px, env(safe-area-inset-top))
      12px
      0 !important;

    border-bottom: 0 !important;
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;

    pointer-events: none !important;
  }

  .alumni-photo-confirm-topbar > * {
    pointer-events: auto !important;
  }

  .alumni-photo-confirm-close,
  .alumni-photo-confirm-add,
  .alumni-photo-confirm-accept {
    position: relative !important;
    inset: auto !important;

    display: inline-flex !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;

    width: 42px !important;
    height: 42px !important;
    min-width: 42px !important;
    min-height: 42px !important;

    padding: 0 !important;
    border-radius: 999px !important;

    box-shadow:
      0 8px 24px rgba(0,0,0,.28) !important;

    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
  }

  .alumni-photo-confirm-close,
  .alumni-photo-confirm-add {
    border:
      1px solid
      rgba(255,255,255,.18) !important;
    background:
      rgba(5,7,11,.72) !important;
    color: #fff !important;
  }

  .alumni-photo-confirm-actions {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin-left: auto !important;
  }

  .alumni-photo-confirm-accept {
    border: 0 !important;
    background:
      var(--app-accent-fill) !important;
    color:
      var(--app-on-accent) !important;
  }

  .alumni-photo-confirm-accept > span {
    display: none !important;
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
}

/* ${MARKER} */
`;

const backup =
  CSS +
  ".before-feed-photo-select-1.0.4.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(CSS, backup);
}

fs.writeFileSync(CSS, source, "utf8");

console.log("");
console.log("✅ Feed Photo Select 1.0.4 aplicado.");
console.log("✅ En móvil la X queda visible arriba a la izquierda.");
console.log("✅ En móvil el OK / confirmar queda visible arriba a la derecha.");
console.log("✅ No se modificó la cuadrícula ni la lógica.");
console.log("");
console.log("Ahora ejecutá: npm run build");
