"use client";

import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import type { ProfileMusic } from "@/lib/profileMusic";
import SpotifyLogo from "@/components/music/SpotifyLogo";
import { getSpotifyPremiumSession } from "@/lib/spotifyClient";
import { useSpotifyPremiumPlayer } from "@/hooks/useSpotifyPremiumPlayer";

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
  const [
    premiumReady,
    setPremiumReady,
  ] =
    useState(false);

  const [
    sessionChecked,
    setSessionChecked,
  ] =
    useState(false);

  useEffect(() => {
    if (
      !track ||
      !enablePlayback
    ) {
      setSessionChecked(
        true
      );

      return;
    }

    let cancelled =
      false;

    void getSpotifyPremiumSession()
      .then((session) => {
        if (cancelled) {
          return;
        }

        setPremiumReady(
          Boolean(
            session.connected &&
              session.premium
          )
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSessionChecked(
            true
          );
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

  async function mainAction() {
    if (
      !premiumReady ||
      !track?.provider_track_id
    ) {
      window.open(
        track!.track_url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    /*
     * El gesto del botón desbloquea audio en iPhone.
     */
    activateElement();

    if (isPlaying) {
      await pause();
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
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-3 py-2 ${className}`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.05]">
        {track.artwork_url ? (
          <img
            src={
              track.artwork_url
            }
            alt={`Portada de ${track.track_title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-white/[0.04]" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-zinc-100">
          {
            track.track_title
          }
        </p>

        <p className="mt-0.5 truncate text-[11px] text-zinc-600">
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
          enablePlayback &&
          premiumReady &&
          !ready
        }
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-zinc-100 transition hover:bg-white/[0.10] disabled:cursor-wait disabled:text-zinc-700"
        aria-label={
          premiumReady
            ? isPlaying
              ? "Pausar"
              : "Reproducir"
            : "Abrir en Spotify"
        }
      >
        {!sessionChecked ? (
          <Loader2
            size={15}
            className="animate-spin"
          />
        ) : premiumReady ? (
          !ready ? (
            <Loader2
              size={15}
              className="animate-spin"
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
          )
        ) : (
          <ExternalLink
            size={15}
          />
        )}
      </button>

      {error && (
        <span
          className="sr-only"
          role="status"
        >
          {error}
        </span>
      )}
    </div>
  );
}
