"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Bell, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";
import { AlumniAvatar } from "@/components/ui/AlumniImage";
import "./topbar-glass-1-1.css";

type TopBarCachedState = {
  profile: any;
  unreadNotifications: number;
};

const topBarCache = new Map<string, TopBarCachedState>();

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const keepProfileNavVisible =
    pathname === "/profile" ||
    pathname.startsWith("/u/") ||
    pathname === "/more" ||
    pathname.startsWith("/more/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/feedback" ||
    pathname.startsWith("/feedback/") ||
    pathname === "/about" ||
    pathname.startsWith("/about/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/events" ||
    pathname.startsWith("/events/") ||
    pathname === "/passport" ||
    pathname.startsWith("/passport/");

  const cachedState = user ? topBarCache.get(user.id) : undefined;

  const [profile, setProfile] = useState<any>(
    cachedState?.profile || null
  );
  const [search, setSearch] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(
    cachedState?.unreadNotifications || 0
  );
  const [hiddenByScroll, setHiddenByScroll] = useState(false);
  const [glassScrolled, setGlassScrolled] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUnreadNotifications(0);
      return;
    }

    const cached = topBarCache.get(user.id);

    if (cached) {
      setProfile(cached.profile);
      setUnreadNotifications(cached.unreadNotifications);
    }

    const currentUser = user;
    let active = true;

    async function refresh() {
      const [
        { data: profileData },
        { count: notificationCount },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", currentUser.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("user_id", currentUser.id)
          .is("read_at", null),
      ]);

      if (!active) return;

      const next = {
        profile: profileData || null,
        unreadNotifications: notificationCount || 0,
      };

      topBarCache.set(currentUser.id, next);
      setProfile(next.profile);
      setUnreadNotifications(next.unreadNotifications);
    }

    void refresh();

    const channel = supabase
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
      void supabase.removeChannel(channel);
      window.removeEventListener("focus", refresh);
    };
  }, [user?.id]);

  useEffect(() => {
    if (keepProfileNavVisible) {
      setHiddenByScroll(false);
      return;
    }

    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 1023px)");
    let lastY = window.scrollY;
    let ticking = false;

    function updateHeader() {
      const currentY = window.scrollY;

      if (!media.matches) {
        setHiddenByScroll(false);
        lastY = currentY;
        ticking = false;
        return;
      }

      const delta = currentY - lastY;

      if (currentY <= 18) {
        setHiddenByScroll(false);
      } else if (delta > 3 && currentY > 88) {
        setHiddenByScroll(true);
      } else if (delta < -3) {
        setHiddenByScroll(false);
      }

      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    }

    function mediaChange() {
      if (!media.matches) setHiddenByScroll(false);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener?.("change", mediaChange);

    return () => {
      window.removeEventListener("scroll", onScroll);
      media.removeEventListener?.("change", mediaChange);
    };
  }, [keepProfileNavVisible]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;

    function syncGlass() {
      setGlassScrolled(window.scrollY > 10);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(syncGlass);
    }

    syncGlass();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function submitSearch(event: FormEvent) {
    event.preventDefault();

    const query = search.trim();

    router.push(
      query
        ? `/explore?q=${encodeURIComponent(query)}`
        : "/explore"
    );
  }

  const notificationBadge =
    unreadNotifications > 0 ? (
      <span className="alumni-topbar-notification-badge">
        {unreadNotifications > 99 ? "99+" : unreadNotifications}
      </span>
    ) : null;

  const profileHref = user ? "/profile" : "/login";

  return (
    <>
      {/* MOBILE/TABLET:
          This is intentionally NOT a bar.
          The header has zero visual height; only the controls float. */}
      <header
        data-alumni-topbar="true"
        data-scroll-hidden={hiddenByScroll ? "true" : "false"}
        className="alumni-mobile-floating-topbar lg:hidden"
      >
        <div className="alumni-mobile-floating-controls">
          <Link
            href="/feed"
            className="alumni-mobile-floating-brand"
            aria-label="Alumni."
          >
            <BrandMark className="text-[21px] text-[var(--app-text)] sm:text-[22px]" />
          </Link>

          <div className="alumni-mobile-floating-actions">
            <Link
              href="/notifications"
              className="alumni-mobile-floating-icon"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {notificationBadge}
            </Link>

            <Link
              href={profileHref}
              className="alumni-topbar-profile-avatar alumni-mobile-floating-avatar"
              aria-label="Ver mi perfil"
              title="Ver mi perfil"
            >
              <AlumniAvatar
                src={profile?.avatar_url}
                name={profile?.username}
                alt="Perfil"
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                priority
              />
            </Link>
          </div>
        </div>
      </header>

      {/* DESKTOP:
          Existing navigation model is preserved, including search/Create. */}
      <header
        data-alumni-desktop-topbar="true"
        data-glass-scrolled={glassScrolled ? "true" : "false"}
        className="alumni-desktop-topbar fixed inset-x-0 top-0 z-[70] hidden h-[68px] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-md lg:block"
      >
        <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-5 px-8">
          <Link
            href="/feed"
            className="shrink-0"
            aria-label="Alumni."
          >
            <BrandMark className="text-[22px] text-[var(--app-text)]" />
          </Link>

          <form
            onSubmit={submitSearch}
            className="mx-auto w-full max-w-[540px]"
          >
            <div className="flex h-10 items-center rounded-xl bg-[var(--app-soft)] px-3.5 ring-1 ring-[var(--app-border)] transition-colors focus-within:bg-[var(--app-surface-2)] focus-within:ring-[color-mix(in_srgb,var(--app-accent)_38%,var(--app-border))]">
              <Search className="h-[18px] w-[18px] text-[var(--app-muted-2)]" />

              <input
                aria-label="Buscar en Alumni"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar personas, carrera, programa o universidad"
                className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)]"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-muted)] transition-colors hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {notificationBadge}
            </Link>

            <Link
              href="/feed#composer"
              className="alumni-accent-button flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
            >
              <Plus size={18} />
              Crear
            </Link>

            <Link
              href={profileHref}
              className="alumni-topbar-profile-avatar ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-bold text-[var(--app-text)] ring-1 ring-[var(--app-border)] transition hover:ring-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))]"
              aria-label="Ver mi perfil"
              title="Ver mi perfil"
            >
              <AlumniAvatar
                src={profile?.avatar_url}
                name={profile?.username}
                alt="Perfil"
                className="h-full w-full"
                imageClassName="h-full w-full object-cover"
                priority
              />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

/* ALUMNI_TOPBAR_STRUCTURAL_REBUILD_8_0 */

/* ALUMNI_ACCESSIBILITY_MOBILE_10_7:TOPBAR */

