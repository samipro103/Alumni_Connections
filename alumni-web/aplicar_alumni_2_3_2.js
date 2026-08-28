const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const ROOT = process.cwd();

const PASSPORT_GOOD_COMMIT =
  "76d5e2d424314703ce29b1782a4b5484fc65a62a"; // 2.2.4
const PROFILE_GOOD_COMMIT =
  "4916c3f87f085f22ca234ea539bd7ce65c401fed"; // 2.3.0
const MARKER =
  "ALUMNI_2_3_2_RECOVERY_PROFILE_PASSPORT_NAV";

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function norm(text) {
  return text.replace(/\r\n/g, "\n");
}

function writeLikeOriginal(target, original, next) {
  const crlf = original.includes("\r\n");
  const normalized = norm(next);

  fs.writeFileSync(
    target,
    crlf
      ? normalized.replace(/\n/g, "\r\n")
      : normalized,
    "utf8"
  );
}

function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) {
    die("No encuentro ancla: " + label);
  }

  console.log("[OK] " + label);
  return source.replace(from, to);
}

function gitShow(commit, rel) {
  const gitPath = "alumni-web/" + rel.replace(/\\/g, "/");

  try {
    return cp.execFileSync(
      "git",
      ["show", `${commit}:${gitPath}`],
      {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
      }
    );
  } catch (error) {
    die(
      "No pude recuperar " +
        rel +
        " desde el historial Git. " +
        "No se hizo ningún cambio peligroso."
    );
  }
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

try {
  cp.execFileSync(
    "git",
    ["cat-file", "-e", `${PASSPORT_GOOD_COMMIT}^{commit}`],
    { cwd: ROOT }
  );

  cp.execFileSync(
    "git",
    ["cat-file", "-e", `${PROFILE_GOOD_COMMIT}^{commit}`],
    { cwd: ROOT }
  );
} catch {
  die(
    "No encuentro los commits seguros 2.2.4 / 2.3.0 " +
      "en tu historial Git."
  );
}

const files = [
  "src/app/passport/page.tsx",
  "src/app/passport/passport.css",
  "src/app/passport/[username]/page.tsx",
  "src/app/profile/page.tsx",
  "src/app/u/[username]/page.tsx",
  "src/components/profile/ProfilePassportPreview.tsx",
  "src/components/profile/ProfilePassportPreview.module.css",
  "src/components/layout/MobileNav.tsx",
];

for (const rel of files) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro: " + rel);
  }
}

if (
  fs
    .readFileSync(
      path.join(ROOT, "src/app/profile/page.tsx"),
      "utf8"
    )
    .includes(MARKER)
) {
  console.log("[SKIP] ALUMNI 2.3.2 ya estaba aplicado.");
  process.exit(0);
}

/* Backup everything before restoring. */
const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "2.3.2-recovery-profile-passport-nav",
  stamp
);

for (const rel of files) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);

  fs.mkdirSync(
    path.dirname(backup),
    { recursive: true }
  );

  fs.copyFileSync(source, backup);
}

/* ------------------------------------------------------------
   1. PASSPORT OWNER
   Restore EXACT approved 2.2.4 design.
   ------------------------------------------------------------ */
for (const rel of [
  "src/app/passport/page.tsx",
  "src/app/passport/passport.css",
]) {
  const target = path.join(ROOT, rel);
  fs.writeFileSync(
    target,
    gitShow(PASSPORT_GOOD_COMMIT, rel),
    "utf8"
  );
  console.log(
    "[OK] Restaurado Pasaporte aprobado 2.2.4: " + rel
  );
}

/* ------------------------------------------------------------
   2. SOCIAL PASSPORT
   Restore 2.3.0 social page before unintended 2.3.1 visual edits.
   Likes/comments/Quiero ir stay intact.
   ------------------------------------------------------------ */
{
  const rel =
    "src/app/passport/[username]/page.tsx";

  fs.writeFileSync(
    path.join(ROOT, rel),
    gitShow(PROFILE_GOOD_COMMIT, rel),
    "utf8"
  );

  console.log(
    "[OK] Restaurado Pasaporte social 2.3.0"
  );
}

/* ------------------------------------------------------------
   3. PROFILE PAGES
   Restore 2.3.0 so publications/tabs return to known-good flow.
   Then ONLY add compact stats beside avatar.
   ------------------------------------------------------------ */
for (const rel of [
  "src/app/profile/page.tsx",
  "src/app/u/[username]/page.tsx",
]) {
  fs.writeFileSync(
    path.join(ROOT, rel),
    gitShow(PROFILE_GOOD_COMMIT, rel),
    "utf8"
  );
  console.log(
    "[OK] Restaurado perfil 2.3.0: " + rel
  );
}

/* OWN PROFILE mini stats beside avatar */
{
  const rel = "src/app/profile/page.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";`,
    "Estadísticas pequeñas en perfil propio"
  );

  const oldAvatar =
`              <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                {profile.avatar_url ? (
                  <HDProfileImage
                    src={profile.avatar_url}
                    alt="Avatar"
                    variant="avatar"
                    className="h-full w-full object-cover"
/>
                ) : (
                  profile.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>`;

  const newAvatar =
`              <div className="flex shrink-0 items-center gap-4">
                <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <HDProfileImage
                      src={profile.avatar_url}
                      alt="Avatar"
                      variant="avatar"
                      className="h-full w-full object-cover"
  />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                <ProfileMiniStats
                  posts={posts.length}
                  followers={followers}
                  following={following}
                />
              </div>`;

  src = replaceOnce(
    src,
    oldAvatar,
    newAvatar,
    "Mover Publicaciones/Seguidores/Siguiendo junto a foto"
  );

  src = replaceOnce(
    src,
`            <div className="alumni-profile-stats mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={following} label="Siguiendo" />
            </div>`,
``,
    "Quitar estadísticas grandes duplicadas"
  );

  src += `\n/* ${MARKER}:OWNER_PROFILE */\n`;
  writeLikeOriginal(file, original, src);
}

/* PUBLIC PROFILE mini stats beside avatar */
{
  const rel = "src/app/u/[username]/page.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";`,
`import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";
import ProfileMiniStats from "@/components/profile/ProfileMiniStats";`,
    "Estadísticas pequeñas en perfil público"
  );

  const oldAvatar =
`              <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                {profile.avatar_url ? (
                  <HDProfileImage
                    src={profile.avatar_url}
                    alt="Avatar"
                    variant="avatar"
                    className="h-full w-full object-cover"
/>
                ) : (
                  profile.username?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>`;

  const newAvatar =
`              <div className="flex shrink-0 items-center gap-4">
                <div className="alumni-profile-avatar flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/[0.09] bg-[#1a1f29] text-2xl font-black shadow-[0_10px_28px_rgba(0,0,0,.16)] sm:h-28 sm:w-28">
                  {profile.avatar_url ? (
                    <HDProfileImage
                      src={profile.avatar_url}
                      alt="Avatar"
                      variant="avatar"
                      className="h-full w-full object-cover"
  />
                  ) : (
                    profile.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>

                <ProfileMiniStats
                  posts={posts.length}
                  followers={followers}
                  following={followingCount}
                />
              </div>`;

  src = replaceOnce(
    src,
    oldAvatar,
    newAvatar,
    "Mover estadísticas junto a foto pública"
  );

  src = replaceOnce(
    src,
`            <div className="mt-6 flex gap-8 border-t border-white/[0.06] pt-5">
              <Stat value={posts.length} label="Publicaciones" />
              <Stat value={followers} label="Seguidores" />
              <Stat value={followingCount} label="Siguiendo" />
            </div>`,
``,
    "Quitar estadísticas grandes públicas"
  );

  src += `\n/* ${MARKER}:PUBLIC_PROFILE */\n`;
  writeLikeOriginal(file, original, src);
}

/* ------------------------------------------------------------
   4. PROFILE PASSPORT PREVIEW
   Restore 2.3.0 design, but compact profile treatment:
   Pasaporte Alumni + Próximo destino only.
   Fix destination editor with inline country selector.
   No modal, no card.
   ------------------------------------------------------------ */
{
  const rel =
    "src/components/profile/ProfilePassportPreview.tsx";
  const file = path.join(ROOT, rel);

  let src =
    gitShow(PROFILE_GOOD_COMMIT, rel);

  src = norm(src);

  src = replaceOnce(
    src,
`import { supabase } from "@/lib/supabase";`,
`import { supabase } from "@/lib/supabase";
import { COUNTRIES, flagEmoji } from "@/lib/countries";`,
    "Selector de países para Próximo destino"
  );

  /* State: only ISO code is user-selected. */
  src = replaceOnce(
    src,
`  const [destinationForm, setDestinationForm] = useState({
    name: "",
    code: "",
  });`,
`  const [destinationForm, setDestinationForm] = useState({
    code: "",
  });`,
    "Simplificar estado de Próximo destino"
  );

  src = replaceOnce(
    src,
`      setDestinationForm({
        name:
          travelResult.data
            .next_destination_name || "",
        code:
          travelResult.data
            .next_destination_code || "",
      });`,
`      setDestinationForm({
        code:
          travelResult.data
            .next_destination_code || "",
      });`,
    "Cargar país actual"
  );

  const saveStart =
`  async function saveDestination() {
    const name =
      destinationForm.name.trim();

    if (!own || !name || savingDestination) {
      return;
    }

    setSavingDestination(true);

    const { error } = await supabase
      .from("profile_travel_status")
      .upsert(
        {
          user_id: userId,
          next_destination_name: name,
          next_destination_code:
            destinationForm.code
              .trim()
              .toUpperCase() || null,
          source_passport_country_id: null,
        },
        { onConflict: "user_id" }
      );

    setSavingDestination(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingDestination(false);
    await load();
  }`;

  const saveNew =
`  async function saveDestination() {
    const selected = COUNTRIES.find(
      (item) =>
        item.code === destinationForm.code
    );

    if (
      !own ||
      !selected ||
      savingDestination
    ) {
      return;
    }

    setSavingDestination(true);

    const { error } = await supabase
      .from("profile_travel_status")
      .upsert(
        {
          user_id: userId,
          next_destination_name:
            selected.name,
          next_destination_code:
            selected.code,
          source_passport_country_id: null,
        },
        { onConflict: "user_id" }
      );

    setSavingDestination(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEditingDestination(false);
    await load();
  }`;

  src = replaceOnce(
    src,
    saveStart,
    saveNew,
    "Guardar Próximo destino por país real"
  );

  /* Replace the entire return with compact profile version.
     Country albums remain accessible through Pasaporte Alumni. */
  const returnStart = src.indexOf(
    "  return (\n    <section className={styles.root}>"
  );

  const returnEnd = src.indexOf(
    "\n  );\n}\n\n/* ALUMNI_2_3_0_PROFILE_PASSPORT_PREVIEW */",
    returnStart
  );

  if (returnStart < 0 || returnEnd < 0) {
    die(
      "No pude reconstruir la vista de Pasaporte del perfil."
    );
  }

  const compactReturn =
`  return (
    <section className={styles.root}>
      <div className={styles.compactLine}>
        <Link
          href={
            own
              ? "/passport"
              : \`/passport/\${username}\`
          }
          className={styles.passportLink}
        >
          Pasaporte Alumni
          <ArrowRight size={13} />
        </Link>

        {travel?.next_destination_name ? (
          <button
            type="button"
            className={styles.nextCompact}
            onClick={() => {
              if (own) {
                setEditingDestination(
                  (value) => !value
                );
              }
            }}
            disabled={!own}
          >
            <span>Próximo destino:</span>
            <b className={styles.flag}>
              {flagEmoji(
                travel.next_destination_code
              )}
            </b>
            <strong>
              {travel.next_destination_name}
            </strong>
            {own && <Pencil size={12} />}
          </button>
        ) : own ? (
          <button
            type="button"
            className={styles.nextCompact}
            onClick={() =>
              setEditingDestination(
                (value) => !value
              )
            }
          >
            <span>Próximo destino:</span>
            <Plane size={13} />
            <strong>Elegir país</strong>
          </button>
        ) : null}
      </div>

      {editingDestination && own && (
        <div className={styles.destinationEditor}>
          <label>
            <span>Próximo destino</span>
            <select
              value={destinationForm.code}
              onChange={(event) =>
                setDestinationForm({
                  code: event.target.value,
                })
              }
            >
              <option value="">
                Selecciona un país
              </option>

              {COUNTRIES.map((country) => (
                <option
                  key={country.code}
                  value={country.code}
                >
                  {flagEmoji(country.code)}{" "}
                  {country.name}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.destinationActions}>
            <button
              type="button"
              onClick={() =>
                setEditingDestination(false)
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className={styles.destinationSave}
              disabled={
                savingDestination ||
                !destinationForm.code
              }
              onClick={() =>
                void saveDestination()
              }
            >
              {savingDestination
                ? "Guardando..."
                : "Guardar"}
            </button>
          </div>
        </div>
      )}
    </section>
  );`;

  src =
    src.slice(0, returnStart) +
    compactReturn +
    src.slice(returnEnd + "\n  );".length);

  src += `\n/* ${MARKER}:PASSPORT_PREVIEW */\n`;

  fs.writeFileSync(file, src, "utf8");
  console.log(
    "[OK] Pasaporte del perfil: solo Pasaporte Alumni + Próximo destino"
  );
}

/* Preview CSS: restore 2.3.0 base and add open inline editor. */
{
  const rel =
    "src/components/profile/ProfilePassportPreview.module.css";
  const file = path.join(ROOT, rel);

  let css =
    gitShow(PROFILE_GOOD_COMMIT, rel);

  css += `

/* ALUMNI 2.3.2 — compact/open profile passport */
.compactLine {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.passportLink,
.nextCompact {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 9px;
  font-weight: 900;
}

.passportLink {
  color: var(--app-text);
}

.nextCompact {
  color: var(--app-muted-2);
}

.nextCompact strong {
  color: var(--app-text);
  font-size: 9px;
}

.nextCompact:disabled {
  opacity: 1;
}

.flag {
  font-size: 18px;
  line-height: 1;
}

.destinationEditor {
  margin-top: 10px;
  padding: 13px 0 4px;
  border-top: 1px solid var(--app-border);
  border-bottom: 1px solid var(--app-border);
}

.destinationEditor label > span {
  display: block;
  color: var(--app-muted-2);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase;
}

.destinationEditor select {
  width: 100%;
  min-height: 44px;
  margin-top: 6px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  outline: 0;
  background: transparent;
  color: var(--app-text);
  font-size: 11px;
}

.destinationActions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 0;
}

.destinationActions button {
  min-height: 36px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-muted-2);
  font-size: 9px;
  font-weight: 900;
}

.destinationActions .destinationSave {
  color: var(--app-accent);
}

.destinationActions .destinationSave:disabled {
  opacity: .4;
}

@media (max-width: 600px) {
  .compactLine {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
  }
}

/* ${MARKER}:PASSPORT_PREVIEW_STYLE */
`;

  fs.writeFileSync(file, css, "utf8");
  console.log(
    "[OK] Próximo destino sin modal ni cajas"
  );
}

/* ------------------------------------------------------------
   5. MOBILE "MÁS"
   Remove gap and keep rows open, divider-based, no cards.
   ------------------------------------------------------------ */
{
  const rel =
    "src/components/layout/MobileNav.tsx";
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, "utf8");
  let src = norm(original);

  src = replaceOnce(
    src,
`className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-[2147481999] border-y border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-2xl lg:hidden"`,
`className="fixed inset-x-0 bottom-[calc(58px+max(8px,env(safe-area-inset-bottom)))] z-[2147481999] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-2xl lg:hidden"`,
    "Pegar menú Más exactamente sobre navegación"
  );

  src = replaceOnce(
    src,
`className="mx-auto w-full max-w-lg px-4 py-2"`,
`className="mx-auto w-full max-w-lg px-4 pt-1 pb-0"`,
    "Quitar espacio inferior de Más"
  );

  src += `\n/* ${MARKER}:MOBILE_MORE */\n`;
  writeLikeOriginal(file, original, src);
}

console.log("");
console.log("============================================================");
console.log(" ALUMNI 2.3.2 - RECOVERY");
console.log("============================================================");
console.log("[OK] Pasaporte /passport restaurado EXACTO a 2.2.4");
console.log("[OK] Pasaporte social restaurado a 2.3.0");
console.log("[OK] Perfil restaurado a 2.3.0 para recuperar publicaciones");
console.log("[OK] Formación actual NO se toca");
console.log("[OK] Estadísticas pequeñas permanecen junto a foto");
console.log("[OK] Perfil muestra solo Pasaporte Alumni + Próximo destino");
console.log("[OK] Próximo destino usa selector de países y banderas");
console.log("[OK] Próximo destino ya no usa modal");
console.log("[OK] Más queda pegado a la barra inferior");
console.log("[OK] Opciones Más siguen abiertas, con líneas, sin cards");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("============================================================");
