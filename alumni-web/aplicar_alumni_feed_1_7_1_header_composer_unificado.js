const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_FEED_1_7_1_HEADER_COMPOSER_UNIFICADO";

const TOPBAR =
  "src/components/layout/TopBar.tsx";
const FEED_CSS =
  "src/app/feed/feed-visual-3-1.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  const file = abs(rel);

  if (!fs.existsSync(file)) {
    fail(
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel) {
  const source = abs(rel);
  const target =
    source +
    ".before-feed-1.7.1.bak";

  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
}

let topbar = read(TOPBAR);
let feedCss = read(FEED_CSS);

if (
  topbar.includes(MARKER) &&
  feedCss.includes(MARKER)
) {
  console.log(
    "✅ ALUMNI Feed 1.7.1 ya estaba aplicado."
  );
  process.exit(0);
}

/* ---------------------------------------------------------
   1. Marcar el TopBar para poder unirlo visualmente
      SOLO cuando la pantalla actual es /feed.
   --------------------------------------------------------- */

if (
  !topbar.includes(
    'data-alumni-topbar="true"'
  )
) {
  const oldHeader =
    '<header className="fixed inset-x-0 top-0';

  const newHeader =
    '<header data-alumni-topbar="true" className="fixed inset-x-0 top-0';

  if (!topbar.includes(oldHeader)) {
    fail(
      "No encontré el header principal de TopBar.tsx. No escribí cambios."
    );
  }

  topbar = topbar.replace(
    oldHeader,
    newHeader
  );
}

/* ---------------------------------------------------------
   2. Capa visual móvil:
      - elimina los 16px que quedaron donde estaban Stories;
      - Feed pasa a ancho completo dentro del viewport;
      - elimina redondeo/borde superior de la antigua tarjeta;
      - TopBar + Composer comparten la misma superficie;
      - Dark/Light usan únicamente variables.
   --------------------------------------------------------- */

const cssPatch = `

/* ================================================================
   ${MARKER}
   Stories ocultas: Header + Composer = un solo bloque en móvil.
   ================================================================ */

@media (max-width: 699px) {
  /*
   * AppShell deja 16px entre el final del TopBar y el contenido.
   * Cuando Stories existía ese aire era útil; sin Stories se ve
   * como un hueco. Lo recuperamos únicamente para /feed.
   */
  .alumni-feed-page.alumni-feed-pro {
    width: calc(100% + 32px) !important;
    max-width: none !important;
    margin:
      -16px -16px 0 !important;

    border-top: 0 !important;
    border-right: 0 !important;
    border-left: 0 !important;
    border-radius: 0 !important;

    background:
      var(--app-surface) !important;
    box-shadow: none !important;
  }

  /*
   * El TopBar y el inicio del Feed pasan a sentirse como la misma
   * superficie. No afecta ninguna otra ruta.
   */
  body:has(.alumni-feed-page)
    [data-alumni-topbar="true"] {
    border-bottom-color:
      transparent !important;

    background:
      color-mix(
        in srgb,
        var(--app-surface) 99%,
        transparent
      ) !important;

    box-shadow: none !important;
  }

  /*
   * El compositor ocupa directamente el lugar donde antes comenzaba
   * Stories. Sin tarjeta flotante, sin doble borde, sin hueco.
   */
  .alumni-feed-page
    .alumni-pro-composer {
    margin: 0 !important;
    padding:
      12px 16px 13px !important;

    border-top: 0 !important;
    border-bottom:
      1px solid
      var(--app-border) !important;

    border-radius: 0 !important;
    background:
      var(--app-surface) !important;
    box-shadow: none !important;
  }

  /*
   * Los tabs continúan inmediatamente después del compositor,
   * formando una sola cabecera funcional del Feed.
   */
  .alumni-feed-page
    .alumni-pro-feed-tabs {
    margin: 0 !important;
    background:
      var(--app-surface) !important;
  }
}

/*
 * Seguridad explícita de los dos temas.
 * No hay blancos/negros hardcodeados en el chrome del Feed.
 */
html[data-theme="dark"]
  body:has(.alumni-feed-page)
  [data-alumni-topbar="true"],
html[data-theme="dark"]
  .alumni-feed-page.alumni-feed-pro,
html[data-theme="dark"]
  .alumni-feed-page
  .alumni-pro-composer {
  background:
    var(--app-surface) !important;
}

html[data-theme="light"]
  body:has(.alumni-feed-page)
  [data-alumni-topbar="true"],
html[data-theme="light"]
  .alumni-feed-page.alumni-feed-pro,
html[data-theme="light"]
  .alumni-feed-page
  .alumni-pro-composer {
  background:
    var(--app-surface) !important;
}

/* ${MARKER} */
`;

feedCss += cssPatch;
topbar +=
  `\n/* ${MARKER} */\n`;

/* ---------------------------------------------------------
   3. Validación TSX antes de escribir
   --------------------------------------------------------- */

try {
  const ts = require("typescript");

  const parsed =
    ts.createSourceFile(
      TOPBAR,
      topbar,
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
        ? parsed
            .getLineAndCharacterOfPosition(
              first.start
            )
        : null;

    fail(
      `TopBar.tsx quedó inválido` +
      (
        pos
          ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
          : ""
      ) +
      `: ${message}`
    );
  }

  console.log(
    "✅ Parser TypeScript: TopBar válido"
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

if (
  !topbar.includes(
    'data-alumni-topbar="true"'
  )
) {
  fail(
    "Validación: TopBar no quedó marcado."
  );
}

if (
  !feedCss.includes(
    "margin:\n      -16px -16px 0"
  )
) {
  fail(
    "Validación: no quedó aplicado el cierre del hueco móvil."
  );
}

/* ---------------------------------------------------------
   4. Backup + escritura
   --------------------------------------------------------- */

backup(TOPBAR);
backup(FEED_CSS);

fs.writeFileSync(
  abs(TOPBAR),
  topbar,
  "utf8"
);

fs.writeFileSync(
  abs(FEED_CSS),
  feedCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Feed 1.7.1 aplicado."
);
console.log(
  "✅ Eliminado el hueco que dejó Stories."
);
console.log(
  "✅ Logo/TopBar + compositor se sienten como un solo bloque."
);
console.log(
  "✅ Feed móvil ahora inicia pegado al header."
);
console.log(
  "✅ Sin bordes/redondeos superiores sobrantes."
);
console.log(
  "✅ Dark / Light preservados."
);
console.log(
  "✅ Escritorio no cambia."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
