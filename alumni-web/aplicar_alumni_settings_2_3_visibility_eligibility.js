const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_SETTINGS_2_3_VISIBILITY_ELIGIBILITY";

const SETTINGS =
  "src/app/settings/page.tsx";

const TRUST =
  "src/components/settings/AccountTrustPanel.tsx";

const NOTIFICATIONS =
  "src/app/notifications/page.tsx";

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
    ".before-settings-2.3.bak";

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(file, bak);
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

let settings =
  read(SETTINGS);

let trust =
  read(TRUST);

let notifications =
  read(NOTIFICATIONS);

if (
  settings.includes(MARKER) &&
  trust.includes(MARKER) &&
  notifications.includes(MARKER)
) {
  console.log(
    "✅ ALUMNI Settings 2.3 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   SETTINGS — SPOTIFY ELIGIBILITY
   ========================================================= */

if (
  !settings.includes(
    'import { getSpotifyPremiumSession } from "@/lib/spotifyClient";'
  )
) {
  const anchor =
    'import { uploadImage } from "@/lib/storage";';

  if (!settings.includes(anchor)) {
    fail(
      "No encontré el import de storage para agregar spotifyClient."
    );
  }

  settings =
    settings.replace(
      anchor,
      `${anchor}
import { getSpotifyPremiumSession } from "@/lib/spotifyClient";`
    );
}

const requestsState =
  `  const [requestsLoading, setRequestsLoading] = useState(false);`;

if (
  !settings.includes(
    "spotifySettingsVisible"
  )
) {
  settings =
    replaceRequired(
      settings,
      requestsState,
      `${requestsState}
  const [
    spotifySettingsVisible,
    setSpotifySettingsVisible,
  ] = useState(false);

  const [
    spotifyAccessChecked,
    setSpotifyAccessChecked,
  ] = useState(false);`,
      "estado requestsLoading"
    );
}

const profileEffect =
  `  useEffect(() => {
    if (user) getProfile();
  }, [user?.id]);`;

if (
  !settings.includes(
    "async function checkSpotifySettingsAccess"
  )
) {
  settings =
    replaceRequired(
      settings,
      profileEffect,
      `${profileEffect}

  useEffect(() => {
    if (!user) {
      setSpotifySettingsVisible(false);
      setSpotifyAccessChecked(false);
      return;
    }

    let cancelled = false;

    async function checkSpotifySettingsAccess() {
      try {
        const session =
          await getSpotifyPremiumSession();

        if (cancelled) return;

        setSpotifySettingsVisible(
          Boolean(
            session.connected &&
              session.premium
          )
        );
      } catch {
        if (cancelled) return;

        setSpotifySettingsVisible(false);
      } finally {
        if (!cancelled) {
          setSpotifyAccessChecked(true);
        }
      }
    }

    void checkSpotifySettingsAccess();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (
      !spotifyAccessChecked ||
      spotifySettingsVisible ||
      typeof window === "undefined"
    ) {
      return;
    }

    const url =
      new URL(
        window.location.href
      );

    if (
      url.searchParams.get("section") !==
      "music"
    ) {
      return;
    }

    setActiveSection("profile");
    setMobileSectionOpen(false);

    url.searchParams.delete("section");
    url.searchParams.delete("spotify");

    window.history.replaceState(
      {},
      "",
      url.pathname + url.search
    );
  }, [
    spotifyAccessChecked,
    spotifySettingsVisible,
  ]);`,
      "useEffect de getProfile"
    );
}

/*
 * Render Music only for a connected Spotify Premium account.
 */
const musicRender =
  `              {activeSection === "music" && (
                <SpotifyPremiumMusicGate
                  userId={user?.id || ""}
                />
              )}`;

const musicRenderNext =
  `              {activeSection === "music" &&
                spotifyAccessChecked &&
                spotifySettingsVisible && (
                  <SpotifyPremiumMusicGate
                    userId={user?.id || ""}
                  />
                )}`;

if (
  settings.includes(
    musicRender
  )
) {
  settings =
    settings.replace(
      musicRender,
      musicRenderNext
    );
}

/*
 * Settings 2.2 compatibility:
 * If local tree still has the old "Cuenta" wording,
 * make the label match its real action.
 */
settings =
  settings.replace(
    `<strong>Cuenta</strong>
                  <small>Datos personales y perfil</small>`,
    `<strong>Editar perfil</strong>
                  <small>Nombre, foto, biografía y datos personales</small>`
  );

/*
 * If local tree still opens activity inbox from Settings,
 * point the row to actual notification preferences.
 */
settings =
  settings.replace(
    'router.push("/notifications")',
    'router.push("/notifications?preferences=1")'
  );

settings =
  settings.replace(
    `<strong>Notificaciones</strong>
                  <small>Revisa tus alertas y actividad</small>`,
    `<strong>Preferencias de notificaciones</strong>
                  <small>Elige qué alertas quieres recibir</small>`
  );

if (
  !settings.includes(
    `/* ${MARKER} */`
  )
) {
  settings +=
    `\n/* ${MARKER} */\n`;
}

/* =========================================================
   ACCOUNT TRUST — AUTH PROVIDER ELIGIBILITY
   ========================================================= */

const userAnchor =
  `  const { user } = useAuth();`;

if (
  !trust.includes(
    "supportsEmailPassword"
  )
) {
  trust =
    replaceRequired(
      trust,
      userAnchor,
      `${userAnchor}

  const authProviders =
    Array.from(
      new Set(
        [
          ...(
            Array.isArray(
              user?.app_metadata?.providers
            )
              ? user?.app_metadata?.providers
              : []
          ),
          user?.app_metadata?.provider,
          ...(
            user?.identities || []
          ).map(
            (identity) =>
              identity.provider
          ),
        ].filter(Boolean)
      )
    );

  const supportsEmailPassword =
    authProviders.includes("email");`,
      "useAuth en AccountTrustPanel"
    );
}

const authActions =
  `        <div className="mt-1 divide-y divide-[var(--app-border)] border-t border-[var(--app-border)]">
          <button
            type="button"
            onClick={() =>
              openAccountFlow(
                "recovery"
              )
            }
            className="flex min-h-[58px] w-full items-center gap-3 text-left"
          >
            <Mail
              size={17}
              className="text-[var(--app-muted)]"
            />
            <span className="min-w-0 flex-1 text-sm font-bold text-[var(--app-text-soft)]">
              Correo de recuperación
            </span>
            <ChevronRight
              size={17}
              className="text-[var(--app-muted-2)]"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              openAccountFlow(
                "password"
              )
            }
            className="flex min-h-[58px] w-full items-center gap-3 text-left"
          >
            <KeyRound
              size={17}
              className="text-[var(--app-muted)]"
            />
            <span className="min-w-0 flex-1 text-sm font-bold text-[var(--app-text-soft)]">
              Cambiar contraseña
            </span>
            <ChevronRight
              size={17}
              className="text-[var(--app-muted-2)]"
            />
          </button>
        </div>`;

const authActionsNext =
  `        {supportsEmailPassword && (
          <div className="mt-1 divide-y divide-[var(--app-border)] border-t border-[var(--app-border)]">
            <button
              type="button"
              onClick={() =>
                openAccountFlow(
                  "recovery"
                )
              }
              className="flex min-h-[58px] w-full items-center gap-3 text-left"
            >
              <Mail
                size={17}
                className="text-[var(--app-muted)]"
              />
              <span className="min-w-0 flex-1 text-sm font-bold text-[var(--app-text-soft)]">
                Correo de recuperación
              </span>
              <ChevronRight
                size={17}
                className="text-[var(--app-muted-2)]"
              />
            </button>

            <button
              type="button"
              onClick={() =>
                openAccountFlow(
                  "password"
                )
              }
              className="flex min-h-[58px] w-full items-center gap-3 text-left"
            >
              <KeyRound
                size={17}
                className="text-[var(--app-muted)]"
              />
              <span className="min-w-0 flex-1 text-sm font-bold text-[var(--app-text-soft)]">
                Cambiar contraseña
              </span>
              <ChevronRight
                size={17}
                className="text-[var(--app-muted-2)]"
              />
            </button>
          </div>
        )}`;

if (
  trust.includes(
    authActions
  )
) {
  trust =
    trust.replace(
      authActions,
      authActionsNext
    );
} else if (
  !trust.includes(
    "{supportsEmailPassword && ("
  )
) {
  fail(
    "No encontré el bloque de recuperación/contraseña esperado."
  );
}

if (
  !trust.includes(
    `/* ${MARKER} */`
  )
) {
  trust +=
    `\n/* ${MARKER} */\n`;
}

/* =========================================================
   NOTIFICATIONS — HIDDEN STORIES PRODUCT DECISION
   ========================================================= */

const storiesBlock =
  `                    [
                      "stories",
                      "Historias",
                      "Respuestas y actividad de historias.",
                    ],
`;

if (
  notifications.includes(
    storiesBlock
  )
) {
  notifications =
    notifications.replace(
      storiesBlock,
      ""
    );
}

/*
 * Also support slightly reformatted local copies.
 */
notifications =
  notifications.replace(
    /\s*\[\s*"stories"\s*,\s*"Historias"\s*,\s*"Respuestas y actividad de historias\."\s*,?\s*\],?/m,
    ""
  );

if (
  !notifications.includes(
    `/* ${MARKER} */`
  )
) {
  notifications +=
    `\n/* ${MARKER} */\n`;
}

/* =========================================================
   TSX PARSE VALIDATION
   ========================================================= */

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [
        SETTINGS,
        settings,
      ],
      [
        TRUST,
        trust,
      ],
      [
        NOTIFICATIONS,
        notifications,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
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
        `${name}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Settings, Seguridad y Notificaciones válidos"
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
   PRODUCT VALIDATION
   ========================================================= */

if (
  !trust.includes(
    'authProviders.includes("email")'
  )
) {
  fail(
    "Validación: Seguridad no quedó condicionada por proveedor email."
  );
}

if (
  notifications.includes(
    '"Historias",'
  )
) {
  fail(
    "Validación: Historias sigue visible en preferencias."
  );
}

if (
  !settings.includes(
    "spotifySettingsVisible"
  ) ||
  !settings.includes(
    "session.connected &&"
  )
) {
  fail(
    "Validación: Música no quedó condicionada por Spotify Premium."
  );
}

/* =========================================================
   WRITE
   ========================================================= */

backup(SETTINGS);
backup(TRUST);
backup(NOTIFICATIONS);

fs.writeFileSync(
  abs(SETTINGS),
  settings,
  "utf8"
);

fs.writeFileSync(
  abs(TRUST),
  trust,
  "utf8"
);

fs.writeFileSync(
  abs(NOTIFICATIONS),
  notifications,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Settings 2.3 aplicado."
);
console.log(
  "✅ Música solo para Spotify conectado + Premium."
);
console.log(
  "✅ Cambiar contraseña solo para proveedor email."
);
console.log(
  "✅ Recuperación solo para proveedor email."
);
console.log(
  "✅ Historias ocultas de preferencias."
);
console.log(
  "✅ Bloqueados/Silenciados conservan su condición actual."
);
console.log(
  "✅ Solicitudes conservan su condición de cuenta privada."
);
console.log(
  "✅ Exportar datos, eliminar cuenta y cerrar sesión siguen para todos."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
