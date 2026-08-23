"use client";

import { Check } from "lucide-react";
import { useMemo } from "react";

type Props = {
  startSeconds: number;
  durationSeconds: number;
  confirmed: boolean;
  onStartChange: (value: number) => void;
  onConfirm: () => void;
};

const WAVE = [
  12, 20, 29, 15, 34, 21, 11, 27, 38, 18, 31, 13, 25, 39, 16, 30,
  19, 10, 32, 24, 14, 35, 20, 28, 12, 33, 22, 16, 37, 18, 26, 11,
  30, 21, 38, 14, 27, 34, 13, 29, 19, 35, 17, 25, 11, 32, 22, 28,
];

const CLIP_SECONDS = 15;

function formatTime(value: number) {
  const safe = Math.max(0, Math.floor(value));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export default function StoryMusicStartPicker({
  startSeconds,
  durationSeconds,
  confirmed,
  onStartChange,
  onConfirm,
}: Props) {
  const effectiveDuration = Math.max(
    CLIP_SECONDS,
    Math.floor(durationSeconds || 240)
  );
  const maxStart = Math.max(0, effectiveDuration - CLIP_SECONDS);

  const windowWidth = useMemo(() => {
    if (effectiveDuration <= CLIP_SECONDS) return 100;

    return Math.max(
      7,
      Math.min(28, (CLIP_SECONDS / effectiveDuration) * 100)
    );
  }, [effectiveDuration]);

  const leftPercent = useMemo(() => {
    if (maxStart <= 0) return 0;

    const travel = 100 - windowWidth;
    return (Math.min(startSeconds, maxStart) / maxStart) * travel;
  }, [maxStart, startSeconds, windowWidth]);

  function updateStart(value: number) {
    onStartChange(Math.max(0, Math.min(maxStart, Math.floor(value))));
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[68px] overflow-hidden rounded-[16px] border border-white/[0.055] bg-black/10 px-3">
        <div className="absolute inset-x-3 top-1/2 flex h-11 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
          {WAVE.map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="w-[3px] shrink-0 rounded-full bg-white/[0.12]"
              style={{
                height: `${Math.max(5, height * 0.78)}px`,
              }}
            />
          ))}
        </div>

        <div
          className="pointer-events-none absolute inset-y-2 rounded-xl border border-[#8d98ff]/60 bg-[#6d7cff]/14 shadow-[0_0_24px_rgba(109,124,255,.12)] transition-[left,width] duration-75"
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
          onChange={(event) => updateStart(Number(event.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Elegir dónde empieza la canción"
        />
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className={`flex h-10 w-full items-center justify-center gap-2 rounded-xl text-xs font-black transition ${
          confirmed
            ? "bg-white/[0.07] text-zinc-300"
            : "bg-[#6d7cff] text-white hover:bg-[#7b87ff]"
        }`}
      >
        {confirmed && <Check size={14} />}
        {confirmed
          ? `Inicio confirmado · ${formatTime(startSeconds)}`
          : `Confirmar inicio · ${formatTime(startSeconds)}`}
      </button>
    </div>
  );
}
