import Link from "next/link";
import { BarChart3, CalendarDays, FileText, LayoutDashboard, Users } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import AdminGuard from "./AdminGuard";

export default function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  const links = [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/events", label: "Eventos", icon: CalendarDays },
    { href: "/admin/posts", label: "Publicaciones", icon: FileText },
    { href: "/admin/stats", label: "Estadísticas", icon: BarChart3 },
  ];

  return (
    <AppShell>
      <AdminGuard>
        <div className="mx-auto w-full max-w-[980px]">
          <div className="mb-6 pt-2">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#8d98ff]">Administración</p>
            <h1 className="mt-2 text-[30px] font-black tracking-[-0.04em]">{title}</h1>
            <p className="mt-1 text-sm text-zinc-600">{description}</p>
          </div>

          <nav className="scrollbar-thin mb-6 flex gap-1 overflow-x-auto border-b border-white/[0.07] pb-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-200">
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </nav>

          {children}
        </div>
      </AdminGuard>
    </AppShell>
  );
}
