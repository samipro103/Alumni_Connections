"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock3,
  Heart,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import {
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

type FilterType = "all" | "connections" | "activity";

type NotificationGroup = {
  key: string;
  type: string;
  targetType: string;
  targetId: string;
  latestAt: string;
  items: any[];
  actors: any[];
};

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

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadNotifications(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadNotifications(markRead = true) {
    if (!user) return;

    setLoadingNotifications(true);

    const { data: notificationsData, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !notificationsData) {
      console.error(error);
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

    if (markRead) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);
    }

    setLoadingNotifications(false);
  }

  const groupedNotifications = useMemo(() => {
    const map = new Map<string, NotificationGroup>();

    notifications.forEach((item: any) => {
      const targetType =
        item.target_type ||
        (item.post_id ? "post" : item.type === "follow" ? "profile" : "other");

      const targetId =
        item.target_id ||
        (item.post_id ? String(item.post_id) : item.type === "follow" ? "followers" : String(item.id));

      const key = `${item.type}:${targetType}:${targetId}`;
      const current = map.get(key);

      if (current) {
        current.items.push(item);
        if (
          item.profile &&
          !current.actors.some((actor) => actor.id === item.profile.id)
        ) {
          current.actors.push(item.profile);
        }
      } else {
        map.set(key, {
          key,
          type: item.type,
          targetType,
          targetId,
          latestAt: item.created_at,
          items: [item],
          actors: item.profile ? [item.profile] : [],
        });
      }
    });

    return [...map.values()].sort(
      (a, b) =>
        new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime()
    );
  }, [notifications]);

  const filtered = useMemo(() => {
    if (filter === "connections") {
      return groupedNotifications.filter((group) => group.type === "follow");
    }

    if (filter === "activity") {
      return groupedNotifications.filter((group) => group.type !== "follow");
    }

    return groupedNotifications;
  }, [groupedNotifications, filter]);

  const groupedByDate = useMemo(() => {
    const result: Record<string, NotificationGroup[]> = {
      Hoy: [],
      Ayer: [],
      Anteriores: [],
    };

    filtered.forEach((group) => {
      const date = new Date(group.latestAt);

      if (isToday(date)) result.Hoy.push(group);
      else if (isYesterday(date)) result.Ayer.push(group);
      else result.Anteriores.push(group);
    });

    return result;
  }, [filtered]);

  function notificationMeta(group: NotificationGroup) {
    if (group.type === "follow_request") {
      return {
        icon: Clock3,
        action:
          group.items.length === 1
            ? "quiere seguirte"
            : "quieren seguirte",
        tone: "text-[#8d98ff]",
        background: "bg-[#6d7cff]/10",
      };
    }

    if (group.type === "follow_request_accepted") {
      return {
        icon: UserPlus,
        action: "aceptó tu solicitud de seguimiento",
        tone: "text-emerald-400",
        background: "bg-emerald-500/10",
      };
    }

    if (group.type === "follow") {
      return {
        icon: UserPlus,
        action: group.items.length === 1 ? "comenzó a seguirte" : "comenzaron a seguirte",
        tone: "text-[#8d98ff]",
        background: "bg-[#6d7cff]/10",
      };
    }

    if (group.type === "story_reply") {
      return {
        icon: MessageCircle,
        action: group.items.length === 1
          ? "respondió a tu historia"
          : "respondieron a tu historia",
        tone: "text-[#8d98ff]",
        background: "bg-[#6d7cff]/10",
      };
    }

    if (group.type === "comment") {
      return {
        icon: MessageCircle,
        action:
          group.items.length === 1
            ? "comentó tu publicación"
            : "comentaron tu publicación",
        tone: "text-emerald-400",
        background: "bg-emerald-500/10",
      };
    }

    if (group.targetType === "comment") {
      return {
        icon: Heart,
        action:
          group.items.length === 1
            ? "le dio me gusta a tu comentario"
            : "le dieron me gusta a tu comentario",
        tone: "text-red-400",
        background: "bg-red-500/10",
      };
    }

    if (group.targetType === "story") {
      return {
        icon: Heart,
        action:
          group.items.length === 1
            ? "le dio me gusta a tu historia"
            : "le dieron me gusta a tu historia",
        tone: "text-pink-400",
        background: "bg-pink-500/10",
      };
    }

    return {
      icon: Heart,
      action:
        group.items.length === 1
          ? "le dio me gusta a tu publicación"
          : "le dieron me gusta a tu publicación",
      tone: "text-red-400",
      background: "bg-red-500/10",
    };
  }

  function actorsText(group: NotificationGroup) {
    const names = group.actors
      .map((actor) => actor?.username)
      .filter(Boolean);

    if (names.length === 0) return "Alguien";
    if (names.length === 1) return `@${names[0]}`;
    if (names.length === 2) return `@${names[0]} y @${names[1]}`;

    const remaining = Math.max(group.items.length - 2, names.length - 2);
    return `@${names[0]}, @${names[1]} y ${remaining} ${remaining === 1 ? "persona más" : "personas más"}`;
  }

  async function openNotification(group: NotificationGroup) {
    if (group.type === "follow_request") {
      router.push("/settings?section=profile");
      return;
    }

    if (group.type === "follow_request_accepted") {
      const username = group.actors[0]?.username;
      if (username) router.push(`/u/${username}`);
      return;
    }

    if (group.type === "follow") {
      const username = group.actors[0]?.username;
      if (username) router.push(`/u/${username}`);
      return;
    }

    if (group.type === "story_reply") {
      const username = group.actors[0]?.username;
      if (username) router.push(`/messages/${username}`);
      return;
    }

    if (group.targetType === "story") {
      router.push(`/feed?story=${encodeURIComponent(group.targetId)}`);
      return;
    }

    if (
      group.targetType === "comment" ||
      group.targetType === "post_comment"
    ) {
      const { data: comment } = await supabase
        .from("comments")
        .select("id, post_id")
        .eq("id", Number(group.targetId))
        .maybeSingle();

      if (comment) {
        router.push(
          `/feed?post=${comment.post_id}&comment=${comment.id}`
        );
      }

      return;
    }

    if (group.targetType === "post") {
      router.push(`/feed?post=${encodeURIComponent(group.targetId)}`);
      return;
    }

    if (group.items[0]?.post_id) {
      router.push(`/feed?post=${group.items[0].post_id}`);
    }
  }


  return (
    <AppShell>
      <div className="alumni-notifications-page mx-auto w-full max-w-[800px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Me gusta, comentarios y nuevas conexiones en un solo lugar.
          </p>
        </div>

        <div className="alumni-section-tabs mb-5 flex gap-2 border-b border-white/[0.07] pb-3">
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
          <div className="alumni-empty-state rounded-[24px] border border-dashed border-white/[0.09] px-6 py-16 text-center">
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
            {Object.entries(groupedByDate).map(([label, groups]) => {
              if (groups.length === 0) return null;

              return (
                <section key={label}>
                  <p className="mb-3 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-700">
                    {label}
                  </p>

                  <div className="alumni-open-list overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
                    <div className="divide-y divide-white/[0.06]">
                      {groups.map((group) => {
                        const meta = notificationMeta(group);
                        const Icon = meta.icon;
                        const visibleActors = group.actors.slice(0, 3);
                        const unread = group.items.some(
                          (item: any) => !item.read_at
                        );

                        return (
                          <button
                            key={group.key}
                            type="button"
                            onClick={() => openNotification(group)}
                            className={`alumni-notification-row flex w-full gap-4 px-4 py-4 text-left transition hover:bg-white/[0.035] active:bg-white/[0.055] sm:px-5 ${unread ? "alumni-notification-unread" : ""}`}
                          >
                            <div className="relative h-12 w-[58px] shrink-0">
                              {visibleActors.map((actor, index) => (
                                <div
                                  key={actor.id}
                                  className="absolute top-0 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#101318] bg-[#1a1f29] text-xs font-bold ring-1 ring-white/10"
                                  style={{ left: `${index * 9}px`, zIndex: 10 - index }}
                                >
                                  {actor.avatar_url ? (
                                    <img
                                      src={actor.avatar_url}
                                      alt={actor.username}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    actor.username?.charAt(0)?.toUpperCase() || "U"
                                  )}
                                </div>
                              ))}

                              <span
                                className={`absolute bottom-0 right-0 z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#101318] ${meta.background} ${meta.tone}`}
                              >
                                <Icon size={12} />
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm leading-5 text-zinc-400">
                                <span className="font-black text-zinc-100">
                                  {actorsText(group)}
                                </span>{" "}
                                {meta.action}.
                              </p>

                              <p className="mt-1.5 text-[11px] text-zinc-700">
                                {formatDistanceToNow(new Date(group.latestAt), {
                                  addSuffix: true,
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </button>
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
