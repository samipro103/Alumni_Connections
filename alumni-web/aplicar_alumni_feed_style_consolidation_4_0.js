const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const PAGE =
  "src/app/feed/page.tsx";

const BASE_TARGET =
  "src/app/feed/feed-consolidated-base-4-0.css";

const FINAL_TARGET =
  "src/app/feed/feed-consolidated-final-4-0.css";

const BASE_SOURCES = [
  "src/app/feed/feed-pro.css",
  "src/app/feed/feed-visual-2-4.css",
  "src/app/feed/feed-visual-2-5.css",
  "src/app/feed/feed-visual-3-1.css",
  "src/app/feed/feed-comments-messaging-font.css",
  "src/app/feed/stories-visual-1-0.css",
  "src/app/feed/stories-visual-1-1.css",
];

const FINAL_SOURCES = [
  "src/app/feed/feed-photo-confirm-1-0.css",
];

const SHARED_IMPORT =
  'import "../media-rendering-1-0.css";';

const MARKER =
  "ALUMNI_FEED_STYLE_CONSOLIDATION_4_0";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) {
    return output;
  }

  for (
    const entry of fs.readdirSync(
      dir,
      { withFileTypes: true }
    )
  ) {
    const full =
      path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === ".alumni_backups"
      ) {
        continue;
      }

      walk(full, output);
    } else {
      output.push(full);
    }
  }

  return output;
}

function rel(file) {
  return path
    .relative(ROOT, file)
    .replace(/\\/g, "/");
}

function backup(relPath, content) {
  const target =
    abs(
      path.join(
        ".alumni_backups",
        "feed-style-consolidation-4-0",
        relPath
      )
    );

  if (fs.existsSync(target)) {
    return;
  }

  fs.mkdirSync(
    path.dirname(target),
    { recursive: true }
  );

  fs.writeFileSync(
    target,
    content,
    "utf8"
  );
}

function combine(target, sources, label) {
  if (fs.existsSync(abs(target))) {
    return;
  }

  const missing =
    sources.filter(
      (file) =>
        !fs.existsSync(abs(file))
    );

  if (missing.length) {
    fail(
      `Faltan CSS para ${label}: ${missing.join(", ")}`
    );
  }

  const blocks = [
`/*
 * ${MARKER}
 * ${label}
 *
 * Contenido legado preservado EN EL MISMO ORDEN DE CASCADA.
 * Esta fase consolida fuentes sin rediseñar.
 */`
  ];

  for (const cssRel of sources) {
    const content =
      fs.readFileSync(
        abs(cssRel),
        "utf8"
      ).replace(/\r\n/g, "\n");

    backup(cssRel, content);

    blocks.push(
`/* =========================================================
   SOURCE: ${path.basename(cssRel)}
   ========================================================= */

${content.trim()}
`
    );
  }

  fs.writeFileSync(
    abs(target),
    blocks.join("\n\n") +
      `\n\n/* ${MARKER}:${label}:END */\n`,
    "utf8"
  );
}

if (!fs.existsSync(abs("package.json"))) {
  fail(
    "Ejecutá este script dentro de alumni-web."
  );
}

if (!fs.existsSync(abs(PAGE))) {
  fail(
    `No encontré ${PAGE}.`
  );
}

let page =
  fs.readFileSync(
    abs(PAGE),
    "utf8"
  ).replace(/\r\n/g, "\n");

backup(PAGE, page);

/*
 * Safety:
 * legacy Feed CSS must not be referenced anywhere else,
 * including CSS @imports.
 */
const allProjectFiles =
  walk(abs("src")).filter(
    (file) =>
      /\.(tsx?|jsx?|css)$/i.test(file)
  );

const allLegacy = [
  ...BASE_SOURCES,
  ...FINAL_SOURCES,
];

for (const cssRel of allLegacy) {
  const fileName =
    path.basename(cssRel);

  const unexpected = [];

  for (const projectFile of allProjectFiles) {
    const projectRel =
      rel(projectFile);

    if (
      projectRel === PAGE ||
      projectRel === cssRel
    ) {
      continue;
    }

    const text =
      fs.readFileSync(
        projectFile,
        "utf8"
      );

    if (text.includes(fileName)) {
      unexpected.push(projectRel);
    }
  }

  if (unexpected.length) {
    fail(
      `${fileName} también se usa en: ${unexpected.join(", ")}. ` +
      "No borré nada."
    );
  }
}

combine(
  BASE_TARGET,
  BASE_SOURCES,
  "BASE"
);

combine(
  FINAL_TARGET,
  FINAL_SOURCES,
  "FINAL"
);

/*
 * Remove old local imports.
 * Keep shared media exactly between BASE and FINAL.
 */
for (const cssRel of allLegacy) {
  const fileName =
    path.basename(cssRel);

  page =
    page.replace(
      `import "./${fileName}";\n`,
      ""
    );
}

const baseImport =
  'import "./feed-consolidated-base-4-0.css";';

const finalImport =
  'import "./feed-consolidated-final-4-0.css";';

if (!page.includes(SHARED_IMPORT)) {
  fail(
    "No encontré el import compartido media-rendering-1-0.css."
  );
}

/* Remove prior consolidated imports if rerun */
page =
  page.replace(
    `${baseImport}\n`,
    ""
  );

page =
  page.replace(
    `${finalImport}\n`,
    ""
  );

/* Reinsert in exact cascade position */
page =
  page.replace(
    SHARED_IMPORT,
    `${baseImport}\n${SHARED_IMPORT}\n${finalImport}`
  );

if (!page.includes(MARKER)) {
  page +=
    `\n/* ${MARKER}:PAGE */\n`;
}

/* Parse TSX */
try {
  const ts =
    require("typescript");

  const parsed =
    ts.createSourceFile(
      PAGE,
      page,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics || [];

  if (diagnostics.length) {
    const first =
      diagnostics[0];

    fail(
      ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )
    );
  }

  console.log(
    "✅ Parser TypeScript: Feed válido"
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

fs.writeFileSync(
  abs(PAGE),
  page,
  "utf8"
);

/* Delete only after all safety checks */
const deleted = [];

for (const cssRel of allLegacy) {
  if (fs.existsSync(abs(cssRel))) {
    fs.unlinkSync(abs(cssRel));
    deleted.push(cssRel);
  }
}

console.log("");
console.log(
  "✅ FEED STYLE CONSOLIDATION 4.0 aplicada."
);
console.log(
  "✅ 8 CSS locales activos → 2 CSS consolidados."
);
console.log(
  "✅ media-rendering-1-0.css permanece compartido."
);
console.log(
  "✅ Cascada preservada: BASE → media compartida → FINAL."
);
console.log(
  "✅ Stories siguen preservadas aunque estén ocultas por producto."
);
console.log(
  `✅ CSS legacy eliminados: ${deleted.length}`
);
console.log(
  "✅ Diseño y lógica del Feed no fueron reescritos."
);
console.log("");
console.log(
  "Ahora ejecutá:"
);
console.log(
  "  npm run design:audit"
);
console.log(
  "  npm run build"
);
console.log("");
console.log(
  "NO hagas commit todavía; primero revisamos el audit."
);
