"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`message-list:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` },
        () => loadConversations()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${user.id}` },
        () => loadConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  async function loadConversations() {
    if (!user) return;

    setLoadingConversations(true);

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const latestByUser = new Map<string, any>();

    (messages || []).forEach((message: any) => {
      const otherUserId =
        message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id;

      if (!latestByUser.has(otherUserId)) {
        latestByUser.set(otherUserId, message);
      }
    });

    const ids = Array.from(latestByUser.keys());

    if (ids.length === 0) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, university, career")
      .in("id", ids);

    const merged = (profiles || [])
      .map((profile: any) => ({
        ...profile,
        lastMessage: latestByUser.get(profile.id),
      }))
      .sort(
        (a: any, b: any) =>
          new Date(b.lastMessage?.created_at || 0).getTime() -
          new Date(a.lastMessage?.created_at || 0).getTime()
      );

    setConversations(merged);
    setLoadingConversations(false);
  }

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return conversations;

    return conversations.filter((conversation: any) =>
      [
        conversation.username,
        conversation.university,
        conversation.career,
        conversation.lastMessage?.content,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [conversations, search]);

  function formatTime(date?: string) {
    if (!date) return "";

    const parsed = new Date(date);
    const today = new Date();

    const sameDay =
      parsed.getDate() === today.getDate() &&
      parsed.getMonth() === today.getMonth() &&
      parsed.getFullYear() === today.getFullYear();

    if (sameDay) {
      return parsed.toLocaleTimeString("es-SV", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return parsed.toLocaleDateString("es-SV", {
      day: "2-digit",
      month: "short",
    });
  }

  function previewText(conversation: any) {
    const message = conversation.lastMessage;
    if (!message) return "Sin mensajes todavía";

    const mine = message.sender_id === user?.id;

    if (message.message_type === "story_reply") {
      return mine
        ? `Tú respondiste a su historia: ${message.content}`
        : `Respondió a tu historia: ${message.content}`;
    }

    return `${mine ? "Tú: " : ""}${message.content || ""}`;
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[760px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em] text-white">
            Mensajes
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Conversaciones con tu comunidad Alumni.
          </p>
        </div>

        <div className="mb-5 flex h-12 items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 transition focus-within:border-[#6d7cff]/40">
          <Search size={18} className="text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
            className="h-full flex-1 bg-transparent px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
          />
        </div>

        <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
          {loadingConversations ? (
            <div className="px-6 py-14 text-center text-sm text-zinc-600">
              Cargando conversaciones...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-500">
                <MessageCircle size={24} />
              </div>
              <h2 className="mt-4 text-base font-bold text-zinc-300">
                {search ? "No encontramos conversaciones" : "Aún no tienes conversaciones"}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-600">
                {search
                  ? "Prueba buscando por usuario, universidad o carrera."
                  : "Explora perfiles y envía un mensaje para comenzar a conectar."}
              </p>
              {!search && (
                <Link
                  href="/explore"
                  className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#6d7cff] px-4 text-sm font-bold text-white transition hover:bg-[#7b87ff]"
                >
                  Explorar personas
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredConversations.map((conversation: any) => (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.username}`}
                  className="group flex items-center gap-4 px-4 py-4 transition hover:bg-white/[0.035] sm:px-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold text-white ring-1 ring-white/10">
                    {conversation.avatar_url ? (
                      <img
                        src={conversation.avatar_url}
                        alt={conversation.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      conversation.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-zinc-100">
                        @{conversation.username}
                      </p>
                      <span className="ml-auto shrink-0 text-[11px] text-zinc-700">
                        {formatTime(conversation.lastMessage?.created_at)}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {[conversation.career, conversation.university]
                        .filter(Boolean)
                        .join(" · ") || "Comunidad Alumni"}
                    </p>

                    <p className="mt-2 truncate text-sm text-zinc-500">
                      {previewText(conversation)}
                    </p>
                  </div>

                  <ChevronRight
                    size={18}
                    className="shrink-0 text-zinc-800 transition group-hover:translate-x-0.5 group-hover:text-zinc-500"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
