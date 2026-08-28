const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_1_COMMUNITIES_EVENTS";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
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
  "src/app/community/page.tsx",
  "src/app/community/community-2.css",
  "src/app/community/[slug]/page.tsx",
  "src/app/community/[slug]/community-detail.css",
  "src/app/events/page.tsx",
  "src/app/events/events-2.css",
  "src/app/events/[id]/page.tsx",
  "src/app/events/[id]/event-detail.css",
];

for (const rel of files) {
  const source = path.join(PAYLOAD, rel);
  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }
}

const currentCommunity = fs.readFileSync(
  path.join(ROOT, "src/app/community/page.tsx"),
  "utf8"
);

if (currentCommunity.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.1 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.0-communities-events",
  stamp
);

const backupFiles = [
  ...files,
  "src/components/layout/LeftSidebar.tsx",
];

for (const rel of backupFiles) {
  const source = path.join(ROOT, rel);
  if (!fs.existsSync(source)) continue;

  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

for (const rel of files) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

/* Small wording cleanup only — no navigation redesign */
{
  const file = path.join(ROOT, "src/components/layout/LeftSidebar.tsx");
  const original = fs.readFileSync(file, "utf8");
  let next = norm(original);

  next = next.replace(
    "Conecta con personas de tu universidad, carrera y comunidad profesional.",
    "Conecta con personas, comunidades y eventos que forman parte de tu mundo."
  );

  next += `\n/* ${MARKER}:SIDEBAR_COPY */\n`;
  writeLikeOriginal(file, original, next);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.0 - COMUNIDADES & EVENTOS");
console.log("============================================================");
console.log("[OK] Comunidad deja de ser directorio de perfiles");
console.log("[OK] Crear comunidades públicas o privadas");
console.log("[OK] Universidad / carrera / generación / ciudad / intereses");
console.log("[OK] Unirse / solicitar acceso / salir");
console.log("[OK] Creador y moderadores");
console.log("[OK] Solicitudes privadas con aceptar/rechazar");
console.log("[OK] Feed propio dentro de cada comunidad");
console.log("[OK] Eventos públicos o exclusivos de comunidad");
console.log("[OK] Crear eventos desde Alumni");
console.log("[OK] Voy / Me interesa / No puedo");
console.log("[OK] Ver asistentes");
console.log("[OK] Cupo máximo opcional");
console.log("[OK] Compartir evento");
console.log("[OK] Backend de invitaciones para comunidad y evento");
console.log("[OK] Diseño abierto: líneas, tipografía y espacio; no cards");
console.log("[OK] Supabase YA migrado en producción");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
