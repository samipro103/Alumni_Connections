const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const NAV =
  "src/components/layout/MobileNav.tsx";

const CSS =
  "src/components/layout/mobile-nav-refine-1-0.css";

const MARKER =
  "ALUMNI_NAVBAR_REFINE_1_0";

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

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-navbar-refine-1.0.bak";

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

if (
  !fs.existsSync(
    abs(NAV)
  )
) {
  fail(
    `No encontré ${NAV}`
  );
}

let nav =
  fs.readFileSync(
    abs(NAV),
    "utf8"
  ).replace(
    /\r\n/g,
    "\n"
  );

if (
  nav.includes(
    MARKER
  )
) {
  console.log(
    "✅ Navbar Refine 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  NAV,
  nav
);

if (
  !nav.includes(
    `import {
  supabase,
} from "@/lib/supabase";`
  )
) {
  fail(
    "No encontré los imports esperados de MobileNav."
  );
}

nav =
  nav.replace(
    `import {
  supabase,
} from "@/lib/supabase";`,
    `import {
  supabase,
} from "@/lib/supabase";
import "./mobile-nav-refine-1-0.css";`
  );

nav =
  nav.replace(
    `bottom: "max(7px, env(safe-area-inset-bottom))",`,
    `bottom: "max(14px, calc(env(safe-area-inset-bottom) + 8px))",`
  );

const oldClass =
  `className="alumni-mobile-nav-clean fixed left-1/2 z-[2147482000] w-[calc(100%-26px)] max-w-[390px] -translate-x-1/2 rounded-[20px] border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_97%,transparent)] px-1.5 py-1 shadow-[0_12px_32px_var(--app-shadow)] backdrop-blur-xl [backface-visibility:hidden] lg:hidden"`;

const newClass =
  `className="alumni-mobile-nav-clean fixed inset-x-4 z-[2147482000] mx-auto w-auto max-w-[398px] rounded-[18px] border px-1.5 py-1 [backface-visibility:hidden] lg:hidden"`;

if (
  !nav.includes(
    oldClass
  )
) {
  fail(
    "La estructura actual de la navbar no coincide con la esperada."
  );
}

nav =
  nav.replace(
    oldClass,
    newClass
  );

nav +=
  `\n/* ${MARKER} */\n`;

const css =
  ".alumni-mobile-nav-clean {\n  transform: none !important;\n  animation:\n    alumniNavSoftFade\n    260ms\n    cubic-bezier(.2,.8,.2,1)\n    both !important;\n\n  border-color:\n    color-mix(\n      in srgb,\n      var(--app-border) 88%,\n      transparent\n    ) !important;\n\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 90%,\n      transparent\n    ) !important;\n\n  -webkit-backdrop-filter:\n    blur(10px)\n    saturate(1.04);\n  backdrop-filter:\n    blur(10px)\n    saturate(1.04);\n\n  box-shadow:\n    0 8px 24px\n      color-mix(\n        in srgb,\n        var(--app-shadow) 68%,\n        transparent\n      ),\n    inset 0 1px 0\n      color-mix(\n        in srgb,\n        var(--app-text) 3%,\n        transparent\n      );\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item {\n  min-width: 0;\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-icon {\n  color:\n    var(--app-muted);\n  transition:\n    transform\n      140ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color\n      160ms\n      ease,\n    color\n      160ms\n      ease;\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item[\n  data-active=\"true\"\n]\n.alumni-mobile-nav-icon {\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  color:\n    var(--app-accent);\n}\n\n.alumni-mobile-nav-clean\n.alumni-mobile-nav-item:active\n.alumni-mobile-nav-icon {\n  transform:\n    scale(.92);\n}\n\n@keyframes alumniNavSoftFade {\n  from {\n    opacity: 0;\n  }\n\n  to {\n    opacity: 1;\n  }\n}\n\n@media (\n  prefers-reduced-motion:\n  reduce\n) {\n  .alumni-mobile-nav-clean {\n    animation:\n      none !important;\n  }\n}\n\n/* ALUMNI_NAVBAR_REFINE_1_0 */\n";

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      NAV,
      nav,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics ||
    [];

  if (
    diagnostics.length
  ) {
    const first =
      diagnostics[0];

    fail(
      `${NAV}: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: archivo válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(
  abs(NAV),
  nav,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Navbar Refine 1.0 aplicado."
);
console.log(
  "✅ Centrado sin translateX."
);
console.log(
  "✅ Ya no debe correrse con Motion."
);
console.log(
  "✅ Más separada del borde inferior."
);
console.log(
  "✅ Transparencia sutil."
);
console.log(
  "✅ Blur suave."
);
console.log(
  "✅ Sombra reducida."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
