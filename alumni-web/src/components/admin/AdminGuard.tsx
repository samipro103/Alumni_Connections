"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import {
  AdminPermission,
  useAdminAccess,
} from "@/hooks/useAdminAccess";

export default function AdminGuard({
  children,
  permission,
}: {
  children: React.ReactNode;
  permission?: AdminPermission | AdminPermission[];
}) {
  const { access, loading, can } = useAdminAccess();

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-zinc-600">
        Verificando permisos...
      </div>
    );
  }

  const permissions = permission
    ? Array.isArray(permission)
      ? permission
      : [permission]
    : [];

  const hasRequiredPermission =
    permissions.length === 0 || permissions.some((item) => can(item));

  if (!access.is_admin || !hasRequiredPermission) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-5 text-xl font-black text-zinc-200">
          Acceso restringido
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Tu cuenta no tiene el permiso necesario para abrir esta sección.
        </p>
        <Link
          href="/feed"
          className="mt-5 inline-flex rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-black text-zinc-300 transition hover:bg-white/[0.1]"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
