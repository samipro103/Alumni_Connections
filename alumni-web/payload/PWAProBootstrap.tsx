"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import WebPushBootstrap from "@/components/pwa/WebPushBootstrap";
import NativePushNotifications from "@/components/mobile/NativePushNotifications";

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
  };

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

function appHasProtectedWork() {
  return Boolean(
    document.querySelector(
      [
        '[data-pull-refresh-lock="true"]',
        '[role="dialog"]',
        ".alumni-story-viewer",
        ".alumni-story-composer-shell",
      ].join(",")
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
  ] = useState(false);

  const restoredTimer =
    useRef<number | null>(
      null
    );

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
      !(
        "serviceWorker" in
        navigator
      ) ||
      isNativeCapacitor()
    ) {
      return;
    }

    let disposed = false;
    let registration:
      | ServiceWorkerRegistration
      | null = null;

    /*
      Si ya existía controller antes de registrar,
      controllerchange sí significa que llegó una
      versión nueva. En la primera instalación no
      hacemos reload.
    */
    const hadController =
      Boolean(
        navigator
          .serviceWorker
          .controller
      );

    let reloadScheduled =
      false;

    function reloadForUpdate() {
      if (reloadScheduled) {
        return;
      }

      reloadScheduled =
        true;

      window.location.reload();
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

    async function checkUpdate() {
      if (
        !registration ||
        disposed
      ) {
        return;
      }

      try {
        await registration.update();
      } catch {}
    }

    async function prepare() {
      try {
        registration =
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

        void checkUpdate();

        registration.addEventListener(
          "updatefound",
          () => {
            const worker =
              registration
                ?.installing;

            if (!worker) {
              return;
            }

            worker.addEventListener(
              "statechange",
              () => {
                if (
                  worker.state ===
                    "installed" &&
                  navigator
                    .serviceWorker
                    .controller
                ) {
                  worker.postMessage(
                    {
                      type:
                        "SKIP_WAITING",
                    }
                  );
                }
              }
            );
          }
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
    };
  }, []);

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
        <div className="pointer-events-none fixed inset-x-3 bottom-[92px] z-[96] mx-auto flex max-w-[460px] justify-center lg:bottom-5">
          <div className="flex min-h-10 items-center gap-2.5 rounded-full border border-white/[0.09] bg-[#0d1119]/94 px-4 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 shadow-[0_12px_38px_rgba(0,0,0,.32)] backdrop-blur-2xl">
            {connection ===
            "offline" ? (
              <>
                <CloudOff
                  size={14}
                  className="text-amber-300/80"
                />
                Sin conexión
              </>
            ) : (
              <>
                <CheckCircle2
                  size={14}
                  className="text-emerald-300/80"
                />
                Conexión restablecida
              </>
            )}
          </div>
        </div>
      )}

      {updateReady && (
        <div className="fixed inset-x-3 bottom-[92px] z-[97] mx-auto max-w-[520px] lg:bottom-5">
          <div className="flex items-center gap-3 rounded-[18px] border border-white/[0.10] bg-[#0d1119]/96 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,.40)] backdrop-blur-2xl">
            <RefreshCw
              size={16}
              className="shrink-0 text-[#9ca6ff]"
            />

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-white">
                Actualización lista
              </p>

              <p className="mt-0.5 text-[10px] text-white/40">
                Alumni esperó para no perder lo que estabas haciendo.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="shrink-0 text-[10px] font-black uppercase tracking-[0.08em] text-[#aeb6ff]"
            >
              Actualizar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
