"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type PluginListenerHandle,
} from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string | null;
};

const APP_VERSION = "0.1.0-beta";
const CHANNEL_ID = "alumni_activity";

export default function NativePushNotifications({
  userId,
}: Props) {
  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) {
      return;
    }

    let cancelled = false;
    const handles: PluginListenerHandle[] = [];

    async function registerToken(pushToken: string) {
      if (!pushToken || cancelled) return;

      try {
        localStorage.setItem("alumni-push-token", pushToken);

        const platform =
          Capacitor.getPlatform() === "ios" ? "ios" : "android";

        const { error } = await supabase.rpc(
          "register_push_device",
          {
            p_push_token: pushToken,
            p_platform: platform,
            p_device_name:
              platform === "android"
                ? "Alumni Android"
                : "Alumni iPhone",
            p_push_provider:
              platform === "android" ? "fcm" : "apns",
            p_app_version: APP_VERSION,
          }
        );

        if (error) {
          console.error(
            "Could not save push token:",
            error
          );
        }
      } catch (error) {
        console.error("Push token save error:", error);
      }
    }

    async function setup() {
      try {
        if (Capacitor.getPlatform() === "android") {
          await PushNotifications.createChannel({
            id: CHANNEL_ID,
            name: "Actividad de Alumni",
            description:
              "Mensajes, comentarios, likes, historias y conexiones.",
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        }

        handles.push(
          await PushNotifications.addListener(
            "registration",
            (token) => {
              void registerToken(token.value);
            }
          )
        );

        handles.push(
          await PushNotifications.addListener(
            "registrationError",
            (error) => {
              console.error(
                "Native push registration error:",
                error.error
              );
            }
          )
        );

        handles.push(
          await PushNotifications.addListener(
            "pushNotificationReceived",
            (notification) => {
              console.info(
                "Native notification received:",
                notification.id
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

        let permission =
          await PushNotifications.checkPermissions();

        if (
          permission.receive === "prompt" ||
          permission.receive === "prompt-with-rationale"
        ) {
          permission =
            await PushNotifications.requestPermissions();
        }

        if (permission.receive !== "granted") {
          console.info(
            "Push permission not granted:",
            permission.receive
          );
          return;
        }

        await PushNotifications.register();
      } catch (error) {
        console.error(
          "Native push setup failed:",
          error
        );
      }
    }

    void setup();

    return () => {
      cancelled = true;

      handles.forEach((handle) => {
        void handle.remove();
      });
    };
  }, [userId]);

  return null;
}
