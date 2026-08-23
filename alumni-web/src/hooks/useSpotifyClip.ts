"use client";

import {
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadSpotifyIframeApi } from "@/lib/spotifyIframe";

type Options = {
  mountRef: RefObject<HTMLDivElement | null>;
  trackUrl: string;
  trackId?: string | null;
  startSeconds: number;
  clipDurationSeconds?: number;
};

export function useSpotifyClip({
  mountRef,
  trackUrl,
  trackId,
  startSeconds,
  clipDurationSeconds = 30,
}: Options) {
  const controllerRef = useRef<any>(null);
  const startRef = useRef(Math.max(0, Math.floor(startSeconds)));
  const clipDurationRef = useRef(clipDurationSeconds);
  const playingRef = useRef(false);
  const preparedRef = useRef(false);
  const correctionDoneRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(startSeconds * 1000);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    startRef.current = Math.max(0, Math.floor(startSeconds));
    correctionDoneRef.current = false;
    setPositionMs(startRef.current * 1000);

    // En el editor movemos solo el cursor del controlador existente.
    // No recargamos la entidad al mover el slider.
    if (controllerRef.current && ready && !playingRef.current) {
      try {
        controllerRef.current.seek?.(startRef.current);
      } catch {
        // Spotify puede ignorar seek para algunos tracks.
      }
    }
  }, [startSeconds, ready]);

  useEffect(() => {
    clipDurationRef.current = clipDurationSeconds;
  }, [clipDurationSeconds]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;

    setReady(false);
    setFailed(false);
    setError("");
    preparedRef.current = false;

    if (!mountRef.current || !trackUrl) return;

    async function setup() {
      try {
        const api = await loadSpotifyIframeApi();

        if (cancelled || !mountRef.current) return;

        timeoutId = window.setTimeout(() => {
          if (cancelled || controllerRef.current) return;
          setFailed(true);
          setError("Spotify tardó demasiado en iniciar.");
        }, 7000);

        api.createController(
          mountRef.current,
          {
            url: trackUrl,
            width: 300,
            height: 80,
          },
          (controller: any) => {
            if (cancelled) {
              controller?.destroy?.();
              return;
            }

            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
              timeoutId = null;
            }

            controllerRef.current = controller;

            const prepareSelectedStart = () => {
              if (preparedRef.current) return;
              preparedRef.current = true;

              // Preparamos el punto elegido UNA sola vez al inicializar.
              // Antes se hacía loadEntity() en cada Play y eso parecía un F5.
              if (startRef.current > 0) {
                try {
                  controller.loadEntity?.(
                    trackUrl,
                    false,
                    startRef.current
                  );
                } catch {
                  try {
                    controller.seek?.(startRef.current);
                  } catch {
                    // Fallback no crítico.
                  }
                }
              }

              window.setTimeout(() => {
                if (!cancelled) {
                  setReady(true);
                  setFailed(false);
                  setError("");
                }
              }, startRef.current > 0 ? 220 : 0);
            };

            controller.addListener?.("ready", prepareSelectedStart);
            prepareSelectedStart();

            controller.addListener?.("playback_started", () => {
              playingRef.current = true;
              correctionDoneRef.current = false;
              setIsPlaying(true);
            });

            controller.addListener?.("playback_update", (event: any) => {
              const state = event?.data || {};
              const nextDuration = Number(state.duration || 0);
              const nextPosition = Number(state.position || 0);
              const paused = Boolean(state.isPaused);

              if (nextDuration > 0) setDurationMs(nextDuration);
              if (nextPosition >= 0) setPositionMs(nextPosition);

              playingRef.current = !paused;
              setIsPlaying(!paused);

              const startMs = startRef.current * 1000;
              const endMs =
                (startRef.current + clipDurationRef.current) * 1000;

              // Solo una corrección. No hay loops ni reloads.
              if (
                !paused &&
                startRef.current > 0 &&
                nextPosition + 1500 < startMs &&
                !correctionDoneRef.current
              ) {
                correctionDoneRef.current = true;

                try {
                  controller.seek?.(startRef.current);
                } catch {
                  // Spotify Embed no garantiza seek exacto en canciones.
                }
              }

              if (!paused && nextPosition >= endMs - 180) {
                controller.pause?.();
                playingRef.current = false;
                setIsPlaying(false);
              }
            });
          }
        );
      } catch (setupError: any) {
        if (!cancelled) {
          setFailed(true);
          setError(
            setupError?.message || "No se pudo inicializar Spotify."
          );
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      playingRef.current = false;
      preparedRef.current = false;
      correctionDoneRef.current = false;
      setIsPlaying(false);
      setReady(false);

      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [mountRef, trackId, trackUrl]);

  const play = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller || !ready) return;

    // NO loadEntity aquí: Play nunca vuelve a cargar el embed.
    try {
      controller.seek?.(startRef.current);
    } catch {
      // El startAt preparado durante init sigue siendo el respaldo.
    }

    controller.play?.();
  }, [ready]);

  const pause = useCallback(() => {
    controllerRef.current?.pause?.();
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  return {
    ready,
    failed,
    isPlaying,
    positionMs,
    durationMs,
    error,
    play,
    pause,
    toggle,
  };
}
