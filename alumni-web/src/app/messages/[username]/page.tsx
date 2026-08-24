"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, MoreHorizontal, Send, X } from "lucide-react";
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    loadChat();

    const channel = supabase
      .channel(`chat:${user.id}:${username}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => loadChat(false))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `sender_id=eq.${user.id}`,
      }, () => loadChat(false))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  async function hydrateMedia(rows: any[]) {
    const paths = [...new Set(rows.map((m: any) => m.media_path).filter(Boolean))];
    if (!paths.length) return rows;

    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
    const map = new Map((data || []).map((item: any) => [item.path, item.signedUrl || null]));

    return rows.map((m: any) => ({
      ...m,
      media_url: m.media_path ? map.get(m.media_path) || null : null,
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
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`)
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
    if (mediaPreview.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
    setMediaFile(null);
    setMediaPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function selectMedia(file?: File) {
    if (!file) return;

    const image = file.type.startsWith("image/");
    const video = file.type.startsWith("video/");

    if (!image && !video) return alert("Solo puedes enviar fotos o videos.");
    if (image && file.size > MAX_IMAGE) return alert("La imagen debe pesar 15 MB o menos.");
    if (video && file.size > MAX_VIDEO) return alert("El video debe pesar 50 MB o menos.");

    clearMedia();
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  }

  async function uploadMedia(file: File) {
    if (!user || !receiver) throw new Error("Conversación no disponible.");

    const type = file.type.startsWith("video/") ? "video" : "image";
    const path = `${user.id}/${receiver.id}/${Date.now()}-${safeFileName(file.name || type)}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;
    return { path, type, mime: file.type, name: file.name || null };
  }

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaFile) || !user || !receiver || sending) return;

    setSending(true);
    let uploaded: string | null = null;

    try {
      const media = mediaFile ? await uploadMedia(mediaFile) : null;
      uploaded = media?.path || null;

      const { error } = await supabase.from("messages").insert({
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
    } catch (error: any) {
      if (uploaded) await supabase.storage.from(BUCKET).remove([uploaded]);
      alert(error?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  }

  function time(date: string) {
    return new Date(date).toLocaleTimeString("es-SV", {
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (!loadingChat && !receiver) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[760px] pt-10 text-center">
          <h1 className="text-xl font-bold text-white">Usuario no encontrado</h1>
          <Link href="/messages" className="mt-4 inline-flex text-sm font-semibold text-[#8d98ff]">
            Volver a mensajes
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100svh-112px)] min-h-[560px] w-full max-w-[820px] flex-col overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#101318]/95 shadow-[0_30px_100px_rgba(0,0,0,.22)]">
        <header className="flex min-h-[72px] items-center gap-3 border-b border-white/[0.06] px-3.5 sm:px-5">
          <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500" aria-label="Volver">
            <ArrowLeft size={19} />
          </Link>

          <Link href={receiver ? `/u/${receiver.username}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold text-white ring-1 ring-white/10">
              {receiver?.avatar_url ? (
                <img src={receiver.avatar_url} alt={receiver.username} className="h-full w-full object-cover" />
              ) : (
                receiver?.username?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white">@{receiver?.username || username}</h1>
              <p className="mt-0.5 truncate text-[11px] text-zinc-600">
                {[receiver?.career, receiver?.university].filter(Boolean).join(" · ") || "Comunidad Alumni"}
              </p>
            </div>
          </Link>

          <button className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600">
            <MoreHorizontal size={19} />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3.5 py-5 sm:px-6">
          {loadingChat ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">Cargando conversación...</div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-zinc-600">
              Envía un mensaje, una foto o un video a @{receiver?.username}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {messages.map((m: any) => {
                const mine = m.sender_id === user?.id;
                const story = m.message_type === "story_reply";
                const media = m.media_type === "image" || m.media_type === "video";

                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    {story ? (
                      <div className="max-w-[82%] overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.04] sm:max-w-[68%]">
                        {m.story_media_url && (
                          <img src={m.story_media_url} alt="Historia respondida" className="max-h-[220px] w-full object-cover" />
                        )}
                        <div className="px-4 py-3">
                          <p className="text-sm text-zinc-200">{m.content}</p>
                          <p className="mt-1 text-[10px] text-zinc-700">{time(m.created_at)}</p>
                        </div>
                      </div>
                    ) : media ? (
                      <div className={`max-w-[84%] overflow-hidden rounded-[20px] border sm:max-w-[72%] ${
                        mine ? "border-[#6d7cff]/25 bg-[#6d7cff]/10" : "border-white/[0.08] bg-white/[0.04]"
                      }`}>
                        {m.media_url ? (
                          m.media_type === "video" ? (
                            <video src={m.media_url} controls playsInline preload="metadata" className="max-h-[420px] w-full bg-black object-contain" />
                          ) : (
                            <img src={m.media_url} alt={m.media_name || "Foto enviada"} className="max-h-[460px] w-full object-contain" />
                          )
                        ) : (
                          <div className="px-5 py-8 text-center text-xs text-zinc-600">Archivo no disponible.</div>
                        )}

                        <div className="px-3.5 py-2.5">
                          {m.content && <p className="text-sm leading-5 text-zinc-200">{m.content}</p>}
                          <p className="mt-1 text-[10px] text-zinc-700">{time(m.created_at)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className={`max-w-[78%] rounded-[18px] px-4 py-2.5 sm:max-w-[70%] ${
                        mine ? "rounded-br-md bg-[#6d7cff] text-white" : "rounded-bl-md bg-white/[0.055] text-zinc-200"
                      }`}>
                        <p className="whitespace-pre-wrap break-words text-sm leading-5">{m.content}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-zinc-700"}`}>{time(m.created_at)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-white/[0.06] bg-[#0d1015]/96 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 sm:pb-4">
          {mediaFile && (
            <div className="mb-2 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2">
              <div className="h-14 w-14 overflow-hidden rounded-xl bg-black/30">
                {mediaFile.type.startsWith("video/") ? (
                  <video src={mediaPreview} muted playsInline className="h-full w-full object-cover" />
                ) : (
                  <img src={mediaPreview} alt="Vista previa" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-zinc-300">{mediaFile.name}</p>
                <p className="mt-1 text-[10px] text-zinc-700">
                  {mediaFile.type.startsWith("video/") ? "Video" : "Foto"} · {(mediaFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <button type="button" onClick={clearMedia} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-600">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-1.5 rounded-[22px] border border-white/[0.08] bg-white/[0.04] p-1.5 shadow-[0_10px_35px_rgba(0,0,0,.18)] transition focus-within:border-[#6d7cff]/35 focus-within:bg-white/[0.05]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(e) => selectMedia(e.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!receiver || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] text-[#8d98ff] transition hover:bg-[#6d7cff]/10 disabled:opacity-40"
              aria-label="Adjuntar foto o video"
            >
              <ImagePlus size={19} />
            </button>

            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={mediaFile ? "Añade un mensaje..." : "Mensaje..."}
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-sm leading-5 text-zinc-200 outline-none placeholder:text-zinc-700"
            />

            <button
              type="submit"
              disabled={(!newMessage.trim() && !mediaFile) || !receiver || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[#6d7cff] text-white shadow-[0_8px_20px_rgba(109,124,255,.22)] transition disabled:bg-white/[0.06] disabled:text-zinc-700 disabled:shadow-none"
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
