const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const FILE =
  "src/components/feed/FeedPost.tsx";
const MARKER =
  "ALUMNI_CAROUSEL_SWIPE_GUARD_1_0";

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
    "✅ Carousel Swipe Guard 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   Add gesture refs inside FeedImage
   ========================================================= */

const loadedState = `  const [loaded, setLoaded] =
    useState(!shouldLoad || !src);`;

const loadedStateNext = `  const [loaded, setLoaded] =
    useState(!shouldLoad || !src);

  const pointerStartRef = useRef<{
    id: number;
    x: number;
    y: number;
  } | null>(null);

  const pointerMovedRef =
    useRef(false);`;

if (!source.includes(loadedState)) {
  fail(
    "No encontré el estado loaded de FeedImage."
  );
}

source = source.replace(
  loadedState,
  loadedStateNext
);

/* =========================================================
   Replace direct pointerup with swipe-aware gesture
   ========================================================= */

const directPointer = `      onPointerUp={onPointerUp}
      aria-label="Abrir fotografía"`;

const guardedPointer = `      onPointerDown={(event) => {
        pointerStartRef.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };

        pointerMovedRef.current = false;
      }}
      onPointerMove={(event) => {
        const start =
          pointerStartRef.current;

        if (
          !start ||
          start.id !==
            event.pointerId
        ) {
          return;
        }

        const distance =
          Math.hypot(
            event.clientX -
              start.x,
            event.clientY -
              start.y
          );

        if (distance > 10) {
          pointerMovedRef.current =
            true;
        }
      }}
      onPointerCancel={() => {
        pointerStartRef.current =
          null;
        pointerMovedRef.current =
          false;
      }}
      onPointerUp={(event) => {
        const start =
          pointerStartRef.current;

        const distance =
          start &&
          start.id ===
            event.pointerId
            ? Math.hypot(
                event.clientX -
                  start.x,
                event.clientY -
                  start.y
              )
            : 0;

        const wasSwipe =
          pointerMovedRef.current ||
          distance > 10;

        pointerStartRef.current =
          null;
        pointerMovedRef.current =
          false;

        if (wasSwipe) {
          return;
        }

        onPointerUp();
      }}
      aria-label="Abrir fotografía"`;

if (!source.includes(directPointer)) {
  fail(
    "No encontré el onPointerUp directo de FeedImage."
  );
}

source = source.replace(
  directPointer,
  guardedPointer
);

source += `\n/* ${MARKER} */\n`;

/* =========================================================
   Validate
   ========================================================= */

if (
  !source.includes(
    "const wasSwipe ="
  ) ||
  !source.includes(
    "distance > 10"
  )
) {
  fail(
    "Validación: el guard de swipe no quedó aplicado."
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
    "✅ Parser TypeScript: FeedPost válido"
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
  ".before-carousel-swipe-guard-1.0.bak";

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
  "✅ ALUMNI Carousel Swipe Guard 1.0 aplicado."
);
console.log(
  "✅ Swipe horizontal ya no abre accidentalmente la foto."
);
console.log(
  "✅ Tap real sigue abriendo el visor."
);
console.log(
  "✅ Doble tap sigue funcionando."
);
console.log(
  "✅ Carrusel y scroll-snap no fueron modificados."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
