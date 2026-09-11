const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const CSS =
  "src/app/more/more-premium.css";

const MARKER =
  "ALUMNI_MORE_EVENTS_COMMUNITIES_FIX_1_0";

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

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

if (
  !fs.existsSync(
    abs(CSS)
  )
) {
  fail(
    `No encontré ${CSS}`
  );
}

let current =
  fs.readFileSync(
    abs(CSS),
    "utf8"
  ).replace(
    /\r\n/g,
    "\n"
  );

if (
  current.includes(
    MARKER
  )
) {
  console.log(
    "✅ Fix ya estaba aplicado."
  );
  process.exit(0);
}

const backup =
  abs(CSS) +
  ".before-more-events-communities-fix-1.0.bak";

if (
  !fs.existsSync(
    backup
  )
) {
  fs.writeFileSync(
    backup,
    current,
    "utf8"
  );
}

current =
  current.trimEnd() +
  "\n\n" +
  "\n/* =========================================================\n   ALUMNI More — Eventos / Comunidades alignment fix 1.0\n   ========================================================= */\n\n.alumni-more-clean-featured {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0, 1fr)\n    );\n  gap: 10px;\n  width: 100%;\n  margin-top: 10px;\n}\n\n.alumni-more-clean-featured\n> div {\n  min-width: 0;\n  width: 100%;\n  height: 100%;\n}\n\n.alumni-more-clean-card {\n  display: grid !important;\n  width: 100% !important;\n  min-width: 0;\n  min-height: 104px !important;\n  height: 100%;\n  grid-template-columns:\n    minmax(0, 1fr)\n    18px !important;\n  grid-template-rows:\n    42px\n    minmax(0, 1fr) !important;\n  align-items: center;\n  gap: 8px;\n  padding:\n    13px 14px !important;\n  overflow: hidden;\n}\n\n.alumni-more-clean-card-icon {\n  align-self: start;\n  width: 40px;\n  height: 40px;\n  flex: 0 0 40px;\n}\n\n.alumni-more-clean-card\nstrong {\n  display: block;\n  min-width: 0;\n  max-width: 100%;\n  align-self: end;\n  overflow: hidden;\n  color:\n    var(--app-text);\n  font-size: 12px !important;\n  font-weight: 900;\n  line-height: 1.15;\n  letter-spacing: -.02em;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-more-clean-card\n> svg {\n  align-self: end;\n  justify-self: end;\n  flex: 0 0 auto;\n}\n\n@media (max-width: 370px) {\n  .alumni-more-clean-featured {\n    gap: 8px;\n  }\n\n  .alumni-more-clean-card {\n    min-height:\n      98px !important;\n    padding:\n      12px !important;\n  }\n\n  .alumni-more-clean-card\n  strong {\n    font-size:\n      11.5px !important;\n  }\n}\n\n/* ALUMNI_MORE_EVENTS_COMMUNITIES_FIX_1_0 */\n".trim() +
  "\n";

fs.writeFileSync(
  abs(CSS),
  current,
  "utf8"
);

console.log("");
console.log(
  "✅ Eventos y Comunidades corregidos dentro de Más."
);
console.log(
  "✅ Mismo tamaño."
);
console.log(
  "✅ Texto contenido."
);
console.log(
  "✅ Flechas alineadas."
);
console.log(
  "✅ Responsive 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
