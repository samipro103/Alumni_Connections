"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import {
  supabase,
} from "@/lib/supabase";
import AppShell from "@/components/layout/AppShell";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  getRecommendedProfiles,
  RecommendedProfile,
} from "@/lib/recommendations";

type FilterType =
  | "all"
  | "institution"
  | "career"
  | "program"
  | "location";

function normalize(
  value: unknown
) {
  return String(value || "")
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}

function institutionOf(
  person: any
) {
  return (
    person
      ?.education_institution_name ||
    person?.university ||
    ""
  );
}

function searchScore(
  person: any,
  query: string
) {
  const q =
    normalize(query);

  if (!q) return 0;

  const username =
    normalize(
      person.username
    );

  const fullName =
    normalize(
      person.full_name
    );

  const career =
    normalize(
      person.career
    );

  const institution =
    normalize(
      institutionOf(
        person
      )
    );

  const program =
    normalize(
      person
        .education_program_name
    );

  const city =
    normalize(
      person.city
    );

  const country =
    normalize(
      person.country
    );

  let score = 0;

  if (username === q) {
    score += 150;
  } else if (
    username.startsWith(q)
  ) {
    score += 110;
  } else if (
    username.includes(q)
  ) {
    score += 75;
  }

  if (fullName === q) {
    score += 130;
  } else if (
    fullName.startsWith(q)
  ) {
    score += 95;
  } else if (
    fullName.includes(q)
  ) {
    score += 65;
  }

  if (
    career.includes(q)
  ) {
    score += 58;
  }

  if (
    program.includes(q)
  ) {
    score += 56;
  }

  if (
    institution.includes(q)
  ) {
    score += 54;
  }

  if (
    city.includes(q) ||
    country.includes(q)
  ) {
    score += 38;
  }

  return score;
}

function affinityScore(
  person: any,
  me: any,
  following:
    Set<string>
) {
  let score = 0;

  if (
    following.has(
      person.id
    )
  ) {
    score += 6;
  }

  if (
    normalize(
      person
        .education_program_name
    ) &&
    normalize(
      person
        .education_program_name
    ) ===
      normalize(
        me?.education_program_name
      )
  ) {
    score += 48;
  }

  if (
    normalize(
      person.career
    ) &&
    normalize(
      person.career
    ) ===
      normalize(
        me?.career
      )
  ) {
    score += 40;
  }

  if (
    normalize(
      institutionOf(person)
    ) &&
    normalize(
      institutionOf(person)
    ) ===
      normalize(
        institutionOf(me)
      )
  ) {
    score += 36;
  }

  if (
    normalize(
      person.city
    ) &&
    normalize(
      person.city
    ) ===
      normalize(
        me?.city
      )
  ) {
    score += 11;
  }

  return score;
}

function matchesFilter(
  person: any,
  filter: FilterType
) {
  switch (filter) {
    case "institution":
      return Boolean(
        institutionOf(
          person
        )
      );

    case "career":
      return Boolean(
        person.career
      );

    case "program":
      return Boolean(
        person
          .education_program_name
      );

    case "location":
      return Boolean(
        person.city ||
          person.country
      );

    default:
      return true;
  }
}

function searchableText(
  person: any
) {
  return normalize(
    [
      person.username,
      person.full_name,
      person.career,
      institutionOf(
        person
      ),
      person
        .education_program_name,
      person.bio,
      person.city,
      person.country,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function connectionLabel(
  person: any,
  me: any,
  following:
    Set<string>
) {
  if (
    following.has(
      person.id
    )
  ) {
    return "Ya sigues";
  }

  if (
    person
      .education_program_name &&
    normalize(
      person
        .education_program_name
    ) ===
      normalize(
        me?.education_program_name
      )
  ) {
    return "Mismo programa";
  }

  if (
    person.career &&
    normalize(
      person.career
    ) ===
      normalize(
        me?.career
      )
  ) {
    return "Tu carrera";
  }

  if (
    institutionOf(
      person
    ) &&
    normalize(
      institutionOf(
        person
      )
    ) ===
      normalize(
        institutionOf(me)
      )
  ) {
    return "Tu institución";
  }

  if (
    person.city &&
    normalize(
      person.city
    ) ===
      normalize(me?.city)
  ) {
    return "Misma ciudad";
  }

  return "";
}

function ExploreContent() {
  const { user } =
    useAuth();

  const searchParams =
    useSearchParams();

  const [users, setUsers] =
    useState<any[]>([]);

  const [
    recommended,
    setRecommended,
  ] = useState<
    RecommendedProfile[]
  >([]);

  const [search, setSearch] =
    useState(
      searchParams.get("q") ||
        ""
    );

  const [filter, setFilter] =
    useState<FilterType>(
      "all"
    );

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState<string | null>(
      null
    );

  const [
    currentProfile,
    setCurrentProfile,
  ] = useState<any>(null);

  const [
    followingIds,
    setFollowingIds,
  ] = useState<string[]>(
    []
  );

  useEffect(() => {
    setSearch(
      searchParams.get("q") ||
        ""
    );
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadDirectory() {
      const { data } =
        await supabase
          .from("profiles")
          .select(
            [
              "id",
              "username",
              "avatar_url",
              "full_name",
              "university",
              "education_institution_name",
              "education_institution_logo_url",
              "education_program_name",
              "education_program_logo_url",
              "career",
              "bio",
              "city",
              "country",
              "residence_country_code",
              "created_at",
            ].join(",")
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(500);

      if (!active) return;

      setUsers(
        data || []
      );

      setLoading(false);
    }

    void loadDirectory();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setRecommended([]);
      setCurrentProfile(null);
      setFollowingIds([]);
      return;
    }

    let active = true;

    async function loadPersonalization() {
      const [
        { data: me },
        { data: follows },
        recommendations,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            [
              "id",
              "university",
              "education_institution_name",
              "education_program_name",
              "career",
              "city",
              "country",
              "residence_country_code",
            ].join(",")
          )
          .eq(
            "id",
            user!.id
          )
          .maybeSingle(),

        supabase
          .from("follows")
          .select(
            "following_id"
          )
          .eq(
            "follower_id",
            user!.id
          ),

        getRecommendedProfiles(
          user!.id,
          10
        ),
      ]);

      if (!active) return;

      setCurrentProfile(
        me || null
      );

      setFollowingIds(
        (follows || []).map(
          (row: any) =>
            row.following_id
        )
      );

      setRecommended(
        recommendations
      );
    }

    void loadPersonalization();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function follow(
    person:
      RecommendedProfile
  ) {
    if (!user) {
      window.location.href =
        "/login";
      return;
    }

    setBusy(person.id);

    const { error } =
      await supabase
        .from("follows")
        .insert({
          follower_id:
            user.id,
          following_id:
            person.id,
        });

    if (!error) {
      await supabase
        .from("notifications")
        .insert({
          user_id:
            person.id,
          actor_id:
            user.id,
          type: "follow",
          target_type:
            "profile",
          target_id:
            user.id,
        });

      setRecommended(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              person.id
          )
      );

      setFollowingIds(
        (current) =>
          current.includes(
            person.id
          )
            ? current
            : [
                ...current,
                person.id,
              ]
      );
    }

    setBusy(null);
  }

  const following =
    useMemo(
      () =>
        new Set(
          followingIds
        ),
      [followingIds]
    );

  const filteredUsers =
    useMemo(() => {
      const q =
        normalize(search);

      return users
        .filter(
          (person: any) => {
            if (
              person.id ===
              user?.id
            ) {
              return false;
            }

            if (
              !matchesFilter(
                person,
                filter
              )
            ) {
              return false;
            }

            if (
              q &&
              !searchableText(
                person
              ).includes(q)
            ) {
              return false;
            }

            return true;
          }
        )
        .map(
          (person: any) => ({
            ...person,
            _searchScore:
              searchScore(
                person,
                search
              ),
            _affinityScore:
              affinityScore(
                person,
                currentProfile,
                following
              ),
          })
        )
        .sort(
          (a: any, b: any) => {
            if (q) {
              const searchDiff =
                b._searchScore -
                a._searchScore;

              if (
                searchDiff !== 0
              ) {
                return searchDiff;
              }
            }

            const affinityDiff =
              b._affinityScore -
              a._affinityScore;

            if (
              affinityDiff !== 0
            ) {
              return affinityDiff;
            }

            return (
              new Date(
                b.created_at
              ).getTime() -
              new Date(
                a.created_at
              ).getTime()
            );
          }
        );
    }, [
      users,
      search,
      filter,
      currentProfile,
      following,
      user?.id,
    ]);

  const filters = [
    {
      id: "all",
      label: "Todos",
      icon: Users,
    },
    {
      id: "institution",
      label: "Institución",
      icon: Building2,
    },
    {
      id: "career",
      label: "Carrera",
      icon: GraduationCap,
    },
    {
      id: "program",
      label: "Programa",
      icon: Sparkles,
    },
    {
      id: "location",
      label: "Ubicación",
      icon: MapPin,
    },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[940px]">
        <header className="pb-6 pt-2 sm:pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--app-muted-2)]">
            Red Alumni.
          </p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[31px] font-black tracking-[-0.045em] text-[var(--app-text)] sm:text-[35px]">
                Descubrir
              </h1>

              <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--app-muted)]">
                Encuentra personas por institución, carrera, programa y ubicación.
              </p>
            </div>

            <p className="text-xs font-bold text-[var(--app-muted-2)]">
              {filteredUsers.length} perfiles
            </p>
          </div>
        </header>

        <div className="border-y border-[var(--app-border)] py-4">
          <div className="flex items-center gap-3">
            <Search
              size={19}
              className="shrink-0 text-[var(--app-muted)]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Nombre, carrera, universidad, programa o ciudad..."
              className="alumni-mobile-input h-11 min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[var(--app-text)] outline-none placeholder:font-medium placeholder:text-[var(--app-muted-2)]"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted)] transition hover:text-[var(--app-text)]"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="scrollbar-thin mt-2 flex gap-1 overflow-x-auto">
            {filters.map(
              ({
                id,
                label,
                icon: Icon,
              }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setFilter(
                      id as FilterType
                    )
                  }
                  className={`relative flex h-9 shrink-0 items-center gap-2 px-3 text-xs font-bold transition ${
                    filter === id
                      ? "text-[var(--app-text)]"
                      : "text-[var(--app-muted-2)] hover:text-[var(--app-muted)]"
                  }`}
                >
                  <Icon
                    size={14}
                  />
                  {label}

                  {filter === id && (
                    <span className="absolute inset-x-3 bottom-0 h-px bg-[var(--app-accent)]" />
                  )}
                </button>
              )
            )}
          </div>
        </div>

        {!search &&
          recommended.length >
            0 && (
            <section className="pt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black tracking-[-0.025em] text-[var(--app-text)]">
                    Personas que vale la pena conocer
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-[var(--app-muted-2)]">
                    Afinidad académica, conexiones y actividad reciente.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid border-t border-[var(--app-border)] sm:grid-cols-2">
                {recommended
                  .slice(0, 6)
                  .map(
                    (
                      person,
                      index
                    ) => (
                      <div
                        key={
                          person.id
                        }
                        className={`flex min-w-0 items-center gap-3 border-b border-[var(--app-border)] py-4 ${
                          index %
                            2 ===
                            0
                            ? "sm:pr-5"
                            : "sm:border-l sm:pl-5"
                        }`}
                      >
                        <Link
                          href={`/u/${person.username}`}
                          className="flex min-w-0 flex-1 items-center gap-3"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                            {person.avatar_url ? (
                              <img
                                src={
                                  person.avatar_url
                                }
                                alt={
                                  person.username
                                }
                                loading={
                                  index <
                                  2
                                    ? "eager"
                                    : "lazy"
                                }
                                decoding="async"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              person.username
                                ?.charAt(
                                  0
                                )
                                ?.toUpperCase() ||
                              "A"
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[var(--app-text)]">
                              @
                              {
                                person.username
                              }
                            </p>

                            <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
                              {
                                person.reason
                              }
                            </p>
                          </div>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            follow(
                              person
                            )
                          }
                          disabled={
                            busy ===
                            person.id
                          }
                          className="flex h-9 shrink-0 items-center gap-1.5 px-2 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--app-accent)] transition hover:text-[var(--app-text)] disabled:opacity-50"
                        >
                          <UserPlus
                            size={14}
                          />
                          Seguir
                        </button>
                      </div>
                    )
                  )}
              </div>
            </section>
          )}

        <section className="pb-12 pt-9">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-[-0.025em] text-[var(--app-text)]">
                {search
                  ? "Resultados"
                  : "Comunidad Alumni"}
              </h2>

              <p className="mt-1 text-xs leading-5 text-[var(--app-muted-2)]">
                {search
                  ? `Coincidencias para “${search}”`
                  : "Ordenado por afinidad contigo y actividad reciente."}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="border-t border-[var(--app-border)] py-16 text-center text-sm text-[var(--app-muted)]">
              Buscando personas...
            </div>
          ) : filteredUsers.length ===
            0 ? (
            <div className="mt-4 border-y border-[var(--app-border)] py-16 text-center">
              <Users
                size={24}
                className="mx-auto text-[var(--app-muted-2)]"
              />

              <p className="mt-4 font-bold text-[var(--app-text-soft)]">
                No encontramos coincidencias
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--app-muted)]">
                Prueba con otra carrera, institución, programa o ciudad.
              </p>
            </div>
          ) : (
            <div className="mt-4 border-t border-[var(--app-border)]">
              {filteredUsers.map(
                (
                  person: any,
                  index: number
                ) => {
                  const label =
                    connectionLabel(
                      person,
                      currentProfile,
                      following
                    );

                  const institution =
                    institutionOf(
                      person
                    );

                  return (
                    <Link
                      key={
                        person.id
                      }
                      href={`/u/${person.username}`}
                      className="group flex gap-4 border-b border-[var(--app-border)] py-5 transition sm:px-1"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-surface-2)] text-sm font-black text-[var(--app-text)] ring-1 ring-[var(--app-border)]">
                        {person.avatar_url ? (
                          <img
                            src={
                              person.avatar_url
                            }
                            alt={
                              person.username
                            }
                            loading={
                              index <
                              3
                                ? "eager"
                                : "lazy"
                            }
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          person.username
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                          "A"
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="truncate font-black text-[var(--app-text)] transition group-hover:text-[var(--app-accent)]">
                            @
                            {
                              person.username
                            }
                          </p>

                          {person.full_name && (
                            <span className="truncate text-xs font-semibold text-[var(--app-muted)]">
                              {
                                person.full_name
                              }
                            </span>
                          )}

                          {label && (
                            <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--app-accent)]">
                              {
                                label
                              }
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[var(--app-muted)]">
                          {(person.career ||
                            institution) && (
                            <span className="flex min-w-0 items-center gap-1.5">
                              <GraduationCap
                                size={
                                  13
                                }
                              />

                              <span className="truncate">
                                {[
                                  person.career,
                                  institution,
                                ]
                                  .filter(
                                    Boolean
                                  )
                                  .join(
                                    " · "
                                  )}
                              </span>
                            </span>
                          )}

                          {person
                            .education_program_name && (
                            <span className="flex items-center gap-1.5">
                              <Sparkles
                                size={
                                  13
                                }
                              />
                              {
                                person
                                  .education_program_name
                              }
                            </span>
                          )}

                          {(person.city ||
                            person.country) && (
                            <span className="flex items-center gap-1.5">
                              <MapPin
                                size={
                                  13
                                }
                              />
                              {[
                                person.city,
                                person.country,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  ", "
                                )}
                            </span>
                          )}
                        </div>

                        {person.bio && (
                          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-5 text-[var(--app-muted)]">
                            {
                              person.bio
                            }
                          </p>
                        )}
                      </div>

                      <Briefcase
                        size={16}
                        className="mt-1 hidden shrink-0 text-[var(--app-muted-3)] transition group-hover:text-[var(--app-accent)] sm:block"
                      />
                    </Link>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] text-sm text-[var(--app-muted)]">
          Cargando...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
