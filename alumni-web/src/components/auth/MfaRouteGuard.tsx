"use client";

import {
  useEffect,
} from "react";
import {
  usePathname,
} from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getMfaState,
} from "@/lib/mfa";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/mfa/setup",
]);

export default function MfaRouteGuard() {
  const pathname =
    usePathname();

  useEffect(() => {
    if (
      PUBLIC_PATHS.has(
        pathname
      )
    ) {
      return;
    }

    let cancelled =
      false;

    void (async () => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (
        !session ||
        cancelled
      ) {
        return;
      }

      const state =
        await getMfaState();

      if (
        cancelled ||
        !state.required
      ) {
        return;
      }

      if (
        !state.hasVerifiedFactor
      ) {
        window.location.href =
          "/mfa/setup";
        return;
      }

      if (
        state.currentLevel !==
        "aal2"
      ) {
        await supabase.auth.signOut();
        window.location.href =
          "/login?mfa=1";
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
