"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
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
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import { ListLoadingSkeleton } from "@/components/ui/AlumniLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import EventCreateSheet from "@/components/events/EventCreateSheet";
import "./events-core-4-1.css";
import "../interior-ui-1-0.css";
import "./events-mobile-pro-4-0.css";

type Filter = "upcoming" | "mine" | "past";
type CreateStep = 1 | 2 | 3;

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
  const reduceMotion = useReducedMotion();
  const [events, setEvents] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
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

  function openCreate() {
    setCreateError("");
    setCreateStep(1);
    setStepDirection(1);
    setCreateOpen(true);
  }

  function closeCreate() {
    if (creating) return;
    setCreateError("");
    setCreateOpen(false);
  }

  function goToCreateStep(next: CreateStep) {
    setStepDirection(next > createStep ? 1 : -1);
    setCreateStep(next);
  }

  function nextCreateStep() {
    if (createStep === 1) {
      if (!form.title.trim()) return;
      goToCreateStep(2);
      return;
    }

    if (createStep === 2) {
      if (!form.event_date) return;
      goToCreateStep(3);
    }
  }

  function previousCreateStep() {
    if (createStep === 3) {
      goToCreateStep(2);
      return;
    }

    if (createStep === 2) {
      goToCreateStep(1);
    }
  }

  const currentStepReady =
    createStep === 1
      ? Boolean(form.title.trim())
      : createStep === 2
      ? Boolean(form.event_date)
      : form.visibility !== "community" ||
        Boolean(form.community_id);

  async function createEvent() {
    if (!user || creating) return;
    const title = form.title.trim();
    if (!title) { setCreateError("Agrega un nombre para el evento."); return; }
    if (!form.event_date) { setCreateError("Selecciona cuándo empieza."); return; }
    if (form.visibility === "community" && !form.community_id) { setCreateError("Selecciona una comunidad."); return; }
    const startsAt = new Date(form.event_date);
    if (Number.isNaN(startsAt.getTime())) { setCreateError("La fecha de inicio no es válida."); return; }
    let endsAt: Date | null = null;
    if (form.end_date) {
      endsAt = new Date(form.end_date);
      if (Number.isNaN(endsAt.getTime())) { setCreateError("La fecha final no es válida."); return; }
      if (endsAt.getTime() < startsAt.getTime()) { setCreateError("El evento no puede terminar antes de empezar."); return; }
    }
    let capacity: number | null = null;
    if (form.max_attendees) {
      const parsed = Number(form.max_attendees);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100000) { setCreateError("El cupo debe ser un número válido."); return; }
      capacity = parsed;
    }
    setCreating(true);
    setCreateError("");
    try {
      const { data, error } = await supabase.from("events").insert({
        created_by: user.id,
        title,
        description: form.description.trim() || null,
        event_date: startsAt.toISOString(),
        end_date: endsAt ? endsAt.toISOString() : null,
        location: form.location.trim() || null,
        event_type: form.event_type,
        visibility: form.visibility,
        community_id: form.visibility === "community" ? form.community_id : null,
        max_attendees: capacity,
      }).select("id").single();
      if (error || !data?.id) throw (error || new Error("No se recibió el evento creado."));
      setForm({ title:"", description:"", event_date:"", end_date:"", location:"", event_type:"meetup", visibility:"public", community_id:"", max_attendees:"" });
      setCreateOpen(false);
      window.location.href = `/events/${data.id}`;
    } catch (error: any) {
      console.error("[Alumni Events] create:", error);
      const raw = String(error?.message || "");
      const lower = raw.toLowerCase();
      setCreateError(lower.includes("row-level security") || lower.includes("permission") || lower.includes("policy") ? "No tienes permiso para crear este evento." : (raw || "No pudimos crear el evento. Intenta de nuevo."));
    } finally { setCreating(false); }
  }

  return (
    <AppShell>
      <main className="alumni-events-2 alumni-events-mobile-pro mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">
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

/* ALUMNI_2_1_5_EVENTS_EDITORIAL_REDESIGN */

/* ALUMNI_2_7_0_LOADING_STATES:EVENTS */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */

/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_4:EVENTS_HOME */

/* ALUMNI_EVENTS_MOBILE_PRO_4_0 */

/* ALUMNI_EVENTS_COMMUNITIES_STYLE_CONSOLIDATION_4_1:EVENTS:MAIN */

/* ALUMNI_CREATE_EXPERIENCE_PRO_5_0:EVENTS */

/* ALUMNI_MOBILE_FOCUS_EVENTS_POLISH_5_1:EVENTS */

/* ALUMNI_EVENTS_CREATE_PRO_6_0:PAGE */
