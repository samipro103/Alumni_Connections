"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  CalendarDays,
  ChevronRight,
  Globe2,
  GraduationCap,
  Lock,
  MapPin,
  Plus,
  Search,
  Sparkles,
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
import "./community-core-4-1.css";
import "../interior-ui-1-0.css";
import "./community-mobile-pro-4-0.css";

type CreateStep = 1 | 2 | 3;

const CATEGORIES = [
  {
    id: "general",
    label: "General",
    icon: Users,
  },
  {
    id: "university",
    label: "Universidad",
    icon: GraduationCap,
  },
  {
    id: "career",
    label: "Carrera",
    icon: BookOpen,
  },
  {
    id: "generation",
    label: "Generación",
    icon: CalendarDays,
  },
  {
    id: "city",
    label: "Ciudad",
    icon: MapPin,
  },
  {
    id: "interest",
    label: "Interés",
    icon: Sparkles,
  },
] as const;

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((item) => [item.id, item.label])
);

export default function CommunityPage() {
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [communities, setCommunities] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"discover" | "mine">("discover");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>(1);
  const [stepDirection, setStepDirection] = useState(1);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "general",
    visibility: "public",
    institution: "",
    career: "",
    city: "",
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

    const [communitiesResult, membersResult] = await Promise.all([
      supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false }),
      user
        ? supabase
            .from("community_members")
            .select("community_id,role,status,joined_at")
            .eq("user_id", user.id)
        : Promise.resolve({ data: [] } as any),
    ]);

    setCommunities(communitiesResult.data || []);
    setMembers(membersResult.data || []);
    setLoading(false);
  }

  const memberMap = useMemo(
    () =>
      new Map(
        members.map((row: any) => [
          row.community_id,
          row,
        ])
      ),
    [members]
  );

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    return communities.filter((community: any) => {
      const membership = memberMap.get(community.id);

      if (
        mode === "mine" &&
        membership?.status !== "active"
      ) {
        return false;
      }

      if (!value) return true;

      return [
        community.name,
        community.description,
        community.institution,
        community.career,
        community.city,
        CATEGORY_LABELS[community.category],
      ]
        .filter(Boolean)
        .some((item) =>
          String(item).toLowerCase().includes(value)
        );
    });
  }, [communities, memberMap, query, mode]);

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
      if (form.name.trim().length < 3) return;
      goToCreateStep(2);
      return;
    }

    if (createStep === 2) {
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
      ? form.name.trim().length >= 3
      : true;

  async function createCommunity() {
    if (
      !user ||
      creating ||
      form.name.trim().length < 3
    ) {
      return;
    }

    setCreating(true);

    const { data, error } = await supabase.rpc(
      "alumni_create_community",
      {
        p_name: form.name,
        p_description: form.description || null,
        p_category: form.category,
        p_visibility: form.visibility,
        p_institution: form.institution || null,
        p_career: form.career || null,
        p_city: form.city || null,
      }
    );

    setCreating(false);

    if (error) {
      alert(error.message);
      return;
    }

    setCreateOpen(false);

    setForm({
      name: "",
      description: "",
      category: "general",
      visibility: "public",
      institution: "",
      career: "",
      city: "",
    });

    const { data: created } = await supabase
      .from("communities")
      .select("slug")
      .eq("id", data)
      .maybeSingle();

    await load();

    if (created?.slug) {
      window.location.href = `/community/${created.slug}`;
    }
  }

  return (
    <AppShell>
      <main className="alumni-community-2 alumni-community-mobile-pro mx-auto w-full max-w-[920px]" data-alumni-motion-ignore="true">
        <header className="community2-hero">
          <div>
            <h1>Comunidades</h1>
          </div>

          {user && (
            <button
              type="button"
              onClick={openCreate}
              className="community2-primary-action"
            >
              <Plus size={17} />
              Crear comunidad
            </button>
          )}
        </header>

        <div className="community2-navigation">
          <div className="community2-tabs">
            <button
              type="button"
              data-active={
                mode === "discover" ? "true" : "false"
              }
              onClick={() => setMode("discover")}
            >
              Descubrir
            </button>

            <button
              type="button"
              data-active={
                mode === "mine" ? "true" : "false"
              }
              onClick={() => setMode("mine")}
            >
              Mis comunidades
            </button>
          </div>

          <label className="community2-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar comunidad"
            />
          </label>
        </div>

        {loading ? (
          <ListLoadingSkeleton rows={5} />
        ) : filtered.length === 0 ? (
          <section className="community2-empty">
            <Users size={25} />
            <strong>
              {mode === "mine"
                ? "Aún no estás en ninguna comunidad."
                : "No encontramos comunidades."}
            </strong>

          </section>
        ) : (
          <section className="community2-list">
            {filtered.map((community: any) => {
              const membership = memberMap.get(
                community.id
              );

              const context =
                community.institution ||
                community.career ||
                community.city ||
                "Comunidad Alumni";

              return (
                <Link
                  key={community.id}
                  href={`/community/${community.slug}`}
                  className="community2-row"
                >
                  <span className="community2-mark">
                    {community.name
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>

                  <span className="community2-row-main">
                    <span className="community2-row-kicker">
                      {CATEGORY_LABELS[
                        community.category
                      ] || "Comunidad"}

                      {community.visibility ===
                        "private" && (
                        <>
                          {" · "}
                          <Lock size={10} />
                          Privada
                        </>
                      )}
                    </span>

                    <strong>
                      {community.name}
                    </strong>

                    <small>
                      {context}

                      {membership?.status ===
                      "active"
                        ? ` · ${
                            membership.role ===
                            "owner"
                              ? "Tu comunidad"
                              : membership.role ===
                                "moderator"
                              ? "Moderador"
                              : "Miembro"
                          }`
                        : membership?.status ===
                          "pending"
                        ? " · Solicitud pendiente"
                        : ""}
                    </small>
                  </span>

                  <ChevronRight size={17} />
                </Link>
              );
            })}
          </section>
        )}

        <AnimatePresence>
          {createOpen && (
            <motion.div
              className="community2-editor-backdrop community2-wizard-backdrop"
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
                className="community2-editor community2-wizard"
                role="dialog"
                aria-modal="true"
                aria-label="Crear comunidad"
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
                <header className="community2-editor-header community2-wizard-header">
                  <motion.button
                    type="button"
                    className="community2-editor-back"
                    onClick={closeCreate}
                    disabled={creating}
                    aria-label="Cerrar creador de comunidad"
                    whileTap={
                      reduceMotion
                        ? undefined
                        : { scale: 0.92 }
                    }
                  >
                    <X size={18} />
                  </motion.button>

                  <div>
                    <h2>Crear comunidad</h2>
                    <small>
                      {createStep === 1
                        ? "Identidad"
                        : createStep === 2
                        ? "Contexto"
                        : "Acceso"}
                    </small>
                  </div>

                  <span className="community2-editor-progress">
                    {createStep} de 3
                  </span>
                </header>

                <div
                  className="community2-wizard-progress"
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

                <div className="community2-editor-body community2-wizard-body">
                  <AnimatePresence
                    mode="wait"
                    initial={false}
                  >
                    <motion.section
                      key={createStep}
                      className="community2-wizard-step"
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
                          <div className="community2-wizard-intro">
                            <span className="community2-wizard-intro-icon">
                              <Sparkles size={18} />
                            </span>
                            <div>
                              <strong>Dale identidad</strong>
                              <small>
                                Un nombre claro ayuda a que las personas sepan dónde pertenecen.
                              </small>
                            </div>
                          </div>

                          <div className="community2-fields community2-wizard-fields">
                            <label className="community2-field community2-field-large">
                              <span>Nombre</span>
                              <input
                                value={form.name}
                                maxLength={70}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    name: event.target.value,
                                  }))
                                }
                                placeholder="Ej. Graduados UES 2024"
                                autoFocus
                              />
                              <small>
                                {form.name.length}/70
                              </small>
                            </label>

                            <label className="community2-field">
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
                                placeholder="¿Qué une a las personas de este espacio?"
                              />
                            </label>
                          </div>
                        </>
                      )}

                      {createStep === 2 && (
                        <>
                          <div className="community2-wizard-intro">
                            <span className="community2-wizard-intro-icon">
                              <Users size={18} />
                            </span>
                            <div>
                              <strong>Ayuda a encontrarla</strong>
                              <small>
                                Elegí una categoría y agrega contexto solo si aporta valor.
                              </small>
                            </div>
                          </div>

                          <div className="community2-fields community2-wizard-fields">
                            <div className="community2-category-list community2-wizard-category-list">
                              {CATEGORIES.map(
                                ({
                                  id,
                                  label,
                                  icon: Icon,
                                }) => (
                                  <motion.button
                                    key={id}
                                    type="button"
                                    data-active={
                                      form.category === id
                                        ? "true"
                                        : "false"
                                    }
                                    onClick={() =>
                                      setForm((current) => ({
                                        ...current,
                                        category: id,
                                      }))
                                    }
                                    whileTap={
                                      reduceMotion
                                        ? undefined
                                        : { scale: 0.97 }
                                    }
                                  >
                                    <Icon size={17} />
                                    <span>
                                      <strong>{label}</strong>
                                    </span>

                                    {form.category === id && (
                                      <Check
                                        size={13}
                                        className="community2-wizard-choice-check"
                                      />
                                    )}
                                  </motion.button>
                                )
                              )}
                            </div>

                            <div className="community2-context-fields community2-wizard-context">
                              <label className="community2-field">
                                <span>Universidad · opcional</span>
                                <input
                                  value={form.institution}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      institution:
                                        event.target.value,
                                    }))
                                  }
                                  placeholder="Nombre de la institución"
                                />
                              </label>

                              <label className="community2-field">
                                <span>Carrera · opcional</span>
                                <input
                                  value={form.career}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      career:
                                        event.target.value,
                                    }))
                                  }
                                  placeholder="Carrera o programa"
                                />
                              </label>

                              <label className="community2-field">
                                <span>Ciudad · opcional</span>
                                <input
                                  value={form.city}
                                  onChange={(event) =>
                                    setForm((current) => ({
                                      ...current,
                                      city:
                                        event.target.value,
                                    }))
                                  }
                                  placeholder="Ciudad principal"
                                />
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      {createStep === 3 && (
                        <>
                          <div className="community2-wizard-intro">
                            <span className="community2-wizard-intro-icon">
                              <Globe2 size={18} />
                            </span>
                            <div>
                              <strong>Elegí cómo se une la gente</strong>
                              <small>
                                Podés dejarla abierta o aprobar cada solicitud.
                              </small>
                            </div>
                          </div>

                          <div className="community2-fields community2-wizard-fields">
                            <div className="community2-access-list community2-wizard-access-list">
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
                                  <strong>Pública</strong>
                                  <small>
                                    Cualquiera puede verla y unirse.
                                  </small>
                                </span>
                              </motion.button>

                              <motion.button
                                type="button"
                                data-active={
                                  form.visibility === "private"
                                    ? "true"
                                    : "false"
                                }
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    visibility: "private",
                                  }))
                                }
                                whileTap={
                                  reduceMotion
                                    ? undefined
                                    : { scale: 0.985 }
                                }
                              >
                                <Lock size={19} />
                                <span>
                                  <strong>Privada</strong>
                                  <small>
                                    Tú apruebas quién entra.
                                  </small>
                                </span>
                              </motion.button>
                            </div>

                            <div className="community2-wizard-preview">
                              <span className="community2-wizard-preview-mark">
                                {(form.name || "A")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </span>

                              <span className="community2-wizard-preview-copy">
                                <small>
                                  {CATEGORY_LABELS[
                                    form.category
                                  ] || "Comunidad"}
                                </small>
                                <strong>
                                  {form.name ||
                                    "Nueva comunidad"}
                                </strong>
                                <span>
                                  {form.institution ||
                                    form.career ||
                                    form.city ||
                                    "Comunidad ALUMNI"}
                                  {" · "}
                                  {form.visibility ===
                                  "private"
                                    ? "Privada"
                                    : "Pública"}
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

                <footer className="community2-editor-footer community2-wizard-footer">
                  <div className="community2-wizard-footer-state">
                    <span>
                      Paso {createStep} de 3
                    </span>
                    <strong>
                      {createStep === 1
                        ? currentStepReady
                          ? "Buen comienzo"
                          : "Usa al menos 3 letras"
                        : createStep === 2
                        ? "Contexto listo"
                        : "Listo para crear"}
                    </strong>
                  </div>

                  <div className="community2-wizard-actions">
                    {createStep > 1 && (
                      <motion.button
                        type="button"
                        className="community2-wizard-secondary"
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
                        className="community2-wizard-primary"
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
                        className="community2-wizard-primary"
                        disabled={
                          creating ||
                          form.name.trim().length < 3
                        }
                        onClick={() =>
                          void createCommunity()
                        }
                        whileTap={
                          reduceMotion ||
                          creating
                            ? undefined
                            : { scale: 0.97 }
                        }
                      >
                        {creating && (
                          <span
                            className="community2-wizard-spinner"
                            aria-hidden="true"
                          />
                        )}
                        {creating
                          ? "Creando..."
                          : "Crear comunidad"}
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

/* ALUMNI_2_1_5_COMMUNITIES_EDITORIAL_REDESIGN */

/* ALUMNI_2_7_0_LOADING_STATES:COMMUNITY */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */

/* ALUMNI_MICRO_IMPROVEMENTS_BLOCK_5:COMMUNITY_HOME */

/* ALUMNI_COMMUNITIES_MOBILE_PRO_4_0 */

/* ALUMNI_EVENTS_COMMUNITIES_STYLE_CONSOLIDATION_4_1:COMMUNITY:MAIN */

/* ALUMNI_CREATE_EXPERIENCE_PRO_5_0:COMMUNITIES */
