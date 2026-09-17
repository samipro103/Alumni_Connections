"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

export type AdminPermission =
  | "manage_feedback"
  | "manage_users"
  | "manage_posts"
  | "manage_events"
  | "view_stats"
  | "manage_admins"
  | "manage_moderation"
  | "manage_verifications";

export type AdminAccess = {
  is_admin: boolean;
  manage_feedback: boolean;
  manage_users: boolean;
  manage_posts: boolean;
  manage_events: boolean;
  view_stats: boolean;
  manage_admins: boolean;
  manage_moderation: boolean;
  manage_verifications: boolean;
};

const EMPTY_ACCESS: AdminAccess = {
  is_admin: false,
  manage_feedback: false,
  manage_users: false,
  manage_posts: false,
  manage_events: false,
  view_stats: false,
  manage_admins: false,
  manage_moderation: false,
  manage_verifications: false,
};

async function loadAdminAccess(): Promise<AdminAccess> {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session?.user) {
    return EMPTY_ACCESS;
  }

  const { data, error } =
    await supabase.rpc(
      "get_my_admin_access"
    );

  if (error) {
    console.error(
      "No se pudieron cargar permisos administrativos:",
      error
    );

    return EMPTY_ACCESS;
  }

  return {
    ...EMPTY_ACCESS,
    ...((data || {}) as Partial<AdminAccess>),
  };
}

export function useAdminAccess() {
  const [access, setAccess] =
    useState<AdminAccess>(
      EMPTY_ACCESS
    );

  const [loading, setLoading] =
    useState(true);

  const refresh = useCallback(
    async () => {
      setLoading(true);

      const nextAccess =
        await loadAdminAccess();

      setAccess(nextAccess);
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    let active = true;

    void loadAdminAccess().then(
      (nextAccess) => {
        if (!active) return;

        setAccess(nextAccess);
        setLoading(false);
      }
    );

    return () => {
      active = false;
    };
  }, []);

  function can(
    permission: AdminPermission
  ) {
    return (
      access.is_admin &&
      Boolean(
        access[permission]
      )
    );
  }

  return {
    access,
    loading,
    can,
    refresh,
  };
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */