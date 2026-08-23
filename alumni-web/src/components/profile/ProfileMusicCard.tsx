"use client";

import { useMemo, useRef } from "react";
import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import type { ProfileMusic } from "@/lib/profileMusic";
import { useSpotifyClip } from "@/hooks/useSpotifyClip";

type Props = {
  track: ProfileMusic | null | undefined;
  className?: string;
};

const BARS = [
  12, 20, 9, 27, 15, 31, 13, 23, 34, 17, 29, 11, 25, 36, 16, 30,
  19, 10, 28, 35, 15, 24, 32, 13, 26, 18, 34, 12, 29, 21, 11, 31,
];

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function SpotifyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.1"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M7.25 9.45c3.35-1.02 7.3-.75 10.2.75M7.85 12.25c2.76-.8 6.16-.57 8.7.66M8.45 14.83c2.15-.57 4.78-.4 6.78.54"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ProfileMusicCard({
  track,
  className = "",
}: Props) {
  const spotifyMountRef = useRef<HTMLDivElement | null>(null);

  const start = Number(track?.clip_start_seconds ?? 0);
  const clipDuration = Number(track?.clip_duration_seconds ?? 30) || 30;

  const {
    ready,
    failed,
    isPlaying,
    positionMs,
    error,
    toggle,
  } = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl: track?.track_url || "",
    trackId: track?.provider_track_id || null,
    startSeconds: start,
    clipDurationSeconds: clipDuration,
  });

  const progress = useMemo(() => {
    const relative = positionMs / 1000 - start;
    return Math.max(0, Math.min(1, relative / clipDuration));
  }, [positionMs, start, clipDuration]);

  if (!track) return null;

  function handleMainAction() {
    if (failed) {
      window.open(track!.track_url, "_blank", "noopener,noreferrer");
      return;
    }

    toggle();
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
          <div
            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-[15px] border border-white/[0.08] bg-[#181c25] shadow-[0_10px_26px_rgba(0,0,0,.24)] ${
              isPlaying
                ? "animate-[alumniMusicFloat_3s_ease-in-out_infinite]"
                : ""
            }`}
          >
            {track.artwork_url ? (
              <img
                src={track.artwork_url}
                alt={`Portada de ${track.track_title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(109,124,255,.35),transparent_40%),#161a22]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[#8d98ff]">
              <Sparkles size={11} />
              <span className="text-[9px] font-black uppercase tracking-[0.17em]">
                Mi vibra
              </span>
            </div>

            <p className="mt-1 truncate text-sm font-black text-zinc-100">
              {track.track_title}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-zinc-600">
              {track.artist_name || "Spotify"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleMainAction}
            disabled={!ready && !failed}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.055] text-zinc-200 transition hover:bg-white/[0.09] disabled:cursor-wait disabled:text-zinc-700"
            aria-label={
              failed
                ? "Abrir canción en Spotify"
                : isPlaying
                ? "Pausar fragmento"
                : "Escuchar fragmento"
            }
          >
            {!ready && !failed ? (
              <Loader2 size={15} className="animate-spin" />
            ) : failed ? (
              <ExternalLink size={15} />
            ) : isPlaying ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-[3px] overflow-hidden">
            {BARS.map((height, index) => {
              const active = index / (BARS.length - 1) <= progress;

              return (
                <span
                  key={`${height}-${index}`}
                  className={`w-[3px] shrink-0 rounded-full transition ${
                    active ? "bg-[#8d98ff]/85" : "bg-white/[0.10]"
                  } ${
                    isPlaying
                      ? "animate-[alumniMusicBar_.8s_ease-in-out_infinite_alternate]"
                      : ""
                  }`}
                  style={{
                    height: `${Math.max(5, height * 0.68)}px`,
                    animationDelay: `${index * 22}ms`,
                  }}
                />
              );
            })}
          </div>

          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold tabular-nums text-zinc-700">
            {formatTime(start)}–{formatTime(start + clipDuration)}
          </span>

          <span
            className="shrink-0 text-zinc-700"
            aria-label="Spotify"
            title="Spotify"
          >
            <SpotifyGlyph />
          </span>
        </div>

        {failed && (
          <p className="mt-2 text-[10px] font-bold text-zinc-700">
            El reproductor interno no respondió; el botón abrirá Spotify.
          </p>
        )}

        {error && !failed && (
          <p className="mt-2 text-[10px] font-bold text-red-300/70">
            {error}
          </p>
        )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-0 h-[80px] w-[300px] overflow-hidden opacity-0"
        >
          <div ref={spotifyMountRef} />
        </div>
      </div>

      <style jsx>{`
        @keyframes alumniMusicFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-0.5deg);
          }
          50% {
            transform: translateY(-2px) rotate(0.5deg);
          }
        }

        @keyframes alumniMusicBar {
          from {
            transform: scaleY(0.64);
            opacity: 0.55;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
