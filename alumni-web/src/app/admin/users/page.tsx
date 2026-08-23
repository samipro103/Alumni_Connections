"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  Search,
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
};

type PermissionRow = Omit<AdminAccess, "is_admin"> & {
  user_id: string;
};

const EMPTY_PERMISSIONS: PermissionRow = {
  user_id: "",
  manage_feedback: false,
  manage_users: false,
  manage_posts: false,
  manage_events: false,
  view_stats: false,
  manage_admins: false,
};

const PERMISSION_LABELS: Array<{
  key: keyof Omit<PermissionRow, "user_id">;
  title: string;
  description: string;
}> = [
  {
    key: "manage_feedback",
    title: "Feedback",
    description: "Revisar reportes, capturas y estados.",
  },
  {
    key: "manage_users",
    title: "Usuarios",
    description: "Acceso al módulo general de usuarios.",
  },
  {
    key: "manage_posts",
    title: "Publicaciones",
    description: "Acceso a moderación de contenido.",
  },
  {
    key: "manage_events",
    title: "Eventos",
    description: "Crear y administrar eventos.",
  },
  {
    key: "view_stats",
    title: "Estadísticas",
    description: "Consultar métricas administrativas.",
  },
  {
    key: "manage_admins",
    title: "Administradores",
    description: "Dar o quitar permisos a otros administradores.",
  },
];

export default function AdminUsersPage() {
  const { access } = useAdminAccess();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<PermissionRow>(EMPTY_PERMISSIONS);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {
    setLoading(true);

    const [{ data: profilesData, error: profilesError }, { data: accessData }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("admin_permissions").select("*"),
      ]);

    if (profilesError) {
      alert(profilesError.message);
    }

    setUsers((profilesData || []) as UserProfile[]);
    setPermissions((accessData || []) as PermissionRow[]);
    setLoading(false);
  }

  function openPermissions(user: UserProfile) {
    const current = permissions.find((item) => item.user_id === user.id);

    setEditing(user);
    setIsAdmin(Boolean(current));
    setDraft(
      current
        ? { ...current }
        : {
            ...EMPTY_PERMISSIONS,
            user_id: user.id,
          }
    );
  }

  function togglePermission(
    key: keyof Omit<PermissionRow, "user_id">
  ) {
    setDraft((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  async function savePermissions() {
    if (!editing || saving) return;

    setSaving(true);

    const { error } = await supabase.rpc("set_admin_access", {
      p_target_user_id: editing.id,
      p_is_admin: isAdmin,
      p_manage_feedback: isAdmin && draft.manage_feedback,
      p_manage_users: isAdmin && draft.manage_users,
      p_manage_posts: isAdmin && draft.manage_posts,
      p_manage_events: isAdmin && draft.manage_events,
      p_view_stats: isAdmin && draft.view_stats,
      p_manage_admins: isAdmin && draft.manage_admins,
    });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setEditing(null);
    setSaving(false);
    await getUsers();
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;

    return users.filter((user) =>
      [
        user.username,
        user.full_name,
        user.university,
        user.career,
        user.role,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [users, search]);

  return (
    <AdminShell
      title="Usuarios y permisos"
      description="Perfiles registrados y acceso administrativo de AlumniConnections."
    >
      <div className="mb-5 flex h-11 items-center border-b border-white/[0.08]">
        <Search size={16} className="text-zinc-700" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
        />
        <span className="text-[11px] font-bold text-zinc-700">
          {filtered.length}
        </span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-zinc-600">
          Cargando usuarios...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center text-sm text-zinc-600">
          No hay usuarios que coincidan.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {filtered.map((user) => {
            const adminAccess = permissions.find(
              (item) => item.user_id === user.id
            );

            return (
              <div
                key={user.id}
                className="flex items-center gap-3 px-1 py-4"
              >
                <Link
                  href={`/u/${user.username}`}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound size={17} className="text-zinc-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black">
                        @{user.username || "sin-usuario"}
                      </p>
                      {adminAccess && (
                        <span className="rounded-md bg-[#6d7cff]/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#9ca6ff]">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {[user.career, user.university]
                        .filter(Boolean)
                        .join(" · ") || "Perfil Alumni"}
                    </p>
                  </div>
                </Link>

                {access.manage_admins && (
                  <button
                    onClick={() => openPermissions(user)}
                    className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.07] px-3 text-[11px] font-black text-zinc-600 transition hover:text-zinc-200"
                  >
                    <ShieldCheck size={14} />
                    <span className="hidden sm:inline">
                      {adminAccess ? "Permisos" : "Hacer admin"}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-[#0d1015] p-5 shadow-2xl sm:rounded-[28px] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8d98ff]">
                  Acceso administrativo
                </p>
                <h2 className="mt-2 text-xl font-black">
                  @{editing.username || "usuario"}
                </h2>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-600"
              >
                <X size={16} />
              </button>
            </div>

            <button
              onClick={() => setIsAdmin((current) => !current)}
              className={`mt-6 flex w-full items-center justify-between border-y px-1 py-4 text-left ${
                isAdmin
                  ? "border-[#6d7cff]/25"
                  : "border-white/[0.07]"
              }`}
            >
              <div>
                <p className="text-sm font-black text-zinc-200">
                  Administrador
                </p>
                <p className="mt-1 text-xs text-zinc-700">
                  Habilita el Centro de administración para esta cuenta.
                </p>
              </div>
              <span
                className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
                  isAdmin ? "justify-end bg-[#6d7cff]" : "bg-white/[0.08]"
                }`}
              >
                <span className="h-5 w-5 rounded-full bg-white" />
              </span>
            </button>

            <div
              className={`mt-3 divide-y divide-white/[0.06] ${
                !isAdmin ? "pointer-events-none opacity-35" : ""
              }`}
            >
              {PERMISSION_LABELS.map((item) => {
                const enabled = Boolean(draft[item.key]);

                return (
                  <button
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className="flex w-full items-center gap-4 py-4 text-left"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${
                        enabled
                          ? "border-[#6d7cff] bg-[#6d7cff] text-white"
                          : "border-white/[0.1] text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black text-zinc-300">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-700">
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-5">
              {!isAdmin ? (
                <div className="flex items-center gap-2 text-xs font-bold text-red-400/80">
                  <ShieldOff size={15} />
                  Se quitará el acceso administrativo
                </div>
              ) : (
                <p className="text-xs text-zinc-700">
                  Solo verá los módulos habilitados.
                </p>
              )}

              <button
                onClick={savePermissions}
                disabled={saving}
                className="rounded-xl bg-[#6d7cff] px-4 py-2.5 text-xs font-black disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar permisos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
