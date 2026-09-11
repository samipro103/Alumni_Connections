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
  "ALUMNI_FEED_PHOTO_SELECT_1_0_3_X_CHECK_VISIBLE";

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(CSS)) {
  fail(
    "No encontré src/app/feed/feed-photo-confirm-1-0.css. " +
    "Ejecutá este parche desde alumni-web y asegurate de tener Feed Photo Select 1.0 aplicado."
  );
}

let source = fs
  .readFileSync(CSS, "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes(MARKER)) {
  console.log(
    "✅ Feed Photo Select 1.0.3 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !source.includes(
    ".alumni-photo-confirm-close"
  ) ||
  !source.includes(
    ".alumni-photo-confirm-accept"
  )
) {
  fail(
    "No encontré los controles X / Confirmar esperados. No escribí cambios."
  );
}

const patch = `

/* =========================================================
   ${MARKER}
   ÚNICAMENTE: hacer siempre visibles X y ✓.
   No modifica foto, cuadrícula, +, arrastre ni lógica.
   ========================================================= */

.alumni-photo-confirm-close {
  position: fixed !important;
  top: max(
    12px,
    env(safe-area-inset-top)
  ) !important;
  left: 12px !important;
  right: auto !important;
  bottom: auto !important;
  z-index: 2147483505 !important;

  display: inline-flex !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  align-items: center !important;
  justify-content: center !important;

  padding: 0 !important;
  border:
    1px solid
    rgba(255,255,255,.18) !important;
  border-radius: 999px !important;

  background:
    rgba(5,7,11,.72) !important;
  color: #fff !important;

  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;

  box-shadow:
    0 6px 18px
    rgba(0,0,0,.22) !important;

  backdrop-filter:
    blur(12px);
  -webkit-backdrop-filter:
    blur(12px);
}

.alumni-photo-confirm-accept {
  position: fixed !important;
  top: max(
    12px,
    env(safe-area-inset-top)
  ) !important;
  right: 12px !important;
  left: auto !important;
  bottom: auto !important;
  z-index: 2147483505 !important;

  display: inline-flex !important;
  width: 42px !important;
  height: 42px !important;
  min-width: 42px !important;
  min-height: 42px !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;

  padding: 0 !important;
  border: 0 !important;
  border-radius: 999px !important;

  background:
    var(--app-accent-fill) !important;
  color:
    var(--app-on-accent) !important;

  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;

  box-shadow:
    0 6px 18px
    color-mix(
      in srgb,
      var(--app-accent) 26%,
      transparent
    ) !important;
}

.alumni-photo-confirm-accept > span {
  display: none !important;
}

.alumni-photo-confirm-close svg,
.alumni-photo-confirm-accept svg {
  display: block !important;
  width: 21px !important;
  height: 21px !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.alumni-photo-confirm-accept:disabled,
.alumni-photo-confirm-close:disabled {
  opacity: .45 !important;
}

/* ${MARKER} */
`;

source += patch;

const backup =
  CSS +
  ".before-feed-photo-select-1.0.3.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    CSS,
    backup
  );
}

fs.writeFileSync(
  CSS,
  source,
  "utf8"
);

console.log("");
console.log(
  "✅ Feed Photo Select 1.0.3 aplicado."
);
console.log(
  "✅ X visible arriba a la izquierda."
);
console.log(
  "✅ ✓ visible arriba a la derecha."
);
console.log(
  "✅ No se modificó nada más."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
