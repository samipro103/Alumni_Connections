"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, GraduationCap, MapPin, Search, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { getRecommendedProfiles, RecommendedProfile } from "@/lib/recommendations";

type FilterType = "all" | "university" | "career" | "location";

function ExploreContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<RecommendedProfile[]>([]);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, username, avatar_url, full_name, university, career, bio, city, country, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setUsers(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      return;
    }
    getRecommendedProfiles(user.id, 8).then(setRecommended);
  }, [user?.id]);

  async function follow(person: RecommendedProfile) {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setBusy(person.id);
    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: person.id,
    });

    if (!error) {
      await supabase.from("notifications").insert({
        user_id: person.id,
        actor_id: user.id,
        type: "follow",
        target_type: "profile",
        target_id: user.id,
      });
      setRecommended((old) => old.filter((item) => item.id !== person.id));
    }

    setBusy(null);
  }

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return users.filter((person: any) => {
      const fields = [
        person.username,
        person.full_name,
        person.university,
        person.career,
        person.bio,
        person.city,
        person.country,
      ].filter(Boolean).map((value) => String(value).toLowerCase());

      if (q && !fields.some((value) => value.includes(q))) return false;
      if (filter === "university") return Boolean(person.university);
      if (filter === "career") return Boolean(person.career);
      if (filter === "location") return Boolean(person.city || person.country);
      return true;
    });
  }, [users, search, filter]);

  const filters = [
    ["all", "Todos", <Users key="u" size={14} />],
    ["university", "Universidad", <GraduationCap key="g" size={14} />],
    ["career", "Carrera", <Briefcase key="b" size={14} />],
    ["location", "Ubicación", <MapPin key="m" size={14} />],
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">Explorar</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Descubre personas relevantes para tu carrera y comunidad.
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
          <span className="text-[11px] font-bold text-zinc-700">{filteredUsers.length}</span>
        </div>

        <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setFilter(id as FilterType)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition ${
                filter === id
                  ? "bg-[#6d7cff] text-white"
                  : "border border-white/[0.07] bg-white/[0.025] text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {!search && recommended.length > 0 && (
          <section className="mt-7">
            <h2 className="text-lg font-black tracking-[-0.025em]">Recomendados para ti</h2>
            <p className="mt-1 text-xs text-zinc-700">
              Según universidad, carrera, conexiones y actividad.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recommended.slice(0, 6).map((person) => (
                <div key={person.id} className="flex items-center gap-3 rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-4">
                  <Link href={`/u/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.username} className="h-full w-full object-cover" />
                      ) : (
                        person.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-zinc-100">@{person.username}</p>
                      <p className="mt-1 truncate text-xs text-zinc-600">{person.reason}</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => follow(person)}
                    disabled={busy === person.id}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 text-xs font-black text-zinc-300 transition hover:bg-[#6d7cff] hover:text-white disabled:opacity-50"
                  >
                    <UserPlus size={14} />
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h2 className="text-lg font-black tracking-[-0.025em]">Comunidad</h2>
          <p className="mt-1 text-xs text-zinc-700">
            {search ? `Resultados para “${search}”` : "Explora todos los perfiles de AlumniConnections."}
          </p>

          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-600">Buscando personas...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-white/[0.09] px-6 py-16 text-center">
              <Users size={25} className="mx-auto text-zinc-700" />
              <p className="mt-4 font-bold text-zinc-300">No encontramos coincidencias</p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/[0.07] bg-[#101318]/95">
              <div className="divide-y divide-white/[0.06]">
                {filteredUsers.map((person: any) => (
                  <Link
                    key={person.id}
                    href={`/u/${person.username}`}
                    className="flex gap-4 px-4 py-5 transition hover:bg-white/[0.035] sm:px-5"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.username} className="h-full w-full object-cover" />
                      ) : (
                        person.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-zinc-100">@{person.username}</p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                        {(person.career || person.university) && (
                          <span className="flex items-center gap-1.5">
                            <GraduationCap size={13} />
                            {[person.career, person.university].filter(Boolean).join(" · ")}
                          </span>
                        )}
                        {(person.city || person.country) && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={13} />
                            {[person.city, person.country].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                      {person.bio && (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-500">{person.bio}</p>
                      )}
                    </div>
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

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#090b0f] text-sm text-zinc-500">
          Cargando...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
