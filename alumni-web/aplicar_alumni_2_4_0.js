const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(value) {
  return value.replace(/\r\n/g, "\n");
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

const required = [
  "src/app/login/page.tsx",
  "src/app/mfa/setup/page.tsx",
  "src/components/layout/AppShell.tsx",
];

for (const rel of required) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro: " + rel);
  }
}

const currentLogin = fs.readFileSync(
  path.join(ROOT, "src/app/login/page.tsx"),
  "utf8"
);

if (currentLogin.includes("ALUMNI_2_4_0_EMAIL_2FA_LOGIN")) {
  console.log("[SKIP] 2.4.0 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(ROOT, ".alumni_backups", "2.4.0-email-2fa", stamp);

for (const rel of required) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

for (const rel of [
  "src/app/login/page.tsx",
  "src/app/mfa/setup/page.tsx",
  "src/components/auth/useEmail2FAGuard.tsx",
]) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

{
  const rel = "src/components/layout/AppShell.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
    'import EventReminderBootstrap from "@/components/events/EventReminderBootstrap";',
    'import EventReminderBootstrap from "@/components/events/EventReminderBootstrap";\nimport useEmail2FAGuard from "@/components/auth/useEmail2FAGuard";',
    "Importar guard de Email 2FA"
  );

  src = replaceOnce(
    src,
`export default function AppShell({
  children,
  immersiveMobile = false,
}: Props) {
  return (`,
`export default function AppShell({
  children,
  immersiveMobile = false,
}: Props) {
  const email2faReady = useEmail2FAGuard();

  if (!email2faReady) {
    return null;
  }

  return (`,
    "Bloquear app hasta verificar Email 2FA"
  );

  src += "\n/* ALUMNI_2_4_0_EMAIL_2FA_APP_GUARD */\n";
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.4.0 - EMAIL 2FA");
console.log("============================================================");
console.log("[OK] Contraseña = primer factor");
console.log("[OK] Código por correo = segundo factor");
console.log("[OK] Sesión se entrega solo después del código");
console.log("[OK] Código de 6 dígitos, 10 minutos");
console.log("[OK] Máximo 5 intentos y reenvío limitado");
console.log("[OK] TOTP deja de ser el login normal");
console.log("[OK] Backend Supabase YA aplicado");
console.log("");
console.log("IMPORTANTE: NO publiques hasta configurar:");
console.log("RESEND_API_KEY");
console.log("ALUMNI_EMAIL_FROM");
console.log("");
console.log("Después ejecuta: npm run build");
console.log("============================================================");
