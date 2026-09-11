const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILE = path.join(
  ROOT,
  "src",
  "app",
  "settings",
  "page.tsx"
);

const MARKER =
  "ALUMNI_SETTINGS_2_0_1_CHECK_IMPORT_HOTFIX";

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(FILE)) {
  fail(
    "No encontré src/app/settings/page.tsx. " +
    "Ejecutá este parche desde alumni-web."
  );
}

let source = fs
  .readFileSync(FILE, "utf8")
  .replace(/\r\n/g, "\n");

if (source.includes(MARKER)) {
  console.log(
    "✅ Settings 2.0.1 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !source.includes(
    "ALUMNI_SETTINGS_2_0_INTERIORES_LIMPIOS"
  )
) {
  fail(
    "Settings 2.0 no parece estar aplicado. " +
    "No haré cambios sobre una base distinta."
  );
}

const lucideStart = source.indexOf(
  'import {'
);

const lucideEnd = source.indexOf(
  '} from "lucide-react";',
  lucideStart
);

if (
  lucideStart < 0 ||
  lucideEnd < 0
) {
  fail(
    "No encontré el import de lucide-react."
  );
}

const importBlock = source.slice(
  lucideStart,
  lucideEnd +
    '} from "lucide-react";'.length
);

if (!/\bCheck\b/.test(importBlock)) {
  const match =
    importBlock.match(
      /import \{\n/
    );

  if (!match) {
    fail(
      "El import de lucide-react tiene una estructura inesperada."
    );
  }

  const nextBlock =
    importBlock.replace(
      "import {\n",
      "import {\n  Check,\n"
    );

  source = source.replace(
    importBlock,
    nextBlock
  );

  console.log(
    "✅ Import Check agregado a lucide-react"
  );
} else {
  console.log(
    "✅ Check ya estaba importado"
  );
}

source +=
  `\n/* ${MARKER} */\n`;

try {
  const ts = require("typescript");

  const parsed =
    ts.createSourceFile(
      "settings/page.tsx",
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
      "settings/page.tsx quedó con sintaxis inválida" +
      (
        pos
          ? ` en línea ${pos.line + 1}, columna ${pos.character + 1}`
          : ""
      ) +
      ": " +
      message
    );
  }

  console.log(
    "✅ Parser TypeScript: settings/page.tsx válido"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

const backup =
  FILE +
  ".before-settings-2.0.1.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    FILE,
    backup
  );
}

fs.writeFileSync(
  FILE,
  source,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Settings 2.0.1 aplicado."
);
console.log(
  "✅ Check importado correctamente."
);
console.log(
  "✅ No se modificó diseño ni lógica."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
