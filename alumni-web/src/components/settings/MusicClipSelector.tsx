"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ExternalLink,
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  Scissors,
} from "lucide-react";
import type { SpotifyTrackImport } from "@/lib/profileMusic";
import { useSpotifyClip } from "@/hooks/useSpotifyClip";

type Props = {
  track: SpotifyTrackImport;
  startSeconds: number;
  onStartChange: (value: number) => void;
  onDurationKnown: (value: number) => void;
  clipDurationSeconds?: number;
  knownDurationSeconds?: number | null;
};

const WAVE = [
  12, 20, 29, 15, 34, 21, 11, 27, 38, 18, 31, 13, 25, 39, 16, 30,
  19, 10, 32, 24, 14, 35, 20, 28, 12, 33, 22, 16, 37, 18, 26, 11,
  30, 21, 38, 14, 27, 34, 13, 29, 19, 35, 17, 25, 11, 32, 22, 28,
];

function formatTime(value: number) {
  const safe = Math.max(0, Math.floor(value));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export default function MusicClipSelector({
  track,
  startSeconds,
  onStartChange,
  onDurationKnown,
  clipDurationSeconds = 30,
  knownDurationSeconds = null,
}: Props) {
  const spotifyMountRef = useRef<HTMLDivElement | null>(null);
  const safeClipDuration = Math.max(1, Math.floor(clipDurationSeconds));

  const {
    ready,
    failed,
    isPlaying,
    durationMs,
    toggle,
  } = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl: track.track_url,
    trackId: track.provider_track_id,
    startSeconds,
    clipDurationSeconds: safeClipDuration,
  });

  const spotifyDurationSeconds = Math.floor(durationMs / 1000);

  const durationSeconds =
    spotifyDurationSeconds > 0
      ? spotifyDurationSeconds
      : Math.max(0, Math.floor(knownDurationSeconds || 0));

  const effectiveDuration =
    durationSeconds > safeClipDuration
      ? durationSeconds
      : Math.max(240, safeClipDuration);

  const maxStart = Math.max(0, effectiveDuration - safeClipDuration);

  useEffect(() => {
    if (durationSeconds <= 0) return;

    onDurationKnown(durationSeconds);

    const realMax = Math.max(
      0,
      durationSeconds - safeClipDuration
    );

    if (startSeconds > realMax) {
      onStartChange(realMax);
    }
  }, [
    durationSeconds,
    onDurationKnown,
    onStartChange,
    safeClipDuration,
    startSeconds,
  ]);

  const windowWidth = useMemo(() => {
    if (effectiveDuration <= safeClipDuration) return 100;

    return Math.max(
      8,
      Math.min(
        34,
        (safeClipDuration / effectiveDuration) * 100
      )
    );
  }, [effectiveDuration, safeClipDuration]);

  const leftPercent = useMemo(() => {
    if (maxStart <= 0) return 0;

    const travel = 100 - windowWidth;

    return (
      (Math.min(startSeconds, maxStart) / maxStart) *
      travel
    );
  }, [maxStart, startSeconds, windowWidth]);

  function updateStart(value: number) {
    onStartChange(
      Math.max(
        0,
        Math.min(maxStart, value)
      )
    );
  }

  function nudge(value: number) {
    updateStart(startSeconds + value);
  }

  function handlePreview() {
    if (failed) {
      window.open(
        track.track_url,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    toggle();
  }

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0d1016] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#8d98ff]">
          <Scissors size={14} />

          <p className="text-xs font-black">
            Elige tus {safeClipDuration} segundos
          </p>
        </div>

        <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] font-black tabular-nums text-zinc-600">
          {formatTime(startSeconds)} →{" "}
          {formatTime(startSeconds + safeClipDuration)}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-zinc-700">
        Mueve la selección. Spotify se prepara cuando terminas de moverla, sin hacer múltiples seeks.
      </p>

      <div className="relative mt-5 h-20 overflow-hidden rounded-[14px] border border-white/[0.045] bg-black/10 px-3">
        <div className="absolute inset-x-3 top-1/2 flex h-11 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
          {WAVE.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-[3px] shrink-0 rounded-full bg-white/[0.12]"
              style={{
                height: `${Math.max(
                  5,
                  height * 0.78
                )}px`,
              }}
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-2 rounded-xl border border-[#8d98ff]/55 bg-[#6d7cff]/12 shadow-[0_0_28px_rgba(109,124,255,.12)] transition-[left,width] duration-100"
          style={{
            left: `${leftPercent}%`,
            width: `${windowWidth}%`,
          }}
        />

        <input
          type="range"
          min={0}
          max={maxStart}
          step={1}
          value={Math.min(startSeconds, maxStart)}
          onChange={(event) =>
            updateStart(
              Number(event.target.value)
            )
          }
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Seleccionar inicio del fragmento"
        />
      </div>

      <div className="mt-2 flex justify-between text-[9px] font-bold tabular-nums text-zinc-800">
        <span>0:00</span>

        <span>
          {durationSeconds > 0
            ? formatTime(durationSeconds)
            : "duración pendiente"}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-5)}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
          aria-label="Retroceder cinco segundos"
        >
          <Minus size={12} />
          5s
        </button>

        {/*
          El Play custom queda para escritorio.
          En móvil usamos el Play dentro del Embed oficial.
        */}
        <button
          type="button"
          onClick={handlePreview}
          disabled={!ready && !failed}
          className="hidden h-11 w-14 items-center justify-center rounded-2xl bg-[#6d7cff] text-white shadow-[0_8px_24px_rgba(109,124,255,.18)] transition hover:bg-[#7b87ff] disabled:cursor-wait disabled:opacity-55 md:flex"
          aria-label={
            failed
              ? "Abrir en Spotify"
              : isPlaying
              ? "Pausar"
              : "Reproducir fragmento"
          }
        >
          {!ready && !failed ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : failed ? (
            <ExternalLink size={17} />
          ) : isPlaying ? (
            <Pause
              size={17}
              fill="currentColor"
            />
          ) : (
            <Play
              size={18}
              fill="currentColor"
              className="ml-0.5"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => nudge(5)}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
          aria-label="Avanzar cinco segundos"
        >
          5s
          <Plus size={12} />
        </button>
      </div>

      {/*
        En móvil este es un Spotify Embed REAL y visible.
        Tocar su propio Play es un gesto directo dentro del iframe,
        que es mucho más fiable en iOS/Android.
      */}
      <div className="relative z-20 mt-4 h-[80px] w-full overflow-hidden rounded-xl md:absolute md:-left-[10000px] md:top-0 md:mt-0 md:h-[80px] md:w-[300px] md:overflow-visible md:opacity-[0.01]">
        <div
          ref={spotifyMountRef}
          className="h-[80px] w-full"
        />
      </div>

      <p className="mt-2 text-center text-[10px] leading-4 text-zinc-700 md:hidden">
        En teléfono, toca Play directamente en Spotify.
      </p>

      {failed && (
        <button
          type="button"
          onClick={() =>
            window.open(
              track.track_url,
              "_blank",
              "noopener,noreferrer"
            )
          }
          className="mx-auto mt-2 block text-[10px] font-bold text-[#8d98ff] md:hidden"
        >
          Abrir en Spotify
        </button>
      )}
    </div>
  );
}
