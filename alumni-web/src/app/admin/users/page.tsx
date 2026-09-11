"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Check,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";
import {
  AdminAccess,
  useAdminAccess,
} from "@/hooks/useAdminAccess";

type UserProfile = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  university?: string | null;
  career?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  created_at?: string | null;
  is_verified?: boolean | null;
};

type PermissionRow =
  Omit<
    AdminAccess,
    "is_admin"
  > & {
    user_id: string;
  };

type ModerationRow = {
  user_id: string;
  status:
    | "active"
    | "restricted"
    | "suspended";
  restrict_posts: boolean;
  restrict_comments: boolean;
  restrict_messages: boolean;
  restrict_social: boolean;
  reason?: string | null;
  expires_at?: string | null;
};

const EMPTY_PERMISSIONS: PermissionRow = {
  user_id: "",
  manage_feedback: false,
  manage_users: false,
  manage_posts: false,
  manage_events: false,
  view_stats: false,
  manage_admins: false,
  manage_moderation: false,
  manage_verifications: false,
};

const PERMISSION_LABELS: Array<{
  key: keyof Omit<
    PermissionRow,
    "user_id"
  >;
  title: string;
  description: string;
}> = [
  {
    key: "manage_users",
    title: "Usuarios",
    description:
      "Consultar usuarios y su estado.",
  },
  {
    key: "manage_moderation",
    title: "Moderación",
    description:
      "Suspender, restringir y moderar contenido.",
  },
  {
    key: "manage_verifications",
    title: "Verificaciones",
    description:
      "Otorgar y revocar insignias verificadas.",
  },
  {
    key: "manage_posts",
    title: "Publicaciones",
    description:
      "Acceso al módulo de contenido.",
  },
  {
    key: "manage_feedback",
    title: "Feedback y reportes",
    description:
      "Revisar reportes y feedback.",
  },
  {
    key: "manage_events",
    title: "Eventos",
    description:
      "Crear y administrar eventos.",
  },
  {
    key: "view_stats",
    title: "Estadísticas",
    description:
      "Consultar métricas administrativas.",
  },
  {
    key: "manage_admins",
    title: "Administradores",
    description:
      "Dar o quitar permisos a otros administradores.",
  },
];

export default function AdminUsersPage() {
  const {
    access,
  } = useAdminAccess();

  const [users, setUsers] =
    useState<UserProfile[]>([]);
  const [
    permissions,
    setPermissions,
  ] =
    useState<PermissionRow[]>([]);
  const [
    moderation,
    setModeration,
  ] =
    useState<ModerationRow[]>([]);

  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [editing, setEditing] =
    useState<UserProfile | null>(
      null
    );
  const [draft, setDraft] =
    useState<PermissionRow>(
      EMPTY_PERMISSIONS
    );
  const [isAdmin, setIsAdmin] =
    useState(false);
  const [saving, setSaving] =
    useState(false);
  const [
    moderationReason,
    setModerationReason,
  ] = useState("");

  useEffect(() => {
    void getUsers();
  }, []);

  async function getUsers() {
    setLoading(true);

    const [
      profilesResult,
      accessResult,
      moderationResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,username,full_name,university,career,avatar_url,role,created_at,is_verified"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),
      supabase
        .from(
          "admin_permissions"
        )
        .select("*"),
      supabase
        .from(
          "user_moderation"
        )
        .select("*"),
    ]);

    if (
      profilesResult.error
    ) {
      alert(
        profilesResult.error
          .message
      );
    }

    setUsers(
      (profilesResult.data ||
        []) as UserProfile[]
    );
    setPermissions(
      (accessResult.data ||
        []) as PermissionRow[]
    );
    setModeration(
      (moderationResult.data ||
        []) as ModerationRow[]
    );
    setLoading(false);
  }

  function openUser(
    user: UserProfile
  ) {
    const current =
      permissions.find(
        (item) =>
          item.user_id ===
          user.id
      );

    const state =
      moderation.find(
        (item) =>
          item.user_id ===
          user.id
      );

    setEditing(user);
    setIsAdmin(
      Boolean(current)
    );
    setDraft(
      current
        ? {
            ...EMPTY_PERMISSIONS,
            ...current,
          }
        : {
            ...EMPTY_PERMISSIONS,
            user_id: user.id,
          }
    );
    setModerationReason(
      state?.reason || ""
    );
  }

  function togglePermission(
    key: keyof Omit<
      PermissionRow,
      "user_id"
    >
  ) {
    setDraft(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  }

  async function savePermissions() {
    if (
      !editing ||
      saving
    ) {
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.rpc(
        "set_admin_access",
        {
          p_target_user_id:
            editing.id,
          p_is_admin:
            isAdmin,
          p_manage_feedback:
            isAdmin &&
            draft.manage_feedback,
          p_manage_users:
            isAdmin &&
            draft.manage_users,
          p_manage_posts:
            isAdmin &&
            draft.manage_posts,
          p_manage_events:
            isAdmin &&
            draft.manage_events,
          p_view_stats:
            isAdmin &&
            draft.view_stats,
          p_manage_admins:
            isAdmin &&
            draft.manage_admins,
          p_manage_moderation:
            isAdmin &&
            draft.manage_moderation,
          p_manage_verifications:
            isAdmin &&
            draft.manage_verifications,
        }
      );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    await getUsers();
  }

  async function setVerification(
    verified: boolean
  ) {
    if (
      !editing ||
      saving
    ) {
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.rpc(
        "alumni_set_verification",
        {
          p_target_user_id:
            editing.id,
          p_verified:
            verified,
          p_verification_type:
            "identity",
          p_note:
            verified
              ? "Verificación otorgada desde Centro de Control"
              : "Verificación revocada desde Centro de Control",
        }
      );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setEditing(
      (current) =>
        current
          ? {
              ...current,
              is_verified:
                verified,
            }
          : current
    );
    setSaving(false);
    await getUsers();
  }

  async function setModerationState(
    status:
      | "active"
      | "restricted"
      | "suspended"
  ) {
    if (
      !editing ||
      saving
    ) {
      return;
    }

    if (
      status !==
        "active" &&
      !moderationReason.trim()
    ) {
      alert(
        "Escribe el motivo de la medida."
      );
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.rpc(
        "alumni_set_user_moderation",
        {
          p_target_user_id:
            editing.id,
          p_status: status,
          p_restrict_posts:
            status ===
            "restricted",
          p_restrict_comments:
            status ===
            "restricted",
          p_restrict_messages:
            status ===
            "restricted",
          p_restrict_social:
            false,
          p_reason:
            moderationReason.trim() ||
            null,
          p_expires_at:
            null,
        }
      );

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    await getUsers();
  }

  const filtered =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return users;
      }

      return users.filter(
        (user) =>
          [
            user.username,
            user.full_name,
            user.university,
            user.career,
            user.role,
          ]
            .filter(Boolean)
            .some((field) =>
              String(field)
                .toLowerCase()
                .includes(value)
            )
      );
    }, [users, search]);

  const editingModeration =
    editing
      ? moderation.find(
          (item) =>
            item.user_id ===
            editing.id
        )
      : null;

  return (
    <AdminShell
      title="Usuarios"
      description="Verificación, seguridad, restricciones y permisos administrativos."
    >
      <div className="mb-5 flex h-11 items-center border-b border-[var(--app-border)]">
        <Search
          size={16}
          className="text-[var(--app-muted)]"
        />

        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Buscar usuario..."
          className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]"
        />

        <span className="text-[11px] font-bold text-[var(--app-muted)]">
          {filtered.length}
        </span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Cargando usuarios...
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
          {filtered.map(
            (user) => {
              const adminAccess =
                permissions.find(
                  (item) =>
                    item.user_id ===
                    user.id
                );

              const moderationState =
                moderation.find(
                  (item) =>
                    item.user_id ===
                    user.id
                );

              return (
                <div
                  key={user.id}
                  className="flex items-center gap-3 py-4"
                >
                  <Link
                    href={`/u/${user.username}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft)]">
                      {user.avatar_url ? (
                        <img
                          src={
                            user.avatar_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound
                          size={17}
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-black text-[var(--app-text)]">
                          @
                          {user.username ||
                            "sin-usuario"}
                        </p>

                        {user.is_verified && (
                          <BadgeCheck
                            size={16}
                            className="shrink-0 text-[var(--app-accent)]"
                            aria-label="Cuenta verificada"
                          />
                        )}

                        {adminAccess && (
                          <span className="rounded-md bg-[var(--app-accent-soft)] px-1.5 py-0.5 text-[9px] font-black uppercase text-[var(--app-accent)]">
                            Admin
                          </span>
                        )}

                        {moderationState?.status ===
                          "suspended" && (
                          <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-400">
                            Suspendido
                          </span>
                        )}

                        {moderationState?.status ===
                          "restricted" && (
                          <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-400">
                            Restringido
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 truncate text-xs text-[var(--app-muted)]">
                        {[
                          user.career,
                          user.university,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " · "
                          ) ||
                          "Perfil Alumni"}
                      </p>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      openUser(
                        user
                      )
                    }
                    className="rounded-xl border border-[var(--app-border)] px-3 py-2 text-[11px] font-black text-[var(--app-muted)]"
                  >
                    Gestionar
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 sm:items-center sm:p-5">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-[var(--app-border)] bg-[var(--app-bg)] p-5 shadow-2xl sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--app-accent)]">
                  Gestión de usuario
                </p>

                <h2 className="mt-2 text-xl font-black text-[var(--app-text)]">
                  @
                  {editing.username ||
                    "usuario"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-soft)] text-[var(--app-muted)]"
              >
                <X
                  size={16}
                />
              </button>
            </div>

            {(access.manage_verifications ||
              access.manage_admins) && (
              <section className="mt-6 border-t border-[var(--app-border)] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--app-text)]">
                      Cuenta verificada
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--app-muted)]">
                      Insignia pública de autenticidad otorgada por Alumni.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void setVerification(
                        !editing.is_verified
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-xs font-black ${
                      editing.is_verified
                        ? "bg-red-500/10 text-red-400"
                        : "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
                    }`}
                  >
                    {editing.is_verified
                      ? "Revocar"
                      : "Verificar"}
                  </button>
                </div>
              </section>
            )}

            {(access.manage_moderation ||
              access.manage_admins) && (
              <section className="mt-6 border-t border-[var(--app-border)] pt-5">
                <div className="flex items-center gap-2">
                  <ShieldAlert
                    size={16}
                    className="text-[var(--app-muted)]"
                  />
                  <p className="text-sm font-black text-[var(--app-text)]">
                    Moderación
                  </p>
                </div>

                <p className="mt-2 text-xs text-[var(--app-muted)]">
                  Estado actual:{" "}
                  <strong>
                    {editingModeration?.status ||
                      "active"}
                  </strong>
                </p>

                <textarea
                  value={
                    moderationReason
                  }
                  onChange={(e) =>
                    setModerationReason(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Motivo interno de la medida..."
                  className="mt-3 w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-sm text-[var(--app-text)] outline-none"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void setModerationState(
                        "active"
                      )
                    }
                    className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400"
                  >
                    Restaurar
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void setModerationState(
                        "restricted"
                      )
                    }
                    className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-400"
                  >
                    Restringir contenido
                  </button>

                  <button
                    type="button"
                    disabled={
                      saving
                    }
                    onClick={() =>
                      void setModerationState(
                        "suspended"
                      )
                    }
                    className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-400"
                  >
                    Suspender
                  </button>
                </div>
              </section>
            )}

            {access.manage_admins && (
              <section className="mt-6 border-t border-[var(--app-border)] pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setIsAdmin(
                      (current) =>
                        !current
                    )
                  }
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <p className="text-sm font-black text-[var(--app-text)]">
                      Administrador
                    </p>
                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      Habilita el Centro de Control para esta cuenta.
                    </p>
                  </div>

                  <span
                    className={`flex h-7 w-12 items-center rounded-full p-1 ${
                      isAdmin
                        ? "justify-end bg-[var(--app-accent-fill)]"
                        : "bg-[var(--app-soft)]"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full bg-white" />
                  </span>
                </button>

                <div
                  className={`mt-3 divide-y divide-[var(--app-border)] ${
                    !isAdmin
                      ? "pointer-events-none opacity-35"
                      : ""
                  }`}
                >
                  {PERMISSION_LABELS.map(
                    (
                      item
                    ) => {
                      const enabled =
                        Boolean(
                          draft[
                            item
                              .key
                          ]
                        );

                      return (
                        <button
                          key={
                            item.key
                          }
                          type="button"
                          onClick={() =>
                            togglePermission(
                              item.key
                            )
                          }
                          className="flex w-full items-center gap-4 py-4 text-left"
                        >
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                              enabled
                                ? "border-[var(--app-accent-fill)] bg-[var(--app-accent-fill)] text-white"
                                : "border-[var(--app-border)] text-transparent"
                            }`}
                          >
                            <Check
                              size={
                                14
                              }
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-black text-[var(--app-text)]">
                              {
                                item.title
                              }
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-[var(--app-muted)]">
                              {
                                item.description
                              }
                            </span>
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void savePermissions()
                  }
                  disabled={
                    saving
                  }
                  className="mt-4 w-full rounded-xl bg-[var(--app-accent-fill)] px-4 py-3 text-xs font-black text-[var(--app-on-accent)] disabled:opacity-50"
                >
                  {saving
                    ? "Guardando..."
                    : "Guardar permisos"}
                </button>
              </section>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */
