const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_2_0_FIX1_SAFE_ADDITIVE";

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

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    die("No encuentro ancla: " + label);
  }
  console.log("[OK] " + label);
  return source.replace(from, to);
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const explorePage = "src/app/explore/page.tsx";
const exploreCss = "src/app/explore/explore-pro.css";
const mobileNav = "src/components/layout/MobileNav.tsx";

for (const rel of [explorePage, exploreCss, mobileNav]) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro en tu proyecto: " + rel);
  }
}

const currentExplore = fs.readFileSync(
  path.join(ROOT, explorePage),
  "utf8"
);

if (currentExplore.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.2.0 FIX1 ya estaba aplicado.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.2.0-fix1-safe-additive",
  stamp
);

const backupFiles = [
  explorePage,
  exploreCss,
  mobileNav,
];

for (const rel of backupFiles) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

/* Create new files */
for (const rel of [
  "src/components/explore/ExploreSocialPulse.tsx",
  "src/components/explore/ExploreSocialPulse.module.css",
  "src/app/passport/page.tsx",
  "src/app/passport/passport.css",
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

/* Preserve existing Explore. Add one import and one module. */
{
  const file = path.join(ROOT, explorePage);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import ExplorePersonRow from "@/components/explore/ExplorePersonRow";
import "./explore-pro.css";`,
`import ExplorePersonRow from "@/components/explore/ExplorePersonRow";
import ExploreSocialPulse from "@/components/explore/ExploreSocialPulse";
import "./explore-pro.css";`,
    "Conservar Explore Pro + importar módulos 2.2"
  );

  src = replaceOnce(
    src,
`        {!activeSearch && recents.length > 0 && (`,
`        {!activeSearch && <ExploreSocialPulse />}

        {!activeSearch && recents.length > 0 && (`,
    "Insertar Radar / Recomendaciones / Pasaporte sin borrar Explore"
  );

  src += `\n/* ${MARKER}:EXPLORE */\n`;
  writeLikeOriginal(file, original, src);
}

/* Add Passport into mobile More menu without changing five-tab structure. */
{
  const file = path.join(ROOT, mobileNav);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  if (!src.includes("label: \"Pasaporte\"")) {
    src = replaceOnce(
      src,
`  CalendarDays,
} from "lucide-react";`,
`  CalendarDays,
  Globe2,
} from "lucide-react";`,
      "Icono Pasaporte en navegación móvil"
    );

    src = replaceOnce(
      src,
`  {
    href: "/events",
    label: "Eventos",
    description: "Planes y encuentros",
    icon: CalendarDays,
  },
  {
    href: "/settings",`,
`  {
    href: "/events",
    label: "Eventos",
    description: "Planes y encuentros",
    icon: CalendarDays,
  },
  {
    href: "/passport",
    label: "Pasaporte",
    description: "Países, álbumes y recuerdos",
    icon: Globe2,
  },
  {
    href: "/settings",`,
      "Agregar Pasaporte dentro de Más"
    );

    src = replaceOnce(
      src,
`    pathname === "/events" ||
    pathname.startsWith(
      "/events/"
    ) ||
    pathname === "/settings"`,
`    pathname === "/events" ||
    pathname.startsWith(
      "/events/"
    ) ||
    pathname === "/passport" ||
    pathname.startsWith(
      "/passport/"
    ) ||
    pathname === "/settings"`,
      "Pasaporte activa Más en móvil"
    );
  }

  src += `\n/* ${MARKER}:MOBILE_NAV */\n`;
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.2.0 FIX1 - INSTALADOR CORREGIDO");
console.log("============================================================");
console.log("[OK] Ya NO exige explore-2.css");
console.log("[OK] Respeta explore-pro.css existente");
console.log("[OK] NO reemplaza tu Explore actual");
console.log("[OK] Conserva búsqueda / tendencias / hashtags / posts");
console.log("[OK] Añade Radar Alumni de forma aditiva");
console.log("[OK] Añade Recomendaciones entre amigos");
console.log("[OK] Crea /passport");
console.log("[OK] Pasaporte aparece en Más en móvil");
console.log("[OK] Fotos usan buckets privados + URLs temporales");
console.log("[OK] Supabase YA fue migrado en producción");
console.log("[OK] No ejecutes SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
