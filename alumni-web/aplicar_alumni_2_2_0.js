const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta este instalador dentro de la carpeta "alumni-web".');
}

const requiredTargets = [
  "src/app/explore/page.tsx",
  "src/app/explore/explore-2.css",
];

for (const rel of requiredTargets) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro en tu proyecto: " + rel);
  }
}

const writeTargets = [
  "src/app/explore/page.tsx",
  "src/app/explore/explore-2.css",
  "src/app/passport/page.tsx",
  "src/app/passport/passport.css",
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.0-radar-passport-recommendations",
  stamp
);

for (const rel of requiredTargets) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

for (const rel of writeTargets) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.0 - RADAR + PASAPORTE + RECOMENDACIONES");
console.log("============================================================");
console.log("[OK] Explore rediseñado con Radar Alumni");
console.log("[OK] Recomendaciones entre amigos integradas");
console.log("[OK] Nuevo módulo Pasaporte Alumni");
console.log("[OK] Álbumes por país con estilos visuales");
console.log("[OK] Formulario para recomendar lugares / música / viajes");
console.log("[OK] Route nueva: /passport");
console.log("[OK] No toca header seguro de 2.1.4");
console.log("[OK] No toca messaging");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("IMPORTANTE:");
console.log("1) Ejecuta primero el SQL en Supabase:");
console.log("   supabase/alumni_2_2_0_radar_passport_recommendations.sql");
console.log("2) Luego ejecuta:");
console.log("   npm run build");
console.log("============================================================");
