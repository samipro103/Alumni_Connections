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
    setCreateStep(1);
    setStepDirection(1);
    setCreateOpen(true);
  }

  function closeCreate() {
    if (creating) return;
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

        <AnimatePresence>
          {createOpen && (
            <motion.div
              className="events2-editor-backdrop events2-wizard-backdrop"
              initial={
                reduceMotion
                  ? false
                  : { opacity: 0 }
              }
              animate={{ opacity: 1 }}
              exit={
                reduceMotion
                  ? undefined
                  : { opacity: 0 }
              }
              transition={{ duration: 0.16 }}
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeCreate();
                }
              }}
            >
              <motion.section
                className="events2-editor events2-wizard"
                role="dialog"
                aria-modal="true"
                aria-label="Crear evento"
                initial={
                  reduceMotion
                    ? false
                    : {
                        opacity: 0,
                        y: 14,
                        scale: 0.995,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: 0,
                        y: 8,
                      }
                }
                transition={{
                  duration: 0.24,
                  ease: [0.2, 0.8, 0.2, 1],
                }}
              >
                <header className="events2-editor-header events2-wizard-header">
                  <motion.button
                    type="button"
                    className="events2-editor-back"
                    onClick={closeCreate}
                    disabled={creating}
                    aria-label="Cerrar creador de evento"
                    whileTap={
                      reduceMotion
                        ? undefined
                        : { scale: 0.92 }
                    }
                  >
                    <X size={18} />
                  </motion.button>

                  <div>
                    <h2>Crear evento</h2>
                    <small>
                      {createStep === 1
                        ? "La idea"
                        : createStep === 2
                        ? "Cuándo y dónde"
                        : "Quién lo verá"}
                    </small>
                  </div>

                  <span className="events2-editor-progress">
                    {createStep} de 3
                  </span>
                </header>

                <div
                  className="events2-wizard-progress"
                  aria-label={"Paso " + createStep + " de 3"}
                >
                  {[1, 2, 3].map((step) => (
                    <span
                      key={step}
                      data-active={
                        step <= createStep
                          ? "true"
                          : "false"
                      }
                    />
                  ))}
                </div>

                <div className="events2-editor-body events2-wizard-body">
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    <motion.section
                      key={createStep}
                      className="events2-wizard-step"
                      initial={
                        reduceMotion
                          ? false
                          : {
                              opacity: 0,
                              x:
                                stepDirection > 0
                                  ? 14
                                  : -14,
                            }
                      }
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      exit={
                        reduceMotion
                          ? undefined
                          : {
                              opacity: 0,
                              x:
                                stepDirection > 0
                                  ? -10
                                  : 10,
                            }
                      }
                      transition={{
                        duration: 0.18,
                        ease: [0.2, 0.8, 0.2, 1],
                      }}
                    >
                      {createStep === 1 && (
                        <>
                          <div className="events2-wizard-intro">
                            <span className="events2-wizard-intro-icon">
                              <Sparkles size={18} />
                            </span>
                            <div>
                              <strong>Dale forma a tu evento</strong>
                              <small>
                                Un nombre claro y el tipo correcto bastan para empezar.
                              </small>
                            </div>
                          </div>

                          <div className="events2-fields events2-wizard-fields">
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
                              />
                              <small>
                                {form.title.length}/100
                              </small>
                            </label>

                            <label className="events2-field">
                              <span>Descripción · opcional</span>
                              <textarea
                                value={form.description}
                                maxLength={700}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    description:
                                      event.target.value,
                                  }))
                                }
                                placeholder="¿Qué harán y por qué vale la pena ir?"
                              />
                            </label>

                            <div className="events2-choice-group">
                              <span className="events2-choice-label">
                                Tipo de evento
                              </span>

                              <div className="events2-type-grid events2-wizard-choice-grid">
                                {EVENT_TYPES.map(
                                  ({
                                    id,
                                    label,
                                    icon: Icon,
                                  }) => (
                                    <motion.button
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
                                      whileTap={
                                        reduceMotion
                                          ? undefined
                                          : { scale: 0.96 }
                                      }
                                    >
                                      <Icon size={16} />
                                      <span>{label}</span>
                                      {form.event_type === id && (
                                        <Check
                                          size={13}
                                          className="events2-wizard-choice-check"
                                        />
                                      )}
                                    </motion.button>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {createStep === 2 && (
                        <>
                          <div className="events2-wizard-intro">
                            <span className="events2-wizard-intro-icon">
                              <CalendarDays size={18} />
                            </span>
                            <div>
                              <strong>Ubícalo en el calendario</strong>
                              <small>
                                La fecha de inicio es lo único obligatorio en este paso.
                              </small>
                            </div>
                          </div>

                          <div className="events2-fields events2-wizard-fields">
                            <div className="events2-two-columns">
                              <label className="events2-field">
                                <span>Empieza</span>
                                <input
                                  type="datetime-local"
                                  value={form.event_date}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      event_date:
                                        event.target.value,
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
                                      end_date:
                                        event.target.value,
                                    }))
                                  }
                                />
                              </label>
                            </div>

                            <label className="events2-field events2-field-icon">
                              <span>Lugar · opcional</span>
                              <div>
                                <MapPin size={16} />
                                <input
                                  value={form.location}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      location:
                                        event.target.value,
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
                                  inputMode="numeric"
                                  value={form.max_attendees}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      max_attendees:
                                        event.target.value,
                                    }))
                                  }
                                  placeholder="Sin límite"
                                />
                              </div>
                            </label>
                          </div>
                        </>
                      )}

                      {createStep === 3 && (
                        <>
                          <div className="events2-wizard-intro">
                            <span className="events2-wizard-intro-icon">
                              <Globe2 size={18} />
                            </span>
                            <div>
                              <strong>Elegí quién puede verlo</strong>
                              <small>
                                Podés publicarlo para todos o limitarlo a una comunidad.
                              </small>
                            </div>
                          </div>

                          <div className="events2-fields events2-wizard-fields">
                            <div className="events2-visibility events2-wizard-visibility">
                              <motion.button
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
                                whileTap={
                                  reduceMotion
                                    ? undefined
                                    : { scale: 0.985 }
                                }
                              >
                                <Globe2 size={19} />
                                <span>
                                  <strong>Público</strong>
                                  <small>
                                    Cualquier persona en ALUMNI puede verlo.
                                  </small>
                                </span>
                              </motion.button>

                              <motion.button
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
                                whileTap={
                                  reduceMotion
                                    ? undefined
                                    : { scale: 0.985 }
                                }
                              >
                                <Users size={19} />
                                <span>
                                  <strong>Una comunidad</strong>
                                  <small>
                                    Solo miembros de la comunidad elegida.
                                  </small>
                                </span>
                              </motion.button>
                            </div>

                            <AnimatePresence initial={false}>
                              {form.visibility ===
                                "community" && (
                                <motion.label
                                  className="events2-field events2-wizard-community-select"
                                  initial={
                                    reduceMotion
                                      ? false
                                      : {
                                          opacity: 0,
                                          height: 0,
                                        }
                                  }
                                  animate={{
                                    opacity: 1,
                                    height: "auto",
                                  }}
                                  exit={
                                    reduceMotion
                                      ? undefined
                                      : {
                                          opacity: 0,
                                          height: 0,
                                        }
                                  }
                                  transition={{
                                    duration: 0.18,
                                  }}
                                >
                                  <span>Comunidad</span>
                                  <select
                                    value={form.community_id}
                                    onChange={(event) =>
                                      setForm((current) => ({
                                        ...current,
                                        community_id:
                                          event.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">
                                      Selecciona una comunidad
                                    </option>
                                    {communities.map(
                                      (community) => (
                                        <option
                                          key={community.id}
                                          value={community.id}
                                        >
                                          {community.name}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </motion.label>
                              )}
                            </AnimatePresence>

                            <div className="events2-wizard-preview">
                              <span className="events2-wizard-preview-icon">
                                <CalendarDays size={19} />
                              </span>

                              <span className="events2-wizard-preview-copy">
                                <small>Tu evento</small>
                                <strong>
                                  {form.title ||
                                    "Nuevo evento"}
                                </strong>
                                <span>
                                  {form.event_date
                                    ? new Date(
                                        form.event_date
                                      ).toLocaleString(
                                        "es-SV",
                                        {
                                          dateStyle:
                                            "medium",
                                          timeStyle:
                                            "short",
                                        }
                                      )
                                    : "Fecha pendiente"}
                                  {form.location
                                    ? " · " + form.location
                                    : ""}
                                </span>
                              </span>

                              <Check size={18} />
                            </div>
                          </div>
                        </>
                      )}
                    </motion.section>
                  </AnimatePresence>
                </div>

                <footer className="events2-editor-footer events2-wizard-footer">
                  <div className="events2-wizard-footer-state">
                    <span>
                      Paso {createStep} de 3
                    </span>
                    <strong>
                      {createStep === 1
                        ? form.title.trim()
                          ? "Buen comienzo"
                          : "Agrega un nombre"
                        : createStep === 2
                        ? form.event_date
                          ? "Fecha lista"
                          : "Agrega la fecha"
                        : currentStepReady
                        ? "Listo para crear"
                        : "Elige una comunidad"}
                    </strong>
                  </div>

                  <div className="events2-wizard-actions">
                    {createStep > 1 && (
                      <motion.button
                        type="button"
                        className="events2-wizard-secondary"
                        onClick={previousCreateStep}
                        disabled={creating}
                        whileTap={
                          reduceMotion
                            ? undefined
                            : { scale: 0.96 }
                        }
                      >
                        Atrás
                      </motion.button>
                    )}

                    {createStep < 3 ? (
                      <motion.button
                        type="button"
                        className="events2-wizard-primary"
                        disabled={!currentStepReady}
                        onClick={nextCreateStep}
                        whileTap={
                          reduceMotion ||
                          !currentStepReady
                            ? undefined
                            : { scale: 0.97 }
                        }
                      >
                        Continuar
                        <ChevronRight size={16} />
                      </motion.button>
                    ) : (
                      <motion.button
                        type="button"
                        className="events2-wizard-primary"
                        disabled={
                          creating ||
                          !form.title.trim() ||
                          !form.event_date ||
                          !currentStepReady
                        }
                        onClick={() =>
                          void createEvent()
                        }
                        whileTap={
                          reduceMotion ||
                          creating ||
                          !currentStepReady
                            ? undefined
                            : { scale: 0.97 }
                        }
                      >
                        {creating && (
                          <span
                            className="events2-wizard-spinner"
                            aria-hidden="true"
                          />
                        )}
                        {creating
                          ? "Creando..."
                          : "Crear evento"}
                      </motion.button>
                    )}
                  </div>
                </footer>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
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

{/* ALUMNI_MOBILE_FOCUS_EVENTS_POLISH_5_1:EVENTS */}
