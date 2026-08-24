"use client";

import {
  Loader2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
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

function formatTime(
  value: number
) {
  const safe = Math.max(
    0,
    Math.floor(value)
  );

  return `${Math.floor(
    safe / 60
  )}:${String(
    safe % 60
  ).padStart(2, "0")}`;
}

export default function SpotifyPremiumClipSelector({
  track,
  startSeconds,
  onStartChange,
  clipDurationSeconds = 30,
  knownDurationSeconds = null,
}: Props) {
  const seekTimerRef =
    useRef<number | null>(null);

  const lastAutoTrackRef =
    useRef("");

  const dragRef =
    useRef<{
      active: boolean;
      pointerId: number | null;
    }>({
      active: false,
      pointerId: null,
    });

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
      ? Number(
          track.duration_ms
        ) / 1000
      : 0);

  const durationSeconds =
    Math.max(
      safeClipDuration,
      Math.floor(
        Number(
          sourceDuration || 0
        )
      )
    );

  const effectiveDuration =
    durationSeconds > 0
      ? durationSeconds
      : 240;

  const maxStart =
    Math.max(
      0,
      effectiveDuration -
        safeClipDuration
    );

  const {
    ready,
    error,
    activateElement,
    startContinuousFragment,
    seekContinuousFragment,
  } =
    useSpotifyPremiumPlayer({
      enabled: Boolean(
        track.provider_track_id
      ),
    });

  useEffect(() => {
    const trackId =
      track.provider_track_id;

    if (
      !ready ||
      !trackId ||
      lastAutoTrackRef.current ===
        trackId
    ) {
      return;
    }

    lastAutoTrackRef.current =
      trackId;

    void startContinuousFragment({
      trackId,
      startSeconds:
        Math.min(
          startSeconds,
          maxStart
        ),
      durationSeconds:
        safeClipDuration,
    });
  }, [
    ready,
    track.provider_track_id,
    maxStart,
    safeClipDuration,
    startSeconds,
    startContinuousFragment,
  ]);

  useEffect(() => {
    return () => {
      if (
        seekTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          seekTimerRef.current
        );
      }
    };
  }, []);

  const windowWidth =
    useMemo(
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

  const leftPercent =
    useMemo(() => {
      if (maxStart <= 0) {
        return 0;
      }

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

  function clampStart(
    value: number
  ) {
    return Math.max(
      0,
      Math.min(
        maxStart,
        value
      )
    );
  }

  function queueSeek(
    value: number
  ) {
    const next =
      clampStart(value);

    onStartChange(next);

    if (
      seekTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        seekTimerRef.current
      );
    }

    seekTimerRef.current =
      window.setTimeout(
        async () => {
          seekTimerRef.current =
            null;

          const moved =
            await seekContinuousFragment({
              startSeconds:
                next,
              durationSeconds:
                safeClipDuration,
            });

          if (
            !moved &&
            track.provider_track_id
          ) {
            await startContinuousFragment({
              trackId:
                track.provider_track_id,
              startSeconds:
                next,
              durationSeconds:
                safeClipDuration,
            });
          }
        },
        85
      );
  }

  function valueFromPointer(
    element: HTMLDivElement,
    clientX: number
  ) {
    const rect =
      element.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      maxStart <= 0
    ) {
      return 0;
    }

    const x =
      Math.max(
        0,
        Math.min(
          rect.width,
          clientX - rect.left
        )
      );

    const ratio =
      x / rect.width;

    /*
     * El gesto representa el CENTRO visual del cuadro de 30 s.
     * Así el cuadro se siente pegado al dedo, tipo IG.
     */
    const halfWindow =
      (windowWidth / 100) / 2;

    const normalized =
      Math.max(
        0,
        Math.min(
          1,
          (ratio - halfWindow) /
            Math.max(
              0.001,
              1 -
                windowWidth / 100
            )
        )
      );

    return Math.round(
      normalized * maxStart
    );
  }

  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!ready) {
      return;
    }

    activateElement();

    dragRef.current = {
      active: true,
      pointerId:
        event.pointerId,
    };

    event.currentTarget
      .setPointerCapture?.(
        event.pointerId
      );

    const next =
      valueFromPointer(
        event.currentTarget,
        event.clientX
      );

    queueSeek(next);
  }

  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (
      !dragRef.current
        .active ||
      dragRef.current
        .pointerId !==
        event.pointerId
    ) {
      return;
    }

    const next =
      valueFromPointer(
        event.currentTarget,
        event.clientX
      );

    queueSeek(next);
  }

  function stopDragging(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (
      dragRef.current
        .pointerId !==
        event.pointerId
    ) {
      return;
    }

    dragRef.current = {
      active: false,
      pointerId: null,
    };

    try {
      event.currentTarget
        .releasePointerCapture?.(
          event.pointerId
        );
    } catch {}
  }

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0b0e13] p-4 sm:p-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="border-l-2 border-[#1ed760]/35 pl-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">
            Inicio
          </p>

          <p className="mt-1 text-sm font-black tabular-nums text-zinc-200">
            {formatTime(
              startSeconds
            )}
          </p>
        </div>

        <div className="border-l-2 border-white/[0.07] pl-3">
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-700">
            Fin
          </p>

          <p className="mt-1 text-sm font-black tabular-nums text-zinc-200">
            {formatTime(
              startSeconds +
                safeClipDuration
            )}
          </p>
        </div>
      </div>

      <div
        className="relative mt-5 h-28 select-none overflow-hidden rounded-[18px] border border-white/[0.045] bg-black/20 px-3"
        style={{
          touchAction:
            "none",
        }}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          stopDragging
        }
        onPointerCancel={
          stopDragging
        }
      >
        <div className="pointer-events-none absolute inset-x-3 top-1/2 flex h-14 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
          {WAVE.map(
            (
              height,
              index
            ) => (
              <span
                key={`${height}-${index}`}
                className="w-[3px] shrink-0 rounded-full bg-white/[0.11]"
                style={{
                  height: `${Math.max(
                    5,
                    height * 0.9
                  )}px`,
                }}
              />
            )
          )}
        </div>

        <div
          className="pointer-events-none absolute inset-y-2 rounded-[15px] border border-[#1ed760]/55 bg-[#1ed760]/[0.08] shadow-[0_0_32px_rgba(30,215,96,.08)]"
          style={{
            left:
              `${leftPercent}%`,
            width:
              `${windowWidth}%`,
          }}
        >
          <span className="absolute left-1 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-[#1ed760]/80" />

          <span className="absolute right-1 top-1/2 h-8 w-[2px] -translate-y-1/2 rounded-full bg-[#1ed760]/80" />
        </div>

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
            queueSeek(
              Number(
                event.target
                  .value
              )
            )
          }
          className="sr-only"
          aria-label="Mover fragmento de 30 segundos"
        />

        {!ready && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#0b0e13]/55 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500">
              <Loader2
                size={14}
                className="animate-spin"
              />

              Preparando audio
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[9px] font-bold tabular-nums text-zinc-800">
        <span>0:00</span>

        <span>
          {formatTime(
            effectiveDuration
          )}
        </span>
      </div>

      {error && (
        <p className="mt-3 text-[10px] font-bold leading-5 text-amber-300/75">
          {error}
        </p>
      )}
    </div>
  );
}
