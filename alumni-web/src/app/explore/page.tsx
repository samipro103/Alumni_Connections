"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

type FilterType = "all" | "university" | "career" | "location";

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers();
  }, []);

  async function getUsers() {
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, avatar_url, full_name, university, career, bio, city, country, created_at"
      )
      .order("created_at", { ascending: false });

    setUsers(data || []);
    setLoading(false);
  }

  const filteredUsers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return users.filter((user: any) => {
      const allFields = [
        user.username,
        user.full_name,
        user.university,
        user.career,
        user.bio,
        user.city,
        user.country,
      ]
        .filter(Boolean)
        .map((field) => String(field).toLowerCase());

      const byText =
        !value || allFields.some((field) => field.includes(value));

      if (!byText) return false;

      if (filter === "university") return Boolean(user.university);
      if (filter === "career") return Boolean(user.career);
      if (filter === "location") return Boolean(user.city || user.country);

      return true;
    });
  }, [users, search, filter]);

  const featured = useMemo(() => {
    return [...users]
      .sort((a: any, b: any) => {
        const aScore =
          Number(Boolean(a.avatar_url)) * 3 +
          Number(Boolean(a.bio)) * 2 +
          Number(Boolean(a.university)) * 2 +
          Number(Boolean(a.career)) * 2;
        const bScore =
          Number(Boolean(b.avatar_url)) * 3 +
          Number(Boolean(b.bio)) * 2 +
          Number(Boolean(b.university)) * 2 +
          Number(Boolean(b.career)) * 2;

        return bScore - aScore;
      })
      .slice(0, 4);
  }, [users]);

  const filters: Array<{
    id: FilterType;
    label: string;
    icon: React.ReactNode;
  }> = [
    { id: "all", label: "Todos", icon: <Users size={14} /> },
    {
      id: "university",
      label: "Universidad",
      icon: <GraduationCap size={14} />,
    },
    {
      id: "career",
      label: "Carrera",
      icon: <Briefcase size={14} />,
    },
    {
      id: "location",
      label: "Ubicación",
      icon: <MapPin size={14} />,
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Explorar
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Descubre personas por universidad, carrera, intereses y ubicación.
          </p>
        </div>

        <div className="flex h-12 items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/40">
          <Search size={18} className="text-zinc-600" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar personas, carrera o universidad..."
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-700"
          />

          <span className="text-[11px] font-bold text-zinc-700">
            {filteredUsers.length}
          </span>
        </div>

        <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                filter === item.id
                  ? "bg-[#6d7cff] text-white"
                  : "border border-white/[0.07] bg-white/[0.025] text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {!search && featured.length > 0 && (
          <section className="mt-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-[-0.025em]">
                  Personas destacadas
                </h2>
                <p className="mt-1 text-xs text-zinc-700">
                  Perfiles completos para empezar a explorar la comunidad.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {featured.map((person: any) => (
                <Link
                  key={person.id}
                  href={`/u/${person.username}`}
                  className="group rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-4 transition hover:-translate-y-0.5 hover:border-[#6d7cff]/25"
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      person.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  <p className="mt-4 truncate text-sm font-black text-zinc-100">
                    @{person.username}
                  </p>

                  <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-600">
                    {[person.career, person.university]
                      .filter(Boolean)
                      .join(" · ") || "Perfil Alumni"}
                  </p>

                  <p className="mt-4 text-xs font-bold text-[#8d98ff] opacity-70 transition group-hover:opacity-100">
                    Ver perfil →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-[-0.025em]">
                Comunidad
              </h2>
              <p className="mt-1 text-xs text-zinc-700">
                {search
                  ? `Resultados para “${search}”`
                  : "Personas que forman parte de AlumniConnections."}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-600">
              Buscando personas...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/[0.09] px-6 py-16 text-center">
              <Users size={25} className="mx-auto text-zinc-700" />
              <p className="mt-4 font-bold text-zinc-300">
                No encontramos coincidencias
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Prueba con otro usuario, universidad, carrera o ubicación.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
              <div className="divide-y divide-white/[0.06]">
                {filteredUsers.map((person: any) => (
                  <Link
                    key={person.id}
                    href={`/u/${person.username}`}
                    className="group flex gap-4 px-4 py-5 transition hover:bg-white/[0.035] sm:px-5"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        person.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="font-black text-zinc-100">
                          @{person.username}
                        </p>
                        {person.full_name && (
                          <span className="text-xs text-zinc-600">
                            {person.full_name}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                        {(person.career || person.university) && (
                          <span className="flex items-center gap-1.5">
                            <GraduationCap size={13} />
                            {[person.career, person.university]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}

                        {(person.city || person.country) && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            {[person.city, person.country]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </div>

                      {person.bio && (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-500">
                          {person.bio}
                        </p>
                      )}
                    </div>

                    <ChevronLabel />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ChevronLabel() {
  return (
    <span className="hidden self-center text-xs font-bold text-[#8d98ff] opacity-0 transition group-hover:opacity-100 sm:block">
      Ver perfil
    </span>
  );
}
