"use client";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Send,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";
import DeferredMessageMedia from "@/components/messages/DeferredMessageMedia";
import GroupAdminPanel from "@/components/messages/GroupAdminPanel";
import MessageProTools from "@/components/messages/MessageProTools";
import {
  ComposerReplyPreview,
  MessageReplyQuote,
  SwipeToReply,
} from "@/components/messages/MessageReplyExperience";
import {
  createMessageMediaPreview,
} from "@/lib/messageMedia";
import {
  outboxFor,
  queueOutbox,
  removeOutbox,
} from "@/lib/messageOutbox";
import {
  supabase,
} from "@/lib/supabase";

const BUCKET =
  "group-message-media";
const MESSAGE_PAGE_SIZE =
  50;

type Member = {
  user_id: string;
  role: string;
  last_read_at: string;
  username: string;
  avatar_url:
    | string
    | null;
};

function time(
  date: string
) {
  return new Date(
    date
  ).toLocaleTimeString(
    "es-SV",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export default function GroupChatPage() {
  const params =
    useParams();

  const groupId =
    String(
      params.id || ""
    );

  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const [group, setGroup] =
    useState<any>(null);

  const [
    groupAvatarUrl,
    setGroupAvatarUrl,
  ] = useState("");
  const [members, setMembers] =
    useState<Member[]>([]);
  const [messages, setMessages] =
    useState<any[]>([]);
  const [loadingChat, setLoadingChat] =
    useState(true);
  const [text, setText] =
    useState("");
  const [sending, setSending] =
    useState(false);
  const [replyingTo, setReplyingTo] =
    useState<any>(null);
  const [mediaFile, setMediaFile] =
    useState<
      File | null
    >(null);
  const [mediaPreview, setMediaPreview] =
    useState("");
  const [typingName, setTypingName] =
    useState("");

  const [
    groupInfoOpen,
    setGroupInfoOpen,
  ] = useState(false);

  const [
    editingMessage,
    setEditingMessage,
  ] = useState<any>(null);

  const [
    hasMoreHistory,
    setHasMoreHistory,
  ] = useState(true);

  const [
    loadingOlder,
    setLoadingOlder,
  ] = useState(false);

  const [
    unreadBoundaryId,
    setUnreadBoundaryId,
  ] = useState<number | null>(null);

  const [
    newBelowCount,
    setNewBelowCount,
  ] = useState(0);

  const [
    flashMessageId,
    setFlashMessageId,
  ] = useState<number | null>(null);

  const fileRef =
    useRef<HTMLInputElement>(
      null
    );
  const textareaRef =
    useRef<HTMLTextAreaElement>(
      null
    );
  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const stickToBottomRef =
    useRef(true);

  const membersRef =
    useRef<Member[]>([]);

  const lastTypingBroadcastRef =
    useRef(0);

  const pendingReactionKeysRef =
    useRef<Set<string>>(
      new Set()
    );

  const suppressOwnInsertUntilRef =
    useRef(0);
  const channelRef =
    useRef<any>(null);
  const typingTimerRef =
    useRef<number | null>(
      null
    );
  const refreshTimerRef =
    useRef<number | null>(
      null
    );
  const requestRef =
    useRef(0);

  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.push(
        "/login"
      );
    }
  }, [
    user,
    loading,
    router,
  ]);

  useEffect(() => {
    if (
      !user ||
      !groupId
    ) {
      return;
    }

    void load(true);

    const channel =
      supabase
        .channel(
          `group-chat:${groupId}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema:
              "public",
            table:
              "group_messages",
            filter:
              `group_id=eq.${groupId}`,
          },
          (payload: any) => {
            const row =
              payload?.new ||
              payload?.old;

            if (!row?.id) {
              return;
            }

            if (
              payload?.eventType ===
                "INSERT"
            ) {
              if (
                row.sender_id ===
                  user.id &&
                Date.now() <
                  suppressOwnInsertUntilRef.current
              ) {
                return;
              }

              const member =
                membersRef.current.find(
                  (item) =>
                    item.user_id ===
                    row.sender_id
                );

              setMessages(
                (current) => {
                  if (
                    current.some(
                      (message) =>
                        message.id ===
                        row.id
                    )
                  ) {
                    return current;
                  }

                  return [
                    ...current,
                    {
                      ...row,
                      sender_profile:
                        member
                          ? {
                              id:
                                member.user_id,
                              username:
                                member.username,
                              avatar_url:
                                member.avatar_url,
                            }
                          : null,
                      reactions: [],
                    },
                  ];
                }
              );

              if (
                row.sender_id !==
                user.id
              ) {
                void supabase.rpc(
                  "mark_message_group_read",
                  {
                    p_group_id:
                      groupId,
                  }
                );
              }

              if (
                stickToBottomRef.current
              ) {
                setNewBelowCount(0);

                window.requestAnimationFrame(
                  () =>
                    scrollBottom(
                      "smooth"
                    )
                );
              } else if (
                row.sender_id !==
                user.id
              ) {
                setNewBelowCount(
                  (count) =>
                    count + 1
                );
              }

              return;
            }

            if (
              payload?.eventType ===
                "UPDATE"
            ) {
              setMessages(
                (current) =>
                  current.map(
                    (message) =>
                      message.id ===
                      row.id
                        ? {
                            ...message,
                            ...row,
                            sender_profile:
                              message.sender_profile,
                            reactions:
                              message.reactions ||
                              [],
                          }
                        : message
                  )
              );

              return;
            }

            if (
              payload?.eventType ===
                "DELETE"
            ) {
              setMessages(
                (current) =>
                  current.filter(
                    (message) =>
                      message.id !==
                      row.id
                  )
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema:
              "public",
            table:
              "message_group_members",
            filter:
              `group_id=eq.${groupId}`,
          },
          (payload: any) => {
            const row =
              payload?.new;

            if (!row?.user_id) {
              return;
            }

            setMembers(
              (current) => {
                const next =
                  current.map(
                    (member) =>
                      member.user_id ===
                      row.user_id
                        ? {
                            ...member,
                            role:
                              row.role ??
                              member.role,
                            last_read_at:
                              row.last_read_at ??
                              member.last_read_at,
                          }
                        : member
                  );

                membersRef.current =
                  next;

                return next;
              }
            );
          }
        )
        .on(
          "broadcast",
          {
            event:
              "typing",
          },
          ({
            payload,
          }: any) => {
            if (
              payload?.user_id !==
              user.id
            ) {
              setTypingName(
                payload?.typing
                  ? String(
                      payload?.username ||
                        "Alguien"
                    )
                  : ""
              );
            }
          }
        )
        .subscribe();

    channelRef.current =
      channel;

    return () => {
      requestRef.current +=
        1;

      if (
        typingTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          typingTimerRef.current
        );
      }

      if (
        refreshTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          refreshTimerRef.current
        );
      }

      channelRef.current =
        null;

      supabase.removeChannel(
        channel
      );
    };
  }, [
    user?.id,
    groupId,
  ]);

  useEffect(() => {
    if (
      messages.length &&
      stickToBottomRef.current
    ) {
      window.requestAnimationFrame(
        () =>
          scrollBottom(
            "auto"
          )
      );
    }
  }, [
    messages.length,
  ]);

  useEffect(() => {
    return () => {
      if (
        mediaPreview.startsWith(
          "blob:"
        )
      ) {
        URL.revokeObjectURL(
          mediaPreview
        );
      }
    };
  }, [mediaPreview]);

  useEffect(() => {
    if (!user) return;

    const key =
      `alumni:draft:group:${user.id}:${groupId}`;

    const saved =
      localStorage.getItem(
        key
      );

    if (saved && !text) {
      setText(saved);
    }
  }, [user?.id, groupId]);

  useEffect(() => {
    if (!user) return;

    const key =
      `alumni:draft:group:${user.id}:${groupId}`;

    if (text) {
      localStorage.setItem(
        key,
        text
      );
    } else {
      localStorage.removeItem(
        key
      );
    }
  }, [
    user?.id,
    groupId,
    text,
  ]);

  useEffect(() => {
    if (!user || !groupId) return;

    const flush = async () => {
      if (!navigator.onLine) return;

      const queued =
        outboxFor(
          "group",
          groupId
        );

      for (const item of queued) {
        const { error } =
          await supabase
            .from(
              "group_messages"
            )
            .insert({
              group_id:
                groupId,
              sender_id:
                user.id,
              content:
                item.content,
              message_type:
                "text",
              reply_to_id:
                item.replyToId ||
                null,
            });

        if (!error) {
          removeOutbox(
            item.id
          );
        }
      }

      scheduleRefresh();
    };

    void flush();

    window.addEventListener(
      "online",
      flush
    );

    return () => {
      window.removeEventListener(
        "online",
        flush
      );
    };
  }, [
    user?.id,
    groupId,
  ]);

  function scheduleRefresh() {
    if (
      refreshTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        refreshTimerRef.current
      );
    }

    refreshTimerRef.current =
      window.setTimeout(
        () => {
          refreshTimerRef.current =
            null;
          void load(false);
        },
        80
      );
  }

  async function load(
    showLoader = false
  ) {
    if (
      !user ||
      !groupId
    ) {
      return;
    }

    const requestId =
      ++requestRef.current;

    if (showLoader) {
      setLoadingChat(true);
    }

    const [
      groupResult,
      membersResult,
      messagesResult,
    ] = await Promise.all([
      supabase
        .from(
          "message_groups"
        )
        .select(
          "id,name,created_by,created_at,avatar_path,avatar_updated_at"
        )
        .eq(
          "id",
          groupId
        )
        .maybeSingle(),
      supabase
        .from(
          "message_group_members"
        )
        .select(
          "user_id,role,last_read_at"
        )
        .eq(
          "group_id",
          groupId
        ),
      supabase
        .from(
          "group_messages"
        )
        .select("*")
        .eq(
          "group_id",
          groupId
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          MESSAGE_PAGE_SIZE
        ),
    ]);

    if (
      requestId !==
      requestRef.current
    ) {
      return;
    }

    if (
      groupResult.error ||
      !groupResult.data
    ) {
      setGroup(null);
      setLoadingChat(false);
      return;
    }

    const memberRows =
      membersResult.data ||
      [];

    const profileIds =
      [
        ...new Set(
          memberRows.map(
            (row: any) =>
              row.user_id
          )
        ),
      ];

    const senderIds =
      [
        ...new Set(
          (
            messagesResult.data ||
            []
          ).map(
            (row: any) =>
              row.sender_id
          )
        ),
      ];

    const allProfileIds =
      [
        ...new Set([
          ...profileIds,
          ...senderIds,
        ]),
      ];

    let profiles: any[] =
      [];

    if (
      allProfileIds.length
    ) {
      const {
        data,
      } =
        await supabase
          .from("profiles")
          .select(
            "id,username,avatar_url"
          )
          .in(
            "id",
            allProfileIds
          );

      profiles =
        data || [];
    }

    if (
      requestId !==
      requestRef.current
    ) {
      return;
    }

    const profileMap =
      new Map(
        profiles.map(
          (profile) => [
            profile.id,
            profile,
          ]
        )
      );

    const nextMembers =
      memberRows.map(
        (row: any) => ({
          ...row,
          username:
            profileMap.get(
              row.user_id
            )?.username ||
            "usuario",
          avatar_url:
            profileMap.get(
              row.user_id
            )?.avatar_url ||
            null,
        })
      ) as Member[];

    let nextMessages =
      [
        ...(messagesResult.data ||
          []),
      ]
        .reverse()
        .map(
        (message: any) => ({
          ...message,
          sender_profile:
            profileMap.get(
              message.sender_id
            ) || null,
          reactions: [],
        })
      );

    setHasMoreHistory(
      (messagesResult.data ||
        []).length ===
        MESSAGE_PAGE_SIZE
    );

    const groupHiddenIds =
      nextMessages.map(
        (message: any) =>
          message.id
      );

    if (groupHiddenIds.length) {
      const {
        data:
          hiddenRows,
      } = await supabase
        .from(
          "message_hidden_users"
        )
        .select(
          "message_id"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "message_scope",
          "group"
        )
        .in(
          "message_id",
          groupHiddenIds
        );

      const hidden =
        new Set(
          (hiddenRows || []).map(
            (row: any) =>
              Number(
                row.message_id
              )
          )
        );

      nextMessages =
        nextMessages.filter(
          (message: any) =>
            !hidden.has(
              Number(
                message.id
              )
            )
        );
    }

    if (
      showLoader &&
      unreadBoundaryId === null
    ) {
      const ownMember =
        memberRows.find(
          (row: any) =>
            row.user_id ===
            user.id
        );

      const lastRead =
        ownMember?.last_read_at
          ? new Date(
              ownMember.last_read_at
            ).getTime()
          : 0;

      const firstUnread =
        nextMessages.find(
          (message: any) =>
            message.sender_id !==
              user.id &&
            new Date(
              message.created_at
            ).getTime() >
              lastRead
        );

      if (firstUnread) {
        setUnreadBoundaryId(
          Number(
            firstUnread.id
          )
        );
      }
    }

    const messageIds =
      nextMessages.map(
        (message: any) =>
          message.id
      );

    let reactions: any[] =
      [];

    if (messageIds.length) {
      const {
        data,
      } =
        await supabase
          .from(
            "group_message_reactions"
          )
          .select(
            "message_id,user_id,emoji"
          )
          .in(
            "message_id",
            messageIds
          );

      reactions =
        data || [];
    }

    const reactionMap =
      new Map<
        number,
        any[]
      >();

    for (
      const reaction of
      reactions
    ) {
      const current =
        reactionMap.get(
          reaction.message_id
        ) || [];

      current.push(
        reaction
      );

      reactionMap.set(
        reaction.message_id,
        current
      );
    }

    let nextGroupAvatarUrl =
      "";

    if (
      groupResult.data
        .avatar_path
    ) {
      const {
        data:
          avatarSigned,
      } =
        await supabase.storage
          .from(BUCKET)
          .createSignedUrl(
            groupResult.data
              .avatar_path,
            3600
          );

      nextGroupAvatarUrl =
        avatarSigned?.signedUrl ||
        "";
    }

    setGroup({
      ...groupResult.data,
      avatar_url:
        nextGroupAvatarUrl,
    });

    setGroupAvatarUrl(
      nextGroupAvatarUrl
    );

    membersRef.current =
      nextMembers;

    setMembers(
      nextMembers
    );

    setMessages(
      nextMessages.map(
        (message: any) => ({
          ...message,
          reactions:
            reactionMap.get(
              message.id
            ) || [],
        })
      )
    );

    setLoadingChat(false);

    void supabase.rpc(
      "mark_message_group_read",
      {
        p_group_id:
          groupId,
      }
    );
  }

  function scrollBottom(
    behavior:
      ScrollBehavior
  ) {
    const target =
      scrollRef.current;

    if (!target) return;

    target.scrollTo({
      top:
        target.scrollHeight,
      behavior,
    });
  }

  async function loadOlderMessages() {
    if (
      !user ||
      loadingOlder ||
      !hasMoreHistory ||
      !messages.length
    ) {
      return;
    }

    const oldest =
      messages.find(
        (message) =>
          Number(
            message.id
          ) > 0
      );

    if (!oldest) return;

    const target =
      scrollRef.current;
    const oldHeight =
      target?.scrollHeight || 0;
    const oldTop =
      target?.scrollTop || 0;

    setLoadingOlder(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          "group_messages"
        )
        .select("*")
        .eq(
          "group_id",
          groupId
        )
        .lt(
          "created_at",
          oldest.created_at
        )
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .limit(
          MESSAGE_PAGE_SIZE
        );

      if (error) throw error;

      const rows =
        [...(data || [])].reverse();

      setHasMoreHistory(
        (data || []).length ===
          MESSAGE_PAGE_SIZE
      );

      if (!rows.length) return;

      const ids =
        rows.map(
          (message: any) =>
            message.id
        );

      const senderIds =
        [
          ...new Set(
            rows.map(
              (message: any) =>
                message.sender_id
            )
          ),
        ];

      const [
        profilesResult,
        reactionsResult,
        hiddenResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id,username,avatar_url"
          )
          .in(
            "id",
            senderIds
          ),
        supabase
          .from(
            "group_message_reactions"
          )
          .select(
            "message_id,user_id,emoji"
          )
          .in(
            "message_id",
            ids
          ),
        supabase
          .from(
            "message_hidden_users"
          )
          .select(
            "message_id"
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "message_scope",
            "group"
          )
          .in(
            "message_id",
            ids
          ),
      ]);

      const profiles =
        new Map(
          (
            profilesResult.data ||
            []
          ).map(
            (profile: any) => [
              profile.id,
              profile,
            ]
          )
        );

      const hidden =
        new Set(
          (
            hiddenResult.data ||
            []
          ).map(
            (row: any) =>
              Number(
                row.message_id
              )
          )
        );

      const reactions =
        new Map<
          number,
          any[]
        >();

      for (
        const reaction of
        reactionsResult.data ||
        []
      ) {
        const current =
          reactions.get(
            reaction.message_id
          ) || [];

        current.push(
          reaction
        );
        reactions.set(
          reaction.message_id,
          current
        );
      }

      const older =
        rows
          .filter(
            (message: any) =>
              !hidden.has(
                Number(
                  message.id
                )
              )
          )
          .map(
            (message: any) => ({
              ...message,
              sender_profile:
                profiles.get(
                  message.sender_id
                ) || null,
              reactions:
                reactions.get(
                  message.id
                ) || [],
            })
          );

      setMessages(
        (current) => {
          const currentIds =
            new Set(
              current.map(
                (message) =>
                  message.id
              )
            );

          return [
            ...older.filter(
              (message) =>
                !currentIds.has(
                  message.id
                )
            ),
            ...current,
          ];
        }
      );

      window.requestAnimationFrame(
        () => {
          const next =
            scrollRef.current;

          if (!next) return;

          next.scrollTop =
            next.scrollHeight -
            oldHeight +
            oldTop;
        }
      );
    } catch (error) {
      console.error(
        "No se pudo cargar historial del grupo:",
        error
      );
    } finally {
      setLoadingOlder(false);
    }
  }

  function flashAndScrollToMessage(
    messageId: number
  ) {
    const element =
      document.getElementById(
        `group-message-${messageId}`
      );

    if (!element) {
      void loadOlderMessages().then(
        () => {
          window.setTimeout(
            () =>
              flashAndScrollToMessage(
                messageId
              ),
            40
          );
        }
      );
      return;
    }

    setFlashMessageId(
      messageId
    );

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(
      () =>
        setFlashMessageId(
          (current) =>
            current ===
            messageId
              ? null
              : current
        ),
      1400
    );
  }

  function clearMedia() {
    if (
      mediaPreview.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        mediaPreview
      );
    }

    setMediaFile(null);
    setMediaPreview("");

    if (fileRef.current) {
      fileRef.current.value =
        "";
    }
  }

  function selectMedia(
    file?: File
  ) {
    if (!file) return;

    const image =
      file.type.startsWith(
        "image/"
      );

    const video =
      file.type.startsWith(
        "video/"
      );

    if (
      !image &&
      !video
    ) {
      alert(
        "Solo puedes enviar fotos o videos."
      );
      return;
    }

    if (
      file.size >
      50 * 1024 * 1024
    ) {
      alert(
        "El archivo debe pesar 50 MB o menos."
      );
      return;
    }

    clearMedia();

    setMediaFile(file);
    setMediaPreview(
      URL.createObjectURL(
        file
      )
    );
  }

  async function uploadMedia(
    file: File
  ) {
    if (!user) {
      throw new Error(
        "Sesión no disponible."
      );
    }

    const mediaType =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "image";

    const cleanName =
      file.name
        .normalize("NFKD")
        .replace(
          /[^\w.\-]+/g,
          "_"
        )
        .slice(-120);

    const path =
      `${groupId}/${user.id}/${Date.now()}-${cleanName}`;

    const preview =
      await createMessageMediaPreview(
        file
      );

    const {
      error,
    } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            upsert: false,
            contentType:
              file.type,
          }
        );

    if (error) {
      throw error;
    }

    return {
      path,
      type:
        mediaType,
      mime:
        file.type,
      name:
        file.name ||
        null,
      preview,
      size:
        file.size,
    };
  }

  async function send(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    if (
      editingMessage
    ) {
      const value =
        text.trim();

      if (
        !value ||
        !user ||
        sending
      ) {
        return;
      }

      setSending(true);

      const { error } =
        await supabase.rpc(
          "alumni_edit_group_message",
          {
            p_message_id:
              editingMessage.id,
            p_content:
              value,
          }
        );

      setSending(false);

      if (error) {
        alert(
          error.message
        );
        return;
      }

      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              editingMessage.id
                ? {
                    ...message,
                    content:
                      value,
                    edited_at:
                      new Date()
                        .toISOString(),
                  }
                : message
          )
      );

      setEditingMessage(null);
      setText("");
      return;
    }

    if (
      !user ||
      sending ||
      (!text.trim() &&
        !mediaFile)
    ) {
      return;
    }

    const textToSend =
      text.trim();

    const fileToSend =
      mediaFile;

    if (
      typeof navigator !==
        "undefined" &&
      !navigator.onLine
    ) {
      if (fileToSend) {
        alert(
          "Sin conexión. El archivo se mantendrá listo para enviar cuando vuelvas a conectarte."
        );
        return;
      }

      const queueId =
        `group-${Date.now()}`;

      queueOutbox({
        id: queueId,
        scope: "group",
        conversationId:
          groupId,
        content:
          textToSend,
        replyToId:
          replyingTo?.id ||
          null,
        createdAt:
          new Date()
            .toISOString(),
      });

      const me =
        members.find(
          (member) =>
            member.user_id ===
            user.id
        );

      setMessages(
        (current) => [
          ...current,
          {
            id:
              -Date.now(),
            group_id:
              groupId,
            sender_id:
              user.id,
            content:
              textToSend,
            message_type:
              "text",
            reply_to_id:
              replyingTo?.id ||
              null,
            created_at:
              new Date()
                .toISOString(),
            sender_profile:
              me || null,
            reactions: [],
            _queued:
              true,
          },
        ]
      );

      setText("");
      setReplyingTo(null);
      stickToBottomRef.current =
        true;
      scrollBottom(
        "smooth"
      );
      return;
    }

    const replyToSend =
      replyingTo;

    const optimisticId =
      -Date.now();

    const localPreview =
      fileToSend
        ? URL.createObjectURL(
            fileToSend
          )
        : "";

    const optimisticType =
      fileToSend
        ? fileToSend.type
            .startsWith(
              "video/"
            )
          ? "video"
          : "image"
        : "text";

    const me =
      members.find(
        (member) =>
          member.user_id ===
          user.id
      );

    const optimistic = {
      id:
        optimisticId,
      group_id:
        groupId,
      sender_id:
        user.id,
      content:
        textToSend ||
        null,
      message_type:
        optimisticType,
      media_path:
        null,
      media_type:
        fileToSend
          ? optimisticType
          : null,
      media_mime:
        fileToSend?.type ||
        null,
      media_name:
        null,
      media_preview:
        localPreview ||
        null,
      media_size:
        fileToSend?.size ||
        null,
      reply_to_id:
        replyToSend?.id ||
        null,
      created_at:
        new Date()
          .toISOString(),
      sender_profile:
        me
          ? {
              id:
                me.user_id,
              username:
                me.username,
              avatar_url:
                me.avatar_url,
            }
          : null,
      reactions: [],
      _pending:
        true,
    };

    setSending(true);

    suppressOwnInsertUntilRef.current =
      Date.now() + 3000;

    stickToBottomRef.current =
      true;

    setMessages(
      (current) => [
        ...current,
        optimistic,
      ]
    );

    setText("");
    setReplyingTo(
      null
    );

    if (fileToSend) {
      setMediaFile(null);
      setMediaPreview("");

      if (fileRef.current) {
        fileRef.current.value =
          "";
      }
    }

    broadcastTyping(
      false
    );

    window.requestAnimationFrame(
      () =>
        scrollBottom(
          "smooth"
        )
    );

    let uploadedPath:
      | string
      | null = null;

    try {
      const media =
        fileToSend
          ? await uploadMedia(
              fileToSend
            )
          : null;

      uploadedPath =
        media?.path ||
        null;

      suppressOwnInsertUntilRef.current =
        Date.now() + 5000;

      const {
        data:
          inserted,
        error,
      } =
        await supabase
          .from(
            "group_messages"
          )
          .insert({
            group_id:
              groupId,
            sender_id:
              user.id,
            content:
              textToSend ||
              null,
            message_type:
              media
                ? media.type
                : "text",
            media_path:
              media?.path ||
              null,
            media_type:
              media?.type ||
              null,
            media_mime:
              media?.mime ||
              null,
            media_name:
              media?.name ||
              null,
            media_preview:
              media?.preview ||
              null,
            media_size:
              media?.size ||
              null,
            reply_to_id:
              replyToSend?.id ||
              null,
          })
          .select("*")
          .single();

      if (
        error ||
        !inserted
      ) {
        throw (
          error ||
          new Error(
            "No se pudo confirmar el mensaje."
          )
        );
      }

      setMessages(
        (current) =>
          current.map(
            (message) =>
              message.id ===
              optimisticId
                ? {
                    ...inserted,
                    sender_profile:
                      optimistic.sender_profile,
                    reactions: [],
                  }
                : message
          )
      );

      if (localPreview) {
        window.setTimeout(
          () =>
            URL.revokeObjectURL(
              localPreview
            ),
          250
        );
      }
    } catch (
      error: any
    ) {
      setMessages(
        (current) =>
          current.filter(
            (message) =>
              message.id !==
              optimisticId
          )
      );

      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(BUCKET)
          .remove([
            uploadedPath,
          ]);
      }

      if (localPreview) {
        URL.revokeObjectURL(
          localPreview
        );
      }

      setText(
        textToSend
      );

      setReplyingTo(
        replyToSend
      );

      if (fileToSend) {
        setMediaFile(
          fileToSend
        );

        setMediaPreview(
          URL.createObjectURL(
            fileToSend
          )
        );
      }

      alert(
        error?.message ||
          "No se pudo enviar."
      );
    } finally {
      setSending(false);

      window.requestAnimationFrame(
        () =>
          textareaRef.current?.focus()
      );
    }
  }

  function beginEdit(
    message: any
  ) {
    if (
      message.sender_id !==
        user?.id ||
      message.deleted_at ||
      message.message_type ===
        "deleted" ||
      message.message_type ===
        "system"
    ) {
      return;
    }

    clearMedia();
    setReplyingTo(null);
    setEditingMessage(
      message
    );
    setText(
      String(
        message.content ||
          ""
      )
    );
    window.requestAnimationFrame(
      () =>
        textareaRef.current?.focus()
    );
  }

  async function hideMessageForMe(
    message: any
  ) {
    const previous =
      messages;

    setMessages(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            message.id
        )
    );

    const { error } =
      await supabase.rpc(
        "alumni_hide_message_for_me",
        {
          p_scope:
            "group",
          p_message_id:
            message.id,
        }
      );

    if (error) {
      setMessages(
        previous
      );
      alert(
        error.message
      );
    }
  }

  async function deleteMessageForEveryone(
    message: any
  ) {
    if (
      message.sender_id !==
        user?.id ||
      message.message_type ===
        "system"
    ) {
      return;
    }

    if (
      !confirm(
        "¿Eliminar este mensaje para todos?"
      )
    ) {
      return;
    }

    const mediaPath =
      message.media_path;

    const { error } =
      await supabase.rpc(
        "alumni_delete_group_message_for_everyone",
        {
          p_message_id:
            message.id,
        }
      );

    if (error) {
      alert(
        error.message
      );
      return;
    }

    setMessages(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            message.id
              ? {
                  ...item,
                  content:
                    null,
                  media_path:
                    null,
                  media_type:
                    null,
                  message_type:
                    "deleted",
                  deleted_at:
                    new Date()
                      .toISOString(),
                  edited_at:
                    null,
                  reactions:
                    [],
                }
              : item
        )
    );

    if (mediaPath) {
      void supabase.storage
        .from(BUCKET)
        .remove([
          mediaPath,
        ]);
    }
  }

  async function toggleReaction(
    messageId: number,
    emoji: string
  ) {
    if (
      !user ||
      messageId <= 0
    ) {
      return;
    }

    const actionKey =
      `group-reaction:${messageId}`;

    if (
      pendingReactionKeysRef.current.has(
        actionKey
      )
    ) {
      return;
    }

    const message =
      messages.find(
        (item) =>
          item.id ===
          messageId
      );

    if (!message) {
      return;
    }

    const previousReactions =
      [
        ...(message.reactions || []),
      ];

    const mine =
      previousReactions.find(
        (reaction: any) =>
          reaction.user_id ===
          user.id
      );

    const removing =
      mine?.emoji === emoji;

    const withoutMine =
      previousReactions.filter(
        (reaction: any) =>
          reaction.user_id !==
          user.id
      );

    const nextReactions =
      removing
        ? withoutMine
        : [
            ...withoutMine,
            {
              message_id:
                messageId,
              user_id:
                user.id,
              emoji,
            },
          ];

    pendingReactionKeysRef.current.add(
      actionKey
    );

    setMessages(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            messageId
              ? {
                  ...item,
                  reactions:
                    nextReactions,
                }
              : item
        )
    );

    try {
      if (removing) {
        const { error } =
          await supabase
            .from(
              "group_message_reactions"
            )
            .delete()
            .eq(
              "message_id",
              messageId
            )
            .eq(
              "user_id",
              user.id
            );

        if (error) {
          throw error;
        }
      } else {
        if (mine) {
          const {
            error:
              deleteError,
          } = await supabase
            .from(
              "group_message_reactions"
            )
            .delete()
            .eq(
              "message_id",
              messageId
            )
            .eq(
              "user_id",
              user.id
            );

          if (deleteError) {
            throw deleteError;
          }
        }

        const { error } =
          await supabase
            .from(
              "group_message_reactions"
            )
            .insert({
              message_id:
                messageId,
              user_id:
                user.id,
              emoji,
            });

        if (error) {
          if (mine) {
            void supabase
              .from(
                "group_message_reactions"
              )
              .insert({
                message_id:
                  messageId,
                user_id:
                  user.id,
                emoji:
                  mine.emoji,
              });
          }

          throw error;
        }
      }
    } catch (error: any) {
      setMessages(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              messageId
                ? {
                    ...item,
                    reactions:
                      previousReactions,
                  }
                : item
          )
      );

      alert(
        error?.message ||
          "No se pudo reaccionar."
      );
    } finally {
      pendingReactionKeysRef.current.delete(
        actionKey
      );
    }
  }

  function beginReply(
    message: any
  ) {
    setReplyingTo(
      message
    );

    window.requestAnimationFrame(
      () =>
        textareaRef.current?.focus()
    );
  }

  function broadcastTyping(
    typing: boolean
  ) {
    if (
      !user ||
      !channelRef.current
    ) {
      return;
    }

    const me =
      members.find(
        (member) =>
          member.user_id ===
          user.id
      );

    void channelRef.current.send({
      type:
        "broadcast",
      event:
        "typing",
      payload: {
        user_id:
          user.id,
        username:
          me?.username ||
          "Alguien",
        typing,
      },
    });
  }

  function signalTyping(
    value: string
  ) {
    const wantsTyping =
      Boolean(
        value.trim()
      );

    const now = Date.now();

    if (wantsTyping) {
      if (
        now -
          lastTypingBroadcastRef.current >=
        900
      ) {
        lastTypingBroadcastRef.current =
          now;

        broadcastTyping(true);
      }
    } else if (
      lastTypingBroadcastRef.current !==
      0
    ) {
      lastTypingBroadcastRef.current =
        0;

      broadcastTyping(false);
    }

    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current
      );
    }

    if (!wantsTyping) {
      typingTimerRef.current =
        null;
      return;
    }

    typingTimerRef.current =
      window.setTimeout(
        () => {
          lastTypingBroadcastRef.current =
            0;

          broadcastTyping(false);

          typingTimerRef.current =
            null;
        },
        1200
      );
  }

  const memberText =
    useMemo(
      () =>
        `${members.length} ${
          members.length === 1
            ? "miembro"
            : "miembros"
        }`,
      [members.length]
    );

  if (
    !loadingChat &&
    !group
  ) {
    return (
      <AppShell>
        <div className="mx-auto max-w-[700px] py-16 text-center">
          <p className="text-lg font-black text-[var(--app-text)]">
            Grupo no disponible
          </p>
          <Link
            href="/messages"
            className="mt-4 inline-flex text-sm font-black text-[var(--app-accent)]"
          >
            Volver a Mensajes
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      immersiveMobile
    >
      <div
        className="fixed inset-x-0 top-0 z-[80] mx-auto flex h-[100dvh] w-full max-w-[780px] flex-col overflow-hidden bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-120px)] lg:min-h-[560px] lg:rounded-[24px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)]"
        data-pull-refresh-lock="true"
      >
        <header className="relative z-20 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
          <div className="flex min-h-[60px] items-center gap-2 px-2.5 sm:px-4">
            <Link
              href="/messages"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-muted)] active:bg-[var(--app-soft)]"
            >
              <ArrowLeft
                size={20}
              />
            </Link>

            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[var(--app-border)]">
              {groupAvatarUrl ? (
                <img
                  src={
                    groupAvatarUrl
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users
                  size={19}
                />
              )}
            </span>

            <button
              type="button"
              onClick={() =>
                setGroupInfoOpen(
                  true
                )
              }
              className="min-w-0 flex-1 text-left"
              aria-label="Información del grupo"
            >
              <h1 className="truncate text-[16px] font-black text-[var(--app-text)]">
                {group?.name ||
                  "Grupo"}
              </h1>

              <p className="mt-0.5 text-[11px] text-[var(--app-muted-2)]">
                {memberText}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setGroupInfoOpen(
                  true
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] hover:bg-[var(--app-soft)]"
              aria-label="Opciones del grupo"
            >
              <MoreHorizontal
                size={19}
              />
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          onScroll={(event) => {
            const target =
              event.currentTarget;

            stickToBottomRef.current =
              target.scrollHeight -
                target.scrollTop -
                target.clientHeight <
              160;

            if (
              stickToBottomRef.current
            ) {
              setNewBelowCount(0);
            }

            if (
              target.scrollTop <
                90 &&
              hasMoreHistory &&
              !loadingOlder
            ) {
              void loadOlderMessages();
            }
          }}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-3 sm:px-5 sm:py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 0%, color-mix(in srgb,var(--app-accent) 7%,transparent), transparent 34%), radial-gradient(circle at 88% 100%, color-mix(in srgb,var(--app-accent) 4%,transparent), transparent 30%), linear-gradient(180deg, color-mix(in srgb,var(--app-bg) 97%,var(--app-surface)), var(--app-bg))",
          }}
        >
          {loadingChat ? (
            <div className="flex h-full items-center justify-center">
              <Loader2
                size={20}
                className="animate-spin text-[var(--app-accent)]"
              />
            </div>
          ) : messages.length ? (
            <div>
              {messages.map(
                (message) => {
                  const mine =
                    message.sender_id ===
                    user?.id;

                  const system =
                    message.message_type ===
                    "system";

                  const otherMembers =
                    members.filter(
                      (member) =>
                        member.user_id !==
                        user?.id
                    );

                  const seenCount =
                    mine
                      ? otherMembers.filter(
                          (member) =>
                            new Date(
                              member.last_read_at
                            ).getTime() >=
                            new Date(
                              message.created_at
                            ).getTime()
                        ).length
                      : 0;

                  const seenByAll =
                    mine &&
                    otherMembers.length >
                      0 &&
                    seenCount ===
                      otherMembers.length;

                  if (system) {
                    return (
                      <div
                        key={message.id}
                        className="my-3 flex justify-center px-5"
                      >
                        <span className="rounded-full bg-[var(--app-soft)] px-3 py-1.5 text-center text-[10px] font-bold text-[var(--app-muted-2)] ring-1 ring-[var(--app-border)]">
                          {message.content}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={
                        message.id
                      }
                      id={`group-message-${message.id}`}
                      className={`mt-2 rounded-[10px] transition-colors duration-700 ${
                        flashMessageId ===
                        message.id
                          ? "bg-[var(--app-accent-soft)]"
                          : ""
                      }`}
                    >
                      {message.id ===
                        unreadBoundaryId && (
                        <div className="my-4 flex items-center gap-3">
                          <span className="h-px flex-1 bg-[var(--app-border)]" />
                          <span className="rounded-full bg-[var(--app-accent-soft)] px-3 py-1 text-[11px] font-black text-[var(--app-accent)]">
                            Mensajes nuevos
                          </span>
                          <span className="h-px flex-1 bg-[var(--app-border)]" />
                        </div>
                      )}
                      <SwipeToReply
                        onReply={() =>
                          beginReply(
                            message
                          )
                        }
                      >
                        <div
                          className={`flex ${
                            mine
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[82%] overflow-hidden rounded-[18px] px-3 py-2.5 sm:max-w-[66%] ${
                              mine
                                ? "alumni-message-mine"
                                : "alumni-message-other"
                            }`}
                          >
                            {!mine && (
                              <p className="mb-1 text-[11px] font-black text-[var(--app-accent)]">
                                @
                                {message
                                  .sender_profile
                                  ?.username ||
                                  "usuario"}
                              </p>
                            )}

                            {message.is_forwarded && (
                              <p className="mb-1.5 text-[10px] font-bold italic text-[var(--app-muted-2)]">
                                Reenviado
                              </p>
                            )}

                            <MessageReplyQuote
                              message={
                                message
                              }
                              messages={
                                messages
                              }
                              currentUserId={
                                user?.id
                              }
                              peerUsername={
                                message
                                  .sender_profile
                                  ?.username
                              }
                              onJump={flashAndScrollToMessage}
                            />

                            {message.message_type ===
                            "deleted" ? (
                              <p className="py-1 text-[14px] italic opacity-75">
                                Mensaje eliminado
                              </p>
                            ) : message.media_path && (
                              <div className="mb-2 w-fit max-w-full overflow-hidden rounded-[14px]">
                                <DeferredMessageMedia
                                  bucket={
                                    BUCKET
                                  }
                                  path={
                                    message.media_path
                                  }
                                  preview={
                                    message.media_preview
                                  }
                                  mediaType={
                                    message.media_type
                                  }
                                  mediaMime={
                                    message.media_mime
                                  }
                                  name={
                                    message.media_name
                                  }
                                  size={
                                    message.media_size
                                  }
                                  messageId={
                                    message.id
                                  }
                                  senderId={
                                    message.sender_id
                                  }
                                  reportType="group_message"
                                />
                              </div>
                            )}

                            {message.message_type !==
                              "deleted" &&
                              message.content && (
                              <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45]">
                                {
                                  message.content
                                }
                              </p>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--app-muted-3)]">
                              {message.edited_at && (
                                <span className="mr-1 text-[9px]">
                                  Editado
                                </span>
                              )}
                              {time(
                                message.created_at
                              )}
                              {mine &&
                                (message._queued ? (
                                  <Clock3
                                    size={12}
                                  />
                                ) : message._pending ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin"
                                  />
                                ) : seenByAll ? (
                                  <CheckCheck
                                    size={13}
                                    className="text-[var(--app-accent)]"
                                  />
                                ) : (
                                  <Check
                                    size={12}
                                  />
                                ))}
                            </div>
                          </div>
                        </div>
                      </SwipeToReply>

                      {mine &&
                        message.id ===
                          messages[
                            messages.length -
                              1
                          ]?.id &&
                        otherMembers.length >
                          0 && (
                          <p className="mt-1 pr-1 text-right text-[10px] font-semibold text-[var(--app-muted-3)]">
                            {seenCount >
                            0
                              ? `Visto por ${seenCount} de ${otherMembers.length}`
                              : "Enviado"}
                          </p>
                        )}

                      <MessageProTools
                        message={
                          message
                        }
                        messages={
                          messages
                        }
                        mine={
                          mine
                        }
                        currentUserId={
                          user?.id
                        }
                        onReply={() =>
                          beginReply(
                            message
                          )
                        }
                        onReact={(
                          emoji
                        ) =>
                          toggleReaction(
                            message.id,
                            emoji
                          )
                        }
                        onEdit={() =>
                          beginEdit(
                            message
                          )
                        }
                        onDeleteForMe={() =>
                          void hideMessageForMe(
                            message
                          )
                        }
                        onDeleteForEveryone={() =>
                          void deleteMessageForEveryone(
                            message
                          )
                        }
                      />
                    </div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <Users
                  size={28}
                  className="mx-auto text-[var(--app-muted-3)]"
                />
                <p className="mt-4 text-[15px] font-black text-[var(--app-text-soft)]">
                  El grupo está listo
                </p>
                <p className="mt-1 text-[12px] leading-5 text-[var(--app-muted-2)]">
                  Envía el primer mensaje.
                </p>
              </div>
            </div>
          )}
        </div>

        {!stickToBottomRef.current && (
          <button
            type="button"
            onClick={() => {
              stickToBottomRef.current =
                true;
              setNewBelowCount(0);
              scrollBottom(
                "smooth"
              );
            }}
            className="absolute bottom-[82px] right-4 z-[70] flex h-10 min-w-10 items-center justify-center gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[11px] font-black text-[var(--app-text)] shadow-[0_10px_30px_var(--app-shadow)]"
            aria-label="Ir a mensajes recientes"
          >
            <ChevronDown
              size={17}
            />
            {newBelowCount > 0 && (
              <span>
                {newBelowCount}
              </span>
            )}
          </button>
        )}

        {typingName && (
          <div className="shrink-0 px-4 pb-1.5 text-[12px] font-semibold text-[var(--app-muted-2)]">
            @{typingName} está escribiendo…
          </div>
        )}

        <form
          onSubmit={
            send
          }
          className="shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl sm:px-3 sm:pb-3"
        >
          {editingMessage && (
            <div className="alumni-composer-reply-preview">
              <div className="alumni-composer-reply-copy">
                <p className="alumni-reply-author">
                  Editando mensaje
                </p>
                <p className="alumni-reply-summary">
                  {editingMessage.content}
                </p>
              </div>
              <button
                type="button"
                className="alumni-composer-reply-close"
                onClick={() => {
                  setEditingMessage(null);
                  setText("");
                }}
                aria-label="Cancelar edición"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <ComposerReplyPreview
            message={
              replyingTo
            }
            currentUserId={
              user?.id
            }
            peerUsername={
              replyingTo
                ?.sender_profile
                ?.username
            }
            onClose={() =>
              setReplyingTo(
                null
              )
            }
          />

          {mediaFile && (
            <div className="mb-2 flex items-center gap-3 rounded-[15px] bg-[var(--app-soft)] p-2">
              <div className="h-12 w-12 overflow-hidden rounded-[11px] bg-black/20">
                {mediaFile.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    src={
                      mediaPreview
                    }
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={
                      mediaPreview
                    }
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1" />

              <button
                type="button"
                onClick={
                  clearMedia
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)]"
              >
                <X
                  size={15}
                />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1 rounded-[22px] border border-[var(--app-border)] bg-[var(--app-soft)] p-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(
                event
              ) =>
                selectMedia(
                  event.target
                    .files?.[0]
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                fileRef.current?.click()
              }
              disabled={
                sending ||
                Boolean(
                  editingMessage
                )
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-accent)] disabled:opacity-40"
            >
              <ImagePlus
                size={19}
              />
            </button>

            <textarea
              ref={
                textareaRef
              }
              rows={1}
              value={text}
              onChange={(
                event
              ) => {
                setText(
                  event.target.value
                );
                signalTyping(
                  event.target.value
                );
              }}
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Mensaje al grupo"
              className="alumni-mobile-input min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-[10px] text-[16px] leading-5 text-[var(--app-text)] outline-none sm:text-[15px]"
            />

            <button
              type="submit"
              disabled={
                sending ||
                (!text.trim() &&
                  !mediaFile)
              }
              className="alumni-accent-button flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-35"
            >
              {sending ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={17}
                />
              )}
            </button>
          </div>
        </form>
        <GroupAdminPanel
          open={
            groupInfoOpen
          }
          onClose={() =>
            setGroupInfoOpen(
              false
            )
          }
          group={
            group
              ? {
                  ...group,
                  avatar_url:
                    groupAvatarUrl,
                }
              : group
          }
          members={
            members
          }
          onChanged={() =>
            load(false)
          }
        />
      </div>
    </AppShell>
  );
}

/* ALUMNI_1_3_1_GROUP_ADMIN_MEDIA_UX:GROUP_PAGE */

/* ALUMNI_1_3_2_MESSAGING_POLISH:GROUP */

/* ALUMNI_1_3_4_GROUP_MODAL_MEDIA_POLISH:GROUP */

/* ALUMNI_1_3_5_MEDIA_MODAL_SPOTIFY_FIX:GROUP */

/* ALUMNI_1_3_7_MESSAGING_GLOBAL_STABILITY:GROUP_CHAT */

/* ALUMNI_1_5_0_MESSAGING_2_HOME_NAV:GROUP */

/* ALUMNI_PERFORMANCE_HARDENING_MESSAGING_GROUP_V9 */
