"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  createPortal,
} from "react-dom";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";
import {
  House,
  Search,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";
import "./mobile-nav-refine-1-0.css";

const unreadMessagesCache =
  new Map<string, number>();

const navItems = [
  {
    href: "/feed",
    label: "Inicio",
    icon: House,
    kind: "feed",
  },
  {
    href: "/messages",
    label: "Mensajes",
    icon: MessageCircle,
    kind: "messages",
  },
  {
    href: "/explore",
    label: "Buscar",
    icon: Search,
    kind: "search",
  },
  {
    href: "/more",
    label: "Más",
    icon: MoreHorizontal,
    kind: "more",
  },
] as const;

function isMoreSection(
  pathname: string
) {
  return pathname === "/more";
}

function showPrimaryMobileNav(
  pathname: string
) {
  return (
    pathname === "/feed" ||
    pathname === "/messages" ||
    pathname === "/explore" ||
    pathname === "/more" ||
    pathname === "/profile"
  );
}

export default function MobileNav() {
  const pathname =
    usePathname();

  const reduceMotion =
    useReducedMotion();

  const visible =
    showPrimaryMobileNav(
      pathname
    );

  const { user } =
    useAuth();

  const [
    portalReady,
    setPortalReady,
  ] = useState(false);

  const [
    unreadMessages,
    setUnreadMessages,
  ] = useState(
    user
      ? unreadMessagesCache.get(
          user.id
        ) || 0
      : 0
  );

  useEffect(() => {
    setPortalReady(true);

    return () => {
      setPortalReady(false);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const cached =
      unreadMessagesCache.get(
        user.id
      );

    if (
      typeof cached ===
      "number"
    ) {
      setUnreadMessages(
        cached
      );
    }

    const currentUser =
      user;

    let active = true;

    async function refreshUnread() {
      const [
        directResult,
        groupResult,
      ] = await Promise.all([
        supabase
          .from("messages")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "receiver_id",
            currentUser.id
          )
          .is(
            "read_at",
            null
          ),
        supabase.rpc(
          "get_my_message_groups"
        ),
      ]);

      const groupUnread =
        (
          groupResult.data ||
          []
        ).reduce(
          (
            total: number,
            group: any
          ) =>
            total +
            Number(
              group.unread_count ||
                0
            ),
          0
        );

      if (active) {
        const next =
          (directResult.count ||
            0) +
          groupUnread;

        unreadMessagesCache.set(
          currentUser.id,
          next
        );

        setUnreadMessages(
          next
        );
      }
    }

    void refreshUnread();

    const channel =
      supabase
        .channel(
          `mobile-msg:${currentUser.id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter:
              `receiver_id=eq.${currentUser.id}`,
          },
          refreshUnread
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "group_messages",
          },
          refreshUnread
        )
        .subscribe();

    window.addEventListener(
      "focus",
      refreshUnread
    );

    return () => {
      active = false;

      supabase.removeChannel(
        channel
      );

      window.removeEventListener(
        "focus",
        refreshUnread
      );
    };
  }, [user?.id]);

  if (!portalReady) {
    return null;
  }

  function activeFor(
    kind: typeof navItems[number]["kind"],
    href: string
  ) {
    if (kind === "more") {
      return isMoreSection(
        pathname
      );
    }

    if (kind === "feed") {
      return pathname === "/feed";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }

  return createPortal(
    <AnimatePresence
      initial={false}
    >
      {visible && (
        <motion.nav
          key="alumni-primary-mobile-nav"
          data-alumni-mobile-nav="true"
          data-nav-design="glass-primary"
          style={{
            bottom: "max(14px, calc(env(safe-area-inset-bottom) + 8px))",
          }}
          className="alumni-mobile-nav-clean fixed inset-x-4 z-[2147482000] mx-auto w-auto max-w-[398px] rounded-[18px] border px-1.5 py-1 [backface-visibility:hidden] lg:hidden"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: 12,
                  scale: 0.985,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: 12,
                  scale: 0.985,
                }
          }
          transition={{
            duration:
              reduceMotion
                ? 0.08
                : 0.2,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
      <div className="grid w-full grid-cols-4">
        {navItems.map(
          ({
            href,
            label,
            icon: Icon,
            kind,
          }) => {
            const active =
              activeFor(
                kind,
                href
              );

            const messages =
              kind === "messages";

            return (
              <Link
                key={href}
                href={href}
                onClick={(
                  event
                ) => {
                  if (
                    kind ===
                      "feed" &&
                    pathname ===
                      "/feed"
                  ) {
                    event.preventDefault();

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });
                  }
                }}
                className="alumni-mobile-nav-item flex min-h-[46px] items-center justify-center rounded-[15px]"
                data-active={
                  active
                    ? "true"
                    : "false"
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                aria-label={label}
                title={label}
              >
                <span className="alumni-mobile-nav-icon relative flex h-9 w-11 items-center justify-center rounded-[11px] transition-colors duration-150">
                  <Icon
                    size={20}
                    strokeWidth={
                      active
                        ? 2.25
                        : 1.9
                    }
                  />

                  {messages &&
                    unreadMessages >
                      0 && (
                      <span className="absolute right-0 top-0 flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[var(--app-accent-fill)] px-1 text-[8px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]">
                        {unreadMessages >
                        99
                          ? "99+"
                          : unreadMessages}
                      </span>
                    )}
                </span>

              </Link>
            );
          }
        )}
      </div>
        </motion.nav>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ALUMNI_MORE_2_0_LISTA_LIMPIA */

/* ALUMNI_NAV_PROFILE_EDITOR_1_0_FLOATING_OPTION1 */

/* ALUMNI_NAVBAR_ICONS_ONLY_1_0 */

/* ALUMNI_FEEDBACK_PRO_NAV_COMPACT_3_0 */

/* ALUMNI_NAVBAR_REFINE_1_0 */

/* ALUMNI_GLASS_NAVIGATION_MOBILE_6_0:MOBILE_NAV */
