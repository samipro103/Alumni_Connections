const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_2_NULL_STAGE_HOTFIX";

const candidateFiles = [
  "src/components/feed/ImageCropEditor.tsx",
  "files/src/components/feed/ImageCropEditor.tsx",
  "payload/src/components/feed/ImageCropEditor.tsx",
];

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function patchFile(rel) {
  const file = abs(rel);

  if (!fs.existsSync(file)) {
    console.log(`ℹ️ No existe: ${rel}`);
    return false;
  }

  let source = fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");

  if (source.includes(MARKER)) {
    console.log(`ℹ️ Ya corregido: ${rel}`);
    return false;
  }

  const oldBlock = `  useEffect(() => {
    const node =
      stageRef.current;

    if (!node) {
      return;
    }

    function measure() {
      const rect =
        node.getBoundingClientRect();

      setViewport({
        width:
          Math.max(
            1,
            rect.width
          ),
        height:
          Math.max(
            1,
            rect.height
          ),
      });
    }

    measure();

    const observer =
      new ResizeObserver(
        measure
      );

    observer.observe(
      node
    );

    return () =>
      observer.disconnect();
  }, []);`;

  const newBlock = `  useEffect(() => {
    const node =
      stageRef.current;

    if (!node) {
      return;
    }

    const stage = node;

    function measure() {
      const rect =
        stage.getBoundingClientRect();

      setViewport({
        width:
          Math.max(
            1,
            rect.width
          ),
        height:
          Math.max(
            1,
            rect.height
          ),
      });
    }

    measure();

    const observer =
      new ResizeObserver(
        measure
      );

    observer.observe(
      stage
    );

    return () =>
      observer.disconnect();
  }, []);`;

  if (!source.includes(oldBlock)) {
    if (
      source.includes(
        "const stage = node;"
      ) &&
      source.includes(
        "stage.getBoundingClientRect()"
      )
    ) {
      console.log(`ℹ️ Ya usa referencia estable: ${rel}`);
      return false;
    }

    fail(
      `No encontré el bloque esperado en ${rel}. No escribí cambios.`
    );
  }

  source = source.replace(
    oldBlock,
    newBlock
  );

  source +=
    `\n/* ${MARKER} */\n`;

  try {
    const ts = require("typescript");

    const parsed =
      ts.createSourceFile(
        rel,
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
        `${rel}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
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
    ".before-feed-photo-select-1.0.2.bak";

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(
      file,
      backup
    );
  }

  fs.writeFileSync(
    file,
    source,
    "utf8"
  );

  console.log(`✅ Corregido: ${rel}`);
  return true;
}

let changed = 0;

for (const rel of candidateFiles) {
  if (patchFile(rel)) {
    changed += 1;
  }
}

if (changed === 0) {
  console.log(
    "✅ No había copias activas pendientes de este fix."
  );
}

console.log("");
console.log(
  "✅ ALUMNI Feed Photo Select 1.0.2 aplicado."
);
console.log(
  "✅ TypeScript ya puede garantizar que el stage no es null."
);
console.log(
  "✅ No se tocaron carpetas .alumni_backups."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
