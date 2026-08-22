"use client";

import AdminGuard from "@/components/admin/AdminGuard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminEventsPage() {

  const [events, setEvents] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {

    const { data } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    setEvents(data || []);
  }

  async function createEvent() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) return;

    await supabase
      .from("events")
      .insert({
        title,
        description,
        location,
        event_date: eventDate,
        created_by: user.id,
      });

    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate("");

    getEvents();
  }

  async function deleteEvent(id: number) {

    await supabase
      .from("events")
      .delete()
      .eq("id", id);

    getEvents();
  }

  return (
    <AdminGuard>
      <main className="min-h-screen bg-[#09090B] text-white">

      <div className="max-w-6xl mx-auto p-8">

        <h1 className="text-5xl font-bold mb-10">
          🎓 Administrar Eventos
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-10">

          <h2 className="text-2xl font-bold mb-6">
            Crear Evento
          </h2>

          <div className="grid gap-4">

            <input
              type="text"
              placeholder="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <textarea
              placeholder="Descripción"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none min-h-[120px]"
            />

            <input
              type="text"
              placeholder="Ubicación"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="bg-zinc-800 rounded-xl px-4 py-3 outline-none"
            />

            <button
              onClick={createEvent}
              className="bg-blue-500 hover:bg-blue-600 transition py-3 rounded-xl font-semibold"
            >
              Crear Evento
            </button>

          </div>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

          {events.map((event) => (

            <div
              key={event.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6"
            >

              <h2 className="text-2xl font-bold">
                {event.title}
              </h2>

              <p className="text-zinc-400 mt-3">
                {event.description}
              </p>

              <div className="mt-4 space-y-2">

                <p>
                  📍 {event.location}
                </p>

                <p>
                  📅 {new Date(event.event_date).toLocaleDateString()}
                </p>

              </div>

              <button
                onClick={() => deleteEvent(event.id)}
                className="mt-6 w-full bg-red-500 hover:bg-red-600 transition py-3 rounded-xl font-semibold"
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
