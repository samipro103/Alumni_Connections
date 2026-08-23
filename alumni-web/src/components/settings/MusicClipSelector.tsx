"use client";

import { useEffect, useRef } from "react";
import {
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
}: Props) {
  const spotifyMountRef = useRef<HTMLDivElement | null>(null);

  const {
    ready,
    isPlaying,
    durationMs,
    toggle,
  } = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl: track.track_url,
    trackId: track.provider_track_id,
    startSeconds,
    clipDurationSeconds: 30,
  });

  const durationSeconds = Math.floor(durationMs / 1000);
  const effectiveDuration = durationSeconds > 30 ? durationSeconds : 240;
  const maxStart = Math.max(0, effectiveDuration - 30);

  useEffect(() => {
    if (durationSeconds <= 0) return;

    onDurationKnown(durationSeconds);

    const realMax = Math.max(0, durationSeconds - 30);
    if (startSeconds > realMax) {
      onStartChange(realMax);
    }
  }, [
    durationSeconds,
    onDurationKnown,
    onStartChange,
    startSeconds,
  ]);

  function updateStart(value: number) {
    onStartChange(Math.max(0, Math.min(maxStart, value)));
  }

  function nudge(value: number) {
    updateStart(startSeconds + value);
  }

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-white/[0.07] bg-[#0d1016] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#8d98ff]">
          <Scissors size={14} />
          <p className="text-xs font-black">
            Elige tus 30 segundos
          </p>
        </div>

        <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] font-black tabular-nums text-zinc-600">
          {formatTime(startSeconds)} → {formatTime(startSeconds + 30)}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-zinc-700">
        Arrastra sobre las ondas para elegir qué parte de la canción quieres
        mostrar.
      </p>

      <div className="relative mt-5 h-16">
        <div className="absolute inset-x-0 top-1/2 flex h-10 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
          {WAVE.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-[3px] shrink-0 rounded-full bg-white/[0.11]"
              style={{
                height: `${Math.max(5, height * 0.76)}px`,
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-2 left-1/2 w-[22%] -translate-x-1/2 rounded-xl border border-[#8d98ff]/45 bg-[#6d7cff]/10 shadow-[0_0_26px_rgba(109,124,255,.08)]" />

        <input
          type="range"
          min={0}
          max={maxStart}
          step={1}
          value={Math.min(startSeconds, maxStart)}
          onChange={(event) =>
            updateStart(Number(event.target.value))
          }
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Seleccionar inicio del fragmento"
        />
      </div>

      <div className="mt-1 flex justify-between text-[9px] font-bold tabular-nums text-zinc-800">
        <span>0:00</span>
        <span>
          {durationSeconds > 0
            ? formatTime(durationSeconds)
            : "toca Probar para detectar duración"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => nudge(-5)}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
        >
          <Minus size={12} />
          5s
        </button>

        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[#6d7cff] px-3 text-[10px] font-black text-white transition hover:bg-[#7b87ff] disabled:cursor-wait disabled:opacity-50"
        >
          {!ready ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={13} fill="currentColor" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
          {isPlaying ? "Pausar" : "Probar 30 segundos"}
        </button>

        <button
          type="button"
          onClick={() => nudge(5)}
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
        >
          5s
          <Plus size={12} />
        </button>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] top-0 h-[80px] w-[300px] overflow-hidden opacity-0"
      >
        <div ref={spotifyMountRef} />
      </div>
    </div>
  );
}
