"use client";

import {
  Bell,
  Search,
  MessageCircle,
  Plus,
} from "lucide-react";

import Link from "next/link";

export default function TopBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-white/10 bg-zinc-950/70 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
        <Link
          href="/feed"
          className="text-2xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent"
        >
          AlumniConnections
        </Link>

        <div className="hidden lg:flex items-center w-[520px]">
          <div className="flex items-center w-full rounded-2xl border border-white/10 bg-zinc-900/70 px-4">
            <Search className="w-5 h-5 text-zinc-500" />

            <input
              placeholder="Buscar personas, publicaciones o eventos..."
              className="flex-1 bg-transparent px-4 py-3 outline-none text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-11 h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center">
            <Bell size={20} />
          </button>

          <button className="w-11 h-11 rounded-2xl bg-zinc-900 hover:bg-zinc-800 transition flex items-center justify-center">
            <MessageCircle size={20} />
          </button>

          <button className="w-11 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 transition flex items-center justify-center">
            <Plus size={20} />
          </button>

          <img
            src="/default-avatar.png"
            className="w-11 h-11 rounded-2xl object-cover"
          />
        </div>
      </div>
    </header>
  );
}
