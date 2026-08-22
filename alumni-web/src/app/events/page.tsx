"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {

  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.log(error);
      return;
    }

    setEvents(data || []);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-6xl mx-auto p-8">

        <div className="mb-10">
          <h1 className="text-5xl font-bold">🎓 Eventos</h1>
          <p className="text-zinc-400 mt-3">
            Descubre conferencias, hackathons, ferias de empleo y actividades universitarias.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
            No hay eventos disponibles.
          </div>
        ) : (
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg hover:border-blue-500 transition"
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gradient-to-r from-blue-600 via-violet-600 to-sky-500" />
                )}

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-blue-400 font-semibold">
                        Evento
                      </p>
                      <h2 className="mt-2 text-3xl font-bold text-white">
                        {event.title}
                      </h2>
                    </div>
                    <div className="rounded-3xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-right">
                      <p className="text-xs text-zinc-500">Fecha</p>
                      <p className="mt-2 text-lg font-semibold">
                        {new Date(event.event_date).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4">
                      <p className="text-sm text-zinc-400">Ubicación</p>
                      <p className="mt-1 font-semibold text-white">{event.location || "Desconocida"}</p>
                    </div>
                    <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-4">
                      <p className="text-sm text-zinc-400">Hora</p>
                      <p className="mt-1 font-semibold text-white">
                        {new Date(event.event_date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 text-zinc-300 leading-7">
                    {event.description}
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 transition px-6 py-3 rounded-3xl font-semibold">
                      Asistir
                    </button>
                    <button className="w-full sm:w-auto border border-zinc-800 rounded-3xl px-6 py-3 text-white hover:bg-zinc-800 transition">
                      Compartir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
