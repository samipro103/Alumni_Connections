const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_NAVBAR_ICONS_ONLY_1_0";

const FILE =
  "src/components/layout/MobileNav.tsx";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(abs(FILE))) {
  fail(
    `No encontré ${FILE}. Ejecutá este parche dentro de alumni-web.`
  );
}

let source = fs
  .readFileSync(abs(FILE), "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes(MARKER)) {
  console.log(
    "✅ Navbar Icons Only 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   1. Icon-only nav item
   ========================================================= */

source = source.replace(
  'className="alumni-mobile-nav-item flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[18px]"',
  'className="alumni-mobile-nav-item flex min-h-[52px] items-center justify-center rounded-[18px]"'
);

/* =========================================================
   2. Accessibility label
   ========================================================= */

const ariaCurrent = `                aria-current={
                  active
                    ? "page"
                    : undefined
                }`;

if (!source.includes('aria-label={label}')) {
  if (!source.includes(ariaCurrent)) {
    fail(
      "No encontré aria-current del item de navbar."
    );
  }

  source = source.replace(
    ariaCurrent,
    `${ariaCurrent}
                aria-label={label}
                title={label}`
  );
}

/* =========================================================
   3. Remove visible labels
   ========================================================= */

const visibleLabel = `
                <span className="alumni-mobile-nav-label text-[10px]">
                  {label}
                </span>`;

if (source.includes(visibleLabel)) {
  source = source.replace(
    visibleLabel,
    ""
  );
} else if (
  source.includes(
    "alumni-mobile-nav-label"
  )
) {
  fail(
    "Encontré alumni-mobile-nav-label, pero con una estructura distinta a la esperada."
  );
}

/* =========================================================
   4. Slightly stronger icon presence
   ========================================================= */

source = source.replace(
  `                  <Icon
                    size={20}`,
  `                  <Icon
                    size={22}`
);

source = source.replace(
  'className="alumni-mobile-nav-icon relative flex h-9 w-11 items-center justify-center rounded-lg transition-colors duration-150"',
  'className="alumni-mobile-nav-icon relative flex h-10 w-12 items-center justify-center rounded-xl transition-colors duration-150"'
);

if (!source.includes(`/* ${MARKER} */`)) {
  source += `\n/* ${MARKER} */\n`;
}

/* =========================================================
   Validation
   ========================================================= */

if (
  source.includes(
    "alumni-mobile-nav-label"
  )
) {
  fail(
    "Validación: todavía existe una etiqueta visible."
  );
}

if (!source.includes("aria-label={label}")) {
  fail(
    "Validación: faltó aria-label."
  );
}

try {
  const ts = require("typescript");

  const parsed =
    ts.createSourceFile(
      FILE,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics || [];

  if (diagnostics.length) {
    const first =
      diagnostics[0];

    const message =
      ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      );

    const pos =
      typeof first.start === "number"
        ? parsed.getLineAndCharacterOfPosition(
            first.start
          )
        : null;

    fail(
      `${FILE}: sintaxis inválida` +
        (
          pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : ""
        ) +
        `: ${message}`
    );
  }

  console.log(
    "✅ Parser TypeScript: MobileNav válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

const backup =
  abs(FILE) +
  ".before-icons-only-1.0.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    abs(FILE),
    backup
  );
}

fs.writeFileSync(
  abs(FILE),
  source,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Navbar Icons Only 1.0 aplicado."
);
console.log(
  "✅ Inicio / Mensajes / Buscar / Más ya no se muestran."
);
console.log(
  "✅ Solo quedan los iconos."
);
console.log(
  "✅ aria-label preservado para accesibilidad."
);
console.log(
  "✅ Rutas y badge de mensajes intactos."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
