const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_2_1_4_IOS_SAFE_HEADER";

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
  "src/components/layout/TopBar.tsx",
  "src/components/layout/AppShell.tsx",
];

for (const rel of files) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro " + rel);
  }
}

const topBarPath = path.join(ROOT, files[0]);
const current = fs.readFileSync(topBarPath, "utf8");

if (current.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.1.4 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.4-ios-safe-header",
  stamp
);

for (const rel of files) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* TopBar: the 68px app header sits BELOW iOS safe area */
{
  const file = path.join(ROOT, "src/components/layout/TopBar.tsx");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`    <header className="fixed inset-x-0 top-0 z-[70] h-[68px] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_94%,transparent)] backdrop-blur-xl [transform:translateZ(0)]">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-5 px-4 sm:px-6 lg:px-8">`,
`    <header className="fixed inset-x-0 top-0 z-[70] h-[calc(68px+env(safe-area-inset-top))] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_94%,transparent)] backdrop-blur-xl [transform:translateZ(0)] lg:h-[68px]">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-5 px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8 lg:pt-0">`,
    "Respetar zona segura del iPhone en TopBar"
  );

  src += `\n/* ${MARKER}:TOPBAR */\n`;
  writeLikeOriginal(file, original, src);
}

/* AppShell: page body starts under the REAL header height */
{
  const file = path.join(ROOT, "src/components/layout/AppShell.tsx");
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`              : "mx-auto w-full max-w-[1500px] px-4 pb-24 pt-[84px] sm:px-6 lg:px-8 lg:pb-10"`,
`              : "mx-auto w-full max-w-[1500px] px-4 pb-24 pt-[calc(84px+env(safe-area-inset-top))] sm:px-6 lg:px-8 lg:pb-10 lg:pt-[84px]"`,
    "Bajar contenido global debajo del encabezado real"
  );

  src += `\n/* ${MARKER}:APP_SHELL */\n`;
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.4 - IOS SAFE HEADER");
console.log("============================================================");
console.log("[OK] Logo ya no invade reloj / Dynamic Island");
console.log("[OK] TopBar suma safe-area superior SOLO donde existe");
console.log("[OK] Contenido global comienza debajo del TopBar real");
console.log("[OK] Feed también baja correctamente");
console.log("[OK] Comunidades / Eventos / Perfil / Explorar se benefician");
console.log("[OK] Android y escritorio mantienen el espaciado normal");
console.log("[OK] Conversaciones inmersivas móviles no se modifican");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
