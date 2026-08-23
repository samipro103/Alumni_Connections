"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getRecommendedProfiles, RecommendedProfile } from "@/lib/recommendations";

export default function RightSidebar() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<RecommendedProfile[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("events")
      .select("id, title, event_date, location")
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true })
      .limit(2)
      .then(({ data }) => setEvents(data || []));
  }, []);

  useEffect(() => {
    if (!user) {
      setSuggestions([]);
      return;
    }
    getRecommendedProfiles(user.id, 4).then(setSuggestions);
  }, [user?.id]);

  async function follow(person: RecommendedProfile) {
    if (!user || busy) return;
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
      setSuggestions((old) => old.filter((item) => item.id !== person.id));
    }

    setBusy(null);
  }

  return (
    <div className="sticky top-[88px] space-y-7">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-[#8d98ff]" />
            <h3 className="text-sm font-bold text-zinc-200">Personas para ti</h3>
          </div>
          <Link href="/explore" className="text-xs font-semibold text-[#8d98ff] hover:text-white">
            Ver más
          </Link>
        </div>

        {suggestions.length ? (
          <div className="space-y-1">
            {suggestions.map((person) => (
              <div key={person.id} className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-white/[0.035]">
                <Link href={`/u/${person.username}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#181d27] text-sm font-bold text-white ring-1 ring-white/10">
                    {person.avatar_url ? (
                      <img src={person.avatar_url} alt={person.username} className="h-full w-full object-cover" />
                    ) : (
                      person.username?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-100">@{person.username}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-600">{person.reason}</p>
                  </div>
                </Link>

                <button
                  onClick={() => follow(person)}
                  disabled={busy === person.id}
                  className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-white/[0.06] px-2.5 text-xs font-bold text-zinc-300 transition hover:bg-[#6d7cff] hover:text-white disabled:opacity-50"
                >
                  <UserPlus size={14} />
                  Seguir
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs leading-5 text-zinc-600">
            {user ? "Cuando encontremos nuevas conexiones relevantes aparecerán aquí." : "Inicia sesión para recibir recomendaciones."}
          </p>
        )}
      </section>

      <div className="border-t border-white/[0.07]" />

      <section>
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={17} className="text-[#8d98ff]" />
          <h3 className="text-sm font-bold text-zinc-200">Próximos eventos</h3>
        </div>

        {events.length ? (
          <div className="space-y-4">
            {events.map((event) => (
              <Link key={event.id} href="/events" className="block rounded-2xl px-2 py-2 transition hover:bg-white/[0.035]">
                <p className="text-sm font-semibold leading-5 text-zinc-300">{event.title}</p>
                <p className="mt-1 text-xs font-medium text-[#8d98ff]">
                  {new Date(event.event_date).toLocaleDateString("es-SV", { day: "2-digit", month: "short" })}
                </p>
                {event.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                    <MapPin size={12} />
                    <span className="truncate">{event.location}</span>
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-zinc-600">No hay eventos próximos.</p>
        )}
      </section>
    </div>
  );
}
