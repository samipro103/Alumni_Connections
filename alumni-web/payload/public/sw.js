const ALUMNI_VERSION =
  "alumni-pwa-2.0.0";

const STATIC_CACHE =
  `${ALUMNI_VERSION}-static`;

const OFFLINE_CACHE =
  `${ALUMNI_VERSION}-offline`;

const PRECACHE = [
  "/offline",
  "/icons/alumni-192.png",
  "/icons/alumni-512.png",
  "/icons/alumni-512-maskable.png",
  "/icons/alumni-badge-96.png",
];

self.addEventListener(
  "install",
  (event) => {
    event.waitUntil(
      (async () => {
        const cache =
          await caches.open(
            OFFLINE_CACHE
          );

        await Promise.all(
          PRECACHE.map(
            async (url) => {
              try {
                await cache.add(
                  url
                );
              } catch {}
            }
          )
        );
      })()
    );
  }
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      (async () => {
        const keys =
          await caches.keys();

        await Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(
                  "alumni-pwa-"
                ) &&
                key !==
                  STATIC_CACHE &&
                key !==
                  OFFLINE_CACHE
            )
            .map(
              (key) =>
                caches.delete(
                  key
                )
            )
        );

        await self.clients.claim();
      })()
    );
  }
);

async function setBadge() {
  try {
    if (
      self.navigator &&
      typeof self.navigator
        .setAppBadge ===
        "function"
    ) {
      await self.navigator
        .setAppBadge(1);
    }
  } catch {}
}

async function clearBadge() {
  try {
    if (
      self.navigator &&
      typeof self.navigator
        .clearAppBadge ===
        "function"
    ) {
      await self.navigator
        .clearAppBadge();
    }
  } catch {}
}

function normalizedPath(
  value
) {
  try {
    const parsed =
      new URL(
        value,
        self.location.origin
      );

    const pathname =
      parsed.pathname
        .replace(
          /\/+$/,
          ""
        ) || "/";

    return pathname;
  } catch {
    return "/";
  }
}

async function targetChatIsVisible(
  relativeUrl
) {
  const target =
    normalizedPath(
      relativeUrl
    );

  if (
    !target.startsWith(
      "/messages/"
    )
  ) {
    return false;
  }

  try {
    const windows =
      await self.clients
        .matchAll({
          type: "window",
          includeUncontrolled:
            true,
        });

    return windows.some(
      (client) => {
        if (
          client.visibilityState !==
          "visible"
        ) {
          return false;
        }

        return (
          normalizedPath(
            client.url
          ) === target
        );
      }
    );
  } catch {
    return false;
  }
}

function canCacheStatic(
  request,
  url
) {
  if (
    request.method !==
      "GET" ||
    url.origin !==
      self.location.origin
  ) {
    return false;
  }

  return (
    url.pathname.startsWith(
      "/_next/static/"
    ) ||
    url.pathname.startsWith(
      "/icons/"
    )
  );
}

async function cacheStatic(
  request
) {
  const cache =
    await caches.open(
      STATIC_CACHE
    );

  const cached =
    await cache.match(
      request
    );

  if (cached) {
    return cached;
  }

  const response =
    await fetch(
      request
    );

  if (
    response &&
    response.ok
  ) {
    try {
      await cache.put(
        request,
        response.clone()
      );
    } catch {}
  }

  return response;
}

async function navigationWithFallback(
  request
) {
  try {
    return await fetch(
      request
    );
  } catch {
    const cache =
      await caches.open(
        OFFLINE_CACHE
      );

    const fallback =
      await cache.match(
        "/offline"
      );

    if (fallback) {
      return fallback;
    }

    return new Response(
      `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Alumni. · Sin conexión</title>
<style>
html,body{margin:0;background:#0b0d12;color:#f4f4f5;font-family:Arial,sans-serif}
main{min-height:100vh;display:flex;flex-direction:column;justify-content:center;max-width:720px;margin:auto;padding:48px 24px;box-sizing:border-box}
small{letter-spacing:.16em;text-transform:uppercase;color:#777;font-weight:800}
h1{font-size:48px;line-height:1;margin:8px 0 16px;letter-spacing:-.05em}
p{color:#999;line-height:1.7}
hr{width:100%;border:0;border-top:1px solid #24262c;margin:24px 0}
button{border:0;background:transparent;color:#9ca6ff;padding:0;font-weight:800}
</style>
</head>
<body>
<main>
<small>Sin conexión</small>
<h1>Alumni sigue aquí.</h1>
<p>No pudimos cargar esta pantalla. Vuelve a intentar cuando tengas internet.</p>
<hr>
<button onclick="location.reload()">Reintentar</button>
</main>
</body>
</html>`,
      {
        headers: {
          "Content-Type":
            "text/html; charset=utf-8",
        },
      }
    );
  }
}

self.addEventListener(
  "fetch",
  (event) => {
    const request =
      event.request;

    if (
      request.method !==
      "GET"
    ) {
      return;
    }

    const url =
      new URL(
        request.url
      );

    if (
      request.mode ===
        "navigate" &&
      url.origin ===
        self.location.origin
    ) {
      event.respondWith(
        navigationWithFallback(
          request
        )
      );
      return;
    }

    if (
      canCacheStatic(
        request,
        url
      )
    ) {
      event.respondWith(
        cacheStatic(
          request
        )
      );
    }
  }
);

self.addEventListener(
  "message",
  (event) => {
    if (
      event.data?.type ===
      "SKIP_WAITING"
    ) {
      self.skipWaiting();
    }

    if (
      event.data?.type ===
      "CLEAR_BADGE"
    ) {
      event.waitUntil(
        clearBadge()
      );
    }
  }
);

self.addEventListener(
  "push",
  (event) => {
    let data = {};

    try {
      data = event.data
        ? event.data.json()
        : {};
    } catch {
      data = {
        title: "Alumni.",
        body: event.data
          ? event.data.text()
          : "Tienes una nueva notificación.",
      };
    }

    const title =
      data.title ||
      "Alumni.";

    const body =
      data.body ||
      "Tienes una nueva notificación.";

    const url =
      typeof data.url ===
        "string" &&
      data.url.startsWith("/")
        ? data.url
        : "/notifications";

    event.waitUntil(
      (async () => {
        /*
         * Preserve 1.3.7 behavior:
         * no duplicate system push when the
         * exact direct/group chat is already visible.
         */
        if (
          await targetChatIsVisible(
            url
          )
        ) {
          return;
        }

        await Promise.all([
          self.registration
            .showNotification(
              title,
              {
                body,
                icon:
                  "/icons/alumni-192.png",
                badge:
                  "/icons/alumni-badge-96.png",
                tag:
                  data.type &&
                  data.target_id
                    ? `alumni-${data.type}-${data.target_id}`
                    : `alumni-${Date.now()}`,
                renotify:
                  false,
                data: {
                  url,
                  type:
                    data.type ||
                    "notification",
                  target_id:
                    data.target_id ||
                    "",
                  version:
                    ALUMNI_VERSION,
                },
              }
            ),
          setBadge(),
        ]);
      })()
    );
  }
);

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const relativeUrl =
      event.notification?.data
        ?.url ||
      "/notifications";

    const destination =
      new URL(
        relativeUrl,
        self.location.origin
      ).href;

    event.waitUntil(
      Promise.all([
        clearBadge(),
        self.clients
          .matchAll({
            type: "window",
            includeUncontrolled:
              true,
          })
          .then(
            async (
              windowClients
            ) => {
              for (
                const client of
                windowClients
              ) {
                if (
                  !client.url.startsWith(
                    self.location
                      .origin
                  )
                ) {
                  continue;
                }

                if (
                  "navigate" in
                  client
                ) {
                  try {
                    await client.navigate(
                      destination
                    );
                  } catch {}
                }

                if (
                  "focus" in
                  client
                ) {
                  return client.focus();
                }
              }

              if (
                self.clients
                  .openWindow
              ) {
                return self.clients.openWindow(
                  destination
                );
              }

              return undefined;
            }
          ),
      ])
    );
  }
);

/*
 * ALUMNI 2.0 caching rules:
 * - Never cache Supabase/API responses.
 * - Never cache authenticated page HTML.
 * - Cache only immutable same-origin Next static assets/icons.
 * - Navigations are always network-first and fall back to /offline.
 * - Push/chat suppression from 1.3.7 is preserved.
 */

/* ALUMNI_2_0_PWA_STABILITY_SERVICE_WORKER */
