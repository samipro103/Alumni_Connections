"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import AppShell from "@/components/layout/AppShell";

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

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    loadChat();

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
        () => loadChat(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages(messagesData || []);

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", user.id)
        .eq("sender_id", receiverData.id)
        .is("read_at", null);
    }

    setLoadingChat(false);
  }

  async function handleSendMessage(e?: React.FormEvent) {
    e?.preventDefault();

    if (!newMessage.trim() || !user || !receiver || sending) return;

    const content = newMessage.trim();
    setSending(true);
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: receiver.id,
      content,
      message_type: "text",
    });

    if (error) {
      setNewMessage(content);
      alert(error.message);
      setSending(false);
      return;
    }

    await loadChat(false);
    setSending(false);
  }

  function formatMessageTime(date: string) {
    return new Date(date).toLocaleTimeString("es-SV", {
      hour: "2-digit",
      minute: "2-digit",
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
      <div className="mx-auto flex h-[calc(100vh-112px)] min-h-[620px] w-full max-w-[820px] flex-col overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#101318]/95">
        <header className="flex min-h-[76px] items-center gap-3 border-b border-white/[0.06] px-4 sm:px-5">
          <Link
            href="/messages"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
            aria-label="Volver"
          >
            <ArrowLeft size={19} />
          </Link>

          <Link
            href={receiver ? `/u/${receiver.username}` : "#"}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold text-white ring-1 ring-white/10">
              {receiver?.avatar_url ? (
                <img
                  src={receiver.avatar_url}
                  alt={receiver.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                receiver?.username?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold text-white">
                @{receiver?.username || username}
              </h1>
              <p className="mt-0.5 truncate text-xs text-zinc-600">
                {[receiver?.career, receiver?.university]
                  .filter(Boolean)
                  .join(" · ") || "Comunidad Alumni"}
              </p>
            </div>
          </Link>

          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-200">
            <MoreHorizontal size={19} />
          </button>
        </header>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {loadingChat ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
              Cargando conversación...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-lg font-bold text-white ring-1 ring-white/10">
                  {receiver?.avatar_url ? (
                    <img
                      src={receiver.avatar_url}
                      alt={receiver.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    receiver?.username?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <h2 className="mt-4 text-base font-bold text-zinc-300">
                  Inicia la conversación
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Envía un mensaje a @{receiver?.username} y comienza a conectar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {messages.map((message: any) => {
                const mine = message.sender_id === user?.id;
                const storyReply = message.message_type === "story_reply";

                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    {storyReply ? (
                      <div className="max-w-[82%] sm:max-w-[68%]">
                        <div
                          className={`overflow-hidden rounded-[20px] border ${
                            mine
                              ? "border-[#6d7cff]/25 bg-[#6d7cff]/10"
                              : "border-white/[0.08] bg-white/[0.04]"
                          }`}
                        >
                          {message.story_media_url && (
                            <div className="bg-black/25 p-2.5">
                              <img
                                src={message.story_media_url}
                                alt="Historia respondida"
                                className="mx-auto max-h-[220px] w-full rounded-[15px] object-cover"
                              />
                            </div>
                          )}

                          <div className="px-4 py-3 text-zinc-200">
                            <p className="whitespace-pre-wrap break-words text-sm leading-5">
                              {message.content}
                            </p>
                            <p className="mt-1.5 text-[10px] text-zinc-700">
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[78%] rounded-[18px] px-4 py-2.5 sm:max-w-[70%] ${
                          mine
                            ? "rounded-br-md bg-[#6d7cff] text-white"
                            : "rounded-bl-md bg-white/[0.055] text-zinc-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-5">
                          {message.content}
                        </p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? "text-white/60" : "text-zinc-700"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="border-t border-white/[0.06] p-3 sm:p-4">
          <div className="flex items-end gap-2 rounded-[18px] border border-white/[0.07] bg-white/[0.035] p-1.5 focus-within:border-[#6d7cff]/35">
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
              placeholder="Escribe un mensaje..."
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-5 text-zinc-200 outline-none placeholder:text-zinc-700"
            />

            <button
              type="submit"
              disabled={!newMessage.trim() || !receiver || sending}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#6d7cff] text-white transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
              aria-label="Enviar mensaje"
            >
              <Send size={17} />
            </button>
          </div>
          <p className="mt-2 px-2 text-[10px] text-zinc-700">
            Enter para enviar · Shift + Enter para salto de línea
          </p>
        </form>
      </div>
    </AppShell>
  );
}
