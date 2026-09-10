
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_1_1_PROFESSIONAL_EXACT";
const PROFILE = path.join(ROOT, "src", "app", "profile", "page.tsx");
const CSS = path.join(ROOT, "src", "app", "profile", "profile-professional-exact-1-1-1.css");

if (!fs.existsSync(PROFILE)) {
  console.error("❌ No encontré:", PROFILE);
  console.error("Ejecutá este archivo dentro de alumni-web.");
  process.exit(1);
}

let source = fs.readFileSync(PROFILE, "utf8").replace(/\r\n/g, "\n");
console.log("✅ /profile detectado");
console.log("✅ CRLF/LF normalizado");

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function ensureImport(anchor, line, label) {
  if (source.includes(line)) {
    console.log("ℹ️ " + label + " ya importado");
    return;
  }
  if (!source.includes(anchor)) {
    fail("No encontré el punto de importación para " + label);
  }
  source = source.replace(anchor, `${anchor}\n${line}`);
  console.log("✅ " + label);
}

if (source.includes(MARKER) && fs.existsSync(CSS)) {
  console.log("ℹ️ El perfil profesional exacto ya está aplicado.");
  process.exit(0);
}

ensureImport(
  'import ProfessionalProfileOverview from "@/components/profile/ProfessionalProfileOverview";',
  'import ProfileSavedTab from "@/components/profile/ProfileSavedTab";',
  'ProfileSavedTab'
);

ensureImport(
  'import "./profile-visual-2-8.css";',
  'import "./profile-professional-exact-1-1-1.css";',
  'CSS profesional exacto'
);

source = source.replace(
  'type ProfileTab = "posts" | "about";',
  'type ProfileTab = "posts" | "saved" | "activity";'
);

const profileGuard = source.indexOf('  if (!profile) {');
if (profileGuard < 0) {
  fail('No encontré el bloque !profile.');
}
const renderStart = source.indexOf('  return (', profileGuard);
if (renderStart < 0) {
  fail('No encontré el return principal del perfil.');
}
const helperStart = source.indexOf('\nfunction Stat({', renderStart);
if (helperStart < 0) {
  fail('No encontré el final del render principal.');
}

const newRender = `  return (
    <AppShell>
      <div className="alumni-profile-pro" data-profile-design="option-3-pro-exact">
        <section className="alumni-profile-pro-shell">
          <section className="alumni-profile-pro-hero">
            <div className="alumni-profile-pro-cover">
              {profile.banner_url ? (
                <HDProfileImage
                  src={profile.banner_url}
                  alt="Portada"
                  variant="banner"
                  className="alumni-profile-pro-cover-image"
                />
              ) : (
                <div className="alumni-profile-pro-cover-fallback" />
              )}

              <div className="alumni-profile-pro-cover-overlay" />

              <button
                type="button"
                onClick={() => router.back()}
                className="alumni-profile-pro-top alumni-profile-pro-top-left"
                aria-label="Volver"
              >
                ←
              </button>

              <Link
                href="/settings"
                className="alumni-profile-pro-top alumni-profile-pro-top-right"
                aria-label="Configuración"
                title="Configuración"
              >
                <Settings size={18} />
              </Link>
            </div>

            <div className="alumni-profile-pro-main">
              <div className="alumni-profile-pro-avatar-slot">
                <div className="alumni-profile-pro-avatar">
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
              </div>

              <div className="alumni-profile-pro-identity">
                <h1>{profile.full_name || "Mi perfil"}</h1>
                <p className="alumni-profile-pro-handle">@{profile.username}</p>

                {(profile.career || profile.education_program_name) && (
                  <p className="alumni-profile-pro-line">
                    <Briefcase size={14} />
                    <span>{profile.career || profile.education_program_name}</span>
                  </p>
                )}

                {(profile.university || profile.education_institution_name) && (
                  <p className="alumni-profile-pro-line">
                    <GraduationCap size={14} />
                    <span>{profile.university || profile.education_institution_name}</span>
                  </p>
                )}

                {(profile.city || profile.country) && (
                  <p className="alumni-profile-pro-line">
                    <MapPin size={14} />
                    <span>{[profile.city, profile.country].filter(Boolean).join(", ")}</span>
                  </p>
                )}
              </div>

              <div className="alumni-profile-pro-actions">
                <Link
                  href="/settings?section=profile&edit=1"
                  className="alumni-profile-pro-primary"
                >
                  <Pencil size={15} />
                  Editar perfil
                </Link>

                <button
                  type="button"
                  onClick={shareProfile}
                  className="alumni-profile-pro-secondary"
                >
                  <Share2 size={15} />
                  Compartir
                </button>
              </div>

              <div className="alumni-profile-pro-stats">
                <button
                  type="button"
                  onClick={() => setTab("posts")}
                  className="alumni-profile-pro-stat"
                >
                  <strong>{posts.length}</strong>
                  <span>Publicaciones</span>
                </button>

                <div className="alumni-profile-pro-stat">
                  <strong>{followers}</strong>
                  <span>Seguidores</span>
                </div>

                <div className="alumni-profile-pro-stat">
                  <strong>{following}</strong>
                  <span>Siguiendo</span>
                </div>
              </div>
            </div>
          </section>

          <nav className="alumni-profile-pro-tabs" aria-label="Secciones de mi perfil">
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

          {tab === "posts" ? (
            <section className="alumni-profile-pro-feed">
              {posts.length === 0 ? (
                <div className="alumni-profile-pro-empty">
                  <strong>Aún no tienes publicaciones.</strong>
                  <span>Cuando publiques en Alumni, aparecerá aquí.</span>
                </div>
              ) : (
                <div className="alumni-profile-pro-post-list">
                  {posts.map((post: any) => (
                    <article key={post.id} className="alumni-profile-pro-post">
                      <header className="alumni-profile-pro-post-head">
                        <div className="alumni-profile-pro-post-avatar">
                          <AlumniAvatar
                            src={profile.avatar_url}
                            name={profile.username}
                            alt="Avatar"
                            className="h-full w-full"
                            imageClassName="h-full w-full object-cover"
                          />
                        </div>

                        <div className="alumni-profile-pro-post-author">
                          <strong>{profile.full_name || ("@" + profile.username)}</strong>
                          <span>
                            @{profile.username} · {formatDistanceToNow(new Date(post.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                        </div>

                        {post.pinned && (
                          <span className="alumni-profile-pro-pin-badge">Fijada</span>
                        )}
                      </header>

                      {post.content && (
                        <p className="alumni-profile-pro-post-copy">{post.content}</p>
                      )}

                      {post.image_url && (
                        <div className="alumni-profile-pro-media">
                          <button
                            type="button"
                            onClick={() => setSelectedProfileMedia(post.image_url)}
                            aria-label="Abrir fotografía"
                          >
                            <img src={post.image_url} alt="Publicación" />
                          </button>
                        </div>
                      )}

                      <footer className="alumni-profile-pro-post-foot">
                        <div className="alumni-profile-pro-engagement">
                          <span>
                            <Heart size={16} />
                            {post.likes?.length || 0}
                          </span>

                          <span>
                            <MessageCircle size={16} />
                            {post.comments?.length || 0}
                          </span>
                        </div>

                        <div className="alumni-profile-pro-owner">
                          <ProfilePostOwnerMenu
                            post={post}
                            pinned={Boolean(post.pinned)}
                            onEdit={(content) => editProfilePost(post.id, content)}
                            onTogglePin={() => toggleProfilePin(post.id)}
                            onDelete={() => deleteProfilePost(post.id)}
                          />
                        </div>
                      </footer>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : tab === "saved" ? (
            <section className="alumni-profile-pro-saved">
              <ProfileSavedTab userId={profile.id} />
            </section>
          ) : (
            <section className="alumni-profile-pro-activity">
              {profile.bio && (
                <div className="alumni-profile-pro-card">
                  <span className="alumni-profile-pro-card-label">Acerca de</span>
                  <p className="alumni-profile-pro-card-text">{profile.bio}</p>
                </div>
              )}

              <div className="alumni-profile-pro-card">
                <ProfessionalProfileOverview
                  profile={profile}
                  posts={posts}
                  followers={followers}
                  following={following}
                  own
                />
              </div>

              <div className="alumni-profile-pro-card">
                <ProfileHeaderFacts profile={profile} />
              </div>

              <div className="alumni-profile-pro-card">
                <ProfileIdentityMeta profile={profile} />
              </div>

              <div className="alumni-profile-pro-card">
                <ProfileSocialLinks profile={profile} className="" />
              </div>

              {profileMusic && (
                <div className="alumni-profile-pro-card">
                  <ProfileMusicCard track={profileMusic} className="" />
                </div>
              )}

              <div className="alumni-profile-pro-card">
                <ProfilePassportPreview
                  userId={profile.id}
                  username={profile.username}
                  own
                />
              </div>
            </section>
          )}
        </section>
      </div>

      {selectedProfileMedia && (
        <AlumniMediaViewer
          src={selectedProfileMedia}
          type="image"
          alt="Publicación ampliada"
          onClose={() => setSelectedProfileMedia(null)}
        />
      )}
    </AppShell>
  );
}

/* ${MARKER} */
`;

source = source.slice(0, renderStart) + newRender + source.slice(helperStart);

const css = `/*
 * ${MARKER}
 * Perfil profesional exacto para /profile
 * Base visual: telefono 360-430 px.
 */

.alumni-profile-pro {
  width: calc(100% + 32px);
  margin: 0 -16px;
  color: var(--app-text);
  background: var(--app-bg);
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.alumni-profile-pro-shell {
  width: 100%;
  background: var(--app-bg);
}

.alumni-profile-pro-cover {
  position: relative;
  width: 100%;
  height: 194px;
  overflow: hidden;
  background: #101722;
}

.alumni-profile-pro-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-profile-pro-cover-fallback {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 25% 20%, rgba(120,124,255,.35), transparent 32%), linear-gradient(145deg, #172235 0%, #0f1520 48%, #111722 100%);
}

.alumni-profile-pro-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,.04) 0%, rgba(0,0,0,.08) 48%, rgba(0,0,0,.56) 100%);
  pointer-events: none;
}

.alumni-profile-pro-top {
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
  background: rgba(7,10,15,.46);
  color: #fff;
  text-decoration: none;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.alumni-profile-pro-top-left {
  left: 12px;
  font-size: 20px;
  font-weight: 500;
}

.alumni-profile-pro-top-right {
  right: 12px;
}

.alumni-profile-pro-main {
  position: relative;
  padding: 0 16px 0;
  background: var(--app-bg);
}

.alumni-profile-pro-avatar-slot {
  height: 46px;
}

.alumni-profile-pro-avatar {
  position: absolute;
  top: -44px;
  left: 16px;
  z-index: 5;
  width: 88px;
  height: 88px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 3px solid var(--app-bg);
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 23px;
  font-weight: 900;
  box-shadow: 0 8px 24px rgba(0,0,0,.18);
}

.alumni-profile-pro-identity {
  padding-top: 2px;
}

.alumni-profile-pro-identity h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 22px;
  line-height: 1.08;
  font-weight: 950;
  letter-spacing: -.04em;
}

.alumni-profile-pro-handle {
  margin-top: 4px;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.2;
}

.alumni-profile-pro-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 7px;
  color: var(--app-text-soft);
  font-size: 11.5px;
  line-height: 1.35;
}

.alumni-profile-pro-line svg {
  flex: 0 0 auto;
  color: var(--app-muted-2);
}

.alumni-profile-pro-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.alumni-profile-pro-primary,
.alumni-profile-pro-secondary {
  height: 42px;
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 850;
  text-decoration: none;
  white-space: nowrap;
}

.alumni-profile-pro-primary {
  border: 0;
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-profile-pro-secondary {
  border: 1px solid var(--app-border);
  background: var(--app-soft);
  color: var(--app-text-soft);
}

.alumni-profile-pro-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 16px;
  border-bottom: 1px solid var(--app-border);
}

.alumni-profile-pro-stat {
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

.alumni-profile-pro-stats > * + *::before {
  content: "";
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 1px;
  background: var(--app-border);
}

.alumni-profile-pro-stat strong {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 950;
  line-height: 1;
}

.alumni-profile-pro-stat span {
  margin-top: 6px;
  color: var(--app-muted-2);
  font-size: 8.5px;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: .04em;
}

.alumni-profile-pro-tabs {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-height: 48px;
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg) 96%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.alumni-profile-pro-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--app-muted-2);
  font-size: 11px;
  font-weight: 800;
}

.alumni-profile-pro-tabs button[data-active="true"] {
  color: var(--app-text);
}

.alumni-profile-pro-tabs button[data-active="true"]::after {
  content: "";
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 2px;
  border-radius: 99px;
  background: var(--app-accent);
}

.alumni-profile-pro-feed,
.alumni-profile-pro-saved,
.alumni-profile-pro-activity {
  padding: 14px 12px 28px;
}

.alumni-profile-pro-post-list,
.alumni-profile-pro-activity {
  display: grid;
  gap: 12px;
}

.alumni-profile-pro-post {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 20px;
  background: var(--app-surface);
  box-shadow: 0 1px 0 var(--app-border);
}

.alumni-profile-pro-post-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 0;
}

.alumni-profile-pro-post-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-2);
}

.alumni-profile-pro-post-author {
  min-width: 0;
  flex: 1;
}

.alumni-profile-pro-post-author strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12.5px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-pro-post-author span {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--app-muted-2);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-pro-pin-badge {
  flex: 0 0 auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--app-accent-soft);
  color: var(--app-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: .04em;
}

.alumni-profile-pro-post-copy {
  margin: 12px 0 0;
  padding: 0 14px;
  color: var(--app-text-soft);
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}

.alumni-profile-pro-media {
  margin-top: 12px;
  background: #05070b;
}

.alumni-profile-pro-media button {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
}

.alumni-profile-pro-media img {
  display: block;
  width: 100%;
  max-height: 590px;
  object-fit: contain;
}

.alumni-profile-pro-post-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px 12px;
}

.alumni-profile-pro-engagement {
  display: flex;
  align-items: center;
  gap: 16px;
}

.alumni-profile-pro-engagement span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 700;
}

.alumni-profile-pro-empty {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 20px;
  border: 1px dashed var(--app-border);
  border-radius: 18px;
  background: var(--app-soft);
  text-align: center;
}

.alumni-profile-pro-empty strong {
  color: var(--app-text);
  font-size: 13px;
}

.alumni-profile-pro-empty span {
  max-width: 270px;
  margin-top: 7px;
  color: var(--app-muted-2);
  font-size: 11px;
  line-height: 1.45;
}

.alumni-profile-pro-card {
  overflow: hidden;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
}

.alumni-profile-pro-card-label {
  color: var(--app-muted-2);
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.alumni-profile-pro-card-text {
  margin-top: 8px;
  color: var(--app-text-soft);
  font-size: 12px;
  line-height: 1.55;
}

html[data-theme="light"] .alumni-profile-pro,
html[data-theme="light"] .alumni-profile-pro-shell {
  background: #fff;
}

html[data-theme="dark"] .alumni-profile-pro,
html[data-theme="dark"] .alumni-profile-pro-shell {
  background: var(--app-bg);
}

@media (max-width: 374px) {
  .alumni-profile-pro-cover {
    height: 176px;
  }

  .alumni-profile-pro-avatar {
    width: 82px;
    height: 82px;
  }

  .alumni-profile-pro-identity h1 {
    font-size: 20px;
  }

  .alumni-profile-pro-primary,
  .alumni-profile-pro-secondary {
    height: 40px;
    font-size: 10px;
    padding-inline: 8px;
  }

  .alumni-profile-pro-tabs button {
    font-size: 10.5px;
  }
}

@media (min-width: 700px) {
  .alumni-profile-pro {
    width: 100%;
    max-width: 580px;
    margin: 18px auto 48px;
    border: 1px solid var(--app-border);
    border-radius: 26px;
    overflow: hidden;
    box-shadow: 0 24px 70px var(--app-shadow);
  }
}
`;

fs.writeFileSync(CSS, css, "utf8");

const required = [
  'data-profile-design="option-3-pro-exact"',
  'alumni-profile-pro-shell',
  'alumni-profile-pro-cover',
  'alumni-profile-pro-avatar',
  'alumni-profile-pro-actions',
  'alumni-profile-pro-stats',
  'alumni-profile-pro-tabs',
  'setTab("posts")',
  'setTab("saved")',
  'setTab("activity")',
  'ProfileSavedTab userId={profile.id}',
  'ProfessionalProfileOverview',
  'ProfilePassportPreview',
  'ProfileMusicCard',
];

for (const token of required) {
  if (!source.includes(token)) {
    try { fs.unlinkSync(CSS); } catch {}
    fail('Validación final: falta ' + token);
  }
}

fs.writeFileSync(PROFILE, source, 'utf8');

console.log('');
console.log('✅ ALUMNI Profile 1.1.1 aplicado COMPLETO.');
console.log('✅ Se modificó /profile real.');
console.log('✅ Perfil alineado a una versión profesional de la opción 3.');
console.log('✅ Header limpio con portada.');
console.log('✅ Avatar superpuesto.');
console.log('✅ Identidad y metadatos compactos.');
console.log('✅ Editar perfil + Compartir.');
console.log('✅ Métricas en una sola fila.');
console.log('✅ Tabs: Posts / Guardados / Actividad.');
console.log('✅ Posts como foco principal.');
console.log('✅ Actividad agrupa el contenido secundario.');
console.log('✅ Mobile-first 360-430 px.');
console.log('✅ Claro/Oscuro.');
console.log('');
console.log('Ahora ejecutá: npm run build');
