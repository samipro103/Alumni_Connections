const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_2_4_PASSPORT_CREATE_BUTTON_VISIBLE";

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
  console.log("[SKIP] ALUMNI 2.2.4 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.4-passport-create-button-visible",
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

  // country editor: add persistent mobile action before footer
  src = replaceOnce(
    src,
`              <footer>
                <span>Un país, un estilo, un álbum.</span>
                <button type="button" disabled={busy || !form.country_name.trim() || !form.country_code.trim()} onClick={() => void createCountry()}>
                  {busy ? "Creando..." : "Crear país"}
                </button>
              </footer>`,
`              <button
                type="button"
                className="passport-mobile-submit"
                data-visible="country"
                disabled={
                  busy ||
                  !form.country_name.trim() ||
                  !form.country_code.trim()
                }
                onClick={() => void createCountry()}
              >
                {busy ? "Creando..." : "Crear país"}
              </button>

              <footer>
                <span>Un país, un estilo, un álbum.</span>
                <button type="button" disabled={busy || !form.country_name.trim() || !form.country_code.trim()} onClick={() => void createCountry()}>
                  {busy ? "Creando..." : "Crear país"}
                </button>
              </footer>`,
    "Agregar botón fijo Crear país dentro del editor"
  );

  // photo editor: add persistent mobile action before footer
  src = replaceOnce(
    src,
`              <footer>
                <span>La foto quedará dentro del álbum del país.</span>
                <button type="button" disabled={busy || !photoFile} onClick={() => void addPhoto()}>
                  {busy ? "Subiendo..." : "Guardar foto"}
                </button>
              </footer>`,
`              <button
                type="button"
                className="passport-mobile-submit"
                data-visible="photo"
                disabled={busy || !photoFile}
                onClick={() => void addPhoto()}
              >
                {busy ? "Subiendo..." : "Guardar foto"}
              </button>

              <footer>
                <span>La foto quedará dentro del álbum del país.</span>
                <button type="button" disabled={busy || !photoFile} onClick={() => void addPhoto()}>
                  {busy ? "Subiendo..." : "Guardar foto"}
                </button>
              </footer>`,
    "Agregar botón fijo Guardar foto dentro del editor"
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
   ALUMNI 2.2.4 — visible in-editor confirm action
   ============================================================ */

.passport-mobile-submit {
  display: none;
}

@media (max-width: 700px) {
  .passport-mobile-submit {
    position: fixed;
    right: 16px;
    bottom: calc(84px + env(safe-area-inset-bottom));
    left: 16px;
    z-index: 2147482950;

    display: inline-flex;
    min-height: 50px;
    align-items: center;
    justify-content: center;

    border: 0;
    border-radius: 14px;

    background: var(--app-accent);
    color: var(--app-on-accent);

    font-size: 12px;
    font-weight: 950;

    box-shadow:
      0 14px 36px
      color-mix(
        in srgb,
        var(--app-accent) 28%,
        transparent
      );
  }

  .passport-mobile-submit:disabled {
    opacity: .48;
  }

  .passport-body {
    padding-bottom: calc(120px + env(safe-area-inset-bottom)) !important;
  }

  /* prevent invisible header-only flow on mobile */
  .passport-modal > footer {
    display: none !important;
  }
}

@media (min-width: 701px) {
  .passport-mobile-submit {
    display: none !important;
  }
}

/* ${MARKER}:STYLE */
`;

  writeLikeOriginal(cssPath, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.4 - PASSPORT CREATE BUTTON VISIBLE");
console.log("============================================================");
console.log("[OK] Afuera no añade acciones nuevas");
console.log("[OK] Dentro de Nuevo país: botón fijo visible Crear país");
console.log("[OK] Dentro de Nueva foto: botón fijo visible Guardar foto");
console.log("[OK] En móvil queda arriba de la barra inferior");
console.log("[OK] No depende de header ni footer escondidos");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
