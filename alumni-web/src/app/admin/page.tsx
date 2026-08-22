import Link from "next/link";
import { BarChart3, CalendarDays, FileText, Users } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminPage() {
  const modules = [
    { href: "/admin/users", title: "Usuarios", description: "Revisa perfiles registrados y administra la comunidad.", icon: Users },
    { href: "/admin/events", title: "Eventos", description: "Crea actividades y administra el calendario Alumni.", icon: CalendarDays },
    { href: "/admin/posts", title: "Publicaciones", description: "Revisa y modera contenido publicado en la plataforma.", icon: FileText },
    { href: "/admin/stats", title: "Estadísticas", description: "Consulta el tamaño y actividad general de la red.", icon: BarChart3 },
  ];

  return (
    <AdminShell title="Centro de administración" description="Control general de AlumniConnections.">
      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 transition hover:border-[#6d7cff]/25 hover:bg-white/[0.04]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d7cff]/10 text-[#8d98ff]">
              <Icon size={18} />
            </div>
            <h2 className="mt-5 text-base font-black text-zinc-200">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
            <p className="mt-5 text-xs font-black text-[#8d98ff] opacity-70 transition group-hover:opacity-100">Abrir módulo →</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
