const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_NOTIFICATIONS_2_0";

const NOTIFICATIONS =
  "src/app/notifications/page.tsx";
const APP_SHELL =
  "src/components/layout/AppShell.tsx";
const PUSH_LIB =
  "src/lib/pushNotifications.ts";
const PUSH_BOOTSTRAP =
  "src/components/notifications/PushNotificationBootstrap.tsx";
const MIGRATION =
  "supabase/migrations/20260911180000_alumni_notifications_2_0_preferences.sql";

function abs(rel) {
  return path.join(
    ROOT,
    rel
  );
}

function fail(message) {
  console.error(
    "❌ " + message
  );
  process.exit(1);
}

function read(rel) {
  if (
    !fs.existsSync(
      abs(rel)
    )
  ) {
    fail(
      `No encontré ${rel}`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(/\r\n/g, "\n");
}

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-notifications-2.0.bak";

  if (
    !fs.existsSync(
      target
    )
  ) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

function replaceExact(
  source,
  before,
  after,
  label
) {
  if (
    !source.includes(
      before
    )
  ) {
    fail(
      `No encontré bloque esperado: ${label}`
    );
  }

  return source.replace(
    before,
    after
  );
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let notifications =
  read(NOTIFICATIONS);
let appShell =
  read(APP_SHELL);

if (
  notifications.includes(
    MARKER
  ) &&
  appShell.includes(
    MARKER
  )
) {
  console.log(
    "✅ Notifications 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  NOTIFICATIONS,
  notifications
);
backup(
  APP_SHELL,
  appShell
);

/* =========================================================
   Imports
   ========================================================= */

notifications =
  replaceExact(
    notifications,
    `import { supabase } from "@/lib/supabase";`,
    `import { supabase } from "@/lib/supabase";
import {
  disableWebPushRegistration,
  syncPushRegistration,
} from "@/lib/pushNotifications";`,
    "import pushNotifications"
  );

/* =========================================================
   Preference schema
   ========================================================= */

notifications =
  replaceExact(
    notifications,
    `type FilterType =
  | "all"
  | "interactions"
  | "connections"
  | "mentions";`,
    `type FilterType =
  | "all"
  | "interactions"
  | "connections"
  | "mentions"
  | "events";`,
    "FilterType"
  );

notifications =
  replaceExact(
    notifications,
    `type Preferences = {
  enabled: boolean;
  interactions: boolean;
  connections: boolean;
  mentions: boolean;
  stories: boolean;
  groups: boolean;
};`,
    `type Preferences = {
  push_enabled: boolean;
  messages: boolean;
  story_replies: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  events: boolean;
};`,
    "Preferences"
  );

notifications =
  replaceExact(
    notifications,
    `const DEFAULT_PREFS: Preferences = {
  enabled: true,
  interactions: true,
  connections: true,
  mentions: true,
  stories: true,
  groups: true,
};`,
    `const DEFAULT_PREFS: Preferences = {
  push_enabled: true,
  messages: true,
  story_replies: true,
  likes: true,
  comments: true,
  follows: true,
  events: true,
};`,
    "DEFAULT_PREFS"
  );

/* =========================================================
   Categories / tabs
   ========================================================= */

notifications =
  replaceExact(
    notifications,
    `      "community_invite",
      "community_join_request",
      "event_invite",
      "event_reminder",
    ].includes(t)
  ) {
    return "connections";
  }

  if (
    t.includes("mention") ||`,
    `      "community_invite",
      "community_join_request",
    ].includes(t)
  ) {
    return "connections";
  }

  if (
    t.startsWith("event") ||
    target === "event"
  ) {
    return "events";
  }

  if (
    t.includes("mention") ||`,
    "categoryOf events"
  );

notifications =
  replaceExact(
    notifications,
    `    { id: "mentions", label: "Menciones" },
  ];`,
    `    { id: "mentions", label: "Menciones" },
    { id: "events", label: "Eventos" },
  ];`,
    "tabs events"
  );

/* =========================================================
   Load preferences
   ========================================================= */

notifications =
  replaceExact(
    notifications,
    `.select(
        "enabled,interactions,connections,mentions,stories,groups"
      )`,
    `.select(
        "push_enabled,messages,story_replies,likes,comments,follows,events"
      )`,
    "loadPreferences select"
  );

/* =========================================================
   Toggle preferences
   ========================================================= */

notifications =
  replaceExact(
    notifications,
    `  async function togglePreference(key: keyof Preferences) {
    if (!user || savingPreference) return;

    const next = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(next);
    setSavingPreference(key);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...next,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      setPreferences(preferences);
      alert(error.message);
    }

    setSavingPreference(null);
  }`,
    `  async function togglePreference(key: keyof Preferences) {
    if (!user || savingPreference) return;

    const enabled =
      !preferences[key];

    setSavingPreference(
      key
    );

    if (
      key ===
        "push_enabled" &&
      enabled
    ) {
      const result =
        await syncPushRegistration({
          requestPermission:
            true,
        });

      if (
        result ===
          "denied" ||
        result ===
          "unsupported" ||
        result ===
          "error"
      ) {
        setSavingPreference(
          null
        );

        alert(
          result ===
            "denied"
            ? "Debes permitir notificaciones en este dispositivo."
            : "No se pudo activar Push en este dispositivo."
        );
        return;
      }
    }

    const next = {
      ...preferences,
      [key]: enabled,
    };

    setPreferences(
      next
    );

    const { error } =
      await supabase
        .from(
          "notification_preferences"
        )
        .upsert(
          {
            user_id:
              user.id,
            ...next,
            updated_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "user_id",
          }
        );

    if (error) {
      setPreferences(
        preferences
      );
      alert(
        error.message
      );
      setSavingPreference(
        null
      );
      return;
    }

    if (
      key ===
        "push_enabled" &&
      !enabled
    ) {
      await disableWebPushRegistration();
    }

    setSavingPreference(
      null
    );
  }`,
    "togglePreference"
  );

/* =========================================================
   Preferences UI
   ========================================================= */

const oldPrefs = `                  [
                    [
                      "enabled",
                      "Notificaciones",
                      "Control general de la bandeja.",
                    ],
                    [
                      "interactions",
                      "Interacciones",
                      "Likes, comentarios y compartidos.",
                    ],
                    [
                      "connections",
                      "Conexiones",
                      "Seguidores y solicitudes.",
                    ],
                    [
                      "mentions",
                      "Menciones",
                      "Cuando alguien escribe tu @usuario.",
                    ],
                    [
                      "groups",
                      "Grupos",
                      "Menciones y actividad importante en grupos.",
                    ],
                  ]`;

const newPrefs = `                  [
                    [
                      "push_enabled",
                      "Push",
                      "Avisos en este dispositivo.",
                    ],
                    [
                      "messages",
                      "Mensajes",
                      "Mensajes privados y actividad importante de grupos.",
                    ],
                    [
                      "story_replies",
                      "Respuestas a historias",
                      "Cuando alguien responde a una historia.",
                    ],
                    [
                      "likes",
                      "Likes y compartidos",
                      "Reacciones, likes y reposts.",
                    ],
                    [
                      "comments",
                      "Comentarios y respuestas",
                      "Comentarios, respuestas y menciones.",
                    ],
                    [
                      "follows",
                      "Seguidores",
                      "Nuevos seguidores, solicitudes e invitaciones.",
                    ],
                    [
                      "events",
                      "Eventos",
                      "Invitaciones y recordatorios de eventos.",
                    ],
                  ]`;

notifications =
  replaceExact(
    notifications,
    oldPrefs,
    newPrefs,
    "preferences UI"
  );

notifications +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   AppShell global bootstrap
   ========================================================= */

appShell =
  replaceExact(
    appShell,
    `import EventReminderBootstrap from "@/components/events/EventReminderBootstrap";`,
    `import EventReminderBootstrap from "@/components/events/EventReminderBootstrap";
import PushNotificationBootstrap from "@/components/notifications/PushNotificationBootstrap";`,
    "AppShell import"
  );

appShell =
  replaceExact(
    appShell,
    `      <EventReminderBootstrap />`,
    `      <EventReminderBootstrap />
      <PushNotificationBootstrap />`,
    "AppShell bootstrap mount"
  );

appShell +=
  `\n/* ${MARKER} */\n`;

/* =========================================================
   Write new helper files
   ========================================================= */

const pushLib =
  "\"use client\";\n\nimport { Capacitor } from \"@capacitor/core\";\nimport { supabase } from \"@/lib/supabase\";\n\nexport type PushRegistrationResult =\n  | \"registered\"\n  | \"granted\"\n  | \"denied\"\n  | \"unsupported\"\n  | \"error\";\n\nlet nativeListenersBound = false;\nlet nativeRegistrationPromise:\n  | Promise<PushRegistrationResult>\n  | null = null;\n\nfunction safeRelativeUrl(\n  value: unknown\n) {\n  const url =\n    typeof value === \"string\"\n      ? value.trim()\n      : \"\";\n\n  if (\n    !url ||\n    !url.startsWith(\"/\") ||\n    url.startsWith(\"//\")\n  ) {\n    return null;\n  }\n\n  return url;\n}\n\nfunction base64UrlToUint8Array(\n  value: string\n) {\n  const padding =\n    \"=\".repeat(\n      (4 - (value.length % 4)) % 4\n    );\n  const base64 =\n    (value + padding)\n      .replace(/-/g, \"+\")\n      .replace(/_/g, \"/\");\n\n  const raw =\n    window.atob(base64);\n\n  return Uint8Array.from(\n    raw,\n    (char) =>\n      char.charCodeAt(0)\n  );\n}\n\nasync function registerNativePush(\n  requestPermission: boolean\n): Promise<PushRegistrationResult> {\n  if (\n    !Capacitor.isNativePlatform()\n  ) {\n    return \"unsupported\";\n  }\n\n  if (nativeRegistrationPromise) {\n    return nativeRegistrationPromise;\n  }\n\n  nativeRegistrationPromise =\n    (async () => {\n      try {\n        const {\n          PushNotifications,\n        } = await import(\n          \"@capacitor/push-notifications\"\n        );\n\n        let permission =\n          await PushNotifications.checkPermissions();\n\n        if (\n          permission.receive !==\n            \"granted\" &&\n          requestPermission\n        ) {\n          permission =\n            await PushNotifications.requestPermissions();\n        }\n\n        if (\n          permission.receive !==\n          \"granted\"\n        ) {\n          return requestPermission\n            ? \"denied\"\n            : \"granted\";\n        }\n\n        if (\n          !nativeListenersBound\n        ) {\n          nativeListenersBound =\n            true;\n\n          await PushNotifications.addListener(\n            \"pushNotificationActionPerformed\",\n            (event) => {\n              const url =\n                safeRelativeUrl(\n                  event.notification\n                    ?.data?.url\n                );\n\n              if (\n                url &&\n                typeof window !==\n                  \"undefined\"\n              ) {\n                window.location.assign(\n                  url\n                );\n              }\n            }\n          );\n        }\n\n        const result =\n          await new Promise<PushRegistrationResult>(\n            async (\n              resolve\n            ) => {\n              let settled =\n                false;\n\n              const finish = (\n                value: PushRegistrationResult\n              ) => {\n                if (\n                  settled\n                ) {\n                  return;\n                }\n\n                settled =\n                  true;\n                resolve(\n                  value\n                );\n              };\n\n              const timeout =\n                window.setTimeout(\n                  () =>\n                    finish(\n                      \"error\"\n                    ),\n                  9000\n                );\n\n              const successHandle =\n                await PushNotifications.addListener(\n                  \"registration\",\n                  async (\n                    token\n                  ) => {\n                    window.clearTimeout(\n                      timeout\n                    );\n\n                    const {\n                      error,\n                    } =\n                      await supabase.rpc(\n                        \"register_push_device\",\n                        {\n                          p_push_token:\n                            token.value,\n                          p_platform:\n                            \"android\",\n                          p_device_name:\n                            typeof navigator !==\n                            \"undefined\"\n                              ? navigator.userAgent\n                              : null,\n                          p_push_provider:\n                            \"fcm\",\n                          p_app_version:\n                            null,\n                        }\n                      );\n\n                    await successHandle.remove();\n                    await errorHandle.remove();\n\n                    finish(\n                      error\n                        ? \"error\"\n                        : \"registered\"\n                    );\n                  }\n                );\n\n              const errorHandle =\n                await PushNotifications.addListener(\n                  \"registrationError\",\n                  async () => {\n                    window.clearTimeout(\n                      timeout\n                    );\n\n                    await successHandle.remove();\n                    await errorHandle.remove();\n\n                    finish(\n                      \"error\"\n                    );\n                  }\n                );\n\n              try {\n                await PushNotifications.register();\n              } catch {\n                window.clearTimeout(\n                  timeout\n                );\n\n                await successHandle.remove();\n                await errorHandle.remove();\n\n                finish(\n                  \"error\"\n                );\n              }\n            }\n          );\n\n        return result;\n      } catch {\n        return \"error\";\n      } finally {\n        nativeRegistrationPromise =\n          null;\n      }\n    })();\n\n  return nativeRegistrationPromise;\n}\n\nasync function webRegistration(\n  requestPermission: boolean\n): Promise<PushRegistrationResult> {\n  if (\n    typeof window ===\n      \"undefined\" ||\n    !(\"serviceWorker\" in navigator) ||\n    !(\"PushManager\" in window) ||\n    !(\"Notification\" in window)\n  ) {\n    return \"unsupported\";\n  }\n\n  let permission =\n    Notification.permission;\n\n  if (\n    permission !== \"granted\" &&\n    requestPermission\n  ) {\n    permission =\n      await Notification.requestPermission();\n  }\n\n  if (\n    permission !== \"granted\"\n  ) {\n    return permission ===\n      \"denied\"\n      ? \"denied\"\n      : \"granted\";\n  }\n\n  try {\n    await navigator.serviceWorker.register(\n      \"/sw.js\"\n    );\n\n    const registration =\n      await navigator.serviceWorker.ready;\n\n    let subscription =\n      await registration.pushManager.getSubscription();\n\n    if (\n      !subscription\n    ) {\n      const {\n        data,\n        error,\n      } =\n        await supabase.functions.invoke(\n          \"push\",\n          {\n            body: {\n              action:\n                \"vapid_public_key\",\n            },\n          }\n        );\n\n      const publicKey =\n        data?.publicKey;\n\n      if (\n        error ||\n        !publicKey\n      ) {\n        return \"error\";\n      }\n\n      subscription =\n        await registration.pushManager.subscribe(\n          {\n            userVisibleOnly:\n              true,\n            applicationServerKey:\n              base64UrlToUint8Array(\n                String(\n                  publicKey\n                )\n              ),\n          }\n        );\n    }\n\n    const json =\n      subscription.toJSON();\n\n    const endpoint =\n      subscription.endpoint;\n    const p256dh =\n      json.keys?.p256dh;\n    const auth =\n      json.keys?.auth;\n\n    if (\n      !endpoint ||\n      !p256dh ||\n      !auth\n    ) {\n      return \"error\";\n    }\n\n    const {\n      error,\n    } = await supabase.rpc(\n      \"register_web_push_subscription\",\n      {\n        p_endpoint:\n          endpoint,\n        p_p256dh:\n          p256dh,\n        p_auth:\n          auth,\n        p_user_agent:\n          navigator.userAgent,\n      }\n    );\n\n    return error\n      ? \"error\"\n      : \"registered\";\n  } catch {\n    return \"error\";\n  }\n}\n\nexport async function syncPushRegistration(\n  options: {\n    requestPermission?: boolean;\n  } = {}\n): Promise<PushRegistrationResult> {\n  const requestPermission =\n    Boolean(\n      options.requestPermission\n    );\n\n  if (\n    Capacitor.isNativePlatform()\n  ) {\n    return registerNativePush(\n      requestPermission\n    );\n  }\n\n  return webRegistration(\n    requestPermission\n  );\n}\n\nexport async function disableWebPushRegistration() {\n  if (\n    typeof window ===\n      \"undefined\" ||\n    Capacitor.isNativePlatform() ||\n    !(\"serviceWorker\" in navigator) ||\n    !(\"PushManager\" in window)\n  ) {\n    return;\n  }\n\n  try {\n    const registration =\n      await navigator.serviceWorker.ready;\n\n    const subscription =\n      await registration.pushManager.getSubscription();\n\n    if (\n      !subscription\n    ) {\n      return;\n    }\n\n    await supabase.rpc(\n      \"unregister_web_push_subscription\",\n      {\n        p_endpoint:\n          subscription.endpoint,\n      }\n    );\n\n    await subscription.unsubscribe();\n  } catch {}\n}\n\n/* ALUMNI_NOTIFICATIONS_2_0 */\n";

const bootstrap =
  "\"use client\";\n\nimport {\n  useEffect,\n} from \"react\";\nimport { useAuth } from \"@/components/auth/AuthProvider\";\nimport { supabase } from \"@/lib/supabase\";\nimport {\n  syncPushRegistration,\n} from \"@/lib/pushNotifications\";\n\nexport default function PushNotificationBootstrap() {\n  const {\n    user,\n    loading,\n  } = useAuth();\n\n  useEffect(() => {\n    if (\n      loading ||\n      !user\n    ) {\n      return;\n    }\n\n    let active =\n      true;\n\n    void (async () => {\n      const {\n        data,\n      } = await supabase\n        .from(\n          \"notification_preferences\"\n        )\n        .select(\n          \"push_enabled\"\n        )\n        .eq(\n          \"user_id\",\n          user.id\n        )\n        .maybeSingle();\n\n      if (\n        !active ||\n        data?.push_enabled ===\n          false\n      ) {\n        return;\n      }\n\n      await syncPushRegistration({\n        requestPermission:\n          false,\n      });\n    })();\n\n    return () => {\n      active =\n        false;\n    };\n  }, [\n    loading,\n    user?.id,\n  ]);\n\n  return null;\n}\n\n/* ALUMNI_NOTIFICATIONS_2_0 */\n";

const migration = `-- ALUMNI NOTIFICATIONS 2.0
-- La migración alumni_notifications_2_0_preferences
-- ya fue aplicada a producción.
--
-- Alinea alumni_notifications_before_insert()
-- con notification_preferences:
-- push_enabled, messages, story_replies,
-- likes, comments, follows, events.
`;

/* =========================================================
   TSX/TS syntax parse
   ========================================================= */

try {
  const ts =
    require(
      "typescript"
    );

  for (
    const [
      rel,
      content,
      kind,
    ] of [
      [
        NOTIFICATIONS,
        notifications,
        ts.ScriptKind.TSX,
      ],
      [
        APP_SHELL,
        appShell,
        ts.ScriptKind.TSX,
      ],
      [
        PUSH_LIB,
        pushLib,
        ts.ScriptKind.TS,
      ],
      [
        PUSH_BOOTSTRAP,
        bootstrap,
        ts.ScriptKind.TSX,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget
          .Latest,
        true,
        kind
      );

    const diagnostics =
      parsed.parseDiagnostics ||
      [];

    if (
      diagnostics.length
    ) {
      const first =
        diagnostics[0];

      fail(
        `${rel}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: archivos válidos"
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

fs.mkdirSync(
  path.dirname(
    abs(PUSH_LIB)
  ),
  {
    recursive: true,
  }
);

fs.mkdirSync(
  path.dirname(
    abs(PUSH_BOOTSTRAP)
  ),
  {
    recursive: true,
  }
);

fs.mkdirSync(
  path.dirname(
    abs(MIGRATION)
  ),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  abs(NOTIFICATIONS),
  notifications,
  "utf8"
);

fs.writeFileSync(
  abs(APP_SHELL),
  appShell,
  "utf8"
);

fs.writeFileSync(
  abs(PUSH_LIB),
  pushLib,
  "utf8"
);

fs.writeFileSync(
  abs(PUSH_BOOTSTRAP),
  bootstrap,
  "utf8"
);

if (
  !fs.existsSync(
    abs(MIGRATION)
  )
) {
  fs.writeFileSync(
    abs(MIGRATION),
    migration,
    "utf8"
  );
}

console.log("");
console.log(
  "✅ ALUMNI Notifications 2.0 aplicado."
);
console.log(
  "✅ Preferencias corregidas."
);
console.log(
  "✅ Registro Push Android."
);
console.log(
  "✅ Registro Web/PWA Push."
);
console.log(
  "✅ Apertura desde notificación."
);
console.log(
  "✅ Eventos separados en la bandeja."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
