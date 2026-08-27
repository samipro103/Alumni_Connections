"use client";

import {
  ArrowUpRight,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
  GraduationCap,
  Hash,
  MapPin,
  Music2,
  Pencil,
  Pin,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import styles from "./ProfileIdentityV2.module.css";

type Props = {
  profile: any;
  posts: any[];
  followers: number;
  following: number;
  own?: boolean;
};

type IdentitySettings = {
  current_kind?: string | null;
  current_text?: string | null;
  current_emoji?: string | null;
  current_visibility?: string;
  interests_visibility?: string;
  connections_visibility?: string;
};

type ConnectionMode =
  | "followers"
  | "following"
  | null;

function currentLabel(kind?: string | null) {
  switch (kind) {
    case "listening":
      return "Escuchando";
    case "learning":
      return "Aprendiendo";
    case "watching":
      return "Viendo";
    case "doing":
      return "Haciendo";
    case "thinking":
      return "Pensando en";
    default:
      return "Actualmente";
  }
}

function profileReason(profile: any) {
  return (
    profile.education_program_name ||
    profile.career ||
    profile.education_institution_name ||
    profile.university ||
    profile.city ||
    "Comunidad Alumni"
  );
}

export default function ProfileSocialIdentity({
  profile,
  posts,
  followers,
  following,
  own = false,
}: Props) {
  const [settings, setSettings] =
    useState<IdentitySettings | null>(null);
  const [interests, setInterests] =
    useState<any[]>([]);
  const [pinned, setPinned] =
    useState<any[]>([]);
  const [mutuals, setMutuals] =
    useState<any[]>([]);
  const [related, setRelated] =
    useState<any[]>([]);
  const [connectionMode, setConnectionMode] =
    useState<ConnectionMode>(null);
  const [connections, setConnections] =
    useState<any[]>([]);
  const [connectionQuery, setConnectionQuery] =
    useState("");
  const [connectionsLoading, setConnectionsLoading] =
    useState(false);
  const [followingIds, setFollowingIds] =
    useState<string[]>([]);
  const [busy, setBusy] =
    useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    let active = true;

    void (async () => {
      const [
        settingsResult,
        interestsResult,
        pinsResult,
        relatedResult,
        sessionResult,
      ] = await Promise.all([
        supabase
          .from("profile_identity_settings")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle(),
        supabase
          .from("profile_interests")
          .select("id,interest,sort_order")
          .eq("user_id", profile.id)
          .order("sort_order", { ascending: true })
          .order("id", { ascending: true }),
        supabase
          .from("profile_pinned_posts")
          .select("post_id,sort_order")
          .eq("user_id", profile.id)
          .order("sort_order", { ascending: true }),
        supabase.rpc(
          "alumni_related_profiles",
          {
            p_profile_id: profile.id,
            p_limit: 6,
          }
        ),
        supabase.auth.getSession(),
      ]);

      if (!active) return;

      setSettings(settingsResult.data || null);
      setInterests(interestsResult.data || []);

      const pins = pinsResult.data || [];
      const byId = new Map(
        (posts || []).map((post: any) => [
          Number(post.id),
          post,
        ])
      );

      setPinned(
        pins
          .map((pin: any) =>
            byId.get(Number(pin.post_id))
          )
          .filter(Boolean)
      );

      setRelated(relatedResult.data || []);

      const currentUserId =
        sessionResult.data.session?.user?.id;

      if (currentUserId) {
        const [{ data: follows }, mutualResult] =
          await Promise.all([
            supabase
              .from("follows")
              .select("following_id")
              .eq(
                "follower_id",
                currentUserId
              ),
            currentUserId === profile.id
              ? Promise.resolve({
                  data: [],
                } as any)
              : supabase.rpc(
                  "alumni_profile_mutuals",
                  {
                    p_profile_id: profile.id,
                    p_limit: 8,
                  }
                ),
          ]);

        if (!active) return;

        setFollowingIds(
          (follows || []).map(
            (row: any) => row.following_id
          )
        );
        setMutuals(mutualResult.data || []);
      } else {
        setFollowingIds([]);
        setMutuals([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [profile?.id, posts]);

  async function openConnections(
    mode: Exclude<ConnectionMode, null>
  ) {
    setConnectionMode(mode);
    setConnectionQuery("");
    await loadConnections(mode, "");
  }

  async function loadConnections(
    mode: Exclude<ConnectionMode, null>,
    query: string
  ) {
    if (!profile?.id) return;

    setConnectionsLoading(true);

    const { data } = await supabase.rpc(
      "alumni_profile_connections",
      {
        p_profile_id: profile.id,
        p_kind: mode,
        p_query: query,
        p_limit: 80,
      }
    );

    setConnections(data || []);
    setConnectionsLoading(false);
  }

  useEffect(() => {
    if (!connectionMode) return;

    const timer = window.setTimeout(() => {
      void loadConnections(
        connectionMode,
        connectionQuery
      );
    }, 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [connectionQuery, connectionMode]);

  async function followPerson(person: any) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    if (
      busy ||
      followingIds.includes(person.id) ||
      person.id === session.user.id
    ) {
      return;
    }

    setBusy(person.id);

    try {
      if (person.is_private) {
        const { error } = await supabase
          .from("follow_requests")
          .insert({
            requester_id: session.user.id,
            target_id: person.id,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: session.user.id,
            following_id: person.id,
          });

        if (error) throw error;

        setFollowingIds((current) => [
          ...current,
          person.id,
        ]);
      }
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo completar la acción."
      );
    } finally {
      setBusy(null);
    }
  }

  const currentVisible = Boolean(
    settings?.current_text
  );

  const interestsVisible =
    interests.length > 0;

  const hasIdentityContent =
    currentVisible ||
    interestsVisible ||
    mutuals.length > 0 ||
    related.length > 0 ||
    pinned.length > 0;

  const relatedFiltered = useMemo(
    () =>
      related.filter(
        (person) =>
          person.id !== profile.id
      ),
    [related, profile?.id]
  );

  if (!hasIdentityContent && own) {
    return (
      <section className={styles.emptyOwn}>
        <Sparkles size={20} />
        <div>
          <strong>
            Dale más identidad a tu perfil
          </strong>
          <p>
            Agrega intereses, qué estás haciendo ahora y fija
            tus publicaciones favoritas.
          </p>
        </div>
        <Link href="/settings/identity">
          Personalizar
          <ChevronRight size={15} />
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.root}>
      {own && (
        <div className={styles.ownerTools}>
          <div>
            <span>Tu identidad</span>
            <strong>
              Haz que tu perfil se sienta tuyo.
            </strong>
          </div>

          <Link href="/settings/identity">
            <Pencil size={14} />
            Personalizar
          </Link>
        </div>
      )}

      {currentVisible && (
        <div className={styles.current}>
          <div className={styles.currentIcon}>
            <span>
              {settings?.current_emoji || "✦"}
            </span>
          </div>

          <div>
            <span>
              {currentLabel(
                settings?.current_kind
              )}
            </span>
            <strong>
              {settings?.current_text}
            </strong>
          </div>
        </div>
      )}

      {interestsVisible && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>Intereses</span>
              <h3>Lo que mueve a @{profile.username}</h3>
            </div>
            <Hash size={17} />
          </div>

          <div className={styles.interests}>
            {interests.map((item) => (
              <span key={item.id || item.interest}>
                {item.interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {pinned.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>Fijado</span>
              <h3>
                Publicaciones que quiere dejar arriba
              </h3>
            </div>
            <Pin size={17} />
          </div>

          <div className={styles.pinnedGrid}>
            {pinned.map((post: any) => (
              <a
                key={post.id}
                href={`/feed?post=${post.id}`}
                className={styles.pinnedPost}
              >
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt=""
                  />
                ) : (
                  <div className={styles.pinnedText}>
                    {String(post.content || "")
                      .slice(0, 180)
                      .trim() ||
                      "Publicación de Alumni"}
                  </div>
                )}

                <span>
                  <Pin size={12} />
                  Abrir
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <div>
            <span>Red</span>
            <h3>Conexiones</h3>
          </div>
          <Users size={17} />
        </div>

        <div className={styles.connectionStats}>
          <button
            type="button"
            onClick={() =>
              void openConnections("followers")
            }
          >
            <strong>{followers}</strong>
            <span>Seguidores</span>
          </button>

          <button
            type="button"
            onClick={() =>
              void openConnections("following")
            }
          >
            <strong>{following}</strong>
            <span>Siguiendo</span>
          </button>

          {!own && mutuals.length > 0 && (
            <div>
              <div className={styles.mutualAvatars}>
                {mutuals
                  .slice(0, 3)
                  .map((person) => (
                    <a
                      key={person.id}
                      href={`/u/${person.username}`}
                    >
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt=""
                        />
                      ) : (
                        person.username
                          ?.charAt(0)
                          ?.toUpperCase() || "A"
                      )}
                    </a>
                  ))}
              </div>

              <span>
                {mutuals.length}{" "}
                {mutuals.length === 1
                  ? "conexión en común"
                  : "conexiones en común"}
              </span>
            </div>
          )}
        </div>
      </div>

      {relatedFiltered.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <div>
              <span>Cerca de esta red</span>
              <h3>Personas relacionadas</h3>
            </div>
            <CircleUserRound size={17} />
          </div>

          <div className={styles.relatedList}>
            {relatedFiltered.map((person) => (
              <div
                key={person.id}
                className={styles.related}
              >
                <a
                  href={`/u/${person.username}`}
                  className={styles.relatedIdentity}
                >
                  <span className={styles.avatar}>
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt=""
                      />
                    ) : (
                      person.username
                        ?.charAt(0)
                        ?.toUpperCase() || "A"
                    )}
                  </span>

                  <span>
                    <strong>
                      {person.full_name ||
                        `@${person.username}`}
                    </strong>
                    <small>
                      @{person.username} ·{" "}
                      {person.reason}
                    </small>
                  </span>
                </a>

                <button
                  type="button"
                  disabled={
                    busy === person.id ||
                    followingIds.includes(
                      person.id
                    )
                  }
                  onClick={() =>
                    void followPerson(person)
                  }
                >
                  {followingIds.includes(
                    person.id
                  )
                    ? "Siguiendo"
                    : person.is_private
                    ? "Solicitar"
                    : "Seguir"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {connectionMode && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setConnectionMode(null);
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
                <span>Conexiones</span>
                <h3>
                  {connectionMode === "followers"
                    ? "Seguidores"
                    : "Siguiendo"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConnectionMode(null)
                }
              >
                <X size={17} />
              </button>
            </header>

            <div className={styles.search}>
              <Search size={16} />
              <input
                value={connectionQuery}
                onChange={(event) =>
                  setConnectionQuery(
                    event.target.value
                  )
                }
                placeholder="Buscar por nombre o usuario"
              />
            </div>

            <div className={styles.modalList}>
              {connectionsLoading ? (
                <p className={styles.modalState}>
                  Buscando conexiones...
                </p>
              ) : connections.length ? (
                connections.map((person) => (
                  <a
                    key={person.id}
                    href={`/u/${person.username}`}
                    className={styles.connectionRow}
                  >
                    <span className={styles.avatar}>
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt=""
                        />
                      ) : (
                        person.username
                          ?.charAt(0)
                          ?.toUpperCase() || "A"
                      )}
                    </span>

                    <span>
                      <strong>
                        {person.full_name ||
                          `@${person.username}`}
                      </strong>
                      <small>
                        @{person.username}
                        {Number(
                          person.mutual_count || 0
                        ) > 0
                          ? ` · ${person.mutual_count} en común`
                          : ""}
                      </small>
                    </span>

                    <ChevronRight size={15} />
                  </a>
                ))
              ) : (
                <p className={styles.modalState}>
                  No encontramos conexiones.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

/* ALUMNI_1_8_0_PROFILE_SOCIAL_IDENTITY */
