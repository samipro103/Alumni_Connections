"use client";

import {
  Check,
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
  useRouter,
} from "next/navigation";
import {
  createPortal,
} from "react-dom";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

type FollowedPerson = {
  id: string;
  username: string;
  avatar_url:
    | string
    | null;
  university:
    | string
    | null;
  career:
    | string
    | null;
};

export default function CreateMessageGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } =
    useAuth();

  const router =
    useRouter();

  const [name, setName] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [people, setPeople] =
    useState<
      FollowedPerson[]
    >([]);

  const [
    selected,
    setSelected,
  ] = useState<
    Set<string>
  >(new Set());

  const [loading, setLoading] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [
    portalReady,
    setPortalReady,
  ] = useState(false);

  useEffect(() => {
    setPortalReady(true);

    return () => {
      setPortalReady(false);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const body =
      document.body;

    const previousOverflow =
      body.style.overflow;

    body.style.overflow =
      "hidden";

    return () => {
      body.style.overflow =
        previousOverflow;
    };
  }, [open]);

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

      const {
        data: follows,
        error:
          followError,
      } =
        await supabase
          .from("follows")
          .select(
            "following_id"
          )
          .eq(
            "follower_id",
            user.id
          );

      if (!active) {
        return;
      }

      if (followError) {
        console.error(
          followError
        );
        setPeople([]);
        setLoading(false);
        return;
      }

      const ids = (
        follows || []
      )
        .map(
          (item: any) =>
            item.following_id
        )
        .filter(
          (id: string) =>
            id &&
            id !==
              user.id
        );

      if (!ids.length) {
        setPeople([]);
        setLoading(false);
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select(
            "id,username,avatar_url,university,career"
          )
          .in(
            "id",
            ids
          )
          .order(
            "username"
          );

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          error
        );
      }

      setPeople(
        (data || []) as
          FollowedPerson[]
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
      setName("");
      setSearch("");
      setSelected(
        new Set()
      );
    }
  }, [open]);

  const filtered =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return people;
      }

      return people.filter(
        (person) =>
          [
            person.username,
            person.career,
            person.university,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(
                  value
                )
            )
      );
    }, [
      people,
      search,
    ]);

  if (
    !open ||
    !portalReady
  ) {
    return null;
  }

  function toggle(
    id: string
  ) {
    setSelected(
      (current) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(id)
        ) {
          next.delete(id);
        } else {
          next.add(id);
        }

        return next;
      }
    );
  }

  async function create() {
    if (
      !user ||
      creating ||
      name.trim().length <
        2 ||
      selected.size < 1
    ) {
      return;
    }

    setCreating(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "create_message_group",
          {
            p_name:
              name.trim(),
            p_member_ids:
              Array.from(
                selected
              ),
          }
        );

      if (error) {
        throw error;
      }

      const groupId =
        String(data || "");

      if (!groupId) {
        throw new Error(
          "No se pudo crear el grupo."
        );
      }

      onClose();

      router.push(
        `/messages/group/${groupId}`
      );
    } catch (
      error: any
    ) {
      const message =
        String(
          error?.message ||
            ""
        );

      if (
        message.includes(
          "GROUP_MEMBER_NOT_FOLLOWED"
        )
      ) {
        alert(
          "Solo puedes agregar personas que sigues."
        );
      } else if (
        message.includes(
          "GROUP_MEMBER_BLOCKED"
        )
      ) {
        alert(
          "No puedes crear el grupo con un usuario bloqueado."
        );
      } else {
        alert(
          error?.message ||
            "No se pudo crear el grupo."
        );
      }
    } finally {
      setCreating(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483646] flex items-end justify-center bg-black/72 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      data-pull-refresh-lock="true"
    >
      <div className="grid h-[calc(100dvh-env(safe-area-inset-top))] max-h-[100dvh] w-full max-w-[560px] grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden rounded-t-[28px] bg-[var(--app-surface)] shadow-2xl sm:h-[min(88dvh,760px)] sm:max-h-[88dvh] sm:rounded-[30px] sm:ring-1 sm:ring-[var(--app-border)]">
        <header className="border-b border-[var(--app-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <Users
                size={18}
              />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[18px] font-black tracking-[-0.025em] text-[var(--app-text)]">
                Nuevo grupo
              </h2>


            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
            >
              <X
                size={16}
              />
            </button>
          </div>


        </header>

        <div className="px-5 pt-4">
          <input
            value={name}
            onChange={(
              event
            ) =>
              setName(
                event.target.value.slice(
                  0,
                  60
                )
              )
            }
            placeholder="Nombre del grupo"
            className="h-12 w-full border-b border-[var(--app-border)] bg-transparent text-[17px] font-black text-[var(--app-text)] outline-none placeholder:font-semibold placeholder:text-[var(--app-muted-3)]"
          />

          <div className="mt-3 flex h-11 items-center gap-2 border-b border-[var(--app-border)]">
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
              placeholder="Buscar personas que sigues"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted-3)]"
            />

            <span className="shrink-0 text-[10px] font-black text-[var(--app-accent)]">
              {selected.size}
            </span>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2
                size={20}
                className="animate-spin text-[var(--app-accent)]"
              />
            </div>
          ) : filtered.length ? (
            <div className="divide-y divide-[var(--app-border)]">
              {filtered.map(
                (person) => {
                  const active =
                    selected.has(
                      person.id
                    );

                  return (
                    <button
                      key={
                        person.id
                      }
                      type="button"
                      onClick={() =>
                        toggle(
                          person.id
                        )
                      }
                      className="flex w-full items-center gap-3 py-3 text-left"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
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
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-black text-[var(--app-text)]">
                          @
                          {
                            person.username
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-2)]">
                          {[
                            person.career,
                            person.university,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " · "
                            ) ||
                            "Comunidad Alumni"}
                        </p>
                      </div>

                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
                          active
                            ? "border-[var(--app-accent)] bg-[var(--app-accent)] text-[var(--app-on-accent)]"
                            : "border-[var(--app-border)] text-transparent"
                        }`}
                      >
                        <Check
                          size={14}
                        />
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <p className="text-[14px] font-black text-[var(--app-text-soft)]">
                No encontramos personas
              </p>

              <p className="mt-2 text-[12px] leading-5 text-[var(--app-muted-2)]">
                Sigue personas desde Explorar para poder agregarlas a un grupo.
              </p>
            </div>
          )}
        </div>

        <footer className="relative z-40 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-3 pb-[max(18px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() =>
              void create()
            }
            disabled={
              creating ||
              name.trim()
                .length <
                2 ||
              selected.size <
                1
            }
            className="alumni-accent-button flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] text-[13px] font-black disabled:opacity-40"
          >
            {creating && (
              <Loader2
                size={16}
                className="animate-spin"
              />
            )}

            Crear grupo
          </button>

          <p className="mt-2 text-center text-[10px] text-[var(--app-muted-3)]">
            Selecciona al menos una persona además de ti.
          </p>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ALUMNI_1_3_3_CREATE_MODAL_GRID */

/* ALUMNI_1_3_4_GROUP_MODAL_CLEAN */

/* ALUMNI_1_3_5_GROUP_MODAL_PORTAL */
