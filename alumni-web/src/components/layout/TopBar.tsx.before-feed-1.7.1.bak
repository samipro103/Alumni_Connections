"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Bell,
  Search,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";
import { AlumniAvatar } from "@/components/ui/AlumniImage";

type TopBarCachedState = {
  profile: any;
  unreadNotifications: number;
};

const topBarCache =
  new Map<
    string,
    TopBarCachedState
  >();

export default function TopBar() {
  const router =
    useRouter();

  const { user } =
    useAuth();

  const cachedState =
    user
      ? topBarCache.get(
          user.id
        )
      : undefined;

  const [profile, setProfile] =
    useState<any>(
      cachedState?.profile ||
        null
    );

  const [search, setSearch] =
    useState("");

  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(
    cachedState
      ?.unreadNotifications ||
      0
  );

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setUnreadNotifications(
        0
      );
      return;
    }

    const cached =
      topBarCache.get(
        user.id
      );

    if (cached) {
      setProfile(
        cached.profile
      );

      setUnreadNotifications(
        cached.unreadNotifications
      );
    }

    const currentUser =
      user;

    let active = true;

    async function refresh() {
      const [
        {
          data:
            profileData,
        },
        {
          count:
            notificationCount,
        },
      ] =
        await Promise.all([
          supabase
            .from(
              "profiles"
            )
            .select(
              "username, avatar_url"
            )
            .eq(
              "id",
              currentUser.id
            )
            .maybeSingle(),
          supabase
            .from(
              "notifications"
            )
            .select(
              "id",
              {
                count:
                  "exact",
                head:
                  true,
              }
            )
            .eq(
              "user_id",
              currentUser.id
            )
            .is(
              "read_at",
              null
            ),
        ]);

      if (!active) {
        return;
      }

      const next = {
        profile:
          profileData ||
          null,
        unreadNotifications:
          notificationCount ||
          0,
      };

      topBarCache.set(
        currentUser.id,
        next
      );

      setProfile(
        next.profile
      );

      setUnreadNotifications(
        next.unreadNotifications
      );
    }

    void refresh();

    const channel =
      supabase
        .channel(
          `top-n:${currentUser.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "notifications",
            filter:
              `user_id=eq.${currentUser.id}`,
          },
          refresh
        )
        .subscribe();

    window.addEventListener(
      "focus",
      refresh
    );

    return () => {
      active = false;

      supabase.removeChannel(
        channel
      );

      window.removeEventListener(
        "focus",
        refresh
      );
    };
  }, [user?.id]);

  function submitSearch(
    event:
      React.FormEvent
  ) {
    event.preventDefault();

    const query =
      search.trim();

    router.push(
      query
        ? `/explore?q=${encodeURIComponent(
            query
          )}`
        : "/explore"
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-[70] h-[calc(68px+env(safe-area-inset-top))] border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] backdrop-blur-md [transform:translateZ(0)] lg:h-[68px]">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-5 px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-8 lg:pt-0">
        <Link
          href="/feed"
          className="shrink-0"
          aria-label="Alumni."
        >
          <BrandMark
            className="text-[21px] text-[var(--app-text)] sm:text-[22px]"
          />
        </Link>

        <form
          onSubmit={
            submitSearch
          }
          className="mx-auto hidden w-full max-w-[540px] md:block"
        >
          <div className="flex h-10 items-center rounded-xl bg-[var(--app-soft)] px-3.5 ring-1 ring-[var(--app-border)] transition-colors focus-within:bg-[var(--app-surface-2)] focus-within:ring-[color-mix(in_srgb,var(--app-accent)_38%,var(--app-border))]">
            <Search
              className="h-[18px] w-[18px] text-[var(--app-muted-2)]"
            />

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar personas, carrera, programa o universidad"
              className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)]"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--app-muted)] transition-colors hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
            aria-label="Notificaciones"
          >
            <Bell
              size={20}
            />

            {unreadNotifications >
              0 && (
              <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-accent)] px-1 text-[9px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]">
                {unreadNotifications >
                99
                  ? "99+"
                  : unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/feed#composer"
            className="alumni-accent-button hidden h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold sm:flex"
          >
            <Plus
              size={18}
            />
            Crear
          </Link>

          <Link
            href={
              user
                ? "/profile"
                : "/login"
            }
            className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-bold text-[var(--app-text)] ring-1 ring-[var(--app-border)] transition hover:ring-[color-mix(in_srgb,var(--app-accent)_35%,var(--app-border))]"
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
  );
}

/* ALUMNI_2_1_4_IOS_SAFE_HEADER:TOPBAR */

/* ALUMNI_2_9_0_IMAGE_LAYER:TOPBAR */

/* ALUMNI_3_1_0_PROFESSIONAL_VISUAL_CORE */
