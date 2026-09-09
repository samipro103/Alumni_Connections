const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const files = {
  rail: path.join(ROOT, "src", "components", "feed", "StoriesRail.tsx"),
  composer: path.join(ROOT, "src", "components", "stories", "StoryComposer.tsx"),
  viewer: path.join(ROOT, "src", "components", "stories", "StoryViewer.tsx"),
  css: path.join(ROOT, "src", "app", "globals.css"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    console.error(`❌ No encontré ${name}: ${file}`);
    console.error("Ejecutá este archivo desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let rail = fs.readFileSync(files.rail, "utf8");
let composer = fs.readFileSync(files.composer, "utf8");
let viewer = fs.readFileSync(files.viewer, "utf8");
let css = fs.readFileSync(files.css, "utf8");

const MARKER = "ALUMNI_STORIES_1_3_2_OPTION_C_REAL_FIX";

if (
  rail.includes(MARKER) &&
  composer.includes(MARKER) &&
  viewer.includes(MARKER) &&
  css.includes(MARKER)
) {
  console.log("ℹ️ ALUMNI Stories 1.3.2 ya está aplicado.");
  process.exit(0);
}

function replaceOrFail(source, from, to, label) {
  if (!source.includes(from)) {
    console.error(`❌ No encontré el bloque esperado: ${label}`);
    process.exit(1);
  }
  return source.replace(from, to);
}

/* ============================================================
   1) BOTÓN + REAL DEL RAIL
   El avatar conserva "Ver tu historia".
   El + queda como botón independiente y SIEMPRE abre Crear historia.
   ============================================================ */

const oldOwnStoryBlock = `          <div className="alumni-story-compact-item">
            <button
              type="button"
              onClick={handleOwnStoryClick}
              className="alumni-story-compact-button"
              aria-label={
                ownGroupIndex >= 0
                  ? "Ver tu historia"
                  : "Crear historia"
              }
            >
              <span
                className={
                  ownGroupIndex >= 0
                    ? "alumni-story-compact-ring alumni-story-compact-ring-unseen"
                    : "alumni-story-compact-ring alumni-story-compact-ring-empty"
                }
              >
                <span className="alumni-story-compact-avatar">
                  {me?.avatar_url ? (
                    <img src={me.avatar_url} alt="" loading="eager" />
                  ) : (
                    <span>
                      {me?.username?.charAt(0)?.toUpperCase() || "A"}
                    </span>
                  )}
                </span>
              </span>
              <span className="alumni-story-compact-add" aria-hidden="true">
                <Plus size={13} strokeWidth={2.8} />
              </span>
            </button>
            <span className="alumni-story-compact-label" title="Tu historia">
              Tu historia
            </span>
          </div>`;

const newOwnStoryBlock = `          {/* ${MARKER}: el + es una acción independiente */}
          <div className="alumni-story-compact-item">
            <div className="relative">
              <button
                type="button"
                onClick={handleOwnStoryClick}
                className="alumni-story-compact-button"
                aria-label={
                  ownGroupIndex >= 0
                    ? "Ver tu historia"
                    : "Crear historia"
                }
              >
                <span
                  className={
                    ownGroupIndex >= 0
                      ? "alumni-story-compact-ring alumni-story-compact-ring-unseen"
                      : "alumni-story-compact-ring alumni-story-compact-ring-empty"
                  }
                >
                  <span className="alumni-story-compact-avatar">
                    {me?.avatar_url ? (
                      <img src={me.avatar_url} alt="" loading="eager" />
                    ) : (
                      <span>
                        {me?.username?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    )}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setComposerOpen(true);
                }}
                className="alumni-story-compact-add"
                style={{
                  position: "absolute",
                  right: "-2px",
                  bottom: "-2px",
                  zIndex: 30,
                }}
                aria-label="Agregar otra historia"
                title="Agregar historia"
              >
                <Plus size={13} strokeWidth={2.8} />
              </button>
            </div>

            <span className="alumni-story-compact-label" title="Tu historia">
              Tu historia
            </span>
          </div>`;

if (!rail.includes(MARKER)) {
  rail = replaceOrFail(
    rail,
    oldOwnStoryBlock,
    newOwnStoryBlock,
    "botón + de Tu historia en StoriesRail.tsx"
  );
}

/* ============================================================
   2) OPCIÓN C COMO ENTRADA PRINCIPAL
   Ya no abre primero el selector viejo.
   ============================================================ */

if (!composer.includes(MARKER)) {
  composer = replaceOrFail(
    composer,
    `  const [kind, setKind] =
    useState<StoryKind | null>(
      null
    );`,
    `  // ${MARKER}
  // Crear historia abre directamente en el editor Minimal Full Screen (Opción C).
  const [kind, setKind] =
    useState<StoryKind | null>(
      "standard"
    );`,
    "estado inicial kind del StoryComposer"
  );

  composer = replaceOrFail(
    composer,
    `  function resetAll() {
    setKind(null);`,
    `  function resetAll() {
    // Al volver a abrir el compositor entramos directo a Opción C.
    setKind("standard");`,
    "resetAll del StoryComposer"
  );

  /* Elimina el sombreado artificial del propio creador para parecerse más a la propuesta C. */
  composer = composer.replace(
    `          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-28 bg-gradient-to-b from-black/35 via-black/5 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-40 bg-gradient-to-t from-black/40 via-black/8 to-transparent" />`,
    `          {/* ${MARKER}: lienzo limpio, sin bandas de sombreado artificiales */}`
  );

  /* El logotipo superior queda sin text-shadow. */
  composer = composer.replace(
    `            <div className="pointer-events-auto select-none text-[17px] font-black tracking-[-0.045em] text-white [text-shadow:0_2px_16px_rgba(0,0,0,.45)]">`,
    `            <div className="pointer-events-auto select-none text-[17px] font-black tracking-[-0.045em] text-white [text-shadow:none]">`
  );
}

/* ============================================================
   3) VISOR: CABECERA DEL PROPIETARIO 100% LIMPIA
   Sin fondo, blur, gradient, box-shadow ni text-shadow.
   ============================================================ */

if (!viewer.includes(MARKER)) {
  viewer = replaceOrFail(
    viewer,
    `        <div className="alumni-story-chrome alumni-story-chrome-top absolute left-4 right-4 top-[max(28px,calc(env(safe-area-inset-top)+18px))] z-40 flex items-center gap-3">`,
    `        {/* ${MARKER}: cabecera de propietario sin sombreado */}
        <div
          className="alumni-story-chrome alumni-story-owner-clean absolute left-4 right-4 top-[max(28px,calc(env(safe-area-inset-top)+18px))] z-40 flex items-center gap-3"
          style={{
            background: "transparent",
            backgroundImage: "none",
            boxShadow: "none",
            filter: "none",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
        >`,
    "cabecera del propietario en StoryViewer.tsx"
  );

  viewer = viewer.replace(
    `className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/15"`,
    `className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-transparent text-xs font-black text-white ring-0"`
  );

  viewer = viewer.replace(
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/70 backdrop-blur-xl"`,
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-white/90 shadow-none [backdrop-filter:none]"`
  );

  viewer = viewer.replace(
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/65 backdrop-blur-xl transition hover:text-red-300"`,
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-white/85 shadow-none [backdrop-filter:none] transition hover:text-red-300"`
  );

  viewer = viewer.replace(
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-xl"`,
    `className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-white/95 shadow-none [backdrop-filter:none]"`
  );

  viewer = viewer.replace(
    `className="truncate text-sm font-black text-white [text-shadow:none] [filter:none]"`,
    `className="truncate text-sm font-black text-white [text-shadow:none] [filter:none] [background:none] [box-shadow:none]"`
  );

  viewer = viewer.replace(
    `className="text-[10px] text-white/45 [text-shadow:none] [filter:none]"`,
    `className="text-[10px] text-white/60 [text-shadow:none] [filter:none] [background:none] [box-shadow:none]"`
  );
}

/* ============================================================
   4) CSS DE SEGURIDAD: aunque exista una regla futura,
      esta cabecera nunca vuelve a recibir sombreado.
   ============================================================ */

if (!css.includes(MARKER)) {
  css += `

/* ================================================================
   ${MARKER}
   Story owner header: superficie completamente limpia.
   ================================================================ */
.alumni-story-owner-clean,
.alumni-story-owner-clean::before,
.alumni-story-owner-clean::after {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.alumni-story-owner-clean p,
.alumni-story-owner-clean strong,
.alumni-story-owner-clean span {
  text-shadow: none !important;
  box-shadow: none !important;
}

.alumni-story-owner-clean button {
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  filter: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}
`;
}

fs.writeFileSync(files.rail, rail, "utf8");
fs.writeFileSync(files.composer, composer, "utf8");
fs.writeFileSync(files.viewer, viewer, "utf8");
fs.writeFileSync(files.css, css, "utf8");

console.log("");
console.log("✅ ALUMNI STORIES 1.3.2 APLICADO");
console.log("✅ + de Tu historia: siempre abre Crear historia.");
console.log("✅ Crear historia: entra DIRECTO a la Opción C.");
console.log("✅ Se mantiene el layout fullscreen de Opción C.");
console.log("✅ Visor: cabecera del propietario sin sombreado/blur/fondo.");
console.log("✅ Botones superiores del visor quedan transparentes.");
console.log("");
console.log("SIGUIENTE: npm run build");
