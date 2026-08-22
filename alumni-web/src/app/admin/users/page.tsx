"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trash2, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function deleteUser(id: string) {
    const confirmed = confirm("Esto eliminará el perfil de la tabla profiles. ¿Continuar?");
    if (!confirmed) return;

    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await getUsers();
  }

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return users;

    return users.filter((user: any) =>
      [user.username, user.full_name, user.university, user.career, user.role]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [users, search]);

  return (
    <AdminShell title="Usuarios" description="Perfiles registrados dentro de AlumniConnections.">
      <div className="mb-5 flex h-11 items-center rounded-xl border border-white/[0.07] bg-white/[0.035] px-3">
        <Search size={16} className="text-zinc-700" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
        <span className="text-[11px] font-bold text-zinc-700">{filtered.length}</span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-zinc-600">Cargando usuarios...</div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center text-sm text-zinc-600">No hay usuarios que coincidan.</div>
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
          <div className="divide-y divide-white/[0.06]">
            {filtered.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <Link href={`/u/${user.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold">
                    {user.avatar_url ? <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" /> : <UserRound size={17} className="text-zinc-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">@{user.username || "sin-usuario"}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">{[user.career, user.university].filter(Boolean).join(" · ") || "Perfil Alumni"}</p>
                  </div>
                </Link>

                {user.role && <span className="hidden rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-black uppercase text-zinc-600 sm:inline">{user.role}</span>}

                <button onClick={() => deleteUser(user.id)} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-700 transition hover:bg-red-500/10 hover:text-red-400" title="Eliminar perfil">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
