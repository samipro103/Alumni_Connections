const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_1_7_0_STORIES_HIDDEN_COMMENTS_GEIST";
const CSS_NAME = "feed-comments-messaging-font.css";

const feedPageFile = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  "page.tsx"
);

const feedPostFile = path.join(
  ROOT,
  "src",
  "components",
  "feed",
  "FeedPost.tsx"
);

const commentsFile = path.join(
  ROOT,
  "src",
  "components",
  "feed",
  "FeedCommentsSheet.tsx"
);

const cssFile = path.join(
  ROOT,
  "src",
  "app",
  "feed",
  CSS_NAME
);

for (const file of [
  feedPageFile,
  feedPostFile,
  commentsFile,
]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let feedPage = fs
  .readFileSync(feedPageFile, "utf8")
  .replace(/\r\n/g, "\n");

let feedPost = fs
  .readFileSync(feedPostFile, "utf8")
  .replace(/\r\n/g, "\n");

let comments = fs
  .readFileSync(commentsFile, "utf8")
  .replace(/\r\n/g, "\n");

console.log("✅ Archivos normalizados para Windows CRLF/LF");

if (
  feedPage.includes(MARKER) &&
  feedPost.includes(MARKER) &&
  comments.includes(MARKER) &&
  fs.existsSync(cssFile)
) {
  console.log("ℹ️ Este ajuste ya está aplicado.");
  process.exit(0);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function addImport(source, line, anchor, label) {
  if (source.includes(line)) {
    console.log(`ℹ️ ${label} ya estaba importado`);
    return source;
  }

  if (!source.includes(anchor)) {
    fail(`No encontré punto de importación: ${label}`);
  }

  console.log(`✅ ${label}`);
  return source.replace(anchor, `${anchor}\n${line}`);
}

/* ================================================================
   1) FEED: OCULTAR STORIES DE FORMA REVERSIBLE
   ================================================================ */

feedPage = addImport(
  feedPage,
  `import "./${CSS_NAME}";`,
  `import "./feed-visual-3-1.css";`,
  "CSS tipográfico de comentarios"
);

if (!feedPage.includes("const STORIES_UI_ENABLED = false;")) {
  const sizeAnchor = `const FEED_PAGE_SIZE = 30;`;

  if (!feedPage.includes(sizeAnchor)) {
    fail("No encontré FEED_PAGE_SIZE para agregar feature flag de Stories.");
  }

  feedPage = feedPage.replace(
    sizeAnchor,
    `${sizeAnchor}

/*
 * Stories queda oculto superficialmente por decisión de producto.
 * No se elimina lógica, tablas ni componentes.
 * Para reactivarlo más adelante basta cambiar este flag a true.
 */
const STORIES_UI_ENABLED = false;`
  );

  console.log("✅ Feature flag reversible de Stories agregado");
}

if (!feedPage.includes("STORIES_UI_ENABLED &&")) {
  const storiesBlockRegex =
    /(\s*)<StoriesRail\s+focusStoryId=\{searchParams\.get\("story"\)\}\s*\/>\s*<AdSenseSlot\s+placement="stories"\s*\/>/m;

  if (!storiesBlockRegex.test(feedPage)) {
    fail("No encontré el bloque StoriesRail + anuncio de Stories.");
  }

  feedPage = feedPage.replace(
    storiesBlockRegex,
    `$1{STORIES_UI_ENABLED && (
$1  <>
$1    <StoriesRail
$1      focusStoryId={searchParams.get("story")}
$1    />
$1
$1    <AdSenseSlot
$1      placement="stories"
$1    />
$1  </>
$1)}`
  );

  console.log("✅ Rail de Stories y su espacio publicitario ocultados");
}

if (!feedPage.includes(MARKER)) {
  feedPage += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   2) POST MENU: OCULTAR "COMPARTIR EN HISTORIA"
   ================================================================ */

if (!feedPost.includes("const STORIES_UI_ENABLED = false;")) {
  const helperAnchor = `function compactRepeatedLines(text: string) {`;

  if (!feedPost.includes(helperAnchor)) {
    fail("No encontré punto para feature flag en FeedPost.");
  }

  feedPost = feedPost.replace(
    helperAnchor,
    `// Stories oculto superficialmente; se conserva onStory para compatibilidad.
const STORIES_UI_ENABLED = false;

${helperAnchor}`
  );

  console.log("✅ Flag de Stories agregado al menú de publicación");
}

if (!feedPost.includes("{STORIES_UI_ENABLED && (")) {
  const storyMenuRegex =
    /(\s*)<button\s+type="button"\s+onClick=\{\(\) => \{\s*setMenuOpen\(false\);\s*onStory\(\);\s*\}\}\s*>\s*<Sparkles size=\{17\}\s*\/>\s*Compartir en historia\s*<\/button>/m;

  const match = feedPost.match(storyMenuRegex);

  if (!match) {
    fail('No encontré la acción "Compartir en historia" del menú.');
  }

  const indent = match[1] || "\n            ";
  const button = match[0].trim();

  feedPost = feedPost.replace(
    storyMenuRegex,
    `${indent}{STORIES_UI_ENABLED && (
${indent}  ${button.replace(/\n/g, "\n" + indent + "  ")}
${indent})}`
  );

  console.log('✅ "Compartir en historia" ocultado del menú del Feed');
}

if (!feedPost.includes(MARKER)) {
  feedPost += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   3) COMMENTS SHEET: MARCAR PARA TIPOGRAFÍA MENSAJERÍA
   ================================================================ */

if (!comments.includes("alumni-comments-messaging-font")) {
  const sheetClass = `className="alumni-comments-sheet"`;

  if (!comments.includes(sheetClass)) {
    fail("No encontré alumni-comments-sheet.");
  }

  comments = comments.replace(
    sheetClass,
    `className="alumni-comments-sheet alumni-comments-messaging-font"`
  );

  console.log("✅ Hoja de comentarios marcada con tipografía de Mensajería");
}

if (!comments.includes(MARKER)) {
  comments += `\n/* ${MARKER} */\n`;
}

/* ================================================================
   4) CSS: GEIST / MISMA FAMILIA QUE MENSAJERÍA
   ================================================================ */

const css = `/*
 * ${MARKER}
 *
 * Feed comments now explicitly use the same sans family that powers
 * Alumni messaging. Messaging inherits Geist from RootLayout.
 */

.alumni-feed-page .alumni-pro-comment-preview,
.alumni-feed-page .alumni-pro-comment-preview strong,
.alumni-feed-page .alumni-pro-comment-preview span,
.alumni-feed-page .alumni-pro-view-comments,
.alumni-comments-messaging-font,
.alumni-comments-messaging-font button,
.alumni-comments-messaging-font input,
.alumni-comments-messaging-font .alumni-feed-comment,
.alumni-comments-messaging-font .alumni-feed-comment-body,
.alumni-comments-messaging-font .alumni-feed-comment-body p,
.alumni-comments-messaging-font .alumni-feed-comment-body a,
.alumni-comments-messaging-font .alumni-feed-comment-body span {
  font-family:
    var(--font-geist-sans),
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif !important;
}

/* Conversational rhythm similar to Messages */
.alumni-feed-page .alumni-pro-comment-preview span,
.alumni-comments-messaging-font .alumni-feed-comment-body > p {
  font-weight: 450;
  letter-spacing: -0.01em;
}

.alumni-feed-page .alumni-pro-comment-preview strong,
.alumni-comments-messaging-font .alumni-feed-comment-body > p > a {
  font-weight: 760;
  letter-spacing: -0.012em;
}

.alumni-comments-messaging-font .alumni-feed-comment-body > p {
  font-size: 14px !important;
  line-height: 1.45 !important;
}

.alumni-comments-messaging-font .alumni-comments-composer input {
  font-size: 16px;
  line-height: 1.3;
}

/*
 * Defensive visual hide.
 * The React feature flag above is the primary mechanism.
 * This prevents a stale/hydrated Stories rail from flashing briefly.
 */
.alumni-feed-page .alumni-stories-section {
  display: none !important;
}
`;

fs.writeFileSync(cssFile, css, "utf8");

/* ================================================================
   5) VALIDAR ANTES DE ESCRIBIR TSX
   ================================================================ */

const validations = [
  [
    feedPage.includes("const STORIES_UI_ENABLED = false;"),
    "flag Stories en Feed",
  ],
  [
    feedPage.includes("STORIES_UI_ENABLED &&"),
    "rail Stories condicionado",
  ],
  [
    feedPage.includes(`import "./${CSS_NAME}";`),
    "CSS de comentarios importado",
  ],
  [
    feedPost.includes("const STORIES_UI_ENABLED = false;"),
    "flag Stories en FeedPost",
  ],
  [
    feedPost.includes("{STORIES_UI_ENABLED && ("),
    "acción Compartir en historia condicionada",
  ],
  [
    comments.includes("alumni-comments-messaging-font"),
    "tipografía de comentarios marcada",
  ],
  [
    css.includes("var(--font-geist-sans)"),
    "Geist definido en comentarios",
  ],
];

for (const [ok, label] of validations) {
  if (!ok) {
    try {
      fs.unlinkSync(cssFile);
    } catch {}
    fail(`Validación final: ${label}`);
  }
}

fs.writeFileSync(feedPageFile, feedPage, "utf8");
fs.writeFileSync(feedPostFile, feedPost, "utf8");
fs.writeFileSync(commentsFile, comments, "utf8");

console.log("");
console.log("✅ ALUMNI 1.7.0 aplicado COMPLETO.");
console.log("✅ Stories oculto superficialmente.");
console.log("✅ Rail de Stories oculto.");
console.log("✅ Compartir en historia oculto.");
console.log("✅ Lógica y base de Stories conservadas.");
console.log("✅ Comentarios del Feed usan Geist como Mensajería.");
console.log("✅ Vista previa + hoja completa + input de comentarios unificados.");
console.log("✅ Ajuste reversible y mobile-first.");
console.log("");
console.log("Ahora ejecutá: npm run build");
