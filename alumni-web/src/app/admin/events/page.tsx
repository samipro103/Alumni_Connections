"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getEvents();
  }, []);

  async function getEvents() {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    setEvents(data || []);
  }

  async function createEvent() {
    if (!title.trim() || !eventDate || creating) return;

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    setCreating(true);

    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      event_date: new Date(eventDate).toISOString(),
      created_by: user.id,
    });

    if (error) {
      alert(error.message);
      setCreating(false);
      return;
    }

    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate("");
    setCreating(false);
    await getEvents();
  }

  async function deleteEvent(id: number) {
    if (!confirm("¿Eliminar este evento?")) return;
    await supabase.from("events").delete().eq("id", id);
    await getEvents();
  }

  return (
    <AdminShell title="Eventos" description="Crea y administra actividades visibles para la comunidad.">
      <section className="rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <Plus size={17} className="text-[#8d98ff]" />
          <h2 className="text-sm font-black text-zinc-200">Nuevo evento</h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título del evento" className="admin-input" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ubicación" className="admin-input" />
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="admin-input sm:col-span-2" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción..." rows={4} className="admin-textarea sm:col-span-2" />
        </div>

        <button onClick={createEvent} disabled={!title.trim() || !eventDate || creating} className="mt-4 flex h-10 items-center rounded-xl bg-[#6d7cff] px-4 text-xs font-black text-white disabled:bg-white/[0.06] disabled:text-zinc-700">
          {creating ? "Creando..." : "Crear evento"}
        </button>
      </section>

      <div className="mt-5 grid gap-3">
        {events.map((event: any) => (
          <article key={event.id} className="flex flex-col gap-4 rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6d7cff]/10 text-[#8d98ff]">
              <CalendarDays size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-black text-zinc-200">{event.title}</h3>
              <p className="mt-1 text-xs text-zinc-600">{new Date(event.event_date).toLocaleString("es-SV")}</p>
              {event.location && <p className="mt-1 flex items-center gap-1 text-xs text-zinc-700"><MapPin size={12} />{event.location}</p>}
            </div>
            <button onClick={() => deleteEvent(event.id)} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-700 transition hover:bg-red-500/10 hover:text-red-400">
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>

      <style jsx global>{`
        .admin-input {
          height: 44px;
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.035);
          padding: 0 13px;
          color: #d4d4d8;
          outline: none;
          font-size: 13px;
        }
        .admin-textarea {
          border-radius: 13px;
          border: 1px solid rgba(255,255,255,.07);
          background: rgba(255,255,255,.035);
          padding: 12px 13px;
          color: #d4d4d8;
          outline: none;
          resize: none;
          font-size: 13px;
        }
        .admin-input:focus,
        .admin-textarea:focus {
          border-color: rgba(109,124,255,.45);
        }
      `}</style>
    </AdminShell>
  );
}
