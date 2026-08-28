const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_1_3_HEADER_BACK_FIX";

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

const files = [
  "src/app/events/page.tsx",
  "src/app/events/events-2.css",
  "src/app/events/[id]/event-detail.css",
  "src/app/community/community-2.css",
  "src/app/community/[slug]/community-detail.css",
];

for (const rel of files) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro " + rel);
  }
}

const eventPagePath = path.join(ROOT, "src/app/events/page.tsx");
const currentEventPage = fs.readFileSync(eventPagePath, "utf8");

if (currentEventPage.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.1.3 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.3-header-back-fix",
  stamp
);

for (const rel of files) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);

  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* EVENT CREATION: explicit back control */
{
  const file = eventPagePath;
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";`,
`import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";`,
    "Importar flecha Volver"
  );

  src = replaceOnce(
    src,
`              <header>
                <div>
                  <span>Nuevo evento</span>
                  <h2>Organiza algo real.</h2>
                </div>
                <button type="button" onClick={() => setCreateOpen(false)}>
                  <X size={18} />
                </button>
              </header>`,
`              <header className="events2-create-header">
                <button
                  type="button"
                  className="events2-create-back"
                  onClick={() => setCreateOpen(false)}
                >
                  <ArrowLeft size={17} />
                  Volver
                </button>

                <div>
                  <span>Nuevo evento</span>
                  <h2>Organiza algo real.</h2>
                </div>
              </header>`,
    "Botón Volver al crear evento"
  );

  src += `\n/* ${MARKER}:EVENT_CREATE_BACK */\n`;

  writeLikeOriginal(file, original, src);
}

/* EVENT HOME CSS */
{
  const file = path.join(ROOT, "src/app/events/events-2.css");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .alumni-events-2 {
    padding-top: 12px;
  }
}`,
`/* ALUMNI_2_1_3_HEADER_POSITION */
@media (max-width: 1023px) {
  .alumni-events-2 {
    padding-top: 30px;
  }
}`,
    "Bajar encabezado principal de Eventos"
  );

  src += `

/* ALUMNI 2.1.3 — crear evento como pantalla clara en móvil */
.events2-create-header {
  align-items: flex-start !important;
  justify-content: flex-start !important;
}

.events2-create-back {
  display: inline-flex !important;
  width: auto !important;
  height: auto !important;
  min-height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start !important;
  gap: 6px;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: var(--app-muted-2) !important;
  font-size: 10px;
  font-weight: 850;
}

.events2-create-header > div {
  min-width: 0;
  flex: 1 1 auto;
}

@media (max-width: 719px) {
  .events2-modal-backdrop {
    align-items: stretch;
    background: var(--app-bg);
    backdrop-filter: none;
  }

  .events2-modal {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    padding:
      max(8px, env(safe-area-inset-top))
      18px
      max(16px, env(safe-area-inset-bottom));
    border-radius: 0;
    background: var(--app-bg);
  }

  .events2-create-header {
    position: sticky;
    top: 0;
    z-index: 4;
    display: grid !important;
    grid-template-columns: 1fr;
    gap: 10px !important;
    padding: 7px 0 14px !important;
    background: var(--app-bg);
  }

  .events2-create-back {
    min-height: 36px;
  }

  .events2-create-header h2 {
    font-size: 22px;
  }

  .events2-form {
    padding-top: 20px;
  }

  .events2-modal footer {
    position: sticky;
    bottom: 0;
    z-index: 4;
    margin-inline: -18px;
    padding:
      12px 18px
      max(12px, env(safe-area-inset-bottom));
    background:
      color-mix(
        in srgb,
        var(--app-bg) 96%,
        transparent
      );
    backdrop-filter: blur(18px);
  }

  .events2-modal footer button:first-child {
    display: none;
  }

  .events2-modal footer button:last-child {
    min-height: 42px;
    margin-left: auto;
    font-size: 12px;
  }
}

/* ${MARKER}:EVENTS_CSS */
`;

  writeLikeOriginal(file, original, src);
}

/* EVENT DETAIL: same top rhythm */
{
  const file = path.join(ROOT, "src/app/events/[id]/event-detail.css");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  if (src.includes("padding-top: 12px;")) {
    src = src.replace(
`/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .event-detail {
    padding-top: 12px;
  }
}`,
`/* ALUMNI_2_1_3_HEADER_POSITION */
@media (max-width: 1023px) {
  .event-detail {
    padding-top: 30px;
  }
}`
    );
  } else {
    src += `
/* ALUMNI_2_1_3_HEADER_POSITION */
@media (max-width: 1023px) {
  .event-detail {
    padding-top: 30px;
  }
}
`;
  }

  writeLikeOriginal(file, original, src);
}

/* COMMUNITY HOME + DETAIL: same top rhythm */
for (const [rel, selector] of [
  ["src/app/community/community-2.css", ".alumni-community-2"],
  ["src/app/community/[slug]/community-detail.css", ".community-detail"],
]) {
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  const oldBlock =
`/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  ${selector} {
    padding-top: 12px;
  }
}`;

  const newBlock =
`/* ALUMNI_2_1_3_HEADER_POSITION */
@media (max-width: 1023px) {
  ${selector} {
    padding-top: 30px;
  }
}`;

  if (src.includes(oldBlock)) {
    src = src.replace(oldBlock, newBlock);
  } else if (!src.includes("ALUMNI_2_1_3_HEADER_POSITION")) {
    src += "\n" + newBlock + "\n";
  }

  writeLikeOriginal(file, original, src);
  console.log("[OK] Bajar encabezado: " + rel);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.3 - HEADER + VOLVER AL CREAR EVENTO");
console.log("============================================================");
console.log("[OK] Encabezados bajan de 12px a 30px en móvil/tablet");
console.log("[OK] Eventos / detalle / Comunidades / detalle quedan alineados");
console.log("[OK] Crear evento tiene botón ← Volver claramente visible");
console.log("[OK] En móvil crear evento se siente como pantalla completa");
console.log("[OK] Header del formulario queda sticky");
console.log("[OK] Acción Crear evento queda accesible abajo");
console.log("[OK] Se elimina la X confusa en crear evento");
console.log("[OK] Desktop conserva modal centrado");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
