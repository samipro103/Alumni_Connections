const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const MORE_CSS =
  "src/app/more/more-premium.css";

const PROFILE_CSS =
  "src/app/settings/settings-edit-profile-pro-2-0.css";

const MARKER_MORE =
  "ALUMNI_MORE_FEATURED_TEXT_FINAL_1_0";

const MARKER_PROFILE =
  "ALUMNI_PROFILE_EDITOR_NO_TOP_LINES_1_0";

function abs(rel) {
  return path.join(
    ROOT,
    rel
  );
}

function fail(message) {
  console.error(
    "❌ " + message
  );
  process.exit(1);
}

function read(rel) {
  if (
    !fs.existsSync(
      abs(rel)
    )
  ) {
    fail(
      `No encontré ${rel}`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(/\r\n/g, "\n");
}

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-more-text-profile-lines-1.0.bak";

  if (
    !fs.existsSync(
      target
    )
  ) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let more =
  read(MORE_CSS);

let profile =
  read(PROFILE_CSS);

backup(
  MORE_CSS,
  more
);

backup(
  PROFILE_CSS,
  profile
);

if (
  !more.includes(
    MARKER_MORE
  )
) {
  more =
    more.trimEnd() +
    "\n\n" +
    "\n/* =========================================================\n   ALUMNI More — featured text final alignment 1.0\n   ========================================================= */\n\n.alumni-more-clean-card {\n  position: relative;\n  display: flex !important;\n  min-height: 104px !important;\n  flex-direction: column;\n  align-items: flex-start !important;\n  justify-content: space-between;\n  gap: 12px !important;\n  padding: 14px !important;\n}\n\n.alumni-more-clean-card-icon {\n  display: inline-flex;\n  align-self: flex-start !important;\n  width: 40px;\n  height: 40px;\n  flex: 0 0 40px;\n  align-items: center;\n  justify-content: center;\n}\n\n.alumni-more-clean-card strong {\n  display: block;\n  width:\n    calc(100% - 24px);\n  min-width: 0;\n  margin: 0;\n  align-self: flex-start !important;\n  overflow: visible !important;\n  color:\n    var(--app-text);\n  font-size:\n    12px !important;\n  font-weight: 900;\n  line-height: 1.2;\n  letter-spacing: -.02em;\n  text-align: left;\n  text-overflow: clip !important;\n  white-space: normal !important;\n  overflow-wrap: normal;\n  word-break: normal;\n}\n\n.alumni-more-clean-card > svg {\n  position: absolute;\n  right: 13px;\n  bottom: 14px;\n  align-self: auto !important;\n  justify-self: auto !important;\n  color:\n    var(--app-muted-3);\n}\n\n@media (max-width: 370px) {\n  .alumni-more-clean-card {\n    min-height:\n      100px !important;\n    padding:\n      12px !important;\n  }\n\n  .alumni-more-clean-card strong {\n    width:\n      calc(100% - 22px);\n    font-size:\n      11.5px !important;\n  }\n\n  .alumni-more-clean-card > svg {\n    right: 11px;\n    bottom: 12px;\n  }\n}\n\n/* ALUMNI_MORE_FEATURED_TEXT_FINAL_1_0 */\n".trim() +
    "\n";
}

if (
  !profile.includes(
    MARKER_PROFILE
  )
) {
  profile =
    profile.trimEnd() +
    "\n\n" +
    "\n/* =========================================================\n   ALUMNI Profile Editor — remove top separator lines only\n   ========================================================= */\n\n.alumni-profile-editor\n.alumni-edit-row-text,\n.alumni-profile-editor\n.alumni-edit-row-picker {\n  border-top:\n    0 !important;\n}\n\n/*\n * Keep only the lower separator so fields remain readable.\n */\n.alumni-profile-editor\n.alumni-edit-row-text,\n.alumni-profile-editor\n.alumni-edit-row-picker {\n  border-bottom:\n    1px solid\n    var(--app-border) !important;\n}\n\n/* ALUMNI_PROFILE_EDITOR_NO_TOP_LINES_1_0 */\n".trim() +
    "\n";
}

fs.writeFileSync(
  abs(MORE_CSS),
  more,
  "utf8"
);

fs.writeFileSync(
  abs(PROFILE_CSS),
  profile,
  "utf8"
);

console.log("");
console.log(
  "✅ Texto Eventos / Comunidades corregido."
);
console.log(
  "✅ Ya no se corta ni se desplaza."
);
console.log(
  "✅ Editar perfil: rayas superiores eliminadas."
);
console.log(
  "✅ Separadores inferiores conservados."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
