"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

const KEY = "alumni:event-reminders:last-check:v2.1.2";

export default function EventReminderBootstrap() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function check(force = false) {
      if (!active) return;

      try {
        const last = Number(
          localStorage.getItem(KEY) || 0
        );

        if (
          !force &&
          Date.now() - last < 30 * 60 * 1000
        ) {
          return;
        }

        localStorage.setItem(
          KEY,
          String(Date.now())
        );
      } catch {}

      await supabase.rpc(
        "alumni_generate_due_event_reminders"
      );
    }

    function onFocus() {
      void check();
    }

    void check(true);
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id]);

  return null;
}

/* ALUMNI_2_1_2_EVENT_REMINDER_BOOTSTRAP */
