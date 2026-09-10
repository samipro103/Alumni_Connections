const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER = "ALUMNI_SETTINGS_1_0_OPTION_1_CLASSIC_LIST";
const CSS_NAME = "settings-classic-1-0.css";

const settingsFile = path.join(ROOT, "src", "app", "settings", "page.tsx");
const profileHubFile = path.join(
  ROOT,
  "src",
  "components",
  "settings",
  "ProfileSettingsHub.tsx"
);
const cssFile = path.join(ROOT, "src", "app", "settings", CSS_NAME);

for (const file of [settingsFile, profileHubFile]) {
  if (!fs.existsSync(file)) {
    console.error("❌ No encontré:", file);
    console.error("Ejecutá este parche desde la carpeta alumni-web.");
    process.exit(1);
  }
}

let source = fs.readFileSync(settingsFile, "utf8").replace(/\r\n/g, "\n");
let profileHub = fs.readFileSync(profileHubFile, "utf8").replace(/\r\n/g, "\n");

console.log("✅ Archivos normalizados para Windows CRLF/LF");

if (
  source.includes(MARKER) &&
  profileHub.includes(MARKER) &&
  fs.existsSync(cssFile)
) {
  console.log("ℹ️ Configuración Opción 1 ya está aplicada.");
  process.exit(0);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

/* ================================================================
   1) IMPORTS
   ================================================================ */

if (!source.includes("  Bell,")) {
  source = source.replace(
    `  ArrowLeft,`,
    `  ArrowLeft,
  Bell,
  CircleHelp,`
  );
  console.log("✅ Iconos de Notificaciones y Ayuda agregados");
}

if (!source.includes(`import "./${CSS_NAME}";`)) {
  const anchor = `import AccountTrustPanel from "@/components/settings/AccountTrustPanel";`;

  if (!source.includes(anchor)) {
    fail("No encontré el punto para importar el CSS de Configuración.");
  }

  source = source.replace(
    anchor,
    `${anchor}
import "./${CSS_NAME}";`
  );

  console.log("✅ CSS de Configuración clásica importado");
}

/* ================================================================
   2) ESTADO PARA SABER SI CUENTA ABRIÓ EL EDITOR DIRECTAMENTE
   ================================================================ */

if (!source.includes("classicAccountOpen")) {
  const stateAnchor =
    `  const [profileSavedOpen, setProfileSavedOpen] = useState(false);`;

  if (!source.includes(stateAnchor)) {
    fail("No encontré estados del editor de perfil.");
  }

  source = source.replace(
    stateAnchor,
    `${stateAnchor}
  const [classicAccountOpen, setClassicAccountOpen] = useState(false);`
  );

  console.log("✅ Estado de navegación Cuenta agregado");
}

/* Si se entra directamente con ?section=profile&edit=1, se comporta como Cuenta. */
source = source.replace(
  `    if (section === "profile" && params.get("edit") === "1") {
      setProfileEditorOpen(true);
    }`,
  `    if (section === "profile" && params.get("edit") === "1") {
      setProfileEditorOpen(true);
      setClassicAccountOpen(true);
    }`
);

/* ================================================================
   3) HELPERS MOBILE-FIRST PARA HOME CLÁSICO
   ================================================================ */

if (!source.includes("function openClassicSection(")) {
  const anchor = `  async function logout() {`;

  if (!source.includes(anchor)) {
    fail("No encontré logout() para insertar navegación clásica.");
  }

  const helpers = `  function updateSettingsUrl(
    section?: SettingsSectionId,
    extra?: { edit?: boolean; view?: string }
  ) {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (section) {
      url.searchParams.set("section", section);
    } else {
      url.searchParams.delete("section");
    }

    if (extra?.edit) {
      url.searchParams.set("edit", "1");
    } else {
      url.searchParams.delete("edit");
    }

    if (extra?.view) {
      url.searchParams.set("view", extra.view);
    } else {
      url.searchParams.delete("view");
    }

    window.history.pushState(
      section
        ? { alumniSettings: true, section }
        : {},
      "",
      url.pathname + url.search
    );
  }

  function openClassicSection(id: SettingsSectionId) {
    setClassicAccountOpen(false);
    setProfileEditorOpen(false);
    setProfileSavedOpen(false);
    setActiveSection(id);
    setMobileSectionOpen(true);
    updateSettingsUrl(id);
  }

  function openClassicAccount() {
    setClassicAccountOpen(true);
    setProfileSavedOpen(false);
    setActiveSection("profile");
    setMobileSectionOpen(true);
    setProfileEditorOpen(true);
    updateSettingsUrl("profile", { edit: true });
  }

  function returnClassicHome() {
    setClassicAccountOpen(false);
    setProfileEditorOpen(false);
    setProfileSavedOpen(false);
    setMobileSectionOpen(false);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("section");
      url.searchParams.delete("edit");
      url.searchParams.delete("view");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }

`;

  source = source.replace(anchor, helpers + anchor);
  console.log("✅ Navegación clásica mobile-first agregada");
}

/* ================================================================
   4) RENDER PRINCIPAL — OPCIÓN 1 IGUAL A PROPUESTA
   ================================================================ */

const renderStartNeedle = `  return (
    <AppShell>
      <div className={\`alumni-settings-page`;

const renderStart = source.indexOf(renderStartNeedle);

if (renderStart < 0) {
  fail("No encontré el render principal actual de Configuración.");
}

const privacyFnIndex = source.indexOf("\nfunction PrivacyModeModal", renderStart);

if (privacyFnIndex < 0) {
  fail("No encontré PrivacyModeModal después del render principal.");
}

const currentSettingsClose = source.lastIndexOf("\n}", privacyFnIndex);

if (currentSettingsClose < renderStart) {
  fail("No pude localizar el cierre de SettingsPage.");
}

const newRender = `  const classicDetailTitle =
    activeSection === "profile"
      ? "Privacidad"
      : activeSection === "account"
      ? "Seguridad"
      : activeItem.label;

  return (
    <AppShell>
      <div
        className={\`alumni-settings-classic mx-auto w-full \${
          mobileSectionOpen || profileEditorOpen
            ? "is-detail-open"
            : "is-home"
        }\`}
        data-settings-design="option-1-classic"
      >
        {!mobileSectionOpen && !profileEditorOpen ? (
          <>
            <header className="alumni-settings-classic-header">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Volver"
                className="alumni-settings-classic-back"
              >
                <ArrowLeft size={20} />
              </button>

              <h1>Configuración</h1>

              <span
                className="alumni-settings-classic-header-spacer"
                aria-hidden="true"
              />
            </header>

            <button
              type="button"
              className="alumni-settings-profile-row"
              onClick={() => {
                if (form.username) {
                  router.push(\`/u/\${form.username}\`);
                }
              }}
            >
              <span className="alumni-settings-profile-avatar">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                  />
                ) : (
                  (form.full_name ||
                    form.username ||
                    "A")
                    .charAt(0)
                    .toUpperCase()
                )}
              </span>

              <span className="alumni-settings-profile-copy">
                <strong>
                  {form.full_name ||
                    (form.username
                      ? \`@\${form.username}\`
                      : "Mi perfil")}
                </strong>

                <small>
                  {form.career || "Comunidad Alumni"}
                </small>

                {form.university && (
                  <small>{form.university}</small>
                )}
              </span>

              <ChevronRight
                size={18}
                className="alumni-settings-row-chevron"
              />
            </button>

            <nav
              className="alumni-settings-classic-list"
              aria-label="Opciones de configuración"
            >
              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={openClassicAccount}
              >
                <span className="alumni-settings-row-icon">
                  <User size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Cuenta</strong>
                  <small>Datos personales y perfil</small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>

              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={() =>
                  openClassicSection("profile")
                }
              >
                <span className="alumni-settings-row-icon">
                  <LockKeyhole size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Privacidad</strong>
                  <small>
                    Quién puede seguirte y ver tu contenido
                  </small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>

              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={() =>
                  router.push("/notifications")
                }
              >
                <span className="alumni-settings-row-icon">
                  <Bell size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Notificaciones</strong>
                  <small>Revisa tus alertas y actividad</small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>

              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={() =>
                  openClassicSection("appearance")
                }
              >
                <span className="alumni-settings-row-icon">
                  <Palette size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Apariencia</strong>
                  <small>Tema de la aplicación</small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>

              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={() =>
                  openClassicSection("account")
                }
              >
                <span className="alumni-settings-row-icon">
                  <Shield size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Seguridad</strong>
                  <small>
                    Contraseña y protección de tu cuenta
                  </small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>

              <button
                type="button"
                className="alumni-settings-classic-row"
                onClick={() =>
                  router.push("/feedback")
                }
              >
                <span className="alumni-settings-row-icon">
                  <CircleHelp size={19} />
                </span>
                <span className="alumni-settings-row-copy">
                  <strong>Ayuda</strong>
                  <small>Soporte y comentarios</small>
                </span>
                <ChevronRight
                  size={17}
                  className="alumni-settings-row-chevron"
                />
              </button>
            </nav>

            <button
              type="button"
              onClick={() => void logout()}
              className="alumni-settings-logout"
            >
              <span className="alumni-settings-row-icon">
                <LogOut size={19} />
              </span>

              <span className="alumni-settings-row-copy">
                <strong>Cerrar sesión</strong>
                <small>Salir de tu cuenta</small>
              </span>
            </button>
          </>
        ) : (
          <section className="alumni-settings-classic-detail">
            {!profileEditorOpen && (
              <header className="alumni-settings-detail-header">
                <button
                  type="button"
                  onClick={returnClassicHome}
                  aria-label="Volver a Configuración"
                >
                  <ArrowLeft size={20} />
                </button>

                <h1>{classicDetailTitle}</h1>

                <span aria-hidden="true" />
              </header>
            )}

            <div className="alumni-settings-detail-content">
              {activeSection === "appearance" && (
                <AppearancePanel
                  theme={theme}
                  setTheme={setTheme}
                />
              )}

              {activeSection === "profile" &&
                (profileEditorOpen ? (
                  <ProfileEditorPro
                    userId={user?.id || ""}
                    onBack={() => {
                      if (classicAccountOpen) {
                        returnClassicHome();
                        return;
                      }

                      setProfileEditorOpen(false);

                      if (typeof window !== "undefined") {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("edit");
                        window.history.replaceState(
                          window.history.state,
                          "",
                          url.pathname + url.search
                        );
                      }
                    }}
                    onSaved={getProfile}
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
                      setClassicAccountOpen(false);
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
                ))}

              {activeSection === "academic" && (
                <AcademicPanel
                  form={form}
                  update={update}
                />
              )}

              {activeSection === "links" && (
                <LinksPanel
                  form={form}
                  update={update}
                />
              )}

              {activeSection === "music" && (
                <SpotifyPremiumMusicGate
                  userId={user?.id || ""}
                />
              )}

              {activeSection === "account" && (
                <AccountTrustPanel
                  email={user?.email || ""}
                  logout={logout}
                />
              )}
            </div>
          </section>
        )}
      </div>

      {privacyModalOpen && (
        <PrivacyModeModal
          busy={privacySaving}
          onClose={() => setPrivacyModalOpen(false)}
          onConfirm={confirmPrivateAccount}
        />
      )}
    </AppShell>
  );`;

source =
  source.slice(0, renderStart) +
  newRender +
  "\n}" +
  source.slice(privacyFnIndex);

/* ================================================================
   5) COPY: STORIES YA NO DEBE APARECER EN CONFIGURACIÓN
   ================================================================ */

source = source.replaceAll(
  "Solo tus seguidores aceptados podrán ver tus publicaciones e historias.",
  "Solo tus seguidores aceptados podrán ver tus publicaciones."
);

source = source.replaceAll(
  "Controla quién puede seguirte y ver tus publicaciones e historias.",
  "Controla quién puede seguirte y ver tus publicaciones."
);

profileHub = profileHub.replaceAll(
  "Las nuevas personas necesitan tu aprobación para seguirte.",
  "Las nuevas personas necesitan tu aprobación para seguirte."
);

profileHub = profileHub.replaceAll(
  "publicaciones e historias",
  "publicaciones"
);

/* ================================================================
   6) CSS — OPCIÓN 1, MOBILE FIRST
   ================================================================ */

const css = `/*
 * ${MARKER}
 * Opción 1 — Lista clásica
 * Referencia principal: teléfono 360–430 px.
 */

.alumni-settings-classic {
  width: 100%;
  max-width: 520px;
  min-height: 100%;
  margin: 0 auto;
  padding: 0 0 34px;
  color: var(--app-text);
}

.alumni-settings-classic-header,
.alumni-settings-detail-header {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  min-height: 54px;
  align-items: center;
  border-bottom: 1px solid var(--app-border);
}

.alumni-settings-classic-header h1,
.alumni-settings-detail-header h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  letter-spacing: -0.025em;
}

.alumni-settings-classic-back,
.alumni-settings-detail-header button {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--app-text);
}

.alumni-settings-classic-back:active,
.alumni-settings-detail-header button:active {
  background: var(--app-soft);
}

.alumni-settings-profile-row {
  display: flex;
  width: 100%;
  min-height: 100px;
  align-items: center;
  gap: 13px;
  padding: 17px 4px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
  color: inherit;
  text-align: left;
}

.alumni-settings-profile-avatar {
  display: inline-flex;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-2);
  color: var(--app-text);
  font-size: 18px;
  font-weight: 900;
}

.alumni-settings-profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.alumni-settings-profile-copy,
.alumni-settings-row-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.alumni-settings-profile-copy strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-settings-profile-copy small {
  display: block;
  overflow: hidden;
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 10.5px;
  font-weight: 500;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-settings-classic-list {
  display: block;
}

.alumni-settings-classic-row,
.alumni-settings-logout {
  display: flex;
  width: 100%;
  min-height: 66px;
  align-items: center;
  gap: 13px;
  padding: 10px 4px;
  border: 0;
  border-bottom: 1px solid var(--app-border);
  background: transparent;
  color: inherit;
  text-align: left;
}

.alumni-settings-classic-row:active {
  background: var(--app-soft);
}

.alumni-settings-row-icon {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: var(--app-text-soft);
}

.alumni-settings-row-copy strong {
  display: block;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 820;
  line-height: 1.15;
}

.alumni-settings-row-copy small {
  display: block;
  margin-top: 4px;
  color: var(--app-muted-2);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.25;
}

.alumni-settings-row-chevron {
  flex: 0 0 auto;
  color: var(--app-muted-3);
}

.alumni-settings-logout {
  margin-top: 10px;
  border-bottom: 0;
}

.alumni-settings-logout .alumni-settings-row-icon,
.alumni-settings-logout .alumni-settings-row-copy strong {
  color: #e44f5f;
}

.alumni-settings-logout .alumni-settings-row-copy small {
  color: color-mix(in srgb, #e44f5f 62%, var(--app-muted));
}

/* Detail views preserve existing functionality but no desktop sidebar. */
.alumni-settings-classic-detail {
  min-width: 0;
  width: 100%;
}

.alumni-settings-detail-header {
  position: sticky;
  top: 0;
  z-index: 30;
  background: color-mix(in srgb, var(--app-bg) 94%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.alumni-settings-detail-content {
  min-width: 0;
  padding-top: 14px;
}

/* Existing settings panels become flat/mobile-first. */
.alumni-settings-classic .alumni-settings-panel,
.alumni-settings-classic .alumni-profile-settings-hub {
  overflow: hidden;
  border: 1px solid var(--app-border) !important;
  border-radius: 18px !important;
  background: var(--app-surface) !important;
  box-shadow: none !important;
}

.alumni-settings-classic .alumni-setting-row {
  padding: 14px !important;
}

.alumni-settings-classic .alumni-settings-panel {
  padding: 15px !important;
}

.alumni-settings-classic .alumni-settings-panel [class*="text-zinc-"],
.alumni-settings-classic .alumni-profile-settings-hub [class*="text-zinc-"] {
  color: inherit;
}

/* Appearance stays simple and list-like. */
.alumni-settings-classic .alumni-settings-panel button {
  touch-action: manipulation;
}

/* Light */
html[data-theme="light"] .alumni-settings-classic {
  background: #ffffff;
}

html[data-theme="light"] .alumni-settings-detail-header {
  background: rgba(255,255,255,.94);
}

/* Dark */
html[data-theme="dark"] .alumni-settings-classic {
  background: var(--app-bg);
}

html[data-theme="dark"] .alumni-settings-detail-header {
  background: rgba(9,11,15,.94);
}

/* Small phones */
@media (max-width: 374px) {
  .alumni-settings-profile-row {
    min-height: 92px;
  }

  .alumni-settings-profile-avatar {
    width: 54px;
    height: 54px;
    flex-basis: 54px;
  }

  .alumni-settings-classic-row,
  .alumni-settings-logout {
    min-height: 62px;
  }

  .alumni-settings-row-copy strong {
    font-size: 12.5px;
  }

  .alumni-settings-row-copy small {
    font-size: 9.5px;
  }
}

/* Desktop: same phone-oriented structure, simply centered. */
@media (min-width: 700px) {
  .alumni-settings-classic {
    max-width: 540px;
    padding-top: 14px;
    padding-bottom: 50px;
  }

  .alumni-settings-classic-header,
  .alumni-settings-detail-header {
    border: 1px solid var(--app-border);
    border-radius: 16px 16px 0 0;
  }

  .alumni-settings-classic.is-home
    .alumni-settings-profile-row {
    padding-inline: 14px;
    border-right: 1px solid var(--app-border);
    border-left: 1px solid var(--app-border);
  }

  .alumni-settings-classic.is-home
    .alumni-settings-classic-list,
  .alumni-settings-classic.is-home
    .alumni-settings-logout {
    padding-inline: 14px;
  }
}
`;

fs.writeFileSync(cssFile, css, "utf8");

/* ================================================================
   7) VALIDACIONES
   ================================================================ */

const validations = [
  [source.includes('data-settings-design="option-1-classic"'), "diseño clásico"],
  [source.includes(">Cuenta<"), "Cuenta"],
  [source.includes(">Privacidad<"), "Privacidad"],
  [source.includes(">Notificaciones<"), "Notificaciones"],
  [source.includes(">Apariencia<"), "Apariencia"],
  [source.includes(">Seguridad<"), "Seguridad"],
  [source.includes(">Ayuda<"), "Ayuda"],
  [source.includes(">Cerrar sesión<"), "Cerrar sesión"],
  [source.includes('router.push("/notifications")'), "ruta Notificaciones"],
  [source.includes('router.push("/feedback")'), "ruta Ayuda"],
  [source.includes("openClassicAccount"), "Cuenta funcional"],
  [source.includes('openClassicSection("appearance")'), "Apariencia funcional"],
  [source.includes('openClassicSection("account")'), "Seguridad funcional"],
  [css.includes("max-width: 520px"), "mobile-first"],
];

for (const [ok, label] of validations) {
  if (!ok) {
    try { fs.unlinkSync(cssFile); } catch {}
    fail("Validación final: " + label);
  }
}

if (
  source.includes("publicaciones e historias") ||
  profileHub.includes("publicaciones e historias")
) {
  console.warn(
    "⚠️ Quedó alguna mención histórica de Stories fuera de los bloques principales; no bloquea el parche."
  );
}

if (!source.includes(MARKER)) {
  source += `\n/* ${MARKER} */\n`;
}

if (!profileHub.includes(MARKER)) {
  profileHub += `\n/* ${MARKER} */\n`;
}

fs.writeFileSync(settingsFile, source, "utf8");
fs.writeFileSync(profileHubFile, profileHub, "utf8");

console.log("");
console.log("✅ ALUMNI Settings 1.0 — Opción 1 aplicado COMPLETO.");
console.log("✅ Lista clásica igual al concepto aprobado.");
console.log("✅ Perfil arriba.");
console.log("✅ Cuenta.");
console.log("✅ Privacidad.");
console.log("✅ Notificaciones.");
console.log("✅ Apariencia.");
console.log("✅ Seguridad.");
console.log("✅ Ayuda.");
console.log("✅ Cerrar sesión en rojo.");
console.log("✅ Mobile-first.");
console.log("✅ Claro/Oscuro.");
console.log("✅ Sin botones falsos.");
console.log("✅ Stories removido del copy visible de privacidad.");
console.log("");
console.log("Ahora ejecutá: npm run build");
