const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BASE = path.join(
  ROOT,
  ".alumni_backups",
  "1.5.0-messaging-2-home-nav"
);

function norm(value) {
  return String(value || "").replace(/\\r\\n/g, "\\n");
}

function latestBackup() {
  if (!fs.existsSync(BASE)) return null;

  const dirs = fs
    .readdirSync(BASE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  return dirs.length
    ? path.join(BASE, dirs[0])
    : null;
}

const direct = path.join(
  ROOT,
  "src/app/messages/[username]/page.tsx"
);

if (!fs.existsSync(direct)) {
  console.error("[ERROR] No encuentro el chat directo.");
  process.exit(1);
}

const directText = fs.readFileSync(direct, "utf8");

if (directText.includes("ALUMNI_1_5_0_MESSAGING_2_HOME_NAV:DIRECT")) {
  console.log("[INFO] El chat directo ya tiene 1.5.0 completo. No hace falta restaurar.");
  process.exit(0);
}

const backup = latestBackup();

if (!backup) {
  console.log("[INFO] No hay intento parcial anterior que restaurar. Se aplicará sobre la base actual.");
  process.exit(0);
}

const candidates = [
  "src/components/layout/MobileNav.tsx",
  "src/components/messages/MessageProTools.tsx",
  "src/components/messages/MessageReplyExperience.tsx",
  "src/app/globals.css",
];

let restored = 0;

for (const rel of candidates) {
  const current = path.join(ROOT, rel);
  const saved = path.join(backup, rel);

  if (!fs.existsSync(current) || !fs.existsSync(saved)) {
    continue;
  }

  const text = norm(fs.readFileSync(current, "utf8"));

  const looksPartial =
    text.includes("ALUMNI_1_5_0_MESSAGING_2_HOME_NAV") ||
    (rel.endsWith("MobileNav.tsx") &&
      text.includes('label === "Inicio"') &&
      text.includes('window.scrollTo({')) ||
    (rel.endsWith("MessageProTools.tsx") &&
      text.includes("ALUMNI_1_5_0_MESSAGE_TOOLS"));

  if (!looksPartial) {
    continue;
  }

  fs.copyFileSync(saved, current);
  restored += 1;
  console.log("[OK] Restaurado intento parcial: " + rel);
}

console.log(
  restored
    ? `[OK] Estado parcial restaurado desde ${backup}`
    : "[INFO] El backup existe, pero no fue necesario restaurar archivos."
);
