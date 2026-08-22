"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Share2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";

type EventFilter = "upcoming" | "all" | "past";

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<EventFilter>("upcoming");

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error(error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }

  const now = Date.now();

  const filteredEvents = useMemo(() => {
    if (filter === "upcoming") {
      return events.filter(
        (event: any) => new Date(event.event_date).getTime() >= now
      );
    }

    if (filter === "past") {
      return events
        .filter((event: any) => new Date(event.event_date).getTime() < now)
        .reverse();
    }

    return events;
  }, [events, filter, now]);

  const nextEvent = useMemo(() => {
    return events.find(
      (event: any) => new Date(event.event_date).getTime() >= now
    );
  }, [events, now]);

  async function shareEvent(event: any) {
    const text = `${event.title}${
      event.location ? ` · ${event.location}` : ""
    }`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `${text} ${window.location.href}`
        );
        alert("Evento copiado al portapapeles.");
      }
    } catch {
      // Compartir cancelado por el usuario.
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[920px]">
        <div className="mb-6 pt-2">
          <h1 className="text-[30px] font-black tracking-[-0.04em]">
            Eventos
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Conferencias, encuentros y actividades de tu comunidad.
          </p>
        </div>

        {nextEvent && filter !== "past" && (
          <article className="mb-6 overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#101318]/95">
            <div className="relative min-h-[250px]">
              {nextEvent.image_url ? (
                <img
                  src={nextEvent.image_url}
                  alt={nextEvent.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(109,124,255,.25),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(124,58,237,.16),transparent_32%),#101318]" />
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />

              <div className="relative flex min-h-[250px] max-w-2xl flex-col justify-end p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9ba5ff]">
                  Próximo evento
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
                  {nextEvent.title}
                </h2>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {new Date(nextEvent.event_date).toLocaleDateString(
                      "es-SV",
                      {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      }
                    )}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date(nextEvent.event_date).toLocaleTimeString(
                      "es-SV",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>

                  {nextEvent.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {nextEvent.location}
                    </span>
                  )}
                </div>

                {nextEvent.description && (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">
                    {nextEvent.description}
                  </p>
                )}
              </div>
            </div>
          </article>
        )}

        <div className="mb-5 flex gap-2 border-b border-white/[0.07] pb-3">
          {[
            ["upcoming", "Próximos"],
            ["all", "Todos"],
            ["past", "Pasados"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setFilter(id as EventFilter)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                filter === id
                  ? "bg-white/[0.07] text-zinc-200"
                  : "text-zinc-600 hover:bg-white/[0.035] hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-zinc-600">
            Cargando eventos...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-white/[0.09] px-6 py-16 text-center">
            <Calendar size={26} className="mx-auto text-zinc-700" />
            <p className="mt-4 font-bold text-zinc-300">
              No hay eventos en esta sección
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Cuando haya nuevas actividades aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event: any) => {
              const date = new Date(event.event_date);

              return (
                <article
                  key={event.id}
                  className="group flex flex-col gap-4 rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-4 transition hover:border-[#6d7cff]/20 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#6d7cff]/10 text-[#9ba5ff]">
                    <span className="text-[10px] font-black uppercase">
                      {date.toLocaleDateString("es-SV", {
                        month: "short",
                      })}
                    </span>
                    <span className="text-2xl font-black">{date.getDate()}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-black text-zinc-200">
                      {event.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {date.toLocaleTimeString("es-SV", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {event.location || "Ubicación por confirmar"}
                      </span>
                    </div>

                    {event.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-zinc-600">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => shareEvent(event)}
                    className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-bold text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
                  >
                    <Share2 size={15} />
                    Compartir
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
