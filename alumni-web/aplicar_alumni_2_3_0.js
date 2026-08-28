const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_3_0_SOCIAL_PASSPORT";

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

const ownerProfileRel = "src/app/profile/page.tsx";
const publicProfileRel = "src/app/u/[username]/page.tsx";

for (const rel of [ownerProfileRel, publicProfileRel]) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro: " + rel);
  }
}

const current = fs.readFileSync(
  path.join(ROOT, ownerProfileRel),
  "utf8"
);

if (current.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.3.0 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.3.0-social-passport",
  stamp
);

for (const rel of [ownerProfileRel, publicProfileRel]) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

const newFiles = [
  "src/components/profile/ProfilePassportPreview.tsx",
  "src/components/profile/ProfilePassportPreview.module.css",
  "src/app/passport/[username]/page.tsx",
  "src/app/passport/[username]/social-passport.css",
];

for (const rel of newFiles) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

/* OWN PROFILE */
{
  const file = path.join(ROOT, ownerProfileRel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import ProfileMusicCard from "@/components/profile/ProfileMusicCard";`,
`import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
    "Importar Pasaporte en perfil propio"
  );

  src = replaceOnce(
    src,
`            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <div className="alumni-profile-stats mt-6 flex gap-8 border-t border-white/[0.06] pt-5">`,
`            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <ProfilePassportPreview
              userId={profile.id}
              username={profile.username}
              own
            />

            <div className="alumni-profile-stats mt-6 flex gap-8 border-t border-white/[0.06] pt-5">`,
    "Mostrar Pasaporte y próximo destino en perfil propio"
  );

  src += `\n/* ${MARKER}:OWNER_PROFILE */\n`;
  writeLikeOriginal(file, original, src);
}

/* PUBLIC PROFILE */
{
  const file = path.join(ROOT, publicProfileRel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import ProfileMusicCard from "@/components/profile/ProfileMusicCard";`,
`import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
    "Importar Pasaporte en perfil público"
  );

  src = replaceOnce(
    src,
`            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">`,
`            <ProfileMusicCard track={profileMusic} className="mt-5" />

            <ProfilePassportPreview
              userId={profile.id}
              username={profile.username}
              own={ownProfile}
            />

            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">`,
    "Mostrar Pasaporte y próximo destino en perfil público"
  );

  src += `\n/* ${MARKER}:PUBLIC_PROFILE */\n`;
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.3.0 - SOCIAL PASSPORT");
console.log("============================================================");
console.log("[OK] Pasaporte aparece dentro del perfil");
console.log("[OK] Solo aparece en perfiles ajenos cuando hay contenido visible");
console.log("[OK] Próximo destino visible en perfil");
console.log("[OK] Propietario puede editar próximo destino desde perfil");
console.log("[OK] Nueva ruta pública /passport/[username]");
console.log("[OK] Países de otras personas se pueden abrir");
console.log("[OK] Likes por país");
console.log("[OK] Comentarios por país");
console.log("[OK] Quiero ir -> guarda destino y lo pone en tu perfil");
console.log("[OK] Respeta perfiles privados mediante RLS");
console.log("[OK] Fotos siguen privadas con signed URLs");
console.log("[OK] Supabase YA fue migrado en producción");
console.log("[OK] No ejecutes SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
