"use client";

import {
  AtSign,
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Heart,
  MessageCircle,
  Repeat2,
  Settings2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { NotificationsLoadingSkeleton } from "@/components/ui/AlumniLoading";
import AlumniImage, { AlumniAvatar } from "@/components/ui/AlumniImage";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { hydratePostMediaItems } from "@/lib/feedMedia";
import InvitationNotificationActions from "@/components/social/InvitationNotificationActions";
import "./notifications-pro.css";

type FilterType =
  | "all"
  | "interactions"
  | "connections"
  | "mentions";

type Preferences = {
  enabled: boolean;
  interactions: boolean;
  connections: boolean;
  mentions: boolean;
  stories: boolean;
  groups: boolean;
};

type GroupedNotification = {
  key: string;
  type: string;
  targetType: string;
  targetId: string;
  postId: number | null;
  latestAt: string;
  unread: boolean;
  items: any[];
  actors: any[];
  previewUrl?: string | null;
};

const PAGE_SIZE = 40;

const DEFAULT_PREFS: Preferences = {
  enabled: true,
  interactions: true,
  connections: true,
  mentions: true,
  stories: true,
  groups: true,
};

function categoryOf(
  type: string,
  targetType: string
): Exclude<FilterType, "all"> {
  const t = String(type || "").toLowerCase();
  const target = String(targetType || "").toLowerCase();

  if (
    [
      "follow",
      "follow_request",
      "follow_request_accepted",
      "community_invite",
      "community_join_request",
      "event_invite",
      "event_reminder",
    ].includes(t)
  ) {
    return "connections";
  }

  if (
    t.includes("mention") ||
    target === "group_message"
  ) {
    return "mentions";
  }

  return "interactions";
}

function groupKey(item: any) {
  const type = String(item.type || "activity");
  const targetType =
    item.target_type ||
    (item.post_id ? "post" : "profile");
  const targetId =
    item.target_id ||
    (item.post_id ? String(item.post_id) : String(item.id));

  /*
    Agrupamos por acción + destino.
    Likes del mismo post se convierten en una sola fila,
    igual que comentarios/reposts repetidos.
  */
  return `${type}:${targetType}:${targetId}`;
}

function relativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) return "ahora";
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)} d`;

  return date.toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
  });
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hoy";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  }

  return "Anteriores";
}

function notificationCopy(group: GroupedNotification) {
  const count = group.items.length;
  const plural = count > 1;

  switch (group.type) {
    case "like":
      return plural
        ? "reaccionaron a tu publicación"
        : "reaccionó a tu publicación";

    case "comment":
      return plural
        ? "comentaron tu publicación"
        : "comentó tu publicación";

    case "comment_like":
      return plural
        ? "reaccionaron a tu comentario"
        : "reaccionó a tu comentario";

    case "repost":
      return plural
        ? "compartieron tu publicación"
        : "compartió tu publicación";

    case "follow":
      return plural
        ? "comenzaron a seguirte"
        : "comenzó a seguirte";

    case "follow_request":
      return plural
        ? "quieren seguirte"
        : "quiere seguirte";

    case "follow_request_accepted":
      return "aceptó tu solicitud";

    case "story_reply":
      return plural
        ? "respondieron a tu historia"
        : "respondió a tu historia";

    case "mention":
      return plural
        ? "te mencionaron"
        : "te mencionó";

    case "group_mention":
      return plural
        ? "te mencionaron en un grupo"
        : "te mencionó en un grupo";

    case "community_invite":
      return "te invitó a una comunidad";

    case "community_join_request":
      return "quiere entrar a tu comunidad";

    case "event_invite":
      return "te invitó a un evento";

    case "event_reminder":
      return "te recuerda que tienes un evento dentro de las próximas 24 horas";

    default:
      return plural
        ? "interactuaron con tu contenido"
        : "interactuó con tu contenido";
  }
}

function iconFor(group: GroupedNotification) {
  switch (group.type) {
    case "follow":
    case "follow_request":
    case "follow_request_accepted":
      return UserPlus;

    case "comment":
    case "story_reply":
      return MessageCircle;

    case "repost":
      return Repeat2;

    case "mention":
    case "group_mention":
      return AtSign;

    case "event_invite":
    case "event_reminder":
      return CalendarDays;

    case "community_invite":
    case "community_join_request":
      return UserPlus;

    default:
      return Heart;
  }
}

function actorText(group: GroupedNotification) {
  if (group.type === "event_reminder") {
    return "Alumni";
  }

  const names = group.actors
    .map((actor) => actor?.username)
    .filter(Boolean);

  if (!names.length) return "Alguien";
  if (names.length === 1) return `@${names[0]}`;
  if (names.length === 2) return `@${names[0]} y @${names[1]}`;

  const extra = Math.max(
    group.items.length - 2,
    names.length - 2
  );

  return `@${names[0]}, @${names[1]} y ${extra} ${
    extra === 1 ? "persona más" : "personas más"
  }`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const [pendingRequests, setPendingRequests] = useState<
    Record<string, boolean>
  >({});
  const [requestBusy, setRequestBusy] = useState<string | null>(null);

  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULT_PREFS);
  const [savingPreference, setSavingPreference] =
    useState<keyof Preferences | null>(null);

  const requestRef = useRef(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;

    void loadPage(0, true);
    void loadPreferences();

    const channel = supabase
      .channel(`notifications-v2:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => void loadPage(0, true, false)
      )
      .subscribe();

    return () => {
      requestRef.current += 1;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadPreferences() {
    if (!user) return;

    const { data } = await supabase
      .from("notification_preferences")
      .select(
        "enabled,interactions,connections,mentions,stories,groups"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    setPreferences({
      ...DEFAULT_PREFS,
      ...(data || {}),
    });
  }

  async function loadPage(
    nextPage: number,
    replace: boolean,
    showLoader = true
  ) {
    if (!user) return;

    const requestId = ++requestRef.current;
    const from = nextPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    if (replace && showLoader) {
      setLoadingRows(true);
    } else if (!replace) {
      setLoadingMore(true);
    }

    const [{ data, error }, { data: requests }] =
      await Promise.all([
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to),
        supabase
          .from("follow_requests")
          .select("id")
          .eq("target_id", user.id),
      ]);

    if (requestId !== requestRef.current) return;

    if (error) {
      console.error(error);
      setLoadingRows(false);
      setLoadingMore(false);
      return;
    }

    const notificationRows = data || [];

    const actorIds = [
      ...new Set(
        notificationRows
          .map((item: any) => item.actor_id)
          .filter(Boolean)
      ),
    ];

    const postIds = [
      ...new Set(
        notificationRows
          .map((item: any) => item.post_id)
          .filter(Boolean)
          .map(Number)
      ),
    ];

    const [profilesResult, mediaResult, postsResult] =
      await Promise.all([
        actorIds.length
          ? supabase
              .from("profiles")
              .select("id,username,full_name,avatar_url")
              .in("id", actorIds)
          : Promise.resolve({ data: [] } as any),

        postIds.length
          ? supabase
              .from("post_media")
              .select("post_id,media_type,media_url,media_path,media_bucket,sort_order")
              .in("post_id", postIds)
              .eq("media_type", "image")
              .order("sort_order", { ascending: true })
          : Promise.resolve({ data: [] } as any),

        postIds.length
          ? supabase
              .from("posts")
              .select("id,image_url")
              .in("id", postIds)
          : Promise.resolve({ data: [] } as any),
      ]);

    if (requestId !== requestRef.current) return;

    const profiles = new Map(
      (profilesResult.data || []).map((profile: any) => [
        profile.id,
        profile,
      ])
    );

    const hydratedMedia = await hydratePostMediaItems(
      (mediaResult.data || []) as any[]
    );

    if (requestId !== requestRef.current) return;

    const mediaByPost = new Map<number, string>();

    for (const media of hydratedMedia) {
      if (
        !mediaByPost.has(Number(media.post_id)) &&
        media.media_url
      ) {
        mediaByPost.set(
          Number(media.post_id),
          media.media_url
        );
      }
    }

    for (const post of postsResult.data || []) {
      if (
        !mediaByPost.has(Number(post.id)) &&
        post.image_url
      ) {
        mediaByPost.set(
          Number(post.id),
          post.image_url
        );
      }
    }

    const enriched = notificationRows.map((item: any) => ({
      ...item,
      profile: profiles.get(item.actor_id) || null,
      preview_url:
        item.post_id
          ? mediaByPost.get(Number(item.post_id)) || null
          : null,
    }));

    setRows((current) => {
      if (replace) return enriched;

      const ids = new Set(current.map((item) => item.id));

      return [
        ...current,
        ...enriched.filter((item: any) => !ids.has(item.id)),
      ];
    });

    const requestMap: Record<string, boolean> = {};

    for (const request of requests || []) {
      requestMap[String(request.id)] = true;
    }

    setPendingRequests(requestMap);
    setPage(nextPage);
    setHasMore(notificationRows.length === PAGE_SIZE);
    setLoadingRows(false);
    setLoadingMore(false);
  }

  const groups = useMemo(() => {
    const map = new Map<string, GroupedNotification>();

    for (const item of rows) {
      const key = groupKey(item);
      const targetType =
        item.target_type ||
        (item.post_id ? "post" : "profile");
      const targetId =
        item.target_id ||
        (item.post_id ? String(item.post_id) : String(item.id));

      const current = map.get(key);

      if (current) {
        current.items.push(item);
        current.unread =
          current.unread || !item.read_at;

        if (
          item.profile &&
          !current.actors.some(
            (actor) => actor.id === item.profile.id
          )
        ) {
          current.actors.push(item.profile);
        }

        if (!current.previewUrl && item.preview_url) {
          current.previewUrl = item.preview_url;
        }
      } else {
        map.set(key, {
          key,
          type: item.type || "activity",
          targetType,
          targetId,
          postId: item.post_id ? Number(item.post_id) : null,
          latestAt: item.created_at,
          unread: !item.read_at,
          items: [item],
          actors: item.profile ? [item.profile] : [],
          previewUrl: item.preview_url || null,
        });
      }
    }

    return [...map.values()].sort(
      (a, b) =>
        new Date(b.latestAt).getTime() -
        new Date(a.latestAt).getTime()
    );
  }, [rows]);

  const filteredGroups = useMemo(() => {
    if (filter === "all") return groups;

    return groups.filter(
      (group) =>
        categoryOf(group.type, group.targetType) === filter
    );
  }, [groups, filter]);

  const byDate = useMemo(() => {
    const result: Record<string, GroupedNotification[]> = {
      Hoy: [],
      Ayer: [],
      Anteriores: [],
    };

    for (const group of filteredGroups) {
      result[dayLabel(group.latestAt)].push(group);
    }

    return result;
  }, [filteredGroups]);

  const unreadCount = useMemo(
    () =>
      rows.filter((item) => !item.read_at).length,
    [rows]
  );

  async function markGroupRead(group: GroupedNotification) {
    if (!user || !group.unread) return;

    const ids = group.items
      .filter((item) => !item.read_at)
      .map((item) => item.id);

    if (!ids.length) return;

    const readAt = new Date().toISOString();

    setRows((current) =>
      current.map((item) =>
        ids.includes(item.id)
          ? { ...item, read_at: readAt }
          : item
      )
    );

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", user.id)
      .in("id", ids);

    if (error) {
      void loadPage(0, true, false);
    }
  }

  async function markAllRead() {
    if (!user || unreadCount === 0) return;

    const readAt = new Date().toISOString();

    setRows((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at || readAt,
      }))
    );

    const { error } = await supabase.rpc(
      "alumni_mark_all_notifications_read"
    );

    if (error) {
      void loadPage(0, true, false);
    }
  }

  async function openNotification(group: GroupedNotification) {
    await markGroupRead(group);

    const actorUsername = group.actors[0]?.username;

    if (
      group.type === "follow" ||
      group.type === "follow_request" ||
      group.type === "follow_request_accepted"
    ) {
      if (actorUsername) {
        router.push(`/u/${actorUsername}`);
      }
      return;
    }

    if (group.targetType === "event") {
      router.push(`/events/${encodeURIComponent(group.targetId)}`);
      return;
    }

    if (group.targetType === "community") {
      const { data: community } = await supabase
        .from("communities")
        .select("slug")
        .eq("id", group.targetId)
        .maybeSingle();

      if (community?.slug) {
        router.push(`/community/${community.slug}`);
      } else {
        router.push("/community");
      }
      return;
    }

    if (group.type === "story_reply") {
      if (actorUsername) {
        router.push(`/messages/${actorUsername}`);
      }
      return;
    }

    if (group.type === "group_mention") {
      const { data: message } = await supabase
        .from("group_messages")
        .select("group_id")
        .eq("id", Number(group.targetId))
        .maybeSingle();

      if (message?.group_id) {
        router.push(`/messages/group/${message.group_id}`);
      }
      return;
    }

    if (
      group.targetType === "comment" ||
      group.targetType === "post_comment"
    ) {
      const { data: comment } = await supabase
        .from("comments")
        .select("id,post_id")
        .eq("id", Number(group.targetId))
        .maybeSingle();

      if (comment) {
        router.push(
          `/feed?post=${comment.post_id}&comment=${comment.id}`
        );
      }
      return;
    }

    if (group.postId) {
      router.push(`/feed?post=${group.postId}`);
      return;
    }

    if (group.targetType === "post") {
      router.push(`/feed?post=${encodeURIComponent(group.targetId)}`);
    }
  }

  async function acceptRequest(group: GroupedNotification) {
    if (!user || requestBusy) return;

    const requestId = group.targetId;
    setRequestBusy(requestId);

    try {
      const { error } = await supabase.rpc(
        "accept_follow_request",
        {
          p_request_id: requestId,
        }
      );

      if (error) throw error;

      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "follow_request")
        .eq("target_id", requestId);

      await loadPage(0, true, false);
    } catch (error: any) {
      alert(error?.message || "No se pudo aceptar.");
    } finally {
      setRequestBusy(null);
    }
  }

  async function rejectRequest(group: GroupedNotification) {
    if (!user || requestBusy) return;

    const requestId = group.targetId;
    setRequestBusy(requestId);

    try {
      const { error } = await supabase
        .from("follow_requests")
        .delete()
        .eq("id", requestId)
        .eq("target_id", user.id);

      if (error) throw error;

      await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("type", "follow_request")
        .eq("target_id", requestId);

      await loadPage(0, true, false);
    } catch (error: any) {
      alert(error?.message || "No se pudo rechazar.");
    } finally {
      setRequestBusy(null);
    }
  }

  async function togglePreference(key: keyof Preferences) {
    if (!user || savingPreference) return;

    const next = {
      ...preferences,
      [key]: !preferences[key],
    };

    setPreferences(next);
    setSavingPreference(key);

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: user.id,
          ...next,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      setPreferences(preferences);
      alert(error.message);
    }

    setSavingPreference(null);
  }

  const tabs: Array<{
    id: FilterType;
    label: string;
  }> = [
    { id: "all", label: "Todo" },
    { id: "interactions", label: "Interacciones" },
    { id: "connections", label: "Conexiones" },
    { id: "mentions", label: "Menciones" },
  ];

  return (
    <AppShell>
      <main className="alumni-notifications-pro mx-auto w-full max-w-[860px]">
        <header className="alumni-notifications-header">
          <div className="min-w-0">
            <p className="alumni-notifications-eyebrow">
              Actividad
            </p>

            <h1>Notificaciones</h1>

            <p>
              Lo importante de tu red, agrupado para que puedas
              revisarlo sin ruido.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={unreadCount === 0}
              className="alumni-notification-header-action"
              title="Marcar todo como leído"
            >
              <CheckCheck size={17} />
              <span className="hidden sm:inline">
                Leer todo
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreferencesOpen(true)}
              className="alumni-notification-icon-button"
              aria-label="Preferencias de notificaciones"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </header>

        <nav className="alumni-notification-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-active={filter === tab.id ? "true" : "false"}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {unreadCount > 0 && (
          <div className="alumni-notification-unread-summary">
            <span />
            <strong>
              {unreadCount > 99 ? "99+" : unreadCount}
            </strong>
            <p>
              {unreadCount === 1
                ? "actividad sin leer"
                : "actividades sin leer"}
            </p>
          </div>
        )}

        {loadingRows ? (
          <NotificationsLoadingSkeleton />
        ) : filteredGroups.length === 0 ? (
          <div className="alumni-notifications-empty">
            <Bell size={28} />
            <strong>Todo al día.</strong>
            <p>
              Aquí aparecerán tus nuevas interacciones y conexiones.
            </p>
          </div>
        ) : (
          <div>
            {(["Hoy", "Ayer", "Anteriores"] as const).map(
              (section) => {
                const sectionGroups = byDate[section];

                if (!sectionGroups.length) return null;

                return (
                  <section
                    key={section}
                    className="alumni-notification-day"
                  >
                    <h2>{section}</h2>

                    <div>
                      {sectionGroups.map((group) => {
                        const Icon = iconFor(group);
                        const requestOpen =
                          group.type === "follow_request" &&
                          Boolean(pendingRequests[group.targetId]);

                        return (
                          <article
                            key={group.key}
                            className="alumni-notification-row"
                            data-unread={group.unread ? "true" : "false"}
                          >
                            <button
                              type="button"
                              className="alumni-notification-main"
                              onClick={() =>
                                void openNotification(group)
                              }
                            >
                              <span className="alumni-notification-avatars">
                                {group.actors
                                  .slice(0, 3)
                                  .map((actor, index) => (
                                    <span
                                      key={actor.id || index}
                                      style={{
                                        zIndex: 3 - index,
                                      }}
                                    >
                                      <AlumniAvatar
                                        src={actor.avatar_url}
                                        name={actor.username}
                                        alt=""
                                        className="h-full w-full"
                                        imageClassName="h-full w-full object-cover"
                                      />
                                    </span>
                                  ))}

                                {!group.actors.length && (
                                  <span>
                                    <Icon size={17} />
                                  </span>
                                )}

                                <i>
                                  <Icon size={11} />
                                </i>
                              </span>

                              <span className="alumni-notification-copy">
                                <span>
                                  <strong>
                                    {actorText(group)}
                                  </strong>{" "}
                                  {notificationCopy(group)}
                                </span>

                                <small>
                                  {relativeTime(group.latestAt)}
                                  {group.items.length > 1
                                    ? ` · ${group.items.length} actividades`
                                    : ""}
                                </small>
                              </span>

                              {group.previewUrl && (
                                <span className="alumni-notification-preview">
                                  <AlumniImage
                                    src={group.previewUrl}
                                    alt=""
                                    shellClassName="h-full w-full"
                                    className="h-full w-full object-cover"
                                  />
                                </span>
                              )}

                              {group.unread && (
                                <span className="alumni-notification-dot" />
                              )}
                            </button>

                            {requestOpen && (
                              <div className="alumni-notification-request-actions">
                                <button
                                  type="button"
                                  onClick={() =>
                                    void acceptRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Aceptar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    void rejectRequest(group)
                                  }
                                  disabled={
                                    requestBusy === group.targetId
                                  }
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}

                            <InvitationNotificationActions
                              type={group.type}
                              targetId={group.targetId}
                              actorId={group.actors[0]?.id || null}
                              onDone={() =>
                                loadPage(0, true, false)
                              }
                            />
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              }
            )}

            {hasMore && filter === "all" && (
              <div className="alumni-notification-load-more">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() =>
                    void loadPage(page + 1, false)
                  }
                >
                  <ChevronDown size={16} />
                  {loadingMore
                    ? "Cargando..."
                    : "Ver actividad anterior"}
                </button>
              </div>
            )}
          </div>
        )}

        {preferencesOpen && (
          <div
            className="alumni-notification-settings-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setPreferencesOpen(false);
              }
            }}
          >
            <section
              className="alumni-notification-settings"
              role="dialog"
              aria-modal="true"
              aria-label="Preferencias de notificaciones"
            >
              <header>
                <div>
                  <p>Preferencias</p>
                  <h2>Qué quieres recibir</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setPreferencesOpen(false)}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </header>

              <div className="alumni-notification-preferences-list">
                {(
                  [
                    [
                      "enabled",
                      "Notificaciones",
                      "Control general de la bandeja.",
                    ],
                    [
                      "interactions",
                      "Interacciones",
                      "Likes, comentarios y compartidos.",
                    ],
                    [
                      "connections",
                      "Conexiones",
                      "Seguidores y solicitudes.",
                    ],
                    [
                      "mentions",
                      "Menciones",
                      "Cuando alguien escribe tu @usuario.",
                    ],
                    [
                      "stories",
                      "Historias",
                      "Respuestas y actividad de historias.",
                    ],
                    [
                      "groups",
                      "Grupos",
                      "Menciones y actividad importante en grupos.",
                    ],
                  ] as Array<
                    [
                      keyof Preferences,
                      string,
                      string
                    ]
                  >
                ).map(([key, title, description]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      void togglePreference(key)
                    }
                    disabled={Boolean(savingPreference)}
                  >
                    <span>
                      <strong>{title}</strong>
                      <small>{description}</small>
                    </span>

                    <i
                      data-on={
                        preferences[key] ? "true" : "false"
                      }
                    >
                      <b />
                    </i>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_1_7_0_NOTIFICATIONS_ACTIVITY_2 */

/* ALUMNI_2_1_2_NOTIFICATION_INVITES */

/* ALUMNI_2_7_0_LOADING_STATES:NOTIFICATIONS */

/* ALUMNI_2_9_0_IMAGE_LAYER:NOTIFICATIONS */
