"use client";

import {
  ChevronRight,
  Lock,
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
import "./community-2.css";

const CATEGORY_LABELS: Record<string, string> = {
  university: "Universidad",
  career: "Carrera",
  generation: "Generación",
  city: "Ciudad",
  interest: "Interés",
  general: "General",
};

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
        members.map((row: any) => [row.community_id, row])
      ),
    [members]
  );

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    return communities.filter((community: any) => {
      const membership = memberMap.get(community.id);

      if (mode === "mine" && membership?.status !== "active") {
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

  async function createCommunity() {
    if (!user || creating || form.name.trim().length < 3) return;

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
        <header className="community2-header">
          <div>
            <span>Comunidades</span>
            <h1>Encuentra tu gente.</h1>
            <p>
              Espacios creados alrededor de universidades, carreras,
              generaciones, ciudades e intereses reales.
            </p>
          </div>

          {user && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="community2-create"
            >
              <Plus size={16} />
              Crear comunidad
            </button>
          )}
        </header>

        <div className="community2-toolbar">
          <div className="community2-tabs">
            <button
              type="button"
              data-active={mode === "discover" ? "true" : "false"}
              onClick={() => setMode("discover")}
            >
              Descubrir
            </button>
            <button
              type="button"
              data-active={mode === "mine" ? "true" : "false"}
              onClick={() => setMode("mine")}
            >
              Mis comunidades
            </button>
          </div>

          <label className="community2-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar comunidad..."
            />
          </label>
        </div>

        {loading ? (
          <p className="community2-state">Cargando comunidades...</p>
        ) : filtered.length === 0 ? (
          <p className="community2-state">
            {mode === "mine"
              ? "Todavía no perteneces a ninguna comunidad."
              : "No encontramos comunidades con ese filtro."}
          </p>
        ) : (
          <section className="community2-list">
            {filtered.map((community: any) => {
              const membership = memberMap.get(community.id);
              const context =
                community.institution ||
                community.career ||
                community.city ||
                CATEGORY_LABELS[community.category] ||
                "Comunidad Alumni";

              return (
                <Link
                  key={community.id}
                  href={`/community/${community.slug}`}
                  className="community2-row"
                >
                  <span className="community2-symbol">
                    {community.name.slice(0, 1).toUpperCase()}
                  </span>

                  <span className="community2-copy">
                    <span>
                      {CATEGORY_LABELS[community.category] || "Comunidad"}
                      {community.visibility === "private" && (
                        <>
                          {" · "}
                          <Lock size={10} />
                          privada
                        </>
                      )}
                    </span>
                    <strong>{community.name}</strong>
                    <small>
                      {context}
                      {membership?.status === "active"
                        ? ` · ${
                            membership.role === "owner"
                              ? "Tu comunidad"
                              : membership.role === "moderator"
                              ? "Moderador"
                              : "Miembro"
                          }`
                        : membership?.status === "pending"
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
            className="community2-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setCreateOpen(false);
            }}
          >
            <section className="community2-modal" role="dialog" aria-modal="true">
              <header>
                <div>
                  <span>Nueva comunidad</span>
                  <h2>Crea un espacio con propósito.</h2>
                </div>
                <button type="button" onClick={() => setCreateOpen(false)}>
                  <X size={18} />
                </button>
              </header>

              <div className="community2-form">
                <label>
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
                  />
                </label>

                <label>
                  <span>Descripción</span>
                  <textarea
                    value={form.description}
                    maxLength={700}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="¿Qué une a esta comunidad?"
                  />
                </label>

                <div className="community2-form-grid">
                  <label>
                    <span>Tipo</span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                    >
                      <option value="general">General</option>
                      <option value="university">Universidad</option>
                      <option value="career">Carrera</option>
                      <option value="generation">Generación</option>
                      <option value="city">Ciudad</option>
                      <option value="interest">Interés</option>
                    </select>
                  </label>

                  <label>
                    <span>Acceso</span>
                    <select
                      value={form.visibility}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          visibility: event.target.value,
                        }))
                      }
                    >
                      <option value="public">Pública</option>
                      <option value="private">Privada</option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Universidad / institución (opcional)</span>
                  <input
                    value={form.institution}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        institution: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Carrera (opcional)</span>
                  <input
                    value={form.career}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        career: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  <span>Ciudad (opcional)</span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        city: event.target.value,
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
                  disabled={creating || form.name.trim().length < 3}
                  onClick={() => void createCommunity()}
                >
                  {creating ? "Creando..." : "Crear comunidad"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_1_COMMUNITIES_HOME */
