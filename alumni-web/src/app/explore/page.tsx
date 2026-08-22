"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ExplorePage() {

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setUsers(data);
    }
  }

  async function handleSearch(value: string) {

    setSearch(value);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .ilike("username", `%${value}%`);

    if (data) {
      setUsers(data);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-3xl mx-auto p-6">

        <div className="mb-8">

          <h1 className="text-4xl font-bold">
            Explorar
          </h1>

          <p className="text-zinc-400 mt-2">
            Descubre estudiantes, graduados y profesionales.
          </p>

        </div>

        {/* SEARCH */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex items-center gap-3 mb-8 shadow-lg">

          <Search size={22} className="text-zinc-500" />

          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="bg-transparent outline-none w-full"
          />

        </div>

        {/* USERS */}
        <div className="space-y-4">

          {users.map((user) => (

            <Link
              key={user.id}
              href={`/u/${user.username}`}
            >

              <div className="bg-zinc-900 hover:bg-zinc-800 transition border border-zinc-800 hover:border-blue-500 rounded-3xl p-5 flex items-center gap-4 cursor-pointer shadow-lg">

                {/* AVATAR */}
                {user.avatar_url ? (

                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />

                ) : (

                  <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-xl">
                    👤
                  </div>

                )}

                <div>

                  <h2 className="font-semibold text-lg">
                    @{user.username}
                  </h2>

                  <p className="text-zinc-400">
                    {user.university || "Universidad no agregada"}
                  </p>

                  {user.career && (
                    <p className="text-zinc-500 text-sm">
                      {user.career}
                    </p>
                  )}

                  {user.bio && (
                    <p className="text-zinc-500 text-sm mt-2 line-clamp-2">
                      {user.bio}
                    </p>
                  )}

                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    </main>
  );
}