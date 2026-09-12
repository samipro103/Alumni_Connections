"use client";

import Link from "next/link";
import {
  usePathname,
} from "next/navigation";
import {
  Activity,
  BarChart3,
  BadgeCheck,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageSquareWarning,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
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
):
  | AdminPermission
  | AdminPermission[]
  | undefined {
  if (
    pathname.startsWith(
      "/admin/feedback"
    )
  ) {
    return "manage_feedback";
  }

  if (
    pathname.startsWith(
      "/admin/users"
    )
  ) {
    return [
      "manage_users",
      "manage_admins",
      "manage_moderation",
      "manage_verifications",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/events"
    )
  ) {
    return "manage_events";
  }

  if (
    pathname.startsWith(
      "/admin/posts"
    ) ||
    pathname.startsWith(
      "/admin/comments"
    )
  ) {
    return [
      "manage_posts",
      "manage_moderation",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/reports"
    )
  ) {
    return [
      "manage_feedback",
      "manage_moderation",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/spam"
    )
  ) {
    return [
      "manage_moderation",
      "manage_users",
      "manage_admins",
      "view_stats",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/audit"
    )
  ) {
    return [
      "manage_admins",
      "manage_moderation",
      "manage_verifications",
      "view_stats",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/intelligence"
    ) ||
    pathname.startsWith(
      "/admin/stats"
    )
  ) {
    return "view_stats";
  }

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
  const pathname =
    usePathname();
  const {
    access,
    can,
  } = useAdminAccess();

  const requiredPermission =
    permissionForPath(pathname);

  const links = [
    {
      href: "/admin",
      label: "Resumen",
      icon: LayoutDashboard,
      visible: access.is_admin,
    },
    {
      href: "/admin/users",
      label: "Usuarios",
      icon: Users,
      visible:
        can("manage_users") ||
        can("manage_admins") ||
        can("manage_moderation") ||
        can("manage_verifications"),
    },
    {
      href: "/admin/posts",
      label: "Publicaciones",
      icon: FileText,
      visible:
        can("manage_posts") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/comments",
      label: "Comentarios",
      icon: MessageSquareWarning,
      visible:
        can("manage_posts") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/reports",
      label: "Reportes",
      icon: ShieldAlert,
      visible:
        can("manage_feedback") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/spam",
      label: "Anti-Spam",
      icon: ShieldCheck,
      visible:
        can("manage_moderation") ||
        can("manage_users") ||
        can("manage_admins") ||
        can("view_stats"),
    },
    {
      href: "/admin/events",
      label: "Eventos",
      icon: CalendarDays,
      visible: can("manage_events"),
    },
    {
      href: "/admin/feedback",
      label: "Feedback",
      icon: MessageSquareWarning,
      visible: can("manage_feedback"),
    },
    {
      href: "/admin/audit",
      label: "Auditoría",
      icon: ScrollText,
      visible:
        can("manage_admins") ||
        can("manage_moderation") ||
        can("manage_verifications") ||
        can("view_stats"),
    },
    {
      href: "/admin/intelligence",
      label: "Producto",
      icon: Activity,
      visible: can("view_stats"),
    },
    {
      href: "/admin/stats",
      label: "Estadísticas",
      icon: BarChart3,
      visible: can("view_stats"),
    },
  ].filter(
    (item) => item.visible
  );

  return (
    <AppShell>
      <AdminGuard
        permission={
          requiredPermission
        }
      >
        <div className="mx-auto w-full max-w-[1080px]">
          <div className="mb-6 pt-2">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[var(--app-accent)]">
              Administración
            </p>

            <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em] text-[var(--app-text)]">
              {title}
            </h1>

            <p className="mt-1 text-sm text-[var(--app-muted)]">
              {description}
            </p>
          </div>

          <nav className="scrollbar-thin mb-6 flex gap-1 overflow-x-auto border-b border-[var(--app-border)] pb-3">
            {links.map(
              ({
                href,
                label,
                icon: Icon,
              }) => {
                const active =
                  href === "/admin"
                    ? pathname ===
                      "/admin"
                    : pathname.startsWith(
                        href
                      );

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      active
                        ? "bg-[var(--app-soft)] text-[var(--app-text)]"
                        : "text-[var(--app-muted)] hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
                    }`}
                  >
                    <Icon
                      size={15}
                    />
                    {label}
                  </Link>
                );
              }
            )}
          </nav>

          {children}
        </div>
      </AdminGuard>
    </AppShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */

/* ALUMNI_ANTI_SPAM_1_0 */

/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:ADMIN_SHELL */
