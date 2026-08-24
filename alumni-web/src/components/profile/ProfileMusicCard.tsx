"use client";

import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  useEffect,
  useMemo,
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

const BARS = [
  12, 20, 9, 27, 15, 31, 13, 23,
  34, 17, 29, 11, 25, 36, 16, 30,
  19, 10, 28, 35, 15, 24, 32, 13,
  26, 18, 34, 12, 29, 21, 11, 31,
];

function formatTime(
  totalSeconds: number
) {
  const safe = Math.max(
    0,
    Math.floor(totalSeconds)
  );

  return `${Math.floor(
    safe / 60
  )}:${String(safe % 60).padStart(
    2,
    "0"
  )}`;
}

export default function ProfileMusicCard({
  track,
  className = "",
  enablePlayback = true,
}: Props) {
  const [premiumReady, setPremiumReady] =
    useState(false);

  const [sessionChecked, setSessionChecked] =
    useState(false);

  useEffect(() => {
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
    positionMs,
    error,
    playFragment,
    pause,
  } = useSpotifyPremiumPlayer({
    enabled:
      enablePlayback &&
      premiumReady &&
      Boolean(
        track?.provider_track_id
      ),
  });

  const start = Number(
    track?.clip_start_seconds ??
      0
  );

  const clipDuration =
    Number(
      track?.clip_duration_seconds ??
        30
    ) || 30;

  const progress = useMemo(() => {
    const relative =
      positionMs / 1000 -
      start;

    return Math.max(
      0,
      Math.min(
        1,
        relative /
          clipDuration
      )
    );
  }, [
    positionMs,
    start,
    clipDuration,
  ]);

  if (!track) return null;

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

    if (isPlaying) {
      await pause();
      return;
    }

    await playFragment({
      trackId:
        track.provider_track_id,
      startSeconds: start,
      durationSeconds:
        clipDuration,
    });
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0e1117] ${className}`}
    >
      {track.artwork_url && (
        <>
          <img
            src={track.artwork_url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -left-8 top-1/2 h-44 w-44 -translate-y-1/2 scale-125 rounded-full object-cover opacity-[0.12] blur-[42px]"
          />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(13,16,22,.76),rgba(13,16,22,.96)_68%)]" />
        </>
      )}

      <div className="relative p-4 sm:p-[18px]">
        <div className="flex items-center gap-3.5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[15px] border border-white/[0.08] bg-[#181c25] shadow-[0_10px_26px_rgba(0,0,0,.24)]">
            {track.artwork_url ? (
              <img
                src={
                  track.artwork_url
                }
                alt={`Portada de ${track.track_title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[#161a22]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-zinc-100">
              {track.track_title}
            </p>

            <p className="mt-1 truncate text-[11px] text-zinc-600">
              {track.artist_name ||
                "Spotify"}
            </p>
          </div>

          <button
            type="button"
            onClick={mainAction}
            disabled={
              enablePlayback &&
              premiumReady &&
              !ready
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.055] text-zinc-200 transition hover:bg-white/[0.09] disabled:cursor-wait disabled:text-zinc-700"
            aria-label={
              premiumReady
                ? isPlaying
                  ? "Pausar fragmento"
                  : "Escuchar fragmento"
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
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
            {BARS.map(
              (height, index) => {
                const active =
                  index /
                    (BARS.length -
                      1) <=
                  progress;

                return (
                  <span
                    key={`${height}-${index}`}
                    className={`w-[3px] shrink-0 rounded-full transition ${
                      active
                        ? "bg-[#1ed760]/80"
                        : "bg-white/[0.10]"
                    }`}
                    style={{
                      height: `${Math.max(
                        5,
                        height *
                          0.68
                      )}px`,
                    }}
                  />
                );
              }
            )}
          </div>

          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold tabular-nums text-zinc-700">
            {formatTime(start)}–
            {formatTime(
              start +
                clipDuration
            )}
          </span>

          <span className="shrink-0 text-[#1ed760]/70">
            <SpotifyLogo
              size={18}
            />
          </span>
        </div>

        {enablePlayback &&
          !premiumReady &&
          sessionChecked && (
          <p className="mt-2 text-[10px] leading-4 text-zinc-800">
            Toca para abrir la canción en Spotify. La reproducción del fragmento dentro de Alumni requiere Spotify Premium conectado.
          </p>
        )}

        {error && (
          <p className="mt-2 text-[10px] font-bold leading-4 text-red-300/70">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
