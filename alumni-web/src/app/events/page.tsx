"use client";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./events-2.css";

type Filter = "upcoming" | "mine" | "past";

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    end_date: "",
    location: "",
    event_type: "meetup",
    visibility: "public",
    community_id: "",
    max_attendees: "",
  });

  useEffect(() => {
    void load();
  }, [user?.id]);

  async function load() {
    setLoading(true);

    const [eventsResult, rsvpResult, membershipResult] = await Promise.all([
      supabase.from("events").select("*").order("event_date", { ascending: true }),
      user
        ? supabase.from("event_rsvps").select("event_id,status").eq("user_id", user.id)
        : Promise.resolve({ data: [] } as any),
      user
        ? supabase
            .from("community_members")
            .select("community_id")
            .eq("user_id", user.id)
            .eq("status", "active")
        : Promise.resolve({ data: [] } as any),
    ]);

    const communityIds = (membershipResult.data || []).map(
      (row: any) => row.community_id
    );

    const communityResult = communityIds.length
      ? await supabase
          .from("communities")
          .select("id,name,slug")
          .in("id", communityIds)
          .order("name")
      : { data: [] as any[] };

    setEvents(eventsResult.data || []);
    setRsvps(rsvpResult.data || []);
    setCommunities(communityResult.data || []);
    setLoading(false);
  }

  const rsvpMap = useMemo(
    () => new Map(rsvps.map((row) => [Number(row.event_id), row.status])),
    [rsvps]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const value = query.trim().toLowerCase();

    return events.filter((event: any) => {
      const eventTime = new Date(event.event_date).getTime();

      if (filter === "upcoming" && eventTime < now) return false;
      if (filter === "past" && eventTime >= now) return false;
      if (
        filter === "mine" &&
        !["going", "interested"].includes(rsvpMap.get(Number(event.id)) || "")
      ) {
        return false;
      }

      if (!value) return true;

      return [event.title, event.description, event.location, event.event_type]
        .filter(Boolean)
        .some((item) =>
          String(item).toLowerCase().includes(value)
        );
    });
  }, [events, filter, query, rsvpMap]);

  async function createEvent() {
    if (!user || creating || !form.title.trim() || !form.event_date) return;

    setCreating(true);

    const { error } = await supabase.rpc("alumni_create_event", {
      p_title: form.title,
      p_description: form.description || null,
      p_event_date: form.event_date,
      p_end_date: form.end_date || null,
      p_location: form.location || null,
      p_event_type: form.event_type,
      p_visibility: form.visibility,
      p_community:
        form.visibility === "community" && form.community_id
          ? form.community_id
          : null,
      p_max_attendees: form.max_attendees
        ? Number(form.max_attendees)
        : null,
    });

    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCreateOpen(false);
    setForm({
      title: "",
      description: "",
      event_date: "",
      end_date: "",
      location: "",
      event_type: "meetup",
      visibility: "public",
      community_id: "",
      max_attendees: "",
    });
    await load();
  }

  return (
    <AppShell>
      <main className="alumni-events-2 mx-auto w-full max-w-[920px]">
        <header className="events2-header">
          <div>
            <span>Eventos</span>
            <h1>Haz planes. Encuéntrense.</h1>
            <p>
              Reuniones, graduaciones, torneos, fiestas y actividades creadas
              por la propia comunidad Alumni.
            </p>
          </div>

          {user && (
            <button type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Crear evento
            </button>
          )}
        </header>

        <div className="events2-toolbar">
          <div className="events2-tabs">
            {[
              ["upcoming", "Próximos"],
              ["mine", "Mis planes"],
              ["past", "Pasados"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                data-active={filter === id ? "true" : "false"}
                onClick={() => setFilter(id as Filter)}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="events2-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar evento..."
            />
          </label>
        </div>

        {loading ? (
          <p className="events2-state">Cargando eventos...</p>
        ) : filtered.length === 0 ? (
          <p className="events2-state">
            No hay eventos en esta sección.
          </p>
        ) : (
          <section className="events2-list">
            {filtered.map((event: any) => {
              const date = new Date(event.event_date);
              const response = rsvpMap.get(Number(event.id));

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="events2-row"
                >
                  <time>
                    <strong>{date.getDate()}</strong>
                    <span>
                      {date.toLocaleDateString("es-SV", {
                        month: "short",
                      })}
                    </span>
                  </time>

                  <span className="events2-copy">
                    <span>
                      {event.event_type || "Evento"}
                      {event.visibility === "community"
                        ? " · comunidad"
                        : ""}
                    </span>
                    <strong>{event.title}</strong>
                    <small>
                      {date.toLocaleTimeString("es-SV", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.location ? ` · ${event.location}` : ""}
                      {response === "going"
                        ? " · Vas"
                        : response === "interested"
                        ? " · Te interesa"
                        : ""}
                    </small>
                  </span>
                </Link>
              );
            })}
          </section>
        )}

        {createOpen && (
          <div
            className="events2-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCreateOpen(false);
            }}
          >
            <section className="events2-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Nuevo evento</span>
                  <h2>Organiza algo real.</h2>
                </div>
                <button type="button" onClick={() => setCreateOpen(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="events2-form">
                <label>
                  <span>Título</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    maxLength={100}
                  />
                </label>

                <label>
                  <span>Descripción</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="events2-form-grid">
                  <label>
                    <span>Inicio</span>
                    <input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          event_date: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    <span>Final (opcional)</span>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          end_date: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>

                <label>
                  <span>Ubicación</span>
                  <input
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Ej. Campus, café, estadio..."
                  />
                </label>

                <div className="events2-form-grid">
                  <label>
                    <span>Tipo</span>
                    <select
                      value={form.event_type}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          event_type: event.target.value,
                        }))
                      }
                    >
                      <option value="meetup">Encuentro</option>
                      <option value="party">Fiesta</option>
                      <option value="sports">Deporte</option>
                      <option value="academic">Académico</option>
                      <option value="cultural">Cultural</option>
                      <option value="graduation">Graduación</option>
                      <option value="other">Otro</option>
                    </select>
                  </label>

                  <label>
                    <span>Visibilidad</span>
                    <select
                      value={form.visibility}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          visibility: event.target.value,
                        }))
                      }
                    >
                      <option value="public">Público</option>
                      <option value="community">Solo comunidad</option>
                    </select>
                  </label>
                </div>

                {form.visibility === "community" && (
                  <label>
                    <span>Comunidad</span>
                    <select
                      value={form.community_id}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          community_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">Selecciona...</option>
                      {communities.map((community) => (
                        <option key={community.id} value={community.id}>
                          {community.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label>
                  <span>Cupo máximo (opcional)</span>
                  <input
                    type="number"
                    min={1}
                    value={form.max_attendees}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        max_attendees: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <footer>
                <button type="button" onClick={() => setCreateOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => void createEvent()}
                  disabled={creating || !form.title.trim() || !form.event_date}
                >
                  {creating ? "Creando..." : "Crear evento"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_EVENTS_HOME */
