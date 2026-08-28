const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_2_1_1_MOBILE_NAV_SPACING";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

const mobileNav =
  "src/components/layout/MobileNav.tsx";

const cssFiles = [
  {
    path: "src/app/community/community-2.css",
    css: `
/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .alumni-community-2 {
    padding-top: 12px;
  }
}
`,
  },
  {
    path: "src/app/community/[slug]/community-detail.css",
    css: `
/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .community-detail {
    padding-top: 12px;
  }
}
`,
  },
  {
    path: "src/app/events/events-2.css",
    css: `
/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .alumni-events-2 {
    padding-top: 12px;
  }
}
`,
  },
  {
    path: "src/app/events/[id]/event-detail.css",
    css: `
/* ALUMNI_2_1_1_MOBILE_HEADER_SPACING */
@media (max-width: 1023px) {
  .event-detail {
    padding-top: 12px;
  }
}
`,
  },
];

for (const rel of [
  mobileNav,
  ...cssFiles.map((item) => item.path),
]) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro " + rel);
  }
}

const currentNav = fs.readFileSync(
  path.join(ROOT, mobileNav),
  "utf8"
);

if (
  currentNav.includes(
    "ALUMNI_2_1_1_MOBILE_NAV_MORE"
  )
) {
  console.log(
    "[SKIP] ALUMNI 2.1.1 ya estaba aplicado."
  );
  process.exit(0);
}

const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.1.1-mobile-nav-spacing",
  stamp
);

for (const rel of [
  mobileNav,
  ...cssFiles.map((item) => item.path),
]) {
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

/* Replace MobileNav with the regression-safe 2.1.1 version */
{
  const source = path.join(
    PAYLOAD,
    mobileNav
  );

  const target = path.join(
    ROOT,
    mobileNav
  );

  if (!fs.existsSync(source)) {
    die(
      "Payload faltante: " +
        mobileNav
    );
  }

  fs.copyFileSync(
    source,
    target
  );

  console.log(
    "[OK] Navegación móvil con Más"
  );
}

/* Add only scoped mobile spacing */
for (const item of cssFiles) {
  const target = path.join(
    ROOT,
    item.path
  );

  let content =
    fs.readFileSync(
      target,
      "utf8"
    );

  if (
    !content.includes(
      "ALUMNI_2_1_1_MOBILE_HEADER_SPACING"
    )
  ) {
    content +=
      "\n" +
      item.css.trim() +
      "\n";

    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }

  console.log(
    "[OK] Espaciado móvil: " +
      item.path
  );
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.1.1 - MOBILE NAV + SPACING");
console.log("============================================================");
console.log("[OK] Quinto botón móvil ahora es Más");
console.log("[OK] Más abre Comunidades / Eventos / Ajustes");
console.log("[OK] Barra sigue teniendo solo 5 botones");
console.log("[OK] Inicio / Explorar / Crear / Mensajes se preservan");
console.log("[OK] Contador de mensajes se preserva");
console.log("[OK] Inicio activo sigue haciendo scroll suave sin refresh");
console.log("[OK] Lista Más usa diseño abierto con divisores, no cards");
console.log("[OK] Encabezados Comunidad/Eventos bajan 12px en móvil");
console.log("[OK] Desktop no cambia");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
