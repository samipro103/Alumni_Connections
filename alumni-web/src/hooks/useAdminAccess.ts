"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AdminPermission =
  | "manage_feedback"
  | "manage_users"
  | "manage_posts"
  | "manage_events"
  | "view_stats"
  | "manage_admins";

export type AdminAccess = {
  is_admin: boolean;
  manage_feedback: boolean;
  manage_users: boolean;
  manage_posts: boolean;
  manage_events: boolean;
  view_stats: boolean;
  manage_admins: boolean;
};

const EMPTY_ACCESS: AdminAccess = {
  is_admin: false,
  manage_feedback: false,
  manage_users: false,
  manage_posts: false,
  manage_events: false,
  view_stats: false,
  manage_admins: false,
};

export function useAdminAccess() {
  const [access, setAccess] = useState<AdminAccess>(EMPTY_ACCESS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setAccess(EMPTY_ACCESS);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_my_admin_access");

    if (error) {
      console.error("No se pudieron cargar permisos administrativos:", error);
      setAccess(EMPTY_ACCESS);
    } else {
      setAccess({
        ...EMPTY_ACCESS,
        ...((data || {}) as Partial<AdminAccess>),
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function can(permission: AdminPermission) {
    return access.is_admin && Boolean(access[permission]);
  }

  return { access, loading, can, refresh };
}
