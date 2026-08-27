"use client";

import {
  Clock3,
  Hash,
  Search,
  Sparkles,
  TrendingUp,
  UserRoundSearch,
  Users,
  X,
} from "lucide-react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { getRecommendedProfiles } from "@/lib/recommendations";
import { hydratePostMedia } from "@/lib/privateMedia";
import {
  hydratePostMediaItems,
} from "@/lib/feedMedia";
import ExplorePostCard from "@/components/explore/ExplorePostCard";
import ExplorePersonRow from "@/components/explore/ExplorePersonRow";
import ExploreSocialPulse from "@/components/explore/ExploreSocialPulse";
import "./explore-pro.css";

type Mode = "all" | "people" | "posts";
type RecentSearch = {
  query: string;
  createdAt: string;
};

const RECENTS_KEY = "alumni:explore:recent-searches:v1";

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function readRecents(): RecentSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      localStorage.getItem(RECENTS_KEY) || "[]"
    );
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

function writeRecent(query: string) {
  const clean = query.trim();
  if (!clean) return;

  const current = readRecents().filter(
    (item) => normalize(item.query) !== normalize(clean)
  );

  const next = [
    {
      query: clean,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ].slice(0, 8);

  localStorage.setItem(
    RECENTS_KEY,
    JSON.stringify(next)
  );

  return next;
}

async function hydratePosts(postIds: number[]) {
  if (!postIds.length) return [];

  const [
    { data: postsData },
    { data: commentsData },
    { data: repostData },
    { data: mediaRaw },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url,
          full_name,
          university,
          education_institution_name,
          education_program_name,
          career,
          city,
          country,
          residence_country_code
        ),
        likes (
          user_id
        )
      `)
      .in("id", postIds),
    supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("post_reposts")
      .select("post_id")
      .in("post_id", postIds),
    supabase
      .from("post_media")
      .select("*")
      .in("post_id", postIds)
      .order("sort_order", { ascending: true }),
  ]);

  const hydrated = await hydratePostMedia(
    (postsData || []) as any[]
  );
  const mediaRows = await hydratePostMediaItems(
    (mediaRaw || []) as any[]
  );

  const byId = new Map(
    hydrated.map((post: any) => [
      post.id,
      {
        ...post,
        likesCount: post.likes?.length || 0,
        commentsCount: (commentsData || []).filter(
          (row: any) => row.post_id === post.id
        ).length,
        repostsCount: (repostData || []).filter(
          (row: any) => row.post_id === post.id
        ).length,
        mediaItems: mediaRows.filter(
          (row: any) => row.post_id === post.id
        ),
      },
    ])
  );

  return postIds
    .map((id) => byId.get(id))
    .filter(Boolean);
}

function ExploreContent() {
  const { user } = useAuth();
  const params = useSearchParams();

  const [query, setQuery] = useState(
    params.get("q") || ""
  );
  const [mode, setMode] = useState<Mode>("all");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [recents, setRecents] = useState<RecentSearch[]>([]);
  const [newMembers, setNewMembers] = useState<any[]>([]);

  useEffect(() => {
    setRecents(readRecents());
  }, []);

  useEffect(() => {
    const q = params.get("q") || "";
    if (q !== query) {
      setQuery(q);
    }
  }, [params]);

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);

      const [
        trendingResult,
        tagsResult,
        recentProfilesResult,
      ] = await Promise.all([
        supabase.rpc(
          "alumni_trending_post_ids",
          { p_limit: 18 }
        ),
        supabase.rpc(
          "alumni_trending_hashtags",
          { p_limit: 12 }
        ),
        supabase
          .from("profiles")
          .select(
            "id,username,avatar_url,full_name,university,education_institution_name,education_program_name,career,city,country,is_private,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const ids = (trendingResult.data || []).map(
        (row: any) => Number(row.post_id)
      );

      const hydratedTrending = await hydratePosts(ids);

      if (!active) return;

      setTrendingPosts(hydratedTrending);
      setTrendingTags(tagsResult.data || []);
      setNewMembers(
        (recentProfilesResult.data || []).filter(
          (person: any) => person.id !== user?.id
        )
      );

      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      setFollowingIds([]);
      return;
    }

    let active = true;

    void (async () => {
      const [
        recs,
        { data: follows },
      ] = await Promise.all([
        getRecommendedProfiles(user.id, 12),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
      ]);

      if (!active) return;

      setRecommended(recs);
      setFollowingIds(
        (follows || []).map(
          (row: any) => row.following_id
        )
      );
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const clean = query.trim();

    if (clean.length < 2) {
      setPeople([]);
      setPosts([]);
      setSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(clean, false);
    }, 260);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function recordSignal(
    type: "hashtag" | "profile" | "search" | "post",
    value: string,
    weight = 1
  ) {
    if (!user) return;

    void supabase.rpc(
      "alumni_record_discovery_signal",
      {
        p_signal_type: type,
        p_signal_value: value,
        p_weight: weight,
      }
    );
  }

  async function runSearch(
    raw: string,
    persist = true
  ) {
    const clean = raw.trim();

    if (clean.length < 2) {
      setPeople([]);
      setPosts([]);
      return;
    }

    setSearching(true);

    const [peopleResult, postIdsResult] =
      await Promise.all([
        supabase.rpc(
          "alumni_search_profiles",
          {
            p_query: clean,
            p_limit: 35,
          }
        ),
        supabase.rpc(
          "alumni_search_post_ids",
          {
            p_query: clean,
            p_limit: 40,
          }
        ),
      ]);

    const postIds = (postIdsResult.data || []).map(
      (row: any) => Number(row.post_id)
    );

    const hydrated = await hydratePosts(postIds);

    setPeople(peopleResult.data || []);
    setPosts(hydrated);
    setSearching(false);

    if (persist) {
      const next = writeRecent(clean);
      if (next) setRecents(next);
      void recordSignal("search", normalize(clean), 1.2);
    }
  }

  async function follow(person: any) {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (busy || followingIds.includes(person.id)) return;

    setBusy(person.id);

    try {
      if (person.is_private) {
        const { error } = await supabase
          .from("follow_requests")
          .insert({
            requester_id: user.id,
            target_id: person.id,
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: person.id,
          });

        if (error) throw error;

        setFollowingIds((current) =>
          current.includes(person.id)
            ? current
            : [...current, person.id]
        );

        void supabase
          .from("notifications")
          .insert({
            user_id: person.id,
            actor_id: user.id,
            type: "follow",
            target_type: "profile",
            target_id: user.id,
          });
      }

      void recordSignal("profile", person.id, 2.2);
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo completar la acción."
      );
    } finally {
      setBusy(null);
    }
  }

  const activeSearch = query.trim().length >= 2;

  const peopleResults = useMemo(
    () =>
      people.filter(
        (person) => person.id !== user?.id
      ),
    [people, user?.id]
  );

  const recommendedUnique = useMemo(() => {
    const seen = new Set<string>();
    return recommended.filter((person) => {
      if (
        person.id === user?.id ||
        seen.has(person.id)
      ) {
        return false;
      }
      seen.add(person.id);
      return true;
    });
  }, [recommended, user?.id]);

  const newMembersUnique = useMemo(() => {
    const recommendedIds = new Set(
      recommendedUnique.map((person) => person.id)
    );

    return newMembers.filter(
      (person) =>
        person.id !== user?.id &&
        !recommendedIds.has(person.id)
    );
  }, [newMembers, recommendedUnique, user?.id]);

  return (
    <AppShell>
      <main className="alumni-explore-pro mx-auto w-full max-w-[1040px]">
        <header className="alumni-explore-hero">
          <p className="alumni-explore-eyebrow">
            Explorar Alumni.
          </p>

          <h1>Descubre tu próxima conexión.</h1>

          <p className="alumni-explore-lead">
            Personas, publicaciones, carreras, instituciones y temas
            que se mueven dentro de tu comunidad.
          </p>

          <div className="alumni-explore-search">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void runSearch(query, true);
                }
              }}
              placeholder="Buscar personas, carreras, universidades, temas o publicaciones"
              aria-label="Buscar en Alumni"
            />

            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setPeople([]);
                  setPosts([]);
                }}
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {activeSearch && (
            <nav className="alumni-explore-tabs">
              {(
                [
                  ["all", "Todo"],
                  ["people", "Personas"],
                  ["posts", "Publicaciones"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  data-active={mode === id ? "true" : "false"}
                  onClick={() => setMode(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}
        </header>

        {!activeSearch && <ExploreSocialPulse />}

        {!activeSearch && recents.length > 0 && (
          <section className="alumni-explore-section">
            <div className="alumni-explore-section-title">
              <div>
                <span>Continuar</span>
                <h2>Búsquedas recientes</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(RECENTS_KEY);
                  setRecents([]);
                }}
              >
                Limpiar
              </button>
            </div>

            <div className="alumni-explore-recent-list">
              {recents.map((item) => (
                <button
                  key={`${item.query}-${item.createdAt}`}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    void runSearch(item.query, true);
                  }}
                >
                  <Clock3 size={14} />
                  {item.query}
                </button>
              ))}
            </div>
          </section>
        )}

        {activeSearch ? (
          <section className="alumni-explore-search-results">
            {searching ? (
              <div className="alumni-explore-empty">
                Buscando en Alumni...
              </div>
            ) : (
              <>
                {(mode === "all" || mode === "people") && (
                  <section className="alumni-explore-section">
                    <div className="alumni-explore-section-title">
                      <div>
                        <span>Resultados</span>
                        <h2>Personas</h2>
                      </div>
                      <strong>{peopleResults.length}</strong>
                    </div>

                    {peopleResults.length ? (
                      <div className="alumni-explore-person-list">
                        {peopleResults.map((person) => (
                          <ExplorePersonRow
                            key={person.id}
                            person={person}
                            following={followingIds.includes(person.id)}
                            busy={busy === person.id}
                            onFollow={() => void follow(person)}
                            onOpen={() =>
                              void recordSignal(
                                "profile",
                                person.id,
                                1.8
                              )
                            }
                            reason={
                              person.education_program_name ||
                              person.career ||
                              person.education_institution_name ||
                              person.university ||
                              person.city
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="alumni-explore-empty">
                        No encontramos personas con esa búsqueda.
                      </div>
                    )}
                  </section>
                )}

                {(mode === "all" || mode === "posts") && (
                  <section className="alumni-explore-section">
                    <div className="alumni-explore-section-title">
                      <div>
                        <span>Contenido</span>
                        <h2>Publicaciones</h2>
                      </div>
                      <strong>{posts.length}</strong>
                    </div>

                    {posts.length ? (
                      <div className="alumni-explore-post-list">
                        {posts.map((post) => (
                          <ExplorePostCard
                            key={post.id}
                            post={post}
                            onOpen={() => {
                              void recordSignal(
                                "post",
                                String(post.id),
                                1.5
                              );

                              for (const tag of (
                                String(post.content || "").match(
                                  /#[A-Za-z0-9_]{2,40}/g
                                ) || []
                              )) {
                                void recordSignal(
                                  "hashtag",
                                  tag.slice(1).toLowerCase(),
                                  1.2
                                );
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="alumni-explore-empty">
                        No encontramos publicaciones relacionadas.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </section>
        ) : (
          <>
            <section className="alumni-explore-section">
              <div className="alumni-explore-section-title">
                <div>
                  <span>Tendencias</span>
                  <h2>Temas que están creciendo</h2>
                </div>
                <TrendingUp size={18} />
              </div>

              {trendingTags.length ? (
                <div className="alumni-explore-tags">
                  {trendingTags.map((item: any, index) => (
                    <a
                      key={item.tag}
                      href={`/explore/tag/${encodeURIComponent(item.tag)}`}
                      onClick={() =>
                        void recordSignal(
                          "hashtag",
                          item.tag,
                          1.4
                        )
                      }
                    >
                      <span>{index + 1}</span>
                      <strong>#{item.tag}</strong>
                      <small>
                        {item.post_count}{" "}
                        {Number(item.post_count) === 1
                          ? "publicación"
                          : "publicaciones"}
                      </small>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="alumni-explore-empty">
                  Las tendencias aparecerán cuando la comunidad use hashtags.
                </div>
              )}
            </section>

            {user && recommendedUnique.length > 0 && (
              <section className="alumni-explore-section">
                <div className="alumni-explore-section-title">
                  <div>
                    <span>Para tu red</span>
                    <h2>Personas que podrías conocer</h2>
                  </div>
                  <UserRoundSearch size={18} />
                </div>

                <div className="alumni-explore-person-list">
                  {recommendedUnique.slice(0, 8).map((person) => (
                    <ExplorePersonRow
                      key={person.id}
                      person={person}
                      following={followingIds.includes(person.id)}
                      busy={busy === person.id}
                      reason={person.reason}
                      onFollow={() => void follow(person)}
                      onOpen={() =>
                        void recordSignal(
                          "profile",
                          person.id,
                          2
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            <section className="alumni-explore-section">
              <div className="alumni-explore-section-title">
                <div>
                  <span>Ahora</span>
                  <h2>Publicaciones destacadas</h2>
                </div>
                <Sparkles size={18} />
              </div>

              {loading ? (
                <div className="alumni-explore-empty">
                  Preparando descubrimientos...
                </div>
              ) : trendingPosts.length ? (
                <div className="alumni-explore-post-grid">
                  {trendingPosts.slice(0, 8).map((post) => (
                    <ExplorePostCard
                      key={post.id}
                      post={post}
                      compact
                      onOpen={() => {
                        void recordSignal(
                          "post",
                          String(post.id),
                          1.7
                        );
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="alumni-explore-empty">
                  Todavía no hay suficiente actividad para destacar contenido.
                </div>
              )}
            </section>

            {newMembersUnique.length > 0 && (
              <section className="alumni-explore-section">
                <div className="alumni-explore-section-title">
                  <div>
                    <span>Comunidad</span>
                    <h2>Nuevos en Alumni</h2>
                  </div>
                  <Users size={18} />
                </div>

                <div className="alumni-explore-person-list">
                  {newMembersUnique.slice(0, 6).map((person) => (
                    <ExplorePersonRow
                      key={person.id}
                      person={person}
                      following={followingIds.includes(person.id)}
                      busy={busy === person.id}
                      reason={
                        person.career ||
                        person.education_institution_name ||
                        person.university ||
                        person.city ||
                        "Nuevo en la comunidad"
                      }
                      onFollow={() => void follow(person)}
                      onOpen={() =>
                        void recordSignal(
                          "profile",
                          person.id,
                          1.2
                        )
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Cargando Explorar...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}

/* ALUMNI_1_6_0_EXPLORE_DISCOVERY */

/* ALUMNI_2_2_0_FIX1_SAFE_ADDITIVE:EXPLORE */
