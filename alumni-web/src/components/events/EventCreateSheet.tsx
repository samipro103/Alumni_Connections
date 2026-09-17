"use client";

import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  EyeOff,
  Globe2,
  GraduationCap,
  MapPin,
  Palette,
  PartyPopper,
  Search,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";

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
  organizer_anonymous: boolean;
};

type Picker = "type" | "community" | null;

const EVENT_TYPES = [
  { id: "meetup", label: "Encuentro", icon: Users, hint: "Reuniones y conexiones" },
  { id: "party", label: "Fiesta", icon: PartyPopper, hint: "Celebraciones y convivencia" },
  { id: "sports", label: "Deporte", icon: Trophy, hint: "Actividad física y torneos" },
  { id: "academic", label: "Académico", icon: BookOpen, hint: "Charlas, clases y aprendizaje" },
  { id: "cultural", label: "Cultural", icon: Palette, hint: "Arte, cultura y creatividad" },
  { id: "graduation", label: "Graduación", icon: GraduationCap, hint: "Logros y celebraciones" },
  { id: "other", label: "Otro", icon: Sparkles, hint: "Cualquier otra actividad" },
] as const;

const pickerTransition = {
  duration: 0.22,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

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
  const [picker, setPicker] = useState<Picker>(null);
  const [communityQuery, setCommunityQuery] = useState("");

  const ready =
    Boolean(form.title.trim()) &&
    Boolean(form.event_date) &&
    (form.visibility !== "community" || Boolean(form.community_id));

  const selectedType =
    EVENT_TYPES.find((item) => item.id === form.event_type) ?? EVENT_TYPES[0];
  const SelectedTypeIcon = selectedType.icon;

  const selectedCommunity = communities.find(
    (community) => String(community.id) === String(form.community_id)
  );

  const filteredCommunities = useMemo(() => {
    const value = communityQuery.trim().toLowerCase();
    if (!value) return communities;

    return communities.filter((community) =>
      [community.name, community.slug]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(value))
    );
  }, [communities, communityQuery]);

  useEffect(() => {
    if (!open) {
      setPicker(null);
      setCommunityQuery("");
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (picker) {
        setPicker(null);
        setCommunityQuery("");
        return;
      }

      if (!creating) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, picker, creating, onClose]);

  function openPicker(next: Exclude<Picker, null>) {
    if (creating) return;
    if (next === "community") setCommunityQuery("");
    setPicker(next);
  }

  function closePicker() {
    setPicker(null);
    setCommunityQuery("");
  }

  function chooseType(id: string) {
    onChange({ event_type: id });
    closePicker();
  }

  function chooseCommunity(id: string) {
    onChange({
      visibility: "community",
      community_id: id,
    });
    closePicker();
  }

  const motionProps = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 18 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -12 },
        transition: pickerTransition,
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="events-create-v3-overlay"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <motion.section
            className="events-create-v3"
            role="dialog"
            aria-modal="true"
            aria-label="Crear evento"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.995 }}
            transition={pickerTransition}
          >
            <AnimatePresence mode="wait" initial={false}>
              {picker === null && (
                <motion.div
                  key="event-main"
                  className="events-create-v3-screen"
                  {...motionProps}
                >
                  <header className="events-create-v3-top">
                    <motion.button
                      type="button"
                      className="events-create-v3-icon-button"
                      onClick={onClose}
                      disabled={creating}
                      aria-label="Cerrar"
                      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    >
                      <X size={19} />
                    </motion.button>

                    <div className="events-create-v3-top-copy">
                      <strong>Nuevo evento</strong>
                      <span>Organiza, conecta, haz comunidad.</span>
                    </div>

                    <motion.span
                      className="events-create-v3-ready"
                      data-ready={ready ? "true" : "false"}
                      animate={
                        reduceMotion
                          ? undefined
                          : ready
                          ? { scale: [0.92, 1.08, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.24 }}
                      aria-hidden="true"
                    >
                      <Check size={14} />
                    </motion.span>
                  </header>

                  <div className="events-create-v3-scroll">
                    <section className="events-create-v3-name">
                      <label htmlFor="event-create-title">Nombre</label>
                      <div className="events-create-v3-name-field">
                        <input
                          id="event-create-title"
                          value={form.title}
                          maxLength={100}
                          onChange={(event) =>
                            onChange({ title: event.target.value })
                          }
                          placeholder="¿Qué vas a organizar?"
                        />
                        <small>{form.title.length}/100</small>
                      </div>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">Tipo</div>
                      <motion.button
                        type="button"
                        className="events-create-v3-choice"
                        onClick={() => openPicker("type")}
                        whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                      >
                        <span className="events-create-v3-choice-icon">
                          <SelectedTypeIcon size={17} />
                        </span>
                        <span className="events-create-v3-choice-copy">
                          <strong>{selectedType.label}</strong>
                          <small>{selectedType.hint}</small>
                        </span>
                        <ChevronRight size={17} />
                      </motion.button>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">Cuándo</div>

                      <label className="events-create-v3-input-card">
                        <CalendarDays size={17} />
                        <span>
                          <small>Empieza</small>
                          <input
                            type="datetime-local"
                            value={form.event_date}
                            onChange={(event) =>
                              onChange({ event_date: event.target.value })
                            }
                          />
                        </span>
                      </label>

                      <label className="events-create-v3-input-card">
                        <Clock3 size={17} />
                        <span>
                          <small>Termina · opcional</small>
                          <input
                            type="datetime-local"
                            value={form.end_date}
                            onChange={(event) =>
                              onChange({ end_date: event.target.value })
                            }
                          />
                        </span>
                      </label>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">Lugar</div>
                      <label className="events-create-v3-input-card events-create-v3-plain-input">
                        <MapPin size={17} />
                        <input
                          value={form.location}
                          maxLength={160}
                          onChange={(event) =>
                            onChange({ location: event.target.value })
                          }
                          placeholder="Campus, café, estadio..."
                        />
                      </label>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">
                        Descripción <span>opcional</span>
                      </div>
                      <label className="events-create-v3-description">
                        <textarea
                          value={form.description}
                          maxLength={700}
                          onChange={(event) =>
                            onChange({ description: event.target.value })
                          }
                          placeholder="Contá brevemente de qué se trata."
                        />
                        <small>{form.description.length}/700</small>
                      </label>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">Visibilidad</div>
                      <div className="events-create-v3-segmented">
                        <motion.button
                          type="button"
                          data-active={
                            form.visibility === "public" ? "true" : "false"
                          }
                          onClick={() =>
                            onChange({
                              visibility: "public",
                              community_id: "",
                            })
                          }
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        >
                          <Globe2 size={16} />
                          Público
                        </motion.button>

                        <motion.button
                          type="button"
                          data-active={
                            form.visibility === "community" ? "true" : "false"
                          }
                          onClick={() =>
                            onChange({ visibility: "community" })
                          }
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        >
                          <Users size={16} />
                          Comunidad
                        </motion.button>
                      </div>

                      <AnimatePresence initial={false}>
                        {form.visibility === "community" && (
                          <motion.div
                            className="events-create-v3-community-wrap"
                            initial={
                              reduceMotion
                                ? false
                                : { opacity: 0, height: 0, y: -4 }
                            }
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={
                              reduceMotion
                                ? undefined
                                : { opacity: 0, height: 0, y: -4 }
                            }
                            transition={{ duration: 0.18 }}
                          >
                            <motion.button
                              type="button"
                              className="events-create-v3-choice"
                              onClick={() => openPicker("community")}
                              disabled={!communities.length}
                              whileTap={
                                reduceMotion || !communities.length
                                  ? undefined
                                  : { scale: 0.99 }
                              }
                            >
                              <span className="events-create-v3-choice-icon">
                                <Users size={17} />
                              </span>
                              <span className="events-create-v3-choice-copy">
                                <strong>
                                  {selectedCommunity?.name ||
                                    "Elegir comunidad"}
                                </strong>
                                <small>
                                  {communities.length
                                    ? selectedCommunity
                                      ? "Solo miembros de esta comunidad"
                                      : "Selecciona quién podrá verlo"
                                    : "No tienes comunidades disponibles"}
                                </small>
                              </span>
                              {communities.length > 0 && (
                                <ChevronRight size={17} />
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>

                    <section className="events-create-v3-group">
                      <div className="events-create-v3-label">Organizador</div>
                      <div className="events-create-v3-segmented">
                        <motion.button
                          type="button"
                          data-active={
                            !form.organizer_anonymous ? "true" : "false"
                          }
                          onClick={() =>
                            onChange({ organizer_anonymous: false })
                          }
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        >
                          <UserRound size={16} />
                          Mi perfil
                        </motion.button>

                        <motion.button
                          type="button"
                          data-active={
                            form.organizer_anonymous ? "true" : "false"
                          }
                          onClick={() =>
                            onChange({ organizer_anonymous: true })
                          }
                          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                        >
                          <EyeOff size={16} />
                          Anónimo
                        </motion.button>
                      </div>
                      <div className="events-create-v3-label">
                        <span>
                          {form.organizer_anonymous
                            ? "Tu identidad no se mostrará en el evento."
                            : "Tu nombre y foto podrán verse como organizador."}
                        </span>
                      </div>
                    </section>

                    <section className="events-create-v3-group events-create-v3-last">
                      <div className="events-create-v3-label">
                        Cupo <span>opcional</span>
                      </div>
                      <label className="events-create-v3-input-card events-create-v3-plain-input">
                        <Users size={17} />
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          inputMode="numeric"
                          value={form.max_attendees}
                          onChange={(event) =>
                            onChange({ max_attendees: event.target.value })
                          }
                          placeholder="Sin límite"
                        />
                      </label>
                    </section>

                    <AnimatePresence initial={false}>
                      {error && (
                        <motion.p
                          className="events-create-v3-error"
                          initial={
                            reduceMotion ? false : { opacity: 0, y: 5 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          exit={
                            reduceMotion ? undefined : { opacity: 0, y: -3 }
                          }
                        >
                          {error}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <footer className="events-create-v3-footer">
                    <motion.button
                      type="button"
                      className="events-create-v3-submit"
                      disabled={creating || !ready}
                      onClick={onSubmit}
                      whileTap={
                        reduceMotion || creating || !ready
                          ? undefined
                          : { scale: 0.986 }
                      }
                    >
                      {creating && (
                        <span
                          className="events-create-v3-spinner"
                          aria-hidden="true"
                        />
                      )}
                      {creating ? "Creando..." : "Crear evento"}
                    </motion.button>
                  </footer>
                </motion.div>
              )}

              {picker === "type" && (
                <motion.div
                  key="event-type"
                  className="events-create-v3-screen"
                  {...motionProps}
                >
                  <header className="events-create-v3-picker-top">
                    <motion.button
                      type="button"
                      className="events-create-v3-icon-button"
                      onClick={closePicker}
                      aria-label="Volver"
                      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    >
                      <ArrowLeft size={19} />
                    </motion.button>
                    <div>
                      <strong>Elegir tipo</strong>
                      <span>¿Qué clase de evento estás organizando?</span>
                    </div>
                    <span aria-hidden="true" />
                  </header>

                  <div className="events-create-v3-picker-scroll">
                    <div className="events-create-v3-picker-list">
                      {EVENT_TYPES.map(
                        ({ id, label, icon: Icon, hint }, index) => {
                          const active = form.event_type === id;

                          return (
                            <motion.button
                              key={id}
                              type="button"
                              className="events-create-v3-picker-row"
                              data-active={active ? "true" : "false"}
                              onClick={() => chooseType(id)}
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, y: 7 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.2,
                                delay: reduceMotion
                                  ? 0
                                  : Math.min(index * 0.025, 0.12),
                              }}
                              whileTap={
                                reduceMotion
                                  ? undefined
                                  : { scale: 0.992 }
                              }
                            >
                              <span className="events-create-v3-picker-icon">
                                <Icon size={18} />
                              </span>
                              <span className="events-create-v3-picker-copy">
                                <strong>{label}</strong>
                                <small>{hint}</small>
                              </span>
                              <span
                                className="events-create-v3-radio"
                                data-active={active ? "true" : "false"}
                                aria-hidden="true"
                              >
                                {active && <Check size={12} />}
                              </span>
                            </motion.button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {picker === "community" && (
                <motion.div
                  key="event-community"
                  className="events-create-v3-screen"
                  {...motionProps}
                >
                  <header className="events-create-v3-picker-top">
                    <motion.button
                      type="button"
                      className="events-create-v3-icon-button"
                      onClick={closePicker}
                      aria-label="Volver"
                      whileTap={reduceMotion ? undefined : { scale: 0.92 }}
                    >
                      <ArrowLeft size={19} />
                    </motion.button>
                    <div>
                      <strong>Elegir comunidad</strong>
                      <span>Selecciona quién podrá ver el evento.</span>
                    </div>
                    <span aria-hidden="true" />
                  </header>

                  <div className="events-create-v3-community-screen">
                    <label className="events-create-v3-search">
                      <Search size={16} />
                      <input
                        value={communityQuery}
                        onChange={(event) =>
                          setCommunityQuery(event.target.value)
                        }
                        placeholder="Buscar comunidad..."
                        autoFocus
                      />
                      {communityQuery && (
                        <button
                          type="button"
                          onClick={() => setCommunityQuery("")}
                          aria-label="Limpiar búsqueda"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>

                    <div className="events-create-v3-community-list">
                      {filteredCommunities.length ? (
                        filteredCommunities.map((community, index) => {
                          const active =
                            String(form.community_id) ===
                            String(community.id);

                          return (
                            <motion.button
                              key={community.id}
                              type="button"
                              className="events-create-v3-picker-row events-create-v3-community-row"
                              data-active={active ? "true" : "false"}
                              onClick={() =>
                                chooseCommunity(String(community.id))
                              }
                              initial={
                                reduceMotion
                                  ? false
                                  : { opacity: 0, y: 7 }
                              }
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.2,
                                delay: reduceMotion
                                  ? 0
                                  : Math.min(index * 0.022, 0.12),
                              }}
                              whileTap={
                                reduceMotion
                                  ? undefined
                                  : { scale: 0.992 }
                              }
                            >
                              <span className="events-create-v3-community-avatar">
                                {String(community.name || "C")
                                  .trim()
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <span className="events-create-v3-picker-copy">
                                <strong>{community.name}</strong>
                                <small>
                                  {community.slug
                                    ? `@${community.slug}`
                                    : "Comunidad ALUMNI"}
                                </small>
                              </span>
                              <span
                                className="events-create-v3-radio"
                                data-active={active ? "true" : "false"}
                                aria-hidden="true"
                              >
                                {active && <Check size={12} />}
                              </span>
                            </motion.button>
                          );
                        })
                      ) : (
                        <motion.div
                          className="events-create-v3-empty"
                          initial={
                            reduceMotion ? false : { opacity: 0, y: 6 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Users size={23} />
                          <strong>
                            {communities.length
                              ? "No encontramos esa comunidad."
                              : "No tienes comunidades disponibles."}
                          </strong>
                          <span>
                            {communities.length
                              ? "Prueba con otro nombre."
                              : "Únete a una comunidad para crear eventos exclusivos."}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ALUMNI_EVENTS_ORGANIZER_CHAT_6_2:CREATE */

