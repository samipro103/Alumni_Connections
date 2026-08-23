"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string | null;
};

type ListenerHandle = {
  remove: () => Promise<void>;
};

const APP_VERSION = "0.1.0-beta";
const CHANNEL_ID = "alumni_activity";

function setDebugStatus(value: string) {
  try {
    localStorage.setItem(
      "alumni-push-debug",
      `${new Date().toISOString()} | ${value}`
    );
  } catch {}

  console.info("[Alumni Push]", value);
}

export default function NativePushNotifications({
  userId,
}: Props) {
  useEffect(() => {
    if (!userId) return;

    if (!Capacitor.isNativePlatform()) {
      setDebugStatus("web: no native platform");
      return;
    }

    if (!Capacitor.isPluginAvailable("PushNotifications")) {
      setDebugStatus(
        "ERROR: PushNotifications native plugin is not installed in this APK"
      );
      return;
    }

    let cancelled = false;
    const handles: ListenerHandle[] = [];
    const timers: number[] = [];

    async function saveToken(pushToken: string) {
      if (!pushToken || cancelled) return;

      setDebugStatus(
        `token received (${pushToken.length} chars)`
      );

      try {
        localStorage.setItem(
          "alumni-push-token",
          pushToken
        );
      } catch {}

      const platform =
        Capacitor.getPlatform() === "ios"
          ? "ios"
          : "android";

      const payload = {
        user_id: userId,
        platform,
        device_name:
          platform === "android"
            ? "Alumni Android"
            : "Alumni iPhone",
        push_provider:
          platform === "android" ? "fcm" : "apns",
        push_token: pushToken,
        app_version: APP_VERSION,
        active: true,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: rpcError } =
        await supabase.rpc(
          "register_push_device",
          {
            p_push_token: pushToken,
            p_platform: platform,
            p_device_name:
              payload.device_name,
            p_push_provider:
              payload.push_provider,
            p_app_version: APP_VERSION,
          }
        );

      if (!rpcError) {
        setDebugStatus(
          "token saved with register_push_device"
        );
        return;
      }

      console.warn(
        "[Alumni Push] RPC failed, using direct RLS upsert:",
        rpcError
      );

      const { error: upsertError } =
        await supabase
          .from("user_devices")
          .upsert(
            payload,
            {
              onConflict:
                "user_id,push_token",
            }
          );

      if (upsertError) {
        setDebugStatus(
          `ERROR saving token: ${upsertError.message}`
        );
        console.error(
          "[Alumni Push] Direct token save failed:",
          upsertError
        );
        return;
      }

      setDebugStatus(
        "token saved with direct upsert fallback"
      );
    }

    async function registerNow(
      reason: string
    ) {
      if (cancelled) return;

      try {
        setDebugStatus(
          `register() requested: ${reason}`
        );
        await PushNotifications.register();
      } catch (error: any) {
        const message =
          error?.message ||
          error?.error ||
          String(error);

        setDebugStatus(
          `ERROR register(): ${message}`
        );
        console.error(
          "[Alumni Push] register failed:",
          error
        );
      }
    }

    async function setup() {
      try {
        setDebugStatus(
          `native platform: ${Capacitor.getPlatform()}`
        );

        handles.push(
          await PushNotifications.addListener(
            "registration",
            (token) => {
              void saveToken(token.value);
            }
          )
        );

        handles.push(
          await PushNotifications.addListener(
            "registrationError",
            (error) => {
              const message =
                error?.error ||
                "unknown registration error";

              setDebugStatus(
                `FCM registration error: ${message}`
              );
              console.error(
                "[Alumni Push] registrationError:",
                error
              );
            }
          )
        );

        handles.push(
          await PushNotifications.addListener(
            "pushNotificationReceived",
            (notification) => {
              setDebugStatus(
                `push received: ${notification.id || "no-id"}`
              );
            }
          )
        );

        handles.push(
          await PushNotifications.addListener(
            "pushNotificationActionPerformed",
            (action) => {
              const url =
                action.notification?.data?.url;

              if (
                typeof url === "string" &&
                url.startsWith("/")
              ) {
                window.setTimeout(() => {
                  window.location.assign(
                    `${window.location.origin}${url}`
                  );
                }, 40);
              }
            }
          )
        );

        if (
          Capacitor.getPlatform() ===
          "android"
        ) {
          await PushNotifications.createChannel(
            {
              id: CHANNEL_ID,
              name: "Actividad de Alumni",
              description:
                "Mensajes, comentarios, likes, historias y conexiones.",
              importance: 5,
              visibility: 1,
              vibration: true,
            }
          );
        }

        let permission =
          await PushNotifications.checkPermissions();

        setDebugStatus(
          `permission: ${permission.receive}`
        );

        if (
          permission.receive === "prompt" ||
          permission.receive ===
            "prompt-with-rationale"
        ) {
          permission =
            await PushNotifications.requestPermissions();

          setDebugStatus(
            `permission after request: ${permission.receive}`
          );
        }

        if (
          permission.receive !== "granted"
        ) {
          setDebugStatus(
            "ERROR: notification permission not granted"
          );
          return;
        }

        await registerNow("startup");

        timers.push(
          window.setTimeout(
            () =>
              void registerNow(
                "startup retry 1"
              ),
            1500
          )
        );

        timers.push(
          window.setTimeout(
            () =>
              void registerNow(
                "startup retry 2"
              ),
            5000
          )
        );
      } catch (error: any) {
        const message =
          error?.message || String(error);

        setDebugStatus(
          `ERROR setup: ${message}`
        );
        console.error(
          "[Alumni Push] setup failed:",
          error
        );
      }
    }

    function onVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void registerNow(
          "app became visible"
        );
      }
    }

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    void setup();

    return () => {
      cancelled = true;

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      timers.forEach((timer) =>
        window.clearTimeout(timer)
      );

      handles.forEach((handle) => {
        void handle.remove();
      });
    };
  }, [userId]);

  return null;
}
