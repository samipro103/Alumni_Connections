"use client";

import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

export type PushRegistrationResult =
  | "registered"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

let nativeListenersBound = false;
let nativeRegistrationPromise:
  | Promise<PushRegistrationResult>
  | null = null;

function safeRelativeUrl(
  value: unknown
) {
  const url =
    typeof value === "string"
      ? value.trim()
      : "";

  if (
    !url ||
    !url.startsWith("/") ||
    url.startsWith("//")
  ) {
    return null;
  }

  return url;
}

function base64UrlToUint8Array(
  value: string
) {
  const padding =
    "=".repeat(
      (4 - (value.length % 4)) % 4
    );
  const base64 =
    (value + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const raw =
    window.atob(base64);

  return Uint8Array.from(
    raw,
    (char) =>
      char.charCodeAt(0)
  );
}

async function registerNativePush(
  requestPermission: boolean
): Promise<PushRegistrationResult> {
  if (
    !Capacitor.isNativePlatform()
  ) {
    return "unsupported";
  }

  if (nativeRegistrationPromise) {
    return nativeRegistrationPromise;
  }

  nativeRegistrationPromise =
    (async () => {
      try {
        const {
          PushNotifications,
        } = await import(
          "@capacitor/push-notifications"
        );

        let permission =
          await PushNotifications.checkPermissions();

        if (
          permission.receive !==
            "granted" &&
          requestPermission
        ) {
          permission =
            await PushNotifications.requestPermissions();
        }

        if (
          permission.receive !==
          "granted"
        ) {
          return requestPermission
            ? "denied"
            : "granted";
        }

        if (
          !nativeListenersBound
        ) {
          nativeListenersBound =
            true;

          await PushNotifications.addListener(
            "pushNotificationActionPerformed",
            (event) => {
              const url =
                safeRelativeUrl(
                  event.notification
                    ?.data?.url
                );

              if (
                url &&
                typeof window !==
                  "undefined"
              ) {
                window.location.assign(
                  url
                );
              }
            }
          );
        }

        const result =
          await new Promise<PushRegistrationResult>(
            async (
              resolve
            ) => {
              let settled =
                false;

              const finish = (
                value: PushRegistrationResult
              ) => {
                if (
                  settled
                ) {
                  return;
                }

                settled =
                  true;
                resolve(
                  value
                );
              };

              const timeout =
                window.setTimeout(
                  () =>
                    finish(
                      "error"
                    ),
                  9000
                );

              const successHandle =
                await PushNotifications.addListener(
                  "registration",
                  async (
                    token
                  ) => {
                    window.clearTimeout(
                      timeout
                    );

                    const {
                      error,
                    } =
                      await supabase.rpc(
                        "register_push_device",
                        {
                          p_push_token:
                            token.value,
                          p_platform:
                            "android",
                          p_device_name:
                            typeof navigator !==
                            "undefined"
                              ? navigator.userAgent
                              : null,
                          p_push_provider:
                            "fcm",
                          p_app_version:
                            null,
                        }
                      );

                    await successHandle.remove();
                    await errorHandle.remove();

                    finish(
                      error
                        ? "error"
                        : "registered"
                    );
                  }
                );

              const errorHandle =
                await PushNotifications.addListener(
                  "registrationError",
                  async () => {
                    window.clearTimeout(
                      timeout
                    );

                    await successHandle.remove();
                    await errorHandle.remove();

                    finish(
                      "error"
                    );
                  }
                );

              try {
                await PushNotifications.register();
              } catch {
                window.clearTimeout(
                  timeout
                );

                await successHandle.remove();
                await errorHandle.remove();

                finish(
                  "error"
                );
              }
            }
          );

        return result;
      } catch {
        return "error";
      } finally {
        nativeRegistrationPromise =
          null;
      }
    })();

  return nativeRegistrationPromise;
}

async function webRegistration(
  requestPermission: boolean
): Promise<PushRegistrationResult> {
  if (
    typeof window ===
      "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }

  let permission =
    Notification.permission;

  if (
    permission !== "granted" &&
    requestPermission
  ) {
    permission =
      await Notification.requestPermission();
  }

  if (
    permission !== "granted"
  ) {
    return permission ===
      "denied"
      ? "denied"
      : "granted";
  }

  try {
    await navigator.serviceWorker.register(
      "/sw.js"
    );

    const registration =
      await navigator.serviceWorker.ready;

    let subscription =
      await registration.pushManager.getSubscription();

    if (
      !subscription
    ) {
      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          "push",
          {
            body: {
              action:
                "vapid_public_key",
            },
          }
        );

      const publicKey =
        data?.publicKey;

      if (
        error ||
        !publicKey
      ) {
        return "error";
      }

      subscription =
        await registration.pushManager.subscribe(
          {
            userVisibleOnly:
              true,
            applicationServerKey:
              base64UrlToUint8Array(
                String(
                  publicKey
                )
              ),
          }
        );
    }

    const json =
      subscription.toJSON();

    const endpoint =
      subscription.endpoint;
    const p256dh =
      json.keys?.p256dh;
    const auth =
      json.keys?.auth;

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return "error";
    }

    const {
      error,
    } = await supabase.rpc(
      "register_web_push_subscription",
      {
        p_endpoint:
          endpoint,
        p_p256dh:
          p256dh,
        p_auth:
          auth,
        p_user_agent:
          navigator.userAgent,
      }
    );

    return error
      ? "error"
      : "registered";
  } catch {
    return "error";
  }
}

export async function syncPushRegistration(
  options: {
    requestPermission?: boolean;
  } = {}
): Promise<PushRegistrationResult> {
  const requestPermission =
    Boolean(
      options.requestPermission
    );

  if (
    Capacitor.isNativePlatform()
  ) {
    return registerNativePush(
      requestPermission
    );
  }

  return webRegistration(
    requestPermission
  );
}

export async function disableWebPushRegistration() {
  if (
    typeof window ===
      "undefined" ||
    Capacitor.isNativePlatform() ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (
      !subscription
    ) {
      return;
    }

    await supabase.rpc(
      "unregister_web_push_subscription",
      {
        p_endpoint:
          subscription.endpoint,
      }
    );

    await subscription.unsubscribe();
  } catch {}
}

/* ALUMNI_NOTIFICATIONS_2_0 */
