"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  MessageSquareWarning,
  ScrollText,
  ShieldAlert,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminPage() {
  const {
    access,
    can,
  } = useAdminAccess();

  const modules = [
    {
      href: "/admin/users",
      title: "Usuarios y verificación",
      description:
        "Verifica cuentas, restringe funciones, suspende usuarios y administra permisos.",
      icon: Users,
      visible:
        can("manage_users") ||
        can("manage_admins") ||
        can("manage_moderation") ||
        can("manage_verifications"),
    },
    {
      href: "/admin/posts",
      title: "Publicaciones",
      description:
        "Revisa publicaciones, señales de riesgo y elimina contenido cuando sea necesario.",
      icon: FileText,
      visible:
        can("manage_posts") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/comments",
      title: "Comentarios",
      description:
        "Consulta y modera comentarios de toda la red, incluyendo respuestas.",
      icon: MessageSquareWarning,
      visible:
        can("manage_posts") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/reports",
      title: "Reportes",
      description:
        "Investiga denuncias de usuarios y registra su resolución.",
      icon: ShieldAlert,
      visible:
        can("manage_feedback") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/events",
      title: "Eventos",
      description:
        "Crea actividades y administra el calendario Alumni.",
      icon: CalendarDays,
      visible: can("manage_events"),
    },
    {
      href: "/admin/feedback",
      title: "Feedback",
      description:
        "Revisa errores, capturas, sugerencias y reportes técnicos.",
      icon: MessageSquareWarning,
      visible: can("manage_feedback"),
    },
    {
      href: "/admin/audit",
      title: "Auditoría",
      description:
        "Historial de verificaciones, sanciones, moderación y cambios administrativos.",
      icon: ScrollText,
      visible:
        can("manage_admins") ||
        can("manage_moderation") ||
        can("manage_verifications") ||
        can("view_stats"),
    },
    {
      href: "/admin/stats",
      title: "Estadísticas",
      description:
        "Consulta el tamaño y la actividad general de la red.",
      icon: BarChart3,
      visible: can("view_stats"),
    },
  ].filter(
    (module) => module.visible
  );

  return (
    <AdminShell
      title="Centro de Control"
      description="Moderación, confianza, seguridad y operación de Alumni."
    >
      {!access.is_admin ? null : modules.length === 0 ? (
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">
          Tu cuenta es administradora, pero todavía no tiene módulos asignados.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {modules.map(
            ({
              href,
              title,
              description,
              icon: Icon,
            }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-[22px] border border-[var(--app-border)] bg-[var(--app-surface)] p-5 transition hover:bg-[var(--app-soft)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                  <Icon
                    size={18}
                  />
                </div>

                <h2 className="mt-5 text-base font-black text-[var(--app-text)]">
                  {title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--app-muted)]">
                  {description}
                </p>

                <p className="mt-5 text-xs font-black text-[var(--app-accent)]">
                  Abrir módulo →
                </p>
              </Link>
            )
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */
