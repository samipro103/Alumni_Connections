"use client";

import {
  useEffect,
  useState,
} from "react";
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
  Plus,
  MessageCircle,
  Settings,
} from "lucide-react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

const unreadMessagesCache =
  new Map<string, number>();

const items = [
  {
    href: "/feed",
    label: "Inicio",
    icon: House,
  },
  {
    href: "/explore",
    label: "Explorar",
    icon: Search,
  },
  {
    href: "/feed#composer",
    label: "Crear",
    icon: Plus,
    create: true,
  },
  {
    href: "/messages",
    label: "Mensajes",
    icon: MessageCircle,
    messages: true,
  },
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings,
  },
];

export default function MobileNav() {
  const pathname =
    usePathname();

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

  if (
    !portalReady
  ) {
    return null;
  }

  return createPortal(
    <nav
      data-alumni-mobile-nav="true"
      className="fixed inset-x-0 bottom-0 z-[2147482000] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_var(--app-shadow)] backdrop-blur-2xl [backface-visibility:hidden] [transform:translateZ(0)] lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(
          ({
            href,
            label,
            icon: Icon,
            create,
            messages,
          }) => {
            const active =
              !create &&
              (pathname ===
                href ||
                (href !==
                  "/feed" &&
                  pathname.startsWith(
                    `${href}/`
                  )));

            return (
              <Link
                key={label}
                href={href}
                onClick={(event) => {
                  if (
                    label === "Inicio" &&
                    pathname === "/feed"
                  ) {
                    event.preventDefault();

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }
                }}
                className="flex min-h-12 flex-col items-center justify-center gap-1"
              >
                <span
                  className={`relative flex h-9 w-11 items-center justify-center rounded-xl transition ${
                    create
                      ? "bg-[var(--app-accent)] text-[var(--app-on-accent)] shadow-[0_8px_25px_color-mix(in_srgb,var(--app-accent)_25%,transparent)]"
                      : active
                      ? "bg-[var(--app-soft)] text-[var(--app-text)]"
                      : "text-[var(--app-muted-2)]"
                  }`}
                >
                  <Icon
                    size={20}
                  />

                  {messages &&
                    unreadMessages >
                      0 && (
                      <span className="absolute right-0.5 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-accent)] px-1 text-[9px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]">
                        {unreadMessages >
                        99
                          ? "99+"
                          : unreadMessages}
                      </span>
                    )}
                </span>

                <span
                  className={`text-[10px] ${
                    active
                      ? "font-bold text-[var(--app-text)]"
                      : "text-[var(--app-muted-2)]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>,
    document.body
  );
}

/* ALUMNI_1_3_7_MOBILE_NAV_PORTAL */

/* ALUMNI_1_5_0_MESSAGING_2_HOME_NAV:MOBILE_NAV */
