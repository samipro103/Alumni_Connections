"use client";

import {
  Check,
  Loader2,
  Music2,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import type {
  ProfileMusic,
  SpotifyTrackImport,
} from "@/lib/profileMusic";
import type { StoryMusicTrack } from "@/lib/musicCatalog";
import ProfileMusicCard from "@/components/profile/ProfileMusicCard";
import SpotifyPremiumClipSelector from "@/components/settings/SpotifyPremiumClipSelector";

type Props = {
  userId: string;
};

function getMarketFromLocale() {
  if (
    typeof navigator ===
    "undefined"
  ) {
    return "SV";
  }

  const locale =
    navigator.languages?.[0] ||
    navigator.language ||
    "es-SV";

  const match =
    locale.match(
      /[-_]([A-Za-z]{2})$/
    );

  return (
    match?.[1]?.toUpperCase() ||
    "SV"
  );
}

export default function ProfileMusicSettings({
  userId,
}: Props) {
  const searchTimerRef =
    useRef<number | null>(
      null
    );

  const [current, setCurrent] =
    useState<ProfileMusic | null>(
      null
    );

  const [candidate, setCandidate] =
    useState<SpotifyTrackImport | null>(
      null
    );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<
    StoryMusicTrack[]
  >([]);

  const [searching, setSearching] =
    useState(false);

  const [clipStart, setClipStart] =
    useState(0);

  const [
    trackDuration,
    setTrackDuration,
  ] = useState<number | null>(
    null
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [removing, setRemoving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (userId) {
      void loadMusic();
    }
  }, [userId]);

  useEffect(() => {
    const query =
      searchQuery.trim();

    if (
      searchTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        searchTimerRef.current
      );
    }

    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    searchTimerRef.current =
      window.setTimeout(
        () => {
          void searchSpotify(
            query
          );
        },
        320
      );

    return () => {
      if (
        searchTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (
        searchTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          searchTimerRef.current
        );
      }
    };
  }, []);

  const handleDurationKnown =
    useCallback(
      (value: number) => {
        setTrackDuration(value);
      },
      []
    );

  async function loadMusic() {
    setLoading(true);
    setError("");

    const {
      data,
      error: queryError,
    } = await supabase
      .from("profile_music")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (queryError) {
      console.error(
        queryError
      );

      setError(
        "No se pudo cargar tu canción."
      );
    } else {
      setCurrent(
        (data as ProfileMusic | null) ||
          null
      );
    }

    setLoading(false);
  }

  async function searchSpotify(
    query: string
  ) {
    setSearching(true);
    setError("");

    try {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth.getSession();

      if (
        !session?.access_token
      ) {
        throw new Error(
          "Tu sesión de Alumni no está activa."
        );
      }

      const response =
        await fetch(
          `/api/music/search?q=${encodeURIComponent(
            query
          )}&market=${encodeURIComponent(
            getMarketFromLocale()
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
            cache:
              "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo buscar en Spotify."
        );
      }

      setSearchResults(
        (data?.tracks ||
          []) as StoryMusicTrack[]
      );
    } catch (searchError: any) {
      setSearchResults([]);

      setError(
        searchError?.message ||
          "No se pudo buscar música."
      );
    } finally {
      setSearching(false);
    }
  }

  function chooseTrack(
    track: StoryMusicTrack
  ) {
    const nextCandidate: SpotifyTrackImport =
      {
        provider: "spotify",
        provider_track_id:
          track.provider_track_id,
        track_title:
          track.track_title,
        artist_name:
          track.artist_name,
        album_name:
          track.album_name,
        artwork_url:
          track.artwork_url,
        track_url:
          track.track_url,
        embed_url:
          track.embed_url,
        duration_ms:
          track.duration_ms,
      };

    setCandidate(
      nextCandidate
    );

    setClipStart(0);

    setTrackDuration(
      typeof track.duration_ms ===
        "number" &&
        track.duration_ms > 0
        ? Math.floor(
            track.duration_ms /
              1000
          )
        : null
    );

    setSearchQuery("");
    setSearchResults([]);
    setError("");

    window.setTimeout(() => {
      document
        .getElementById(
          "alumni-music-clip-editor"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  }

  function editCurrentClip() {
    if (!current) return;

    setCandidate({
      provider: "spotify",
      provider_track_id:
        current.provider_track_id,
      track_title:
        current.track_title,
      artist_name:
        current.artist_name,
      album_name:
        current.album_name,
      artwork_url:
        current.artwork_url,
      track_url:
        current.track_url,
      embed_url:
        current.embed_url,
      duration_ms:
        current.track_duration_seconds
          ? Number(
              current.track_duration_seconds
            ) * 1000
          : null,
    });

    setSearchQuery("");
    setSearchResults([]);

    setClipStart(
      Number(
        current.clip_start_seconds ??
          0
      )
    );

    setTrackDuration(
      current.track_duration_seconds
        ? Number(
            current.track_duration_seconds
          )
        : null
    );

    window.setTimeout(() => {
      document
        .getElementById(
          "alumni-music-clip-editor"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 50);
  }

  async function saveMusic() {
    if (
      !candidate ||
      !userId ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const {
      data,
      error: saveError,
    } = await supabase
      .from("profile_music")
      .upsert(
        {
          user_id: userId,
          provider:
            candidate.provider,
          provider_track_id:
            candidate.provider_track_id,
          track_title:
            candidate.track_title,
          artist_name:
            candidate.artist_name,
          album_name:
            candidate.album_name,
          artwork_url:
            candidate.artwork_url,
          track_url:
            candidate.track_url,
          embed_url:
            candidate.embed_url,
          clip_start_seconds:
            Math.max(
              0,
              Math.floor(
                clipStart
              )
            ),
          clip_duration_seconds:
            30,
          track_duration_seconds:
            trackDuration,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select("*")
      .single();

    if (saveError) {
      const message =
        String(
          saveError.message ||
            ""
        );

      setError(
        message.includes(
          "SPOTIFY_PREMIUM_REQUIRED"
        )
          ? "Necesitas una conexión Spotify Premium verificada para guardar música."
          : message
      );
    } else {
      setCurrent(
        data as ProfileMusic
      );

      setCandidate(null);
      setSearchQuery("");
      setSearchResults([]);
      setClipStart(0);
      setTrackDuration(null);
    }

    setSaving(false);
  }

  async function removeMusic() {
    if (
      !userId ||
      removing
    ) {
      return;
    }

    if (
      !window.confirm(
        "¿Quitar tu canción del perfil?"
      )
    ) {
      return;
    }

    setRemoving(true);
    setError("");

    const {
      error: removeError,
    } = await supabase
      .from("profile_music")
      .delete()
      .eq(
        "user_id",
        userId
      );

    if (removeError) {
      setError(
        removeError.message
      );
    } else {
      setCurrent(null);
      setCandidate(null);
      setSearchQuery("");
      setSearchResults([]);
    }

    setRemoving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center text-sm text-zinc-600">
        <Loader2
          size={17}
          className="mr-2 animate-spin"
        />
        Cargando música...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="border-b border-white/[0.07] pb-7">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#1ed760]/10 text-[#1ed760]">
            <Music2 size={18} />
          </span>

          <div className="min-w-0">
            <p className="text-sm font-black text-zinc-200">
              Tu canción del momento
            </p>

          </div>
        </div>

        {current ? (
          <div className="mt-5">
            <ProfileMusicCard
              track={current}
              enablePlayback={false}
            />

            <div className="mt-3 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={
                  editCurrentClip
                }
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
              >
                <Pencil size={13} />
                Editar fragmento
              </button>

              <button
                type="button"
                onClick={removeMusic}
                disabled={removing}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 transition hover:text-red-300 disabled:opacity-50"
              >
                {removing ? (
                  <Loader2
                    size={13}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={13} />
                )}
                Quitar canción
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 border-l-2 border-[#1ed760]/30 pl-4">
            <p className="text-sm font-bold text-zinc-400">
              Aún no tienes una canción.
            </p>
          </div>
        )}
      </section>

      <section>
        <p className="text-sm font-black text-zinc-200">
          Elegir canción
        </p>


        <div className="relative mt-4">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-[22px] -translate-y-1/2 text-zinc-700"
          />

          <input
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(
                event.target.value
              );

              setCandidate(null);
              setError("");
            }}
            placeholder="Buscar canción o artista..."
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-full rounded-xl border border-white/[0.07] bg-white/[0.025] pl-10 pr-10 text-sm text-zinc-300 outline-none transition placeholder:text-zinc-800 focus:border-[#1ed760]/35"
          />

          {searching && (
            <Loader2
              size={15}
              className="absolute right-3 top-[22px] -translate-y-1/2 animate-spin text-zinc-600"
            />
          )}

          {searchQuery
            .trim()
            .length >= 2 && (
            <div className="mt-2 overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0e1117]">
              {error ? (
                <p className="px-4 py-4 text-[11px] font-bold leading-5 text-red-300/80">
                  {error}
                </p>
              ) : !searching &&
                searchResults.length ===
                  0 ? (
                <p className="px-4 py-4 text-[11px] text-zinc-700">
                  No encontré canciones con esa búsqueda.
                </p>
              ) : (
                <div className="max-h-[330px] overflow-y-auto">
                  {searchResults.map(
                    (track) => (
                      <button
                        key={
                          track.provider_track_id
                        }
                        type="button"
                        onClick={() =>
                          chooseTrack(
                            track
                          )
                        }
                        className="flex w-full items-center gap-3 border-b border-white/[0.045] px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.035]"
                      >
                        {track.artwork_url ? (
                          <img
                            src={
                              track.artwork_url
                            }
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-xl object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-600">
                            <Music2
                              size={
                                16
                              }
                            />
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-zinc-200">
                            {
                              track.track_title
                            }
                          </p>

                          <p className="mt-1 truncate text-[10px] text-zinc-600">
                            {
                              track.artist_name
                            }
                            {track.album_name
                              ? ` · ${track.album_name}`
                              : ""}
                          </p>
                        </div>

                        <Check
                          size={14}
                          className="shrink-0 text-zinc-700"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {error &&
          searchQuery
            .trim()
            .length < 2 && (
          <p className="mt-3 text-xs font-bold text-red-300/80">
            {error}
          </p>
        )}

        {candidate && (
          <div
            id="alumni-music-clip-editor"
            className="mt-6 space-y-4 border-t border-white/[0.06] pt-6"
          >
            <div className="flex items-center gap-3">
              {candidate.artwork_url && (
                <img
                  src={
                    candidate.artwork_url
                  }
                  alt=""
                  className="h-11 w-11 rounded-xl object-cover"
                />
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-zinc-200">
                  {
                    candidate.track_title
                  }
                </p>

                <p className="mt-0.5 truncate text-[11px] text-zinc-700">
                  {candidate.artist_name ||
                    "Spotify"}
                </p>
              </div>
            </div>

            <SpotifyPremiumClipSelector
              track={candidate}
              startSeconds={
                clipStart
              }
              onStartChange={
                setClipStart
              }
              knownDurationSeconds={
                trackDuration
              }
            />

            <button
              type="button"
              onClick={saveMusic}
              disabled={saving}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-[#1ed760] text-xs font-black text-[#07110a] transition hover:brightness-105 disabled:opacity-50"
            >
              {saving
                ? "Guardando..."
                : "Guardar en mi perfil"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */
