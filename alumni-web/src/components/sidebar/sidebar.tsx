"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Home,
  Search,
  MessageCircle,
  User,
  Settings,
  Bell,
  GraduationCap,
  Shield
} from "lucide-react";

export default function Sidebar() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const logged = !!user;

  return (

    <nav className="flex flex-col gap-3">

      <Link
        href="/feed"
        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
      >
        <Home size={22} />
        Inicio
      </Link>

      <Link
        href="/explore"
        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
      >
        <Search size={22} />
        Explorar
      </Link>

      <Link
        href="/events"
        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
      >
        <GraduationCap size={22} />
        Eventos
      </Link>

      {logged && (
        <>
          <Link
            href="/messages"
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            <MessageCircle size={22} />
            Mensajes
          </Link>

          <Link
            href="/notifications"
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            <Bell size={22} />
            Notificaciones
          </Link>

          <Link
            href="/profile"
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            <User size={22} />
            Perfil
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            <Settings size={22} />
            Ajustes
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-800 transition"
          >
            <Shield size={22} />
            Admin
          </Link>
        </>
      )}

    </nav>
  );
}