const ALUMNI_VERSION =
  "alumni-pwa-1.3.7";

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
         * If Alumni is visible in the exact
         * conversation receiving this message,
         * the chat itself is the notification.
         * Do not duplicate it with a system push.
         *
         * If Alumni is hidden/backgrounded OR the
         * user is somewhere else in the app, push
         * works normally.
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
  No fetch cache on purpose.
  Alumni always requests current bundles/pages.
*/
