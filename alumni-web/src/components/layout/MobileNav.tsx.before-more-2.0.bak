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
  MoreHorizontal,
  Users,
  CalendarDays,
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
    href: "/feed?compose=1",
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
];

const moreItems = [
  {
    href: "/community",
    label: "Comunidades",
    icon: Users,
  },
  {
    href: "/events",
    label: "Eventos",
    icon: CalendarDays,
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
    moreOpen,
    setMoreOpen,
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
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [moreOpen]);

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

  const moreActive =
    pathname === "/community" ||
    pathname.startsWith(
      "/community/"
    ) ||
    pathname === "/events" ||
    pathname.startsWith(
      "/events/"
    ) ||
    pathname === "/settings" ||
    pathname.startsWith(
      "/settings/"
    );

  return createPortal(
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() =>
              setMoreOpen(false)
            }
            className="fixed inset-0 z-[2147481997] bg-black/35 lg:hidden"
          />

          <section
            aria-label="Más secciones"
            className="fixed inset-x-0 bottom-[calc(58px+max(8px,env(safe-area-inset-bottom)))] z-[2147481999] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_99%,transparent)] backdrop-blur-md lg:hidden"
          >
            <div className="mx-auto w-full max-w-lg px-4 pt-1 pb-0">
              <div className="flex min-h-9 items-center justify-between border-b border-[var(--app-border)]">
                <span className="text-[11px] font-semibold tracking-[0.01em] text-[var(--app-muted)]">
                  Más
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setMoreOpen(false)
                  }
                  className="text-[11px] font-medium text-[var(--app-muted)]"
                >
                  Cerrar
                </button>
              </div>

              {moreItems.map(
                ({
                  href,
                  label,
                  icon: Icon,
                }) => {
                  const active =
                    pathname === href ||
                    pathname.startsWith(
                      `${href}/`
                    );

                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() =>
                        setMoreOpen(false)
                      }
                      className="flex min-h-[52px] items-center gap-3 border-b border-[var(--app-border)] last:border-b-0"
                    >
                      <Icon
                        size={19}
                        className={
                          active
                            ? "text-[var(--app-accent)]"
                            : "text-[var(--app-muted-2)]"
                        }
                      />

                      <span className="min-w-0 flex-1">
                        <strong
                          className={`block text-[13px] font-semibold ${
                            active
                              ? "text-[var(--app-text)]"
                              : "text-[var(--app-text-soft)]"
                          }`}
                        >
                          {label}
                        </strong>

                      </span>
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        </>
      )}

      <nav
        data-alumni-mobile-nav="true"
        className="fixed inset-x-0 bottom-0 z-[2147482000] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-1px_0_color-mix(in_srgb,var(--app-border)_80%,transparent)] backdrop-blur-md [backface-visibility:hidden] [transform:translateZ(0)] lg:hidden"
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
                    setMoreOpen(false);

                    if (create) {
                      if (
                        pathname ===
                        "/feed"
                      ) {
                        event.preventDefault();

                        window.dispatchEvent(
                          new CustomEvent(
                            "alumni:open-composer"
                          )
                        );

                        document
                          .getElementById(
                            "composer"
                          )
                          ?.scrollIntoView({
                            behavior:
                              "smooth",
                            block:
                              "center",
                          });
                      }

                      return;
                    }

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
                    className={`relative flex h-9 w-11 items-center justify-center rounded-lg transition-colors duration-150 ${
                      create
                        ? "bg-[var(--app-accent)] text-[var(--app-on-accent)]"
                        : active
                        ? "text-[var(--app-accent)]"
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
                        ? "font-semibold text-[var(--app-text)]"
                        : "text-[var(--app-muted-2)]"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            }
          )}

          <button
            type="button"
            onClick={() =>
              setMoreOpen(
                (value) =>
                  !value
              )
            }
            aria-expanded={
              moreOpen
            }
            className="flex min-h-12 flex-col items-center justify-center gap-1"
          >
            <span
              className={`relative flex h-9 w-11 items-center justify-center rounded-xl transition ${
                moreOpen ||
                moreActive
                  ? "text-[var(--app-accent)]"
                  : "text-[var(--app-muted-2)]"
              }`}
            >
              <MoreHorizontal
                size={20}
              />
            </span>

            <span
              className={`text-[10px] ${
                moreOpen ||
                moreActive
                  ? "font-semibold text-[var(--app-text)]"
                  : "text-[var(--app-muted-2)]"
              }`}
            >
              Más
            </span>
          </button>
        </div>
      </nav>
    </>,
    document.body
  );
}

/* ALUMNI_1_3_7_MOBILE_NAV_PORTAL */
/* ALUMNI_1_5_0_MESSAGING_2_HOME_NAV:MOBILE_NAV */
/* ALUMNI_2_1_1_MOBILE_NAV_MORE */

/* ALUMNI_2_2_0_FIX1_SAFE_ADDITIVE:MOBILE_NAV */

/* ALUMNI_2_3_2_RECOVERY_PROFILE_PASSPORT_NAV:MOBILE_MORE */

/* ALUMNI_2_3_3_PASSPORT_PROFILE_FEED_FIX:REMOVE_PASSPORT_FROM_MORE */

/* ALUMNI_3_1_0_PROFESSIONAL_VISUAL_CORE */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */

/* ALUMNI_3_6_0_CREATION_SOCIAL_POLISH */
