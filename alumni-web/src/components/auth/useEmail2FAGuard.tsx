"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function useEmail2FAGuard() {
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      if (loading) return;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase.rpc("alumni_email_2fa_status");

      if (!active) return;

      if (error) {
        console.error("Email 2FA guard:", error);
        await supabase.auth.signOut({ scope: "local" });
        window.location.href = "/login";
        return;
      }

      const status = Array.isArray(data) ? data[0] : data;

      if (status?.required === true && status?.verified !== true) {
        await supabase.auth.signOut({ scope: "local" });
        window.location.href = "/login?security=1";
        return;
      }

      setReady(true);
    }

    void check();

    return () => {
      active = false;
    };
  }, [user?.id, loading]);

  return ready;
}

/* ALUMNI_2_4_0_EMAIL_2FA_GUARD */
