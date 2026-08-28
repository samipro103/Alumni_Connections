const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_2_2_PASSPORT_MOBILE_ACTION";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    die("No encuentro ancla: " + label);
  }
  console.log("[OK] " + label);
  return source.replace(from, to);
}

function writeLikeOriginal(target, original, next) {
  const crlf = original.includes("\r\n");
  const normalized = norm(next);

  fs.writeFileSync(
    target,
    crlf ? normalized.replace(/\n/g, "\r\n") : normalized,
    "utf8"
  );
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const pageRel = "src/app/passport/page.tsx";
const cssRel = "src/app/passport/passport.css";
const pagePath = path.join(ROOT, pageRel);
const cssPath = path.join(ROOT, cssRel);

for (const file of [pagePath, cssPath]) {
  if (!fs.existsSync(file)) {
    die("No encuentro: " + file);
  }
}

const current = fs.readFileSync(pagePath, "utf8");

if (current.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.2.2 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.2-passport-mobile-action",
  stamp
);

for (const rel of [pageRel, cssRel]) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);

  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* PAGE */
{
  const original = fs.readFileSync(pagePath, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`        {countryOpen && (`,
`        <button
          type="button"
          className="passport-mobile-create"
          onClick={() => setCountryOpen(true)}
          aria-label="Añadir país al Pasaporte Alumni"
        >
          <Plus size={17} />
          Añadir país
        </button>

        {countryOpen && (`,
    "Acción móvil persistente Añadir país"
  );

  src += `\n/* ${MARKER}:PAGE */\n`;
  writeLikeOriginal(pagePath, original, src);
}

/* CSS */
{
  const original = fs.readFileSync(cssPath, "utf8");
  let src = norm(original);

  src += `

/* ============================================================
   ALUMNI 2.2.2 — Passport mobile primary action
   ============================================================ */

.passport-mobile-create {
  display: none;
}

@media (max-width: 700px) {
  .alumni-passport {
    padding-bottom:
      calc(
        150px +
        env(safe-area-inset-bottom)
      );
  }

  .passport-mobile-create {
    position: fixed;
    right: 16px;
    bottom:
      calc(
        82px +
        env(safe-area-inset-bottom)
      );
    z-index: 2147481900;

    display: inline-flex;
    min-height: 46px;
    align-items: center;
    justify-content: center;
    gap: 8px;

    padding: 0 17px;

    border: 0;
    border-radius: 14px;

    background: var(--app-accent);
    color: var(--app-on-accent);

    box-shadow:
      0 12px 28px
      color-mix(
        in srgb,
        var(--app-accent) 24%,
        transparent
      );

    font-size: 11px;
    font-weight: 950;
  }

  .passport-modal {
    position: fixed;
    inset: 0;
    z-index: 2147482800;

    width: 100%;
    height: 100dvh;
    max-height: 100dvh;

    overflow: hidden;
  }

  .passport-modal > header {
    flex: 0 0 auto;
  }

  .passport-body {
    min-height: 0;
    flex: 1 1 auto;

    overflow-y: auto;

    padding-bottom:
      calc(
        110px +
        env(safe-area-inset-bottom)
      );
  }

  .passport-modal > footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2147482900;

    display: block;

    width: 100%;

    padding:
      12px 18px
      max(
        14px,
        env(safe-area-inset-bottom)
      );

    border-top:
      1px solid
      var(--app-border);

    background:
      color-mix(
        in srgb,
        var(--app-bg) 98%,
        transparent
      );

    backdrop-filter: blur(20px);
  }

  .passport-modal > footer > span {
    display: none;
  }

  .passport-modal > footer button {
    display: flex;

    width: 100%;
    min-height: 50px;

    align-items: center;
    justify-content: center;

    margin: 0;

    border-radius: 13px;

    font-size: 12px;
    font-weight: 950;
  }

  .passport-empty-create {
    display: inline-flex !important;
    min-height: 46px;

    margin-top: 22px !important;
    margin-inline: auto !important;

    align-items: center;
    justify-content: center;

    padding: 0 16px !important;

    border: 0 !important;
    border-radius: 13px !important;

    background: var(--app-accent) !important;
    color: var(--app-on-accent) !important;

    font-size: 11px !important;
    font-weight: 950 !important;
  }
}

@media (min-width: 701px) {
  .passport-modal > footer {
    position: sticky;
    right: auto;
    bottom: 0;
    left: auto;
  }
}

/* ${MARKER}:STYLE */
`;

  writeLikeOriginal(cssPath, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.2 - PASSPORT MOBILE ACTION");
console.log("============================================================");
console.log("[OK] Añadir país siempre visible encima de barra móvil");
console.log("[OK] Crear primer país reforzado visualmente");
console.log("[OK] Editor ocupa viewport móvil real");
console.log("[OK] Crear país fijo en la parte inferior");
console.log("[OK] El scroll del formulario no mueve el botón");
console.log("[OK] Respeta safe-area del iPhone");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
