"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminUsersPage() {

  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(data || []);
  }

  async function deleteUser(id: string) {

    const confirmDelete = confirm(
      "¿Eliminar usuario?"
    );

    if (!confirmDelete) return;

    await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    getUsers();
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-7xl mx-auto p-8">

        <h1 className="text-5xl font-bold mb-10">
          👥 Usuarios
        </h1>

        <div className="grid gap-4">

          {users.map((user) => (

            <div
              key={user.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center justify-between"
            >

              <div className="flex items-center gap-4">

                {user.avatar_url ? (

                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover"
                  />

                ) : (

                  <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center">
                    👤
                  </div>

                )}

                <div>

                  <p className="font-semibold">
                    @{user.username}
                  </p>

                  <p className="text-zinc-500">
                    {user.university}
                  </p>

                </div>

              </div>

              <button
                onClick={() => deleteUser(user.id)}
                className="bg-red-500 hover:bg-red-600 transition px-5 py-2 rounded-xl"
              >
                Eliminar
              </button>

            </div>

          ))}

        </div>

      </div>

    </main>
    </AdminGuard>
  );
}
