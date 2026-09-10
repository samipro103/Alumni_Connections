const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_SEARCH_1_7_0_OPTION_4_PEOPLE_FOCUS";

const pageFile = path.join(ROOT, "src", "app", "explore", "page.tsx");
const cssFile = path.join(ROOT, "src", "app", "explore", "explore-pro.css");
const rowFile = path.join(ROOT, "src", "components", "explore", "ExplorePersonRow.tsx");

for (const file of [pageFile, cssFile, rowFile]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let page = fs.readFileSync(pageFile, "utf8");
let row = fs.readFileSync(rowFile, "utf8");

if (page.includes(MARKER)) {
  console.log("ℹ️ Buscar Opción 4 ya está aplicado.");
  process.exit(0);
}

/* ---------------------------------------------------------------
   1) IMPORTS + MODOS
   --------------------------------------------------------------- */

if (!page.includes("SlidersHorizontal,")) {
  page = page.replace(
    `  Search,
  Sparkles,`,
    `  Search,
  SlidersHorizontal,
  Sparkles,`
  );
}

page = page.replace(
  `type Mode = "all" | "people" | "posts";`,
  `type Mode =
  | "people"
  | "universities"
  | "topics"
  | "posts";`
);

page = page.replace(
  `const [mode, setMode] = useState<Mode>("all");`,
  `const [mode, setMode] = useState<Mode>("people");
  const [filtersOpen, setFiltersOpen] = useState(true);`
);

/* ---------------------------------------------------------------
   2) REEMPLAZAR SOLO EL RENDER DE ExploreContent
   Conserva toda la lógica Supabase existente.
   --------------------------------------------------------------- */

const renderStart = page.indexOf(
  `  return (
    <AppShell>
      <main className="alumni-explore-pro`
);

const renderEndMarker = `
  );
}

export default function ExplorePage()`;

const renderEnd = page.indexOf(renderEndMarker, renderStart);

if (renderStart < 0 || renderEnd < 0) {
  console.error("❌ No encontré el render actual de /explore.");
  process.exit(1);
}

const newRender = `  /* ${MARKER} */
  return (
    <AppShell>
      <main className="alumni-explore-pro alumni-search-people-focus">
        <header className="alumni-explore-hero">
          <h1>Buscar</h1>

          <div className="alumni-search-top-row">
            <div className="alumni-explore-search">
              <Search size={18} strokeWidth={2} />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void runSearch(query, true);
                  }
                }}
                placeholder={
                  mode === "universities"
                    ? "Buscar universidades..."
                    : mode === "topics"
                    ? "Buscar temas..."
                    : mode === "posts"
                    ? "Buscar publicaciones..."
                    : "Buscar personas..."
                }
                aria-label="Buscar en Alumni"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPeople([]);
                    setPosts([]);
                  }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="alumni-search-filter-button"
              onClick={() =>
                setFiltersOpen((value) => !value)
              }
              aria-label="Mostrar u ocultar filtros"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {filtersOpen && (
            <nav
              className="alumni-explore-tabs alumni-search-categories"
              aria-label="Categorías de búsqueda"
            >
              {(
                [
                  ["people", "Personas"],
                  ["universities", "Universidades"],
                  ["topics", "Temas"],
                  ["posts", "Publicaciones"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  data-active={mode === id ? "true" : "false"}
                  onClick={() => setMode(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
        </header>

        {!activeSearch ? (
          <div className="alumni-search-home">
            {loading ? (
              <ExploreDiscoverySkeleton />
            ) : (
              <>
                {(recommendedUnique.length > 0 ||
                  newMembersUnique.length > 0) && (
                  <section className="alumni-explore-section alumni-people-section">
                    <div className="alumni-explore-section-title">
                      <h2>Personas destacadas</h2>
                    </div>

                    <div className="alumni-explore-person-list">
                      {(recommendedUnique.length
                        ? recommendedUnique
                        : newMembersUnique
                      )
                        .slice(0, 5)
                        .map((person) => (
                          <ExplorePersonRow
                            key={person.id}
                            person={person}
                            following={followingIds.includes(person.id)}
                            busy={busy === person.id}
                            reason={
                              person.reason ||
                              person.education_program_name ||
                              person.career ||
                              person.education_institution_name ||
                              person.university
                            }
                            onFollow={() => void follow(person)}
                            onOpen={() =>
                              void recordSignal(
                                "profile",
                                person.id,
                                2
                              )
                            }
                          />
                        ))}
                    </div>
                  </section>
                )}

                {newMembersUnique.slice(
                  recommendedUnique.length ? 0 : 5,
                  recommendedUnique.length ? 5 : 10
                ).length > 0 && (
                  <section className="alumni-explore-section alumni-people-section">
                    <div className="alumni-explore-section-title">
                      <h2>Podrían interesarte</h2>
                    </div>

                    <div className="alumni-explore-person-list">
                      {newMembersUnique
                        .slice(
                          recommendedUnique.length ? 0 : 5,
                          recommendedUnique.length ? 5 : 10
                        )
                        .map((person) => (
                          <ExplorePersonRow
                            key={person.id}
                            person={person}
                            following={followingIds.includes(person.id)}
                            busy={busy === person.id}
                            reason={
                              person.education_program_name ||
                              person.career ||
                              person.education_institution_name ||
                              person.university ||
                              person.city
                            }
                            onFollow={() => void follow(person)}
                            onOpen={() =>
                              void recordSignal(
                                "profile",
                                person.id,
                                1.8
                              )
                            }
                          />
                        ))}
                    </div>
                  </section>
                )}

                {!recommendedUnique.length &&
                  !newMembersUnique.length && (
                    <div className="alumni-explore-empty">
                      Empieza buscando personas de tu comunidad Alumni.
                    </div>
                  )}
              </>
            )}
          </div>
        ) : (
          <section className="alumni-explore-search-results">
            {searching ? (
              <ExploreSearchSkeleton />
            ) : (
              <>
                {(mode === "people" ||
                  mode === "universities") && (
                  <section className="alumni-explore-section alumni-people-section">
                    <div className="alumni-explore-section-title">
                      <h2>
                        {mode === "universities"
                          ? "Personas por universidad"
                          : "Personas"}
                      </h2>
                      <strong>{peopleResults.length}</strong>
                    </div>

                    {peopleResults.length ? (
                      <div className="alumni-explore-person-list">
                        {peopleResults.map((person) => (
                          <ExplorePersonRow
                            key={person.id}
                            person={person}
                            following={followingIds.includes(person.id)}
                            busy={busy === person.id}
                            reason={
                              mode === "universities"
                                ? person.education_institution_name ||
                                  person.university ||
                                  person.education_program_name
                                : person.career ||
                                  person.education_program_name ||
                                  person.education_institution_name ||
                                  person.university
                            }
                            onFollow={() => void follow(person)}
                            onOpen={() =>
                              void recordSignal(
                                "profile",
                                person.id,
                                2
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="alumni-explore-empty">
                        No encontramos personas para “{query}”.
                      </div>
                    )}
                  </section>
                )}

                {(mode === "topics" ||
                  mode === "posts") && (
                  <section className="alumni-explore-section">
                    <div className="alumni-explore-section-title">
                      <h2>
                        {mode === "topics"
                          ? "Temas y publicaciones"
                          : "Publicaciones"}
                      </h2>
                      <strong>{posts.length}</strong>
                    </div>

                    {posts.length ? (
                      <div className="alumni-explore-post-list">
                        {posts.map((post) => (
                          <ExplorePostCard
                            key={post.id}
                            post={post}
                            onOpen={() =>
                              void recordSignal(
                                "post",
                                String(post.id),
                                1.5
                              )
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="alumni-explore-empty">
                        No encontramos resultados para “{query}”.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </AppShell>`;

page =
  page.slice(0, renderStart) +
  newRender +
  renderEndMarker +
  page.slice(renderEnd + renderEndMarker.length);

/* ---------------------------------------------------------------
   3) PERSON ROW — MISMO LOOK DE OPCIÓN 4
   --------------------------------------------------------------- */

row = row.replace(
`import {
  LockKeyhole,
  UserPlus,
  UserRoundCheck,
} from "lucide-react";`,
`import {
  LockKeyhole,
} from "lucide-react";`
);

row = row.replace(
  `className="flex min-w-0 flex-1 items-center gap-3"`,
  `className="alumni-explore-person-link flex min-w-0 flex-1 items-center"`
);

row = row.replace(
  `className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-sm font-black text-[var(--app-text)]"`,
  `className="alumni-explore-person-avatar flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-sm font-black text-[var(--app-text)]"`
);

const oldButton = `      <button
        type="button"
        disabled={busy || following}
        onClick={onFollow}
        className={\`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-[11px] font-black transition \${
          following
            ? "bg-[var(--app-soft)] text-[var(--app-muted-2)]"
            : "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
        } disabled:opacity-60\`}
      >
        {following ? (
          <>
            <UserRoundCheck size={14} />
            Siguiendo
          </>
        ) : (
          <>
            <UserPlus size={14} />
            {person.is_private ? "Solicitar" : "Seguir"}
          </>
        )}
      </button>`;

const newButton = `      <button
        type="button"
        disabled={busy || following}
        onClick={onFollow}
        className={\`alumni-explore-follow-button shrink-0 transition \${
          following
            ? "is-following"
            : ""
        } disabled:opacity-60\`}
      >
        {following
          ? "Siguiendo"
          : person.is_private
          ? "Solicitar"
          : "Seguir"}
      </button>`;

if (!row.includes(oldButton)) {
  console.error("❌ No encontré el botón Seguir actual.");
  process.exit(1);
}
row = row.replace(oldButton, newButton);
row += `\n/* ${MARKER} */\n`;

/* ---------------------------------------------------------------
   4) CSS NUEVO — MOBILE FIRST, OPCIÓN 4
   --------------------------------------------------------------- */

const css = `/* ================================================================
   ${MARKER}
   Opción 4 — Enfoque en Personas
   Diseño base: teléfono 360–430px.
   Desktop conserva exactamente la misma estructura, solo centrada.
   ================================================================ */

.alumni-explore-pro.alumni-search-people-focus {
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding: 2px 0 34px;
  color: var(--app-text);
}

.alumni-explore-hero {
  padding: 4px 0 14px;
  border-bottom: 0;
  background: var(--app-bg);
}

.alumni-explore-hero h1 {
  margin: 0 0 12px;
  color: var(--app-text);
  font-size: 27px;
  line-height: 1;
  font-weight: 950;
  letter-spacing: -.045em;
}

.alumni-search-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alumni-explore-search {
  display: flex;
  min-width: 0;
  min-height: 46px;
  flex: 1 1 auto;
  align-items: center;
  gap: 9px;
  padding: 0 13px;
  border: 0;
  border-radius: 14px;
  background: var(--app-soft);
  box-shadow: none;
}

.alumni-explore-search > svg {
  flex: 0 0 auto;
  color: var(--app-muted);
}

.alumni-explore-search input {
  width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--app-text);
  font-size: 15px;
  line-height: 1;
}

.alumni-explore-search input::placeholder {
  color: var(--app-muted-2);
}

.alumni-explore-search > button,
.alumni-search-filter-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  color: var(--app-muted);
}

.alumni-explore-search > button {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 999px;
  background: transparent;
}

.alumni-search-filter-button {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  border-radius: 14px;
  background: var(--app-soft);
}

.alumni-search-filter-button:active {
  transform: scale(.97);
}

.alumni-search-categories {
  display: flex;
  width: 100%;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  overflow-x: auto;
  border: 0;
  scrollbar-width: none;
}

.alumni-search-categories::-webkit-scrollbar {
  display: none;
}

.alumni-search-categories button {
  min-height: 31px;
  flex: 0 0 auto;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: var(--app-soft);
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 780;
  line-height: 1;
  white-space: nowrap;
}

.alumni-search-categories button[data-active="true"] {
  border-color: var(--app-text);
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-search-categories button[data-active="true"]::after {
  display: none;
}

.alumni-search-home,
.alumni-explore-search-results {
  display: block;
}

.alumni-explore-section {
  padding: 20px 0 4px;
  border-bottom: 0;
}

.alumni-explore-section + .alumni-explore-section {
  margin-top: 12px;
  padding-top: 18px;
  border-top: 1px solid var(--app-border);
}

.alumni-explore-section-title {
  display: flex;
  min-height: 26px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 7px;
}

.alumni-explore-section-title h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -.025em;
}

.alumni-explore-section-title strong {
  color: var(--app-muted-2);
  font-size: 11px;
  font-weight: 750;
}

.alumni-explore-person-list {
  display: block;
}

.alumni-explore-person {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border: 0;
}

.alumni-explore-person-link {
  gap: 10px;
}

.alumni-explore-person-avatar {
  width: 44px;
  height: 44px;
  flex-basis: 44px;
}

.alumni-explore-person strong {
  color: var(--app-text) !important;
  font-size: 13.5px !important;
  line-height: 1.15;
  font-weight: 850 !important;
}

.alumni-explore-person a span span {
  max-width: 100%;
}

.alumni-explore-person a > span:last-child > span:nth-child(2) {
  margin-top: 2px !important;
  color: var(--app-muted-2) !important;
  font-size: 10.5px !important;
  line-height: 1.2;
}

.alumni-explore-person a > span:last-child > span:nth-child(3) {
  margin-top: 2px !important;
  color: var(--app-muted) !important;
  font-size: 10.5px !important;
  line-height: 1.2;
  font-weight: 600 !important;
}

.alumni-explore-follow-button {
  min-width: 66px;
  height: 34px;
  padding: 0 12px;
  border: 0;
  border-radius: 11px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 10.5px;
  font-weight: 850;
  line-height: 1;
}

.alumni-explore-follow-button:not(.is-following):hover {
  background: color-mix(in srgb, var(--app-accent) 18%, var(--app-surface));
}

.alumni-explore-follow-button.is-following {
  min-width: 76px;
  background: var(--app-soft);
  color: var(--app-muted-2);
}

.alumni-explore-post-list {
  display: block;
}

.alumni-explore-post-list .alumni-explore-post + .alumni-explore-post {
  border-top: 1px solid var(--app-border);
}

.alumni-explore-post {
  min-width: 0;
  padding: 14px 0 17px;
}

.alumni-explore-empty {
  padding: 42px 20px;
  color: var(--app-muted-2);
  font-size: 12px;
  line-height: 1.55;
  text-align: center;
}

/* Claro */
html[data-theme="light"] .alumni-explore-hero {
  background: var(--app-bg);
}

html[data-theme="light"] .alumni-explore-search,
html[data-theme="light"] .alumni-search-filter-button,
html[data-theme="light"] .alumni-search-categories button {
  background: #f1f3f7;
}

html[data-theme="light"] .alumni-search-categories button[data-active="true"] {
  background: #11151c;
  color: #fff;
}

/* Oscuro */
html[data-theme="dark"] .alumni-explore-search,
html[data-theme="dark"] .alumni-search-filter-button,
html[data-theme="dark"] .alumni-search-categories button {
  background: var(--app-surface-2);
}

html[data-theme="dark"] .alumni-search-categories button[data-active="true"] {
  background: #f6f7f9;
  color: #0a0d12;
}

/* Mobile muy angosto: no desaparece nada. */
@media (max-width: 374px) {
  .alumni-explore-hero h1 {
    font-size: 25px;
  }

  .alumni-search-top-row {
    gap: 7px;
  }

  .alumni-explore-search {
    padding-inline: 11px;
  }

  .alumni-search-filter-button {
    width: 44px;
    flex-basis: 44px;
  }

  .alumni-search-categories {
    gap: 5px;
  }

  .alumni-search-categories button {
    padding-inline: 9px;
    font-size: 9.5px;
  }

  .alumni-explore-person-avatar {
    width: 42px;
    height: 42px;
    flex-basis: 42px;
  }

  .alumni-explore-follow-button {
    min-width: 62px;
    padding-inline: 10px;
  }
}

/* Desktop: mismo diseño, solo centrado y con aire. */
@media (min-width: 700px) {
  .alumni-explore-pro.alumni-search-people-focus {
    max-width: 560px;
    padding-top: 20px;
    padding-bottom: 50px;
  }
}

/* ${MARKER} */
`;

fs.writeFileSync(pageFile, page, "utf8");
fs.writeFileSync(rowFile, row, "utf8");
fs.writeFileSync(cssFile, css, "utf8");

console.log("");
console.log("✅ ALUMNI Buscar 1.7.0 — Opción 4 aplicado.");
console.log("✅ Mobile-first 360–430 px.");
console.log("✅ Personas destacadas.");
console.log("✅ Podrían interesarte.");
console.log("✅ Categorías: Personas / Universidades / Temas / Publicaciones.");
console.log("✅ Filtro compacto funcional.");
console.log("✅ Seguir limpio, sin icono.");
console.log("✅ Claro y Oscuro soportados.");
console.log("✅ Lógica Supabase de búsqueda conservada.");
console.log("");
console.log("Ahora ejecutá: npm run build");
