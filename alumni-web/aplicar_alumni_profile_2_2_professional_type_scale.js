const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_PROFILE_2_2_PROFESSIONAL_TYPE_SCALE";

const CSS =
  "src/app/profile/profile-option-3-selected-2-0.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(abs(CSS))) {
  fail(
    "No encontré el CSS del Profile 2.0. Ejecutá este parche dentro de alumni-web."
  );
}

let css = fs
  .readFileSync(abs(CSS), "utf8")
  .replace(/\r\n/g, "\n");

if (css.includes(MARKER)) {
  console.log(
    "✅ Profile 2.2 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !css.includes(
    "ALUMNI_PROFILE_2_0_OPTION_3_ACTIVITY_SELECTED"
  )
) {
  fail(
    "No encontré Profile 2.0 Opción 3. Aplicá primero ALUMNI_PROFILE_2_0_OPCION_3_ACTIVITY."
  );
}

const scale = `

/* =========================================================
   ${MARKER}
   Professional mobile typography scale.
   No microscopic UI copy.
   ========================================================= */

/*
 * CANONICAL PROFILE TYPE SCALE
 *
 * Display / name       24px
 * Body / post copy     15px
 * Strong secondary     14px
 * Controls / tabs      13px
 * Metadata             12–13px
 *
 * Avoid 8.5 / 9.5 / 10px text in normal UI.
 */

/* -----------------------------------------
   Identity
   ----------------------------------------- */

.alumni-profile-launch-name-row h1,
.alumni-profile-v3-name-row h1,
.alumni-profile-v3-identity h1 {
  font-size: 24px !important;
  line-height: 1.08 !important;
  font-weight: 900 !important;
  letter-spacing: -.035em !important;
}

.alumni-profile-launch-handle,
.alumni-profile-v3-handle {
  font-size: 13px !important;
  line-height: 1.35 !important;
  font-weight: 550 !important;
}

.alumni-profile-launch-meta,
.alumni-profile-v3-fact,
.alumni-profile-v3-role {
  font-size: 13px !important;
  line-height: 1.4 !important;
  font-weight: 560 !important;
}

/* -----------------------------------------
   Main actions
   ----------------------------------------- */

.alumni-profile-launch-primary,
.alumni-profile-launch-secondary,
.alumni-profile-v3-primary,
.alumni-profile-v3-secondary {
  min-height: 44px !important;
  font-size: 13.5px !important;
  font-weight: 760 !important;
  line-height: 1 !important;
}

/* -----------------------------------------
   Stats
   ----------------------------------------- */

.alumni-profile-launch-stats > *,
.alumni-profile-v3-stats > * {
  min-height: 66px !important;
}

.alumni-profile-launch-stats strong,
.alumni-profile-v3-stats strong {
  font-size: 18px !important;
  line-height: 1 !important;
  font-weight: 850 !important;
  letter-spacing: -.02em !important;
}

.alumni-profile-launch-stats span,
.alumni-profile-v3-stats span {
  margin-top: 6px !important;
  font-size: 12px !important;
  line-height: 1.2 !important;
  font-weight: 590 !important;
}

/* -----------------------------------------
   Tabs
   ----------------------------------------- */

.alumni-profile-launch-tabs,
.alumni-profile-v3-tabs {
  min-height: 52px !important;
}

.alumni-profile-launch-tabs button,
.alumni-profile-v3-tabs button {
  font-size: 13px !important;
  line-height: 1 !important;
  font-weight: 700 !important;
}

/* -----------------------------------------
   Posts — author + timestamp
   ----------------------------------------- */

.alumni-profile-launch-post-name strong,
.alumni-profile-launch-post-author strong,
.alumni-profile-v3-post-author strong {
  font-size: 14px !important;
  line-height: 1.25 !important;
  font-weight: 780 !important;
}

.alumni-profile-launch-post-author > span,
.alumni-profile-v3-post-author > span,
.alumni-profile-launch-post-head time,
.alumni-profile-v3-post-head time {
  font-size: 12px !important;
  line-height: 1.35 !important;
  font-weight: 500 !important;
}

/* -----------------------------------------
   Posts — body
   ----------------------------------------- */

.alumni-profile-launch-post-copy,
.alumni-profile-v3-post-copy {
  font-size: 15px !important;
  line-height: 1.55 !important;
  font-weight: 440 !important;
  letter-spacing: -.006em !important;
}

/* -----------------------------------------
   Post engagement
   ----------------------------------------- */

.alumni-profile-launch-engagement,
.alumni-profile-launch-engagement span,
.alumni-profile-launch-post-footer,
.alumni-profile-v3-post-actions button {
  font-size: 12.5px !important;
  line-height: 1.2 !important;
  font-weight: 620 !important;
}

/* -----------------------------------------
   Pinned / micro labels
   ----------------------------------------- */

.alumni-profile-launch-pin {
  font-size: 11.5px !important;
  line-height: 1.2 !important;
  font-weight: 700 !important;
}

/* -----------------------------------------
   Comments
   ----------------------------------------- */

.alumni-profile-v3-comment-bubble strong,
.alumni-profile-launch-comment strong {
  font-size: 12.5px !important;
  line-height: 1.25 !important;
  font-weight: 760 !important;
}

.alumni-profile-v3-comment-bubble p,
.alumni-profile-launch-comment p {
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.alumni-profile-v3-comment-main small,
.alumni-profile-launch-comment small {
  font-size: 11.5px !important;
  line-height: 1.3 !important;
}

/* -----------------------------------------
   Activity / profile detail rows
   ----------------------------------------- */

.alumni-profile-launch-activity-copy strong {
  font-size: 14px !important;
  line-height: 1.3 !important;
  font-weight: 760 !important;
}

.alumni-profile-launch-activity-copy small {
  margin-top: 3px !important;
  font-size: 12.5px !important;
  line-height: 1.4 !important;
}

.alumni-profile-selected-digital-copy strong {
  font-size: 14px !important;
  line-height: 1.3 !important;
  font-weight: 780 !important;
}

.alumni-profile-selected-digital-copy small {
  font-size: 12px !important;
  line-height: 1.4 !important;
}

/* -----------------------------------------
   Empty / private states
   ----------------------------------------- */

.alumni-profile-launch-empty,
.alumni-profile-v3-empty,
.alumni-profile-v3-private {
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.alumni-profile-launch-empty strong,
.alumni-profile-v3-private h2 {
  font-size: 17px !important;
  line-height: 1.25 !important;
  font-weight: 820 !important;
}

.alumni-profile-v3-private p,
.alumni-profile-launch-empty span {
  font-size: 13px !important;
  line-height: 1.5 !important;
}

/* -----------------------------------------
   Mobile 360px safety
   Keep professional scale; only trim display slightly.
   ----------------------------------------- */

@media (max-width: 374px) {
  .alumni-profile-launch-name-row h1,
  .alumni-profile-v3-name-row h1,
  .alumni-profile-v3-identity h1 {
    font-size: 22px !important;
  }

  .alumni-profile-launch-primary,
  .alumni-profile-launch-secondary,
  .alumni-profile-v3-primary,
  .alumni-profile-v3-secondary {
    font-size: 13px !important;
  }

  .alumni-profile-launch-tabs button,
  .alumni-profile-v3-tabs button {
    font-size: 12.5px !important;
  }

  .alumni-profile-launch-stats span,
  .alumni-profile-v3-stats span {
    font-size: 11.5px !important;
  }
}

/* ${MARKER} */
`;

css += scale;

const backup =
  abs(CSS) +
  ".before-profile-2.2.bak";

if (!fs.existsSync(backup)) {
  fs.copyFileSync(
    abs(CSS),
    backup
  );
}

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Profile 2.2 aplicado."
);
console.log(
  "✅ Nombre principal: 24px."
);
console.log(
  "✅ Cuerpo de publicaciones: 15px."
);
console.log(
  "✅ Autor de publicaciones: 14px."
);
console.log(
  "✅ Botones principales: 13.5px."
);
console.log(
  "✅ Tabs: 13px."
);
console.log(
  "✅ Métricas: 18px / etiquetas 12px."
);
console.log(
  "✅ Metadatos: 12–13px."
);
console.log(
  "✅ Actividad y estados vacíos ampliados."
);
console.log(
  "✅ Mobile 360–430px preservado."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
