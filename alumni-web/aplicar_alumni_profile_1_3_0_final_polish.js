const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_3_0_FINAL_POLISH";

const PROFILE = path.join(
  ROOT,
  "src",
  "app",
  "profile",
  "page.tsx"
);

const SOCIALS = path.join(
  ROOT,
  "src",
  "components",
  "profile",
  "ProfileSocialLinks.tsx"
);

const CSS = path.join(
  ROOT,
  "src",
  "app",
  "profile",
  "profile-launch-final-polish-1-3-0.css"
);

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(
      "No encontré " +
        path.relative(ROOT, file) +
        ". Ejecutá este parche dentro de alumni-web."
    );
  }

  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function backup(file) {
  const bak = file + ".before-profile-1.3.0.bak";
  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
  }
}

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail("No encontré " + label + ".");
  }

  return source.replace(before, after);
}

let profile = read(PROFILE);
let socials = read(SOCIALS);

console.log("✅ /profile detectado");
console.log("✅ ProfileSocialLinks detectado");
console.log("✅ CRLF/LF normalizado");

if (
  profile.includes(MARKER) &&
  socials.includes(MARKER) &&
  fs.existsSync(CSS)
) {
  console.log("ℹ️ Profile 1.3.0 ya está aplicado.");
  process.exit(0);
}

/* =========================================================
   0) REQUIRE EXISTING OPTION 3 STRUCTURE
   ========================================================= */

if (!profile.includes("alumni-profile-launch")) {
  fail(
    "No encontré la estructura launch del perfil. " +
    "Aplicá primero ALUMNI_PROFILE_1_2_0B_LAUNCH_MATCH_OPCION_3."
  );
}

if (!profile.includes('import "./profile-option-3-launch.css";')) {
  fail(
    "No encontré profile-option-3-launch.css. " +
    "Aplicá primero el parche base de Perfil Opción 3."
  );
}

/* =========================================================
   1) Import polish CSS
   ========================================================= */

if (!profile.includes('import "./profile-launch-final-polish-1-3-0.css";')) {
  profile = profile.replace(
    'import "./profile-option-3-launch.css";',
    'import "./profile-option-3-launch.css";\nimport "./profile-launch-final-polish-1-3-0.css";'
  );
}

/* =========================================================
   2) Social link hook hardening
   ========================================================= */

if (!socials.includes("data-social-kind")) {
  const anchor = `            key={
              link.key
            }`;

  if (!socials.includes(anchor)) {
    fail("No encontré el anchor de redes para agregar data-social-kind.");
  }

  socials = socials.replace(
    anchor,
    `${anchor}
            data-social-kind={link.key}`
  );

  console.log("✅ data-social-kind agregado a redes");
}

/* =========================================================
   3) Micro-copy alignment with final selected design
   ========================================================= */

profile = profile.replace(
  /<span>Pasaporte Alumni<\/span>/g,
  "<span>Pasaporte Alumni</span>"
);

profile = profile.replace(
  /data-profile-design="option-3-launch-match"/g,
  'data-profile-design="option-3-launch-final-polish"'
);

/* =========================================================
   4) Add final marker comments
   ========================================================= */

if (!profile.includes(`/* ${MARKER} */`)) {
  profile += `\n/* ${MARKER} */\n`;
}

if (!socials.includes(`/* ${MARKER} */`)) {
  socials += `\n/* ${MARKER} */\n`;
}

/* =========================================================
   5) Final CSS polish
   ========================================================= */

const css = `/*
 * ${MARKER}
 *
 * Public Profile final polish.
 * Canonical view: mobile 360–430px.
 * Goal: exact clean and professional launch look.
 */

.alumni-profile-launch {
  width: calc(100% + 32px) !important;
  margin: 0 -16px !important;
  color: var(--app-text) !important;
  background: var(--app-bg) !important;
  overflow-x: clip;
}

.alumni-profile-launch,
.alumni-profile-launch * {
  box-sizing: border-box;
}

.alumni-profile-launch-shell {
  width: 100%;
  min-width: 0;
  padding-bottom: calc(92px + env(safe-area-inset-bottom));
  background: var(--app-bg);
}

/* ======================================================
   HERO / COVER
   ====================================================== */

.alumni-profile-launch-hero {
  position: relative;
  width: 100%;
  background: var(--app-bg);
}

.alumni-profile-launch-cover {
  position: relative;
  width: 100%;
  height: 196px !important;
  overflow: hidden;
  background: #121924;
}

.alumni-profile-launch-cover-image,
.alumni-profile-launch-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover !important;
}

.alumni-profile-launch-cover-fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 24% 20%, color-mix(in srgb, var(--app-accent) 34%, transparent), transparent 33%),
    linear-gradient(145deg, #1a2536 0%, #101721 52%, #121925 100%);
}

.alumni-profile-launch-cover-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(4,7,11,.08) 0%, rgba(4,7,11,.06) 52%, rgba(4,7,11,.58) 100%);
  pointer-events: none;
}

.alumni-profile-launch-cover-action {
  position: absolute;
  top: 13px;
  z-index: 5;
  display: inline-flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 999px;
  background: rgba(6,9,14,.46);
  color: #fff;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.alumni-profile-launch-cover-action.is-back {
  left: 13px;
}

.alumni-profile-launch-cover-action.is-share {
  right: 13px;
}

/* ======================================================
   HEADER
   ====================================================== */

.alumni-profile-launch-header {
  position: relative;
  padding: 0 16px !important;
  margin-top: 0 !important;
}

.alumni-profile-launch-avatar-row {
  display: flex;
  min-width: 0;
  height: 64px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.alumni-profile-launch-avatar-wrap {
  position: relative;
  top: -48px;
  width: 96px;
  height: 96px;
  flex: 0 0 96px;
}

.alumni-profile-launch-avatar {
  display: flex;
  width: 96px;
  height: 96px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 4px solid var(--app-bg);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 24px;
  font-weight: 950;
  box-shadow: 0 10px 28px rgba(0,0,0,.24);
}

.alumni-profile-launch-avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover !important;
}

.alumni-profile-launch-camera {
  position: absolute;
  right: -1px;
  bottom: 2px;
  z-index: 3;
  display: inline-flex;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--app-bg);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  box-shadow: 0 6px 16px rgba(0,0,0,.22);
}

.alumni-profile-launch-passport {
  display: inline-flex;
  min-width: 0;
  max-width: 172px;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 11px;
  padding: 0 13px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text-soft);
  font-size: 10.5px;
  font-weight: 850;
  text-decoration: none;
  white-space: nowrap;
}

.alumni-profile-launch-passport svg {
  color: var(--app-muted);
  flex: 0 0 auto;
}

.alumni-profile-launch-identity {
  min-width: 0;
  margin-top: -8px;
}

.alumni-profile-launch-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.alumni-profile-launch-name-row h1 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 22px;
  font-weight: 950;
  line-height: 1.08;
  letter-spacing: -.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-launch-verified,
.alumni-profile-launch-post-verified {
  flex: 0 0 auto;
  color: #3b82f6;
}

.alumni-profile-launch-handle {
  margin-top: 4px;
  color: var(--app-muted);
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.25;
}

.alumni-profile-launch-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-top: 8px;
  color: var(--app-text-soft);
  font-size: 11px;
  font-weight: 560;
  line-height: 1.28;
}

.alumni-profile-launch-meta svg {
  flex: 0 0 auto;
  color: var(--app-muted-2);
}

.alumni-profile-launch-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ======================================================
   SOCIALS
   ====================================================== */

.alumni-profile-launch-socials {
  display: flex;
  min-height: 40px;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
}

.alumni-profile-launch-social-links {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 9px !important;
}

.alumni-profile-launch-social-links a {
  display: flex !important;
  width: 40px !important;
  height: 40px !important;
  max-width: 40px !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--app-border) !important;
  border-radius: 999px !important;
  background: var(--app-surface-2) !important;
  color: var(--app-text) !important;
  box-shadow: none !important;
}

.alumni-profile-launch-social-links a > span:first-child {
  width: 19px !important;
  height: 19px !important;
  color: currentColor !important;
}

.alumni-profile-launch-social-links a > span:first-child svg {
  width: 19px !important;
  height: 19px !important;
}

.alumni-profile-launch-social-links a > span:last-child {
  display: none !important;
}

.alumni-profile-launch-social-links a[data-social-kind="linkedin"] {
  border-color: rgba(10,102,194,.45) !important;
  background: #0a66c2 !important;
  color: #fff !important;
}

.alumni-profile-launch-social-links a[data-social-kind="github"] {
  background: #191b20 !important;
  color: #fff !important;
}

.alumni-profile-launch-social-links a[data-social-kind="instagram"] {
  border-color: rgba(228,64,95,.45) !important;
  background:
    radial-gradient(circle at 32% 105%, #feda75 0%, #fa7e1e 30%, #d62976 54%, #962fbf 75%, #4f5bd5 100%) !important;
  color: #fff !important;
}

.alumni-profile-launch-social-links a[data-social-kind="website"] {
  background: var(--app-surface-2) !important;
  color: var(--app-text-soft) !important;
}

.alumni-profile-launch-spotify {
  display: inline-flex;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(30,215,96,.42);
  border-radius: 999px;
  background: #16261c;
  color: #1ed760;
}

/* ======================================================
   ACTIONS
   ====================================================== */

.alumni-profile-launch-actions {
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  gap: 8px;
  margin-top: 15px;
}

.alumni-profile-launch-primary,
.alumni-profile-launch-secondary {
  display: inline-flex;
  width: 100%;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 13px;
  font-size: 11px;
  font-weight: 850;
  text-decoration: none;
}

.alumni-profile-launch-primary {
  border: 1px solid color-mix(in srgb, var(--app-text) 88%, var(--app-border));
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-profile-launch-secondary {
  border: 1px solid var(--app-border);
  background: var(--app-surface-2);
  color: var(--app-text-soft);
}

/* ======================================================
   STATS
   ====================================================== */

.alumni-profile-launch-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  margin-top: 15px;
  border-bottom: 1px solid var(--app-border);
}

.alumni-profile-launch-stats > * {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 64px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
}

.alumni-profile-launch-stats > * + *::before {
  content: "";
  position: absolute;
  top: 15px;
  bottom: 15px;
  left: 0;
  width: 1px;
  background: var(--app-border);
}

.alumni-profile-launch-stats strong {
  color: var(--app-text);
  font-size: 15.5px;
  font-weight: 950;
  line-height: 1;
}

.alumni-profile-launch-stats span {
  margin-top: 6px;
  color: var(--app-muted-2);
  font-size: 8.5px;
  font-weight: 650;
  line-height: 1;
}

/* ======================================================
   TABS
   ====================================================== */

.alumni-profile-launch-tabs {
  position: sticky;
  top: 0;
  z-index: 24;
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  min-height: 49px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg) 96%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.alumni-profile-launch-tabs button {
  position: relative;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--app-muted-2);
  font-size: 11px;
  font-weight: 760;
}

.alumni-profile-launch-tabs button[data-active="true"] {
  color: var(--app-text);
}

.alumni-profile-launch-tabs button[data-active="true"]::after {
  content: "";
  position: absolute;
  right: 18px;
  bottom: 0;
  left: 18px;
  height: 2px;
  border-radius: 999px;
  background: var(--app-text);
}

/* ======================================================
   MAIN BODY
   ====================================================== */

.alumni-profile-launch-body,
.alumni-profile-launch-content {
  padding: 14px 14px 0;
}

.alumni-profile-launch-posts,
.alumni-profile-launch-saved,
.alumni-profile-launch-activity {
  display: grid;
  gap: 12px;
}

/* ======================================================
   POST CARDS
   ====================================================== */

.alumni-profile-launch-post-card,
.alumni-profile-launch .alumni-feed-card,
.alumni-profile-launch article[class*="post"] {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  box-shadow: none;
}

.alumni-profile-launch .alumni-feed-card-header,
.alumni-profile-launch .alumni-feed-card-content,
.alumni-profile-launch .alumni-feed-card-footer {
  background: transparent !important;
}

.alumni-profile-launch .alumni-feed-card {
  margin: 0 !important;
}

.alumni-profile-launch .alumni-feed-card img,
.alumni-profile-launch .alumni-post-card img,
.alumni-profile-launch article img {
  border-radius: 0 !important;
}

.alumni-profile-launch .alumni-feed-grid,
.alumni-profile-launch .post-grid,
.alumni-profile-launch [class*="media-grid"] {
  overflow: hidden;
  border-radius: 14px;
}

/* ======================================================
   ACTIVITY TAB / SECONDARY MODULES
   ====================================================== */

.alumni-profile-launch-activity-card,
.alumni-profile-launch-panel,
.alumni-profile-launch section[class*="activity"],
.alumni-profile-launch section[class*="passport"],
.alumni-profile-launch section[class*="music"],
.alumni-profile-launch section[class*="experience"],
.alumni-profile-launch section[class*="about"],
.alumni-profile-launch section[class*="links"] {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
}

.alumni-profile-launch-activity-list {
  display: grid;
  gap: 10px;
}

.alumni-profile-launch-activity-item {
  display: grid;
  grid-template-columns: 42px minmax(0,1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 15px;
  border-bottom: 1px solid var(--app-border);
}

.alumni-profile-launch-activity-item:last-child {
  border-bottom: 0;
}

.alumni-profile-launch-activity-item-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: var(--app-surface-2);
  color: var(--app-text-soft);
}

.alumni-profile-launch-activity-item-copy {
  min-width: 0;
}

.alumni-profile-launch-activity-item-copy strong {
  display: block;
  color: var(--app-text);
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.2;
}

.alumni-profile-launch-activity-item-copy span,
.alumni-profile-launch-activity-item-copy small {
  display: block;
  margin-top: 4px;
  color: var(--app-muted-2);
  font-size: 10px;
  line-height: 1.45;
}

/* ======================================================
   EMPTY STATES
   ====================================================== */

.alumni-profile-launch-empty {
  padding: 32px 18px;
  text-align: center;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  color: var(--app-muted-2);
}

.alumni-profile-launch-empty strong {
  display: block;
  color: var(--app-text);
  margin-bottom: 6px;
}

/* ======================================================
   MOBILE CANONICAL
   ====================================================== */

@media (max-width: 430px) {
  .alumni-profile-launch-cover {
    height: 186px !important;
  }

  .alumni-profile-launch-header {
    padding: 0 14px !important;
  }

  .alumni-profile-launch-avatar-wrap,
  .alumni-profile-launch-avatar {
    width: 92px;
    height: 92px;
    flex-basis: 92px;
  }

  .alumni-profile-launch-avatar-wrap {
    top: -46px;
  }

  .alumni-profile-launch-passport {
    max-width: 154px;
    font-size: 10px;
  }

  .alumni-profile-launch-name-row h1 {
    font-size: 21px;
  }

  .alumni-profile-launch-body,
  .alumni-profile-launch-content {
    padding: 12px 12px 0;
  }

  .alumni-profile-launch-tabs button[data-active="true"]::after {
    right: 16px;
    left: 16px;
  }
}

@media (max-width: 374px) {
  .alumni-profile-launch-cover {
    height: 174px !important;
  }

  .alumni-profile-launch-avatar-wrap,
  .alumni-profile-launch-avatar {
    width: 86px;
    height: 86px;
    flex-basis: 86px;
  }

  .alumni-profile-launch-passport {
    max-width: 142px;
    height: 36px;
    padding: 0 11px;
    font-size: 9.5px;
  }

  .alumni-profile-launch-primary,
  .alumni-profile-launch-secondary {
    height: 42px;
    font-size: 10.5px;
  }
}

/* ======================================================
   TABLET / DESKTOP
   Keep same structure, just center it.
   ====================================================== */

@media (min-width: 700px) {
  .alumni-profile-launch {
    width: 100% !important;
    margin: 0 !important;
  }

  .alumni-profile-launch-shell {
    max-width: 760px;
    margin: 0 auto;
    padding-bottom: 40px;
  }

  .alumni-profile-launch-cover {
    border-radius: 20px 20px 0 0;
  }

  .alumni-profile-launch-body,
  .alumni-profile-launch-content {
    padding-left: 18px;
    padding-right: 18px;
  }
}

@media (min-width: 1024px) {
  .alumni-profile-launch-shell {
    max-width: 860px;
  }

  .alumni-profile-launch-cover {
    height: 220px !important;
  }

  .alumni-profile-launch-avatar-wrap,
  .alumni-profile-launch-avatar {
    width: 104px;
    height: 104px;
    flex-basis: 104px;
  }

  .alumni-profile-launch-avatar-wrap {
    top: -52px;
  }

  .alumni-profile-launch-name-row h1 {
    font-size: 24px;
  }

  .alumni-profile-launch-primary,
  .alumni-profile-launch-secondary {
    max-width: 230px;
  }

  .alumni-profile-launch-actions {
    justify-content: start;
  }
}

/* ======================================================
   LIGHT / DARK TUNING
   ====================================================== */

:root[data-theme="light"] .alumni-profile-launch-cover-overlay {
  background:
    linear-gradient(180deg, rgba(255,255,255,.02) 0%, rgba(255,255,255,.01) 46%, rgba(11,17,28,.26) 100%);
}

:root[data-theme="light"] .alumni-profile-launch-cover-action {
  border-color: rgba(255,255,255,.22);
  background: rgba(14,18,24,.42);
}

:root[data-theme="light"] .alumni-profile-launch-passport {
  background: rgba(255,255,255,.92);
}

:root[data-theme="dark"] .alumni-profile-launch-passport {
  background: rgba(255,255,255,.06);
}

/* ${MARKER} */
`;

try {
  const ts = require("typescript");

  for (const [name, source, kind] of [
    [PROFILE, profile, ts.ScriptKind.TSX],
    [SOCIALS, socials, ts.ScriptKind.TSX],
  ]) {
    const parsed = ts.createSourceFile(
      name,
      source,
      ts.ScriptTarget.Latest,
      true,
      kind
    );

    const diagnostics = parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first = diagnostics[0];
      const message = ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      );
      const pos =
        typeof first.start === "number"
          ? parsed.getLineAndCharacterOfPosition(first.start)
          : null;

      fail(
        path.relative(ROOT, name) +
          " tiene sintaxis inválida" +
          (pos
            ? ` en línea ${pos.line + 1}, columna ${pos.character + 1}`
            : "") +
          `: ${message}`
      );
    }
  }

  console.log("✅ Parser TypeScript: profile y socials válidos");
} catch (error) {
  if (!(error && typeof error === "object" && error.code === "MODULE_NOT_FOUND")) {
    throw error;
  }
}

backup(PROFILE);
backup(SOCIALS);

fs.writeFileSync(PROFILE, profile, "utf8");
fs.writeFileSync(SOCIALS, socials, "utf8");
fs.writeFileSync(CSS, css, "utf8");

console.log("");
console.log("✅ ALUMNI Profile 1.3.0 aplicado.");
console.log("✅ Perfil público pulido hacia la Opción 3 final.");
console.log("✅ Portada, avatar, nombre y meta refinados.");
console.log("✅ Logos sociales reforzados.");
console.log("✅ Botones y métricas limpiados.");
console.log("✅ Tabs y contenido interior estabilizados.");
console.log("✅ Mobile-first 360–430 px.");
console.log("✅ Dark / Light afinados.");
console.log("");
console.log("Ahora ejecutá: npm run build");
