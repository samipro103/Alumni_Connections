"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

type FilterType = "all" | "connections" | "activity";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user?.id]);

  async function loadNotifications() {
    if (!user) return;

    setLoadingNotifications(true);

    const { data: notificationsData } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!notificationsData) {
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    const actorIds = [
      ...new Set(
        notificationsData
          .map((notification: any) => notification.actor_id)
          .filter(Boolean)
      ),
    ];

    let profilesData: any[] = [];

    if (actorIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, university, career")
        .in("id", actorIds);

      profilesData = data || [];
    }

    setNotifications(
      notificationsData.map((notification: any) => ({
        ...notification,
        profile: profilesData.find(
          (profile: any) => profile.id === notification.actor_id
        ),
      }))
    );

    setLoadingNotifications(false);
  }

  const filtered = useMemo(() => {
    if (filter === "connections") {
      return notifications.filter((item: any) => item.type === "follow");
    }

    if (filter === "activity") {
      return notifications.filter(
        (item: any) => item.type === "like" || item.type === "comment"
      );
    }

    return notifications;
  }, [notifications, filter]);

  const grouped = useMemo(() => {
    const result: Record<string, any[]> = {
      Hoy: [],
      Ayer: [],
      Anteriores: [],
    };

    filtered.forEach((item: any) => {
      const date = new Date(item.created_at);

      if (isToday(date)) {
        result.Hoy.push(item);
      } else if (isYesterday(date)) {
        result.Ayer.push(item);
      } else {
        result.Anteriores.push(item);
      }
    });

    return result;
  }, [filtered]);

  function notificationMeta(type: string) {
    if (type === "follow") {
      return {
        icon: UserPlus,
        text: "comenzó a seguirte",
        tone: "text-[#8d98ff]",
        background: "bg-[#6d7cff]/10",
      };
    }

    if (type === "like") {
      return {
        icon: Heart,
        text: "le dio me gusta a tu publicación",
        tone: "text-red-400",
        background: "bg-red-500/10",
      };
    }

    return {
      icon: MessageCircle,
      text: "comentó tu publicación",
      tone: "text-emerald-400",
      background: "bg-emerald-500/10",
    };
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[780px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Actividad reciente de tus conexiones y publicaciones.
          </p>
        </div>

        <div className="mb-5 flex gap-2 border-b border-white/[0.07] pb-3">
          {[
            ["all", "Todas"],
            ["connections", "Conexiones"],
            ["activity", "Actividad"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as FilterType)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                filter === id
                  ? "bg-white/[0.07] text-zinc-200"
                  : "text-zinc-600 hover:bg-white/[0.035] hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loadingNotifications ? (
          <div className="py-16 text-center text-sm text-zinc-600">
            Cargando actividad...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/[0.09] px-6 py-16 text-center">
            <Bell size={26} className="mx-auto text-zinc-700" />
            <p className="mt-4 font-bold text-zinc-300">
              Todo está tranquilo por aquí
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Las nuevas interacciones aparecerán en esta sección.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {Object.entries(grouped).map(([label, items]) => {
              if (items.length === 0) return null;

              return (
                <section key={label}>
                  <p className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700">
                    {label}
                  </p>

                  <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
                    <div className="divide-y divide-white/[0.06]">
                      {items.map((notification: any) => {
                        const meta = notificationMeta(notification.type);
                        const Icon = meta.icon;
                        const profileHref = notification.profile?.username
                          ? `/u/${notification.profile.username}`
                          : "/notifications";

                        return (
                          <Link
                            key={notification.id}
                            href={profileHref}
                            className="flex gap-4 px-4 py-4 transition hover:bg-white/[0.035] sm:px-5"
                          >
                            <div className="relative h-12 w-12 shrink-0">
                              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                                {notification.profile?.avatar_url ? (
                                  <img
                                    src={notification.profile.avatar_url}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  notification.profile?.username
                                    ?.charAt(0)
                                    ?.toUpperCase() || "U"
                                )}
                              </div>

                              <span
                                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#101318] ${meta.background} ${meta.tone}`}
                              >
                                <Icon size={12} />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-5 text-zinc-400">
                                <span className="font-black text-zinc-100">
                                  @{notification.profile?.username || "usuario"}
                                </span>{" "}
                                {meta.text}.
                              </p>

                              {(notification.profile?.career ||
                                notification.profile?.university) && (
                                <p className="mt-1 truncate text-xs text-zinc-700">
                                  {[
                                    notification.profile?.career,
                                    notification.profile?.university,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}

                              <p className="mt-1.5 text-[11px] text-zinc-700">
                                {formatDistanceToNow(
                                  new Date(notification.created_at),
                                  {
                                    addSuffix: true,
                                    locale: es,
                                  }
                                )}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
