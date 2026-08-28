const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_0_PWA_STABILITY";

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
    crlf
      ? normalized.replace(/\n/g, "\r\n")
      : normalized,
    "utf8"
  );
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const layoutPath = "src/app/layout.tsx";

if (!fs.existsSync(path.join(ROOT, layoutPath))) {
  die("No encuentro src/app/layout.tsx");
}

const currentLayout = fs.readFileSync(
  path.join(ROOT, layoutPath),
  "utf8"
);

if (currentLayout.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 2.0 ya estaba aplicado.");
  process.exit(0);
}

const files = [
  layoutPath,
  "src/components/pwa/PWAProBootstrap.tsx",
  "src/components/pwa/PWAProBootstrap.module.css",
  "src/components/stability/RecoveryScreen.tsx",
  "src/components/stability/RecoveryScreen.module.css",
  "src/app/manifest.ts",
  "src/app/offline/page.tsx",
  "src/app/offline/offline.module.css",
  "src/app/error.tsx",
  "src/app/global-error.tsx",
  "public/sw.js",
];

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.0.0-pwa-stability",
  stamp
);

for (const rel of files) {
  const source = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    continue;
  }

  const backup = path.join(
    backupRoot,
    rel
  );

  fs.mkdirSync(
    path.dirname(backup),
    { recursive: true }
  );

  fs.copyFileSync(
    source,
    backup
  );
}

/* Copy complete 2.0 files */
for (const rel of files.filter(
  (item) => item !== layoutPath
)) {
  const source = path.join(
    PAYLOAD,
    rel
  );

  const target = path.join(
    ROOT,
    rel
  );

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(
    path.dirname(target),
    { recursive: true }
  );

  fs.copyFileSync(
    source,
    target
  );

  console.log("[OK] " + rel);
}

/* Patch root layout without touching app structure */
{
  const file = path.join(
    ROOT,
    layoutPath
  );

  const original =
    fs.readFileSync(
      file,
      "utf8"
    );

  let src = norm(original);

  src = replaceOnce(
    src,
`import type { Metadata } from "next";`,
`import type {
  Metadata,
  Viewport,
} from "next";`,
    "Metadata + Viewport"
  );

  src = replaceOnce(
    src,
`  description:
    "La red para compartir logros, conectar talento y descubrir oportunidades.",
  appleWebApp: {`,
`  description:
    "Tu comunidad para compartir, descubrir y mantenerte cerca de tu red.",
  manifest:
    "/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/icons/alumni-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/alumni-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/alumni-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {`,
    "Manifest + iconos + descripción social"
  );

  src = replaceOnce(
    src,
`};

const themeScript =`,
`};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d12",
};

const themeScript =`,
    "Viewport PWA"
  );

  src = replaceOnce(
    src,
`    var allowed = ["dark","light","chill","pride","midnight","emerald","executive"];`,
`    var allowed = ["dark","light","pride"];`,
    "Solo Claro / Oscuro / Pride en arranque"
  );

  src += `\n/* ${MARKER}:ROOT_LAYOUT */\n`;

  writeLikeOriginal(
    file,
    original,
    src
  );
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.0.0 - PWA & STABILITY");
console.log("============================================================");
console.log("[OK] Manifest instalable");
console.log("[OK] Instalar como app en navegador compatible");
console.log("[OK] Guía Añadir a pantalla de inicio en iOS");
console.log("[OK] Service worker 2.0 con actualización segura");
console.log("[OK] No recarga conversaciones/stories/modales durante update");
console.log("[OK] Recuperación de errores de chunks tras deploy");
console.log("[OK] Cache solo de archivos estáticos seguros");
console.log("[OK] NO cachea Supabase/API/datos privados");
console.log("[OK] Navegación offline -> pantalla offline");
console.log("[OK] Limpieza automática de caches PWA antiguos");
console.log("[OK] Route error boundary");
console.log("[OK] Global error boundary");
console.log("[OK] Push y supresión de push en chat visible preservados");
console.log("[OK] Indicadores PWA como franjas abiertas, sin cards/cajas");
console.log("[OK] Solo temas Claro / Oscuro / Pride en bootstrap");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("No hay migración SQL para 2.0.");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
