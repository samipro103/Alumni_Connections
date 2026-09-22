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
      <nav
        className="space-y-1"
        aria-label="Navegación principal"
      >
        {items.map(({ href, icon: Icon, text }) => {
          const active = pathname === href || (href !== "/feed" && pathname.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition ${active
                  ? "bg-[var(--app-soft-strong)] text-[var(--app-text)]"
                  : "text-[var(--app-muted)] hover:bg-[var(--app-soft)] hover:text-[var(--app-text-soft)]"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.3 : 1.9} />
              <span>{text}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7f8cff]" />}
            </Link>
          );
        })}
      </nav>

    </div>
  );
}

/* ALUMNI_2_1_COMMUNITIES_EVENTS:SIDEBAR_COPY */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */

/* ALUMNI_INTERNAL_UI_1_0_DARK_LIGHT_CLEAN */

/* ALUMNI_ACCESSIBILITY_MOBILE_10_7:SIDEBAR */
