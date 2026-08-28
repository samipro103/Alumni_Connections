"use client";

import {
  ArrowLeft,
  BookOpen,
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
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { ListLoadingSkeleton } from "@/components/ui/AlumniLoading";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./community-2.css";

const CATEGORIES = [
  {
    id: "general",
    label: "General",
    description: "Un espacio abierto alrededor de un tema.",
    icon: Users,
  },
  {
    id: "university",
    label: "Universidad",
    description: "Personas de la misma institución.",
    icon: GraduationCap,
  },
  {
    id: "career",
    label: "Carrera",
    description: "Una carrera, facultad o programa.",
    icon: BookOpen,
  },
  {
    id: "generation",
    label: "Generación",
    description: "Una promoción o año compartido.",
    icon: CalendarDays,
  },
  {
    id: "city",
    label: "Ciudad",
    description: "Personas conectadas por un lugar.",
    icon: MapPin,
  },
  {
    id: "interest",
    label: "Interés",
    description: "Un hobby, causa o tema en común.",
    icon: Sparkles,
  },
] as const;

const CATEGORY_LABELS = Object.fromEntries(
  CATEGORIES.map((item) => [item.id, item.label])
);

export default function CommunityPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"discover" | "mine">("discover");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
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

  function closeCreate() {
    if (creating) return;
    setCreateOpen(false);
  }

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
      <main className="alumni-community-2 mx-auto w-full max-w-[920px]">
        <header className="community2-hero">
          <div>
            <span className="community2-eyebrow">
              Comunidades
            </span>
            <h1>Encuentra donde perteneces.</h1>
            <p>
              Universidad, carrera, generación, ciudad o intereses:
              crea un lugar donde la conversación tenga contexto.
            </p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
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
            <p>
              {mode === "mine"
                ? "Únete a una o crea tu propio espacio."
                : "Prueba otra búsqueda o crea la primera."}
            </p>
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

        {createOpen && (
          <div
            className="community2-editor-backdrop"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget
              ) {
                closeCreate();
              }
            }}
          >
            <section
              className="community2-editor"
              role="dialog"
              aria-modal="true"
              aria-label="Crear comunidad"
            >
              <header className="community2-editor-header">
                <button
                  type="button"
                  className="community2-editor-back"
                  onClick={closeCreate}
                  disabled={creating}
                >
                  <ArrowLeft size={17} />
                  Volver
                </button>

                <div>
                  <span>Nueva comunidad</span>
                  <h2>Dale un lugar a algo que ya los une.</h2>
                  <p>
                    Define la idea, el contexto y quién puede entrar.
                  </p>
                </div>

                <span className="community2-editor-progress">
                  3 pasos
                </span>
              </header>

              <div className="community2-editor-body">
                <section className="community2-editor-section">
                  <div className="community2-step">
                    <strong>01</strong>
                    <span>
                      <b>Identidad</b>
                      <small>Cómo se reconocerá</small>
                    </span>
                  </div>

                  <div className="community2-fields">
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
                      <small>{form.name.length}/70</small>
                    </label>

                    <label className="community2-field">
                      <span>Descripción</span>
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
                        placeholder="Explica en una frase qué une a las personas de este espacio."
                      />
                    </label>
                  </div>
                </section>

                <section className="community2-editor-section">
                  <div className="community2-step">
                    <strong>02</strong>
                    <span>
                      <b>Contexto</b>
                      <small>Qué tienen en común</small>
                    </span>
                  </div>

                  <div className="community2-fields">
                    <div className="community2-category-list">
                      {CATEGORIES.map(
                        ({
                          id,
                          label,
                          description,
                          icon: Icon,
                        }) => (
                          <button
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
                          >
                            <Icon size={17} />
                            <span>
                              <strong>{label}</strong>
                              <small>
                                {description}
                              </small>
                            </span>
                          </button>
                        )
                      )}
                    </div>

                    <div className="community2-context-fields">
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
                </section>

                <section className="community2-editor-section">
                  <div className="community2-step">
                    <strong>03</strong>
                    <span>
                      <b>Acceso</b>
                      <small>Quién puede entrar</small>
                    </span>
                  </div>

                  <div className="community2-fields">
                    <div className="community2-access-list">
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
                          }))
                        }
                      >
                        <Globe2 size={18} />
                        <span>
                          <strong>Pública</strong>
                          <small>
                            Cualquiera puede verla y unirse.
                          </small>
                        </span>
                      </button>

                      <button
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
                      >
                        <Lock size={18} />
                        <span>
                          <strong>Privada</strong>
                          <small>
                            Las solicitudes deben aprobarse.
                          </small>
                        </span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <footer className="community2-editor-footer">
                <span>
                  {form.name.trim().length < 3
                    ? "El nombre necesita al menos 3 caracteres."
                    : "Todo listo para crear tu comunidad."}
                </span>

                <button
                  type="button"
                  disabled={
                    creating ||
                    form.name.trim().length < 3
                  }
                  onClick={() =>
                    void createCommunity()
                  }
                >
                  {creating
                    ? "Creando..."
                    : "Crear comunidad"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_5_COMMUNITIES_EDITORIAL_REDESIGN */

/* ALUMNI_2_7_0_LOADING_STATES:COMMUNITY */
