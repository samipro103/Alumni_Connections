"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock3,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
  X,
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
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>(
    {}
  );
  const [requestBusy, setRequestBusy] = useState<string | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) void loadNotifications();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => void loadNotifications(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadNotifications(markRead = true) {
    if (!user) return;

    setLoadingNotifications(true);

    const [
      { data: notificationsData, error },
      { data: requestsData, error: requestsError },
    ] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("follow_requests")
        .select("id")
        .eq("target_id", user.id),
    ]);

    if (error || !notificationsData) {
      console.error(error);
      setNotifications([]);
      setLoadingNotifications(false);
      return;
    }

    if (requestsError) {
      console.error("Error cargando solicitudes pendientes:", requestsError);
    }

    const requestMap: Record<string, boolean> = {};
    (requestsData || []).forEach((request: any) => {
      requestMap[String(request.id)] = true;
    });
    setPendingRequests(requestMap);

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
        .select("id, username, full_name, avatar_url, university, career")
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

  async function clearRequestNotification(requestId: string) {
    if (!user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "follow_request")
      .eq("target_id", requestId);
  }

  async function acceptFollowRequest(requestId: string) {
    if (!user || requestBusy) return;

    setRequestBusy(requestId);

    try {
      const { error } = await supabase.rpc("accept_follow_request", {
        p_request_id: requestId,
      });

      if (error) throw error;

      await clearRequestNotification(requestId);
      await loadNotifications(false);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo aceptar la solicitud.");
    } finally {
      setRequestBusy(null);
    }
  }

  async function rejectFollowRequest(requestId: string) {
    if (!user || requestBusy) return;

    setRequestBusy(requestId);

    try {
      const { error } = await supabase
        .from("follow_requests")
        .delete()
        .eq("id", requestId)
        .eq("target_id", user.id);

      if (error) throw error;

      await clearRequestNotification(requestId);
      await loadNotifications(false);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo rechazar la solicitud.");
    } finally {
      setRequestBusy(null);
    }
  }

  const groupedNotifications = useMemo(() => {
    const map = new Map<string, NotificationGroup>();

    notifications.forEach((item: any) => {
      const targetType =
        item.target_type ||
        (item.post_id
          ? "post"
          : item.type === "follow"
          ? "profile"
          : "other");

      const targetId =
        item.target_id ||
        (item.post_id
          ? String(item.post_id)
          : item.type === "follow"
          ? "followers"
          : String(item.id));

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
    const connectionTypes = new Set([
      "follow",
      "follow_request",
      "follow_request_accepted",
    ]);

    if (filter === "connections") {
      return groupedNotifications.filter((group) =>
        connectionTypes.has(group.type)
      );
    }

    if (filter === "activity") {
      return groupedNotifications.filter(
        (group) => !connectionTypes.has(group.type)
      );
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
          group.items.length === 1 ? "quiere seguirte" : "quieren seguirte",
        tone: "text-[var(--app-accent)]",
      };
    }

    if (group.type === "follow_request_accepted") {
      return {
        icon: UserPlus,
        action: "aceptó tu solicitud de seguimiento",
        tone: "text-emerald-400",
      };
    }

    if (group.type === "follow") {
      return {
        icon: UserPlus,
        action:
          group.items.length === 1
            ? "comenzó a seguirte"
            : "comenzaron a seguirte",
        tone: "text-[var(--app-accent)]",
      };
    }

    if (group.type === "story_reply") {
      return {
        icon: MessageCircle,
        action:
          group.items.length === 1
            ? "respondió a tu historia"
            : "respondieron a tu historia",
        tone: "text-[var(--app-accent)]",
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
      };
    }

    return {
      icon: Heart,
      action:
        group.items.length === 1
          ? group.targetType === "comment"
            ? "le dio me gusta a tu comentario"
            : group.targetType === "story"
            ? "le dio me gusta a tu historia"
            : "le dio me gusta a tu publicación"
          : "interactuaron con tu contenido",
      tone:
        group.targetType === "story" ? "text-pink-400" : "text-red-400",
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
    return `@${names[0]}, @${names[1]} y ${remaining} ${
      remaining === 1 ? "persona más" : "personas más"
    }`;
  }

  async function openNotification(group: NotificationGroup) {
    if (group.type === "follow_request") {
      const username = group.actors[0]?.username;
      if (username) router.push(`/u/${username}`);
      return;
    }

    if (
      group.type === "follow_request_accepted" ||
      group.type === "follow"
    ) {
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
        router.push(`/feed?post=${comment.post_id}&comment=${comment.id}`);
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
      <div className="alumni-notifications-page mx-auto w-full max-w-[820px]">
        <header className="mb-7 pt-2">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--app-muted-3)]">
            Centro de actividad
          </p>
          <h1 className="text-[32px] font-black tracking-[-0.045em] text-[var(--app-text)]">
            Notificaciones
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--app-muted)]">
            Conexiones, reacciones y conversaciones importantes, sin ruido.
          </p>
        </header>

        <div className="mb-7 flex items-center gap-5 border-b border-[var(--app-border)]">
          {[
            ["all", "Todas"],
            ["connections", "Conexiones"],
            ["activity", "Actividad"],
          ].map(([id, label]) => {
            const active = filter === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id as FilterType)}
                className={`relative pb-3 text-xs font-black transition ${
                  active
                    ? "text-[var(--app-text)]"
                    : "text-[var(--app-muted-2)] hover:text-[var(--app-text-soft)]"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--app-accent)]" />
                )}
              </button>
            );
          })}
        </div>

        {loadingNotifications ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <Loader2
              size={20}
              className="animate-spin text-[var(--app-muted)]"
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Bell size={27} className="mx-auto text-[var(--app-muted-3)]" />
            <p className="mt-4 text-sm font-black text-[var(--app-text-soft)]">
              Todo está tranquilo
            </p>
            <p className="mt-1 text-xs text-[var(--app-muted-2)]">
              Las nuevas interacciones aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-9">
            {Object.entries(groupedByDate).map(([label, groups]) => {
              if (groups.length === 0) return null;

              return (
                <section key={label}>
                  <div className="mb-2 flex items-center gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--app-muted-3)]">
                      {label}
                    </p>
                    <span className="h-px flex-1 bg-[var(--app-border)]" />
                  </div>

                  <div>
                    {groups.map((group) => {
                      const meta = notificationMeta(group);
                      const Icon = meta.icon;
                      const actor = group.actors[0];
                      const requestPending =
                        group.type === "follow_request" &&
                        Boolean(pendingRequests[group.targetId]);
                      const busy = requestBusy === group.targetId;

                      return (
                        <article
                          key={group.key}
                          className="group border-b border-[var(--app-border)] py-4.5 last:border-b-0"
                        >
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => void openNotification(group)}
                              className="relative h-12 w-12 shrink-0 text-left"
                              aria-label="Abrir perfil"
                            >
                              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-xs font-black text-[var(--app-text-soft)] ring-1 ring-[var(--app-border)]">
                                {actor?.avatar_url ? (
                                  <img
                                    src={actor.avatar_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  actor?.username?.charAt(0)?.toUpperCase() ||
                                  "U"
                                )}
                              </span>

                              <span
                                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--app-bg)] ${meta.tone}`}
                              >
                                <Icon size={13} strokeWidth={2} />
                              </span>
                            </button>

                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => void openNotification(group)}
                                className="block w-full text-left"
                              >
                                <p className="text-[13px] leading-5 text-[var(--app-muted)]">
                                  <span className="font-black text-[var(--app-text)]">
                                    {actorsText(group)}
                                  </span>{" "}
                                  {meta.action}.
                                </p>

                                {actor?.full_name && (
                                  <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-2)]">
                                    {actor.full_name}
                                  </p>
                                )}

                                <p className="mt-1.5 text-[10px] font-bold text-[var(--app-muted-3)]">
                                  {formatDistanceToNow(
                                    new Date(group.latestAt),
                                    {
                                      addSuffix: true,
                                      locale: es,
                                    }
                                  )}
                                </p>
                              </button>

                              {group.type === "follow_request" && (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {requestPending ? (
                                    <>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void acceptFollowRequest(
                                            group.targetId
                                          );
                                        }}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[var(--app-accent)] px-4 text-[11px] font-black text-[var(--app-on-accent)] transition hover:brightness-105 disabled:opacity-50"
                                      >
                                        {busy ? (
                                          <Loader2
                                            size={13}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <Check size={13} />
                                        )}
                                        Aceptar
                                      </button>

                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          void rejectFollowRequest(
                                            group.targetId
                                          );
                                        }}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[11px] font-black text-[var(--app-muted)] ring-1 ring-inset ring-[var(--app-border)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)] disabled:opacity-50"
                                      >
                                        <X size={13} />
                                        Rechazar
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-bold text-[var(--app-muted-3)]">
                                      Solicitud gestionada
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
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
