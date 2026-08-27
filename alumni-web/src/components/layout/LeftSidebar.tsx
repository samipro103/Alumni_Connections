"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Compass,
  CalendarDays,
  Users,
  Settings,
  MessageCircle,
  Bell,
  UserRound,
} from "lucide-react";

const items = [
  { href: "/feed", icon: House, text: "Inicio" },
  { href: "/explore", icon: Compass, text: "Explorar" },
  { href: "/events", icon: CalendarDays, text: "Eventos" },
  { href: "/messages", icon: MessageCircle, text: "Mensajes" },
  { href: "/notifications", icon: Bell, text: "Notificaciones" },
  { href: "/profile", icon: UserRound, text: "Perfil" },
  { href: "/community", icon: Users, text: "Comunidad" },
  { href: "/settings", icon: Settings, text: "Configuración" },
];

export default function LeftSidebar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-[88px]">
      <nav className="space-y-1">
        {items.map(({ href, icon: Icon, text }) => {
          const active = pathname === href || (href !== "/feed" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${active ? "bg-white/[0.07] text-white" : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.3 : 1.9} />
              <span>{text}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7f8cff]" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7 border-t border-white/[0.07] pt-5">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
          Red Alumni.
        </p>
        <p className="mt-2 px-3 text-xs leading-5 text-zinc-600">
          Conecta con personas, comunidades y eventos que forman parte de tu mundo.
        </p>
      </div>
    </div>
  );
}

/* ALUMNI_2_1_COMMUNITIES_EVENTS:SIDEBAR_COPY */
