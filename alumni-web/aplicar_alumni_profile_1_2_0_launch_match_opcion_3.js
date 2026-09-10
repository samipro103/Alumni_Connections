const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_2_0_LAUNCH_MATCH_OPTION_3";

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
  "profile-option-3-launch.css"
);

const OLD_CSS_FILES = [
  path.join(
    ROOT,
    "src",
    "app",
    "profile",
    "profile-professional-exact-1-1-1.css"
  ),
  path.join(
    ROOT,
    "src",
    "app",
    "profile",
    "profile-option-3-own.css"
  ),
];

for (const file of [PROFILE, SOCIALS]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche dentro de alumni-web.");
    process.exit(1);
  }
}

let source = fs.readFileSync(PROFILE, "utf8").replace(/\r\n/g, "\n");
let socials = fs.readFileSync(SOCIALS, "utf8").replace(/\r\n/g, "\n");

console.log("✅ /profile real detectado");
console.log("✅ ProfileSocialLinks detectado");
console.log("✅ CRLF/LF normalizado");

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (
  source.includes(MARKER) &&
  socials.includes(MARKER) &&
  fs.existsSync(CSS)
) {
  console.log("ℹ️ Profile 1.2.0 ya está aplicado.");
  process.exit(0);
}

/* ================================================================
   0) AUTORREPARACIÓN DEL ERROR 1.1.1 SI AÚN EXISTE LOCALMENTE
   ================================================================ */

const brokenPrefix = `  if (!profile) {
    return (
    <AppShell>
      <div className="alumni-profile-pro" data-profile-design="option-3-pro-exact">`;

const repairedPrefix = `  if (!profile) {
    return (
      <AppShell>
        <AlumniEmptyState
          eyebrow="Perfil"
          title="No pudimos mostrar tu perfil."
          description="Vuelve a intentarlo o revisa la configuración de tu cuenta."
          actionHref="/settings?section=profile"
          actionLabel="Abrir configuración"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="alumni-profile-pro" data-profile-design="option-3-pro-exact">`;

if (source.includes(brokenPrefix)) {
  source = source.replace(brokenPrefix, repairedPrefix);
  console.log("✅ Estructura rota de Profile 1.1.1 reparada");
}

/* ================================================================
   1) IMPORTS LIMPIOS — UNA SOLA CAPA VISUAL DE PERFIL
   ================================================================ */

/* Retirar CSS visuales anteriores de esta página para evitar montajes. */
source = source
  .replace('import "./profile-visual-2-8.css";\n', "")
  .replace('import "./profile-professional-exact-1-1-1.css";\n', "")
  .replace('import "./profile-option-3-own.css";\n', "")
  .replace('import "./profile-option-3-launch.css";\n', "");

/* Quitar imports de módulos grandes que ahora se representan como filas reales. */
const unusedImports = [
  'import ProfileMusicCard from "@/components/profile/ProfileMusicCard";\n',
  'import ProfilePassportPreview from "@/components/profile/ProfilePassportPreview";\n',
  'import ProfileMiniStats from "@/components/profile/ProfileMiniStats";\n',
  'import ProfileIdentityMeta from "@/components/profile/ProfileIdentityMeta";\n',
  'import ProfileHeaderFacts from "@/components/profile/ProfileHeaderFacts";\n',
  'import ProfessionalProfileOverview from "@/components/profile/ProfessionalProfileOverview";\n',
];

for (const item of unusedImports) {
  source = source.replace(item, "");
}

/* useMemo ya no será necesario. */
source = source.replace("  useMemo,\n", "");

/* Importar SVG real de Spotify ya existente en ALUMNI. */
if (
  !source.includes(
    'import SpotifyLogo from "@/components/music/SpotifyLogo";'
  )
) {
  const anchor =
    'import ProfileSocialLinks from "@/components/profile/ProfileSocialLinks";';

  if (!source.includes(anchor)) {
    fail("No encontré ProfileSocialLinks para agregar SpotifyLogo.");
  }

  source = source.replace(
    anchor,
    `${anchor}
import SpotifyLogo from "@/components/music/SpotifyLogo";`
  );
}

/* Añadir iconos que usa el diseño aprobado. */
const lucideAdditions = [
  "ArrowLeft",
  "BadgeCheck",
  "BookOpen",
  "Camera",
  "ChevronRight",
  "IdCard",
  "Music2",
  "UserRound",
];

for (const icon of lucideAdditions) {
  if (!source.includes(`  ${icon},`)) {
    const anchor = `import {
  Briefcase,`;

    if (!source.includes(anchor)) {
      fail("No encontré el import de lucide-react.");
    }

    source = source.replace(
      anchor,
      `import {
  ${icon},
  Briefcase,`
    );
  }
}

/* Añadir exclusivamente el CSS Launch Match. */
const cssAnchor =
  'import "@/components/profile/ProfilePostOwnerMenu.css";';

if (!source.includes(cssAnchor)) {
  fail("No encontré el import de ProfilePostOwnerMenu.css.");
}

source = source.replace(
  cssAnchor,
  `${cssAnchor}
import "./profile-option-3-launch.css";`
);

/* ================================================================
   2) LIMPIAR useMemo DE LINKS VIEJO
   ================================================================ */

source = source.replace(
  /\n  const links = useMemo\([\s\S]*?\n  \);\n\n  if \(loadingProfile\) \{/,
  `

  if (loadingProfile) {`
);

/* ================================================================
   3) SOCIAL LINKS — CONSERVAR SVG REALES Y DAR IDENTIDAD DE MARCA
   ================================================================ */

if (!socials.includes("data-social-kind")) {
  const socialAnchor = `            key={
              link.key
            }`;

  if (!socials.includes(socialAnchor)) {
    fail("No encontré el anchor de redes sociales.");
  }

  socials = socials.replace(
    socialAnchor,
    `${socialAnchor}
            data-social-kind={link.key}`
  );

  console.log("✅ Logos sociales reales preparados para estilo circular");
}

/* ================================================================
   4) TABS
   ================================================================ */

source = source.replace(
  /type ProfileTab = [^;]+;/,
  `type ProfileTab = "posts" | "saved" | "activity";`
);

/* ================================================================
   5) REEMPLAZAR EL RENDER ACTUAL POR LA OPCIÓN 3 APROBADA
   ================================================================ */

const profileGuard = source.indexOf("  if (!profile) {");

if (profileGuard < 0) {
  fail("No encontré if (!profile).");
}

const guardEndNeedle = `
  }

  return (
    <AppShell>`;

const guardEnd = source.indexOf(guardEndNeedle, profileGuard);

if (guardEnd < 0) {
  fail(
    "No encontré el render principal fuera de if (!profile). " +
    "No haré cambios a ciegas."
  );
}

const renderStart = guardEnd + "\n  }\n\n".length;

const helperStart = source.indexOf(
  "\nfunction Stat({",
  renderStart
);

if (helperStart < 0) {
  fail("No encontré el final actual de ProfilePage.");
}

const newRender = `  return (
    <AppShell>
      <div
        className="alumni-profile-launch"
        data-profile-design="option-3-launch-match"
      >
        <section className="alumni-profile-launch-shell">
          {/* ===================================================
              PORTADA — IGUAL AL CONCEPTO APROBADO
              =================================================== */}
          <section className="alumni-profile-launch-hero">
            <div className="alumni-profile-launch-cover">
              {profile.banner_url ? (
                <HDProfileImage
                  src={profile.banner_url}
                  alt="Portada"
                  variant="banner"
                  className="alumni-profile-launch-cover-image"
                />
              ) : (
                <div className="alumni-profile-launch-cover-fallback" />
              )}

              <div className="alumni-profile-launch-cover-overlay" />

              <button
                type="button"
                onClick={() => router.back()}
                className="alumni-profile-launch-cover-action is-back"
                aria-label="Volver"
              >
                <ArrowLeft size={19} />
              </button>

              <button
                type="button"
                onClick={shareProfile}
                className="alumni-profile-launch-cover-action is-share"
                aria-label="Compartir perfil"
              >
                <Share2 size={18} />
              </button>
            </div>

            <div className="alumni-profile-launch-header">
              {/* Avatar + cámara + Pasaporte */}
              <div className="alumni-profile-launch-avatar-row">
                <div className="alumni-profile-launch-avatar-wrap">
                  <div className="alumni-profile-launch-avatar">
                    {profile.avatar_url ? (
                      <HDProfileImage
                        src={profile.avatar_url}
                        alt="Avatar"
                        variant="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile.username
                        ?.charAt(0)
                        ?.toUpperCase() || "U"
                    )}
                  </div>

                  <Link
                    href="/settings?section=profile&edit=1"
                    className="alumni-profile-launch-camera"
                    aria-label="Cambiar foto de perfil"
                    title="Cambiar foto de perfil"
                  >
                    <Camera size={14} />
                  </Link>
                </div>

                <Link
                  href="/passport"
                  className="alumni-profile-launch-passport"
                >
                  <IdCard size={16} />
                  <span>Pasaporte Alumni</span>
                </Link>
              </div>

              {/* Identidad */}
              <div className="alumni-profile-launch-identity">
                <div className="alumni-profile-launch-name-row">
                  <h1>
                    {profile.full_name || "Mi perfil"}
                  </h1>

                  {(profile.is_verified ||
                    profile.verified ||
                    profile.verified_at) && (
                    <BadgeCheck
                      size={18}
                      className="alumni-profile-launch-verified"
                      aria-label="Perfil verificado"
                    />
                  )}
                </div>

                <p className="alumni-profile-launch-handle">
                  @{profile.username}
                </p>

                {(profile.career ||
                  profile.education_program_name) && (
                  <p className="alumni-profile-launch-meta">
                    <Briefcase size={14} />
                    <span>
                      {profile.career ||
                        profile.education_program_name}
                    </span>
                  </p>
                )}

                {(profile.university ||
                  profile.education_institution_name) && (
                  <p className="alumni-profile-launch-meta">
                    <GraduationCap size={14} />
                    <span>
                      {profile.university ||
                        profile.education_institution_name}
                    </span>
                  </p>
                )}

                {(profile.city || profile.country) && (
                  <p className="alumni-profile-launch-meta">
                    <MapPin size={14} />
                    <span>
                      {[profile.city, profile.country]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </p>
                )}
              </div>

              {/* LOGOS SOCIALES REALES */}
              <div className="alumni-profile-launch-socials">
                <ProfileSocialLinks
                  profile={profile}
                  className="alumni-profile-launch-social-links"
                />

                {profileMusic && (
                  <Link
                    href="/settings?section=music"
                    className="alumni-profile-launch-spotify"
                    aria-label="Música de perfil"
                    title="Música"
                  >
                    <SpotifyLogo size={21} />
                  </Link>
                )}
              </div>

              {/* Botones */}
              <div className="alumni-profile-launch-actions">
                <Link
                  href="/settings?section=profile&edit=1"
                  className="alumni-profile-launch-primary"
                >
                  Editar perfil
                </Link>

                <button
                  type="button"
                  onClick={shareProfile}
                  className="alumni-profile-launch-secondary"
                >
                  Compartir
                </button>
              </div>

              {/* Métricas */}
              <div className="alumni-profile-launch-stats">
                <button
                  type="button"
                  onClick={() => setTab("posts")}
                >
                  <strong>{posts.length}</strong>
                  <span>Publicaciones</span>
                </button>

                <div>
                  <strong>{followers}</strong>
                  <span>Seguidores</span>
                </div>

                <div>
                  <strong>{following}</strong>
                  <span>Siguiendo</span>
                </div>
              </div>
            </div>
          </section>

          {/* ===================================================
              TABS — POSTS / GUARDADOS / ACTIVIDAD
              =================================================== */}
          <nav
            className="alumni-profile-launch-tabs"
            aria-label="Secciones de mi perfil"
          >
            <button
              type="button"
              data-active={
                tab === "posts" ? "true" : "false"
              }
              onClick={() => setTab("posts")}
            >
              Posts
            </button>

            <button
              type="button"
              data-active={
                tab === "saved" ? "true" : "false"
              }
              onClick={() => setTab("saved")}
            >
              Guardados
            </button>

            <button
              type="button"
              data-active={
                tab === "activity" ? "true" : "false"
              }
              onClick={() => setTab("activity")}
            >
              Actividad
            </button>
          </nav>

          {/* ===================================================
              POSTS
              =================================================== */}
          {tab === "posts" ? (
            <section className="alumni-profile-launch-feed">
              {posts.length === 0 ? (
                <div className="alumni-profile-launch-empty">
                  <strong>
                    Aún no tienes publicaciones.
                  </strong>
                  <span>
                    Cuando publiques en Alumni,
                    aparecerán aquí.
                  </span>
                </div>
              ) : (
                <div className="alumni-profile-launch-post-list">
                  {posts.map((post: any) => (
                    <article
                      key={post.id}
                      className="alumni-profile-launch-post"
                    >
                      <header className="alumni-profile-launch-post-head">
                        <div className="alumni-profile-launch-post-avatar">
                          <AlumniAvatar
                            src={profile.avatar_url}
                            name={profile.username}
                            alt="Avatar"
                            className="h-full w-full"
                            imageClassName="h-full w-full object-cover"
                          />
                        </div>

                        <div className="alumni-profile-launch-post-author">
                          <div className="alumni-profile-launch-post-name">
                            <strong>
                              {profile.full_name ||
                                ("@" + profile.username)}
                            </strong>

                            {(profile.is_verified ||
                              profile.verified ||
                              profile.verified_at) && (
                              <BadgeCheck
                                size={13}
                                className="alumni-profile-launch-post-verified"
                              />
                            )}
                          </div>

                          <span>
                            @{profile.username} ·{" "}
                            {formatDistanceToNow(
                              new Date(post.created_at),
                              {
                                addSuffix: true,
                                locale: es,
                              }
                            )}
                          </span>
                        </div>

                        {post.pinned && (
                          <span className="alumni-profile-launch-pin">
                            Fijada
                          </span>
                        )}
                      </header>

                      {post.content && (
                        <p className="alumni-profile-launch-post-copy">
                          {post.content}
                        </p>
                      )}

                      {post.image_url && (
                        <div className="alumni-profile-launch-media">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedProfileMedia(
                                post.image_url
                              )
                            }
                            aria-label="Abrir fotografía"
                          >
                            <img
                              src={post.image_url}
                              alt="Publicación"
                            />
                          </button>
                        </div>
                      )}

                      <footer className="alumni-profile-launch-post-footer">
                        <div className="alumni-profile-launch-engagement">
                          <span>
                            <Heart size={18} />
                            {post.likes?.length || 0}
                          </span>

                          <span>
                            <MessageCircle size={18} />
                            {post.comments?.length || 0}
                          </span>
                        </div>

                        <ProfilePostOwnerMenu
                          post={post}
                          pinned={Boolean(post.pinned)}
                          onEdit={(content) =>
                            editProfilePost(
                              post.id,
                              content
                            )
                          }
                          onTogglePin={() =>
                            toggleProfilePin(post.id)
                          }
                          onDelete={() =>
                            deleteProfilePost(post.id)
                          }
                        />
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : tab === "saved" ? (
            /* ===============================================
               GUARDADOS
               =============================================== */
            <section className="alumni-profile-launch-saved">
              <ProfileSavedTab
                userId={profile.id}
              />
            </section>
          ) : (
            /* ===============================================
               ACTIVIDAD — COMO LA PROPUESTA APROBADA
               =============================================== */
            <section className="alumni-profile-launch-activity">
              <Link
                href="/settings?section=profile&edit=1"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <UserRound size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>Sobre mí</strong>
                  <small>
                    Mi historia, intereses y más
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>

              <Link
                href="/settings?section=academic"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <BookOpen size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>
                    Trayectoria académica
                  </strong>
                  <small>
                    Estudios y logros
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>

              <Link
                href="/settings?section=profile&edit=1"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <Briefcase size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>
                    Experiencia profesional
                  </strong>
                  <small>
                    Trabajo y proyectos
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>

              <Link
                href="/settings?section=links"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <Link2 size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>Enlaces</strong>
                  <small>
                    Mis redes y sitios web
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>

              <Link
                href="/settings?section=music"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <Music2 size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>Música</strong>
                  <small>
                    Lo que me inspira
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>

              <Link
                href="/passport"
                className="alumni-profile-launch-activity-row"
              >
                <span className="alumni-profile-launch-activity-icon">
                  <IdCard size={19} />
                </span>

                <span className="alumni-profile-launch-activity-copy">
                  <strong>
                    Pasaporte Alumni
                  </strong>
                  <small>
                    Mi identificación Alumni
                  </small>
                </span>

                <ChevronRight size={17} />
              </Link>
            </section>
          )}
        </section>
      </div>

      {selectedProfileMedia && (
        <AlumniMediaViewer
          src={selectedProfileMedia}
          type="image"
          alt="Publicación ampliada"
          onClose={() =>
            setSelectedProfileMedia(null)
          }
        />
      )}
    </AppShell>
  );
}

/* ${MARKER} */
`;

source =
  source.slice(0, renderStart) +
  newRender +
  source.slice(helperStart);

/* ================================================================
   6) CSS — MATCH VISUAL DEL DISEÑO APROBADO
   ================================================================ */

const css = `/*
 * ${MARKER}
 *
 * ALUMNI Profile — Opción 3 Launch Match
 * Diseño canónico: teléfono 360–430 px.
 * Desktop conserva la misma composición y solo la centra.
 */

.alumni-profile-launch {
  width: calc(100% + 32px);
  margin: 0 -16px;
  color: var(--app-text);
  background: var(--app-bg);
  font-family:
    var(--font-geist-sans),
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.alumni-profile-launch,
.alumni-profile-launch * {
  box-sizing: border-box;
}

.alumni-profile-launch-shell {
  width: 100%;
  min-width: 0;
  background: var(--app-bg);
}

/* =========================================================
   COVER
   ========================================================= */

.alumni-profile-launch-cover {
  position: relative;
  width: 100%;
  height: 176px;
  overflow: hidden;
  background: #121924;
}

.alumni-profile-launch-cover-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-profile-launch-cover-fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(
      circle at 24% 20%,
      color-mix(
        in srgb,
        var(--app-accent) 38%,
        transparent
      ),
      transparent 33%
    ),
    linear-gradient(
      145deg,
      #1a2536 0%,
      #101721 52%,
      #121925 100%
    );
}

.alumni-profile-launch-cover-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(4, 7, 11, .06) 0%,
      rgba(4, 7, 11, .05) 48%,
      rgba(4, 7, 11, .52) 100%
    );
  pointer-events: none;
}

.alumni-profile-launch-cover-action {
  position: absolute;
  top: 13px;
  z-index: 5;
  display: flex;
  width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 999px;
  background: rgba(6, 9, 14, .46);
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

/* =========================================================
   PROFILE HEADER
   ========================================================= */

.alumni-profile-launch-header {
  position: relative;
  padding: 0 16px 0;
}

.alumni-profile-launch-avatar-row {
  display: flex;
  min-width: 0;
  height: 58px;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.alumni-profile-launch-avatar-wrap {
  position: relative;
  top: -42px;
  width: 92px;
  height: 92px;
  flex: 0 0 92px;
}

.alumni-profile-launch-avatar {
  display: flex;
  width: 92px;
  height: 92px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid var(--app-bg);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 23px;
  font-weight: 950;
  box-shadow:
    0 8px 26px rgba(0, 0, 0, .23);
}

.alumni-profile-launch-camera {
  position: absolute;
  right: -1px;
  bottom: 1px;
  z-index: 3;
  display: flex;
  width: 29px;
  height: 29px;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--app-bg);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  box-shadow:
    0 5px 14px rgba(0, 0, 0, .22);
}

.alumni-profile-launch-passport {
  display: inline-flex;
  min-width: 0;
  height: 38px;
  max-width: 160px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 10px;
  padding: 0 13px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text-soft);
  font-size: 10px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.alumni-profile-launch-passport svg {
  color: var(--app-muted);
}

.alumni-profile-launch-identity {
  min-width: 0;
}

.alumni-profile-launch-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.alumni-profile-launch-name-row h1 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 21px;
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
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 11.5px;
  font-weight: 530;
}

.alumni-profile-launch-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  color: var(--app-text-soft);
  font-size: 11px;
  font-weight: 550;
  line-height: 1.25;
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

/* =========================================================
   SOCIAL LOGOS — SVG REALES EXISTENTES
   ========================================================= */

.alumni-profile-launch-socials {
  display: flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  margin-top: 13px;
}

.alumni-profile-launch-social-links {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
}

.alumni-profile-launch-social-links a {
  display: flex !important;
  width: 38px !important;
  height: 38px !important;
  max-width: 38px !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--app-border) !important;
  border-radius: 999px !important;
  background: var(--app-surface-2) !important;
  color: var(--app-text) !important;
  box-shadow: none !important;
}

.alumni-profile-launch-social-links
  a > span:first-child {
  width: 19px !important;
  height: 19px !important;
  color: currentColor !important;
}

.alumni-profile-launch-social-links
  a > span:first-child svg {
  width: 19px !important;
  height: 19px !important;
}

.alumni-profile-launch-social-links
  a > span:last-child {
  display: none !important;
}

/* LinkedIn */
.alumni-profile-launch-social-links
  a[data-social-kind="linkedin"] {
  border-color: rgba(10, 102, 194, .45) !important;
  background: #0a66c2 !important;
  color: #fff !important;
}

/* GitHub */
.alumni-profile-launch-social-links
  a[data-social-kind="github"] {
  background: #191b20 !important;
  color: #fff !important;
}

/* Instagram */
.alumni-profile-launch-social-links
  a[data-social-kind="instagram"] {
  border-color: rgba(228, 64, 95, .45) !important;
  background:
    radial-gradient(
      circle at 32% 105%,
      #feda75 0%,
      #fa7e1e 30%,
      #d62976 54%,
      #962fbf 75%,
      #4f5bd5 100%
    ) !important;
  color: #fff !important;
}

/* Website */
.alumni-profile-launch-social-links
  a[data-social-kind="website"] {
  background: var(--app-surface-2) !important;
  color: var(--app-text-soft) !important;
}

.alumni-profile-launch-spotify {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(30, 215, 96, .42);
  border-radius: 999px;
  background: #16261c;
  color: #1ed760;
}

/* =========================================================
   PRIMARY ACTIONS
   ========================================================= */

.alumni-profile-launch-actions {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(0, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.alumni-profile-launch-primary,
.alumni-profile-launch-secondary {
  display: flex;
  width: 100%;
  height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 850;
  text-decoration: none;
}

.alumni-profile-launch-primary {
  border: 1px solid
    color-mix(
      in srgb,
      var(--app-text) 88%,
      var(--app-border)
    );
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-profile-launch-secondary {
  border: 1px solid var(--app-border);
  background: var(--app-surface-2);
  color: var(--app-text-soft);
}

/* =========================================================
   STATS
   ========================================================= */

.alumni-profile-launch-stats {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  margin-top: 15px;
  border-bottom: 1px solid var(--app-border);
}

.alumni-profile-launch-stats > * {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 62px;
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
  font-size: 15px;
  font-weight: 950;
  line-height: 1;
}

.alumni-profile-launch-stats span {
  margin-top: 6px;
  color: var(--app-muted-2);
  font-size: 8.5px;
  font-weight: 620;
  line-height: 1;
}

/* =========================================================
   TABS
   ========================================================= */

.alumni-profile-launch-tabs {
  position: sticky;
  top: 0;
  z-index: 24;
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  min-height: 49px;
  border-bottom: 1px solid var(--app-border);
  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    );
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

.alumni-profile-launch-tabs
  button[data-active="true"] {
  color: var(--app-text);
}

.alumni-profile-launch-tabs
  button[data-active="true"]::after {
  content: "";
  position: absolute;
  right: 17px;
  bottom: 0;
  left: 17px;
  height: 2px;
  border-radius: 999px;
  background: var(--app-text);
}

/* =========================================================
   POSTS
   ========================================================= */

.alumni-profile-launch-feed {
  padding: 13px 12px
    calc(30px + env(safe-area-inset-bottom));
}

.alumni-profile-launch-post-list {
  display: grid;
  min-width: 0;
  gap: 12px;
}

.alumni-profile-launch-post {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
}

.alumni-profile-launch-post-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;
  padding: 13px 13px 0;
}

.alumni-profile-launch-post-avatar {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-2);
}

.alumni-profile-launch-post-author {
  min-width: 0;
  flex: 1 1 auto;
}

.alumni-profile-launch-post-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.alumni-profile-launch-post-name strong {
  min-width: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-launch-post-author > span {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--app-muted-2);
  font-size: 9.5px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-launch-pin {
  flex: 0 0 auto;
  padding: 4px 7px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 7.5px;
  font-weight: 850;
}

.alumni-profile-launch-post-copy {
  margin: 11px 0 0;
  padding: 0 13px;
  white-space: pre-wrap;
  color: var(--app-text-soft);
  font-size: 12.5px;
  font-weight: 440;
  line-height: 1.48;
}

.alumni-profile-launch-media {
  margin-top: 11px;
  overflow: hidden;
  background: #05070b;
}

.alumni-profile-launch-media button {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
}

.alumni-profile-launch-media img {
  display: block;
  width: 100%;
  max-height: 570px;
  object-fit: contain;
}

.alumni-profile-launch-post-footer {
  display: flex;
  min-height: 47px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 13px;
}

.alumni-profile-launch-engagement {
  display: flex;
  align-items: center;
  gap: 20px;
}

.alumni-profile-launch-engagement span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 700;
}

/* =========================================================
   SAVED
   ========================================================= */

.alumni-profile-launch-saved {
  min-width: 0;
  padding:
    13px 12px
    calc(30px + env(safe-area-inset-bottom));
}

/* =========================================================
   ACTIVITY — EXACT LIST LANGUAGE
   ========================================================= */

.alumni-profile-launch-activity {
  padding:
    7px 16px
    calc(30px + env(safe-area-inset-bottom));
}

.alumni-profile-launch-activity-row {
  display: flex;
  min-width: 0;
  min-height: 66px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--app-border);
  color: inherit;
  text-decoration: none;
}

.alumni-profile-launch-activity-icon {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text-soft);
}

.alumni-profile-launch-activity-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.alumni-profile-launch-activity-copy strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 11.5px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-launch-activity-copy small {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color: var(--app-muted-2);
  font-size: 9px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-launch-activity-row
  > svg {
  flex: 0 0 auto;
  color: var(--app-muted-3);
}

/* =========================================================
   EMPTY
   ========================================================= */

.alumni-profile-launch-empty {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 20px;
  border: 1px dashed var(--app-border);
  border-radius: 18px;
  background: var(--app-soft);
  text-align: center;
}

.alumni-profile-launch-empty strong {
  color: var(--app-text);
  font-size: 12.5px;
}

.alumni-profile-launch-empty span {
  max-width: 270px;
  margin-top: 7px;
  color: var(--app-muted-2);
  font-size: 10px;
  line-height: 1.45;
}

/* =========================================================
   LIGHT / DARK
   ========================================================= */

html[data-theme="light"]
  .alumni-profile-launch,
html[data-theme="light"]
  .alumni-profile-launch-shell {
  background: #ffffff;
}

html[data-theme="light"]
  .alumni-profile-launch-avatar {
  border-color: #ffffff;
}

html[data-theme="dark"]
  .alumni-profile-launch,
html[data-theme="dark"]
  .alumni-profile-launch-shell {
  background: var(--app-bg);
}

html[data-theme="dark"]
  .alumni-profile-launch-avatar {
  border-color: var(--app-bg);
}

/* =========================================================
   360PX SAFETY
   ========================================================= */

@media (max-width: 374px) {
  .alumni-profile-launch-cover {
    height: 164px;
  }

  .alumni-profile-launch-avatar-wrap,
  .alumni-profile-launch-avatar {
    width: 84px;
    height: 84px;
  }

  .alumni-profile-launch-avatar-wrap {
    flex-basis: 84px;
  }

  .alumni-profile-launch-passport {
    height: 36px;
    max-width: 145px;
    padding-inline: 10px;
    font-size: 9px;
  }

  .alumni-profile-launch-name-row h1 {
    font-size: 19px;
  }

  .alumni-profile-launch-social-links a,
  .alumni-profile-launch-spotify {
    width: 36px !important;
    height: 36px !important;
    max-width: 36px !important;
    flex-basis: 36px;
  }

  .alumni-profile-launch-primary,
  .alumni-profile-launch-secondary {
    height: 40px;
    font-size: 10px;
  }

  .alumni-profile-launch-tabs button {
    font-size: 10.5px;
  }
}

/* =========================================================
   DESKTOP — SAME DESIGN, CENTERED
   ========================================================= */

@media (min-width: 700px) {
  .alumni-profile-launch {
    width: 100%;
    max-width: 580px;
    margin: 18px auto 48px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 25px;
    box-shadow:
      0 24px 70px
      color-mix(
        in srgb,
        #000 22%,
        transparent
      );
  }

  .alumni-profile-launch-cover {
    height: 214px;
  }
}
`;

/* ================================================================
   7) VALIDAR TSX ANTES DE ESCRIBIR
   ================================================================ */

const requiredProfileTokens = [
  'data-profile-design="option-3-launch-match"',
  "alumni-profile-launch-passport",
  "ProfileSocialLinks",
  "SpotifyLogo",
  "alumni-profile-launch-actions",
  "alumni-profile-launch-stats",
  "alumni-profile-launch-tabs",
  'setTab("posts")',
  'setTab("saved")',
  'setTab("activity")',
  "ProfileSavedTab",
  "Sobre mí",
  "Trayectoria académica",
  "Experiencia profesional",
  "Enlaces",
  "Música",
  "Pasaporte Alumni",
];

for (const token of requiredProfileTokens) {
  if (!source.includes(token)) {
    fail("Validación Profile 1.2.0: falta " + token);
  }
}

if (!socials.includes("data-social-kind")) {
  fail("Validación ProfileSocialLinks: faltó data-social-kind.");
}

/*
 * TypeScript parser check.
 * Si el TSX está mal formado, el parche NO escribe nada.
 */
try {
  const ts = require("typescript");

  for (const [name, code] of [
    ["src/app/profile/page.tsx", source],
    ["src/components/profile/ProfileSocialLinks.tsx", socials],
  ]) {
    const parsed = ts.createSourceFile(
      name,
      code,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length > 0) {
      const first = diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start === "number"
          ? parsed.getLineAndCharacterOfPosition(
              first.start
            )
          : null;

      fail(
        `${name}: error de sintaxis` +
          (pos
            ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
            : "") +
          `: ${message}`
      );
    }
  }

  console.log("✅ Parser TypeScript: ambos TSX válidos");
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code === "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ No se pudo cargar TypeScript para validación extra."
    );
  } else {
    throw error;
  }
}

/* ================================================================
   8) BACKUPS + GUARDADO
   ================================================================ */

const profileBackup =
  PROFILE + ".before-profile-1.2.0.bak";

const socialBackup =
  SOCIALS + ".before-profile-1.2.0.bak";

if (!fs.existsSync(profileBackup)) {
  fs.copyFileSync(PROFILE, profileBackup);
}

if (!fs.existsSync(socialBackup)) {
  fs.copyFileSync(SOCIALS, socialBackup);
}

source += `\n/* ${MARKER} */\n`;
socials += `\n/* ${MARKER} */\n`;

fs.writeFileSync(PROFILE, source, "utf8");
fs.writeFileSync(SOCIALS, socials, "utf8");
fs.writeFileSync(CSS, css, "utf8");

/* Borrar solo CSS provisionales generados por nuestros parches anteriores. */
for (const file of OLD_CSS_FILES) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(
      "✅ CSS provisional retirado:",
      path.basename(file)
    );
  }
}

console.log("");
console.log("✅ ALUMNI Profile 1.2.0 — Launch Match aplicado.");
console.log("✅ /profile real.");
console.log("✅ Opción 3 reconstruida según el diseño aprobado.");
console.log("✅ Portada.");
console.log("✅ Avatar superpuesto + acceso para cambiar foto.");
console.log("✅ Pasaporte Alumni visible en el encabezado.");
console.log("✅ Nombre + @usuario + verificación cuando exista.");
console.log("✅ Carrera + universidad + ubicación.");
console.log("✅ Logos sociales originales restaurados y visibles.");
console.log("✅ Spotify visible si existe música configurada.");
console.log("✅ Editar perfil + Compartir.");
console.log("✅ Métricas.");
console.log("✅ Posts / Guardados / Actividad.");
console.log("✅ Actividad con filas profesionales y funcionales.");
console.log("✅ Una sola capa CSS para evitar estilos montados.");
console.log("✅ Mobile-first 360–430 px.");
console.log("✅ Claro/Oscuro.");
console.log("");
console.log("Ahora ejecutá: npm run build");
