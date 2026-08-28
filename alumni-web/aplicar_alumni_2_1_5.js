const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_1_5_EVENTS_COMMUNITIES_REDESIGN";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const files = [
  "src/app/events/page.tsx",
  "src/app/events/events-2.css",
  "src/app/community/page.tsx",
  "src/app/community/community-2.css",
];

for (const rel of files) {
  const target = path.join(ROOT, rel);
  const source = path.join(PAYLOAD, rel);

  if (!fs.existsSync(target)) {
    die("No encuentro en tu proyecto: " + rel);
  }

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }
}

const current = fs.readFileSync(
  path.join(ROOT, "src/app/events/page.tsx"),
  "utf8"
);

if (
  current.includes(
    "ALUMNI_2_1_5_EVENTS_EDITORIAL_REDESIGN"
  )
) {
  console.log("[SKIP] ALUMNI 2.1.5 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.5-events-communities-redesign",
  stamp
);

for (const rel of files) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);

  fs.mkdirSync(
    path.dirname(backup),
    { recursive: true }
  );

  fs.copyFileSync(
    source,
    backup
  );
}

for (const rel of files) {
  fs.copyFileSync(
    path.join(PAYLOAD, rel),
    path.join(ROOT, rel)
  );

  console.log("[OK] " + rel);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.5 - EVENTOS + COMUNIDADES REDESIGN");
console.log("============================================================");
console.log("[OK] Eventos rediseñado");
console.log("[OK] Comunidades rediseñado");
console.log("[OK] Crear evento ahora tiene 3 pasos visuales");
console.log("[OK] Crear comunidad ahora tiene 3 pasos visuales");
console.log("[OK] Volver visible arriba en ambos creadores");
console.log("[OK] Editores pantalla completa en móvil");
console.log("[OK] Acción final fija abajo");
console.log("[OK] Tipos de evento ya no usan select feo");
console.log("[OK] Tipo de comunidad ya no usa select feo");
console.log("[OK] Público / comunidad y pública / privada rediseñados");
console.log("[OK] Fechas, ubicación y cupo con mejor jerarquía");
console.log("[OK] Filas de Eventos y Comunidades pulidas");
console.log("[OK] Se preserva el espaciado superior de 2.1.3");
console.log("[OK] No toca TopBar/AppShell de 2.1.4");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
