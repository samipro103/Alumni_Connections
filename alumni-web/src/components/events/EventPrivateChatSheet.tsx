"use client";

import {
  ArrowLeft,
  Clock3,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";

type ChatRow = {
  id: string;
  event_id: number;
  attendee_id: string;
  organizer_id: string;
  expires_at: string;
  created_at: string;
  profile?: any;
  latest?: any;
};

type MessageRow = {
  id: string | number;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  pending?: boolean;
};

function displayName(profile: any, fallback = "Alumni") {
  return (
    profile?.full_name ||
    (profile?.username ? `@${profile.username}` : fallback)
  );
}

function initial(profile: any, fallback = "A") {
  return String(
    profile?.full_name ||
      profile?.username ||
      fallback
  )
    .trim()
    .charAt(0)
    .toUpperCase();
}

export default function EventPrivateChatSheet({
  open,
  event,
  userId,
  organizerProfile,
  onClose,
}: {
  open: boolean;
  event: any;
  userId: string;
  organizerProfile: any;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const isOrganizer = event?.created_by === userId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const anonymousToAttendee =
    Boolean(event?.organizer_anonymous) && !isOrganizer;

  useEffect(() => {
    if (!open) {
      setError("");
      setChats([]);
      setActiveChat(null);
      setMessages([]);
      setDraft("");
      return;
    }

    if (!event?.id || !userId) return;

    if (isOrganizer) {
      void loadOrganizerInbox();
    } else {
      void openAttendeeChat();
    }
  }, [open, event?.id, userId, isOrganizer]);

  useEffect(() => {
    if (!open || !activeChat?.id) return;

    const channel = supabase
      .channel(`event-private-chat:${activeChat.id}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_private_messages",
          filter: `chat_id=eq.${activeChat.id}`,
        },
        (payload: any) => {
          const next = payload.new as MessageRow;

          setMessages((current) =>
            current.some(
              (item) => String(item.id) === String(next.id)
            )
              ? current
              : [...current, next]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [open, activeChat?.id, userId]);

  useEffect(() => {
    if (!open || !activeChat) return;

    const timer = window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "end",
      });
    }, 40);

    return () => window.clearTimeout(timer);
  }, [open, activeChat, messages.length, reduceMotion]);

  async function loadOrganizerInbox() {
    setLoading(true);
    setError("");

    try {
      const { data: rows, error: chatError } = await supabase
        .from("event_private_chats")
        .select("id,event_id,attendee_id,organizer_id,expires_at,created_at")
        .eq("event_id", event.id)
        .eq("organizer_id", userId)
        .order("created_at", { ascending: false });

      if (chatError) throw chatError;

      const base = (rows || []) as ChatRow[];

      if (!base.length) {
        setChats([]);
        setLoading(false);
        return;
      }

      const attendeeIds = [
        ...new Set(base.map((row) => row.attendee_id)),
      ];

      const [{ data: profiles }, { data: recentMessages }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id,username,full_name,avatar_url")
            .in("id", attendeeIds),
          supabase
            .from("event_private_messages")
            .select("id,chat_id,sender_id,content,created_at")
            .in(
              "chat_id",
              base.map((row) => row.id)
            )
            .order("created_at", { ascending: false })
            .limit(300),
        ]);

      const profileMap = new Map(
        (profiles || []).map((profile: any) => [
          profile.id,
          profile,
        ])
      );

      const latestMap = new Map<string, any>();
      for (const message of recentMessages || []) {
        if (!latestMap.has(message.chat_id)) {
          latestMap.set(message.chat_id, message);
        }
      }

      const hydrated = base
        .map((row) => ({
          ...row,
          profile: profileMap.get(row.attendee_id) || null,
          latest: latestMap.get(row.id) || null,
        }))
        .sort((a, b) => {
          const aTime = new Date(
            a.latest?.created_at || a.created_at
          ).getTime();
          const bTime = new Date(
            b.latest?.created_at || b.created_at
          ).getTime();
          return bTime - aTime;
        });

      setChats(hydrated);
    } catch (caught: any) {
      console.error("[Alumni Event Chat] inbox:", caught);
      setError(
        caught?.message ||
          "No pudimos cargar las preguntas privadas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openAttendeeChat() {
    setLoading(true);
    setError("");

    try {
      const { data: existing, error: existingError } =
        await supabase
          .from("event_private_chats")
          .select("id,event_id,attendee_id,organizer_id,expires_at,created_at")
          .eq("event_id", event.id)
          .eq("attendee_id", userId)
          .maybeSingle();

      if (existingError) throw existingError;

      let chat = existing as ChatRow | null;

      if (!chat) {
        const { data: created, error: createError } =
          await supabase
            .from("event_private_chats")
            .insert({
              event_id: event.id,
              attendee_id: userId,
            })
            .select("id,event_id,attendee_id,organizer_id,expires_at,created_at")
            .single();

        if (createError) throw createError;
        chat = created as ChatRow;
      }

      setActiveChat(chat);
      await loadMessages(chat.id);
    } catch (caught: any) {
      console.error("[Alumni Event Chat] open:", caught);

      const raw = String(caught?.message || "");
      const lower = raw.toLowerCase();

      setError(
        lower.includes("interes") || lower.includes("rsvp")
          ? "Marca “Me interesa” para abrir este chat."
          : lower.includes("expir")
          ? "Este chat ya terminó y su conversación fue eliminada."
          : raw || "No pudimos abrir el chat privado."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openOrganizerChat(chat: ChatRow) {
    setActiveChat(chat);
    setError("");
    await loadMessages(chat.id);
  }

  async function loadMessages(chatId: string) {
    const { data, error: messageError } = await supabase
      .from("event_private_messages")
      .select("id,chat_id,sender_id,content,created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (messageError) {
      setError(messageError.message);
      return;
    }

    setMessages((data || []) as MessageRow[]);
  }

  async function sendMessage(eventSubmit?: FormEvent) {
    eventSubmit?.preventDefault();

    if (!activeChat || sending) return;

    const content = draft.trim();
    if (!content) return;

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimistic: MessageRow = {
      id: tempId,
      chat_id: activeChat.id,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      pending: true,
    };

    setDraft("");
    setError("");
    setSending(true);
    setMessages((current) => [...current, optimistic]);

    const { data, error: sendError } = await supabase
      .from("event_private_messages")
      .insert({
        chat_id: activeChat.id,
        sender_id: userId,
        content,
      })
      .select("id,chat_id,sender_id,content,created_at")
      .single();

    if (sendError || !data) {
      setMessages((current) =>
        current.filter((item) => item.id !== tempId)
      );
      setDraft(content);
      setError(
        sendError?.message ||
          "No pudimos enviar el mensaje."
      );
      setSending(false);
      return;
    }

    setMessages((current) => {
      const withoutDuplicate = current.filter(
        (item) => String(item.id) !== String(data.id)
      );

      return withoutDuplicate.map((item) =>
        item.id === tempId
          ? ({ ...data, pending: false } as MessageRow)
          : item
      );
    });

    setSending(false);
  }

  function handleComposerKeyDown(
    keyboardEvent: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      keyboardEvent.key === "Enter" &&
      !keyboardEvent.shiftKey
    ) {
      keyboardEvent.preventDefault();
      void sendMessage();
    }
  }

  function backFromConversation() {
    if (isOrganizer) {
      setActiveChat(null);
      setMessages([]);
      setDraft("");
      setError("");
      void loadOrganizerInbox();
      return;
    }

    onClose();
  }

  const attendeeProfile = activeChat?.profile;

  const peerName = useMemo(() => {
    if (!activeChat) return "";

    if (isOrganizer) {
      return displayName(
        attendeeProfile,
        "Alumni interesado"
      );
    }

    if (anonymousToAttendee) {
      return "Organizador del evento";
    }

    return displayName(
      organizerProfile,
      "Organizador del evento"
    );
  }, [
    activeChat,
    isOrganizer,
    attendeeProfile,
    anonymousToAttendee,
    organizerProfile,
  ]);

  const peerAvatar = useMemo(() => {
    if (!activeChat) return null;

    if (isOrganizer) {
      return attendeeProfile?.avatar_url || null;
    }

    if (anonymousToAttendee) return null;
    return organizerProfile?.avatar_url || null;
  }, [
    activeChat,
    isOrganizer,
    attendeeProfile,
    anonymousToAttendee,
    organizerProfile,
  ]);

  const peerInitial = isOrganizer
    ? initial(attendeeProfile)
    : anonymousToAttendee
    ? "?"
    : initial(organizerProfile, "O");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="event-chat-overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <motion.section
            className="event-chat-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Chat privado del evento"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 18, scale: 0.995 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              reduceMotion
                ? undefined
                : { opacity: 0, y: 12, scale: 0.995 }
            }
            transition={{
              duration: 0.23,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {!activeChat ? (
              <>
                <header className="event-chat-top">
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X size={19} />
                  </button>

                  <div>
                    <strong>Preguntas privadas</strong>
                    <span>{event.title}</span>
                  </div>

                  <span className="event-chat-top-icon">
                    <MessageCircle size={16} />
                  </span>
                </header>

                <div className="event-chat-inbox">
                  <div className="event-chat-privacy-note">
                    <ShieldCheck size={16} />
                    <span>
                      Solo tú y cada persona pueden ver su conversación.
                      Los chats desaparecen 24 h después del evento.
                    </span>
                  </div>

                  {loading ? (
                    <div className="event-chat-state">
                      <span className="event-chat-spinner" />
                      <strong>Cargando preguntas...</strong>
                    </div>
                  ) : error ? (
                    <div className="event-chat-state">
                      <MessageCircle size={23} />
                      <strong>{error}</strong>
                    </div>
                  ) : chats.length ? (
                    <div className="event-chat-inbox-list">
                      {chats.map((chat, index) => (
                        <motion.button
                          key={chat.id}
                          type="button"
                          onClick={() =>
                            void openOrganizerChat(chat)
                          }
                          initial={
                            reduceMotion
                              ? false
                              : { opacity: 0, y: 7 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.2,
                            delay: reduceMotion
                              ? 0
                              : Math.min(index * 0.025, 0.12),
                          }}
                          whileTap={
                            reduceMotion
                              ? undefined
                              : { scale: 0.992 }
                          }
                        >
                          <span className="event-chat-inbox-avatar">
                            {chat.profile?.avatar_url ? (
                              <img
                                src={chat.profile.avatar_url}
                                alt=""
                              />
                            ) : (
                              initial(chat.profile)
                            )}
                          </span>

                          <span className="event-chat-inbox-copy">
                            <strong>
                              {displayName(
                                chat.profile,
                                "Alumni interesado"
                              )}
                            </strong>
                            <small>
                              {chat.latest?.content ||
                                "Chat abierto · esperando pregunta"}
                            </small>
                          </span>

                          <ArrowLeft
                            className="event-chat-row-arrow"
                            size={16}
                          />
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="event-chat-state">
                      <MessageCircle size={24} />
                      <strong>Aún no hay preguntas.</strong>
                      <span>
                        Cuando alguien marque “Me interesa” y abra el
                        chat, aparecerá aquí.
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <header className="event-chat-top event-chat-conversation-top">
                  <button
                    type="button"
                    onClick={backFromConversation}
                    aria-label="Volver"
                  >
                    <ArrowLeft size={19} />
                  </button>

                  <div className="event-chat-peer">
                    <span>
                      {peerAvatar ? (
                        <img src={peerAvatar} alt="" />
                      ) : anonymousToAttendee && !isOrganizer ? (
                        <UserRound size={16} />
                      ) : (
                        peerInitial
                      )}
                    </span>

                    <div>
                      <strong>{peerName}</strong>
                      <small>
                        <Clock3 size={11} />
                        Temporal · 24 h después del evento
                      </small>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                  >
                    <X size={18} />
                  </button>
                </header>

                <div className="event-chat-messages">
                  <div className="event-chat-expiry">
                    <ShieldCheck size={14} />
                    <span>
                      Conversación privada del evento. Se elimina
                      automáticamente después de su período activo.
                    </span>
                  </div>

                  {loading ? (
                    <div className="event-chat-state">
                      <span className="event-chat-spinner" />
                    </div>
                  ) : messages.length ? (
                    <div className="event-chat-thread">
                      {messages.map((message) => {
                        const mine =
                          message.sender_id === userId;

                        return (
                          <motion.div
                            key={message.id}
                            className="event-chat-bubble-wrap"
                            data-mine={mine ? "true" : "false"}
                            initial={
                              reduceMotion
                                ? false
                                : { opacity: 0, y: 5, scale: 0.99 }
                            }
                            animate={{
                              opacity: message.pending ? 0.68 : 1,
                              y: 0,
                              scale: 1,
                            }}
                          >
                            <div className="event-chat-bubble">
                              {message.content}
                            </div>
                            <time>
                              {new Date(
                                message.created_at
                              ).toLocaleTimeString("es-SV", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </motion.div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                  ) : (
                    <div className="event-chat-state event-chat-state-small">
                      <MessageCircle size={22} />
                      <strong>
                        {isOrganizer
                          ? "Todavía no hay mensajes."
                          : "Pregunta lo que necesites."}
                      </strong>
                      <span>
                        {isOrganizer
                          ? "La conversación ya está lista."
                          : "Solo tú y el organizador verán esta conversación."}
                      </span>
                    </div>
                  )}

                  {error && (
                    <motion.p
                      className="event-chat-error"
                      initial={
                        reduceMotion
                          ? false
                          : { opacity: 0, y: 4 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {error}
                    </motion.p>
                  )}
                </div>

                <form
                  className="event-chat-composer"
                  onSubmit={(eventSubmit) =>
                    void sendMessage(eventSubmit)
                  }
                >
                  <textarea
                    value={draft}
                    maxLength={2000}
                    rows={1}
                    onChange={(eventChange) =>
                      setDraft(eventChange.target.value)
                    }
                    onKeyDown={handleComposerKeyDown}
                    placeholder="Escribe una pregunta..."
                    aria-label="Mensaje"
                  />

                  <motion.button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    aria-label="Enviar"
                    whileTap={
                      reduceMotion ||
                      sending ||
                      !draft.trim()
                        ? undefined
                        : { scale: 0.9 }
                    }
                  >
                    <Send size={17} />
                  </motion.button>
                </form>
              </>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ALUMNI_EVENTS_ORGANIZER_CHAT_6_2:PRIVATE_CHAT */

