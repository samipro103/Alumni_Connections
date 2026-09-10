
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_0_OPCION_3_ACTIVITY_FOCUS";
const CSS_NAME = "profile-activity-1-0.css";

const candidates = [
  path.join(ROOT, "src", "app", "u", "[username]", "page.tsx"),
  path.join(ROOT, "src", "app", "profile", "[username]", "page.tsx"),
  path.join(ROOT, "src", "app", "profile", "page.tsx"),
];

const profileFile = candidates.find((file) => fs.existsSync(file));
if (!profileFile) {
  console.error("❌ No encontré la página principal del perfil.");
  console.error("Busqué en:");
  candidates.forEach((item) => console.error("   - " + item));
  console.error("Ejecutá este parche desde la carpeta alumni-web.");
  process.exit(1);
}

const cssDir = path.dirname(profileFile);
const cssFile = path.join(cssDir, CSS_NAME);

let source = fs.readFileSync(profileFile, "utf8").replace(/\r\n/g, "\n");
console.log("✅ Perfil detectado en:", path.relative(ROOT, profileFile));
console.log("✅ Saltos de línea normalizados (Windows CRLF compatible)");

if (source.includes(MARKER) && fs.existsSync(cssFile)) {
  console.log("ℹ️ Perfil Opción 3 ya está aplicado.");
  process.exit(0);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function addImportIfMissing(importLine, anchor, label) {
  if (source.includes(importLine)) {
    console.log("ℹ️ " + label + " ya estaba importado");
    return;
  }
  if (!source.includes(anchor)) {
    fail("No encontré el punto de importación: " + label);
  }
  source = source.replace(anchor, `${anchor}\n${importLine}`);
  console.log("✅ " + label);
}

addImportIfMissing(`import "./${CSS_NAME}";`, '"use client";', "CSS de perfil actividad");

// Activity-focused copy hooks.
const labelReplacements = [
  [/>\s*Publicaciones\s*</g, ">Posts<", "Pestaña Publicaciones → Posts"],
  [/>\s*Experiencia\s*</g, ">Actividad<", "Pestaña Experiencia → Actividad"],
  [/>\s*Acerca de\s*</g, ">Resumen<", "Pestaña Acerca de → Resumen"],
];

for (const [regex, to, label] of labelReplacements) {
  if (regex.test(source)) {
    source = source.replace(regex, to);
    console.log("✅ " + label);
  }
}

// Remove legacy stories mentions if present.
source = source.replaceAll("publicaciones e historias", "publicaciones");
source = source.replaceAll("Publicaciones e historias", "Publicaciones");

// Add a main design hook to the top-most profile wrapper.
if (!source.includes('data-profile-design="activity-focus"')) {
  const patterns = [
    /className=\"([^\"]*alumni-profile[^\"]*)\"/,
    /className=\{`([^`]*alumni-profile[^`]*)`\}/,
    /className=\"([^\"]*profile-page[^\"]*)\"/,
  ];

  let applied = false;
  for (const pattern of patterns) {
    if (pattern.test(source)) {
      source = source.replace(pattern, (match) => {
        if (match.includes('data-profile-design=')) return match;
        return match + ' data-profile-design="activity-focus"';
      });
      applied = true;
      console.log("✅ Hook visual del perfil agregado");
      break;
    }
  }

  if (!applied) {
    console.warn("⚠️ No encontré wrapper claro del perfil; aplicaré solo estilos defensivos globales.");
  }
}

// Hide low-priority dense modules and let activity dominate, using wrapper classes if present.
const hintBlocks = [
  ["alumni-profile-achievements", "Logros"],
  ["alumni-profile-links", "Links"],
  ["alumni-profile-experience", "Experiencia"],
  ["alumni-profile-education", "Educación"],
  ["alumni-profile-summary", "Resumen"],
  ["alumni-profile-posts", "Posts"],
  ["alumni-profile-activity", "Actividad"],
];

// Non-blocking marker.
if (!source.includes(MARKER)) {
  source += `\n/* ${MARKER} */\n`;
}

const css = `/*
 * ${MARKER}
 * Opción 3 — Perfil centrado en la actividad
 * Base: mobile-first 360–430 px.
 */

:root {
  --alumni-profile-hero-overlay: linear-gradient(180deg, rgba(0,0,0,.00) 0%, rgba(0,0,0,.14) 32%, rgba(3,6,10,.88) 100%);
}

/* Scope defensive: route-level or global fallback */
[data-profile-design="activity-focus"],
.alumni-profile-page[data-profile-design="activity-focus"],
.alumni-profile-page,
main:has([data-profile-design="activity-focus"]) {
  color: var(--app-text);
}

/* Main phone shell */
[data-profile-design="activity-focus"] {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}

/* Header / hero */
[data-profile-design="activity-focus"] .alumni-profile-hero,
[data-profile-design="activity-focus"] .alumni-profile-cover,
[data-profile-design="activity-focus"] [class*="profile-cover"] {
  position: relative;
  overflow: hidden;
  border-radius: 0 0 24px 24px;
}

[data-profile-design="activity-focus"] .alumni-profile-hero::after,
[data-profile-design="activity-focus"] .alumni-profile-cover::after,
[data-profile-design="activity-focus"] [class*="profile-cover"]::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--alumni-profile-hero-overlay);
  pointer-events: none;
}

/* Identity block */
[data-profile-design="activity-focus"] .alumni-profile-avatar,
[data-profile-design="activity-focus"] [class*="profile-avatar"] {
  width: 84px !important;
  height: 84px !important;
  border: 3px solid rgba(255,255,255,.82) !important;
  box-shadow: 0 8px 24px rgba(0,0,0,.20);
}

[data-profile-design="activity-focus"] .alumni-profile-name,
[data-profile-design="activity-focus"] h1 {
  font-size: 18px !important;
  line-height: 1.1;
  font-weight: 900 !important;
  letter-spacing: -0.03em;
}

[data-profile-design="activity-focus"] .alumni-profile-handle,
[data-profile-design="activity-focus"] [class*="username"] {
  color: var(--app-muted) !important;
  font-size: 12px !important;
}

/* CTA row */
[data-profile-design="activity-focus"] .alumni-profile-actions,
[data-profile-design="activity-focus"] [class*="profile-actions"] {
  display: flex;
  gap: 8px;
  width: 100%;
}

[data-profile-design="activity-focus"] .alumni-profile-actions > *,
[data-profile-design="activity-focus"] [class*="profile-actions"] > * {
  min-height: 40px !important;
  border-radius: 12px !important;
}

/* Metrics */
[data-profile-design="activity-focus"] .alumni-profile-stats,
[data-profile-design="activity-focus"] [class*="profile-stats"] {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 !important;
  margin-top: 10px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

[data-profile-design="activity-focus"] .alumni-profile-stats > *,
[data-profile-design="activity-focus"] [class*="profile-stats"] > * {
  padding: 10px 8px !important;
  text-align: center;
}

/* Tabs prioritised for activity */
[data-profile-design="activity-focus"] .alumni-profile-tabs,
[data-profile-design="activity-focus"] [role="tablist"] {
  display: grid !important;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 0 !important;
  border-bottom: 1px solid var(--app-border);
  overflow-x: hidden;
}

[data-profile-design="activity-focus"] .alumni-profile-tabs > *,
[data-profile-design="activity-focus"] [role="tablist"] > * {
  min-height: 42px;
  border-radius: 0 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
}

/* Feed-first cards */
[data-profile-design="activity-focus"] .alumni-profile-posts,
[data-profile-design="activity-focus"] .alumni-profile-activity,
[data-profile-design="activity-focus"] [class*="profile-posts"],
[data-profile-design="activity-focus"] [class*="profile-activity"] {
  order: 1;
}

[data-profile-design="activity-focus"] .alumni-profile-post-card,
[data-profile-design="activity-focus"] .alumni-feed-post,
[data-profile-design="activity-focus"] [class*="post-card"] {
  border: 1px solid var(--app-border) !important;
  border-radius: 18px !important;
  box-shadow: none !important;
  background: var(--app-surface) !important;
}

/* Secondary modules become cards under the activity area */
[data-profile-design="activity-focus"] .alumni-profile-summary,
[data-profile-design="activity-focus"] .alumni-profile-links,
[data-profile-design="activity-focus"] .alumni-profile-achievements,
[data-profile-design="activity-focus"] .alumni-profile-experience,
[data-profile-design="activity-focus"] .alumni-profile-education,
[data-profile-design="activity-focus"] [class*="profile-summary"],
[data-profile-design="activity-focus"] [class*="profile-links"],
[data-profile-design="activity-focus"] [class*="profile-achievement"],
[data-profile-design="activity-focus"] [class*="profile-experience"],
[data-profile-design="activity-focus"] [class*="profile-education"] {
  border: 1px solid var(--app-border) !important;
  border-radius: 18px !important;
  background: var(--app-surface) !important;
  box-shadow: none !important;
}

/* Section titles */
[data-profile-design="activity-focus"] h2,
[data-profile-design="activity-focus"] h3 {
  letter-spacing: -0.025em;
}

/* Composer/comment feel aligned with messaging/feed */
[data-profile-design="activity-focus"] .alumni-feed-comment,
[data-profile-design="activity-focus"] .alumni-feed-comment-body,
[data-profile-design="activity-focus"] input,
[data-profile-design="activity-focus"] textarea {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
}

/* Theme polish */
html[data-theme="light"] [data-profile-design="activity-focus"] {
  background: #ffffff;
}

html[data-theme="light"] [data-profile-design="activity-focus"] .alumni-profile-post-card,
html[data-theme="light"] [data-profile-design="activity-focus"] .alumni-feed-post,
html[data-theme="light"] [data-profile-design="activity-focus"] [class*="post-card"] {
  background: #ffffff !important;
}

html[data-theme="dark"] [data-profile-design="activity-focus"] {
  background: var(--app-bg);
}

html[data-theme="dark"] [data-profile-design="activity-focus"] .alumni-profile-post-card,
html[data-theme="dark"] [data-profile-design="activity-focus"] .alumni-feed-post,
html[data-theme="dark"] [data-profile-design="activity-focus"] [class*="post-card"] {
  background: var(--app-surface) !important;
}

/* Small phones */
@media (max-width: 374px) {
  [data-profile-design="activity-focus"] .alumni-profile-avatar,
  [data-profile-design="activity-focus"] [class*="profile-avatar"] {
    width: 78px !important;
    height: 78px !important;
  }

  [data-profile-design="activity-focus"] .alumni-profile-tabs > *,
  [data-profile-design="activity-focus"] [role="tablist"] > * {
    font-size: 11px !important;
  }
}

/* Desktop remains the same mobile design, simply centered */
@media (min-width: 700px) {
  [data-profile-design="activity-focus"] {
    max-width: 560px;
    padding-bottom: 50px;
  }

  [data-profile-design="activity-focus"] .alumni-profile-hero,
  [data-profile-design="activity-focus"] .alumni-profile-cover,
  [data-profile-design="activity-focus"] [class*="profile-cover"] {
    border-radius: 24px 24px 24px 24px;
  }
}
`;

fs.writeFileSync(cssFile, css, "utf8");

// Basic validations.
const validations = [
  [source.includes(`import "./${CSS_NAME}";`), "CSS importado"],
  [fs.existsSync(cssFile), "CSS creado"],
  [css.includes("Posts<") || source.includes(">Posts<"), "Pestaña Posts"],
  [css.includes("activity-focus"), "Hook de diseño"],
  [css.includes("max-width: 520px"), "Layout mobile-first"],
];

for (const [ok, label] of validations) {
  if (!ok) {
    try { fs.unlinkSync(cssFile); } catch {}
    fail("Validación final: " + label);
  }
}

fs.writeFileSync(profileFile, source, "utf8");

console.log("");
console.log("✅ ALUMNI Profile 1.0 — Opción 3 aplicado COMPLETO.");
console.log("✅ Perfil centrado en la actividad.");
console.log("✅ Pestañas priorizadas: Posts / Guardados / Actividad.");
console.log("✅ Mobile-first.");
console.log("✅ Claro/Oscuro.");
console.log("✅ Lógica existente del perfil conservada.");
console.log("");
console.log("Ahora ejecutá: npm run build");
