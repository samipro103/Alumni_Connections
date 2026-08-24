"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ImagePlus,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";

const BUCKET = "message-media";
const MAX_IMAGE = 15 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").slice(-120);
}

export default function ChatPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const { user, loading } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState<any>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [visualHeight, setVisualHeight] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    void loadChat();

    const channel = supabase
      .channel(`chat:${user.id}:${username}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => void loadChat(false)
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${user.id}`,
        },
        () => void loadChat(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, username]);

  useEffect(() => {
    function updateViewport() {
      const height =
        window.visualViewport?.height ||
        window.innerHeight;

      setVisualHeight(Math.max(320, Math.round(height)));

      window.setTimeout(() => {
        scrollToBottom("auto");
      }, 40);
    }

    updateViewport();

    const vv = window.visualViewport;

    vv?.addEventListener("resize", updateViewport);
    vv?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      vv?.removeEventListener("resize", updateViewport);
      vv?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length > 1 ? "smooth" : "auto");
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (mediaPreview.startsWith("blob:")) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  useEffect(() => {
    if (!newMessage && textareaRef.current) {
      textareaRef.current.style.height = "40px";
    }
  }, [newMessage]);

  function scrollToBottom(behavior: ScrollBehavior = "auto") {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  }

  function resizeTextarea(target: HTMLTextAreaElement) {
    target.style.height = "40px";
    target.style.height = `${Math.min(target.scrollHeight, 112)}px`;
  }

  async function hydrateMedia(rows: any[]) {
    const paths = [
      ...new Set(
        rows
          .map((message: any) => message.media_path)
          .filter(Boolean)
      ),
    ];

    if (!paths.length) return rows;

    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 3600);

    const map = new Map(
      (data || []).map((item: any) => [
        item.path,
        item.signedUrl || null,
      ])
    );

    return rows.map((message: any) => ({
      ...message,
      media_url: message.media_path
        ? map.get(message.media_path) || null
        : null,
    }));
  }

  async function loadChat(showLoader = true) {
    if (!user) return;
    if (showLoader) setLoadingChat(true);

    const { data: receiverData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, university, career")
      .eq("username", username)
      .maybeSingle();

    if (!receiverData) {
      setReceiver(null);
      setLoadingChat(false);
      return;
    }

    setReceiver(receiverData);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(await hydrateMedia(data || []));

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", user.id)
        .eq("sender_id", receiverData.id)
        .is("read_at", null);
    }

    setLoadingChat(false);
  }

  function clearMedia() {
    if (mediaPreview.startsWith("blob:")) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaFile(null);
    setMediaPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function selectMedia(file?: File) {
    if (!file) return;

    const image = file.type.startsWith("image/");
    const video = file.type.startsWith("video/");

    if (!image && !video) {
      alert("Solo puedes enviar fotos o videos.");
      return;
    }

    if (image && file.size > MAX_IMAGE) {
      alert("La imagen debe pesar 15 MB o menos.");
      return;
    }

    if (video && file.size > MAX_VIDEO) {
      alert("El video debe pesar 50 MB o menos.");
      return;
    }

    clearMedia();
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  async function uploadMedia(file: File) {
    if (!user || !receiver) {
      throw new Error("Conversación no disponible.");
    }

    const type = file.type.startsWith("video/") ? "video" : "image";
    const path =
      `${user.id}/${receiver.id}/${Date.now()}-${safeFileName(
        file.name || type
      )}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    return {
      path,
      type,
      mime: file.type,
      name: file.name || null,
    };
  }

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault();

    if (
      (!newMessage.trim() && !mediaFile) ||
      !user ||
      !receiver ||
      sending
    ) {
      return;
    }

    setSending(true);
    let uploaded: string | null = null;

    try {
      const media = mediaFile
        ? await uploadMedia(mediaFile)
        : null;

      uploaded = media?.path || null;

      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: receiver.id,
          content: newMessage.trim() || null,
          message_type: media ? media.type : "text",
          media_path: media?.path || null,
          media_type: media?.type || null,
          media_mime: media?.mime || null,
          media_name: media?.name || null,
        });

      if (error) throw error;

      setNewMessage("");
      clearMedia();

      await loadChat(false);

      window.setTimeout(() => {
        scrollToBottom("smooth");
        textareaRef.current?.focus();
      }, 40);
    } catch (error: any) {
      if (uploaded) {
        await supabase.storage
          .from(BUCKET)
          .remove([uploaded]);
      }

      alert(
        error?.message ||
          "No se pudo enviar el mensaje."
      );
    } finally {
      setSending(false);
    }
  }

  function time(date: string) {
    return new Date(date).toLocaleTimeString("es-SV", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (!loadingChat && !receiver) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[760px] pt-10 text-center">
          <h1 className="text-xl font-bold text-[var(--app-text)]">
            Usuario no encontrado
          </h1>
          <Link
            href="/messages"
            className="mt-4 inline-flex text-sm font-semibold text-[var(--app-accent)]"
          >
            Volver a mensajes
          </Link>
        </div>
      </AppShell>
    );
  }

  const chatStyle = {
    "--chat-vh": visualHeight
      ? `${visualHeight}px`
      : "100dvh",
  } as CSSProperties;

  return (
    <AppShell immersiveMobile>
      <div
        style={chatStyle}
        className="fixed inset-x-0 top-0 z-[80] mx-auto flex h-[var(--chat-vh)] w-full max-w-[820px] flex-col overflow-hidden bg-[var(--app-bg)] lg:static lg:h-[calc(100vh-112px)] lg:min-h-[620px] lg:rounded-[26px] lg:border lg:border-[var(--app-border)] lg:bg-[var(--app-surface)] lg:shadow-[0_30px_100px_var(--app-shadow)]"
      >
        <header className="shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_94%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-xl">
          <div className="flex min-h-[62px] items-center gap-2.5 px-3 sm:px-5">
            <Link
              href="/messages"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition active:bg-[var(--app-soft)]"
              aria-label="Volver"
            >
              <ArrowLeft size={19} />
            </Link>

            <Link
              href={receiver ? `/u/${receiver.username}` : "#"}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                {receiver?.avatar_url ? (
                  <img
                    src={receiver.avatar_url}
                    alt={receiver.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  receiver?.username
                    ?.charAt(0)
                    ?.toUpperCase() || "U"
                )}
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-sm font-black text-[var(--app-text)]">
                  @{receiver?.username || username}
                </h1>
                <p className="mt-0.5 truncate text-[10px] text-[var(--app-muted-2)]">
                  {[receiver?.career, receiver?.university]
                    .filter(Boolean)
                    .join(" · ") || "Comunidad Alumni"}
                </p>
              </div>
            </Link>

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted-2)] transition active:bg-[var(--app-soft)]"
              aria-label="Opciones de conversación"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="scrollbar-thin min-h-0 flex-1 overscroll-contain overflow-y-auto px-3 py-4 sm:px-6 sm:py-5"
        >
          {loadingChat ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--app-muted-2)]">
              Cargando conversación...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-lg font-black ring-1 ring-[var(--app-border)]">
                  {receiver?.avatar_url ? (
                    <img
                      src={receiver.avatar_url}
                      alt={receiver.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    receiver?.username
                      ?.charAt(0)
                      ?.toUpperCase() || "U"
                  )}
                </div>
                <p className="mt-4 text-sm font-black text-[var(--app-text-soft)]">
                  Empieza la conversación
                </p>
                <p className="mt-1 text-xs leading-5 text-[var(--app-muted-2)]">
                  Puedes enviar mensajes, fotos y videos.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message: any) => {
                const mine =
                  message.sender_id === user?.id;
                const story =
                  message.message_type === "story_reply";
                const media =
                  message.media_type === "image" ||
                  message.media_type === "video";

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      mine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {story ? (
                      <div className="max-w-[84%] overflow-hidden rounded-[20px] border border-[var(--app-border)] bg-[var(--app-soft)] sm:max-w-[70%]">
                        {message.story_media_url && (
                          <img
                            src={message.story_media_url}
                            alt="Historia respondida"
                            className="max-h-[34dvh] w-full object-cover"
                          />
                        )}
                        <div className="px-3.5 py-2.5">
                          <p className="text-sm leading-5 text-[var(--app-text-soft)]">
                            {message.content}
                          </p>
                          <p className="mt-1 text-[9px] text-[var(--app-muted-3)]">
                            {time(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ) : media ? (
                      <div
                        className={`max-w-[86%] overflow-hidden rounded-[20px] border sm:max-w-[72%] ${
                          mine
                            ? "alumni-message-media-mine"
                            : "border-[var(--app-border)] bg-[var(--app-soft)]"
                        }`}
                      >
                        {message.media_url ? (
                          message.media_type === "video" ? (
                            <video
                              src={message.media_url}
                              controls
                              playsInline
                              preload="metadata"
                              className="max-h-[44dvh] w-full bg-black object-contain"
                            />
                          ) : (
                            <img
                              src={message.media_url}
                              alt={
                                message.media_name ||
                                "Foto enviada"
                              }
                              className="max-h-[48dvh] w-full object-contain"
                            />
                          )
                        ) : (
                          <div className="px-5 py-8 text-center text-xs text-[var(--app-muted-2)]">
                            Archivo no disponible.
                          </div>
                        )}

                        <div className="px-3.5 py-2.5">
                          {message.content && (
                            <p className="text-sm leading-5 text-[var(--app-text-soft)]">
                              {message.content}
                            </p>
                          )}
                          <p className="mt-1 text-[9px] text-[var(--app-muted-3)]">
                            {time(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[80%] rounded-[18px] px-3.5 py-2.5 sm:max-w-[70%] ${
                          mine
                            ? "alumni-message-mine rounded-br-[5px]"
                            : "alumni-message-other rounded-bl-[5px]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-[14px] leading-5">
                          {message.content}
                        </p>
                        <p
                          className={`mt-1 text-[9px] ${
                            mine
                              ? "text-white/55"
                              : "text-[var(--app-muted-3)]"
                          }`}
                        >
                          {time(message.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div ref={bottomRef} className="h-1" />
            </div>
          )}
        </div>

        <form
          onSubmit={handleSendMessage}
          className="shrink-0 border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_96%,transparent)] px-2.5 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:px-4 sm:pb-4 sm:pt-3"
        >
          {mediaFile && (
            <div className="mb-2 flex items-center gap-2.5 rounded-[16px] border border-[var(--app-border)] bg-[var(--app-soft)] p-2">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/25">
                {mediaFile.type.startsWith("video/") ? (
                  <video
                    src={mediaPreview}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaPreview}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-[var(--app-text-soft)]">
                  {mediaFile.name}
                </p>
                <p className="mt-0.5 text-[9px] text-[var(--app-muted-3)]">
                  {mediaFile.type.startsWith("video/")
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
                onClick={clearMedia}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--app-muted)] transition active:bg-[var(--app-soft-strong)]"
                aria-label="Quitar archivo"
              >
                <X size={15} />
              </button>
            </div>
          )}

          <div className="alumni-chat-composer flex items-end gap-1 rounded-[21px] border p-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(event) =>
                selectMedia(event.target.files?.[0])
              }
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={!receiver || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] text-[var(--app-accent)] transition active:bg-[var(--app-accent-soft)] disabled:opacity-40"
              aria-label="Adjuntar foto o video"
            >
              <ImagePlus size={19} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onChange={(event) => {
                setNewMessage(event.target.value);
                resizeTextarea(event.target);
              }}
              onFocus={() => {
                window.setTimeout(
                  () => scrollToBottom("smooth"),
                  120
                );
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  void handleSendMessage();
                }
              }}
              placeholder={
                mediaFile
                  ? "Añade un mensaje..."
                  : "Mensaje..."
              }
              className="min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-1.5 py-2.5 text-[14px] leading-5 text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-2)]"
            />

            <button
              type="submit"
              disabled={
                (!newMessage.trim() && !mediaFile) ||
                !receiver ||
                sending
              }
              className="alumni-accent-button flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] transition disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Enviar mensaje"
            >
              <Send size={17} />
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
