"use client";

import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import type {
  ProfileMusic,
} from "@/lib/profileMusic";
import SpotifyLogo from "@/components/music/SpotifyLogo";
import {
  getSpotifyPremiumSession,
} from "@/lib/spotifyClient";
import {
  useSpotifyPremiumPlayer,
} from "@/hooks/useSpotifyPremiumPlayer";
import {
  retrySpotifyPlayer,
} from "@/lib/spotifyPlayerManager";

type Props = {
  track:
    | ProfileMusic
    | null
    | undefined;
  className?: string;
  enablePlayback?: boolean;
};

export default function ProfileMusicCard({
  track,
  className = "",
  enablePlayback = true,
}: Props) {
  const [premiumReady, setPremiumReady] =
    useState(false);
  const [sessionChecked, setSessionChecked] =
    useState(false);
  const [starting, setStarting] =
    useState(false);
  const [retrying, setRetrying] =
    useState(false);

  useEffect(() => {
    setSessionChecked(false);
    setPremiumReady(false);

    if (!track || !enablePlayback) {
      setSessionChecked(true);
      return;
    }

    let cancelled = false;

    void getSpotifyPremiumSession()
      .then((session) => {
        if (cancelled) return;

        setPremiumReady(
          Boolean(
            session.connected &&
              session.premium
          )
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPremiumReady(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSessionChecked(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    track?.provider_track_id,
    enablePlayback,
  ]);

  const {
    ready,
    isPlaying,
    error,
    playFragment,
    pause,
    activateElement,
  } =
    useSpotifyPremiumPlayer({
      enabled:
        enablePlayback &&
        premiumReady &&
        Boolean(
          track?.provider_track_id
        ),
    });

  if (!track) {
    return null;
  }

  const start =
    Number(
      track.clip_start_seconds ??
        0
    );

  const clipDuration =
    Number(
      track.clip_duration_seconds ??
        30
    ) || 30;

  function openSpotify() {
    if (!track.track_url) {
      return;
    }

    window.open(
      track.track_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function retryPlayer() {
    if (
      retrying ||
      starting
    ) {
      return;
    }

    setRetrying(true);

    try {
      await retrySpotifyPlayer();
    } catch {
      // The manager publishes the exact error.
    } finally {
      setRetrying(false);
    }
  }

  async function mainAction() {
    if (
      starting ||
      retrying ||
      !sessionChecked
    ) {
      return;
    }

    if (
      !premiumReady ||
      !track.provider_track_id
    ) {
      openSpotify();
      return;
    }

    if (!ready) {
      await retryPlayer();
      return;
    }

    if (isPlaying) {
      await pause();
      return;
    }

    setStarting(true);

    try {
      const activated =
        await activateElement();

      if (!activated) {
        await retryPlayer();
        return;
      }

      await playFragment({
        trackId:
          track.provider_track_id,
        startSeconds:
          start,
        durationSeconds:
          clipDuration,
      });
    } finally {
      setStarting(false);
    }
  }

  const preparing =
    premiumReady &&
    !ready &&
    !error;

  return (
    <div
      className={`min-w-0 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3 py-2">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[var(--app-soft)]">
          {track.artwork_url ? (
            <img
              src={
                track.artwork_url
              }
              alt={`Portada de ${track.track_title}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[var(--app-soft)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[var(--app-text)]">
            {track.track_title}
          </p>

          <p className="mt-0.5 truncate text-[11px] text-[var(--app-muted-2)]">
            {track.artist_name ||
              "Spotify"}
          </p>
        </div>

        <span className="shrink-0 text-[#1ed760]">
          <SpotifyLogo
            size={20}
          />
        </span>

        <button
          type="button"
          onClick={
            mainAction
          }
          disabled={
            !sessionChecked ||
            starting ||
            retrying ||
            preparing
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-soft)] text-[var(--app-text)] ring-1 ring-[var(--app-border)] transition hover:bg-[var(--app-soft-strong)] disabled:cursor-wait disabled:text-[var(--app-muted-3)]"
          aria-label={
            !premiumReady
              ? "Abrir en Spotify"
              : !ready &&
                error
              ? "Reintentar reproductor Spotify"
              : isPlaying
              ? "Pausar"
              : "Reproducir"
          }
        >
          {!sessionChecked ||
          starting ||
          retrying ||
          preparing ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : !premiumReady ? (
            <ExternalLink
              size={15}
            />
          ) : !ready &&
            error ? (
            <RotateCcw
              size={15}
            />
          ) : isPlaying ? (
            <Pause
              size={15}
              fill="currentColor"
            />
          ) : (
            <Play
              size={15}
              fill="currentColor"
            />
          )}
        </button>
      </div>

      {error &&
        premiumReady && (
          <button
            type="button"
            onClick={
              retryPlayer
            }
            disabled={
              retrying
            }
            className="mt-1 block max-w-full truncate text-left text-[10px] font-semibold text-[var(--app-muted-2)] transition hover:text-[var(--app-text)] disabled:opacity-60"
            title={error}
          >
            {error}
            {" · "}
            Reintentar reproductor
          </button>
        )}
    </div>
  );
}

/* ALUMNI_1_3_7_1_SPOTIFY_PROFILE_READY */
