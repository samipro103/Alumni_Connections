"use client";

import Link from "next/link";
import Card from "../ui/Card";
import {
  Home,
  Compass,
  Calendar,
  Users,
  Settings,
  MessageCircle,
  Bell,
  User,
} from "lucide-react";

export default function LeftSidebar() {
  return (
    <Card className="sticky top-24 p-4">
      <div className="space-y-2">
        <SidebarItem href="/feed" icon={<Home size={20} />} text="Inicio" />
        <SidebarItem href="/explore" icon={<Compass size={20} />} text="Explorar" />
        <SidebarItem href="/events" icon={<Calendar size={20} />} text="Eventos" />
        <SidebarItem href="/messages" icon={<MessageCircle size={20} />} text="Mensajes" />
        <SidebarItem href="/notifications" icon={<Bell size={20} />} text="Notificaciones" />
        <SidebarItem href="/profile" icon={<User size={20} />} text="Perfil" />
        <SidebarItem href="/community" icon={<Users size={20} />} text="Comunidad" />
        <SidebarItem href="/settings" icon={<Settings size={20} />} text="Configuración" />
      </div>
    </Card>
  );
}

function SidebarItem({
  href,
  icon,
  text,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="
      flex
      items-center
      gap-4
      rounded-2xl
      px-4
      py-4
      text-white
      transition-all
      duration-200
      hover:bg-white/5
      hover:translate-x-1
      "
    >
      {icon}
      <span>{text}</span>
    </Link>
  );
}
