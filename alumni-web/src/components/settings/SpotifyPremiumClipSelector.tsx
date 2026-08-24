"use client";

import {
  Loader2,
  Scissors,
  Volume2,
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
    isPlaying,
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

  /*
   * Intentamos empezar automáticamente apenas el SDK está listo.
   * En escritorio normalmente arranca de inmediato.
   * En iPhone, el primer toque/arrastre sobre la onda activa el audio.
   */
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

    /*
     * UI inmediata: el cuadro verde y los tiempos cambian
     * en cada movimiento del dedo.
     */
    onStartChange(next);

    /*
     * Audio fluido: máximo ~10 seeks por segundo.
     * Suficiente para sentirse instantáneo sin saturar el SDK.
     */
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
        95
      );
  }

  function handlePointerDown() {
    /*
     * Debe ocurrir dentro del gesto real del usuario.
     * Esto es lo que hace confiable el audio en Safari/iPhone.
     */
    activateElement();

    if (
      track.provider_track_id
    ) {
      void startContinuousFragment({
        trackId:
          track.provider_track_id,
        startSeconds:
          clampStart(
            startSeconds
          ),
        durationSeconds:
          safeClipDuration,
      });
    }
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

        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              ready &&
              isPlaying
                ? "bg-[#1ed760] shadow-[0_0_10px_rgba(30,215,96,.7)]"
                : "bg-zinc-700"
            }`}
          />

          <span className="text-[9px] font-black uppercase tracking-[0.11em] text-zinc-700">
            {!ready
              ? "Preparando"
              : isPlaying
              ? "En vivo"
              : "Toca la onda"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
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

      <p className="mt-4 text-[11px] leading-5 text-zinc-700">
        Arrastra sobre la onda. El fragmento cambia mientras mueves el dedo y los mismos 30 segundos se repiten automáticamente.
      </p>

      <div
        className="relative mt-5 h-28 overflow-hidden rounded-[18px] border border-white/[0.045] bg-black/20 px-3 touch-pan-y"
        onPointerDown={
          handlePointerDown
        }
      >
        <div className="absolute inset-x-3 top-1/2 flex h-14 -translate-y-1/2 items-center justify-between gap-[2px] overflow-hidden">
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
          onPointerDown={
            handlePointerDown
          }
          onChange={(event) =>
            queueSeek(
              Number(
                event.target
                  .value
              )
            )
          }
          className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
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

      <div className="mt-5 flex items-center gap-2 border-t border-white/[0.05] pt-4">
        <Volume2
          size={13}
          className={
            isPlaying
              ? "text-[#1ed760]"
              : "text-zinc-700"
          }
        />

        <p className="text-[10px] font-bold leading-5 text-zinc-700">
          {isPlaying
            ? "Reproducción continua activa. Mueve el selector y escucha el cambio al instante."
            : "Toca o arrastra la onda para activar la reproducción continua."}
        </p>
      </div>

      {error && (
        <p className="mt-3 text-[10px] font-bold leading-5 text-amber-300/75">
          {error}
        </p>
      )}
    </div>
  );
}
