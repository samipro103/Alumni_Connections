"use client";

import {
  useEffect,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  syncPushRegistration,
} from "@/lib/pushNotifications";

export default function PushNotificationBootstrap() {
  const {
    user,
    loading,
  } = useAuth();

  useEffect(() => {
    if (
      loading ||
      !user
    ) {
      return;
    }

    let active =
      true;

    void (async () => {
      const {
        data,
      } = await supabase
        .from(
          "notification_preferences"
        )
        .select(
          "push_enabled"
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (
        !active ||
        data?.push_enabled ===
          false
      ) {
        return;
      }

      await syncPushRegistration({
        requestPermission:
          false,
      });
    })();

    return () => {
      active =
        false;
    };
  }, [
    loading,
    user?.id,
  ]);

  return null;
}

/* ALUMNI_NOTIFICATIONS_2_0 */
