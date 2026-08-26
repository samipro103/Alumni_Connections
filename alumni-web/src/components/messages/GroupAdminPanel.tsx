"use client";

import {
  Camera,
  Crown,
  Loader2,
  ShieldCheck,
  UserMinus,
  Users,
  X,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

const GROUP_BUCKET =
  "group-message-media";

export default function GroupAdminPanel({
  open,
  onClose,
  group,
  members,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  group: any;
  members: any[];
  onChanged: () =>
    void | Promise<void>;
}) {
  const { user } =
    useAuth();

  const router =
    useRouter();

  const photoInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [busyKey, setBusyKey] =
    useState("");

  const myMember =
    useMemo(
      () =>
        members.find(
          (member) =>
            member.user_id ===
            user?.id
        ) || null,
      [
        members,
        user?.id,
      ]
    );

  const isOwner =
    myMember?.role ===
    "owner";

  const isAdmin =
    isOwner ||
    myMember?.role ===
      "admin";

  if (!open) {
    return null;
  }

  async function updatePhoto(
    file?: File
  ) {
    if (
      !file ||
      !user ||
      !isAdmin
    ) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Selecciona una imagen."
      );
      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      alert(
        "La foto debe pesar 8 MB o menos."
      );
      return;
    }

    setBusyKey(
      "photo"
    );

    let uploadedPath =
      "";

    try {
      const safe =
        file.name
          .normalize("NFKD")
          .replace(
            /[^\w.\-]+/g,
            "_"
          )
          .slice(-100);

      uploadedPath =
        `${group.id}/${user.id}/group-avatar-${Date.now()}-${safe}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            GROUP_BUCKET
          )
          .upload(
            uploadedPath,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const {
        error,
      } =
        await supabase.rpc(
          "set_message_group_photo",
          {
            p_group_id:
              group.id,
            p_path:
              uploadedPath,
          }
        );

      if (error) {
        throw error;
      }

      await onChanged();
    } catch (
      error: any
    ) {
      if (
        uploadedPath
      ) {
        await supabase.storage
          .from(
            GROUP_BUCKET
          )
          .remove([
            uploadedPath,
          ]);
      }

      alert(
        error?.message ||
          "No se pudo cambiar la foto."
      );
    } finally {
      setBusyKey("");
    }
  }

  async function setRole(
    member: any,
    role:
      | "admin"
      | "member"
  ) {
    setBusyKey(
      `role:${member.user_id}`
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          "set_message_group_member_role",
          {
            p_group_id:
              group.id,
            p_user_id:
              member.user_id,
            p_role:
              role,
          }
        );

      if (error) {
        throw error;
      }

      await onChanged();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "No se pudo cambiar el rol."
      );
    } finally {
      setBusyKey("");
    }
  }

  async function removeMember(
    member: any
  ) {
    if (
      !confirm(
        `¿Quitar a @${member.username} del grupo?`
      )
    ) {
      return;
    }

    setBusyKey(
      `remove:${member.user_id}`
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          "remove_message_group_member",
          {
            p_group_id:
              group.id,
            p_user_id:
              member.user_id,
          }
        );

      if (error) {
        throw error;
      }

      await onChanged();
    } catch (
      error: any
    ) {
      alert(
        error?.message ||
          "No se pudo quitar al miembro."
      );
    } finally {
      setBusyKey("");
    }
  }

  async function leaveGroup() {
    if (
      !confirm(
        isOwner
          ? "Como creador, solo puedes salir si eres el único miembro. ¿Continuar?"
          : "¿Salir de este grupo?"
      )
    ) {
      return;
    }

    setBusyKey(
      "leave"
    );

    try {
      const {
        error,
      } =
        await supabase.rpc(
          "leave_message_group",
          {
            p_group_id:
              group.id,
          }
        );

      if (error) {
        throw error;
      }

      onClose();
      router.replace(
        "/messages"
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
          "OWNER_MUST_KEEP_GROUP"
        )
      ) {
        alert(
          "El creador no puede abandonar el grupo mientras haya otros miembros."
        );
      } else {
        alert(
          error?.message ||
            "No se pudo salir del grupo."
        );
      }
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2147483100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      data-pull-refresh-lock="true"
    >
      <div className="flex h-[min(88dvh,760px)] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] bg-[var(--app-surface)] shadow-2xl sm:rounded-[28px]">
        <header className="shrink-0 border-b border-[var(--app-border)] px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                isAdmin &&
                photoInputRef.current?.click()
              }
              disabled={
                !isAdmin ||
                busyKey ===
                  "photo"
              }
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] ring-1 ring-[var(--app-border)] disabled:opacity-80"
              aria-label="Cambiar foto del grupo"
            >
              {group?.avatar_url ? (
                <img
                  src={
                    group.avatar_url
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Users
                  size={21}
                />
              )}

              {isAdmin && (
                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--app-accent)] text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]">
                  {busyKey ===
                  "photo" ? (
                    <Loader2
                      size={10}
                      className="animate-spin"
                    />
                  ) : (
                    <Camera
                      size={10}
                    />
                  )}
                </span>
              )}
            </button>

            <input
              ref={
                photoInputRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(
                event
              ) => {
                void updatePhoto(
                  event.target
                    .files?.[0]
                );
                event.target.value =
                  "";
              }}
            />

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[18px] font-black text-[var(--app-text)]">
                {
                  group?.name
                }
              </h2>

              <p className="mt-0.5 text-[11px] text-[var(--app-muted-2)]">
                {members.length} miembros
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[var(--app-muted-3)]">
            Miembros
          </p>

          <div className="divide-y divide-[var(--app-border)]">
            {members.map(
              (member) => {
                const mine =
                  member.user_id ===
                  user?.id;

                const owner =
                  member.role ===
                  "owner";

                const admin =
                  member.role ===
                  "admin";

                const canManageRole =
                  isOwner &&
                  !mine &&
                  !owner;

                const canRemove =
                  isAdmin &&
                  !mine &&
                  !owner &&
                  !(
                    myMember?.role ===
                      "admin" &&
                    admin
                  );

                return (
                  <div
                    key={
                      member.user_id
                    }
                    className="flex items-center gap-3 py-3"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                      {member.avatar_url ? (
                        <img
                          src={
                            member.avatar_url
                          }
                          alt={
                            member.username
                          }
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        member.username
                          ?.charAt(0)
                          ?.toUpperCase() ||
                        "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[14px] font-black text-[var(--app-text)]">
                          {mine
                            ? "Tú"
                            : `@${member.username}`}
                        </p>

                        {owner && (
                          <Crown
                            size={13}
                            className="text-[var(--app-accent)]"
                          />
                        )}

                        {admin && (
                          <ShieldCheck
                            size={13}
                            className="text-[var(--app-accent)]"
                          />
                        )}
                      </div>

                      <p className="mt-0.5 text-[10px] font-semibold text-[var(--app-muted-2)]">
                        {owner
                          ? "Creador · Admin principal"
                          : admin
                          ? "Administrador"
                          : "Miembro"}
                      </p>
                    </div>

                    {(canManageRole ||
                      canRemove) && (
                      <div className="flex shrink-0 items-center gap-1">
                        {canManageRole && (
                          <button
                            type="button"
                            onClick={() =>
                              void setRole(
                                member,
                                admin
                                  ? "member"
                                  : "admin"
                              )
                            }
                            disabled={
                              Boolean(
                                busyKey
                              )
                            }
                            className="flex h-9 items-center gap-1.5 rounded-full bg-[var(--app-soft)] px-3 text-[10px] font-black text-[var(--app-text)] disabled:opacity-40"
                          >
                            {busyKey ===
                            `role:${member.user_id}` ? (
                              <Loader2
                                size={13}
                                className="animate-spin"
                              />
                            ) : (
                              <ShieldCheck
                                size={13}
                              />
                            )}

                            {admin
                              ? "Quitar admin"
                              : "Hacer admin"}
                          </button>
                        )}

                        {canRemove && (
                          <button
                            type="button"
                            onClick={() =>
                              void removeMember(
                                member
                              )
                            }
                            disabled={
                              Boolean(
                                busyKey
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-full text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                          >
                            <UserMinus
                              size={15}
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>

        <footer className="relative z-20 shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() =>
              void leaveGroup()
            }
            disabled={
              busyKey ===
              "leave"
            }
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-red-500/10 text-[12px] font-black text-red-400 disabled:opacity-40"
          >
            {busyKey ===
              "leave" && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}
            Salir del grupo
          </button>
        </footer>
      </div>
    </div>
  );
}
