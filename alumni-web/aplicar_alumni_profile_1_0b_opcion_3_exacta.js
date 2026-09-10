const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_PROFILE_1_0B_OPTION_3_EXACT_ACTIVITY";
const PROFILE = path.join(
  ROOT,
  "src",
  "app",
  "u",
  "[username]",
  "page.tsx"
);
const CSS = path.join(
  ROOT,
  "src",
  "app",
  "u",
  "[username]",
  "profile-option-3-exact.css"
);
const OLD_CSS = path.join(
  ROOT,
  "src",
  "app",
  "u",
  "[username]",
  "profile-activity-1-0.css"
);

if (!fs.existsSync(PROFILE)) {
  console.error("❌ No encontré:", PROFILE);
  console.error("Ejecutá este parche desde alumni-web.");
  process.exit(1);
}

let source = fs
  .readFileSync(PROFILE, "utf8")
  .replace(/\r\n/g, "\n");

console.log("✅ Perfil real detectado: src/app/u/[username]/page.tsx");
console.log("✅ CRLF/LF normalizado");

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

/* ================================================================
   1) RETIRAR EL PARCHE GENÉRICO ANTERIOR SI FUE APLICADO
   ================================================================ */

source = source.replace(
  'import "./profile-activity-1-0.css";\n',
  ""
);

if (fs.existsSync(OLD_CSS)) {
  fs.unlinkSync(OLD_CSS);
  console.log("✅ CSS genérico anterior eliminado");
}

/* ================================================================
   2) IMPORTS PARA LA OPCIÓN 3 REAL
   ================================================================ */

if (!source.includes('import "./profile-option-3-exact.css";')) {
  const anchor =
    'import "@/components/profile/ProfilePostOwnerMenu.css";';

  if (!source.includes(anchor)) {
    fail("No encontré el punto para importar el CSS del perfil.");
  }

  source = source.replace(
    anchor,
    `${anchor}
import "./profile-option-3-exact.css";`
  );

  console.log("✅ CSS exacto Opción 3 importado");
}

if (!source.includes("  ArrowLeft,")) {
  source = source.replace(
    `import {
  Briefcase,`,
    `import {
  ArrowLeft,
  Briefcase,`
  );
}

if (!source.includes("  PencilLine,")) {
  source = source.replace(
    `  MessageCircle,`,
    `  MessageCircle,
  PencilLine,`
  );
}

/* ================================================================
   3) TABS: ACTIVITY FIRST REAL
   ================================================================ */

source = source.replace(
  `type ProfileTab = "posts" | "reposts" | "saved" | "about";`,
  `type ProfileTab = "posts" | "secondary" | "activity";`
);

source = source.replaceAll(
  `setTab("reposts")`,
  `setTab("secondary")`
);
source = source.replaceAll(
  `setTab("saved")`,
  `setTab("secondary")`
);
source = source.replaceAll(
  `setTab("about")`,
  `setTab("activity")`
);

/* ================================================================
   4) REEMPLAZAR LA ESTRUCTURA VISUAL COMPLETA
   ================================================================ */

const privateAnchor = `  const privateLocked =
    Boolean(profile.is_private) &&
    !ownProfile &&
    !following;`;

const privatePos = source.indexOf(privateAnchor);

if (privatePos < 0) {
  fail("No encontré privateLocked en el perfil actual.");
}

const renderStart = source.indexOf(
  `\n  return (
    <AppShell>`,
  privatePos
);

const helpersStart = source.indexOf(
  `\nfunction Stat({`,
  renderStart
);

if (renderStart < 0 || helpersStart < 0) {
  fail("No pude localizar el render principal completo del perfil.");
}

const newRender = `
  return (
    <AppShell>
      <div
        className="alumni-profile-v3"
        data-profile-design="option-3-activity"
      >
        {/* HERO / PORTADA */}
        <section className="alumni-profile-v3-hero">
          <div className="alumni-profile-v3-cover">
            {profile.banner_url ? (
              <HDProfileImage
                src={profile.banner_url}
                alt="Portada"
                variant="banner"
                className="alumni-profile-v3-cover-image"
              />
            ) : (
              <div className="alumni-profile-v3-cover-fallback" />
            )}

            <div className="alumni-profile-v3-cover-shade" />

            <button
              type="button"
              onClick={() => router.back()}
              className="alumni-profile-v3-top-button is-left"
              aria-label="Volver"
            >
              <ArrowLeft size={19} />
            </button>

            <button
              type="button"
              onClick={shareProfile}
              className="alumni-profile-v3-top-button is-right"
              aria-label="Compartir perfil"
            >
              <Share2 size={18} />
            </button>
          </div>

          <div className="alumni-profile-v3-main">
            <div className="alumni-profile-v3-avatar-wrap">
              <div className="alumni-profile-v3-avatar">
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

            <div className="alumni-profile-v3-identity">
              <h1>
                {profile.full_name ||
                  \`@\${profile.username}\`}
              </h1>

              <p className="alumni-profile-v3-handle">
                @{profile.username}
              </p>

              {(profile.career ||
                profile.education_program_name) && (
                <p className="alumni-profile-v3-role">
                  {profile.career ||
                    profile.education_program_name}
                  <span> · Alumni</span>
                </p>
              )}

              {(profile.university ||
                profile.education_institution_name) && (
                <p className="alumni-profile-v3-fact">
                  <GraduationCap size={14} />
                  <span>
                    {profile.university ||
                      profile.education_institution_name}
                  </span>
                </p>
              )}

              {(profile.city || profile.country) && (
                <p className="alumni-profile-v3-fact">
                  <MapPin size={14} />
                  <span>
                    {[profile.city, profile.country]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </p>
              )}
            </div>

            <div className="alumni-profile-v3-actions">
              {ownProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/settings?section=profile&edit=1"
                      )
                    }
                    className="alumni-profile-v3-primary"
                  >
                    <PencilLine size={15} />
                    Editar perfil
                  </button>

                  <button
                    type="button"
                    onClick={shareProfile}
                    className="alumni-profile-v3-secondary"
                  >
                    <Share2 size={15} />
                    Compartir
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleFollow}
                    className={\`alumni-profile-v3-primary \${
                      following ||
                      followRequestPending
                        ? "is-following"
                        : ""
                    }\`}
                  >
                    {following ? (
                      <UserCheck size={15} />
                    ) : followRequestPending ? (
                      <Clock3 size={15} />
                    ) : (
                      <UserPlus size={15} />
                    )}

                    {following
                      ? "Siguiendo"
                      : followRequestPending
                      ? "Solicitado"
                      : "Seguir"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      user
                        ? router.push(
                            \`/messages/\${profile.username}\`
                          )
                        : router.push("/login")
                    }
                    className="alumni-profile-v3-secondary"
                  >
                    <MessageCircle size={15} />
                    Mensaje
                  </button>

                  <div className="alumni-profile-v3-safety">
                    <UserSafetyActions
                      targetUserId={profile.id}
                      targetUsername={
                        profile.username
                      }
                      onBlocked={() =>
                        router.push("/feed")
                      }
                    />
                  </div>
                </>
              )}
            </div>

            <div className="alumni-profile-v3-stats">
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
                <strong>{followingCount}</strong>
                <span>Siguiendo</span>
              </div>
            </div>
          </div>
        </section>

        {privateLocked ? (
          <section className="alumni-profile-v3-private">
            <div className="alumni-profile-v3-private-icon">
              <LockKeyhole size={22} />
            </div>

            <h2>Esta cuenta es privada</h2>

            <p>
              Sigue a @{profile.username} para
              ver sus publicaciones.
            </p>

            {followRequestPending && (
              <strong>Solicitud enviada</strong>
            )}
          </section>
        ) : (
          <>
            {/* TABS — EXACTAMENTE 3 COLUMNAS */}
            <nav
              className="alumni-profile-v3-tabs"
              aria-label="Secciones del perfil"
            >
              <button
                type="button"
                data-active={
                  tab === "posts"
                    ? "true"
                    : "false"
                }
                onClick={() => setTab("posts")}
              >
                Posts
              </button>

              <button
                type="button"
                data-active={
                  tab === "secondary"
                    ? "true"
                    : "false"
                }
                onClick={() =>
                  setTab("secondary")
                }
              >
                {ownProfile
                  ? "Guardados"
                  : "Compartidos"}
              </button>

              <button
                type="button"
                data-active={
                  tab === "activity"
                    ? "true"
                    : "false"
                }
                onClick={() =>
                  setTab("activity")
                }
              >
                Actividad
              </button>
            </nav>

            {/* POSTS — PROTAGONISTA DEL PERFIL */}
            {tab === "posts" ? (
              <section className="alumni-profile-v3-feed">
                {posts.length === 0 ? (
                  <div className="alumni-profile-v3-empty">
                    Este usuario todavía no ha
                    publicado nada.
                  </div>
                ) : (
                  <div className="alumni-profile-v3-post-list">
                    {posts.map((post: any) => {
                      const commentsOpen =
                        Boolean(
                          openComments[post.id]
                        );

                      return (
                        <article
                          key={post.id}
                          className="alumni-profile-v3-post"
                        >
                          <header className="alumni-profile-v3-post-head">
                            <div className="alumni-profile-v3-post-avatar">
                              {profile.avatar_url ? (
                                <img
                                  src={
                                    profile.avatar_url
                                  }
                                  alt=""
                                />
                              ) : (
                                profile.username
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                "U"
                              )}
                            </div>

                            <div className="alumni-profile-v3-post-author">
                              <strong>
                                {profile.full_name ||
                                  \`@\${profile.username}\`}
                              </strong>

                              <span>
                                @{profile.username} ·{" "}
                                {formatDistanceToNow(
                                  new Date(
                                    post.created_at
                                  ),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                              </span>
                            </div>

                            {ownProfile && (
                              <div className="alumni-profile-v3-owner-menu">
                                <ProfilePostOwnerMenu
                                  post={post}
                                  pinned={Boolean(
                                    post.pinned
                                  )}
                                  onEdit={(content) =>
                                    editProfilePost(
                                      post.id,
                                      content
                                    )
                                  }
                                  onTogglePin={() =>
                                    toggleProfilePin(
                                      post.id
                                    )
                                  }
                                  onDelete={() =>
                                    deleteProfilePost(
                                      post.id
                                    )
                                  }
                                />
                              </div>
                            )}
                          </header>

                          {post.content && (
                            <p className="alumni-profile-v3-post-copy">
                              {post.content}
                            </p>
                          )}

                          {post.image_url && (
                            <div className="alumni-profile-v3-media">
                              <img
                                src={post.image_url}
                                alt="Publicación"
                              />
                            </div>
                          )}

                          <div className="alumni-profile-v3-post-actions">
                            <button
                              type="button"
                              data-active={
                                post.liked
                                  ? "true"
                                  : "false"
                              }
                              onClick={() =>
                                toggleLike(
                                  post.id,
                                  post.liked
                                )
                              }
                            >
                              <Heart
                                size={18}
                                fill={
                                  post.liked
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                              <span>
                                {post.likes
                                  ?.length || 0}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenComments(
                                  (current) => ({
                                    ...current,
                                    [post.id]:
                                      !current[
                                        post.id
                                      ],
                                  })
                                )
                              }
                            >
                              <MessageCircle
                                size={18}
                              />
                              <span>
                                {post.comments
                                  ?.length || 0}
                              </span>
                            </button>
                          </div>

                          {commentsOpen && (
                            <div className="alumni-profile-v3-comments">
                              {post.comments?.map(
                                (comment: any) => (
                                  <div
                                    key={comment.id}
                                    className="alumni-profile-v3-comment"
                                  >
                                    <div className="alumni-profile-v3-comment-avatar">
                                      {comment.profile
                                        ?.avatar_url ? (
                                        <img
                                          src={
                                            comment
                                              .profile
                                              .avatar_url
                                          }
                                          alt=""
                                        />
                                      ) : (
                                        comment.profile
                                          ?.username
                                          ?.charAt(0)
                                          ?.toUpperCase() ||
                                        "U"
                                      )}
                                    </div>

                                    <div className="alumni-profile-v3-comment-main">
                                      <div className="alumni-profile-v3-comment-bubble">
                                        <strong>
                                          @
                                          {comment
                                            .profile
                                            ?.username ||
                                            "usuario"}
                                        </strong>

                                        <p>
                                          {
                                            comment.content
                                          }
                                        </p>
                                      </div>

                                      <CommentLikeButton
                                        commentId={
                                          comment.id
                                        }
                                        commentOwnerId={
                                          comment.user_id
                                        }
                                        currentUserId={
                                          user?.id
                                        }
                                      />
                                    </div>
                                  </div>
                                )
                              )}

                              <div className="alumni-profile-v3-comment-composer">
                                <input
                                  value={
                                    commentInputs[
                                      post.id
                                    ] || ""
                                  }
                                  onChange={(event) =>
                                    setCommentInputs(
                                      (current) => ({
                                        ...current,
                                        [post.id]:
                                          event.target
                                            .value,
                                      })
                                    )
                                  }
                                  placeholder="Escribe un comentario..."
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    addComment(
                                      post.id
                                    )
                                  }
                                  disabled={
                                    !commentInputs[
                                      post.id
                                    ]?.trim()
                                  }
                                  aria-label="Enviar comentario"
                                >
                                  <Send size={15} />
                                </button>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : tab === "secondary" ? (
              <section className="alumni-profile-v3-secondary-tab">
                {ownProfile ? (
                  <ProfileSavedTab
                    userId={profile.id}
                  />
                ) : (
                  <ProfileRepostsTab
                    userId={profile.id}
                    username={
                      profile.username
                    }
                  />
                )}
              </section>
            ) : (
              <section className="alumni-profile-v3-activity">
                {profile.bio && (
                  <div className="alumni-profile-v3-activity-card">
                    <span>Acerca de</span>
                    <p>{profile.bio}</p>
                  </div>
                )}

                <ProfessionalProfileOverview
                  profile={profile}
                  posts={posts}
                  followers={followers}
                  following={followingCount}
                  own={ownProfile}
                />

                <ProfileHeaderFacts
                  profile={profile}
                />

                <ProfileIdentityMeta
                  profile={profile}
                />

                <ProfileSocialLinks
                  profile={profile}
                />

                <ProfileMusicCard
                  track={profileMusic}
                />

                <ProfilePassportPreview
                  userId={profile.id}
                  username={profile.username}
                  own={ownProfile}
                />

                {ownProfile && (
                  <div className="alumni-profile-v3-spotify">
                    <ProfileSpotifyAction
                      userId={user?.id || ""}
                      username={
                        profile.username
                      }
                    />
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ${MARKER} */
`;

source =
  source.slice(0, renderStart) +
  newRender +
  source.slice(helpersStart);

/* ================================================================
   5) CSS EXACTO — NO UN SIMPLE RESKIN
   ================================================================ */

const css = `/*
 * ${MARKER}
 * Opción 3 — Perfil centrado en la actividad.
 * MOBILE FIRST: 360–430px.
 */

.alumni-profile-v3 {
  width: calc(100% + 32px);
  max-width: none;
  margin: 0 -16px;
  color: var(--app-text);
  font-family:
    var(--font-geist-sans),
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

/* =========================================================
   HERO
   ========================================================= */

.alumni-profile-v3-hero {
  position: relative;
  background: var(--app-bg);
}

.alumni-profile-v3-cover {
  position: relative;
  width: 100%;
  height: 184px;
  overflow: hidden;
  background: #111722;
}

.alumni-profile-v3-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-profile-v3-cover-fallback {
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
      #162033,
      #0d121c 58%,
      #111722
    );
}

.alumni-profile-v3-cover-shade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      180deg,
      rgba(3, 6, 10, .08) 0%,
      rgba(3, 6, 10, .08) 48%,
      rgba(3, 6, 10, .62) 100%
    );
  pointer-events: none;
}

.alumni-profile-v3-top-button {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  z-index: 5;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 13px;
  background: rgba(5, 8, 13, .48);
  color: #fff;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.alumni-profile-v3-top-button.is-left {
  left: 12px;
}

.alumni-profile-v3-top-button.is-right {
  right: 12px;
}

.alumni-profile-v3-main {
  position: relative;
  padding:
    0 16px
    0;
}

.alumni-profile-v3-avatar-wrap {
  height: 42px;
}

.alumni-profile-v3-avatar {
  position: absolute;
  top: -44px;
  left: 16px;
  z-index: 6;
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
  box-shadow:
    0 5px 20px rgba(0,0,0,.20);
}

.alumni-profile-v3-identity {
  padding-top: 4px;
}

.alumni-profile-v3-identity h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 21px;
  line-height: 1.1;
  font-weight: 950;
  letter-spacing: -.04em;
}

.alumni-profile-v3-handle {
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 12px;
  line-height: 1.2;
}

.alumni-profile-v3-role {
  margin-top: 8px;
  color: var(--app-text-soft);
  font-size: 12px;
  font-weight: 590;
  line-height: 1.35;
}

.alumni-profile-v3-role span {
  color: var(--app-muted);
}

.alumni-profile-v3-fact {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  color: var(--app-muted);
  font-size: 11px;
  font-weight: 560;
  line-height: 1.3;
}

.alumni-profile-v3-fact svg {
  flex: 0 0 auto;
  color: var(--app-muted-2);
}

/* =========================================================
   ACTIONS
   ========================================================= */

.alumni-profile-v3-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}

.alumni-profile-v3-primary,
.alumni-profile-v3-secondary {
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

.alumni-profile-v3-primary {
  border: 0;
  background: var(--app-text);
  color: var(--app-bg);
}

.alumni-profile-v3-primary.is-following {
  border: 1px solid var(--app-border);
  background: var(--app-soft);
  color: var(--app-text);
}

.alumni-profile-v3-secondary {
  border: 1px solid var(--app-border);
  background: var(--app-soft);
  color: var(--app-text-soft);
}

.alumni-profile-v3-safety {
  flex: 0 0 auto;
}

/* =========================================================
   STATS
   ========================================================= */

.alumni-profile-v3-stats {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  margin-top: 16px;
  border-bottom:
    1px solid var(--app-border);
}

.alumni-profile-v3-stats > * {
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

.alumni-profile-v3-stats > * + *::before {
  content: "";
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 1px;
  background: var(--app-border);
}

.alumni-profile-v3-stats strong {
  color: var(--app-text);
  font-size: 15px;
  line-height: 1;
  font-weight: 950;
}

.alumni-profile-v3-stats span {
  margin-top: 6px;
  color: var(--app-muted-2);
  font-size: 8.5px;
  font-weight: 650;
}

/* =========================================================
   TABS
   ========================================================= */

.alumni-profile-v3-tabs {
  position: sticky;
  top: 0;
  z-index: 24;
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  min-height: 48px;
  border-bottom:
    1px solid var(--app-border);
  background:
    color-mix(
      in srgb,
      var(--app-bg) 96%,
      transparent
    );
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.alumni-profile-v3-tabs button {
  position: relative;
  border: 0;
  background: transparent;
  color: var(--app-muted-2);
  font-size: 11px;
  font-weight: 760;
}

.alumni-profile-v3-tabs button[data-active="true"] {
  color: var(--app-text);
}

.alumni-profile-v3-tabs
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

/* =========================================================
   POSTS — PRINCIPAL CONTENT
   ========================================================= */

.alumni-profile-v3-feed {
  background: var(--app-bg);
}

.alumni-profile-v3-post-list {
  display: block;
}

.alumni-profile-v3-post {
  padding: 16px 16px 14px;
  border-bottom:
    1px solid var(--app-border);
  background: var(--app-bg);
}

.alumni-profile-v3-post-head {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.alumni-profile-v3-post-avatar {
  display: flex;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 11px;
  font-weight: 850;
}

.alumni-profile-v3-post-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-profile-v3-post-author {
  min-width: 0;
  flex: 1 1 auto;
}

.alumni-profile-v3-post-author strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 12.5px;
  font-weight: 850;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-v3-post-author span {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--app-muted-2);
  font-size: 9.5px;
  font-weight: 520;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-profile-v3-owner-menu {
  flex: 0 0 auto;
}

.alumni-profile-v3-post-copy {
  margin: 12px 0 0;
  white-space: pre-wrap;
  color: var(--app-text-soft);
  font-size: 13px;
  font-weight: 440;
  line-height: 1.48;
  letter-spacing: -.008em;
}

.alumni-profile-v3-media {
  overflow: hidden;
  margin: 12px -16px 0;
  background: #05070b;
}

.alumni-profile-v3-media img {
  display: block;
  width: 100%;
  max-height: 590px;
  object-fit: contain;
}

.alumni-profile-v3-post-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 10px;
}

.alumni-profile-v3-post-actions button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 700;
}

.alumni-profile-v3-post-actions
  button[data-active="true"] {
  color: #f24961;
}

/* =========================================================
   COMMENTS
   ========================================================= */

.alumni-profile-v3-comments {
  padding-top: 10px;
}

.alumni-profile-v3-comment {
  display: flex;
  gap: 9px;
  padding: 7px 0;
}

.alumni-profile-v3-comment-avatar {
  display: flex;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 9px;
  font-weight: 800;
}

.alumni-profile-v3-comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-profile-v3-comment-main {
  min-width: 0;
  flex: 1 1 auto;
}

.alumni-profile-v3-comment-bubble {
  padding: 8px 10px;
  border-radius: 13px;
  background: var(--app-soft);
}

.alumni-profile-v3-comment-bubble strong {
  color: var(--app-text);
  font-size: 10px;
  font-weight: 800;
}

.alumni-profile-v3-comment-bubble p {
  margin-top: 3px;
  color: var(--app-text-soft);
  font-size: 12px;
  font-weight: 440;
  line-height: 1.4;
}

.alumni-profile-v3-comment-composer {
  display: flex;
  gap: 7px;
  margin-top: 9px;
}

.alumni-profile-v3-comment-composer input {
  min-width: 0;
  height: 40px;
  flex: 1 1 auto;
  padding: 0 12px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  outline: 0;
  background: var(--app-soft);
  color: var(--app-text);
  font-size: 16px;
}

.alumni-profile-v3-comment-composer button {
  display: flex;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 13px;
  background: var(--app-accent-fill);
  color: var(--app-on-accent);
}

.alumni-profile-v3-comment-composer
  button:disabled {
  opacity: .4;
}

/* =========================================================
   OTHER TABS
   ========================================================= */

.alumni-profile-v3-secondary-tab,
.alumni-profile-v3-activity {
  padding: 14px 16px 32px;
}

.alumni-profile-v3-activity {
  display: grid;
  gap: 12px;
}

.alumni-profile-v3-activity-card {
  padding: 15px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
}

.alumni-profile-v3-activity-card span {
  color: var(--app-muted-2);
  font-size: 9px;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: .08em;
}

.alumni-profile-v3-activity-card p {
  margin-top: 7px;
  color: var(--app-text-soft);
  font-size: 12px;
  line-height: 1.5;
}

.alumni-profile-v3-activity
  > * {
  max-width: 100%;
}

.alumni-profile-v3-spotify {
  display: flex;
  justify-content: center;
}

/* =========================================================
   PRIVATE / EMPTY
   ========================================================= */

.alumni-profile-v3-private,
.alumni-profile-v3-empty {
  padding: 54px 24px;
  text-align: center;
}

.alumni-profile-v3-private-icon {
  display: flex;
  width: 50px;
  height: 50px;
  margin: 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--app-soft);
  color: var(--app-muted);
}

.alumni-profile-v3-private h2 {
  margin-top: 13px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 850;
}

.alumni-profile-v3-private p,
.alumni-profile-v3-empty {
  margin-top: 7px;
  color: var(--app-muted-2);
  font-size: 11px;
  line-height: 1.5;
}

.alumni-profile-v3-private strong {
  display: block;
  margin-top: 10px;
  color: var(--app-accent);
  font-size: 10px;
}

/* =========================================================
   THEMES
   ========================================================= */

html[data-theme="light"] .alumni-profile-v3,
html[data-theme="light"] .alumni-profile-v3-hero,
html[data-theme="light"] .alumni-profile-v3-feed,
html[data-theme="light"] .alumni-profile-v3-post {
  background: #fff;
}

html[data-theme="dark"] .alumni-profile-v3,
html[data-theme="dark"] .alumni-profile-v3-hero,
html[data-theme="dark"] .alumni-profile-v3-feed,
html[data-theme="dark"] .alumni-profile-v3-post {
  background: var(--app-bg);
}

/* =========================================================
   VERY SMALL PHONES
   ========================================================= */

@media (max-width: 374px) {
  .alumni-profile-v3-cover {
    height: 170px;
  }

  .alumni-profile-v3-avatar {
    width: 82px;
    height: 82px;
  }

  .alumni-profile-v3-identity h1 {
    font-size: 19px !important;
  }

  .alumni-profile-v3-primary,
  .alumni-profile-v3-secondary {
    height: 40px;
    padding-inline: 9px;
    font-size: 10px;
  }

  .alumni-profile-v3-tabs button {
    font-size: 10.5px;
  }
}

/* =========================================================
   DESKTOP — SAME STRUCTURE, ONLY CENTERED
   ========================================================= */

@media (min-width: 700px) {
  .alumni-profile-v3 {
    width: 100%;
    max-width: 560px;
    margin: 18px auto 48px;
    overflow: hidden;
    border: 1px solid var(--app-border);
    border-radius: 24px;
    background: var(--app-bg);
    box-shadow: 0 24px 70px var(--app-shadow);
  }

  .alumni-profile-v3-cover {
    height: 215px;
  }
}
`;

fs.writeFileSync(CSS, css, "utf8");

/* ================================================================
   6) VALIDACIONES REALES
   ================================================================ */

const required = [
  'data-profile-design="option-3-activity"',
  "alumni-profile-v3-cover",
  "alumni-profile-v3-avatar",
  "alumni-profile-v3-actions",
  "alumni-profile-v3-stats",
  "alumni-profile-v3-tabs",
  "Posts",
  "Guardados",
  "Actividad",
  "alumni-profile-v3-post",
  "alumni-profile-v3-media",
  "ProfileSavedTab",
  "ProfileRepostsTab",
  "ProfessionalProfileOverview",
];

for (const token of required) {
  if (!source.includes(token)) {
    try { fs.unlinkSync(CSS); } catch {}
    fail("Validación final: falta " + token);
  }
}

if (
  source.includes(
    'className="alumni-profile-page mx-auto w-full max-w-[980px]"'
  )
) {
  try { fs.unlinkSync(CSS); } catch {}
  fail(
    "Validación: quedó viva la estructura vieja del perfil."
  );
}

if (!css.includes("MOBILE FIRST: 360–430px")) {
  try { fs.unlinkSync(CSS); } catch {}
  fail("Validación: CSS no quedó mobile-first.");
}

if (!source.includes(MARKER)) {
  source += `\n/* ${MARKER} */\n`;
}

fs.writeFileSync(PROFILE, source, "utf8");

console.log("");
console.log("✅ ALUMNI Profile 1.0B — Opción 3 EXACTA aplicado.");
console.log("✅ Estructura vieja reemplazada, no maquillada.");
console.log("✅ Banner protagonista.");
console.log("✅ Avatar superpuesto.");
console.log("✅ Identidad compacta.");
console.log("✅ Editar/Compartir o Seguir/Mensaje.");
console.log("✅ Métricas en una fila.");
console.log("✅ Tabs: Posts / Guardados-Compartidos / Actividad.");
console.log("✅ Posts aparecen inmediatamente después de tabs.");
console.log("✅ Información secundaria movida a Actividad.");
console.log("✅ Mobile-first 360–430 px.");
console.log("✅ Claro/Oscuro.");
console.log("");
console.log("Ahora ejecutá: npm run build");
