"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

export default function CommunityPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommunity();
  }, []);

  async function loadCommunity() {
    setLoading(true);

    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, avatar_url, full_name, university, career, bio, city, country, created_at"
      )
      .order("created_at", { ascending: false });

    setProfiles(data || []);
    setLoading(false);
  }

  const universities = useMemo(() => {
    const counts = new Map<string, number>();

    profiles.forEach((profile: any) => {
      if (!profile.university) return;
      counts.set(
        profile.university,
        (counts.get(profile.university) || 0) + 1
      );
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [profiles]);

  const careers = useMemo(() => {
    const counts = new Map<string, number>();

    profiles.forEach((profile: any) => {
      if (!profile.career) return;
      counts.set(profile.career, (counts.get(profile.career) || 0) + 1);
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [profiles]);

  const spotlight = useMemo(() => {
    return [...profiles]
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
      .slice(0, 3);
  }, [profiles]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return profiles.slice(0, 12);

    return profiles
      .filter((profile: any) =>
        [
          profile.username,
          profile.full_name,
          profile.university,
          profile.career,
          profile.city,
          profile.country,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(value)
          )
      )
      .slice(0, 20);
  }, [profiles, search]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[960px]">
        <div className="mb-7 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Comunidad
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Descubre quiénes forman parte de Alumni y cómo está creciendo la red.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            icon={<Users size={18} />}
            value={profiles.length}
            label="Miembros"
          />
          <Metric
            icon={<GraduationCap size={18} />}
            value={universities.length}
            label="Universidades"
          />
          <Metric
            icon={<Briefcase size={18} />}
            value={careers.length}
            label="Carreras destacadas"
          />
        </div>

        {spotlight.length > 0 && (
          <section className="mt-6">
            <div className="mb-4">
              <h2 className="text-lg font-black tracking-[-0.025em]">
                Miembros destacados
              </h2>
              <p className="mt-1 text-xs text-zinc-700">
                Perfiles completos que representan la diversidad de la comunidad.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {spotlight.map((profile: any) => (
                <Link
                  key={profile.id}
                  href={`/u/${profile.username}`}
                  className="group rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 transition hover:-translate-y-0.5 hover:border-[#6d7cff]/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold ring-1 ring-white/10">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profile.username?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">
                        @{profile.username}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-600">
                        {profile.full_name || "Miembro Alumni"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-600">
                    {[profile.career, profile.university]
                      .filter(Boolean)
                      .join(" · ") || "Comunidad Alumni"}
                  </p>

                  <p className="mt-4 text-xs font-bold text-[#8d98ff]">
                    Ver perfil →
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5">
            <h2 className="text-sm font-black text-zinc-200">
              Universidades con más presencia
            </h2>

            <div className="mt-4 space-y-2">
              {universities.length === 0 ? (
                <p className="text-sm text-zinc-700">
                  Aún no hay universidades registradas.
                </p>
              ) : (
                universities.map(([name, count], index) => (
                  <button
                    key={name}
                    onClick={() => setSearch(name)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-white/[0.035]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6d7cff]/10 text-xs font-black text-[#8d98ff]">
                      {index + 1}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-zinc-400">
                      {name}
                    </span>

                    <span className="text-xs font-bold text-zinc-700">
                      {count}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5">
            <h2 className="text-sm font-black text-zinc-200">
              Áreas de estudio
            </h2>

            <div className="mt-4 flex flex-wrap gap-2">
              {careers.length === 0 ? (
                <p className="text-sm text-zinc-700">
                  Aún no hay carreras registradas.
                </p>
              ) : (
                careers.map(([name, count]) => (
                  <button
                    key={name}
                    onClick={() => setSearch(name)}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-xs font-bold text-zinc-500 transition hover:border-[#6d7cff]/30 hover:text-zinc-200"
                  >
                    {name}
                    <span className="ml-1.5 text-zinc-700">{count}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-[-0.02em]">
                Personas de la comunidad
              </h2>
              <p className="mt-1 text-xs text-zinc-700">
                Busca por usuario, universidad, carrera o ubicación.
              </p>
            </div>

            <div className="flex h-10 w-full items-center rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 sm:max-w-xs">
              <Search size={15} className="text-zinc-700" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar comunidad..."
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-xs outline-none placeholder:text-zinc-700"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-600">
              Cargando comunidad...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/[0.09] px-6 py-12 text-center text-sm text-zinc-600">
              No encontramos perfiles con ese filtro.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((profile: any) => (
                <Link
                  key={profile.id}
                  href={`/u/${profile.username}`}
                  className="flex items-center gap-3 rounded-[20px] border border-white/[0.07] bg-[#101318]/95 p-4 transition hover:bg-white/[0.04]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1a1f29] text-sm font-bold">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">
                      @{profile.username}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-600">
                      {profile.career ||
                        profile.university ||
                        "Alumni"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-5">
      <div className="text-[#8d98ff]">{icon}</div>
      <p className="mt-4 text-2xl font-black tracking-[-0.04em]">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-600">{label}</p>
    </div>
  );
}
