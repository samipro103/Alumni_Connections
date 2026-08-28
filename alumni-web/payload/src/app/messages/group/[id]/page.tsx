"use client";

import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Loader2,
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
  supabase,
} from "@/lib/supabase";

const BUCKET =
  "group-message-media";

type Member = {
  user_id: string;
  role: string;
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
          () =>
            scheduleRefresh()
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
      messages.length
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
          "id,name,created_by,created_at"
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
          "user_id,role"
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
              true,
          }
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

    const nextMessages =
      (
        messagesResult.data ||
        []
      ).map(
        (message: any) => ({
          ...message,
          sender_profile:
            profileMap.get(
              message.sender_id
            ) || null,
          reactions: [],
        })
      );

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

    setGroup(
      groupResult.data
    );

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
      !user ||
      sending ||
      (!text.trim() &&
        !mediaFile)
    ) {
      return;
    }

    setSending(true);

    let uploadedPath:
      | string
      | null = null;

    try {
      const media =
        mediaFile
          ? await uploadMedia(
              mediaFile
            )
          : null;

      uploadedPath =
        media?.path ||
        null;

      const {
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
              text.trim() ||
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
              replyingTo?.id ||
              null,
          });

      if (error) {
        throw error;
      }

      setText("");
      setReplyingTo(
        null
      );
      clearMedia();
      broadcastTyping(
        false
      );

      scheduleRefresh();

      window.requestAnimationFrame(
        () => {
          scrollBottom(
            "smooth"
          );
          textareaRef.current?.focus();
        }
      );
    } catch (
      error: any
    ) {
      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(BUCKET)
          .remove([
            uploadedPath,
          ]);
      }

      alert(
        error?.message ||
          "No se pudo enviar."
      );
    } finally {
      setSending(false);
    }
  }

  async function toggleReaction(
    messageId: number,
    emoji: string
  ) {
    if (!user) return;

    const current =
      messages
        .find(
          (message) =>
            message.id ===
            messageId
        )
        ?.reactions?.find(
          (reaction: any) =>
            reaction.user_id ===
            user.id
        );

    try {
      if (
        current?.emoji ===
        emoji
      ) {
        const {
          error,
        } =
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
        if (current) {
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
        }

        const {
          error,
        } =
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
          throw error;
        }
      }

      await load(false);
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "No se pudo reaccionar."
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
    broadcastTyping(
      Boolean(
        value.trim()
      )
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
          broadcastTyping(
            false
          ),
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

            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[color-mix(in_srgb,var(--app-accent)_18%,transparent)]">
              <Users
                size={19}
              />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[16px] font-black text-[var(--app-text)]">
                {group?.name ||
                  "Grupo"}
              </h1>
              <p className="mt-0.5 text-[11px] text-[var(--app-muted-2)]">
                {memberText}
              </p>
            </div>
          </div>
        </header>

        <div
          ref={scrollRef}
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

                  return (
                    <div
                      key={
                        message.id
                      }
                      className="mt-2"
                    >
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
                            />

                            {message.media_path && (
                              <div className="-mx-3 -mt-0.5 mb-2 overflow-hidden">
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
                                  name={
                                    message.media_name
                                  }
                                  size={
                                    message.media_size
                                  }
                                />
                              </div>
                            )}

                            {message.content && (
                              <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.45]">
                                {
                                  message.content
                                }
                              </p>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[var(--app-muted-3)]">
                              {time(
                                message.created_at
                              )}
                              {mine && (
                                <Check
                                  size={12}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </SwipeToReply>

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

              <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-[var(--app-text-soft)]">
                {
                  mediaFile.name
                }
              </p>

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
                sending
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
      </div>
    </AppShell>
  );
}
