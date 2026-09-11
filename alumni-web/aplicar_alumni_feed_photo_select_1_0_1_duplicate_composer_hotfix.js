const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_PHOTO_SELECT_1_0_1_DUPLICATE_COMPOSER_HOTFIX";

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
]);

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function walk(dir, matches = []) {
  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    if (
      entry.isDirectory() &&
      SKIP_DIRS.has(entry.name)
    ) {
      continue;
    }

    const full = path.join(
      dir,
      entry.name
    );

    if (entry.isDirectory()) {
      walk(full, matches);
      continue;
    }

    if (
      entry.isFile() &&
      entry.name ===
        "PostComposer.tsx"
    ) {
      matches.push(full);
    }
  }

  return matches;
}

const files = walk(ROOT);

if (!files.length) {
  fail(
    "No encontré ningún PostComposer.tsx dentro del proyecto."
  );
}

console.log(
  `✅ Encontradas ${files.length} copia(s) de PostComposer.tsx`
);

const oldEditorCall = `      {currentCropFile && currentCropIndex >= 0 && (
        <ImageCropEditor
          file={currentCropFile}
          position={Math.max(
            1,
            previews
              .filter((item) => item.file.type.startsWith("image/"))
              .findIndex((item) => item.file === currentCropFile) + 1
          )}
          total={
            previews.filter((item) => item.file.type.startsWith("image/"))
              .length
          }
          onApply={applyCrop}
          onSkip={skipCrop}
          onClose={() => setCropQueue([])}
        />
      )}`;

const newEditorCall = `      {currentCropFile && (
        <ImageCropEditor
          file={currentCropFile}
          onApply={applyCrop}
          onAddMore={() =>
            inputRef.current?.click()
          }
          onClose={() =>
            setCropQueue([])
          }
        />
      )}`;

const oldIndexBlock = `  const currentCropFile = cropQueue[0] || null;
  const currentCropIndex = currentCropFile
    ? mediaFiles.indexOf(currentCropFile)
    : -1;
`;

const newIndexBlock = `  const currentCropFile = cropQueue[0] || null;
`;

const oldSkipFunction = `  function skipCrop() {
    setCropQueue((currentQueue) => currentQueue.slice(1));
  }

`;

let changed = 0;
let alreadyClean = 0;

for (const file of files) {
  let source = fs
    .readFileSync(
      file,
      "utf8"
    )
    .replace(/\r\n/g, "\n");

  const rel =
    path.relative(ROOT, file);

  const usesOldProps =
    source.includes(
      "position={Math.max("
    ) ||
    source.includes(
      "onSkip={skipCrop}"
    ) ||
    source.includes(
      "currentCropIndex >= 0"
    );

  const alreadyNew =
    source.includes(
      "onAddMore={() =>"
    ) &&
    !usesOldProps;

  if (alreadyNew) {
    console.log(
      `ℹ️ Ya limpia: ${rel}`
    );
    alreadyClean += 1;
    continue;
  }

  if (!usesOldProps) {
    console.log(
      `ℹ️ Sin llamada antigua: ${rel}`
    );
    continue;
  }

  if (
    source.includes(
      oldEditorCall
    )
  ) {
    source = source.replace(
      oldEditorCall,
      newEditorCall
    );
  } else {
    /*
     * Fallback robusto para copias con formato ligeramente distinto.
     * Reemplaza únicamente el bloque <ImageCropEditor ... /> que todavía
     * contenga las props antiguas.
     */
    const pattern =
      /\{currentCropFile\s*&&\s*currentCropIndex\s*>=\s*0\s*&&\s*\(\s*<ImageCropEditor[\s\S]*?onSkip=\{skipCrop\}[\s\S]*?onClose=\{\(\)\s*=>\s*setCropQueue\(\[\]\)\}[\s\S]*?\/>\s*\)\}/m;

    if (!pattern.test(source)) {
      fail(
        `Encontré props antiguas en ${rel}, pero el bloque tiene una estructura inesperada.`
      );
    }

    source = source.replace(
      pattern,
      newEditorCall.trim()
    );
  }

  if (
    source.includes(
      oldIndexBlock
    )
  ) {
    source = source.replace(
      oldIndexBlock,
      newIndexBlock
    );
  } else {
    source = source.replace(
      /\n\s*const currentCropIndex = currentCropFile[\s\S]*?: -1;\n/m,
      "\n"
    );
  }

  source = source.replace(
    oldSkipFunction,
    ""
  );

  /*
   * Si esta copia todavía conserva Crop import + botón Ajustar,
   * no lo tocamos aquí salvo que sea necesario para compilar.
   * Este hotfix se limita al contrato del editor nuevo.
   */

  if (
    source.includes(
      "position={Math.max("
    ) ||
    source.includes(
      "onSkip={skipCrop}"
    ) ||
    source.includes(
      "currentCropIndex >= 0"
    )
  ) {
    fail(
      `Validación falló en ${rel}: todavía quedan props antiguas del editor.`
    );
  }

  if (
    !source.includes(
      "onAddMore"
    )
  ) {
    fail(
      `Validación falló en ${rel}: no quedó onAddMore.`
    );
  }

  try {
    const ts =
      require("typescript");

    const parsed =
      ts.createSourceFile(
        rel,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics ||
      [];

    if (diagnostics.length) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start ===
        "number"
          ? parsed
              .getLineAndCharacterOfPosition(
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
        typeof error ===
          "object" &&
        error.code ===
          "MODULE_NOT_FOUND"
      )
    ) {
      throw error;
    }
  }

  const backup =
    file +
    ".before-feed-photo-select-1.0.1.bak";

  if (
    !fs.existsSync(
      backup
    )
  ) {
    fs.copyFileSync(
      file,
      backup
    );
  }

  source +=
    `\n/* ${MARKER} */\n`;

  fs.writeFileSync(
    file,
    source,
    "utf8"
  );

  console.log(
    `✅ Corregida: ${rel}`
  );

  changed += 1;
}

if (
  changed === 0 &&
  alreadyClean === 0
) {
  fail(
    "No encontré ninguna copia compatible para corregir."
  );
}

console.log("");
console.log(
  "✅ Feed Photo Select 1.0.1 aplicado."
);
console.log(
  `✅ Copias corregidas: ${changed}`
);
console.log(
  `✅ Copias que ya estaban limpias: ${alreadyClean}`
);
console.log(
  "✅ Eliminadas props antiguas position / total / onSkip."
);
console.log(
  "✅ Todas usan ahora onAddMore + onApply + onClose."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
