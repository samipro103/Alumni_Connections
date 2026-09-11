"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import AdminGuard from "./AdminGuard";
import {
  AdminPermission,
  useAdminAccess,
} from "@/hooks/useAdminAccess";

function permissionForPath(
  pathname: string
): AdminPermission | AdminPermission[] | undefined {
  if (pathname.startsWith("/admin/feedback")) return "manage_feedback";
  if (pathname.startsWith("/admin/users"))
    return ["manage_users", "manage_admins"];
  if (pathname.startsWith("/admin/events")) return "manage_events";
  if (pathname.startsWith("/admin/posts")) return "manage_posts";
  if (pathname.startsWith("/admin/stats")) return "view_stats";
  return undefined;
}

export default function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  const { access, can } = useAdminAccess();
  const requiredPermission = permissionForPath(pathname);

  const links = [
    {
      href: "/admin",
      label: "Resumen",
      icon: LayoutDashboard,
      visible: access.is_admin,
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      icon: MessageSquareWarning,
      visible: can("manage_feedback"),
    },
    {
      href: "/admin/users",
      label: "Usuarios",
      icon: Users,
      visible: can("manage_users") || can("manage_admins"),
    },
    {
      href: "/admin/events",
      label: "Eventos",
      icon: CalendarDays,
      visible: can("manage_events"),
    },
    {
      href: "/admin/posts",
      label: "Publicaciones",
      icon: FileText,
      visible: can("manage_posts"),
    },
    {
      href: "/admin/stats",
      label: "Estadísticas",
      icon: BarChart3,
      visible: can("view_stats"),
    },
  ].filter((item) => item.visible);

  return (
    <AppShell>
      <AdminGuard permission={requiredPermission}>
        <div className="mx-auto w-full max-w-[1080px]">
          <div className="mb-6 pt-2">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#8d98ff]">
              Administración
            </p>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          </div>

          <nav className="scrollbar-thin mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-3">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                    active
                      ? "bg-white/[0.06] text-zinc-200"
                      : "text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-200"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </AdminGuard>
    </AppShell>
  );
}
