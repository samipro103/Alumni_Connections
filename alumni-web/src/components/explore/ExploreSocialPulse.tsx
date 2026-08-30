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
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import styles from "./ExploreSocialPulse.module.css";

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
  return String(name || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "A";
}

async function signMedia(
  bucket: string,
  path?: string | null
) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 30);

  return error ? null : data?.signedUrl || null;
}

async function uploadMedia(
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

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600",
    });

  if (error) throw error;

  return path;
}

export default function ExploreSocialPulse() {
  const { user } = useAuth();
  const [radar, setRadar] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [passportHighlights, setPassportHighlights] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: "restaurant",
    title: "",
    subtitle: "",
    description: "",
    location_text: "",
    external_url: "",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void load();
  }, [user?.id]);

  useEffect(() => {
    if (!recommendOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [recommendOpen]);

  async function load() {
    if (!user?.id) return;

    const [
      myProfileResult,
      profilesResult,
      followsResult,
      myMembershipsResult,
      recsResult,
      passportResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,university,career,city")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id,username,full_name,avatar_url,university,career,city,is_private")
        .neq("id", user.id)
        .limit(80),
      supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id),
      supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id)
        .eq("status", "active"),
      supabase
        .from("friend_recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24),
      supabase
        .from("passport_countries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const me = myProfileResult.data;
    const following = (followsResult.data || []).map(
      (row: any) => row.following_id
    );

    const communityIds = (
      myMembershipsResult.data || []
    ).map((row: any) => row.community_id);

    const sharedRows = communityIds.length
      ? await supabase
          .from("community_members")
          .select("community_id,user_id")
          .in("community_id", communityIds)
          .eq("status", "active")
      : { data: [] as any[] };

    const candidates = (profilesResult.data || [])
      .filter(
        (profile: any) =>
          !following.includes(profile.id)
      )
      .map((profile: any) => {
        const reasons: string[] = [];
        let score = 0;

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

        const sharedCount = (
          sharedRows.data || []
        ).filter(
          (row: any) => row.user_id === profile.id
        ).length;

        if (sharedCount) {
          score += Math.min(3, sharedCount);
          reasons.push(
            `${sharedCount} comunidad${
              sharedCount === 1 ? "" : "es"
            } en común`
          );
        }

        return { ...profile, score, reasons };
      })
      .filter((profile: any) => profile.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 8);

    const actorIds = Array.from(
      new Set([
        ...(recsResult.data || []).map(
          (row: any) => row.user_id
        ),
        ...(passportResult.data || []).map(
          (row: any) => row.user_id
        ),
      ])
    );

    const actors = actorIds.length
      ? await supabase
          .from("profiles")
          .select("id,username,full_name,avatar_url")
          .in("id", actorIds)
      : { data: [] as any[] };

    const actorMap = new Map(
      (actors.data || []).map((row: any) => [
        row.id,
        row,
      ])
    );

    const hydratedRecommendations = await Promise.all(
      (recsResult.data || []).map(async (row: any) => ({
        ...row,
        profile: actorMap.get(row.user_id) || null,
        cover_url: await signMedia(
          "recommendation-media",
          row.cover_media_path
        ),
      }))
    );

    const hydratedPassport = await Promise.all(
      (passportResult.data || []).map(async (row: any) => ({
        ...row,
        profile: actorMap.get(row.user_id) || null,
        cover_url: await signMedia(
          "passport-media",
          row.cover_media_path
        ),
      }))
    );

    setFollowingIds(following);
    setRadar(candidates);
    setRecommendations(hydratedRecommendations);
    setPassportHighlights(hydratedPassport);
  }

  async function follow(person: any) {
    if (!user?.id) return;

    if (person.is_private) {
      const { error } = await supabase
        .from("follow_requests")
        .insert({
          requester_id: user.id,
          target_id: person.id,
        });

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: person.id,
        });

      if (error) {
        alert(error.message);
        return;
      }

      setFollowingIds((current) => [
        ...current,
        person.id,
      ]);
    }

    setRadar((current) =>
      current.filter((item) => item.id !== person.id)
    );
  }

  async function publishRecommendation() {
    if (
      !user?.id ||
      saving ||
      !form.title.trim()
    ) {
      return;
    }

    setSaving(true);

    try {
      const mediaPath = file
        ? await uploadMedia(
            "recommendation-media",
            file,
            user.id,
            "recommendations"
          )
        : null;

      const { error } = await supabase
        .from("friend_recommendations")
        .insert({
          user_id: user.id,
          category: form.category,
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          description: form.description.trim() || null,
          location_text: form.location_text.trim() || null,
          external_url: form.external_url.trim() || null,
          cover_media_path: mediaPath,
        });

      if (error) throw error;

      setForm({
        category: "restaurant",
        title: "",
        subtitle: "",
        description: "",
        location_text: "",
        external_url: "",
      });
      setFile(null);
      setRecommendOpen(false);
      await load();
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo publicar la recomendación."
      );
    } finally {
      setSaving(false);
    }
  }

  const visibleRecommendations = useMemo(
    () =>
      recommendations.filter(
        (item: any) =>
          category === "all" ||
          item.category === category
      ),
    [recommendations, category]
  );

  if (!user) return null;

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <h2>Radar Alumni</h2>
          </div>
        </header>

        {radar.length > 0 ? (
          <div className={styles.radarGrid}>
            {radar.map((person: any) => (
              <article
                key={person.id}
                className={styles.radarItem}
              >
                <Link
                  href={`/u/${person.username || ""}`}
                  className={styles.personHead}
                >
                  <span className={styles.avatar}>
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                      />
                    ) : (
                      initials(
                        person.full_name ||
                          person.username
                      )
                    )}
                  </span>

                  <span className={styles.personIdentity}>
                    <strong>
                      {person.full_name ||
                        `@${person.username}`}
                    </strong>
                    <small>
                      @{person.username || "alumni"}
                    </small>
                  </span>
                </Link>

                <p className={styles.personContext}>
                  {[
                    person.career,
                    person.university,
                    person.city,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Comunidad Alumni"}
                </p>

                <div className={styles.reasons}>
                  {person.reasons
                    .slice(0, 3)
                    .map((reason: string) => (
                      <span key={reason}>{reason}</span>
                    ))}
                </div>

                <div className={styles.personActions}>
                  <Link
                    href={`/u/${person.username || ""}`}
                  >
                    Ver perfil
                  </Link>
                  <button
                    type="button"
                    onClick={() => void follow(person)}
                  >
                    {person.is_private
                      ? "Solicitar"
                      : "Seguir"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            Sin sugerencias por ahora.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <h2>Recomendaciones entre amigos</h2>
          </div>

          <button
            type="button"
            onClick={() => setRecommendOpen(true)}
          >
            <Plus size={15} />
            Recomendar
          </button>
        </header>

        <div className={styles.filters}>
          {CATEGORIES.map(
            ({ id, label, icon: Icon }) => (
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

        {visibleRecommendations.length > 0 ? (
          <div className={styles.recommendGrid}>
            {visibleRecommendations
              .slice(0, 8)
              .map((item: any) => (
                <article
                  key={item.id}
                  className={styles.recommendItem}
                >
                  <div className={styles.recommendMedia}>
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt={item.title}
                      />
                    ) : (
                      <span>
                        {(() => {
                          const entry = CATEGORIES.find(
                            (option) =>
                              option.id === item.category
                          );
                          const Icon =
                            entry?.icon || Sparkles;
                          return <Icon size={26} />;
                        })()}
                      </span>
                    )}
                  </div>

                  <div className={styles.recommendCopy}>
                    <small>
                      Recomendado por{" "}
                      <b>
                        {item.profile?.full_name ||
                          `@${item.profile?.username ||
                            "alumni"}`}
                      </b>
                    </small>

                    <strong>{item.title}</strong>

                    {item.subtitle && (
                      <p>{item.subtitle}</p>
                    )}

                    <div className={styles.recommendMeta}>
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
        ) : (
          <p className={styles.empty}>
            Aún no hay recomendaciones en esta categoría.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <div>
            <h2>Pasaporte Alumni</h2>
          </div>

          <Link href="/passport">
            <Globe2 size={15} />
            Abrir pasaporte
          </Link>
        </header>

        {passportHighlights.length > 0 ? (
          <div className={styles.passportStrip}>
            {passportHighlights
              .slice(0, 5)
              .map((country: any) => (
                <article
                  key={country.id}
                  className={`${styles.passportItem} ${
                    styles[
                      `theme_${country.theme_style || "aurora"}`
                    ]
                  }`}
                >
                  <div className={styles.passportMedia}>
                    {country.cover_url ? (
                      <img
                        src={country.cover_url}
                        alt={country.country_name}
                      />
                    ) : (
                      <Globe2 size={25} />
                    )}
                  </div>

                  <div className={styles.passportCopy}>
                    <span>
                      {country.profile?.full_name ||
                        country.profile?.username ||
                        "Alumni"}
                    </span>
                    <strong>
                      {country.country_name}
                    </strong>
                    <small>
                      {country.note ||
                        "Un recuerdo guardado en Alumni"}
                    </small>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <p className={styles.empty}>
            Aún no hay países.
          </p>
        )}
      </section>

      {recommendOpen && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRecommendOpen(false);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <h3>Nueva recomendación</h3>
              </div>

              <button
                type="button"
                onClick={() => setRecommendOpen(false)}
              >
                Cerrar
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.filters}>
                {CATEGORIES.filter(
                  (item) => item.id !== "all"
                ).map(({ id, label, icon: Icon }) => (
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
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              <label className={styles.field}>
                <span>Título</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ej. El café que siempre recomiendo"
                />
              </label>

              <label className={styles.field}>
                <span>Por qué</span>
                <input
                  value={form.subtitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      subtitle: event.target.value,
                    }))
                  }
                  placeholder="Una razón corta"
                />
              </label>

              <label className={styles.field}>
                <span>Comentario</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Cuéntale a tu red por qué vale la pena."
                />
              </label>

              <div className={styles.twoColumns}>
                <label className={styles.field}>
                  <span>Lugar</span>
                  <input
                    value={form.location_text}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location_text: event.target.value,
                      }))
                    }
                    placeholder="Ciudad o zona"
                  />
                </label>

                <label className={styles.field}>
                  <span>Enlace</span>
                  <input
                    value={form.external_url}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        external_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Foto opcional</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            <footer>
              <button
                type="button"
                disabled={
                  saving || !form.title.trim()
                }
                onClick={() =>
                  void publishRecommendation()
                }
              >
                {saving
                  ? "Publicando..."
                  : "Publicar recomendación"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

/* ALUMNI_2_2_0_FIX1_EXPLORE_SOCIAL_PULSE */

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */
