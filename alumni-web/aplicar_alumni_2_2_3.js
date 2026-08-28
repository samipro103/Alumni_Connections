const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_2_3_PASSPORT_INNER_CONFIRM";

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
  console.log("[SKIP] ALUMNI 2.2.3 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.3-passport-inner-confirm",
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
`import { Camera, Globe2, ImagePlus, Plus } from "lucide-react";`,
`import { Camera, Check, Globe2, ImagePlus, Plus, X } from "lucide-react";`,
    "Importar iconos confirmar/cerrar"
  );

  /* Remove duplicated empty-state create action */
  src = replaceOnce(
    src,
`          <section className="passport-empty passport-empty-first">
            <Globe2 size={28} />
            <strong>Tu pasaporte está esperando su primer destino.</strong>
            <p>Crea un país, elige un estilo y empieza a guardar recuerdos.</p>

            <button
              type="button"
              className="passport-empty-create"
              onClick={() => setCountryOpen(true)}
            >
              <Plus size={16} />
              Crear primer país
            </button>
          </section>`,
`          <section className="passport-empty passport-empty-first">
            <Globe2 size={28} />
            <strong>Tu pasaporte está esperando su primer destino.</strong>
            <p>Usa “Añadir país” arriba para crear tu primer álbum de viaje.</p>
          </section>`,
    "Dejar una sola acción exterior"
  );

  /* Country modal header: close + create inside */
  src = replaceOnce(
    src,
`              <header>
                <div>
                  <span>Nuevo país</span>
                  <h3>Dale identidad a este destino.</h3>
                </div>
                <button type="button" onClick={() => setCountryOpen(false)}>Cerrar</button>
              </header>`,
`              <header className="passport-modal-header-v2">
                <button
                  type="button"
                  className="passport-modal-close"
                  onClick={() => setCountryOpen(false)}
                  aria-label="Cerrar"
                  disabled={busy}
                >
                  <X size={17} />
                  <span>Cerrar</span>
                </button>

                <div className="passport-modal-title">
                  <span>Nuevo país</span>
                  <h3>Dale identidad a este destino.</h3>
                </div>

                <button
                  type="button"
                  className="passport-modal-confirm"
                  disabled={
                    busy ||
                    !form.country_name.trim() ||
                    !form.country_code.trim()
                  }
                  onClick={() => void createCountry()}
                  aria-label="Crear país"
                >
                  <Check size={17} />
                  <span>{busy ? "Creando..." : "Crear"}</span>
                </button>
              </header>`,
    "Confirmar creación dentro del editor"
  );

  /* Photo modal header: close + save inside */
  src = replaceOnce(
    src,
`              <header>
                <div>
                  <span>Nueva foto</span>
                  <h3>Agrega un recuerdo a {active.country_name}.</h3>
                </div>
                <button type="button" onClick={() => setPhotoOpen(false)}>Cerrar</button>
              </header>`,
`              <header className="passport-modal-header-v2">
                <button
                  type="button"
                  className="passport-modal-close"
                  onClick={() => setPhotoOpen(false)}
                  aria-label="Cerrar"
                  disabled={busy}
                >
                  <X size={17} />
                  <span>Cerrar</span>
                </button>

                <div className="passport-modal-title">
                  <span>Nueva foto</span>
                  <h3>Agrega un recuerdo a {active.country_name}.</h3>
                </div>

                <button
                  type="button"
                  className="passport-modal-confirm"
                  disabled={busy || !photoFile}
                  onClick={() => void addPhoto()}
                  aria-label="Guardar foto"
                >
                  <Check size={17} />
                  <span>{busy ? "Subiendo..." : "Guardar"}</span>
                </button>
              </header>`,
    "Confirmar foto dentro del editor"
  );

  /* Remove any optional 2.2.2 persistent outside button if it exists locally */
  const mobileButton = `
        <button
          type="button"
          className="passport-mobile-create"
          onClick={() => setCountryOpen(true)}
          aria-label="Añadir país al Pasaporte Alumni"
        >
          <Plus size={17} />
          Añadir país
        </button>
`;

  if (src.includes(mobileButton)) {
    src = src.replace(mobileButton, "");
    console.log("[OK] Quitar botón móvil exterior duplicado de 2.2.2");
  }

  src += `\n/* ${MARKER}:PAGE */\n`;
  writeLikeOriginal(pagePath, original, src);
}

/* CSS */
{
  const original = fs.readFileSync(cssPath, "utf8");
  let src = norm(original);

  src += `

/* ============================================================
   ALUMNI 2.2.3 — confirm actions INSIDE Passport editor
   ============================================================ */

.passport-modal-header-v2 {
  display: grid !important;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start !important;
  gap: 14px !important;
}

.passport-modal-title {
  min-width: 0;
}

.passport-modal-close,
.passport-modal-confirm {
  display: inline-flex !important;
  min-height: 38px !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;

  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;

  font-size: 10px !important;
  font-weight: 900 !important;
}

.passport-modal-close {
  color: var(--app-muted-2) !important;
}

.passport-modal-confirm {
  color: var(--app-accent) !important;
}

.passport-modal-confirm:disabled {
  color: var(--app-muted-3) !important;
  opacity: .55;
}

.passport-modal-close > span,
.passport-modal-confirm > span {
  display: inline !important;
  color: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}

/* old duplicated outside action is never shown */
.passport-mobile-create {
  display: none !important;
}

@media (max-width: 700px) {
  .passport-modal {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
  }

  .passport-modal-header-v2 {
    position: sticky;
    top: 0;
    z-index: 20;

    grid-template-columns: 42px minmax(0, 1fr) 54px !important;

    width: 100%;

    padding:
      max(
        12px,
        env(safe-area-inset-top)
      )
      16px
      12px !important;

    background:
      color-mix(
        in srgb,
        var(--app-bg) 98%,
        transparent
      );

    backdrop-filter: blur(20px);
  }

  .passport-modal-close,
  .passport-modal-confirm {
    width: 100%;
    min-height: 42px !important;
  }

  .passport-modal-close > span,
  .passport-modal-confirm > span {
    display: none !important;
  }

  .passport-modal-close svg,
  .passport-modal-confirm svg {
    width: 20px;
    height: 20px;
  }

  .passport-modal-title {
    align-self: center;
    text-align: center;
  }

  .passport-modal-title > span {
    display: block;
    font-size: 8px !important;
  }

  .passport-modal-title h3 {
    margin-top: 3px;
    font-size: 17px;
    line-height: 1.18;
  }

  .passport-body {
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;

    padding-bottom:
      calc(
        32px +
        env(safe-area-inset-bottom)
      );
  }

  /* mobile has ONE confirm action: top-right check */
  .passport-modal > footer {
    display: none !important;
  }

  .passport-empty-create {
    display: none !important;
  }

  .passport-empty-first {
    padding-top: 48px;
  }
}

@media (min-width: 701px) {
  /* desktop keeps footer button as secondary confirmation */
  .passport-modal > footer {
    display: flex;
  }
}

/* ${MARKER}:STYLE */
`;

  writeLikeOriginal(cssPath, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.3 - PASSPORT INNER CONFIRM");
console.log("============================================================");
console.log("[OK] Afuera queda SOLO Añadir país del encabezado");
console.log("[OK] Se elimina Crear primer país duplicado");
console.log("[OK] Si 2.2.2 agregó botón flotante, también se elimina");
console.log("[OK] Dentro de Nuevo país: X izquierda + check Crear derecha");
console.log("[OK] Dentro de Nueva foto: X izquierda + check Guardar derecha");
console.log("[OK] En móvil los controles quedan sticky arriba");
console.log("[OK] Ya no depende del footer inferior en móvil");
console.log("[OK] Desktop conserva footer como confirmación secundaria");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
