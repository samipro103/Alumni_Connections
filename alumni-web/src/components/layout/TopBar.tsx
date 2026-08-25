"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";

export default function TopBar() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUnreadNotifications(0);
      return;
    }

    const currentUser = user;
    let active = true;

    async function refresh() {
      const [{ data: profileData }, { count: nCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .is("read_at", null),
      ]);

      if (!active) return;
      setProfile(profileData);
      setUnreadNotifications(nCount || 0);
    }

    refresh();

    const nc = supabase
      .channel(`top-n:${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        refresh
      )
      .subscribe();

    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      supabase.removeChannel(nc);
      window.removeEventListener("focus", refresh);
    };
  }, [user?.id]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/explore?q=${encodeURIComponent(q)}` : "/explore");
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[68px] border-b border-white/[0.07] bg-[#090b0f]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/feed"
          className="shrink-0"
          aria-label="Alumni."
        >
          <BrandMark
            className="text-[21px] text-[var(--app-text)] sm:text-[22px]"
          />
        </Link>

        <form onSubmit={submitSearch} className="mx-auto hidden w-full max-w-[540px] md:block">
          <div className="flex h-11 items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 transition focus-within:border-[#6d7cff]/50">
            <Search className="h-[18px] w-[18px] text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar personas, carrera o universidad"
              className="h-full flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#6d7cff] px-1 text-[9px] font-black leading-none text-white ring-2 ring-[#090b0f]">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/feed#composer"
            className="hidden h-10 items-center gap-2 rounded-xl bg-[#6d7cff] px-4 text-sm font-bold text-white transition hover:bg-[#7b87ff] sm:flex"
          >
            <Plus size={18} />
            Crear
          </Link>

          <Link
            href={user ? "/profile" : "/login"}
            className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#181c24] text-sm font-bold text-white transition hover:ring-2 hover:ring-[#6d7cff]/30"
            aria-label="Ver mi perfil"
            title="Ver mi perfil"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Perfil" className="h-full w-full object-cover" />
            ) : (
              <span>{profile?.username?.charAt(0)?.toUpperCase() || "A"}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
