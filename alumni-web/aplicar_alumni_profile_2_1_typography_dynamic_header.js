const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const MARKER =
  "ALUMNI_PROFILE_2_1_TYPOGRAPHY_DYNAMIC_HEADER";

const PROFILE_CSS =
  "src/app/profile/profile-option-3-selected-2-0.css";

const TOPBAR =
  "src/components/layout/TopBar.tsx";

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
      `No encontré ${rel}. Ejecutá este parche dentro de alumni-web.`
    );
  }

  return fs
    .readFileSync(file, "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel) {
  const file = abs(rel);

  const bak =
    file +
    ".before-profile-2.1.bak";

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(
      file,
      bak
    );
  }
}

function replaceRequired(
  source,
  before,
  after,
  label
) {
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail(
      `No encontré ${label}. No escribí cambios.`
    );
  }

  return source.replace(
    before,
    after
  );
}

let css =
  read(PROFILE_CSS);

let topbar =
  read(TOPBAR);

if (
  css.includes(MARKER) &&
  topbar.includes(MARKER)
) {
  console.log(
    "✅ ALUMNI Profile 2.1 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   VALIDATE PROFILE 2.0
   ========================================================= */

if (
  !css.includes(
    "ALUMNI_PROFILE_2_0_OPTION_3_ACTIVITY_SELECTED"
  )
) {
  fail(
    "No encontré Profile 2.0 Opción 3. Aplicá primero ALUMNI_PROFILE_2_0_OPCION_3_ACTIVITY."
  );
}

/* =========================================================
   PROFILE VISUAL CONSISTENCY
   ========================================================= */

css += `

/* =========================================================
   ${MARKER}
   Unified Geist typography + clean stats + zero header gap.
   ========================================================= */

/*
 * ONE TYPOGRAPHY SYSTEM.
 * Old profile layers can no longer introduce another family.
 */
.alumni-profile-launch,
.alumni-profile-v3 {
  font-family:
    var(--font-geist-sans),
    "Geist",
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif !important;
  font-synthesis:
    none;
}

.alumni-profile-launch *,
.alumni-profile-v3 * {
  font-family:
    inherit !important;
}

/*
 * Explicitly reinforce the places where the mismatch
 * was most visible: stats and post content.
 */
.alumni-profile-launch-stats,
.alumni-profile-launch-stats *,
.alumni-profile-v3-stats,
.alumni-profile-v3-stats *,
.alumni-profile-launch-post,
.alumni-profile-launch-post *,
.alumni-profile-v3-post,
.alumni-profile-v3-post * {
  font-family:
    var(--font-geist-sans),
    "Geist",
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif !important;
}

/*
 * Remove the old vertical separators ("palos")
 * between Publicaciones / Seguidores / Siguiendo.
 */
.alumni-profile-launch-stats
  > * + *::before,
.alumni-profile-v3-stats
  > * + *::before {
  content:
    none !important;
  display:
    none !important;
}

/*
 * Stats now feel like one clean horizontal group.
 */
.alumni-profile-launch-stats,
.alumni-profile-v3-stats {
  column-gap:
    4px;
}

.alumni-profile-launch-stats
  > *,
.alumni-profile-v3-stats
  > * {
  border-left:
    0 !important;
  border-right:
    0 !important;
}

/*
 * Remove the 16px shell gap above the profile banner.
 *
 * AppShell mobile content starts at:
 *   84px + safe area
 *
 * TopBar height is:
 *   68px + safe area
 *
 * Difference = 16px.
 */
@media (max-width: 1023px) {
  .alumni-profile-launch,
  .alumni-profile-v3 {
    margin-top:
      -16px !important;
  }
}

/*
 * Desktop keeps its intentional breathing room.
 */
@media (min-width: 1024px) {
  .alumni-profile-launch,
  .alumni-profile-v3 {
    margin-top:
      14px !important;
  }
}

/* ${MARKER} */
`;

/* =========================================================
   TOPBAR — MOBILE AUTO HIDE / REVEAL
   ========================================================= */

const unreadState = `  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(
    cachedState
      ?.unreadNotifications ||
      0
  );`;

if (
  !topbar.includes(
    "hiddenByScroll"
  )
) {
  topbar =
    replaceRequired(
      topbar,
      unreadState,
      `${unreadState}

  const [
    hiddenByScroll,
    setHiddenByScroll,
  ] = useState(false);`,
      "estado unreadNotifications"
    );
}

const userEffectEnd = `  }, [user?.id]);

  function submitSearch(`;

if (
  !topbar.includes(
    "alumniMobileTopbarScroll"
  )
) {
  topbar =
    replaceRequired(
      topbar,
      userEffectEnd,
      `  }, [user?.id]);

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const media =
      window.matchMedia(
        "(max-width: 1023px)"
      );

    let lastY =
      window.scrollY;

    let ticking =
      false;

    function updateHeader() {
      const currentY =
        window.scrollY;

      if (!media.matches) {
        setHiddenByScroll(
          false
        );
        lastY =
          currentY;
        ticking =
          false;
        return;
      }

      const delta =
        currentY - lastY;

      if (
        currentY <= 18
      ) {
        setHiddenByScroll(
          false
        );
      } else if (
        delta > 3 &&
        currentY > 88
      ) {
        setHiddenByScroll(
          true
        );
      } else if (
        delta < -3
      ) {
        setHiddenByScroll(
          false
        );
      }

      lastY =
        currentY;

      ticking =
        false;
    }

    function alumniMobileTopbarScroll() {
      if (ticking) {
        return;
      }

      ticking =
        true;

      window.requestAnimationFrame(
        updateHeader
      );
    }

    function mediaChange() {
      if (!media.matches) {
        setHiddenByScroll(
          false
        );
      }
    }

    window.addEventListener(
      "scroll",
      alumniMobileTopbarScroll,
      {
        passive: true,
      }
    );

    media.addEventListener?.(
      "change",
      mediaChange
    );

    return () => {
      window.removeEventListener(
        "scroll",
        alumniMobileTopbarScroll
      );

      media.removeEventListener?.(
        "change",
        mediaChange
      );
    };
  }, []);

  function submitSearch(`,
      "punto de inserción del scroll dinámico"
    );
}

const headerOld =
  `<header data-alumni-topbar="true" className="fixed inset-x-0 top-0 z-[70] h-[calc(68px+env(safe-area-inset-top))] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-md [transform:translateZ(0)] lg:h-[68px]">`;

const headerNew =
  `<header
      data-alumni-topbar="true"
      data-scroll-hidden={
        hiddenByScroll
          ? "true"
          : "false"
      }
      className={\`fixed inset-x-0 top-0 z-[70] h-[calc(68px+env(safe-area-inset-top))] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-md transition-transform duration-200 ease-out will-change-transform [transform:translateZ(0)] lg:h-[68px] lg:translate-y-0 \${
        hiddenByScroll
          ? "-translate-y-full"
          : "translate-y-0"
      }\`}
    >`;

topbar =
  replaceRequired(
    topbar,
    headerOld,
    headerNew,
    "header principal de TopBar"
  );

if (
  !topbar.includes(
    `/* ${MARKER} */`
  )
) {
  topbar +=
    `\n/* ${MARKER} */\n`;
}

/* =========================================================
   VALIDATE TSX
   ========================================================= */

try {
  const ts =
    require("typescript");

  const parsed =
    ts.createSourceFile(
      TOPBAR,
      topbar,
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

    const message =
      ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      );

    const pos =
      typeof first.start ===
      "number"
        ? parsed
            .getLineAndCharacterOfPosition(
              first.start
            )
        : null;

    fail(
      `${TOPBAR}: sintaxis inválida` +
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
    !(
      error &&
      typeof error ===
        "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

/* =========================================================
   FINAL VALIDATION
   ========================================================= */

if (
  !css.includes(
    "content:\n    none !important"
  )
) {
  fail(
    "Validación: no quedó la eliminación de separadores."
  );
}

if (
  !css.includes(
    'var(--font-geist-sans)'
  )
) {
  fail(
    "Validación: no quedó Geist unificado."
  );
}

if (
  !topbar.includes(
    "-translate-y-full"
  )
) {
  fail(
    "Validación: TopBar no quedó dinámico."
  );
}

/* =========================================================
   WRITE
   ========================================================= */

backup(PROFILE_CSS);
backup(TOPBAR);

fs.writeFileSync(
  abs(PROFILE_CSS),
  css,
  "utf8"
);

fs.writeFileSync(
  abs(TOPBAR),
  topbar,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Profile 2.1 aplicado."
);
console.log(
  "✅ Geist unificado en todo el perfil."
);
console.log(
  "✅ Publicaciones usan la misma tipografía."
);
console.log(
  "✅ Separadores verticales de métricas eliminados."
);
console.log(
  "✅ Espacio entre TopBar y banner eliminado en móvil/tablet."
);
console.log(
  "✅ Header ALUMNI se oculta al bajar y reaparece al subir."
);
console.log(
  "✅ Desktop mantiene el TopBar estable."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
