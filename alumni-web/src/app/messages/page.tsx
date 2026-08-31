"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  ChevronRight,
  Image as ImageIcon,
  MessageCircle,
  Search,
  SquarePen,
  Users,
  Video,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import CreateMessageGroupModal from "@/components/messages/CreateMessageGroupModal";

type Conversation = {
  id: string;
  username: string;
  avatar_url: string | null;
  university: string | null;
  career: string | null;
  lastMessage: any;
  unreadCount: number;
};

type InboxFilter = "all" | "unread";

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<InboxFilter>("all");
  const [
    loadingConversations,
    setLoadingConversations,
  ] = useState(true);

  const [
    groups,
    setGroups,
  ] = useState<any[]>([]);

  const [
    groupModalOpen,
    setGroupModalOpen,
  ] = useState(false);

  const inboxRequestRef =
    useRef(0);

  const inboxRefreshTimerRef =
    useRef<number | null>(
      null
    );

  const pendingInboxRefreshRef =
    useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      void loadConversations(false);
      void loadGroups();
    }
  }, [user?.id]);

  async function loadGroups() {
    if (!user) return;

    const {
      data,
      error,
    } =
      await supabase.rpc(
        "get_my_message_groups"
      );

    if (error) {
      console.error(
        "Groups:",
        error
      );
      return;
    }

    const rows =
      data || [];

    const groupIds =
      rows
        .map(
          (group: any) =>
            group.group_id
        )
        .filter(Boolean);

    if (!groupIds.length) {
      setGroups([]);
      return;
    }

    const {
      data:
        groupRows,
    } =
      await supabase
        .from(
          "message_groups"
        )
        .select(
          "id,avatar_path,avatar_updated_at"
        )
        .in(
          "id",
          groupIds
        );

    const avatarRows =
      groupRows || [];

    const avatarPaths =
      avatarRows
        .map(
          (group: any) =>
            group.avatar_path
        )
        .filter(Boolean);

    const avatarUrlByPath =
      new Map<string,string>();

    if (avatarPaths.length) {
      const {
        data:
          signedRows,
      } =
        await supabase.storage
          .from(
            "group-message-media"
          )
          .createSignedUrls(
            avatarPaths,
            3600
          );

      for (const signed of signedRows || []) {
        if (
          signed.path &&
          signed.signedUrl
        ) {
          avatarUrlByPath.set(
            signed.path,
            signed.signedUrl
          );
        }
      }
    }

    const avatarByGroup =
      new Map<string,string>();

    for (const group of avatarRows) {
      if (group.avatar_path) {
        avatarByGroup.set(
          group.id,
          avatarUrlByPath.get(
            group.avatar_path
          ) || ""
        );
      }
    }

    setGroups(
      rows.map(
        (group: any) => ({
          ...group,
          avatar_url:
            avatarByGroup.get(
              group.group_id
            ) || "",
        })
      )
    );
  }

  useEffect(() => {
    if (!user) return;

    const refresh = () => {
      if (
        document.visibilityState !==
        "visible"
      ) {
        pendingInboxRefreshRef.current =
          true;
        return;
      }

      pendingInboxRefreshRef.current =
        false;

      if (
        inboxRefreshTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          inboxRefreshTimerRef.current
        );
      }

      inboxRefreshTimerRef.current =
        window.setTimeout(
          () => {
            inboxRefreshTimerRef.current =
              null;

            void loadConversations(
              true
            );
          },
          220
        );
    };

    const handleVisibility = () => {
      if (
        document.visibilityState ===
          "visible" &&
        pendingInboxRefreshRef.current
      ) {
        refresh();
      }
    };

    const handleOnline = () => {
      refresh();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    window.addEventListener(
      "online",
      handleOnline
    );

    const channel = supabase
      .channel(
        `message-inbox:${user.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "group_messages",
        },
        () => {
          void loadGroups();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table:
            "message_groups",
        },
        () => {
          void loadGroups();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      if (
        inboxRefreshTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          inboxRefreshTimerRef.current
        );
      }

      inboxRequestRef.current +=
        1;

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      window.removeEventListener(
        "online",
        handleOnline
      );

      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadConversations(
    silent = false
  ) {
    if (!user) return;

    const requestId =
      ++inboxRequestRef.current;

    if (!silent) {
      setLoadingConversations(true);
    }

    const {
      data,
      error,
    } = await supabase.rpc(
      "get_my_direct_conversations"
    );

    if (
      requestId !==
      inboxRequestRef.current
    ) {
      return;
    }

    if (error) {
      console.error(
        "[Alumni Messages] inbox:",
        error
      );

      if (!silent) {
        setConversations([]);
      }

      setLoadingConversations(false);
      return;
    }

    const merged = (
      data || []
    ).map(
      (row: any) => ({
        id: row.peer_id,
        username: row.username,
        avatar_url:
          row.avatar_url || null,
        university:
          row.university || null,
        career:
          row.career || null,
        unreadCount:
          Number(
            row.unread_count || 0
          ),
        lastMessage: {
          id:
            row.last_message_id,
          sender_id:
            row.last_sender_id,
          receiver_id:
            row.last_receiver_id,
          content:
            row.last_content,
          message_type:
            row.last_message_type,
          media_type:
            row.last_media_type,
          media_name:
            row.last_media_name,
          read_at:
            row.last_read_at,
          created_at:
            row.last_created_at,
        },
      })
    ) as Conversation[];

    if (
      requestId !==
      inboxRequestRef.current
    ) {
      return;
    }

    setConversations(merged);
    setLoadingConversations(false);
  }

  const unreadTotal = useMemo(
    () =>
      conversations.reduce(
        (total, item) =>
          total + item.unreadCount,
        0
      ) +
      groups.reduce(
        (total, item) =>
          total +
          Number(
            item.unread_count ||
              0
          ),
        0
      ),
    [conversations, groups]
  );

  const visibleGroups =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      return groups.filter(
        (group) => {
          if (
            filter ===
              "unread" &&
            Number(
              group.unread_count ||
                0
            ) === 0
          ) {
            return false;
          }

          if (!value) {
            return true;
          }

          return [
            group.name,
            group.last_message_content,
            group.last_sender_username,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(
                  value
                )
            );
        }
      );
    }, [
      groups,
      search,
      filter,
    ]);

  const filteredConversations =
    useMemo(() => {
      const value = search
        .trim()
        .toLowerCase();

      return conversations.filter(
        (conversation) => {
          if (
            filter === "unread" &&
            conversation.unreadCount === 0
          ) {
            return false;
          }

          if (!value) {
            return true;
          }

          return [
            conversation.username,
            conversation.university,
            conversation.career,
            conversation.lastMessage
              ?.content,
            conversation.lastMessage
              ?.media_name,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(value)
            );
        }
      );
    }, [
      conversations,
      search,
      filter,
    ]);

  function formatTime(date?: string) {
    if (!date) return "";

    const parsed = new Date(date);
    const now = new Date();

    const sameDay =
      parsed.toDateString() ===
      now.toDateString();

    if (sameDay) {
      return parsed.toLocaleTimeString(
        "es-SV",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    }

    const yesterday =
      new Date(now);
    yesterday.setDate(
      now.getDate() - 1
    );

    if (
      parsed.toDateString() ===
      yesterday.toDateString()
    ) {
      return "Ayer";
    }

    return parsed.toLocaleDateString(
      "es-SV",
      {
        day: "numeric",
        month: "short",
      }
    );
  }

  function preview(
    conversation: Conversation
  ) {
    const message =
      conversation.lastMessage;

    if (!message) {
      return {
        text: "Sin mensajes todavía",
        icon: null,
      };
    }

    const mine =
      message.sender_id === user?.id;

    if (
      message.message_type ===
      "story_reply"
    ) {
      return {
        text: `${
          mine ? "Tú: " : ""
        }Respuesta a una historia`,
        icon: (
          <MessageCircle
            size={13}
          />
        ),
      };
    }

    if (
      message.media_type ===
        "image" ||
      message.message_type ===
        "image"
    ) {
      return {
        text: `${
          mine ? "Tú: " : ""
        }Foto${
          message.content
            ? ` · ${message.content}`
            : ""
        }`,
        icon: (
          <ImageIcon
            size={13}
          />
        ),
      };
    }

    if (
      message.media_type ===
        "video" ||
      message.message_type ===
        "video"
    ) {
      return {
        text: `${
          mine ? "Tú: " : ""
        }Video${
          message.content
            ? ` · ${message.content}`
            : ""
        }`,
        icon: (
          <Video size={13} />
        ),
      };
    }

    return {
      text: `${
        mine ? "Tú: " : ""
      }${message.content || ""}`,
      icon:
        mine &&
        message.read_at ? (
          <CheckCheck
            size={13}
          />
        ) : null,
    };
  }

  return (
    <AppShell>
      <div className="alumni-messages-page mx-auto w-full max-w-[820px]">
        <div className="flex items-end gap-4 pb-5 pt-1 sm:pb-7 sm:pt-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-[30px] font-black tracking-[-0.045em] text-[var(--app-text)] sm:text-[34px]">
                Mensajes
              </h1>

              {unreadTotal > 0 && (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--app-accent)] px-2 py-1 text-[10px] font-black text-[var(--app-on-accent)]">
                  {unreadTotal >
                  99
                    ? "99+"
                    : unreadTotal}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-[var(--app-muted-2)]">
              Conversaciones de tu comunidad Alumni.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setGroupModalOpen(
                  true
                )
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app-accent)] transition hover:bg-[var(--app-accent-soft)] active:scale-95"
              aria-label="Crear grupo"
              title="Crear grupo"
            >
              <Users
                size={18}
              />
            </button>

            <Link
              href="/explore"
              className="alumni-message-new flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-[var(--app-on-accent)] shadow-[0_10px_28px_color-mix(in_srgb,var(--app-accent)_24%,transparent)] transition active:scale-95"
              aria-label="Nuevo mensaje"
              title="Nuevo mensaje"
            >
              <SquarePen
                size={18}
              />
            </Link>
          </div>
        </div>

        <div className="alumni-messages-search flex h-12 items-center gap-2 border-b border-[var(--app-border)]">
          <Search
            size={17}
            className="shrink-0 text-[var(--app-muted-2)]"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar personas o mensajes"
            className="alumni-mobile-input h-full min-w-0 flex-1 bg-transparent text-[15px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)]"
          />
        </div>

        <div className="flex items-center gap-5 border-b border-[var(--app-border)] py-3">
          <button
            type="button"
            onClick={() =>
              setFilter("all")
            }
            className={`relative py-1 text-[13px] font-black transition ${
              filter === "all"
                ? "text-[var(--app-text)]"
                : "text-[var(--app-muted-2)]"
            }`}
          >
            Todos
            {filter ===
              "all" && (
              <span className="absolute -bottom-3 left-0 right-0 h-[2px] rounded-full bg-[var(--app-accent)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              setFilter("unread")
            }
            className={`relative py-1 text-[13px] font-black transition ${
              filter ===
              "unread"
                ? "text-[var(--app-text)]"
                : "text-[var(--app-muted-2)]"
            }`}
          >
            No leídos
            {filter ===
              "unread" && (
              <span className="absolute -bottom-3 left-0 right-0 h-[2px] rounded-full bg-[var(--app-accent)]" />
            )}
          </button>
        </div>

        {visibleGroups.length > 0 && (
          <section className="border-b border-[var(--app-border)] py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[var(--app-muted-2)]">
                Grupos
              </p>

            </div>

            <div className="divide-y divide-[var(--app-border)]">
              {visibleGroups.map(
                (group) => {
                  const unread =
                    Number(
                      group.unread_count ||
                        0
                    );

                  const preview =
                    group.last_message_type ===
                    "image"
                      ? "Foto"
                      : group.last_message_type ===
                        "video"
                      ? "Video"
                      : group.last_message_content ||
                        "Grupo creado";

                  return (
                    <Link
                      key={
                        group.group_id
                      }
                      href={`/messages/group/${group.group_id}`}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <span className="flex h-[50px] w-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[var(--app-border)]">
                        {group.avatar_url ? (
                          <img
                            src={
                              group.avatar_url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Users
                            size={20}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <p className="truncate text-[15px] font-black text-[var(--app-text)]">
                            {
                              group.name
                            }
                          </p>

                          {unread >
                            0 && (
                            <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--app-accent)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-on-accent)]">
                              {unread >
                              9
                                ? "9+"
                                : unread}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-2)]">
                          {
                            group.member_count
                          } miembros
                          {group.last_sender_username
                            ? ` · @${group.last_sender_username}`
                            : ""}
                        </p>

                        <p className="mt-1 truncate text-[13px] text-[var(--app-muted)]">
                          {preview}
                        </p>
                      </div>
                    </Link>
                  );
                }
              )}
            </div>
          </section>
        )}

        {loadingConversations ? (
          <div className="divide-y divide-[var(--app-border)]">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3.5 py-4"
              >
                <div className="h-13 w-13 shrink-0 animate-pulse rounded-full bg-[var(--app-soft-strong)]" />

                <div className="min-w-0 flex-1">
                  <div className="h-3.5 w-32 animate-pulse rounded-full bg-[var(--app-soft-strong)]" />
                  <div className="mt-3 h-3 w-[72%] animate-pulse rounded-full bg-[var(--app-soft)]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length ===
          0 ? (
          <div className="py-16 text-center sm:py-20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted)]">
              <MessageCircle
                size={23}
              />
            </div>

            <h2 className="mt-4 text-[15px] font-black text-[var(--app-text-soft)]">
              {search
                ? "No encontramos conversaciones"
                : filter ===
                  "unread"
                ? "Todo está al día"
                : "Todavía no tienes conversaciones"}
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--app-muted-2)]">
              {search
                ? "Prueba con otro nombre, carrera, universidad o texto."
                : filter ===
                  "unread"
                ? "No tienes mensajes pendientes por leer."
                : "Explora perfiles y comienza una conversación con alguien de la comunidad."}
            </p>

            {!search &&
              filter ===
                "all" && (
                <Link
                  href="/explore"
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-[var(--app-accent)] px-4 text-sm font-black text-[var(--app-on-accent)]"
                >
                  Explorar personas
                </Link>
              )}
          </div>
        ) : (
          <div className="divide-y divide-[var(--app-border)]">
            {filteredConversations.map(
              (conversation) => {
                const item =
                  preview(
                    conversation
                  );

                const unread =
                  conversation.unreadCount >
                  0;

                return (
                  <Link
                    key={
                      conversation.id
                    }
                    href={`/messages/${conversation.username}`}
                    className={`alumni-conversation-row group relative flex items-center gap-3.5 py-4 transition sm:py-4.5 ${
                      unread
                        ? "alumni-conversation-unread"
                        : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                        {conversation.avatar_url ? (
                          <img
                            src={
                              conversation.avatar_url
                            }
                            alt={
                              conversation.username
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          conversation.username
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "U"
                        )}
                      </div>

                      {unread && (
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-[var(--app-bg)] bg-[var(--app-accent)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p
                          className={`truncate text-[15px] ${
                            unread
                              ? "font-black text-[var(--app-text)]"
                              : "font-bold text-[var(--app-text-soft)]"
                          }`}
                        >
                          @
                          {
                            conversation.username
                          }
                        </p>

                        <span
                          className={`ml-auto shrink-0 text-[11px] ${
                            unread
                              ? "font-black text-[var(--app-accent)]"
                              : "text-[var(--app-muted-3)]"
                          }`}
                        >
                          {formatTime(
                            conversation
                              .lastMessage
                              ?.created_at
                          )}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-3)]">
                        {[
                          conversation.career,
                          conversation.university,
                        ]
                          .filter(Boolean)
                          .join(
                            " · "
                          ) ||
                          "Comunidad Alumni"}
                      </p>

                      <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                        {item.icon && (
                          <span
                            className={`shrink-0 ${
                              unread
                                ? "text-[var(--app-accent)]"
                                : "text-[var(--app-muted-3)]"
                            }`}
                          >
                            {
                              item.icon
                            }
                          </span>
                        )}

                        <p
                          className={`truncate text-[14px] ${
                            unread
                              ? "font-semibold text-[var(--app-text-soft)]"
                              : "text-[var(--app-muted)]"
                          }`}
                        >
                          {
                            item.text
                          }
                        </p>

                        {unread && (
                          <span className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] px-1.5 py-0.5 text-[9px] font-black text-[var(--app-on-accent)]">
                            {conversation.unreadCount >
                            9
                              ? "9+"
                              : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={16}
                      className="shrink-0 text-[var(--app-muted-3)] transition group-hover:translate-x-0.5"
                    />
                  </Link>
                );
              }
            )}
          </div>
        )}
      </div>
      <CreateMessageGroupModal
        open={
          groupModalOpen
        }
        onClose={() =>
          setGroupModalOpen(
            false
          )
        }
      />
    </AppShell>
  );
}

/* ALUMNI_1_2_3_SCROLL_MESSAGES_STABILITY:INBOX */

/* ALUMNI_1_3_0_GROUPS_MEDIA_PRO:INBOX */

/* ALUMNI_1_3_3_VISUAL_UX_HOTFIX:INBOX */

/* ALUMNI_1_3_6_CHAT_STABILITY_MEDIA_SPOTIFY:GROUP_AVATAR */

/* ALUMNI_3_7_2_MESSAGING_PERFORMANCE_RELIABILITY */
