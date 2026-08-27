"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  ImagePlus,
  Images,
  Loader2,
  MoreHorizontal,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";
import MessageProTools from "@/components/messages/MessageProTools";
import DeferredMessageMedia from "@/components/messages/DeferredMessageMedia";
import { createMessageMediaPreview } from "@/lib/messageMedia";
import {
  outboxFor,
  queueOutbox,
  removeOutbox,
} from "@/lib/messageOutbox";
import {
  ComposerReplyPreview,
  MessageReplyQuote,
  SwipeToReply,
} from "@/components/messages/MessageReplyExperience";

const BUCKET = "message-media";
const MAX_IMAGE =
  15 * 1024 * 1024;
const MAX_VIDEO =
  50 * 1024 * 1024;
const MESSAGE_PAGE_SIZE = 50;

function safeFileName(
  name: string
) {
  return name
    .normalize("NFKD")
    .replace(
      /[^\w.\-]+/g,
      "_"
    )
    .slice(-120);
}

function dayKey(date: string) {
  return new Date(
    date
  ).toDateString();
}

function dayLabel(
  date: string
) {
  const parsed =
    new Date(date);
  const today =
    new Date();

  if (
    parsed.toDateString() ===
    today.toDateString()
  ) {
    return "Hoy";
  }

  const yesterday =
    new Date(today);
  yesterday.setDate(
    today.getDate() - 1
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
      weekday: "short",
      day: "numeric",
      month: "short",
    }
  );
}

export default function ChatPage() {
  const params =
    useParams();

  const username =
    params.username as string;

  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const [
    messages,
    setMessages,
  ] = useState<any[]>([]);

  const [
    newMessage,
    setNewMessage,
  ] = useState("");

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<any>(null);

  const [
    receiverTyping,
    setReceiverTyping,
  ] = useState(false);

  const chatChannelRef =
    useRef<any>(null);

  const typingTimerRef =
    useRef<number | null>(
      null
    );

  const [
    receiver,
    setReceiver,
  ] = useState<any>(null);

  const [
    loadingChat,
    setLoadingChat,
  ] = useState(true);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    mediaFile,
    setMediaFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    mediaPreview,
    setMediaPreview,
  ] = useState("");

  const [
    visualHeight,
    setVisualHeight,
  ] =
    useState<number | null>(
      null
    );

  const [
    visualOffsetTop,
    setVisualOffsetTop,
  ] = useState(0);

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    chatSearch,
    setChatSearch,
  ] = useState("");

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    sharedOpen,
    setSharedOpen,
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

  const fileInputRef =
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

  const searchInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const menuRef =
  useRef<HTMLDivElement>(
    null
  );

const loadChatRequestRef =
  useRef(0);

const receiverRef =
  useRef<any>(null);

const refreshTimerRef =
  useRef<number | null>(
    null
  );

const suppressOwnInsertUntilRef =
  useRef(0);

const viewportMetricsRef =
  useRef({
    height: 0,
    offsetTop: 0,
  });

const mediaUrlCacheRef =
  useRef<
    Map<
      string,
      {
        url:
          | string
          | null;
        expiresAt: number;
      }
    >
  >(new Map());


  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.push("/login");
    }
  }, [
    user,
    loading,
    router,
  ]);

  useEffect(() => {
    if (!user) return;

    void loadChat(true);

    const refresh = (
      payload: any
    ) => {
      const row =
        payload?.new ||
        payload?.old;

      const peerId =
        receiverRef.current
          ?.id;

      if (
        peerId &&
        row &&
        !(
          (row.sender_id ===
            user.id &&
            row.receiver_id ===
              peerId) ||
          (row.sender_id ===
            peerId &&
            row.receiver_id ===
              user.id)
        )
      ) {
        return;
      }

      if (
        payload?.eventType ===
          "UPDATE" &&
        row?.sender_id ===
          user.id
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
                      reactions:
                        message.reactions || [],
                    }
                  : message
            )
        );

        return;
      }

      if (
        payload?.eventType ===
          "INSERT" &&
        row
      ) {
        if (!peerId) {
          scheduleChatRefresh(
            40
          );
          return;
        }

        if (
          row.sender_id ===
            user.id &&
          Date.now() <
            suppressOwnInsertUntilRef.current
        ) {
          return;
        }

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
                reactions: [],
              },
            ];
          }
        );

        if (
          row.receiver_id ===
            user.id &&
          row.sender_id ===
            peerId &&
          !row.read_at
        ) {
          const readAt =
            new Date()
              .toISOString();

          setMessages(
            (current) =>
              current.map(
                (message) =>
                  message.id ===
                  row.id
                    ? {
                        ...message,
                        read_at:
                          readAt,
                      }
                    : message
              )
          );

          void supabase
            .from(
              "messages"
            )
            .update({
              read_at:
                readAt,
            })
            .eq(
              "id",
              row.id
            );
        }

        if (
          row.receiver_id === user.id &&
          row.sender_id === peerId
        ) {
          void supabase.rpc(
            "alumni_mark_direct_messages_delivered",
            {
              p_peer_id: peerId,
            }
          );
        }

        if (
          stickToBottomRef.current
        ) {
          setNewBelowCount(0);

          window.requestAnimationFrame(
            () =>
              scrollToBottom(
                "smooth"
              )
          );
        } else {
          setNewBelowCount(
            (count) => count + 1
          );
        }

        return;
      }

      scheduleChatRefresh(
        80
      );
    };

    const channel =
      supabase
        .channel(
          `chat:${user.id}:${username}`
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema:
              "public",
            table:
              "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          refresh
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema:
              "public",
            table:
              "messages",
            filter: `sender_id=eq.${user.id}`,
          },
          refresh
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema:
              "public",
            table:
              "messages",
            filter: `sender_id=eq.${user.id}`,
          },
          refresh
        )
        .on(
          "broadcast",
          {
            event: "typing",
          },
          ({ payload }: any) => {
            if (
              payload?.user_id !==
                user.id
            ) {
              setReceiverTyping(
                Boolean(
                  payload?.typing
                )
              );
            }
          }
        )
        .subscribe();

    chatChannelRef.current =
      channel;

    return () => {
      loadChatRequestRef.current += 1;

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

      chatChannelRef.current =
        null;

      supabase.removeChannel(
        channel
      );
    };

  }, [
    user?.id,
    username,
  ]);

  useEffect(() => {
    if (
      typeof window ===
        "undefined" ||
      window.innerWidth >=
        1024
    ) {
      return;
    }

    const body =
      document.body;

    const html =
      document.documentElement;

    const scrollY =
      window.scrollY;

    const previous = {
      bodyPosition:
        body.style.position,
      bodyTop:
        body.style.top,
      bodyWidth:
        body.style.width,
      bodyOverflow:
        body.style.overflow,
      htmlOverflow:
        html.style.overflow,
      htmlOverscroll:
        html.style
          .overscrollBehavior,
    };

    body.style.position =
      "fixed";
    body.style.top =
      `-${scrollY}px`;
    body.style.width =
      "100%";
    body.style.overflow =
      "hidden";

    html.style.overflow =
      "hidden";
    html.style.overscrollBehavior =
      "none";

    return () => {
      body.style.position =
        previous.bodyPosition;
      body.style.top =
        previous.bodyTop;
      body.style.width =
        previous.bodyWidth;
      body.style.overflow =
        previous.bodyOverflow;
      html.style.overflow =
        previous.htmlOverflow;
      html.style.overscrollBehavior =
        previous.htmlOverscroll;

      window.scrollTo(
        0,
        scrollY
      );
    };
  }, []);

  useEffect(() => {
    function updateViewport() {
      const viewport =
        window.visualViewport;

      const nextHeight =
        Math.max(
          320,
          Math.round(
            viewport?.height ||
              window.innerHeight
          )
        );

      const nextOffsetTop =
        Math.max(
          0,
          Math.round(
            viewport?.offsetTop ||
              0
          )
        );

      const previous =
        viewportMetricsRef.current;

      const changed =
        Math.abs(
          previous.height -
            nextHeight
        ) > 2 ||
        Math.abs(
          previous.offsetTop -
            nextOffsetTop
        ) > 2;

      if (!changed) {
        return;
      }

      viewportMetricsRef.current = {
        height: nextHeight,
        offsetTop:
          nextOffsetTop,
      };

      setVisualHeight(
        nextHeight
      );

      setVisualOffsetTop(
        nextOffsetTop
      );

      window.requestAnimationFrame(
        () => {
          scrollToBottom(
            "auto"
          );
        }
      );
    }

    updateViewport();

    const viewport =
      window.visualViewport;

    viewport?.addEventListener(
      "resize",
      updateViewport
    );

    viewport?.addEventListener(
      "scroll",
      updateViewport
    );

    window.addEventListener(
      "resize",
      updateViewport
    );

    return () => {
      viewport?.removeEventListener(
        "resize",
        updateViewport
      );

      viewport?.removeEventListener(
        "scroll",
        updateViewport
      );

      window.removeEventListener(
        "resize",
        updateViewport
      );
    };
  }, []);

  useEffect(() => {
    if (
      messages.length &&
      stickToBottomRef.current
    ) {
      window.requestAnimationFrame(
        () =>
          scrollToBottom(
            messages.length >
              1
              ? "smooth"
              : "auto"
          )
      );
    }
  }, [messages.length]);

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
      `alumni:draft:direct:${user.id}:${username}`;

    const saved =
      localStorage.getItem(key);

    if (saved && !newMessage) {
      setNewMessage(saved);
    }
  }, [user?.id, username]);

  useEffect(() => {
    if (!user) return;

    const key =
      `alumni:draft:direct:${user.id}:${username}`;

    if (newMessage) {
      localStorage.setItem(
        key,
        newMessage
      );
    } else {
      localStorage.removeItem(
        key
      );
    }
  }, [
    user?.id,
    username,
    newMessage,
  ]);

  useEffect(() => {
    if (!user || !receiver) return;

    const flush = async () => {
      if (!navigator.onLine) return;

      const queued =
        outboxFor(
          "direct",
          username
        );

      for (const item of queued) {
        const { error } =
          await supabase
            .from("messages")
            .insert({
              sender_id: user.id,
              receiver_id:
                item.receiverId ||
                receiver.id,
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

      scheduleChatRefresh(20);
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
    receiver?.id,
    username,
  ]);

  useEffect(() => {
    if (
      !newMessage &&
      textareaRef.current
    ) {
      textareaRef.current.style.height =
        "38px";
    }
  }, [newMessage]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const close = (
      event: PointerEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setMenuOpen(
          false
        );
      }
    };

    document.addEventListener(
      "pointerdown",
      close
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        close
      );
    };
  }, [menuOpen]);

  const sharedMedia =
    useMemo(
      () =>
        messages.filter(
          (message) =>
            Boolean(
              message.media_url
            ) &&
            (message.media_type ===
              "image" ||
              message.media_type ===
                "video")
        ),
      [messages]
    );

  const visibleMessages =
    useMemo(() => {
      const query =
        chatSearch
          .trim()
          .toLowerCase();

      if (
        !searchOpen ||
        !query
      ) {
        return messages;
      }

      return messages.filter(
        (message) =>
          [
            message.content,
            message.media_name,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(
                  query
                )
            )
      );
    }, [
      messages,
      searchOpen,
      chatSearch,
    ]);

  const lastOwnMessageId =
    useMemo(() => {
      for (
        let index =
          messages.length -
          1;
        index >= 0;
        index--
      ) {
        if (
          messages[index]
            ?.sender_id ===
          user?.id
        ) {
          return messages[
            index
          ].id;
        }
      }

      return null;
    }, [
      messages,
      user?.id,
    ]);

  function scrollToBottom(
    behavior:
      ScrollBehavior =
      "auto"
  ) {
    const target =
      scrollRef.current;

    if (!target) {
      return;
    }

    target.scrollTo({
      top:
        target.scrollHeight,
      behavior,
    });
  }

  function resizeTextarea(
    target:
      HTMLTextAreaElement
  ) {
    target.style.height =
      "38px";

    target.style.height =
      `${Math.min(
        target.scrollHeight,
        104
      )}px`;
  }

  function scheduleChatRefresh(
    delay = 80
  ) {
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

          void loadChat(false);
        },
        delay
      );
  }

  async function hydrateMedia(
    rows: any[]
  ) {
    return rows;
  }

  async function loadChat(
  showLoader = true
) {
  if (!user) return;

  const requestId =
    ++loadChatRequestRef.current;

  if (showLoader) {

      setLoadingChat(
        true
      );
    }

    let receiverData =
      receiverRef.current;

    if (
      !receiverData ||
      receiverData.username !==
        username
    ) {
      const {
        data:
          freshReceiver,
        error:
          receiverError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, avatar_url, university, career"
        )
        .eq(
          "username",
          username
        )
        .maybeSingle();

      if (
        requestId !==
        loadChatRequestRef.current
      ) {
        return;
      }

      if (
        receiverError ||
        !freshReceiver
      ) {
        if (
          receiverError
        ) {
          console.error(
            receiverError
          );
        }

        receiverRef.current =
          null;

        setReceiver(null);
        setLoadingChat(
          false
        );
        return;
      }

      receiverData =
        freshReceiver;

      receiverRef.current =
        freshReceiver;

      setReceiver(
        freshReceiver
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`
      )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(
          MESSAGE_PAGE_SIZE
        );

if (
  requestId !==
  loadChatRequestRef.current
) {
  return;
}

if (!error) {

      const baseRows =
        [...(data || [])].reverse();

      setHasMoreHistory(
        (data || []).length ===
          MESSAGE_PAGE_SIZE
      );

      const hydrated =
        await hydrateMedia(
          baseRows
        );

      const hydratedIds =
        hydrated.map(
          (message: any) =>
            message.id
        );

      let hiddenIds =
        new Set<number>();

      if (hydratedIds.length) {
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
            "direct"
          )
          .in(
            "message_id",
            hydratedIds
          );

        hiddenIds =
          new Set(
            (hiddenRows || []).map(
              (row: any) =>
                Number(
                  row.message_id
                )
            )
          );
      }

      const visibleHydrated =
        hydrated.filter(
          (message: any) =>
            !hiddenIds.has(
              Number(
                message.id
              )
            )
        );

if (
  requestId !==
  loadChatRequestRef.current
) {
  return;
}

const messageIds =
  visibleHydrated.map(
    (message: any) =>
      message.id
  );

let reactionRows: any[] =
  [];

if (messageIds.length) {
  const {
    data: reactionsData,
  } = await supabase
    .from(
      "message_reactions"
    )
    .select(
      "message_id,user_id,emoji"
    )
    .in(
      "message_id",
      messageIds
    );

  reactionRows =
    reactionsData || [];
}

const reactionsByMessage =
  new Map<
    number,
    any[]
  >();

for (
  const reaction of
  reactionRows
) {
  const current =
    reactionsByMessage.get(
      reaction.message_id
    ) || [];

  current.push(
    reaction
  );

  reactionsByMessage.set(
    reaction.message_id,
    current
  );
}

const nextMessages =
  visibleHydrated.map(
    (message: any) => ({
      ...message,
      reactions:
        reactionsByMessage.get(
          message.id
        ) || [],
    })
  );

if (
  showLoader &&
  unreadBoundaryId === null
) {
  const firstUnread =
    nextMessages.find(
      (message: any) =>
        message.receiver_id ===
          user.id &&
        message.sender_id ===
          receiverData.id &&
        !message.read_at
    );

  if (firstUnread) {
    setUnreadBoundaryId(
      Number(
        firstUnread.id
      )
    );
  }
}

void supabase.rpc(
  "alumni_mark_direct_messages_delivered",
  {
    p_peer_id:
      receiverData.id,
  }
);

setMessages(
  (current) => {
    const same =
      current.length ===
        nextMessages.length &&
      current.every(
        (
          message,
          index
        ) => {
          const next =
            nextMessages[index];

          if (
            !next ||
            message.id !==
              next.id ||
            message.read_at !==
              next.read_at ||
            message.delivered_at !==
              next.delivered_at ||
            message.edited_at !==
              next.edited_at ||
            message.deleted_at !==
              next.deleted_at ||
            message.message_type !==
              next.message_type ||
            message.content !==
              next.content ||
            message.media_url !==
              next.media_url ||
            message.reply_to_id !==
              next.reply_to_id
          ) {
            return false;
          }

          const currentReactions =
            message.reactions ||
            [];

          const nextReactions =
            next.reactions ||
            [];

          return (
            currentReactions.length ===
              nextReactions.length &&
            currentReactions.every(
              (
                reaction: any,
                reactionIndex: number
              ) =>
                reaction.user_id ===
                  nextReactions[
                    reactionIndex
                  ]?.user_id &&
                reaction.emoji ===
                  nextReactions[
                    reactionIndex
                  ]?.emoji
            )
          );
        }
      );

    return same
      ? current
      : nextMessages;
  }
);

      const unreadIds =
        nextMessages
          .filter(
            (message: any) =>
              message.receiver_id ===
                user.id &&
              message.sender_id ===
                receiverData.id &&
              !message.read_at
          )
          .map(
            (message: any) =>
              message.id
          );

      if (
        unreadIds.length
      ) {
        const {
          error:
            readError,
        } = await supabase
          .from("messages")
          .update({
            read_at:
              new Date().toISOString(),
          })
          .in(
            "id",
            unreadIds
          );

        if (readError) {
          console.error(
            readError
          );
        }
      }
      } else {
    console.error(error);
  }

  if (
    requestId ===
    loadChatRequestRef.current
  ) {
    setLoadingChat(false);
  }
}


  async function loadOlderMessages() {
    if (
      !user ||
      !receiver ||
      loadingOlder ||
      !hasMoreHistory ||
      !messages.length
    ) {
      return;
    }

    const oldest =
      messages.find(
        (message) =>
          Number(message.id) > 0
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
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${user.id})`
        )
        .lt(
          "created_at",
          oldest.created_at
        )
        .order(
          "created_at",
          {
            ascending: false,
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

      const [
        reactionsResult,
        hiddenResult,
      ] = await Promise.all([
        supabase
          .from(
            "message_reactions"
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
            "direct"
          )
          .in(
            "message_id",
            ids
          ),
      ]);

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
              reactions:
                reactions.get(
                  message.id
                ) || [],
            })
          );

      setMessages(
        (current) => {
          const ids =
            new Set(
              current.map(
                (message) =>
                  message.id
              )
            );

          return [
            ...older.filter(
              (message) =>
                !ids.has(
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
        "No se pudo cargar historial:",
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
        `message-${messageId}`
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

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
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
      image &&
      file.size >
        MAX_IMAGE
    ) {
      alert(
        "La imagen debe pesar 15 MB o menos."
      );
      return;
    }

    if (
      video &&
      file.size >
        MAX_VIDEO
    ) {
      alert(
        "El video debe pesar 50 MB o menos."
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

    window.setTimeout(
      () =>
        scrollToBottom(
          "auto"
        ),
      40
    );
  }

  async function uploadMedia(
    file: File
  ) {
    if (
      !user ||
      !receiver
    ) {
      throw new Error(
        "Conversación no disponible."
      );
    }

    const type =
      file.type.startsWith(
        "video/"
      )
        ? "video"
        : "image";

    const path =
      `${user.id}/${receiver.id}/${Date.now()}-${safeFileName(
        file.name ||
          type
      )}`;

    const preview =
      await createMessageMediaPreview(
        file
      );

    const { error } =
      await supabase.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            contentType:
              file.type,
            upsert: false,
          }
        );

    if (error) {
      throw error;
    }

    return {
      path,
      type,
      mime: file.type,
      name:
        file.name ||
        null,
      preview,
      size:
        file.size,
    };
  }

  async function handleSendMessage(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    if (
      editingMessage
    ) {
      const value =
        newMessage.trim();

      if (
        !value ||
        !user ||
        sending
      ) {
        return;
      }

      setSending(true);

      const {
        error,
      } = await supabase.rpc(
        "alumni_edit_direct_message",
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

      setEditingMessage(
        null
      );
      setNewMessage("");
      return;
    }

    if (
      (!newMessage.trim() &&
        !mediaFile) ||
      !user ||
      !receiver ||
      sending
    ) {
      return;
    }

    const textToSend =
      newMessage.trim();

    const fileToSend =
      mediaFile;

    if (
      typeof navigator !==
        "undefined" &&
      !navigator.onLine
    ) {
      if (fileToSend) {
        alert(
          "Sin conexión. La foto o video se mantendrá listo para enviar cuando vuelvas a conectarte."
        );
        return;
      }

      const queueId =
        `direct-${Date.now()}`;

      queueOutbox({
        id: queueId,
        scope: "direct",
        conversationId:
          username,
        receiverId:
          receiver.id,
        content:
          textToSend,
        replyToId:
          replyingTo?.id ||
          null,
        createdAt:
          new Date()
            .toISOString(),
      });

      setMessages(
        (current) => [
          ...current,
          {
            id:
              -Date.now(),
            sender_id:
              user.id,
            receiver_id:
              receiver.id,
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
            reactions: [],
            _queued:
              true,
          },
        ]
      );

      setNewMessage("");
      setReplyingTo(null);
      stickToBottomRef.current =
        true;

      window.requestAnimationFrame(
        () =>
          scrollToBottom(
            "smooth"
          )
      );

      return;
    }

    const replyToSend =
      replyingTo;

    const optimisticId =
      -Date.now();

    const optimisticLocalPreview =
      fileToSend
        ? URL.createObjectURL(
            fileToSend
          )
        : "";

    const optimisticMediaType =
      fileToSend
        ? fileToSend.type
            .startsWith(
              "video/"
            )
          ? "video"
          : "image"
        : null;

    const optimisticMessage = {
      id:
        optimisticId,
      sender_id:
        user.id,
      receiver_id:
        receiver.id,
      content:
        textToSend ||
        null,
      message_type:
        optimisticMediaType ||
        "text",
      media_path:
        null,
      media_type:
        optimisticMediaType,
      media_mime:
        fileToSend?.type ||
        null,
      media_name:
        null,
      media_preview:
        optimisticLocalPreview ||
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
      read_at:
        null,
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
        optimisticMessage,
      ]
    );

    setNewMessage("");
    setReplyingTo(null);

    if (fileToSend) {
      setMediaFile(null);
      setMediaPreview("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    }

    broadcastTyping(false);

    window.requestAnimationFrame(
      () =>
        scrollToBottom(
          "smooth"
        )
    );

    let uploaded:
      | string
      | null = null;

    try {
      const media =
        fileToSend
          ? await uploadMedia(
              fileToSend
            )
          : null;

      uploaded =
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
          .from("messages")
          .insert({
            sender_id:
              user.id,
            receiver_id:
              receiver.id,
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
                    reactions: [],
                  }
                : message
          )
      );

      if (
        optimisticLocalPreview
      ) {
        window.setTimeout(
          () =>
            URL.revokeObjectURL(
              optimisticLocalPreview
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

      if (uploaded) {
        await supabase.storage
          .from(BUCKET)
          .remove([
            uploaded,
          ]);
      }

      if (
        optimisticLocalPreview
      ) {
        URL.revokeObjectURL(
          optimisticLocalPreview
        );
      }

      setNewMessage(
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
          "No se pudo enviar el mensaje."
      );
    } finally {
      setSending(false);

      window.requestAnimationFrame(
        () => {
          textareaRef.current?.focus();
        }
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
        "deleted"
    ) {
      return;
    }

    clearMedia();
    setReplyingTo(null);
    setEditingMessage(
      message
    );
    setNewMessage(
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
            "direct",
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
      user?.id
    ) {
      return;
    }

    const approved =
      confirm(
        "¿Eliminar este mensaje para todos?"
      );

    if (!approved) return;

    const mediaPath =
      message.media_path;

    const { error } =
      await supabase.rpc(
        "alumni_delete_direct_message_for_everyone",
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

  function beginReply(
    message: any
  ) {
    setReplyingTo(
      message
    );

    window.requestAnimationFrame(
      () => {
        textareaRef.current?.focus();
      }
    );
  }

  function broadcastTyping(
    typing: boolean
  ) {
    if (
      !user ||
      !receiver ||
      !chatChannelRef.current
    ) {
      return;
    }

    void chatChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: {
        user_id: user.id,
        typing,
      },
    });
  }

  function signalTyping(
    value: string
  ) {
    broadcastTyping(
      Boolean(value.trim())
    );

    if (
      typingTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        typingTimerRef.current
      );
    }

    typingTimerRef.current =
      window.setTimeout(
        () =>
          broadcastTyping(false),
        1200
      );
  }

  async function toggleMessageReaction(
    messageId: number,
    emoji: string
  ) {
    if (!user) return;

    const message =
      messages.find(
        (item) =>
          item.id === messageId
      );

    const mine =
      message?.reactions?.find(
        (reaction: any) =>
          reaction.user_id ===
          user.id
      );

    try {
      if (
        mine?.emoji === emoji
      ) {
        const { error } =
          await supabase
            .from(
              "message_reactions"
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

        if (error) throw error;
      } else {
        if (mine) {
          await supabase
            .from(
              "message_reactions"
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
        }

        const { error } =
          await supabase
            .from(
              "message_reactions"
            )
            .insert({
              message_id:
                messageId,
              user_id:
                user.id,
              emoji,
            });

        if (error) throw error;
      }

      await loadChat(false);
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo actualizar la reacción."
      );
    }
  }

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

  function openSearch() {
    setMenuOpen(false);
    setSearchOpen(true);

    window.setTimeout(
      () => {
        searchInputRef.current?.focus();
      },
      40
    );
  }

  function closeSearch() {
    setSearchOpen(false);
    setChatSearch("");

    window.setTimeout(
      () =>
        scrollToBottom(
          "auto"
        ),
      20
    );
  }

  if (
    !loadingChat &&
    !receiver
  ) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[760px] pt-10 text-center">
          <h1 className="text-xl font-black text-[var(--app-text)]">
            Usuario no encontrado
          </h1>

          <Link
            href="/messages"
            className="mt-4 inline-flex text-sm font-black text-[var(--app-accent)]"
          >
            Volver a mensajes
          </Link>
        </div>
      </AppShell>
    );
  }

  const chatStyle = {
    "--chat-vh":
      visualHeight
        ? `${visualHeight}px`
        : "100dvh",
    "--chat-top":
      `${visualOffsetTop}px`,
  } as CSSProperties;

  return (
    <AppShell immersiveMobile>
      <div
        style={chatStyle}
        className="alumni-chat-stage fixed inset-x-0 top-[var(--chat-top)] z-[80] mx-auto flex h-[var(--chat-vh)] w-full max-w-[780px] flex-col overflow-hidden overscroll-none bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-132px)] lg:min-h-[540px] lg:rounded-[24px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:shadow-[0_24px_70px_var(--app-shadow)]"
      >
        <header className="relative z-50 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_95%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
          <div className="flex min-h-[56px] items-center gap-2 px-2.5 sm:px-3.5">
            <Link
              href="/messages"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition active:bg-[var(--app-soft-strong)]"
              aria-label="Volver a mensajes"
            >
              <ArrowLeft
                size={20}
              />
            </Link>

            <Link
              href={
                receiver
                  ? `/u/${receiver.username}`
                  : "#"
              }
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                {receiver?.avatar_url ? (
                  <img
                    src={
                      receiver.avatar_url
                    }
                    alt={
                      receiver.username
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  receiver?.username
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "U"
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-[15px] font-black text-[var(--app-text)]">
                  @
                  {receiver?.username ||
                    username}
                </h1>

                <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-2)]">
                  {[
                    receiver?.career,
                    receiver?.university,
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    "Comunidad Alumni"}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={
                openSearch
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition active:bg-[var(--app-soft-strong)]"
              aria-label="Buscar en la conversación"
            >
              <Search
                size={18}
              />
            </button>

            <div
              ref={menuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(
                    (value) =>
                      !value
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition active:bg-[var(--app-soft-strong)]"
                aria-label="Opciones de conversación"
              >
                <MoreHorizontal
                  size={19}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-[100] w-52 overflow-hidden rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[0_20px_60px_var(--app-shadow)]">
                  <Link
                    href={
                      receiver
                        ? `/u/${receiver.username}`
                        : "#"
                    }
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                    className="flex items-center gap-3 rounded-[13px] px-3 py-3 text-[12px] font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-soft)]"
                  >
                    <UserRound
                      size={16}
                    />
                    Ver perfil
                  </Link>

                  <button
                    type="button"
                    onClick={
                      openSearch
                    }
                    className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-[12px] font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-soft)]"
                  >
                    <Search
                      size={16}
                    />
                    Buscar mensajes
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(
                        false
                      );
                      setSharedOpen(
                        true
                      );
                    }}
                    className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-[12px] font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-soft)]"
                  >
                    <Images
                      size={16}
                    />
                    Archivos compartidos
                  </button>
                </div>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="flex items-center gap-2 border-t border-[var(--app-border)] px-3 py-2">
              <Search
                size={15}
                className="shrink-0 text-[var(--app-muted-2)]"
              />

              <input
                ref={
                  searchInputRef
                }
                value={
                  chatSearch
                }
                onChange={(
                  event
                ) =>
                  setChatSearch(
                    event.target.value
                  )
                }
                placeholder="Buscar en esta conversación"
                className="alumni-mobile-input h-9 min-w-0 flex-1 bg-transparent text-[16px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)] sm:text-[14px]"
              />

              {chatSearch && (
                <span className="shrink-0 text-[10px] font-bold text-[var(--app-muted-2)]">
                  {
                    visibleMessages.length
                  }
                </span>
              )}

              <button
                type="button"
                onClick={
                  closeSearch
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] active:bg-[var(--app-soft)]"
                aria-label="Cerrar búsqueda"
              >
                <X
                  size={16}
                />
              </button>
            </div>
          )}
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
          className="alumni-chat-scroll alumni-chat-wallpaper scrollbar-thin min-h-0 flex-1 overscroll-contain overflow-y-auto px-2.5 py-3 sm:px-5 sm:py-4"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 0%, color-mix(in srgb,var(--app-accent) 7%,transparent), transparent 34%), radial-gradient(circle at 88% 100%, color-mix(in srgb,var(--app-accent) 4%,transparent), transparent 30%), linear-gradient(180deg, color-mix(in srgb,var(--app-bg) 97%,var(--app-surface)), var(--app-bg))",
            backgroundSize:
              "100% 100%",
            backgroundPosition:
              "0 0",
          }}
        >
          {loadingChat ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-[var(--app-muted-2)]">
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Cargando conversación
              </div>
            </div>
          ) : visibleMessages.length ===
            0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                {searchOpen &&
                chatSearch ? (
                  <>
                    <Search
                      size={24}
                      className="mx-auto text-[var(--app-muted-3)]"
                    />
                    <p className="mt-4 text-sm font-black text-[var(--app-text-soft)]">
                      Sin resultados
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-muted-2)]">
                      No encontramos ese texto en la conversación.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-lg font-black ring-1 ring-[var(--app-border)]">
                      {receiver?.avatar_url ? (
                        <img
                          src={
                            receiver.avatar_url
                          }
                          alt={
                            receiver.username
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        receiver?.username
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        "U"
                      )}
                    </div>

                    <p className="mt-4 text-sm font-black text-[var(--app-text-soft)]">
                      Empieza la conversación
                    </p>

                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--app-muted-2)]">
                      Escribe un mensaje o comparte una foto o video.
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div>
              {visibleMessages.map(
                (
                  message: any,
                  index
                ) => {
                  const mine =
                    message.sender_id ===
                    user?.id;

                  const story =
                    message.message_type ===
                    "story_reply";

                  const media =
                    message.media_type ===
                      "image" ||
                    message.media_type ===
                      "video";

                  const previous =
                    visibleMessages[
                      index - 1
                    ];

                  const next =
                    visibleMessages[
                      index + 1
                    ];

                  const showDay =
                    !previous ||
                    dayKey(
                      previous.created_at
                    ) !==
                      dayKey(
                        message.created_at
                      );

                  const previousPlain =
                    previous &&
                    previous.sender_id ===
                      message.sender_id &&
                    previous.message_type !==
                      "story_reply" &&
                    !previous.media_type;

                  const nextPlain =
                    next &&
                    next.sender_id ===
                      message.sender_id &&
                    next.message_type !==
                      "story_reply" &&
                    !next.media_type &&
                    dayKey(
                      next.created_at
                    ) ===
                      dayKey(
                        message.created_at
                      );

                  const grouped =
                    Boolean(
                      previousPlain
                    ) &&
                    !showDay;

                  const isLastInGroup =
                    !nextPlain;

                  const isLastOwn =
                    message.id ===
                    lastOwnMessageId;

                  return (
                    <div
                      key={
                        message.id
                      }
                      id={`message-${message.id}`}
                      className={`rounded-[10px] transition-colors duration-700 ${
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

                      {showDay && (
                        <div className="my-3 flex items-center justify-center">
                          <span className="rounded-full border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] px-3 py-1.5 text-[10px] font-black text-[var(--app-muted-2)] backdrop-blur-xl">
                            {dayLabel(
                              message.created_at
                            )}
                          </span>
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
                        className={`group flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        } ${
                          grouped
                            ? "mt-0.5"
                            : "mt-1.5"
                        }`}
                      >
                        {message.message_type ===
                        "deleted" ? (
                          <div
                            className={`alumni-message-bubble max-w-[78%] px-3 py-2 italic sm:max-w-[62%] ${
                              mine
                                ? "alumni-message-mine opacity-80"
                                : "alumni-message-other opacity-80"
                            }`}
                          >
                            <p className="text-[14px]">
                              Mensaje eliminado
                            </p>
                          </div>
                        ) : story ? (
                          <div
                            className={`max-w-[80%] overflow-hidden rounded-[18px] border sm:max-w-[66%] ${
                              mine
                                ? "border-[color-mix(in_srgb,var(--app-accent)_24%,transparent)] bg-[var(--app-accent-soft)]"
                                : "bg-[var(--app-surface)]"
                            }`}
                          >
                            {message.is_forwarded && (
                              <p className="mb-1.5 text-[10px] font-bold italic text-[var(--app-muted-2)]">
                                Reenviado
                              </p>
                            )}

                            <MessageReplyQuote
                              message={message}
                              messages={messages}
                              currentUserId={user?.id}
                              peerUsername={receiver?.username}
                              onJump={flashAndScrollToMessage}
                            />

                            {message.story_media_url && (
                              <div className="relative">
                                <img
                                  src={
                                    message.story_media_url
                                  }
                                  alt="Historia respondida"
                                  className="max-h-[31dvh] w-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2 pt-8">
                                  <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white/70">
                                    Respuesta a historia
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="px-3.5 py-3">
                              <p className="text-[15px] leading-[1.45] text-[var(--app-text-soft)]">
                                {
                                  message.content
                                }
                              </p>

                              <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] text-[var(--app-muted-3)]">
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
                                  ) : message.read_at ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-[var(--app-accent)]"
                                    />
                                  ) : message.delivered_at ? (
                                    <CheckCheck
                                      size={13}
                                    />
                                  ) : (
                                    <Check
                                      size={12}
                                    />
                                  ))}
                              </div>
                            </div>
                          </div>
                        ) : media ? (
                          <div
                            className={`w-fit max-w-[82%] overflow-hidden rounded-[16px] sm:max-w-[66%] ${
                              mine
                                ? "alumni-message-media-mine"
                                : "bg-[var(--app-surface)]"
                            }`}
                          >
                            <MessageReplyQuote
                              message={message}
                              messages={messages}
                              currentUserId={user?.id}
                              peerUsername={receiver?.username}
                              onJump={flashAndScrollToMessage}
                            />

                            <DeferredMessageMedia
                              bucket={BUCKET}
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
                              reportType="message"
                            />

                            <div className="px-3.5 py-2.5">
                              {message.content && (
                                <p className="text-[15px] leading-[1.45] text-[var(--app-text-soft)]">
                                  {
                                    message.content
                                  }
                                </p>
                              )}

                              <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-[var(--app-muted-3)]">
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
                                  ) : message.read_at ? (
                                    <CheckCheck
                                      size={13}
                                      className="text-[var(--app-accent)]"
                                    />
                                  ) : message.delivered_at ? (
                                    <CheckCheck
                                      size={13}
                                    />
                                  ) : (
                                    <Check
                                      size={12}
                                    />
                                  ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`alumni-message-bubble max-w-[78%] px-3 py-2 sm:max-w-[62%] ${
                              mine
                                ? `alumni-message-mine ${
                                    isLastInGroup
                                      ? "rounded-br-[7px]"
                                      : ""
                                  }`
                                : `alumni-message-other ${
                                    isLastInGroup
                                      ? "rounded-bl-[7px]"
                                      : ""
                                  }`
                            }`}
                          >
                            <MessageReplyQuote
                              message={message}
                              messages={messages}
                              currentUserId={user?.id}
                              peerUsername={receiver?.username}
                              onJump={flashAndScrollToMessage}
                            />

                            <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45]">
                              {
                                message.content
                              }
                            </p>

                            <div
                              className={`mt-1 flex items-center justify-end gap-1 ${
                                mine
                                  ? "text-[color-mix(in_srgb,var(--app-on-accent)_58%,transparent)]"
                                  : "text-[var(--app-muted-3)]"
                              }`}
                            >
                              <span className="text-[10px]">
                                {message.edited_at && (
                                  <span className="mr-1 text-[9px]">
                                    Editado
                                  </span>
                                )}
                                {time(
                                  message.created_at
                                )}
                              </span>

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
                                ) : message.read_at ? (
                                  <CheckCheck
                                    size={13}
                                    className="text-[var(--app-accent)]"
                                  />
                                ) : message.delivered_at ? (
                                  <CheckCheck
                                    size={13}
                                  />
                                ) : (
                                  <Check
                                    size={12}
                                  />
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                      </SwipeToReply>

                      <MessageProTools
                        message={message}
                        messages={messages}
                        mine={mine}
                        currentUserId={user?.id}
                        onReply={() =>
                          beginReply(
                            message
                          )
                        }
                        onReact={(emoji) =>
                          toggleMessageReaction(
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

                      {mine &&
                        isLastOwn &&
                        !searchOpen &&
                        Number(message.id) > 0 && (
                          <p className="mt-1.5 pr-1 text-right text-[10px] font-semibold text-[var(--app-muted-2)]">
                            {message.read_at
                              ? "Visto"
                              : message.delivered_at
                              ? "Entregado"
                              : "Enviado"}
                          </p>
                        )}
                    </div>
                  );
                }
              )}
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
              scrollToBottom(
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

        {receiverTyping && (
          <div className="shrink-0 px-4 pb-1.5 text-[12px] font-semibold text-[var(--app-muted-2)]">
            @{receiver?.username || username} está escribiendo…
          </div>
        )}

        <form
          onSubmit={
            handleSendMessage
          }
          className="alumni-chat-composer-shell shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-2xl sm:px-3 sm:pb-3 sm:pt-2"
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
                  setNewMessage("");
                }}
                aria-label="Cancelar edición"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <ComposerReplyPreview
            message={replyingTo}
            currentUserId={user?.id}
            peerUsername={receiver?.username}
            onClose={() =>
              setReplyingTo(null)
            }
          />

          {mediaFile && (
            <div className="mb-2 flex items-center gap-3 rounded-[18px] border border-[var(--app-border)] bg-[var(--app-soft)] p-2">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[13px] bg-black/20">
                {mediaFile.type.startsWith(
                  "video/"
                ) ? (
                  <video
                    src={
                      mediaPreview
                    }
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={
                      mediaPreview
                    }
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="mt-0.5 text-[10px] text-[var(--app-muted-3)]">
                  {mediaFile.type.startsWith(
                    "video/"
                  )
                    ? "Video"
                    : "Foto"}{" "}
                  ·{" "}
                  {(
                    mediaFile.size /
                    1024 /
                    1024
                  ).toFixed(1)}{" "}
                  MB
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearMedia
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition active:bg-[var(--app-soft-strong)]"
                aria-label="Quitar archivo"
              >
                <X
                  size={15}
                />
              </button>
            </div>
          )}

          <div className="alumni-chat-composer flex items-end gap-1 rounded-[21px] border p-1">
            <input
              ref={
                fileInputRef
              }
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
                fileInputRef.current?.click()
              }
              disabled={
                !receiver ||
                sending ||
                Boolean(
                  editingMessage
                )
              }
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[var(--app-accent)] transition active:bg-[var(--app-accent-soft)] disabled:opacity-40"
              aria-label="Adjuntar foto o video"
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
              value={
                newMessage
              }
              onChange={(
                event
              ) => {
                setNewMessage(
                  event.target.value
                );

                signalTyping(
                  event.target.value
                );

                resizeTextarea(
                  event.target
                );
              }}
              onFocus={() => {
                [
                  40,
                  120,
                  260,
                ].forEach(
                  (delay) => {
                    window.setTimeout(
                      () =>
                        scrollToBottom(
                          "auto"
                        ),
                      delay
                    );
                  }
                );
              }}
              autoComplete="off"
              autoCorrect="on"
              spellCheck
              enterKeyHint="send"
              onKeyDown={(
                event
              ) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  void handleSendMessage();
                }
              }}
              placeholder={
                mediaFile
                  ? "Añade un mensaje..."
                  : "Escribe un mensaje"
              }
              className="alumni-mobile-input min-h-[38px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-[9px] text-[16px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-2)] sm:text-[15px]"
            />

            <button
              type="submit"
              disabled={
                (!newMessage.trim() &&
                  !mediaFile) ||
                !receiver ||
                sending
              }
              className="alumni-accent-button flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Enviar mensaje"
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

        {sharedOpen && (
          <div className="absolute inset-0 z-[120] flex flex-col bg-[var(--app-bg)]">
            <header className="shrink-0 border-b border-[var(--app-border)] bg-[var(--app-surface)] pt-[env(safe-area-inset-top)]">
              <div className="flex min-h-[64px] items-center gap-3 px-3">
                <button
                  type="button"
                  onClick={() =>
                    setSharedOpen(
                      false
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--app-muted)] active:bg-[var(--app-soft)]"
                  aria-label="Volver"
                >
                  <ArrowLeft
                    size={19}
                  />
                </button>

                <div>
                  <p className="text-sm font-black text-[var(--app-text)]">
                    Archivos compartidos
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--app-muted-2)]">
                    {
                      sharedMedia.length
                    }{" "}
                    elementos
                  </p>
                </div>
              </div>
            </header>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
              {sharedMedia.length ===
              0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <Images
                      size={28}
                      className="mx-auto text-[var(--app-muted-3)]"
                    />
                    <p className="mt-4 text-sm font-black text-[var(--app-text-soft)]">
                      No hay archivos todavía
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted-2)]">
                      Las fotos y videos que compartan aparecerán aquí.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 sm:gap-2">
                  {sharedMedia.map(
                    (
                      message
                    ) => (
                      <a
                        key={
                          message.id
                        }
                        href={
                          message.media_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden rounded-[14px] bg-[var(--app-soft)]"
                      >
                        {message.media_type ===
                        "video" ? (
                          <video
                            src={
                              message.media_url
                            }
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={
                              message.media_url
                            }
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}

                        {message.media_type ===
                          "video" && (
                          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[8px] font-black text-white">
                            VIDEO
                          </span>
                        )}
                      </a>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* ALUMNI_1_2_0_1_MESSAGING_PRO_CONTINUATION */

/* ALUMNI_1_2_1_MESSAGING_EXPERIENCE */

/* ALUMNI_1_2_3_SCROLL_MESSAGES_STABILITY:CHAT */

/* ALUMNI_1_3_0_GROUPS_MEDIA_PRO:DIRECT_CHAT */

/* ALUMNI_1_3_2_MESSAGING_POLISH:DIRECT */

/* ALUMNI_1_3_4_GROUP_MODAL_MEDIA_POLISH:DIRECT */

/* ALUMNI_1_3_5_MEDIA_MODAL_SPOTIFY_FIX:DIRECT */

/* ALUMNI_1_3_7_MESSAGING_GLOBAL_STABILITY:DIRECT_CHAT */

/* ALUMNI_1_5_0_MESSAGING_2_HOME_NAV:DIRECT */

/* ALUMNI_1_5_0_FIX3_VISIBLE_HYDRATED_ORDER */
