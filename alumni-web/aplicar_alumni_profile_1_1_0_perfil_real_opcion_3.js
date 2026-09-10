const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_1_0_OWN_PROFILE_OPTION_3_EXACT";
const PROFILE = path.join(ROOT, "src", "app", "profile", "page.tsx");
const CSS = path.join(ROOT, "src", "app", "profile", "profile-option-3-own.css");

if (!fs.existsSync(PROFILE)) {
  console.error("❌ No encontré:", PROFILE);
  console.error("Ejecutá este parche desde alumni-web.");
  process.exit(1);
}

let source = fs.readFileSync(PROFILE, "utf8").replace(/\r\n/g, "\n");

console.log("✅ Trabajando sobre el apartado Perfil real: /profile");
console.log("✅ CRLF/LF normalizado");

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (source.includes(MARKER) && fs.existsSync(CSS)) {
  console.log("ℹ️ Profile 1.1.0 ya está aplicado.");
  process.exit(0);
}

/* ================================================================
   1) IMPORTS REALES
   ================================================================ */

if (!source.includes('import ProfileSavedTab from "@/components/profile/ProfileSavedTab";')) {
  const anchor =
    'import ProfessionalProfileOverview from "@/components/profile/ProfessionalProfileOverview";';

  if (!source.includes(anchor)) {
    fail("No encontré ProfessionalProfileOverview.");
  }

  source = source.replace(
    anchor,
    `${anchor}
import ProfileSavedTab from "@/components/profile/ProfileSavedTab";`
  );

  console.log("✅ Guardados agregado al perfil real");
}

if (!source.includes('import "./profile-option-3-own.css";')) {
  const anchor = 'import "./profile-visual-2-8.css";';

  if (!source.includes(anchor)) {
    fail("No encontré profile-visual-2-8.css.");
  }

  source = source.replace(
    anchor,
    `${anchor}
import "./profile-option-3-own.css";`
  );

  console.log("✅ CSS exclusivo del perfil propio importado");
}

/* ================================================================
   2) TABS EXACTAS: POSTS / GUARDADOS / ACTIVIDAD
   ================================================================ */

source = source.replace(
  `type ProfileTab = "posts" | "about";`,
  `type ProfileTab = "posts" | "saved" | "activity";`
);

/* ================================================================
   3) REEMPLAZAR SOLO LA UI DEL PERFIL PROPIO
   Conserva getProfile, caché, Supabase, media viewer, edición y borrado.
   ================================================================ */

const startNeedle = `  return (
    <AppShell>
      <div className="alumni-profile-page alumni-profile-v2`;

const renderStart = source.indexOf(startNeedle);

if (renderStart < 0) {
  fail("No encontré el render actual del perfil propio.");
}

const helperStart = source.indexOf("\nfunction Stat({", renderStart);

if (helperStart < 0) {
  fail("No encontré el final del render del perfil.");
}

const newRender = `  return (
    <AppShell>
      <div
        className="alumni-own-profile-v3"
        data-profile-design="option-3-activity-own"
      >
        {/* PORTADA */}
        <section className="alumni-own-profile-v3-hero">
          <div className="alumni-own-profile-v3-cover">
            {profile.banner_url ? (
              <HDProfileImage
                src={profile.banner_url}
                alt="Portada"
                variant="banner"
                className="alumni-own-profile-v3-cover-image"
              />
            ) : (
              <div className="alumni-own-profile-v3-cover-fallback" />
            )}

            <div className="alumni-own-profile-v3-cover-shade" />

            <button
              type="button"
              onClick={() => router.back()}
              className="alumni-own-profile-v3-top-button is-left"
              aria-label="Volver"
            >
              <span aria-hidden="true">←</span>
            </button>

            <Link
              href="/settings"
              className="alumni-own-profile-v3-top-button is-right"
              aria-label="Configuración"
              title="Configuración"
            >
              <Settings size={18} />
            </Link>
          </div>

          <div className="alumni-own-profile-v3-main">
            <div className="alumni-own-profile-v3-avatar-wrap">
              <div className="alumni-own-profile-v3-avatar">
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
            </div>

            <div className="alumni-own-profile-v3-identity">
              <h1>
                {profile.full_name ||
                  \`@\${profile.username}\`}
              </h1>

              <p className="alumni-own-profile-v3-handle">
                @{profile.username}
              </p>

              {(profile.career ||
                profile.education_program_name) && (
                <p className="alumni-own-profile-v3-role">
                  {profile.career ||
                    profile.education_program_name}
                  <span> · Alumni</span>
                </p>
              )}

              {(profile.university ||
                profile.education_institution_name) && (
                <p className="alumni-own-profile-v3-fact">
                  <GraduationCap size={14} />
                  <span>
                    {profile.university ||
                      profile.education_institution_name}
                  </span>
                </p>
              )}

              {(profile.city || profile.country) && (
                <p className="alumni-own-profile-v3-fact">
                  <MapPin size={14} />
                  <span>
                    {[profile.city, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
            </div>

            <div className="alumni-own-profile-v3-actions">
              <Link
                href="/settings?section=profile&edit=1"
                className="alumni-own-profile-v3-primary"
              >
                <Pencil size={15} />
                Editar perfil
              </Link>

              <button
                type="button"
                onClick={shareProfile}
                className="alumni-own-profile-v3-secondary"
              >
                <Share2 size={15} />
                Compartir
              </button>
            </div>

            <div className="alumni-own-profile-v3-stats">
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

        {/* NAVEGACIÓN DEL PERFIL */}
        <nav
          className="alumni-own-profile-v3-tabs"
          aria-label="Secciones de mi perfil"
        >
          <button
            type="button"
            data-active={tab === "posts" ? "true" : "false"}
            onClick={() => setTab("posts")}
          >
            Posts
          </button>

          <button
            type="button"
            data-active={tab === "saved" ? "true" : "false"}
            onClick={() => setTab("saved")}
          >
            Guardados
          </button>

          <button
            type="button"
            data-active={tab === "activity" ? "true" : "false"}
            onClick={() => setTab("activity")}
          >
            Actividad
          </button>
        </nav>

        {/* POSTS COMO PROTAGONISTA */}
        {tab === "posts" ? (
          <section className="alumni-own-profile-v3-feed">
            {posts.length === 0 ? (
              <div className="alumni-own-profile-v3-empty">
                <strong>Aún no tienes publicaciones.</strong>
                <span>
                  Cuando publiques algo en Alumni,
                  aparecerá aquí.
                </span>
              </div>
            ) : (
              <div className="alumni-own-profile-v3-post-list">
                {posts.map((post: any) => (
                  <article
                    key={post.id}
                    className="alumni-own-profile-v3-post"
                  >
                    <header className="alumni-own-profile-v3-post-head">
                      <div className="alumni-own-profile-v3-post-avatar">
                        <AlumniAvatar
                          src={profile.avatar_url}
                          name={profile.username}
                          alt="Avatar"
                          className="h-full w-full"
                          imageClassName="h-full w-full object-cover"
                        />
                      </div>

                      <div className="alumni-own-profile-v3-post-author">
                        <strong>
                          {profile.full_name ||
                            \`@\${profile.username}\`}
                        </strong>
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
                        <span className="alumni-own-profile-v3-pinned">
                          Fijada
                        </span>
                      )}
                    </header>

                    {post.content && (
                      <p className="alumni-own-profile-v3-post-copy">
                        {post.content}
                      </p>
                    )}

                    {post.image_url && (
                      <div className="alumni-own-profile-v3-media">
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

                    <div className="alumni-own-profile-v3-post-foot">
                      <div className="alumni-own-profile-v3-engagement">
                        <span>
                          <Heart size={17} />
                          {post.likes?.length || 0}
                        </span>

                        <span>
                          <MessageCircle size={17} />
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
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : tab === "saved" ? (
          <section className="alumni-own-profile-v3-saved">
            <ProfileSavedTab userId={profile.id} />
          </section>
        ) : (
          <section className="alumni-own-profile-v3-activity">
            {profile.bio && (
              <div className="alumni-own-profile-v3-about-card">
                <span>Acerca de</span>
                <p>{profile.bio}</p>
              </div>
            )}

            <ProfessionalProfileOverview
              profile={profile}
              posts={posts}
              followers={followers}
              following={following}
              own
            />

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileHeaderFacts profile={profile} />
            </div>

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileIdentityMeta profile={profile} />
            </div>

            <div className="alumni-own-profile-v3-activity-block">
              <ProfileSocialLinks profile={profile} />
            </div>

            {profileMusic && (
              <div className="alumni-own-profile-v3-activity-block">
                <ProfileMusicCard track={profileMusic} />
              </div>
            )}

            <div className="alumni-own-profile-v3-activity-block">
              <ProfilePassportPreview
                userId={profile.id}
                username={profile.username}
                own
              />
            </div>
          </section>
        )}
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
   4) CSS NUEVO: AISLADO Y MOBILE-FIRST
   ================================================================ */

const css = `/*
 * ${MARKER}
 * Opción 3 exacta aplicada al APARTADO /profile.
 * Prioridad: teléfono 360–430px.
 */

.alumni-own-profile-v3 {
  width: calc(100% + 32px);
  max-width: none;
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

/* ---------- HERO ---------- */

.alumni-own-profile-v3-cover {
  position: relative;
  height: 184px;
  overflow: hidden;
  background: #111722;
}

.alumni-own-profile-v3-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-own-profile-v3-cover-fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(
      circle at 28% 24%,
      color-mix(
        in srgb,
        var(--app-accent) 34%,
        transparent
      ),
      transparent 35%
    ),
    linear-gradient(
      145deg,
      #172235,
      #0e1420 58%,
      #111722
    );
}

.alumni-own-profile-v3-cover-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(2,5,9,.05),
      rgba(2,5,9,.08) 48%,
      rgba(2,5,9,.62)
    );
  pointer-events: none;
}

.alumni-own-profile-v3-top-button {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  z-index: 4;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 13px;
  background: rgba(6,9,14,.48);
  color: #fff;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.alumni-own-profile-v3-top-button.is-left {
  left: 12px;
  font-size: 20px;
  font-weight: 500;
}

.alumni-own-profile-v3-top-button.is-right {
  right: 12px;
}

.alumni-own-profile-v3-main {
  position: relative;
  padding: 0 16px;
}

.alumni-own-profile-v3-avatar-wrap {
  height: 43px;
}

.alumni-own-profile-v3-avatar {
  position: absolute;
  top: -44px;
  left: 16px;
  z-index: 5;
  display: flex;
  width: 88px;
  height: 88px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 3px solid var(--app-bg);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 22px;
  font-weight: 900;
  box-shadow: 0 6px 20px rgba(0,0,0,.18);
}

.alumni-own-profile-v3-identity {
  padding-top: 4px;
}

.alumni-own-profile-v3-identity h1 {
  margin: 0;
  overflow: hidden;
  color: var(--app-text);
  font-size: 21px;
  line-height: 1.08;
  font-weight: 950;
  letter-spacing: -.04em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-own-profile-v3-handle {
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 12px;
}

.alumni-own-profile-v3-role {
  margin-top: 8px;
  color: var(--app-text-soft);
  font-size: 12px;
  font-weight: 590;
  line-height: 1.35;
}

.alumni-own-profile-v3-role span {
  color: var(--app-muted);
}

.alumni-own-profile-v3-fact {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  color: var(--app-muted);
  font-size: 11px;
  line-height: 1.3;
}

.alumni-own-profile-v3-fact svg {
  flex: 0 0 auto;
  color: var(--app-muted-2);
}

/* ---------- ACTIONS ---------- */

.alumni-own-profile-v3-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.alumni-own-profile-v3-primary,
.alumni-own-profile-v3-secondary {
  display: flex;
  min-width: 0;
  height: 42px;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.alumni-own-profile-v3-primary {
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-own-profile-v3-secondary {
  border: 1px solid var(--app-border);
  background: var(--app-soft);
  color: var(--app-text-soft);
}

/* ---------- STATS ---------- */

.alumni-own-profile-v3-stats {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0,1fr));
  margin-top: 16px;
  border-bottom: 1px solid var(--app-border);
}

.alumni-own-profile-v3-stats > * {
  position: relative;
  display: flex;
  min-height: 60px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
}

.alumni-own-profile-v3-stats > * + *::before {
  content: "";
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 1px;
  background: var(--app-border);
}

.alumni-own-profile-v3-stats strong {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 950;
  line-height: 1;
}

.alumni-own-profile-v3-stats span {
  margin-top: 6px;
  color: var(--app-muted-2);
  font-size: 8.5px;
  font-weight: 650;
}

/* ---------- TABS ---------- */

.alumni-own-profile-v3-tabs {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0,1fr));
  min-height: 48px;
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

.alumni-own-profile-v3-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--app-muted-2);
  font-size: 11px;
  font-weight: 760;
}

.alumni-own-profile-v3-tabs button[data-active="true"] {
  color: var(--app-text);
}

.alumni-own-profile-v3-tabs
  button[data-active="true"]::after {
  content: "";
  position: absolute;
  right: 18px;
  bottom: 0;
  left: 18px;
  height: 2px;
  border-radius: 99px;
  background: var(--app-accent);
}

/* ---------- POSTS ---------- */

.alumni-own-profile-v3-post {
  padding: 15px 16px 13px;
  border-bottom: 1px solid var(--app-border);
  background: var(--app-bg);
}

.alumni-own-profile-v3-post-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.alumni-own-profile-v3-post-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-2);
}

.alumni-own-profile-v3-post-author {
  min-width: 0;
  flex: 1;
}

.alumni-own-profile-v3-post-author strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12.5px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-own-profile-v3-post-author span {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--app-muted-2);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-own-profile-v3-pinned {
  flex: 0 0 auto;
  padding: 4px 7px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 8px;
  font-weight: 800;
}

.alumni-own-profile-v3-post-copy {
  margin: 12px 0 0;
  white-space: pre-wrap;
  color: var(--app-text-soft);
  font-size: 13px;
  font-weight: 440;
  line-height: 1.48;
}

.alumni-own-profile-v3-media {
  overflow: hidden;
  margin: 12px -16px 0;
  background: #05070b;
}

.alumni-own-profile-v3-media button {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
}

.alumni-own-profile-v3-media img {
  display: block;
  width: 100%;
  max-height: 590px;
  object-fit: contain;
}

.alumni-own-profile-v3-post-foot {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 8px;
}

.alumni-own-profile-v3-engagement {
  display: flex;
  align-items: center;
  gap: 18px;
}

.alumni-own-profile-v3-engagement span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 700;
}

/* ---------- SAVED / ACTIVITY ---------- */

.alumni-own-profile-v3-saved,
.alumni-own-profile-v3-activity {
  padding: 14px 16px 32px;
}

.alumni-own-profile-v3-activity {
  display: grid;
  gap: 12px;
}

.alumni-own-profile-v3-about-card,
.alumni-own-profile-v3-activity-block {
  min-width: 0;
  overflow: hidden;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
}

.alumni-own-profile-v3-about-card span {
  color: var(--app-muted-2);
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.alumni-own-profile-v3-about-card p {
  margin-top: 7px;
  color: var(--app-text-soft);
  font-size: 12px;
  line-height: 1.5;
}

.alumni-own-profile-v3-activity
  .alumni-profile-header-facts {
  margin-top: 0 !important;
  justify-content: flex-start !important;
}

.alumni-own-profile-v3-empty {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  text-align: center;
}

.alumni-own-profile-v3-empty strong {
  color: var(--app-text);
  font-size: 13px;
}

.alumni-own-profile-v3-empty span {
  max-width: 280px;
  margin-top: 7px;
  color: var(--app-muted-2);
  font-size: 11px;
  line-height: 1.45;
}

/* ---------- THEMES ---------- */

html[data-theme="light"] .alumni-own-profile-v3,
html[data-theme="light"] .alumni-own-profile-v3-post {
  background: #fff;
}

html[data-theme="dark"] .alumni-own-profile-v3,
html[data-theme="dark"] .alumni-own-profile-v3-post {
  background: var(--app-bg);
}

/* ---------- SMALL PHONES ---------- */

@media (max-width: 374px) {
  .alumni-own-profile-v3-cover {
    height: 170px;
  }

  .alumni-own-profile-v3-avatar {
    width: 82px;
    height: 82px;
  }

  .alumni-own-profile-v3-identity h1 {
    font-size: 19px;
  }

  .alumni-own-profile-v3-primary,
  .alumni-own-profile-v3-secondary {
    height: 40px;
    padding-inline: 9px;
    font-size: 10px;
  }

  .alumni-own-profile-v3-tabs button {
    font-size: 10.5px;
  }
}

/* ---------- DESKTOP SECONDARY ---------- */

@media (min-width: 700px) {
  .alumni-own-profile-v3 {
    width: 100%;
    max-width: 560px;
    margin: 18px auto 48px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    box-shadow: 0 24px 70px var(--app-shadow);
  }

  .alumni-own-profile-v3-cover {
    height: 215px;
  }
}
`;

fs.writeFileSync(CSS, css, "utf8");

/* ================================================================
   5) VALIDACIONES
   ================================================================ */

const required = [
  'data-profile-design="option-3-activity-own"',
  "alumni-own-profile-v3-cover",
  "alumni-own-profile-v3-avatar",
  "alumni-own-profile-v3-actions",
  "alumni-own-profile-v3-stats",
  "alumni-own-profile-v3-tabs",
  'setTab("posts")',
  'setTab("saved")',
  'setTab("activity")',
  "ProfileSavedTab",
  "ProfessionalProfileOverview",
  "ProfilePostOwnerMenu",
  "AlumniMediaViewer",
];

for (const token of required) {
  if (!source.includes(token)) {
    try { fs.unlinkSync(CSS); } catch {}
    fail("Validación final: falta " + token);
  }
}

if (
  source.includes(
    'className="alumni-profile-page alumni-profile-v2 mx-auto w-full max-w-[980px]"'
  )
) {
  try { fs.unlinkSync(CSS); } catch {}
  fail("Validación: la estructura vieja del /profile sigue activa.");
}

if (!css.includes("Prioridad: teléfono 360–430px")) {
  try { fs.unlinkSync(CSS); } catch {}
  fail("Validación: no quedó mobile-first.");
}

if (!source.includes(MARKER)) {
  source += `\n/* ${MARKER} */\n`;
}

fs.writeFileSync(PROFILE, source, "utf8");

console.log("");
console.log("✅ ALUMNI Profile 1.1.0 aplicado COMPLETO.");
console.log("✅ Se modificó /profile, NO Ajustes.");
console.log("✅ Opción 3 aplicada al perfil propio real.");
console.log("✅ Portada + avatar superpuesto.");
console.log("✅ Nombre, usuario, carrera, universidad y ubicación.");
console.log("✅ Editar perfil + Compartir.");
console.log("✅ Métricas: Publicaciones / Seguidores / Siguiendo.");
console.log("✅ Tabs: Posts / Guardados / Actividad.");
console.log("✅ Posts son el contenido principal.");
console.log("✅ Bio, datos, enlaces, música y pasaporte pasan a Actividad.");
console.log("✅ Sin columnas ni elementos montados en móvil.");
console.log("✅ Mobile-first 360–430 px.");
console.log("✅ Claro/Oscuro.");
console.log("✅ Supabase y lógica existente conservados.");
console.log("");
console.log("Ahora ejecutá: npm run build");
