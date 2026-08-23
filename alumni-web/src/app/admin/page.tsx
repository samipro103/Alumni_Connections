"use client";

import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FileText,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AdminPage() {
  const { access, can } = useAdminAccess();

  const modules = [
    {
      href: "/admin/feedback",
      title: "Feedback",
      description:
        "Revisa errores, capturas, sugerencias y el estado de cada reporte.",
      icon: MessageSquareWarning,
      visible: can("manage_feedback"),
    },
    {
      href: "/admin/users",
      title: "Usuarios y permisos",
      description:
        "Consulta perfiles y administra privilegios del equipo.",
      icon: Users,
      visible: can("manage_users") || can("manage_admins"),
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
      href: "/admin/posts",
      title: "Publicaciones",
      description:
        "Revisa y modera contenido publicado en la plataforma.",
      icon: FileText,
      visible: can("manage_posts"),
    },
    {
      href: "/admin/stats",
      title: "Estadísticas",
      description:
        "Consulta el tamaño y actividad general de la red.",
      icon: BarChart3,
      visible: can("view_stats"),
    },
  ].filter((module) => module.visible);

  return (
    <AdminShell
      title="Centro de administración"
      description="Control operativo de AlumniConnections según tus permisos."
    >
      {!access.is_admin ? null : modules.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-600">
          Tu cuenta es administradora, pero todavía no tiene módulos asignados.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {modules.map(
            ({ href, title, description, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 transition hover:border-[#6d7cff]/25 hover:bg-white/[0.04]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d7cff]/10 text-[#8d98ff]">
                  <Icon size={18} />
                </div>
                <h2 className="mt-5 text-base font-black text-zinc-200">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {description}
                </p>
                <p className="mt-5 text-xs font-black text-[#8d98ff] opacity-70 transition group-hover:opacity-100">
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
