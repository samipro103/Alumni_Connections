"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Search, Plus, MessageCircle, UserRound } from "lucide-react";

const items = [
  { href: "/feed", label: "Inicio", icon: House },
  { href: "/explore", label: "Explorar", icon: Search },
  { href: "/feed#composer", label: "Crear", icon: Plus, create: true },
  { href: "/messages", label: "Mensajes", icon: MessageCircle },
  { href: "/profile", label: "Perfil", icon: UserRound },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0b0e13]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ href, label, icon: Icon, create }) => {
          const active = !create && (pathname === href || (href !== "/feed" && pathname.startsWith(`${href}/`)));

          return (
            <Link key={label} href={href} className="flex flex-col items-center justify-center gap-1">
              <span className={`flex h-9 w-11 items-center justify-center rounded-xl transition ${create ? "bg-[#6d7cff] text-white" : active ? "bg-white/[0.07] text-white" : "text-zinc-500"}`}>
                <Icon size={20} />
              </span>
              <span className={`text-[10px] ${active ? "text-white" : "text-zinc-600"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
