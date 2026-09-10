const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_MEDIA_RENDERING_1_0_1_FEED_CLEAN_EDGES";

const feedPostPath = path.join(
  ROOT,
  "src",
  "components",
  "feed",
  "FeedPost.tsx"
);

const cssPath = path.join(
  ROOT,
  "src",
  "app",
  "media-rendering-1-0.css"
);

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

for (const file of [
  feedPostPath,
  cssPath,
]) {
  if (!fs.existsSync(file)) {
    fail(
      "No encontré " +
      path.relative(ROOT, file) +
      ". Ejecutá este parche desde alumni-web."
    );
  }
}

let feedPost = fs
  .readFileSync(feedPostPath, "utf8")
  .replace(/\r\n/g, "\n");

let css = fs
  .readFileSync(cssPath, "utf8")
  .replace(/\r\n/g, "\n");

if (
  feedPost.includes(MARKER) &&
  css.includes(MARKER)
) {
  console.log(
    "✅ Media Rendering 1.0.1 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !feedPost.includes(
    "ALUMNI_MEDIA_RENDERING_1_0_INSTAGRAM_LEVEL"
  )
) {
  fail(
    "FeedPost no parece tener Media Rendering 1.0. " +
    "No haré cambios sobre una base distinta."
  );
}

if (
  !css.includes(
    "ALUMNI_MEDIA_RENDERING_1_0_INSTAGRAM_LEVEL"
  )
) {
  fail(
    "media-rendering-1-0.css no parece ser la versión esperada."
  );
}

const backdropBlock = `      {contain && src && (
        <img
          className="alumni-feed-image-backdrop"
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}

`;

if (feedPost.includes(backdropBlock)) {
  feedPost = feedPost.replace(
    backdropBlock,
    ""
  );

  console.log(
    "✅ Backdrop borroso eliminado del Feed"
  );
} else if (
  feedPost.includes(
    'className="alumni-feed-image-backdrop"'
  )
) {
  fail(
    "Encontré el backdrop del Feed, pero su estructura cambió. " +
    "No escribí nada para evitar romper el componente."
  );
} else {
  console.log(
    "✅ El Feed ya no tenía markup de backdrop"
  );
}

const override = `

/* =========================================================
   MEDIA 1.0.1 — FEED CLEAN EDGES
   Sin esquinas grises / sin backdrop / imagen completa
   ========================================================= */

.alumni-feed-page
  .alumni-pro-media-shell,
.alumni-feed-page
  .alumni-pro-carousel,
.alumni-feed-page
  .alumni-pro-media-slide,
.alumni-feed-page
  .alumni-pro-image-button {
  background: #05070b !important;
  background-image: none !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

.alumni-feed-page
  .alumni-pro-media-shell,
.alumni-feed-page
  .alumni-pro-media-slide,
.alumni-feed-page
  .alumni-pro-image-button {
  border-radius: 0 !important;
}

.alumni-feed-page
  .alumni-pro-image-button::before,
.alumni-feed-page
  .alumni-pro-image-button::after,
.alumni-feed-page
  .alumni-pro-media-slide::before,
.alumni-feed-page
  .alumni-pro-media-slide::after {
  content: none !important;
  display: none !important;
}

.alumni-feed-page
  .alumni-feed-image-backdrop {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.alumni-feed-page
  .alumni-feed-image-main,
.alumni-feed-page
  .alumni-pro-image-button[data-fit="cover"]
  .alumni-feed-image-main,
.alumni-feed-page
  .alumni-pro-image-button[data-fit="contain"]
  .alumni-feed-image-main {
  position: relative !important;
  z-index: 2;
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: none !important;
  object-fit: contain !important;
  object-position: center center !important;
  background: #05070b !important;
  filter: none !important;
  transform: none !important;
}

/* ${MARKER} */
`;

css += override;
feedPost +=
  `\n/* ${MARKER} */\n`;

try {
  const ts = require("typescript");

  const parsed = ts.createSourceFile(
    "FeedPost.tsx",
    feedPost,
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

    fail(
      "FeedPost.tsx quedó con sintaxis inválida" +
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
    "✅ Parser TypeScript: FeedPost.tsx válido"
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

for (const file of [
  feedPostPath,
  cssPath,
]) {
  const backup =
    file +
    ".before-media-rendering-1.0.1.bak";

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
  }
}

fs.writeFileSync(
  feedPostPath,
  feedPost,
  "utf8"
);

fs.writeFileSync(
  cssPath,
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Media Rendering 1.0.1 aplicado."
);
console.log(
  "✅ Feed: sin backdrop gris/borroso."
);
console.log(
  "✅ Feed: fotos completas, centradas y sin deformar."
);
console.log(
  "✅ Feed: conserva frames 4:5 / 1:1 / 4:3 / 16:9."
);
console.log(
  "✅ Perfil propio: NO modificado."
);
console.log(
  "✅ Perfil público: NO modificado."
);
console.log(
  "✅ Guardados: NO modificado."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
