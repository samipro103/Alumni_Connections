const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_2_1_PASSPORT_CREATE_FIX";

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
  console.log("[SKIP] ALUMNI 2.2.1 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.1-passport-create-fix",
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
`          <section className="passport-empty">
            <Globe2 size={28} />
            <strong>Tu pasaporte está esperando su primer destino.</strong>
            <p>Crea un país, elige un estilo y empieza a guardar recuerdos.</p>
          </section>`,
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
    "Botón Crear primer país en estado vacío"
  );

  src = replaceOnce(
    src,
`                  {busy ? "Guardando..." : "Guardar país"}`,
`                  {busy ? "Creando..." : "Crear país"}`,
    "Texto Crear país más claro"
  );

  src += `\n/* ${MARKER}:PAGE */\n`;
  writeLikeOriginal(pagePath, original, src);
}

/* CSS */
{
  const original = fs.readFileSync(cssPath, "utf8");
  let src = norm(original);

  src += `

/* ALUMNI 2.2.1 — create action always visible */
.passport-empty-create {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 7px;
  margin-top: 20px;
  padding: 0 2px;
  border: 0;
  border-bottom: 2px solid var(--app-accent);
  background: transparent;
  color: var(--app-text);
  font-size: 11px;
  font-weight: 900;
}

.passport-modal > footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  flex: 0 0 auto;
  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    );
  backdrop-filter: blur(18px);
}

.passport-modal > footer button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 700px) {
  .passport-empty-first {
    padding-top: 48px;
  }

  .passport-empty-create {
    margin-inline: auto;
  }

  .passport-modal {
    height: 100dvh;
    max-height: 100dvh;
  }

  .passport-modal > footer {
    width: 100%;
    align-items: stretch;
  }

  .passport-modal > footer > span {
    display: none;
  }

  .passport-modal > footer button {
    width: 100%;
    min-height: 48px;
    border-radius: 12px;
    font-size: 12px;
  }
}

/* ${MARKER}:STYLE */
`;

  writeLikeOriginal(cssPath, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.1 - PASSPORT CREATE FIX");
console.log("============================================================");
console.log("[OK] Botón Crear primer país visible en Pasaporte vacío");
console.log("[OK] Botón final ahora dice Crear país");
console.log("[OK] Acción final queda sticky abajo en móvil");
console.log("[OK] En móvil el botón ocupa todo el ancho");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
