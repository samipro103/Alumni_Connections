const ALUMNI_VERSION =
  "alumni-pwa-1.1.0-d";

self.addEventListener(
  "install",
  () => self.skipWaiting()
);

self.addEventListener(
  "activate",
  (event) => {
    event.waitUntil(
      self.clients.claim()
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
      Promise.all([
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
              renotify: false,
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
      ])
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
  Intencionalmente NO existe fetch cache.
  Alumni siempre pide los bundles/páginas
  actuales y evita quedarse atrapada en
  una versión vieja de la aplicación.
*/
