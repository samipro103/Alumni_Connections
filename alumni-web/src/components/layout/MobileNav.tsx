"use client";

import {
  useEffect,
  useState,
} from "react";
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
    unreadMessages,
    setUnreadMessages,
  ] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const currentUser = user;
    let active = true;

    async function refreshUnread() {
      const { count } =
        await supabase
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
          );

      if (active) {
        setUnreadMessages(
          count || 0
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

  return (
    <nav
      data-alumni-mobile-nav="true"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-white/[0.08] bg-[#0b0e13]/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"
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
                className="flex min-h-12 flex-col items-center justify-center gap-1"
              >
                <span
                  className={`relative flex h-9 w-11 items-center justify-center rounded-xl transition ${
                    create
                      ? "bg-[#6d7cff] text-white shadow-[0_8px_25px_rgba(109,124,255,.25)]"
                      : active
                      ? "bg-white/[0.07] text-white"
                      : "text-zinc-500"
                  }`}
                >
                  <Icon
                    size={20}
                  />

                  {messages &&
                    unreadMessages >
                      0 && (
                      <span className="absolute right-0.5 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#6d7cff] px-1 text-[9px] font-black leading-none text-white ring-2 ring-[#0b0e13]">
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
                      ? "text-white"
                      : "text-zinc-600"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>
  );
}
