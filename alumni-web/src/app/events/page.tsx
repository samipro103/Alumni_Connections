"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Globe2,
  GraduationCap,
  MapPin,
  Palette,
  PartyPopper,
  Plus,
  Search,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ListLoadingSkeleton } from "@/components/ui/AlumniLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./events-2.css";

type Filter = "upcoming" | "mine" | "past";

const EVENT_TYPES = [
  { id: "meetup", label: "Encuentro", icon: Users },
  { id: "party", label: "Fiesta", icon: PartyPopper },
  { id: "sports", label: "Deporte", icon: Trophy },
  { id: "academic", label: "Académico", icon: BookOpen },
  { id: "cultural", label: "Cultural", icon: Palette },
  { id: "graduation", label: "Graduación", icon: GraduationCap },
  { id: "other", label: "Otro", icon: Sparkles },
] as const;

const EVENT_LABELS = Object.fromEntries(
  EVENT_TYPES.map((item) => [item.id, item.label])
);

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

  useEffect(() => {
    if (!createOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [createOpen]);

  async function load() {
    setLoading(true);

    const [eventsResult, rsvpResult, membershipResult] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true }),
      user
        ? supabase
            .from("event_rsvps")
            .select("event_id,status")
            .eq("user_id", user.id)
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
    () =>
      new Map(
        rsvps.map((row) => [
          Number(row.event_id),
          row.status,
        ])
      ),
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
        !["going", "interested"].includes(
          rsvpMap.get(Number(event.id)) || ""
        )
      ) {
        return false;
      }

      if (!value) return true;

      return [
        event.title,
        event.description,
        event.location,
        EVENT_LABELS[event.event_type],
      ]
        .filter(Boolean)
        .some((item) =>
          String(item).toLowerCase().includes(value)
        );
    });
  }, [events, filter, query, rsvpMap]);

  function closeCreate() {
    if (creating) return;
    setCreateOpen(false);
  }

  async function createEvent() {
    if (
      !user ||
      creating ||
      !form.title.trim() ||
      !form.event_date
    ) {
      return;
    }

    if (
      form.visibility === "community" &&
      !form.community_id
    ) {
      alert("Selecciona la comunidad del evento.");
      return;
    }

    setCreating(true);

    const { error } = await supabase.rpc(
      "alumni_create_event",
      {
        p_title: form.title,
        p_description: form.description || null,
        p_event_date: form.event_date,
        p_end_date: form.end_date || null,
        p_location: form.location || null,
        p_event_type: form.event_type,
        p_visibility: form.visibility,
        p_community:
          form.visibility === "community"
            ? form.community_id
            : null,
        p_max_attendees: form.max_attendees
          ? Number(form.max_attendees)
          : null,
      }
    );

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
        <header className="events2-hero">
          <div>
            <span className="events2-eyebrow">Eventos</span>
            <h1>Planes que sí pasan.</h1>
            <p>
              Descubre encuentros de tu comunidad o crea uno
              para reunir a las personas correctas.
            </p>
          </div>

          {user && (
            <button
              type="button"
              className="events2-primary-action"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={17} />
              Crear evento
            </button>
          )}
        </header>

        <div className="events2-navigation">
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
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar evento"
            />
          </label>
        </div>

        {loading ? (
          <ListLoadingSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <section className="events2-empty">
            <CalendarDays size={25} />
            <strong>
              {filter === "mine"
                ? "Todavía no tienes planes."
                : "No hay eventos por aquí."}
            </strong>
            <p>
              {filter === "mine"
                ? "Cuando marques “Voy” o “Me interesa”, aparecerán aquí."
                : "Puedes crear el primero en unos segundos."}
            </p>
          </section>
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
                  <time className="events2-date">
                    <span>
                      {date.toLocaleDateString("es-SV", {
                        month: "short",
                      })}
                    </span>
                    <strong>{date.getDate()}</strong>
                  </time>

                  <span className="events2-row-main">
                    <span className="events2-row-kicker">
                      {EVENT_LABELS[event.event_type] || "Evento"}
                      {event.visibility === "community"
                        ? " · Solo comunidad"
                        : ""}
                    </span>

                    <strong className="events2-row-title">
                      {event.title}
                    </strong>

                    <small className="events2-row-meta">
                      <Clock3 size={12} />
                      {date.toLocaleTimeString("es-SV", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}

                      {event.location && (
                        <>
                          <span>·</span>
                          <MapPin size={12} />
                          {event.location}
                        </>
                      )}
                    </small>
                  </span>

                  <span className="events2-row-side">
                    {response === "going" && (
                      <em>Vas</em>
                    )}
                    {response === "interested" && (
                      <em>Te interesa</em>
                    )}
                    <ChevronRight size={17} />
                  </span>
                </Link>
              );
            })}
          </section>
        )}

        {createOpen && (
          <div
            className="events2-editor-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeCreate();
              }
            }}
          >
            <section
              className="events2-editor"
              role="dialog"
              aria-modal="true"
              aria-label="Crear evento"
            >
              <header className="events2-editor-header">
                <button
                  type="button"
                  className="events2-editor-back"
                  onClick={closeCreate}
                  disabled={creating}
                >
                  <ArrowLeft size={17} />
                  Volver
                </button>

                <div>
                  <span>Nuevo evento</span>
                  <h2>Crea un plan que invite a participar.</h2>
                  <p>
                    Solo necesitas lo esencial. Podrás compartirlo
                    apenas lo publiques.
                  </p>
                </div>

                <span className="events2-editor-progress">
                  3 pasos
                </span>
              </header>

              <div className="events2-editor-body">
                <section className="events2-editor-section">
                  <div className="events2-step">
                    <strong>01</strong>
                    <span>
                      <b>La idea</b>
                      <small>Qué va a pasar</small>
                    </span>
                  </div>

                  <div className="events2-fields">
                    <label className="events2-field events2-field-large">
                      <span>Nombre del evento</span>
                      <input
                        value={form.title}
                        maxLength={100}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="Ej. Reencuentro generación 2022"
                        autoFocus
                      />
                      <small>{form.title.length}/100</small>
                    </label>

                    <label className="events2-field">
                      <span>Descripción</span>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Cuenta brevemente qué harán o por qué vale la pena ir."
                      />
                    </label>

                    <div className="events2-choice-group">
                      <span className="events2-choice-label">
                        Tipo de evento
                      </span>

                      <div className="events2-type-grid">
                        {EVENT_TYPES.map(
                          ({ id, label, icon: Icon }) => (
                            <button
                              key={id}
                              type="button"
                              data-active={
                                form.event_type === id
                                  ? "true"
                                  : "false"
                              }
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  event_type: id,
                                }))
                              }
                            >
                              <Icon size={16} />
                              <span>{label}</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="events2-editor-section">
                  <div className="events2-step">
                    <strong>02</strong>
                    <span>
                      <b>Cuándo y dónde</b>
                      <small>Los datos para llegar</small>
                    </span>
                  </div>

                  <div className="events2-fields">
                    <div className="events2-two-columns">
                      <label className="events2-field">
                        <span>Empieza</span>
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

                      <label className="events2-field">
                        <span>Termina · opcional</span>
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

                    <label className="events2-field events2-field-icon">
                      <span>Lugar</span>
                      <div>
                        <MapPin size={16} />
                        <input
                          value={form.location}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              location: event.target.value,
                            }))
                          }
                          placeholder="Campus, café, estadio..."
                        />
                      </div>
                    </label>

                    <label className="events2-field events2-capacity">
                      <span>Cupo · opcional</span>
                      <div>
                        <Users size={16} />
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
                          placeholder="Sin límite"
                        />
                      </div>
                    </label>
                  </div>
                </section>

                <section className="events2-editor-section">
                  <div className="events2-step">
                    <strong>03</strong>
                    <span>
                      <b>Quién lo verá</b>
                      <small>Elige el alcance</small>
                    </span>
                  </div>

                  <div className="events2-fields">
                    <div className="events2-visibility">
                      <button
                        type="button"
                        data-active={
                          form.visibility === "public"
                            ? "true"
                            : "false"
                        }
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            visibility: "public",
                            community_id: "",
                          }))
                        }
                      >
                        <Globe2 size={18} />
                        <span>
                          <strong>Público</strong>
                          <small>
                            Cualquier persona en Alumni puede verlo.
                          </small>
                        </span>
                      </button>

                      <button
                        type="button"
                        data-active={
                          form.visibility === "community"
                            ? "true"
                            : "false"
                        }
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            visibility: "community",
                          }))
                        }
                      >
                        <Users size={18} />
                        <span>
                          <strong>Una comunidad</strong>
                          <small>
                            Solo miembros de la comunidad elegida.
                          </small>
                        </span>
                      </button>
                    </div>

                    {form.visibility === "community" && (
                      <label className="events2-field">
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
                          <option value="">
                            Selecciona una comunidad
                          </option>
                          {communities.map((community) => (
                            <option
                              key={community.id}
                              value={community.id}
                            >
                              {community.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                </section>
              </div>

              <footer className="events2-editor-footer">
                <span>
                  {!form.title.trim()
                    ? "Escribe un nombre para continuar."
                    : !form.event_date
                    ? "Falta la fecha de inicio."
                    : form.visibility === "community" &&
                      !form.community_id
                    ? "Selecciona una comunidad."
                    : "Todo listo para publicar."}
                </span>

                <button
                  type="button"
                  disabled={
                    creating ||
                    !form.title.trim() ||
                    !form.event_date ||
                    (form.visibility === "community" &&
                      !form.community_id)
                  }
                  onClick={() => void createEvent()}
                >
                  {creating ? "Publicando..." : "Publicar evento"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_5_EVENTS_EDITORIAL_REDESIGN */

/* ALUMNI_2_7_0_LOADING_STATES:EVENTS */
