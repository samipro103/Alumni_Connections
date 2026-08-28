"use client";

import {
  Compass,
  Film,
  ForkKnife,
  Globe2,
  HeartHandshake,
  MapPinned,
  Music4,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import "./explore-2.css";

const CATEGORIES = [
  { id: "all", label: "Todo", icon: Sparkles },
  { id: "restaurant", label: "Restaurantes", icon: ForkKnife },
  { id: "place", label: "Lugares", icon: MapPinned },
  { id: "movie", label: "Películas", icon: Film },
  { id: "trip", label: "Viajes", icon: Compass },
  { id: "music", label: "Música", icon: Music4 },
] as const;

function clean(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function same(a?: string | null, b?: string | null) {
  const left = clean(a);
  const right = clean(b);
  return Boolean(left && right && left === right);
}

function initials(name?: string | null) {
  const text = String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("");

  return (text || "?").toUpperCase();
}

function timeAgo(date?: string | null) {
  if (!date) return "Ahora";

  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));

  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;

  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

async function uploadImage(
  bucket: string,
  file: File,
  userId: string,
  folder: string
) {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path =
    `${userId}/${folder}/` +
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

  const upload = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (upload.error) {
    throw upload.error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

export default function ExplorePage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [radar, setRadar] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [passportHighlights, setPassportHighlights] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [savingRecommendation, setSavingRecommendation] = useState(false);
  const [recommendationForm, setRecommendationForm] = useState({
    category: "restaurant",
    title: "",
    subtitle: "",
    description: "",
    location_text: "",
    external_url: "",
  });
  const [recommendationFile, setRecommendationFile] =
    useState<File | null>(null);

  useEffect(() => {
    void loadEverything();
  }, [user?.id]);

  useEffect(() => {
    if (!recommendOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [recommendOpen]);

  async function loadEverything() {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const meResult = await supabase
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url,university,career,city"
        )
        .eq("id", user.id)
        .maybeSingle();

      const me = meResult.data || null;

      const followingResult = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const myFollowingIds = (
        followingResult.data || []
      ).map((row: any) => row.following_id);

      const allProfilesResult = await supabase
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url,university,career,city,bio"
        )
        .neq("id", user.id)
        .limit(90);

      const myMembershipResult = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id)
        .eq("status", "active");

      const myCommunityIds = (
        myMembershipResult.data || []
      ).map((row: any) => row.community_id);

      const sharedMembershipRows =
        myCommunityIds.length > 0
          ? await supabase
              .from("community_members")
              .select("user_id,community_id")
              .in("community_id", myCommunityIds)
              .eq("status", "active")
          : { data: [] as any[] };

      const recommendationRows = await supabase
        .from("friend_recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);

      const passportRows = await supabase
        .from("passport_countries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(18);

      const radarCandidates = (allProfilesResult.data || [])
        .filter(
          (profile: any) =>
            !myFollowingIds.includes(profile.id)
        )
        .map((profile: any) => {
          let score = 0;
          const reasons: string[] = [];
          const sharedCount = (
            sharedMembershipRows.data || []
          ).filter(
            (row: any) => row.user_id === profile.id
          ).length;

          if (same(me?.university, profile.university)) {
            score += 4;
            reasons.push("Misma universidad");
          }

          if (same(me?.career, profile.career)) {
            score += 3;
            reasons.push("Misma carrera");
          }

          if (same(me?.city, profile.city)) {
            score += 2;
            reasons.push("Misma ciudad");
          }

          if (sharedCount > 0) {
            score += Math.min(3, sharedCount);
            reasons.push(
              `${sharedCount} comunidad${
                sharedCount === 1 ? "" : "es"
              } en común`
            );
          }

          return {
            ...profile,
            score,
            reasons,
          };
        })
        .filter((profile: any) => profile.score > 0)
        .sort(
          (a: any, b: any) =>
            b.score - a.score ||
            (a.full_name || "").localeCompare(
              b.full_name || ""
            )
        )
        .slice(0, 12);

      const allActorIds = Array.from(
        new Set([
          ...((recommendationRows.data || []).map(
            (row: any) => row.user_id
          ) || []),
          ...((passportRows.data || []).map(
            (row: any) => row.user_id
          ) || []),
        ])
      );

      const actorProfiles = allActorIds.length
        ? await supabase
            .from("profiles")
            .select("id,username,full_name,avatar_url")
            .in("id", allActorIds)
        : { data: [] as any[] };

      const actorMap = new Map(
        (actorProfiles.data || []).map((row: any) => [
          row.id,
          row,
        ])
      );

      setFollowingIds(myFollowingIds);
      setRadar(radarCandidates);

      setRecommendations(
        (recommendationRows.data || []).map((row: any) => ({
          ...row,
          profile: actorMap.get(row.user_id) || null,
        }))
      );

      setPassportHighlights(
        (passportRows.data || []).map((row: any) => ({
          ...row,
          profile: actorMap.get(row.user_id) || null,
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function followPerson(targetId: string) {
    if (!user?.id) return;

    const { error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: targetId,
      });

    if (error) {
      alert(error.message);
      return;
    }

    await loadEverything();
  }

  async function publishRecommendation() {
    if (!user?.id || savingRecommendation) return;
    if (!recommendationForm.title.trim()) {
      alert("Escribe un título.");
      return;
    }

    setSavingRecommendation(true);

    try {
      let coverImageUrl: string | null = null;

      if (recommendationFile) {
        coverImageUrl = await uploadImage(
          "recommendation-media",
          recommendationFile,
          user.id,
          "recommendations"
        );
      }

      const { error } = await supabase
        .from("friend_recommendations")
        .insert({
          user_id: user.id,
          category: recommendationForm.category,
          title: recommendationForm.title.trim(),
          subtitle:
            recommendationForm.subtitle.trim() || null,
          description:
            recommendationForm.description.trim() || null,
          location_text:
            recommendationForm.location_text.trim() || null,
          external_url:
            recommendationForm.external_url.trim() || null,
          cover_image_url: coverImageUrl,
        });

      if (error) {
        throw error;
      }

      setRecommendationForm({
        category: "restaurant",
        title: "",
        subtitle: "",
        description: "",
        location_text: "",
        external_url: "",
      });
      setRecommendationFile(null);
      setRecommendOpen(false);

      await loadEverything();
    } catch (error: any) {
      alert(error?.message || "No se pudo publicar.");
    } finally {
      setSavingRecommendation(false);
    }
  }

  const filteredRecommendations = useMemo(() => {
    const value = query.trim().toLowerCase();

    return recommendations.filter((item: any) => {
      if (
        category !== "all" &&
        item.category !== category
      ) {
        return false;
      }

      if (!value) return true;

      return [
        item.title,
        item.subtitle,
        item.description,
        item.location_text,
        item.profile?.username,
        item.profile?.full_name,
      ]
        .filter(Boolean)
        .some((part) =>
          String(part).toLowerCase().includes(value)
        );
    });
  }, [recommendations, query, category]);

  return (
    <AppShell>
      <main className="alumni-explore-2 mx-auto w-full max-w-[980px]">
        <header className="explore2-hero">
          <div>
            <span className="explore2-eyebrow">
              Descubrir
            </span>
            <h1>
              Descubre personas, lugares e historias que sí te
              importan.
            </h1>
            <p>
              Alumni ahora mezcla conexiones con contexto,
              recomendaciones reales entre amigos y un pasaporte
              visual para tus viajes.
            </p>
          </div>

          <div className="explore2-hero-actions">
            <button
              type="button"
              onClick={() => setRecommendOpen(true)}
            >
              <Plus size={16} />
              Recomendar algo
            </button>

            <Link href="/passport">
              <Globe2 size={16} />
              Abrir pasaporte
            </Link>
          </div>
        </header>

        <section className="explore2-radar-section">
          <div className="explore2-section-title">
            <div>
              <span>Radar Alumni</span>
              <h2>Personas con las que probablemente conectes.</h2>
            </div>
          </div>

          {loading ? (
            <p className="explore2-state">Cargando radar...</p>
          ) : radar.length === 0 ? (
            <div className="explore2-empty">
              <Users size={26} />
              <strong>Tu radar todavía está aprendiendo.</strong>
              <p>
                Mientras completas tu perfil y te unes a más
                comunidades, Alumni te recomendará mejores
                conexiones.
              </p>
            </div>
          ) : (
            <div className="explore2-radar-grid">
              {radar.map((person: any) => (
                <article
                  key={person.id}
                  className="explore2-radar-card"
                >
                  <div className="explore2-radar-head">
                    <div className="explore2-avatar">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.full_name || person.username}
                        />
                      ) : (
                        <span>
                          {initials(
                            person.full_name || person.username
                          )}
                        </span>
                      )}
                    </div>

                    <div className="explore2-radar-identity">
                      <strong>
                        {person.full_name || person.username}
                      </strong>
                      <span>@{person.username || "alumni"}</span>
                    </div>
                  </div>

                  <div className="explore2-radar-copy">
                    <p>
                      {[person.career, person.university, person.city]
                        .filter(Boolean)
                        .join(" · ") || "Comunidad Alumni"}
                    </p>
                  </div>

                  <div className="explore2-radar-reasons">
                    {person.reasons
                      .slice(0, 3)
                      .map((reason: string) => (
                        <span key={reason}>{reason}</span>
                      ))}
                  </div>

                  <div className="explore2-radar-actions">
                    <Link href={`/${person.username || ""}`}>
                      Ver perfil
                    </Link>

                    <button
                      type="button"
                      onClick={() => void followPerson(person.id)}
                    >
                      Seguir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="explore2-recommend-section">
          <div className="explore2-section-title">
            <div>
              <span>Recomendaciones entre amigos</span>
              <h2>
                Restaurantes, lugares, películas, viajes y música con
                criterio humano.
              </h2>
            </div>
          </div>

          <div className="explore2-toolbar">
            <label className="explore2-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Buscar recomendaciones"
              />
            </label>

            <div className="explore2-category-row">
              {CATEGORIES.map(
                ({
                  id,
                  label,
                  icon: Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    data-active={
                      category === id ? "true" : "false"
                    }
                    onClick={() => setCategory(id)}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {loading ? (
            <p className="explore2-state">
              Cargando recomendaciones...
            </p>
          ) : filteredRecommendations.length === 0 ? (
            <div className="explore2-empty">
              <HeartHandshake size={26} />
              <strong>No encontramos recomendaciones aquí.</strong>
              <p>
                Publica la primera y empieza a construir el mapa de
                confianza de Alumni.
              </p>
            </div>
          ) : (
            <div className="explore2-recommend-grid">
              {filteredRecommendations.map((item: any) => (
                <article
                  key={item.id}
                  className="explore2-recommend-card"
                >
                  <div className="explore2-recommend-cover">
                    {item.cover_image_url ? (
                      <img
                        src={item.cover_image_url}
                        alt={item.title}
                      />
                    ) : (
                      <div className="explore2-cover-fallback">
                        {(() => {
                          const entry = CATEGORIES.find(
                            (option) =>
                              option.id === item.category
                          );

                          const Icon = entry?.icon || Sparkles;
                          return <Icon size={28} />;
                        })()}
                      </div>
                    )}

                    <span>
                      {(CATEGORIES.find(
                        (entry) =>
                          entry.id === item.category
                      ) || { label: "Recomendación" }).label}
                    </span>
                  </div>

                  <div className="explore2-recommend-body">
                    <div className="explore2-recommend-byline">
                      <div className="explore2-mini-avatar">
                        {item.profile?.avatar_url ? (
                          <img
                            src={item.profile.avatar_url}
                            alt={item.profile.full_name || item.profile.username}
                          />
                        ) : (
                          <span>
                            {initials(
                              item.profile?.full_name ||
                                item.profile?.username
                            )}
                          </span>
                        )}
                      </div>

                      <small>
                        Recomendado por{" "}
                        <b>
                          {item.profile?.full_name ||
                            `@${item.profile?.username || "alumni"}`}
                        </b>{" "}
                        · {timeAgo(item.created_at)}
                      </small>
                    </div>

                    <strong>{item.title}</strong>

                    {item.subtitle && (
                      <p className="explore2-recommend-subtitle">
                        {item.subtitle}
                      </p>
                    )}

                    {item.description && (
                      <p className="explore2-recommend-description">
                        {item.description}
                      </p>
                    )}

                    <div className="explore2-recommend-meta">
                      {item.location_text && (
                        <span>{item.location_text}</span>
                      )}

                      {item.external_url && (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver más
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="explore2-passport-section">
          <div className="explore2-section-title">
            <div>
              <span>Pasaporte Alumni</span>
              <h2>
                Cada país se convierte en un álbum vivo con diseño
                propio.
              </h2>
            </div>

            <Link href="/passport">Ver mi pasaporte</Link>
          </div>

          {loading ? (
            <p className="explore2-state">
              Cargando pasaportes...
            </p>
          ) : passportHighlights.length === 0 ? (
            <div className="explore2-empty">
              <Globe2 size={26} />
              <strong>Aún no hay países publicados.</strong>
              <p>
                Inicia tu pasaporte y guarda recuerdos de los lugares
                que has visitado.
              </p>
            </div>
          ) : (
            <div className="explore2-passport-strip">
              {passportHighlights.slice(0, 8).map((entry: any) => (
                <article
                  key={entry.id}
                  className={`explore2-stamp theme-${entry.theme_style || "aurora"}`}
                >
                  <div className="explore2-stamp-media">
                    {entry.cover_photo_url ? (
                      <img
                        src={entry.cover_photo_url}
                        alt={entry.country_name}
                      />
                    ) : (
                      <div className="explore2-stamp-fallback">
                        <Globe2 size={24} />
                      </div>
                    )}
                  </div>

                  <div className="explore2-stamp-copy">
                    <span>
                      {entry.profile?.full_name ||
                        entry.profile?.username ||
                        "Alumni"}
                    </span>
                    <strong>{entry.country_name}</strong>
                    <small>
                      {entry.note || "Un recuerdo guardado en Alumni"}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {recommendOpen && (
          <div
            className="explore2-modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setRecommendOpen(false);
              }
            }}
          >
            <section
              className="explore2-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Nueva recomendación"
            >
              <header className="explore2-modal-header">
                <div>
                  <span>Nueva recomendación</span>
                  <h3>Comparte algo que sí valga la pena.</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setRecommendOpen(false)}
                >
                  Cerrar
                </button>
              </header>

              <div className="explore2-modal-body">
                <div className="explore2-category-row explore2-category-row-modal">
                  {CATEGORIES.filter(
                    (item) => item.id !== "all"
                  ).map(
                    ({
                      id,
                      label,
                      icon: Icon,
                    }) => (
                      <button
                        key={id}
                        type="button"
                        data-active={
                          recommendationForm.category === id
                            ? "true"
                            : "false"
                        }
                        onClick={() =>
                          setRecommendationForm((current) => ({
                            ...current,
                            category: id,
                          }))
                        }
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    )
                  )}
                </div>

                <label className="explore2-field">
                  <span>Título</span>
                  <input
                    value={recommendationForm.title}
                    onChange={(event) =>
                      setRecommendationForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="Ej. Café que sí recomiendo en San Miguel"
                  />
                </label>

                <label className="explore2-field">
                  <span>Subtítulo</span>
                  <input
                    value={recommendationForm.subtitle}
                    onChange={(event) =>
                      setRecommendationForm((current) => ({
                        ...current,
                        subtitle: event.target.value,
                      }))
                    }
                    placeholder="Por qué te gustó en una frase"
                  />
                </label>

                <label className="explore2-field">
                  <span>Comentario</span>
                  <textarea
                    value={recommendationForm.description}
                    onChange={(event) =>
                      setRecommendationForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Cuéntale a tus amigos por qué lo recomiendas."
                  />
                </label>

                <div className="explore2-two-columns">
                  <label className="explore2-field">
                    <span>Lugar</span>
                    <input
                      value={recommendationForm.location_text}
                      onChange={(event) =>
                        setRecommendationForm((current) => ({
                          ...current,
                          location_text: event.target.value,
                        }))
                      }
                      placeholder="Ciudad, país o zona"
                    />
                  </label>

                  <label className="explore2-field">
                    <span>Enlace</span>
                    <input
                      value={recommendationForm.external_url}
                      onChange={(event) =>
                        setRecommendationForm((current) => ({
                          ...current,
                          external_url: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </label>
                </div>

                <label className="explore2-field">
                  <span>Foto de portada</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setRecommendationFile(
                        event.target.files?.[0] || null
                      )
                    }
                  />
                </label>
              </div>

              <footer className="explore2-modal-footer">
                <span>
                  Las mejores recomendaciones nacen de la confianza.
                </span>

                <button
                  type="button"
                  onClick={() => void publishRecommendation()}
                  disabled={
                    savingRecommendation ||
                    !recommendationForm.title.trim()
                  }
                >
                  {savingRecommendation
                    ? "Publicando..."
                    : "Publicar recomendación"}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </AppShell>
  );
}

/* ALUMNI_2_2_0_RADAR_PASSPORT_RECOMMENDATIONS */
