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

const BUCKET = "message-media";
const MAX_IMAGE =
  15 * 1024 * 1024;
const MAX_VIDEO =
  50 * 1024 * 1024;

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

    const refresh =
      () =>
        void loadChat(
          false
        );

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
            filter: `receiver_id=eq.${user.id}`,
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
        .subscribe();

    return () => {
  loadChatRequestRef.current += 1;

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

      const height =
        viewport?.height ||
        window.innerHeight;

      const offsetTop =
        viewport?.offsetTop ||
        0;

      setVisualHeight(
        Math.max(
          320,
          Math.round(
            height
          )
        )
      );

      setVisualOffsetTop(
        Math.max(
          0,
          Math.round(
            offsetTop
          )
        )
      );

      window.requestAnimationFrame(
        () => {
          scrollToBottom(
            "auto"
          );
        }
      );

      window.setTimeout(
        () => {
          scrollToBottom(
            "auto"
          );
        },
        90
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
      messages.length
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
    if (
      !newMessage &&
      textareaRef.current
    ) {
      textareaRef.current.style.height =
        "42px";
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
      "42px";

    target.style.height =
      `${Math.min(
        target.scrollHeight,
        118
      )}px`;
  }

  async function hydrateMedia(
    rows: any[]
  ) {
    const paths = [
      ...new Set(
        rows
          .map(
            (
              message: any
            ) =>
              message.media_path
          )
          .filter(Boolean)
      ),
    ];

    if (!paths.length) {
      return rows;
    }

    const { data } =
      await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          paths,
          3600
        );

    const map =
      new Map(
        (data || []).map(
          (item: any) => [
            item.path,
            item.signedUrl ||
              null,
          ]
        )
      );

    return rows.map(
      (message: any) => ({
        ...message,
        media_url:
          message.media_path
            ? map.get(
                message.media_path
              ) || null
            : null,
      })
    );
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

    const {
      data:
        receiverData,
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
  !receiverData
) {

      if (
        receiverError
      ) {
        console.error(
          receiverError
        );
      }

      setReceiver(null);
      setLoadingChat(
        false
      );
      return;
    }

    setReceiver(
      receiverData
    );

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
      ascending: true,
    }
  );

if (
  requestId !==
  loadChatRequestRef.current
) {
  return;
}

if (!error) {

      const hydrated =
  await hydrateMedia(
    data || []
  );

if (
  requestId !==
  loadChatRequestRef.current
) {
  return;
}

setMessages(

        hydrated
      );

      const {
        error:
          readError,
      } = await supabase
        .from("messages")
        .update({
          read_at:
            new Date().toISOString(),
        })
        .eq(
          "receiver_id",
          user.id
        )
        .eq(
          "sender_id",
          receiverData.id
        )
        .is(
          "read_at",
          null
        );

      if (readError) {
        console.error(
          readError
        );
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
    };
  }

  async function handleSendMessage(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    if (
      (!newMessage.trim() &&
        !mediaFile) ||
      !user ||
      !receiver ||
      sending
    ) {
      return;
    }

    setSending(true);

    let uploaded:
      | string
      | null = null;

    try {
      const media =
        mediaFile
          ? await uploadMedia(
              mediaFile
            )
          : null;

      uploaded =
        media?.path ||
        null;

      const { error } =
        await supabase
          .from("messages")
          .insert({
            sender_id:
              user.id,
            receiver_id:
              receiver.id,
            content:
              newMessage.trim() ||
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
          });

      if (error) {
        throw error;
      }

      setNewMessage("");
      clearMedia();

      await loadChat(false);

      window.requestAnimationFrame(
        () => {
          scrollToBottom(
            "smooth"
          );

          textareaRef.current?.focus();
        }
      );
    } catch (
      error: any
    ) {
      if (uploaded) {
        await supabase.storage
          .from(BUCKET)
          .remove([
            uploaded,
          ]);
      }

      alert(
        error?.message ||
          "No se pudo enviar el mensaje."
      );
    } finally {
      setSending(false);
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
        className="alumni-chat-stage fixed inset-x-0 top-[var(--chat-top)] z-[80] mx-auto flex h-[var(--chat-vh)] w-full max-w-[860px] flex-col overflow-hidden overscroll-none bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-112px)] lg:min-h-[620px] lg:rounded-[28px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:shadow-[0_30px_100px_var(--app-shadow)]"
      >
        <header className="relative z-50 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_95%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
          <div className="flex min-h-[64px] items-center gap-2 px-2.5 sm:px-4">
            <Link
              href="/messages"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition active:bg-[var(--app-soft-strong)]"
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
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
                <h1 className="truncate text-[14px] font-black text-[var(--app-text)]">
                  @
                  {receiver?.username ||
                    username}
                </h1>

                <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition active:bg-[var(--app-soft-strong)]"
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition active:bg-[var(--app-soft-strong)]"
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
                className="alumni-mobile-input h-9 min-w-0 flex-1 bg-transparent text-[16px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)] sm:text-[13px]"
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
          className="alumni-chat-scroll alumni-chat-wallpaper scrollbar-thin min-h-0 flex-1 overscroll-contain overflow-y-auto px-3 py-4 sm:px-7 sm:py-5"
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
                    >
                      {showDay && (
                        <div className="my-4 flex items-center justify-center">
                          <span className="rounded-full border border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)] px-3 py-1.5 text-[9px] font-black text-[var(--app-muted-2)] backdrop-blur-xl">
                            {dayLabel(
                              message.created_at
                            )}
                          </span>
                        </div>
                      )}

                      <div
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        } ${
                          grouped
                            ? "mt-1"
                            : "mt-2.5"
                        }`}
                      >
                        {story ? (
                          <div
                            className={`max-w-[84%] overflow-hidden rounded-[22px] border sm:max-w-[72%] ${
                              mine
                                ? "border-[color-mix(in_srgb,var(--app-accent)_24%,transparent)] bg-[var(--app-accent-soft)]"
                                : "border-[var(--app-border)] bg-[var(--app-surface)]"
                            }`}
                          >
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
                              <p className="text-[14px] leading-5 text-[var(--app-text-soft)]">
                                {
                                  message.content
                                }
                              </p>

                              <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[9px] text-[var(--app-muted-3)]">
                                {time(
                                  message.created_at
                                )}

                                {mine &&
                                  (message.read_at ? (
                                    <CheckCheck
                                      size={12}
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
                            className={`max-w-[86%] overflow-hidden rounded-[22px] border sm:max-w-[72%] ${
                              mine
                                ? "alumni-message-media-mine"
                                : "border-[var(--app-border)] bg-[var(--app-surface)]"
                            }`}
                          >
                            {message.media_url ? (
                              message.media_type ===
                              "video" ? (
                                <video
                                  src={
                                    message.media_url
                                  }
                                  controls
                                  playsInline
                                  preload="metadata"
                                  className="max-h-[48dvh] w-full bg-black object-contain"
                                />
                              ) : (
                                <a
                                  href={
                                    message.media_url
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block bg-black/15"
                                >
                                  <img
                                    src={
                                      message.media_url
                                    }
                                    alt={
                                      message.media_name ||
                                      "Foto enviada"
                                    }
                                    className="max-h-[52dvh] w-full object-contain"
                                  />
                                </a>
                              )
                            ) : (
                              <div className="px-5 py-10 text-center text-xs text-[var(--app-muted-2)]">
                                Archivo no disponible.
                              </div>
                            )}

                            <div className="px-3.5 py-2.5">
                              {message.content && (
                                <p className="text-[14px] leading-5 text-[var(--app-text-soft)]">
                                  {
                                    message.content
                                  }
                                </p>
                              )}

                              <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-[var(--app-muted-3)]">
                                {time(
                                  message.created_at
                                )}

                                {mine &&
                                  (message.read_at ? (
                                    <CheckCheck
                                      size={12}
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
                            className={`alumni-message-bubble max-w-[82%] px-3.5 py-2.5 sm:max-w-[68%] ${
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
                            <p className="whitespace-pre-wrap break-words text-[14px] leading-[1.42]">
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
                              <span className="text-[9px]">
                                {time(
                                  message.created_at
                                )}
                              </span>

                              {mine &&
                                (message.read_at ? (
                                  <CheckCheck
                                    size={12}
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

                      {mine &&
                        isLastOwn &&
                        message.read_at &&
                        !searchOpen && (
                          <p className="mt-1.5 pr-1 text-right text-[9px] font-semibold text-[var(--app-muted-3)]">
                            Visto
                          </p>
                        )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={
            handleSendMessage
          }
          className="alumni-chat-composer-shell shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_97%,transparent)] px-2.5 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl sm:px-4 sm:pb-4 sm:pt-3"
        >
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
                <p className="truncate text-[11px] font-black text-[var(--app-text-soft)]">
                  {
                    mediaFile.name
                  }
                </p>

                <p className="mt-0.5 text-[9px] text-[var(--app-muted-3)]">
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

          <div className="alumni-chat-composer flex items-end gap-1.5 rounded-[24px] border p-1.5">
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
                sending
              }
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-[var(--app-accent)] transition active:bg-[var(--app-accent-soft)] disabled:opacity-40"
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
              className="alumni-mobile-input min-h-[42px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-[11px] text-[16px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-2)] sm:text-[14px]"
            />

            <button
              type="submit"
              disabled={
                (!newMessage.trim() &&
                  !mediaFile) ||
                !receiver ||
                sending
              }
              className="alumni-accent-button flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
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
