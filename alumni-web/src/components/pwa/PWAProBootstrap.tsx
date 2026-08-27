"use client";

import {
  CheckCircle2,
  CloudOff,
  Download,
  RefreshCw,
  Share2,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import WebPushBootstrap from "@/components/pwa/WebPushBootstrap";
import NativePushNotifications from "@/components/mobile/NativePushNotifications";
import styles from "./PWAProBootstrap.module.css";

type ConnectionState =
  | "online"
  | "offline"
  | "restored";

type BadgeNavigator =
  Navigator & {
    setAppBadge?: (
      contents?: number
    ) => Promise<void>;
    clearAppBadge?: () =>
      Promise<void>;
    standalone?: boolean;
  };

type InstallPromptEvent =
  Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome:
        | "accepted"
        | "dismissed";
      platform: string;
    }>;
  };

const INSTALL_DISMISS_KEY =
  "alumni:pwa:install-dismissed:v2";

const CHUNK_RECOVERY_KEY =
  "alumni:pwa:last-chunk-recovery:v2";

function isNativeCapacitor() {
  const value =
    (
      window as typeof window & {
        Capacitor?: {
          isNativePlatform?: () =>
            boolean;
        };
      }
    ).Capacitor;

  return Boolean(
    value?.isNativePlatform?.()
  );
}

function isStandalone() {
  const nav =
    navigator as BadgeNavigator;

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    Boolean(nav.standalone)
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(
    navigator.userAgent
  );
}

function isConversationPath() {
  const path =
    window.location.pathname;

  return (
    path.startsWith(
      "/messages/"
    ) &&
    path !== "/messages"
  );
}

function appHasProtectedWork() {
  return (
    isConversationPath() ||
    Boolean(
      document.querySelector(
        [
          '[data-pull-refresh-lock="true"]',
          '[role="dialog"]',
          ".alumni-story-viewer",
          ".alumni-story-composer-shell",
        ].join(",")
      )
    )
  );
}

function installPromptDismissedRecently() {
  try {
    const value = Number(
      localStorage.getItem(
        INSTALL_DISMISS_KEY
      ) || 0
    );

    return (
      Number.isFinite(value) &&
      Date.now() - value <
        14 *
          24 *
          60 *
          60 *
          1000
    );
  } catch {
    return false;
  }
}

function isChunkFailure(
  value: unknown
) {
  const text =
    value instanceof Error
      ? `${value.name} ${value.message}`
      : String(value || "");

  return [
    "ChunkLoadError",
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    "Importing a module script failed",
    "Failed to load module script",
  ].some((needle) =>
    text
      .toLowerCase()
      .includes(
        needle.toLowerCase()
      )
  );
}

export default function PWAProBootstrap() {
  const { user } =
    useAuth();

  const [
    connection,
    setConnection,
  ] =
    useState<ConnectionState>(
      "online"
    );

  const [
    updateReady,
    setUpdateReady,
  ] =
    useState(false);

  const [
    installEvent,
    setInstallEvent,
  ] =
    useState<
      InstallPromptEvent | null
    >(null);

  const [
    showIOSInstall,
    setShowIOSInstall,
  ] =
    useState(false);

  const restoredTimer =
    useRef<number | null>(
      null
    );

  const registrationRef =
    useRef<
      ServiceWorkerRegistration | null
    >(null);

  useEffect(() => {
    setConnection(
      navigator.onLine
        ? "online"
        : "offline"
    );

    function onOffline() {
      if (
        restoredTimer.current !==
        null
      ) {
        window.clearTimeout(
          restoredTimer.current
        );
      }

      setConnection(
        "offline"
      );
    }

    function onOnline() {
      setConnection(
        "restored"
      );

      if (
        restoredTimer.current !==
        null
      ) {
        window.clearTimeout(
          restoredTimer.current
        );
      }

      restoredTimer.current =
        window.setTimeout(
          () => {
            setConnection(
              "online"
            );
          },
          2100
        );
    }

    window.addEventListener(
      "offline",
      onOffline
    );

    window.addEventListener(
      "online",
      onOnline
    );

    return () => {
      window.removeEventListener(
        "offline",
        onOffline
      );

      window.removeEventListener(
        "online",
        onOnline
      );

      if (
        restoredTimer.current !==
        null
      ) {
        window.clearTimeout(
          restoredTimer.current
        );
      }
    };
  }, []);

  useEffect(() => {
    const badgeNavigator =
      navigator as BadgeNavigator;

    async function clearBadge() {
      try {
        await badgeNavigator
          .clearAppBadge?.();
      } catch {}
    }

    function onVisible() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void clearBadge();
      }
    }

    window.addEventListener(
      "focus",
      clearBadge
    );

    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    void clearBadge();

    return () => {
      window.removeEventListener(
        "focus",
        clearBadge
      );

      document.removeEventListener(
        "visibilitychange",
        onVisible
      );
    };
  }, []);

  useEffect(() => {
    if (
      isNativeCapacitor() ||
      isStandalone()
    ) {
      return;
    }

    function onBeforeInstall(
      event: Event
    ) {
      event.preventDefault();

      if (
        installPromptDismissedRecently()
      ) {
        return;
      }

      setInstallEvent(
        event as InstallPromptEvent
      );
    }

    function onInstalled() {
      setInstallEvent(null);
      setShowIOSInstall(false);

      try {
        localStorage.removeItem(
          INSTALL_DISMISS_KEY
        );
      } catch {}
    }

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall
    );

    window.addEventListener(
      "appinstalled",
      onInstalled
    );

    let iosTimer:
      | number
      | null = null;

    if (
      isIOS() &&
      !installPromptDismissedRecently()
    ) {
      iosTimer =
        window.setTimeout(
          () => {
            setShowIOSInstall(
              true
            );
          },
          3200
        );
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall
      );

      window.removeEventListener(
        "appinstalled",
        onInstalled
      );

      if (iosTimer !== null) {
        window.clearTimeout(
          iosTimer
        );
      }
    };
  }, []);

  useEffect(() => {
    if (
      !(
        "serviceWorker" in
        navigator
      ) ||
      isNativeCapacitor()
    ) {
      return;
    }

    let disposed = false;
    let reloadScheduled =
      false;
    let lastUpdateCheck = 0;

    const hadController =
      Boolean(
        navigator
          .serviceWorker
          .controller
      );

    function reloadForUpdate() {
      if (
        reloadScheduled ||
        disposed
      ) {
        return;
      }

      reloadScheduled = true;
      window.location.reload();
    }

    function activateWorker(
      worker:
        | ServiceWorker
        | null
        | undefined
    ) {
      if (!worker) return;

      if (
        hadController &&
        appHasProtectedWork()
      ) {
        setUpdateReady(true);
        return;
      }

      worker.postMessage({
        type: "SKIP_WAITING",
      });
    }

    function onControllerChange() {
      if (
        disposed ||
        !hadController
      ) {
        return;
      }

      if (
        appHasProtectedWork()
      ) {
        setUpdateReady(true);
        return;
      }

      reloadForUpdate();
    }

    async function checkUpdate(
      force = false
    ) {
      const registration =
        registrationRef.current;

      if (
        !registration ||
        disposed
      ) {
        return;
      }

      const now =
        Date.now();

      if (
        !force &&
        now - lastUpdateCheck <
          60_000
      ) {
        return;
      }

      lastUpdateCheck = now;

      try {
        await registration.update();

        if (
          registration.waiting
        ) {
          activateWorker(
            registration.waiting
          );
        }
      } catch {}
    }

    async function prepare() {
      try {
        const registration =
          await navigator
            .serviceWorker
            .register(
              "/sw.js",
              {
                scope: "/",
                updateViaCache:
                  "none",
              }
            );

        if (disposed) {
          return;
        }

        registrationRef.current =
          registration;

        if (
          registration.waiting
        ) {
          activateWorker(
            registration.waiting
          );
        }

        registration.addEventListener(
          "updatefound",
          () => {
            const worker =
              registration
                .installing;

            if (!worker) {
              return;
            }

            worker.addEventListener(
              "statechange",
              () => {
                if (
                  worker.state ===
                  "installed"
                ) {
                  activateWorker(
                    worker
                  );
                }
              }
            );
          }
        );

        void checkUpdate(
          true
        );
      } catch (error) {
        console.warn(
          "[Alumni PWA] Service worker:",
          error
        );
      }
    }

    function onFocus() {
      void checkUpdate();
    }

    function onVisibility() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void checkUpdate();
      }
    }

    async function recoverChunk(
      failure: unknown
    ) {
      if (
        !navigator.onLine ||
        !isChunkFailure(
          failure
        )
      ) {
        return;
      }

      if (
        appHasProtectedWork()
      ) {
        setUpdateReady(true);
        return;
      }

      try {
        const previous = Number(
          sessionStorage.getItem(
            CHUNK_RECOVERY_KEY
          ) || 0
        );

        if (
          Date.now() -
            previous <
          5 * 60 * 1000
        ) {
          return;
        }

        sessionStorage.setItem(
          CHUNK_RECOVERY_KEY,
          String(Date.now())
        );
      } catch {}

      await checkUpdate(
        true
      );

      reloadForUpdate();
    }

    function onWindowError(
      event: ErrorEvent
    ) {
      void recoverChunk(
        event.error ||
          event.message
      );
    }

    function onUnhandled(
      event:
        PromiseRejectionEvent
    ) {
      void recoverChunk(
        event.reason
      );
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange
    );

    window.addEventListener(
      "focus",
      onFocus
    );

    document.addEventListener(
      "visibilitychange",
      onVisibility
    );

    window.addEventListener(
      "error",
      onWindowError
    );

    window.addEventListener(
      "unhandledrejection",
      onUnhandled
    );

    void prepare();

    return () => {
      disposed = true;

      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange
      );

      window.removeEventListener(
        "focus",
        onFocus
      );

      document.removeEventListener(
        "visibilitychange",
        onVisibility
      );

      window.removeEventListener(
        "error",
        onWindowError
      );

      window.removeEventListener(
        "unhandledrejection",
        onUnhandled
      );
    };
  }, []);

  function dismissInstall() {
    setInstallEvent(null);
    setShowIOSInstall(
      false
    );

    try {
      localStorage.setItem(
        INSTALL_DISMISS_KEY,
        String(Date.now())
      );
    } catch {}
  }

  async function installApp() {
    if (!installEvent) {
      return;
    }

    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } finally {
      setInstallEvent(null);
    }
  }

  async function applyUpdate() {
    const waiting =
      registrationRef.current
        ?.waiting;

    if (waiting) {
      waiting.postMessage({
        type: "SKIP_WAITING",
      });
      return;
    }

    window.location.reload();
  }

  const showInstall =
    Boolean(user) &&
    connection === "online" &&
    !updateReady &&
    !isStandalone() &&
    Boolean(
      installEvent ||
        showIOSInstall
    );

  return (
    <>
      <WebPushBootstrap
        userId={
          user?.id || null
        }
      />

      <NativePushNotifications
        userId={
          user?.id || null
        }
      />

      {connection !==
        "online" && (
        <div
          className={
            styles.statusStrip
          }
          data-tone={
            connection
          }
        >
          <div
            className={
              styles.statusInner
            }
          >
            {connection ===
            "offline" ? (
              <>
                <CloudOff
                  size={15}
                />
                <strong>
                  Sin conexión
                </strong>
                <span>
                  Puedes seguir viendo la interfaz; los cambios que requieren internet esperarán a que vuelvas.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2
                  size={15}
                />
                <strong>
                  Conexión restablecida
                </strong>
                <span>
                  Alumni volvió a estar en línea.
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {updateReady &&
        connection ===
          "online" && (
          <div
            className={
              styles.statusStrip
            }
          >
            <div
              className={
                styles.statusInner
              }
            >
              <RefreshCw
                size={15}
              />

              <strong>
                Actualización lista
              </strong>

              <span>
                Alumni esperó para no interrumpir lo que estabas haciendo.
              </span>

              <button
                type="button"
                onClick={() =>
                  void applyUpdate()
                }
              >
                Actualizar
              </button>
            </div>
          </div>
        )}

      {showInstall &&
        connection ===
          "online" &&
        !updateReady && (
          <div
            className={
              styles.statusStrip
            }
          >
            <div
              className={
                styles.statusInner
              }
            >
              {showIOSInstall ? (
                <Share2
                  size={15}
                />
              ) : (
                <Download
                  size={15}
                />
              )}

              <strong>
                Instala Alumni.
              </strong>

              <span>
                {showIOSInstall
                  ? "En Safari: Compartir → Añadir a pantalla de inicio."
                  : "Ábrelo como una app, con acceso directo desde tu dispositivo."}
              </span>

              {installEvent && (
                <button
                  type="button"
                  onClick={() =>
                    void installApp()
                  }
                >
                  Instalar
                </button>
              )}

              <button
                type="button"
                onClick={
                  dismissInstall
                }
                className={
                  styles.dismiss
                }
                aria-label="Ocultar"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
    </>
  );
}

/* ALUMNI_2_0_PWA_STABILITY_BOOTSTRAP */
