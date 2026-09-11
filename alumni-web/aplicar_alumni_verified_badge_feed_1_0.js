const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const FEED_PAGE =
  "src/app/feed/page.tsx";
const FEED_POST =
  "src/components/feed/FeedPost.tsx";
const FEED_CSS =
  "src/app/feed/feed-pro.css";
const MARKER =
  "ALUMNI_VERIFIED_BADGE_FEED_1_0";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(`No encontré ${rel}. Ejecutá este parche dentro de alumni-web.`);
  }

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const target =
    abs(rel) +
    ".before-verified-badge-feed-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

function replaceAllExact(source, before, after, label) {
  if (!source.includes(before)) {
    fail(`No encontré el bloque esperado: ${label}`);
  }

  return source.split(before).join(after);
}

const feedPageOriginal =
  read(FEED_PAGE);
const feedPostOriginal =
  read(FEED_POST);
const feedCssOriginal =
  read(FEED_CSS);

if (
  feedPageOriginal.includes(MARKER) &&
  feedPostOriginal.includes(MARKER)
) {
  console.log(
    "✅ Verified Badge Feed 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

let feedPage = feedPageOriginal;
let feedPost = feedPostOriginal;
let feedCss = feedCssOriginal;

/* =========================================================
   Legacy profile selects
   ========================================================= */

feedPage = replaceAllExact(
  feedPage,
  `"id,username,full_name,avatar_url,university,education_institution_name,education_program_name,career,city,country,residence_country_code"`,
  `"id,username,full_name,avatar_url,university,education_institution_name,education_program_name,career,city,country,residence_country_code,is_verified"`,
  "legacy profile selects"
);

feedPage = replaceAllExact(
  feedPage,
  `"id,username,avatar_url,full_name,university,education_institution_name,education_program_name,career,city,country,residence_country_code"`,
  `"id,username,avatar_url,full_name,university,education_institution_name,education_program_name,career,city,country,residence_country_code,is_verified"`,
  "legacy author select"
);

feedPage = replaceAllExact(
  feedPage,
  `"id,username,full_name,avatar_url,university,career"`,
  `"id,username,full_name,avatar_url,university,career,is_verified"`,
  "social profile select"
);

feedPage += `\n/* ${MARKER} */\n`;

/* =========================================================
   Feed post icon import
   ========================================================= */

feedPost = replaceAllExact(
  feedPost,
  `  Bookmark,
  Check,`,
  `  BadgeCheck,
  Bookmark,
  Check,`,
  "BadgeCheck import"
);

/* =========================================================
   Main author verified badge
   ========================================================= */

feedPost = replaceAllExact(
  feedPost,
  `            >
              @{post.profiles?.username || "alumni"}
            </Link>
            <span>·</span>`,
  `            >
              @{post.profiles?.username || "alumni"}
            </Link>
            {post.profiles?.is_verified && (
              <BadgeCheck
                size={15}
                className="alumni-pro-verified-badge"
                aria-label="Cuenta verificada"
              />
            )}
            <span>·</span>`,
  "verified badge autor principal"
);

/* =========================================================
   Repost author badge
   ========================================================= */

feedPost = replaceAllExact(
  feedPost,
  `          >
            @{post.latestRepostProfile.username}
          </Link>
          <span>compartió</span>`,
  `          >
            @{post.latestRepostProfile.username}
          </Link>
          {post.latestRepostProfile?.is_verified && (
            <BadgeCheck
              size={13}
              className="alumni-pro-verified-badge"
              aria-label="Cuenta verificada"
            />
          )}
          <span>compartió</span>`,
  "verified badge repost"
);

/* =========================================================
   Latest comment badge
   ========================================================= */

feedPost = replaceAllExact(
  feedPost,
  `          <strong>
            @{latestComment.profile?.username || "usuario"}
          </strong>
          <span>{latestComment.content}</span>`,
  `          <strong>
            @{latestComment.profile?.username || "usuario"}
          </strong>
          {latestComment.profile?.is_verified && (
            <BadgeCheck
              size={13}
              className="alumni-pro-verified-badge"
              aria-label="Cuenta verificada"
            />
          )}
          <span>{latestComment.content}</span>`,
  "verified badge comentario preview"
);

feedPost += `\n/* ${MARKER} */\n`;

/* =========================================================
   CSS
   ========================================================= */

if (!feedCss.includes(MARKER)) {
  feedCss += `

/* ${MARKER} */

.alumni-pro-verified-badge {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: -0.12em;
  color: var(--app-accent);
  stroke-width: 2.35;
}

.alumni-pro-author > div .alumni-pro-verified-badge,
.alumni-pro-repost-label .alumni-pro-verified-badge {
  margin-inline: 1px;
}

.alumni-pro-comment-preview .alumni-pro-verified-badge {
  margin-left: -2px;
  margin-right: 1px;
}
`;
}

/* =========================================================
   Parse TSX
   ========================================================= */

try {
  const ts = require("typescript");

  for (const [rel, content] of [
    [FEED_PAGE, feedPage],
    [FEED_POST, feedPost],
  ]) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first = diagnostics[0];
      const msg =
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
          (pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : "") +
          `: ${msg}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: archivos válidos"
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

/* =========================================================
   Write
   ========================================================= */

backup(
  FEED_PAGE,
  feedPageOriginal
);
backup(
  FEED_POST,
  feedPostOriginal
);
backup(
  FEED_CSS,
  feedCssOriginal
);

fs.writeFileSync(
  abs(FEED_PAGE),
  feedPage,
  "utf8"
);
fs.writeFileSync(
  abs(FEED_POST),
  feedPost,
  "utf8"
);
fs.writeFileSync(
  abs(FEED_CSS),
  feedCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Verified Badge Feed 1.0 aplicado."
);
console.log(
  "✅ Usuarios verificados muestran check en el Feed."
);
console.log(
  "✅ Reposts y preview de comentarios también lo muestran."
);
console.log(
  "✅ Revocar verificación lo oculta automáticamente."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
