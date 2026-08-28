const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAYLOAD = path.join(__dirname, "payload");
const MARKER = "ALUMNI_1_4_1_PROFILE_REPOSTS_SAVED_READABILITY";

const REQUIRED = [
  "src/app/u/[username]/page.tsx",
  "src/app/settings/page.tsx",
  "src/components/settings/ProfileSettingsHub.tsx",
  "src/app/feed/feed-pro.css",
  "src/components/social/CommentLikeButton.tsx",
];

const NEW_FILES = [
  "src/components/profile/ProfileRepostsTab.tsx",
  "src/components/settings/SavedPostsPanel.tsx",
];

function die(message) {
  console.error("\n[ERROR] " + message + "\n");
  process.exit(1);
}

function normalize(value) {
  return value.replace(/\r\n/g, "\n");
}

function replaceOnce(src, from, to, label) {
  if (!src.includes(from)) {
    die("No encuentro ancla: " + label);
  }

  console.log("[OK] " + label);
  return src.replace(from, to);
}

if (path.basename(ROOT).toLowerCase() !== "alumni-web") {
  die('Ejecuta dentro de "alumni-web".');
}

for (const rel of REQUIRED) {
  if (!fs.existsSync(path.join(ROOT, rel))) {
    die("No encuentro " + rel);
  }
}

const profilePath = path.join(ROOT, "src/app/u/[username]/page.tsx");
const settingsPath = path.join(ROOT, "src/app/settings/page.tsx");
const hubPath = path.join(ROOT, "src/components/settings/ProfileSettingsHub.tsx");
const cssPath = path.join(ROOT, "src/app/feed/feed-pro.css");
const commentLikePath = path.join(
  ROOT,
  "src/components/social/CommentLikeButton.tsx"
);

const profileOriginal = fs.readFileSync(profilePath, "utf8");

if (profileOriginal.includes(MARKER)) {
  console.log("[SKIP] ALUMNI 1.4.1 ya está aplicado.");
  process.exit(0);
}

if (!fs.existsSync(cssPath)) {
  die("No encuentro feed-pro.css. Aplica ALUMNI 1.4.0 primero.");
}

/* =========================================================
   1) PROFILE: Compartidos tab
   ========================================================= */
let profile = normalize(profileOriginal);

profile = replaceOnce(
  profile,
  'import ProfileHeaderFacts from "@/components/profile/ProfileHeaderFacts";',
  'import ProfileHeaderFacts from "@/components/profile/ProfileHeaderFacts";\nimport ProfileRepostsTab from "@/components/profile/ProfileRepostsTab";',
  "Import ProfileRepostsTab"
);

profile = replaceOnce(
  profile,
  'type ProfileTab = "posts" | "about";',
  'type ProfileTab = "posts" | "reposts" | "about";',
  "ProfileTab incluye Compartidos"
);

profile = replaceOnce(
  profile,
`          <Tab
            active={tab === "about"}
            onClick={() => setTab("about")}
            label="Acerca de"
          />`,
`          <Tab
            active={tab === "reposts"}
            onClick={() => setTab("reposts")}
            label="Compartidos"
          />
          <Tab
            active={tab === "about"}
            onClick={() => setTab("about")}
            label="Acerca de"
          />`,
  "Pestaña Compartidos"
);

profile = replaceOnce(
  profile,
`        ) : (
          <ProfessionalProfileOverview
            profile={profile}
            posts={posts}
            followers={followers}
            following={followingCount}
            own={ownProfile}
          />
        )}`,
`        ) : tab === "reposts" ? (
          <ProfileRepostsTab
            userId={profile.id}
            username={profile.username}
          />
        ) : (
          <ProfessionalProfileOverview
            profile={profile}
            posts={posts}
            followers={followers}
            following={followingCount}
            own={ownProfile}
          />
        )}`,
  "Render Compartidos"
);

profile += `\n/* ${MARKER}:PROFILE */\n`;

/* =========================================================
   2) PROFILE SETTINGS HUB: Guardados row
   ========================================================= */
const hubOriginal = fs.readFileSync(hubPath, "utf8");
let hub = normalize(hubOriginal);

hub = replaceOnce(
  hub,
`  Check,
  ChevronRight,`,
`  Bookmark,
  Check,
  ChevronRight,`,
  "Import Bookmark"
);

hub = replaceOnce(
  hub,
`  onEditProfile: () => void;
};`,
`  onEditProfile: () => void;
  onOpenSaved: () => void;
};`,
  "Prop onOpenSaved"
);

hub = replaceOnce(
  hub,
`  rejectFollowRequest,
  onEditProfile,
}: Props) {`,
`  rejectFollowRequest,
  onEditProfile,
  onOpenSaved,
}: Props) {`,
  "Recibe onOpenSaved"
);

hub = replaceOnce(
  hub,
`      <button
        type="button"
        onClick={onEditProfile}
        className="alumni-setting-row w-full border-t border-[var(--app-border)] text-left"
      >`,
`      <button
        type="button"
        onClick={onOpenSaved}
        className="alumni-setting-row w-full border-t border-[var(--app-border)] text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
          <Bookmark size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--app-text)]">
            Guardados
          </p>
          <p className="mt-1 text-[12px] leading-5 text-[var(--app-muted-2)]">
            Publicaciones que guardaste para ver después.
          </p>
        </div>

        <ChevronRight size={18} className="text-[var(--app-muted-3)]" />
      </button>

      <button
        type="button"
        onClick={onEditProfile}
        className="alumni-setting-row w-full border-t border-[var(--app-border)] text-left"
      >`,
  "Fila Guardados"
);

hub += `\n/* ${MARKER}:SETTINGS_HUB */\n`;

/* =========================================================
   3) SETTINGS: SavedPostsPanel inside Ajustes > Perfil
   ========================================================= */
const settingsOriginal = fs.readFileSync(settingsPath, "utf8");
let settings = normalize(settingsOriginal);

settings = replaceOnce(
  settings,
  'import ProfileSettingsHub from "@/components/settings/ProfileSettingsHub";',
  'import ProfileSettingsHub from "@/components/settings/ProfileSettingsHub";\nimport SavedPostsPanel from "@/components/settings/SavedPostsPanel";',
  "Import SavedPostsPanel"
);

settings = replaceOnce(
  settings,
`  const [profileEditorOpen, setProfileEditorOpen] = useState(false);`,
`  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileSavedOpen, setProfileSavedOpen] = useState(false);`,
  "Estado Guardados"
);

settings = replaceOnce(
  settings,
`    if (section === "profile" && params.get("edit") === "1") {
      setProfileEditorOpen(true);
    }`,
`    if (section === "profile" && params.get("edit") === "1") {
      setProfileEditorOpen(true);
    }

    if (section === "profile" && params.get("view") === "saved") {
      setProfileSavedOpen(true);
    }`,
  "URL view=saved"
);

settings = replaceOnce(
  settings,
`            {activeSection === "profile" &&
              (profileEditorOpen ? (
                <ProfileEditorPro`,
`            {activeSection === "profile" &&
              (profileEditorOpen ? (
                <ProfileEditorPro`,
  "Inicio condicional Perfil"
);

/* Replace profile conditional tail in one exact block. */
settings = replaceOnce(
  settings,
`                  onSaved={getProfile}
                />
              ) : (
                <ProfileSettingsHub
                  isPrivate={isPrivate}
                  privacySaving={privacySaving}
                  updatePrivacy={updatePrivacy}
                  followRequests={followRequests}
                  requestsLoading={requestsLoading}
                  acceptFollowRequest={acceptFollowRequest}
                  rejectFollowRequest={rejectFollowRequest}
                  onEditProfile={() => {
                    setProfileEditorOpen(true);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("section", "profile");
                      url.searchParams.set("edit", "1");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                />
              ))}`,
`                  onSaved={getProfile}
                />
              ) : profileSavedOpen ? (
                <SavedPostsPanel
                  userId={user?.id || ""}
                  onBack={() => {
                    setProfileSavedOpen(false);

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("view");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                />
              ) : (
                <ProfileSettingsHub
                  isPrivate={isPrivate}
                  privacySaving={privacySaving}
                  updatePrivacy={updatePrivacy}
                  followRequests={followRequests}
                  requestsLoading={requestsLoading}
                  acceptFollowRequest={acceptFollowRequest}
                  rejectFollowRequest={rejectFollowRequest}
                  onOpenSaved={() => {
                    setProfileSavedOpen(true);

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("section", "profile");
                      url.searchParams.set("view", "saved");
                      url.searchParams.delete("edit");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                  onEditProfile={() => {
                    setProfileSavedOpen(false);
                    setProfileEditorOpen(true);

                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("section", "profile");
                      url.searchParams.set("edit", "1");
                      url.searchParams.delete("view");
                      window.history.replaceState(
                        window.history.state,
                        "",
                        url.pathname + url.search
                      );
                    }
                  }}
                />
              ))}`,
  "Guardados dentro de Ajustes > Perfil"
);

settings += `\n/* ${MARKER}:SETTINGS */\n`;

/* =========================================================
   4) FEED CSS: small media menu + readability
   ========================================================= */
const cssOriginal = fs.readFileSync(cssPath, "utf8");
let css = normalize(cssOriginal);

css = replaceOnce(
  css,
`  overflow: hidden;
  background: #05070b;
}

.alumni-pro-carousel {`,
`  overflow: visible;
  background: #05070b;
}

.alumni-pro-carousel {`,
  "Popover no se corta en imagen pequeña"
);

css = replaceOnce(
  css,
`  overflow-x: auto;
  scroll-behavior: smooth;`,
`  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;`,
  "Carousel conserva clipping vertical"
);

const sizeReplacements = [
  ["font-size: 10px;\n  font-weight: 740;", "font-size: 12px;\n  font-weight: 740;", "Etiqueta repost"],
  ["font-size: 13px;\n  font-weight: 840;", "font-size: 14px;\n  font-weight: 840;", "Autor post"],
  ["font-size: 11px;\n  white-space: nowrap;", "font-size: 12px;\n  white-space: nowrap;", "Hora post"],
  ["font-size: 10.5px;\n  text-overflow: ellipsis;", "font-size: 12px;\n  text-overflow: ellipsis;", "Meta autor"],
  ["font-size: 12px;\n  font-weight: 780;", "font-size: 13px;\n  font-weight: 780;", "Texto más/menos"],
  ["font-size: 10px;\n}\n\n/* ---------------------------------------------------------\n   Link preview", "font-size: 12px;\n}\n\n/* ---------------------------------------------------------\n   Link preview", "Enlaces repetidos"],
  ["font-size: 9.5px;\n  font-weight: 760;", "font-size: 11px;\n  font-weight: 760;", "Dominio preview"],
  ["font-size: 13px;\n  line-height: 1.35;", "font-size: 14px;\n  line-height: 1.35;", "Título preview"],
  ["font-size: 11px;\n  line-height: 1.45;", "font-size: 13px;\n  line-height: 1.45;", "Descripción preview"],
  ["font-size: 11.5px;\n  font-weight: 760;", "font-size: 13px;\n  font-weight: 760;", "Menú tres puntos"],
  ["font-size: 10.5px;\n}\n\n.alumni-pro-stats", "font-size: 12px;\n}\n\n.alumni-pro-stats", "Estadísticas"],
  ["font-size: 11px;\n}\n\n.alumni-pro-comment-preview span", "font-size: 12px;\n}\n\n.alumni-pro-comment-preview span", "Autor comentario preview"],
  ["font-size: 11px;\n  text-overflow: ellipsis;", "font-size: 12px;\n  text-overflow: ellipsis;", "Comentario preview"],
  ["font-size: 10.5px;\n}\n\n/* ---------------------------------------------------------\n   Comment sheet", "font-size: 12px;\n}\n\n/* ---------------------------------------------------------\n   Comment sheet", "Ver comentarios"],
  ["font-size: 8.5px;\n  font-weight: 850;", "font-size: 10px;\n  font-weight: 850;", "Eyebrow modal"],
  ["font-size: 12px;\n  line-height: 1.5;", "font-size: 14px;\n  line-height: 1.55;", "Texto comentarios"],
];

for (const [from, to, label] of sizeReplacements) {
  if (css.includes(from)) {
    css = css.replace(from, to);
    console.log("[OK] " + label);
  } else {
    console.log("[WARN] No se ajustó " + label + " (ancla distinta)");
  }
}

/* Strong final scoped readability overrides to avoid missed duplicates. */
css += `
/* ALUMNI 1.4.1 — legibilidad final */
.alumni-feed-pro .alumni-pro-repost-label {
  font-size: 12px !important;
}

.alumni-feed-pro .alumni-pro-author a {
  font-size: 14px !important;
}

.alumni-feed-pro .alumni-pro-author time,
.alumni-feed-pro .alumni-pro-author > div > span,
.alumni-feed-pro .alumni-pro-author > p {
  font-size: 12px !important;
}

.alumni-feed-pro .alumni-pro-stats,
.alumni-feed-pro .alumni-pro-comment-preview strong,
.alumni-feed-pro .alumni-pro-comment-preview span,
.alumni-feed-pro .alumni-pro-view-comments {
  font-size: 12px !important;
}

.alumni-feed-pro .alumni-feed-comment-body > p {
  font-size: 14px !important;
  line-height: 1.55 !important;
}

.alumni-feed-pro .alumni-pro-menu-popover > button {
  font-size: 13px !important;
}

/*
 * El botón ... sigue SOBRE la imagen arriba-derecha,
 * pero el popover puede salir del rectángulo si la imagen es baja.
 */
.alumni-feed-pro .alumni-pro-media-shell {
  overflow: visible !important;
}

.alumni-feed-pro .alumni-pro-carousel {
  overflow-x: auto !important;
  overflow-y: hidden !important;
}

.alumni-feed-pro .alumni-pro-media-menu {
  top: 10px !important;
  right: 10px !important;
  left: auto !important;
  bottom: auto !important;
}

.alumni-feed-pro .alumni-pro-menu-popover {
  max-height: min(360px, 70dvh);
  overflow-y: auto;
}

@media (max-width: 639px) {
  .alumni-feed-pro .alumni-pro-author a {
    font-size: 14px !important;
  }

  .alumni-feed-pro .alumni-pro-author time,
  .alumni-feed-pro .alumni-pro-author > p {
    font-size: 12px !important;
  }
}

/* ${MARKER}:FEED_CSS */
`;

/* =========================================================
   5) Comment Like Button readability
   ========================================================= */
const commentOriginal = fs.readFileSync(commentLikePath, "utf8");
let commentLike = normalize(commentOriginal);

commentLike = replaceOnce(
  commentLike,
  'className={`mt-2 flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition ${',
  'className={`mt-2 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-bold transition ${',
  "Me gusta comentario más legible"
);

commentLike = replaceOnce(
  commentLike,
  '        size={13}',
  '        size={14}',
  "Corazón comentario"
);

commentLike += `\n/* ${MARKER}:COMMENT_LIKE */\n`;

/* =========================================================
   Backups
   ========================================================= */
const stamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const backupRoot = path.join(
  ROOT,
  ".alumni_backups",
  "1.4.1-profile-reposts-saved-readability",
  stamp
);

const changedExisting = [
  ["src/app/u/[username]/page.tsx", profileOriginal],
  ["src/app/settings/page.tsx", settingsOriginal],
  ["src/components/settings/ProfileSettingsHub.tsx", hubOriginal],
  ["src/app/feed/feed-pro.css", cssOriginal],
  ["src/components/social/CommentLikeButton.tsx", commentOriginal],
];

for (const [rel] of changedExisting) {
  const source = path.join(ROOT, rel);
  const backup = path.join(backupRoot, rel);

  fs.mkdirSync(path.dirname(backup), {
    recursive: true,
  });

  fs.copyFileSync(source, backup);
}

/* =========================================================
   Writes
   ========================================================= */
function writeLikeOriginal(rel, original, next) {
  const target = path.join(ROOT, rel);
  const useCrlf = original.includes("\r\n");

  fs.mkdirSync(path.dirname(target), {
    recursive: true,
  });

  fs.writeFileSync(
    target,
    useCrlf
      ? next.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n")
      : next.replace(/\r\n/g, "\n"),
    "utf8"
  );
}

writeLikeOriginal(
  "src/app/u/[username]/page.tsx",
  profileOriginal,
  profile
);
writeLikeOriginal(
  "src/app/settings/page.tsx",
  settingsOriginal,
  settings
);
writeLikeOriginal(
  "src/components/settings/ProfileSettingsHub.tsx",
  hubOriginal,
  hub
);
writeLikeOriginal(
  "src/app/feed/feed-pro.css",
  cssOriginal,
  css
);
writeLikeOriginal(
  "src/components/social/CommentLikeButton.tsx",
  commentOriginal,
  commentLike
);

for (const rel of NEW_FILES) {
  const source = path.join(PAYLOAD, rel);
  const target = path.join(ROOT, rel);

  if (!fs.existsSync(source)) {
    die("Payload faltante: " + rel);
  }

  fs.mkdirSync(path.dirname(target), {
    recursive: true,
  });

  if (fs.existsSync(target)) {
    const backup = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(backup), {
      recursive: true,
    });
    fs.copyFileSync(target, backup);
  }

  fs.copyFileSync(source, target);
  console.log("[OK] " + rel);
}

console.log("");
console.log("================================================================");
console.log(" ALUMNI 1.4.1 - PROFILE REPOSTS + SAVED + READABILITY");
console.log("================================================================");
console.log("[OK] Perfil: nueva pestaña Compartidos");
console.log("[OK] Compartidos muestra todos los reposts del usuario");
console.log("[OK] Mantiene publicación original, autor, likes y comentarios");
console.log("[OK] Ajustes > Perfil > Guardados");
console.log("[OK] Guardados solo visibles para el usuario");
console.log("[OK] Se puede quitar un Guardado desde Ajustes");
console.log("[OK] Menú ... no se corta si la imagen es pequeña");
console.log("[OK] ... continúa arriba-derecha SOBRE la imagen");
console.log("[OK] Tipografías secundarias del Feed más grandes");
console.log("[OK] Comentarios más legibles");
console.log("[OK] Botón Me gusta de comentario más grande");
console.log("[OK] No requiere SQL");
console.log("[OK] Backup: " + backupRoot);
console.log("");
console.log("Ejecuta ahora: npm run build");
console.log("================================================================");
