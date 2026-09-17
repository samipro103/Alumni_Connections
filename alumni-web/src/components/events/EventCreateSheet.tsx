"use client";

import {
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  Globe2,
  GraduationCap,
  MapPin,
  Palette,
  PartyPopper,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

export type EventCreateForm = {
  title: string;
  description: string;
  event_date: string;
  end_date: string;
  location: string;
  event_type: string;
  visibility: string;
  community_id: string;
  max_attendees: string;
};

const EVENT_TYPES = [
  { id: "meetup", label: "Encuentro", icon: Users },
  { id: "party", label: "Fiesta", icon: PartyPopper },
  { id: "sports", label: "Deporte", icon: Trophy },
  { id: "academic", label: "Académico", icon: BookOpen },
  { id: "cultural", label: "Cultural", icon: Palette },
  { id: "graduation", label: "Graduación", icon: GraduationCap },
  { id: "other", label: "Otro", icon: Sparkles },
] as const;

export default function EventCreateSheet({
  open,
  form,
  communities,
  creating,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  form: EventCreateForm;
  communities: any[];
  creating: boolean;
  error: string;
  onChange: (patch: Partial<EventCreateForm>) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const ready =
    Boolean(form.title.trim()) &&
    Boolean(form.event_date) &&
    (form.visibility !== "community" || Boolean(form.community_id));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="events-create-v2-overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <motion.section
            className="events-create-v2"
            role="dialog"
            aria-modal="true"
            aria-label="Crear evento"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.23, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <header className="events-create-v2-top">
              <motion.button
                type="button"
                onClick={onClose}
                disabled={creating}
                aria-label="Cerrar"
                whileTap={reduceMotion ? undefined : { scale: 0.92 }}
              >
                <X size={19} />
              </motion.button>

              <div>
                <strong>Nuevo evento</strong>
                <span>ALUMNI</span>
              </div>

              <span
                className="events-create-v2-ready"
                data-ready={ready ? "true" : "false"}
              >
                <Check size={14} />
              </span>
            </header>

            <div className="events-create-v2-scroll">
              <section className="events-create-v2-title">
                <label>
                  <span>Nombre</span>
                  <input
                    autoFocus
                    value={form.title}
                    maxLength={100}
                    onChange={(event) => onChange({ title: event.target.value })}
                    placeholder="¿Qué vas a organizar?"
                  />
                  <small>{form.title.length}/100</small>
                </label>
              </section>

              <section className="events-create-v2-block">
                <div className="events-create-v2-label">Tipo</div>
                <div className="events-create-v2-types">
                  {EVENT_TYPES.map(({ id, label, icon: Icon }) => {
                    const active = form.event_type === id;
                    return (
                      <motion.button
                        key={id}
                        type="button"
                        data-active={active ? "true" : "false"}
                        onClick={() => onChange({ event_type: id })}
                        whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                      >
                        <Icon size={15} />
                        <span>{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              <section className="events-create-v2-block">
                <div className="events-create-v2-label">Cuándo</div>
                <label className="events-create-v2-input">
                  <CalendarDays size={17} />
                  <span>
                    <small>Empieza</small>
                    <input
                      type="datetime-local"
                      value={form.event_date}
                      onChange={(event) => onChange({ event_date: event.target.value })}
                    />
                  </span>
                </label>

                <label className="events-create-v2-input">
                  <Clock3 size={17} />
                  <span>
                    <small>Termina · opcional</small>
                    <input
                      type="datetime-local"
                      value={form.end_date}
                      onChange={(event) => onChange({ end_date: event.target.value })}
                    />
                  </span>
                </label>
              </section>

              <section className="events-create-v2-block">
                <div className="events-create-v2-label">Lugar</div>
                <label className="events-create-v2-input events-create-v2-text">
                  <MapPin size={17} />
                  <input
                    value={form.location}
                    maxLength={160}
                    onChange={(event) => onChange({ location: event.target.value })}
                    placeholder="Campus, café, estadio..."
                  />
                </label>
              </section>

              <section className="events-create-v2-block">
                <div className="events-create-v2-label">
                  Descripción <span>opcional</span>
                </div>
                <label className="events-create-v2-description">
                  <textarea
                    value={form.description}
                    maxLength={700}
                    onChange={(event) => onChange({ description: event.target.value })}
                    placeholder="Contá brevemente de qué se trata."
                  />
                  <small>{form.description.length}/700</small>
                </label>
              </section>

              <section className="events-create-v2-block">
                <div className="events-create-v2-label">Visibilidad</div>
                <div className="events-create-v2-visibility">
                  <motion.button
                    type="button"
                    data-active={form.visibility === "public" ? "true" : "false"}
                    onClick={() => onChange({ visibility: "public", community_id: "" })}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    <Globe2 size={16} />
                    Público
                  </motion.button>

                  <motion.button
                    type="button"
                    data-active={form.visibility === "community" ? "true" : "false"}
                    onClick={() => onChange({ visibility: "community" })}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  >
                    <Users size={16} />
                    Comunidad
                  </motion.button>
                </div>

                <AnimatePresence initial={false}>
                  {form.visibility === "community" && (
                    <motion.div
                      className="events-create-v2-community"
                      initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {communities.length ? (
                        <select
                          value={form.community_id}
                          onChange={(event) => onChange({ community_id: event.target.value })}
                        >
                          <option value="">Elegir comunidad</option>
                          {communities.map((community) => (
                            <option key={community.id} value={community.id}>
                              {community.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p>No tienes comunidades disponibles.</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              <section className="events-create-v2-block events-create-v2-last">
                <div className="events-create-v2-label">Cupo <span>opcional</span></div>
                <label className="events-create-v2-input events-create-v2-text">
                  <Users size={17} />
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    value={form.max_attendees}
                    onChange={(event) => onChange({ max_attendees: event.target.value })}
                    placeholder="Sin límite"
                  />
                </label>
              </section>

              {error && (
                <motion.p
                  className="events-create-v2-error"
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </div>

            <footer className="events-create-v2-footer">
              <motion.button
                type="button"
                disabled={creating || !ready}
                onClick={onSubmit}
                whileTap={reduceMotion || creating || !ready ? undefined : { scale: 0.985 }}
              >
                {creating && <span className="events-create-v2-spinner" aria-hidden="true" />}
                {creating ? "Creando..." : "Crear evento"}
              </motion.button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ALUMNI_EVENTS_CREATE_PRO_6_0 */
