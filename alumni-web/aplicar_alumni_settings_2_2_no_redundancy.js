const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_SETTINGS_2_2_NO_REDUNDANCY";

const paths = {
  settings:
    "src/app/settings/page.tsx",
  profileHub:
    "src/components/settings/ProfileSettingsHub.tsx",
  notifications:
    "src/app/notifications/page.tsx",
};

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
      `No encontré ${rel}. Ejecutá este parche desde alumni-web.`
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
    ".before-settings-2.2.bak";

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

let settings = read(paths.settings);
let notifications =
  read(paths.notifications);

if (
  settings.includes(MARKER) &&
  notifications.includes(MARKER) &&
  read(paths.profileHub).includes(MARKER)
) {
  console.log(
    "✅ ALUMNI Settings 2.2 ya estaba aplicado."
  );
  process.exit(0);
}

/* =========================================================
   1. SETTINGS HOME — every visible row must do exactly
      what its label says.
   ========================================================= */

/*
 * Top profile row:
 * - username exists -> public profile
 * - no username -> editor
 * Never a dead button.
 */
settings = replaceRequired(
  settings,
  `              onClick={() => {
                if (form.username) {
                  router.push(\`/u/\${form.username}\`);
                }
              }}`,
  `              onClick={() => {
                if (form.username) {
                  router.push(\`/u/\${form.username}\`);
                  return;
                }

                openClassicAccount();
              }}`,
  "acción de la fila superior de perfil"
);

/*
 * "Cuenta" actually opens the profile editor.
 * Rename it to the real action.
 */
settings = replaceRequired(
  settings,
  `<strong>Cuenta</strong>
                  <small>Datos personales y perfil</small>`,
  `<strong>Editar perfil</strong>
                  <small>Nombre, foto, biografía y datos personales</small>`,
  "texto Cuenta -> Editar perfil"
);

/*
 * Settings should open notification PREFERENCES,
 * not duplicate the notifications activity inbox.
 */
settings = replaceRequired(
  settings,
  `router.push("/notifications")`,
  `router.push("/notifications?preferences=1")`,
  "ruta de Preferencias de notificaciones"
);

settings = replaceRequired(
  settings,
  `<strong>Notificaciones</strong>
                  <small>Revisa tus alertas y actividad</small>`,
  `<strong>Preferencias de notificaciones</strong>
                  <small>Elige qué alertas quieres recibir</small>`,
  "texto de Notificaciones"
);

/*
 * Privacy must be privacy only.
 * Rebuild the component invocation with only relevant props.
 */
const hubPattern =
  /<ProfileSettingsHub[\s\S]*?\/>/m;

const hubMatch =
  settings.match(hubPattern);

if (!hubMatch) {
  fail(
    "No encontré la invocación de ProfileSettingsHub."
  );
}

const cleanHubCall = `<ProfileSettingsHub
                    isPrivate={isPrivate}
                    privacySaving={privacySaving}
                    updatePrivacy={updatePrivacy}
                    followRequests={followRequests}
                    requestsLoading={requestsLoading}
                    acceptFollowRequest={acceptFollowRequest}
                    rejectFollowRequest={rejectFollowRequest}
                  />`;

settings = settings.replace(
  hubMatch[0],
  cleanHubCall
);

settings +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   2. PRIVACY HUB — only privacy + follow requests.
      No Saved / Edit Profile inside Privacy.
   ========================================================= */

const profileHub = `"use client";

import {
  Clock3,
  LockKeyhole,
  UserRoundCheck,
  UserRoundX,
} from "lucide-react";
import {
  useState,
} from "react";

type Props = {
  isPrivate: boolean;
  privacySaving: boolean;
  updatePrivacy:
    (next: boolean) => void;
  followRequests: any[];
  requestsLoading: boolean;
  acceptFollowRequest:
    (id: string) => Promise<void>;
  rejectFollowRequest:
    (id: string) => Promise<void>;
};

export default function ProfileSettingsHub({
  isPrivate,
  privacySaving,
  updatePrivacy,
  followRequests,
  requestsLoading,
  acceptFollowRequest,
  rejectFollowRequest,
}: Props) {
  const [
    busyRequest,
    setBusyRequest,
  ] =
    useState<string | null>(
      null
    );

  async function accept(
    id: string
  ) {
    if (busyRequest) {
      return;
    }

    setBusyRequest(id);

    try {
      await acceptFollowRequest(
        id
      );
    } finally {
      setBusyRequest(null);
    }
  }

  async function reject(
    id: string
  ) {
    if (busyRequest) {
      return;
    }

    setBusyRequest(id);

    try {
      await rejectFollowRequest(
        id
      );
    } finally {
      setBusyRequest(null);
    }
  }

  return (
    <div className="alumni-profile-settings-hub">
      <div className="alumni-setting-row">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
          <LockKeyhole
            size={18}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-[var(--app-text)]">
            Cuenta privada
          </p>

          <p className="mt-1 text-[11px] leading-5 text-[var(--app-muted-2)]">
            Las nuevas personas necesitan tu aprobación para seguirte.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={
            isPrivate
          }
          disabled={
            privacySaving
          }
          onClick={() =>
            updatePrivacy(
              !isPrivate
            )
          }
          className={\`alumni-privacy-switch \${isPrivate ? "is-on" : ""}\`}
          aria-label={
            isPrivate
              ? "Desactivar cuenta privada"
              : "Activar cuenta privada"
          }
        >
          <span />
        </button>
      </div>

      {isPrivate && (
        <div className="border-t border-[var(--app-border)]">
          <div className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--app-soft)] text-[var(--app-muted)]">
              <Clock3
                size={18}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[var(--app-text)]">
                Solicitudes de seguimiento
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[var(--app-muted-2)]">
                Acepta o rechaza quién puede seguirte.
              </p>
            </div>

            {followRequests.length >
              0 && (
              <span className="rounded-full bg-[var(--app-accent)] px-2 py-1 text-[10px] font-black text-[var(--app-on-accent)]">
                {
                  followRequests.length
                }
              </span>
            )}
          </div>

          {requestsLoading ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              Cargando...
            </div>
          ) : followRequests.length ===
            0 ? (
            <div className="pb-4 pl-[52px] text-xs text-[var(--app-muted-2)]">
              No hay solicitudes pendientes.
            </div>
          ) : (
            <div className="divide-y divide-[var(--app-border)] pb-2">
              {followRequests.map(
                (request) => {
                  const person =
                    request.requester;

                  const busy =
                    busyRequest ===
                    request.id;

                  return (
                    <div
                      key={
                        request.id
                      }
                      className="flex items-center gap-3 py-3 pl-[8px]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text)]">
                        {person?.avatar_url ? (
                          <img
                            src={
                              person.avatar_url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          person?.username
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                          "U"
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-[var(--app-text)]">
                          @
                          {person?.username ||
                            "usuario"}
                        </p>

                        {person?.full_name && (
                          <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
                            {
                              person.full_name
                            }
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={
                          busyRequest !==
                          null
                        }
                        onClick={() =>
                          void accept(
                            request.id
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] text-[var(--app-on-accent)] disabled:opacity-50"
                        aria-label="Aceptar solicitud"
                        title="Aceptar"
                      >
                        {busy ? (
                          <Clock3
                            size={
                              14
                            }
                          />
                        ) : (
                          <UserRoundCheck
                            size={
                              15
                            }
                          />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={
                          busyRequest !==
                          null
                        }
                        onClick={() =>
                          void reject(
                            request.id
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-muted)] disabled:opacity-50"
                        aria-label="Rechazar solicitud"
                        title="Rechazar"
                      >
                        <UserRoundX
                          size={15}
                        />
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ${MARKER} */
`;

/* =========================================================
   3. NOTIFICATION PREFERENCES
      /notifications remains the activity inbox.
      /notifications?preferences=1 opens preferences directly.
   ========================================================= */

const authEffect = `  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);
`;

const prefsEffect = `${authEffect}
  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (
      params.get(
        "preferences"
      ) === "1"
    ) {
      setPreferencesOpen(
        true
      );
    }
  }, []);

  function closePreferences() {
    setPreferencesOpen(
      false
    );

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const url =
      new URL(
        window.location.href
      );

    if (
      url.searchParams.has(
        "preferences"
      )
    ) {
      url.searchParams.delete(
        "preferences"
      );

      window.history.replaceState(
        window.history.state,
        "",
        url.pathname +
          url.search
      );
    }
  }
`;

notifications = replaceRequired(
  notifications,
  authEffect,
  prefsEffect,
  "efecto inicial de Notifications"
);

/*
 * Close preference sheet through one helper so query state
 * never becomes stale.
 */
notifications =
  notifications.replaceAll(
    "setPreferencesOpen(false)",
    "closePreferences()"
  );

/*
 * Hidden Stories should not have a visible preference.
 * Preserve the field internally for DB compatibility, but remove
 * its button from the UI.
 */
const storiesPreference = `                    [
                      "stories",
                      "Historias",
                      "Respuestas y actividad de historias.",
                    ],
`;

if (
  notifications.includes(
    storiesPreference
  )
) {
  notifications =
    notifications.replace(
      storiesPreference,
      ""
    );
}

notifications +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   4. TSX validation
   ========================================================= */

try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [
        paths.settings,
        settings,
      ],
      [
        paths.profileHub,
        profileHub,
      ],
      [
        paths.notifications,
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
    "✅ Parser TypeScript: Settings, Privacidad y Notifications válidos"
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

/* Product validations */
if (
  settings.includes(
    "<strong>Cuenta</strong>"
  )
) {
  fail(
    "Validación: todavía aparece Cuenta como acceso al editor."
  );
}

if (
  settings.includes(
    'router.push("/notifications")'
  )
) {
  fail(
    "Validación: Settings todavía abre la bandeja de notificaciones en vez de preferencias."
  );
}

if (
  profileHub.includes(
    "Guardados"
  ) ||
  profileHub.includes(
    "Editar perfil"
  )
) {
  fail(
    "Validación: Privacidad todavía contiene accesos redundantes."
  );
}

if (
  notifications.includes(
    '"Historias",'
  )
) {
  fail(
    "Validación: la preferencia visible de Historias sigue presente."
  );
}

/* =========================================================
   5. Backup + write
   ========================================================= */

backup(paths.settings);
backup(paths.profileHub);
backup(paths.notifications);

fs.writeFileSync(
  abs(paths.settings),
  settings,
  "utf8"
);

fs.writeFileSync(
  abs(paths.profileHub),
  profileHub,
  "utf8"
);

fs.writeFileSync(
  abs(paths.notifications),
  notifications,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Settings 2.2 aplicado."
);
console.log(
  "✅ Cuenta -> Editar perfil."
);
console.log(
  "✅ Fila superior nunca queda sin acción."
);
console.log(
  "✅ Privacidad contiene solo privacidad y solicitudes."
);
console.log(
  "✅ Guardados eliminado de Privacidad."
);
console.log(
  "✅ Editar perfil eliminado de Privacidad."
);
console.log(
  "✅ Settings abre directamente Preferencias de notificaciones."
);
console.log(
  "✅ Historias eliminado de preferencias visibles."
);
console.log(
  "✅ Cada botón visible tiene una función concreta."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
