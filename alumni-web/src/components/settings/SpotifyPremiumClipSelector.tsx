"use client";

import {
  Loader2,
  Minus,
  Pause,
  Play,
  Plus,
  Scissors,
} from "lucide-react";
import {
  useEffect,
  useMemo,
} from "react";
import { useSpotifyPremiumPlayer } from "@/hooks/useSpotifyPremiumPlayer";
import type { SpotifyTrackImport } from "@/lib/profileMusic";

type Props = {
  track: SpotifyTrackImport;
  startSeconds: number;
  onStartChange: (value: number) => void;
  clipDurationSeconds?: number;
  knownDurationSeconds?: number | null;
};

const WAVE = [
  12, 20, 29, 15, 34, 21, 11, 27, 38, 18, 31, 13,
  25, 39, 16, 30, 19, 10, 32, 24, 14, 35, 20, 28,
  12, 33, 22, 16, 37, 18, 26, 11, 30, 21, 38, 14,
  27, 34, 13, 29, 19, 35, 17, 25, 11, 32, 22, 28,
];

function formatTime(value: number) {
  const safe = Math.max(
    0,
    Math.floor(value)
  );

  return `${Math.floor(
    safe / 60
  )}:${String(safe % 60).padStart(
    2,
    "0"
  )}`;
}

export default function SpotifyPremiumClipSelector({
  track,
  startSeconds,
  onStartChange,
  clipDurationSeconds = 30,
  knownDurationSeconds = null,
}: Props) {
  const safeClipDuration =
    Math.max(
      1,
      Math.floor(
        clipDurationSeconds
      )
    );

  const sourceDuration =
    knownDurationSeconds ||
    (track.duration_ms
      ? Number(track.duration_ms) / 1000
      : 0);

  const durationSeconds =
    Math.max(
      safeClipDuration,
      Math.floor(
        Number(sourceDuration || 0)
      )
    );

  const effectiveDuration =
    durationSeconds > 0
      ? durationSeconds
      : 240;

  const maxStart = Math.max(
    0,
    effectiveDuration -
      safeClipDuration
  );

  const {
    ready,
    isPlaying,
    error,
    playFragment,
    pause,
  } = useSpotifyPremiumPlayer({
    enabled: Boolean(
      track.provider_track_id
    ),
  });

  useEffect(() => {
    if (isPlaying) {
      void pause();
    }
  }, [startSeconds]);

  const windowWidth = useMemo(
    () =>
      Math.max(
        8,
        Math.min(
          34,
          (safeClipDuration /
            effectiveDuration) *
            100
        )
      ),
    [
      effectiveDuration,
      safeClipDuration,
    ]
  );

  const leftPercent = useMemo(() => {
    if (maxStart <= 0) return 0;

    return (
      (Math.min(
        startSeconds,
        maxStart
      ) /
        maxStart) *
      (100 - windowWidth)
    );
  }, [
    maxStart,
    startSeconds,
    windowWidth,
  ]);

  function updateStart(value: number) {
    onStartChange(
      Math.max(
        0,
        Math.min(
          maxStart,
          value
        )
      )
    );
  }

  async function toggle() {
    if (isPlaying) {
      await pause();
      return;
    }

    if (!track.provider_track_id) {
      return;
    }

    await playFragment({
      trackId:
        track.provider_track_id,
      startSeconds,
      durationSeconds:
        safeClipDuration,
    });
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0b0e13] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#1ed760]">
          <Scissors size={14} />

          <p className="text-xs font-black">
            Tu fragmento
          </p>
        </div>

        <span className="rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] font-black tabular-nums text-zinc-500">
          {formatTime(
            startSeconds
          )}{" "}
          →{" "}
          {formatTime(
            startSeconds +
              safeClipDuration
          )}
        </span>
      </div>

      <p className="mt-2 text-[11px] leading-5 text-zinc-700">
        El selector es completamente local: muévelo con libertad y Spotify solo recibe una orden cuando presionas reproducir.
      </p>

      <div className="relative mt-5 h-24 overflow-hidden rounded-[16px] border border-white/[0.045] bg-black/20 px-3">
        <div className="absolute inset-x-3 top-1/2 flex h-12 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
          {WAVE.map(
            (height, index) => (
              <span
                key={`${height}-${index}`}
                className="w-[3px] shrink-0 rounded-full bg-white/[0.11]"
                style={{
                  height: `${Math.max(
                    5,
                    height * 0.82
                  )}px`,
                }}
              />
            )
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-y-2 rounded-[14px] border border-[#1ed760]/45 bg-[#1ed760]/[0.07] shadow-[0_0_32px_rgba(30,215,96,.08)] transition-[left,width] duration-75"
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
          value={Math.min(
            startSeconds,
            maxStart
          )}
          onChange={(event) =>
            updateStart(
              Number(
                event.target.value
              )
            )
          }
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
          aria-label="Seleccionar inicio del fragmento"
        />
      </div>

      <div className="mt-2 flex justify-between text-[9px] font-bold tabular-nums text-zinc-800">
        <span>0:00</span>

        <span>
          {formatTime(
            effectiveDuration
          )}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() =>
            updateStart(
              startSeconds - 5
            )
          }
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
        >
          <Minus size={12} />
          5s
        </button>

        <button
          type="button"
          onClick={toggle}
          disabled={!ready}
          className="flex h-12 min-w-[116px] items-center justify-center gap-2 rounded-2xl bg-[#1ed760] px-4 text-xs font-black text-[#07110a] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-50"
        >
          {!ready ? (
            <>
              <Loader2
                size={15}
                className="animate-spin"
              />
              Preparando
            </>
          ) : isPlaying ? (
            <>
              <Pause
                size={15}
                fill="currentColor"
              />
              Pausar
            </>
          ) : (
            <>
              <Play
                size={15}
                fill="currentColor"
              />
              Probar
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            updateStart(
              startSeconds + 5
            )
          }
          className="flex h-9 items-center gap-1 rounded-xl border border-white/[0.06] px-3 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
        >
          5s
          <Plus size={12} />
        </button>
      </div>

      {error && (
        <p className="mt-4 text-center text-[10px] font-bold leading-5 text-red-300/75">
          {error}
        </p>
      )}
    </div>
  );
}
