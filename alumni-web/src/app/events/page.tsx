"use client";

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ListLoadingSkeleton } from "@/components/ui/AlumniLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import EventCreateSheet from "@/components/events/EventCreateSheet";
import "./events-core-4-1.css";
import "../interior-ui-1-0.css";
import "./events-mobile-pro-4-0.css";

type Filter = "upcoming" | "mine" | "past";

const EVENT_LABELS: Record<string, string> = {
  meetup: "Encuentro",
  party: "Fiesta",
  sports: "Deporte",
  academic: "Académico",
  cultural: "Cultural",
  graduation: "Graduación",
  other: "Otro",
};

const EMPTY_FORM = {
  title: "",
  description: "",
  event_date: "",
  end_date: "",
  location: "",
  event_type: "meetup",
  visibility: "public",
  community_id: "",
  max_attendees: "",
  organizer_anonymous: false,
};

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });

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

  function openCreate() {
    setCreateError("");
    setCreateOpen(true);
  }

  function closeCreate() {
    if (creating) return;
    setCreateError("");
    setCreateOpen(false);
  }

  async function createEvent() {
    if (!user || creating) return;

    const title = form.title.trim();
    if (!title) {
      setCreateError("Agrega un nombre para el evento.");
      return;
    }

    if (!form.event_date) {
      setCreateError("Selecciona cuándo empieza.");
      return;
    }

    if (form.visibility === "community" && !form.community_id) {
      setCreateError("Selecciona una comunidad.");
      return;
    }

    const startsAt = new Date(form.event_date);
    if (Number.isNaN(startsAt.getTime())) {
      setCreateError("La fecha de inicio no es válida.");
      return;
    }

    let endsAt: Date | null = null;
    if (form.end_date) {
      endsAt = new Date(form.end_date);
      if (Number.isNaN(endsAt.getTime())) {
        setCreateError("La fecha final no es válida.");
        return;
      }
      if (endsAt.getTime() < startsAt.getTime()) {
        setCreateError("El evento no puede terminar antes de empezar.");
        return;
      }
    }

    let capacity: number | null = null;
    if (form.max_attendees) {
      const parsed = Number(form.max_attendees);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100000) {
        setCreateError("El cupo debe ser un número válido.");
        return;
      }
      capacity = parsed;
    }

    setCreating(true);
    setCreateError("");

    try {
      const { data, error } = await supabase
        .from("events")
        .insert({
          created_by: user.id,
          title,
          description: form.description.trim() || null,
          event_date: startsAt.toISOString(),
          end_date: endsAt ? endsAt.toISOString() : null,
          location: form.location.trim() || null,
          event_type: form.event_type,
          visibility: form.visibility,
          community_id:
            form.visibility === "community"
              ? form.community_id
              : null,
          max_attendees: capacity,
          organizer_anonymous: form.organizer_anonymous,
        })
        .select("id")
        .single();

      if (error || !data?.id) {
        throw error || new Error("No se recibió el evento creado.");
      }

      setForm({ ...EMPTY_FORM });
      setCreateOpen(false);
      window.location.href = `/events/${data.id}`;
    } catch (error: any) {
      console.error("[Alumni Events] create:", error);

      const raw = String(error?.message || "");
      const lower = raw.toLowerCase();

      setCreateError(
        lower.includes("row-level security") ||
        lower.includes("permission") ||
        lower.includes("policy")
          ? "No tienes permiso para crear este evento."
          : raw || "No pudimos crear el evento. Intenta de nuevo."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <main
        className="alumni-events-2 alumni-events-mobile-pro mx-auto w-full max-w-[920px]"
        data-alumni-motion-ignore="true"
      >
        <header className="events2-hero">
          <div>
            <h1>Eventos</h1>
          </div>

          {user && (
            <button
              type="button"
              className="events2-primary-action"
              onClick={openCreate}
            >
              <Plus size={17} />
              Crear evento
            </button>
          )}
        </header>

        <div className="events2-navigation">
          <label className="events2-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar evento"
              aria-label="Buscar evento"
            />
          </label>

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
                      {event.visibility === "community"
                        ? "Solo comunidad"
                        : "Evento público"}
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
                    {response === "going" && <em>Vas</em>}
                    {response === "interested" && <em>Te interesa</em>}
                    <ChevronRight size={17} />
                  </span>
                </Link>
              );
            })}
          </section>
        )}

        <EventCreateSheet
          open={createOpen}
          form={form}
          communities={communities}
          creating={creating}
          error={createError}
          onChange={(patch) => {
            setCreateError("");
            setForm((current) => ({ ...current, ...patch }));
          }}
          onClose={closeCreate}
          onSubmit={() => void createEvent()}
        />
      </main>
    </AppShell>
  );
}

/* ALUMNI_EVENTS_ORGANIZER_CHAT_6_2:LIST_CREATE */

