"use client";

import {
  ArrowRight,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

type Person = {
  id: string;
  username: string;
  avatar_url: string | null;
};

function safeName(
  value: string
) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-120);
}

export default function ForwardMessageMediaModal({
  open,
  onClose,
  bucket,
  path,
  preview,
  mediaType,
  mediaMime,
  name,
  size,
}: {
  open: boolean;
  onClose: () => void;
  bucket: string;
  path: string;
  preview?: string | null;
  mediaType: "image" | "video";
  mediaMime?: string | null;
  name?: string | null;
  size?: number | null;
}) {
  const { user } =
    useAuth();

  const [people, setPeople] =
    useState<Person[]>([]);

  const [groups, setGroups] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    forwardingKey,
    setForwardingKey,
  ] = useState("");

  useEffect(() => {
    if (
      !open ||
      !user
    ) {
      return;
    }

    let active = true;

    void (async () => {
      setLoading(true);

      const [
        followsResult,
        groupsResult,
      ] = await Promise.all([
        supabase
          .from("follows")
          .select("following_id")
          .eq(
            "follower_id",
            user.id
          ),
        supabase.rpc(
          "get_my_message_groups"
        ),
      ]);

      if (!active) return;

      const ids =
        (
          followsResult.data ||
          []
        )
          .map(
            (item: any) =>
              item.following_id
          )
          .filter(
            (id: string) =>
              id &&
              id !== user.id
          );

      let nextPeople: Person[] =
        [];

      if (ids.length) {
        const {
          data,
        } =
          await supabase
            .from("profiles")
            .select(
              "id,username,avatar_url"
            )
            .in("id", ids)
            .order("username");

        nextPeople =
          (data || []) as Person[];
      }

      if (!active) return;

      setPeople(
        nextPeople
      );

      setGroups(
        groupsResult.data ||
          []
      );

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [
    open,
    user?.id,
  ]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setForwardingKey("");
    }
  }, [open]);

  const filteredPeople =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return people;
      }

      return people.filter(
        (person) =>
          person.username
            .toLowerCase()
            .includes(q)
      );
    }, [
      people,
      search,
    ]);

  const filteredGroups =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return groups;
      }

      return groups.filter(
        (group) =>
          String(
            group.name ||
              ""
          )
            .toLowerCase()
            .includes(q)
      );
    }, [
      groups,
      search,
    ]);

  if (!open) {
    return null;
  }

  async function sourceBlob() {
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(bucket)
        .download(path);

    if (
      error ||
      !data
    ) {
      throw (
        error ||
        new Error(
          "No se pudo leer el archivo."
        )
      );
    }

    return data;
  }

  async function forwardPerson(
    person: Person
  ) {
    if (
      !user ||
      forwardingKey
    ) {
      return;
    }

    setForwardingKey(
      `person:${person.id}`
    );

    let uploadedPath = "";

    try {
      const blob =
        await sourceBlob();

      const fileName =
        safeName(
          name ||
            `${
              mediaType ===
              "video"
                ? "video"
                : "foto"
            }-${Date.now()}`
        );

      uploadedPath =
        `${user.id}/${person.id}/${Date.now()}-forwarded-${fileName}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "message-media"
          )
          .upload(
            uploadedPath,
            blob,
            {
              contentType:
                mediaMime ||
                blob.type ||
                undefined,
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        error:
          messageError,
      } =
        await supabase
          .from("messages")
          .insert({
            sender_id:
              user.id,
            receiver_id:
              person.id,
            content: null,
            message_type:
              mediaType,
            media_path:
              uploadedPath,
            media_type:
              mediaType,
            media_mime:
              mediaMime ||
              blob.type ||
              null,
            media_name:
              name || null,
            media_preview:
              preview || null,
            media_size:
              size ||
              blob.size ||
              null,
            is_forwarded:
              true,
          });

      if (messageError) {
        throw messageError;
      }

      onClose();
    } catch (
      error: any
    ) {
      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(
            "message-media"
          )
          .remove([
            uploadedPath,
          ]);
      }

      alert(
        error?.message ||
          "No se pudo reenviar."
      );
    } finally {
      setForwardingKey("");
    }
  }

  async function forwardGroup(
    group: any
  ) {
    if (
      !user ||
      forwardingKey
    ) {
      return;
    }

    const groupId =
      String(
        group.group_id ||
          ""
      );

    if (!groupId) {
      return;
    }

    setForwardingKey(
      `group:${groupId}`
    );

    let uploadedPath = "";

    try {
      const blob =
        await sourceBlob();

      const fileName =
        safeName(
          name ||
            `${
              mediaType ===
              "video"
                ? "video"
                : "foto"
            }-${Date.now()}`
        );

      uploadedPath =
        `${groupId}/${user.id}/${Date.now()}-forwarded-${fileName}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "group-message-media"
          )
          .upload(
            uploadedPath,
            blob,
            {
              contentType:
                mediaMime ||
                blob.type ||
                undefined,
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        error:
          messageError,
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
            content: null,
            message_type:
              mediaType,
            media_path:
              uploadedPath,
            media_type:
              mediaType,
            media_mime:
              mediaMime ||
              blob.type ||
              null,
            media_name:
              name || null,
            media_preview:
              preview || null,
            media_size:
              size ||
              blob.size ||
              null,
            is_forwarded:
              true,
          });

      if (messageError) {
        throw messageError;
      }

      onClose();
    } catch (
      error: any
    ) {
      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(
            "group-message-media"
          )
          .remove([
            uploadedPath,
          ]);
      }

      alert(
        error?.message ||
          "No se pudo reenviar."
      );
    } finally {
      setForwardingKey("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2147483400] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      data-pull-refresh-lock="true"
    >
      <div className="flex h-[min(82dvh,680px)] w-full max-w-[500px] flex-col overflow-hidden rounded-t-[28px] bg-[var(--app-surface)] shadow-2xl sm:rounded-[28px]">
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--app-border)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-black text-[var(--app-text)]">
              Reenviar
            </h2>
            <p className="mt-0.5 text-[11px] text-[var(--app-muted-2)]">
              Elige una persona o un grupo.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
          >
            <X size={16} />
          </button>
        </header>

        <div className="shrink-0 px-5 py-3">
          <div className="flex h-11 items-center gap-2 border-b border-[var(--app-border)]">
            <Search
              size={16}
              className="text-[var(--app-muted-2)]"
            />
            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)]"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin text-[var(--app-accent)]"
              />
            </div>
          ) : (
            <>
              {filteredGroups.length >
                0 && (
                <section>
                  <p className="py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
                    Grupos
                  </p>

                  <div className="divide-y divide-[var(--app-border)]">
                    {filteredGroups.map(
                      (
                        group
                      ) => (
                        <button
                          key={
                            group.group_id
                          }
                          type="button"
                          onClick={() =>
                            void forwardGroup(
                              group
                            )
                          }
                          disabled={
                            Boolean(
                              forwardingKey
                            )
                          }
                          className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-45"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                            <Users
                              size={18}
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-black text-[var(--app-text)]">
                              {
                                group.name
                              }
                            </p>
                            <p className="mt-0.5 text-[10px] text-[var(--app-muted-2)]">
                              {
                                group.member_count
                              } miembros
                            </p>
                          </div>

                          {forwardingKey ===
                          `group:${group.group_id}` ? (
                            <Loader2
                              size={15}
                              className="animate-spin text-[var(--app-accent)]"
                            />
                          ) : (
                            <ArrowRight
                              size={15}
                              className="text-[var(--app-muted-3)]"
                            />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </section>
              )}

              {filteredPeople.length >
                0 && (
                <section className="mt-2">
                  <p className="py-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
                    Personas
                  </p>

                  <div className="divide-y divide-[var(--app-border)]">
                    {filteredPeople.map(
                      (
                        person
                      ) => (
                        <button
                          key={
                            person.id
                          }
                          type="button"
                          onClick={() =>
                            void forwardPerson(
                              person
                            )
                          }
                          disabled={
                            Boolean(
                              forwardingKey
                            )
                          }
                          className="flex w-full items-center gap-3 py-3 text-left disabled:opacity-45"
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                            {person.avatar_url ? (
                              <img
                                src={
                                  person.avatar_url
                                }
                                alt={
                                  person.username
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              person.username
                                .charAt(
                                  0
                                )
                                .toUpperCase()
                            )}
                          </span>

                          <p className="min-w-0 flex-1 truncate text-[14px] font-black text-[var(--app-text)]">
                            @
                            {
                              person.username
                            }
                          </p>

                          {forwardingKey ===
                          `person:${person.id}` ? (
                            <Loader2
                              size={15}
                              className="animate-spin text-[var(--app-accent)]"
                            />
                          ) : (
                            <ArrowRight
                              size={15}
                              className="text-[var(--app-muted-3)]"
                            />
                          )}
                        </button>
                      )
                    )}
                  </div>
                </section>
              )}

              {!filteredGroups.length &&
                !filteredPeople.length && (
                  <div className="py-12 text-center">
                    <p className="text-[13px] font-black text-[var(--app-text-soft)]">
                      No encontramos destinos
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
