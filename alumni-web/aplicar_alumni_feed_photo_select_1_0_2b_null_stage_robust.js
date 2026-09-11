const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_2B_NULL_STAGE_ROBUST";

const candidates = [
  "src/components/feed/ImageCropEditor.tsx",
  "files/src/components/feed/ImageCropEditor.tsx",
  "payload/src/components/feed/ImageCropEditor.tsx",
];

function abs(rel) {
  return path.join(ROOT, rel);
}

function patchOne(rel) {
  const file = abs(rel);

  if (!fs.existsSync(file)) {
    console.log(`ℹ️ No existe: ${rel}`);
    return;
  }

  let source = fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");

  if (source.includes(MARKER)) {
    console.log(`ℹ️ Ya corregido: ${rel}`);
    return;
  }

  if (
    source.includes("const stage = node;") &&
    source.includes("stage.getBoundingClientRect()")
  ) {
    console.log(`✅ Ya usa referencia estable: ${rel}`);
    return;
  }

  const hasNode =
    source.includes("const node") &&
    source.includes("stageRef.current");

  const hasNullableUse =
    source.includes("node.getBoundingClientRect()");

  if (!hasNode || !hasNullableUse) {
    console.log(
      `ℹ️ Sin patrón nullable relevante, se omite: ${rel}`
    );
    return;
  }

  /*
   * Inserta una referencia estable después del guard de node.
   * Soporta distintos formatos/espaciados.
   */
  const guardPatterns = [
    /(const node\s*=\s*stageRef\.current;\s*\n\s*if\s*\(\s*!node\s*\)\s*\{\s*\n\s*return;\s*\n\s*\}\s*)/m,
    /(const node\s*=\s*stageRef\.current;\s*\n\s*if\s*\(\s*!node\s*\)\s*return;\s*)/m,
  ];

  let inserted = false;

  for (const pattern of guardPatterns) {
    if (pattern.test(source)) {
      source = source.replace(
        pattern,
        `$1\n    const stage = node;\n`
      );
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    console.log(
      `⚠️ No pude ubicar el guard de node en ${rel}; se omite sin abortar.`
    );
    return;
  }

  source = source.replaceAll(
    "node.getBoundingClientRect()",
    "stage.getBoundingClientRect()"
  );

  source = source.replaceAll(
    "observer.observe(node)",
    "observer.observe(stage)"
  );

  source += `\n/* ${MARKER} */\n`;

  try {
    const ts = require("typescript");

    const parsed = ts.createSourceFile(
      rel,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first = diagnostics[0];

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

      console.error(
        `❌ ${rel}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
      process.exit(1);
    }
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
    file +
    ".before-feed-photo-select-1.0.2b.bak";

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
  }

  fs.writeFileSync(
    file,
    source,
    "utf8"
  );

  console.log(`✅ Corregido: ${rel}`);
}

for (const rel of candidates) {
  patchOne(rel);
}

console.log("");
console.log(
  "✅ ALUMNI Feed Photo Select 1.0.2B finalizado."
);
console.log(
  "✅ Las copias con patrón nullable fueron corregidas."
);
console.log(
  "✅ Las copias con otra estructura ya no abortan el parche."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
