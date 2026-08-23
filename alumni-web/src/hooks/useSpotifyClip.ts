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
  const startRef = useRef(Math.max(0, startSeconds));
  const clipDurationRef = useRef(clipDurationSeconds);
  const playingRef = useRef(false);
  const seekPendingRef = useRef(false);
  const seekCorrectionDoneRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(startSeconds * 1000);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    startRef.current = Math.max(0, Math.floor(startSeconds));
    seekCorrectionDoneRef.current = false;
    setPositionMs(startRef.current * 1000);

    const controller = controllerRef.current;

    // Si el controlador ya está listo, mover el selector NO vuelve a cargar
    // la canción ni el iframe. Solo actualizamos la posición.
    if (controller && ready && !playingRef.current) {
      try {
        controller.seek?.(startRef.current);
      } catch {
        // Spotify puede ignorar seek en algunos contextos.
      }
    }
  }, [startSeconds, ready]);

  useEffect(() => {
    clipDurationRef.current = clipDurationSeconds;
  }, [clipDurationSeconds]);

  useEffect(() => {
    let cancelled = false;
    let controllerTimeout: number | null = null;

    setReady(false);
    setFailed(false);
    setError("");

    if (!mountRef.current || !trackUrl) return;

    async function createPlayer() {
      try {
        const api = await loadSpotifyIframeApi();

        if (cancelled || !mountRef.current) return;

        controllerTimeout = window.setTimeout(() => {
          if (cancelled || controllerRef.current) return;

          setFailed(true);
          setError(
            "Spotify tardó demasiado en iniciar. Puedes guardar el fragmento igualmente."
          );
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

            if (controllerTimeout !== null) {
              window.clearTimeout(controllerTimeout);
              controllerTimeout = null;
            }

            controllerRef.current = controller;
            setReady(true);
            setFailed(false);
            setError("");

            controller.addListener?.("ready", () => {
              setReady(true);
              setFailed(false);
              setError("");
            });

            controller.addListener?.("playback_started", () => {
              playingRef.current = true;
              setIsPlaying(true);

              // No usamos loadEntity() aquí.
              // loadEntity recargaba el embed y visualmente parecía un F5.
              // Intentamos posicionar el controlador ya existente.
              if (seekPendingRef.current) {
                seekPendingRef.current = false;

                window.setTimeout(() => {
                  try {
                    controller.seek?.(startRef.current);
                  } catch {
                    // No crítico.
                  }
                }, 80);
              }
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

              // Una sola corrección por reproducción. Evita bucles/reloads.
              if (
                !paused &&
                startRef.current > 0 &&
                nextPosition + 1500 < startMs &&
                !seekCorrectionDoneRef.current
              ) {
                seekCorrectionDoneRef.current = true;

                try {
                  controller.seek?.(startRef.current);
                } catch {
                  // Spotify puede limitar seek para algunos tracks/entornos.
                }
              }

              if (!paused && nextPosition >= endMs - 180) {
                controller.pause?.();
                playingRef.current = false;
                setIsPlaying(false);
                setPositionMs(startMs);
                seekCorrectionDoneRef.current = false;
              }
            });
          }
        );
      } catch (playerError: any) {
        if (!cancelled) {
          setFailed(true);
          setError(
            playerError?.message ||
              "Spotify no pudo iniciar aquí. Puedes guardar el fragmento igualmente."
          );
        }
      }
    }

    void createPlayer();

    return () => {
      cancelled = true;

      if (controllerTimeout !== null) {
        window.clearTimeout(controllerTimeout);
      }

      seekPendingRef.current = false;
      seekCorrectionDoneRef.current = false;
      playingRef.current = false;
      setIsPlaying(false);
      setReady(false);

      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [mountRef, trackId, trackUrl]);

  const play = useCallback(() => {
    const controller = controllerRef.current;

    if (!controller || !ready) return;

    seekPendingRef.current = true;
    seekCorrectionDoneRef.current = false;

    // IMPORTANTE:
    // Antes hacíamos loadEntity(trackUrl, false, start) cada vez que pulsabas
    // play. Eso recargaba el Spotify Embed y parecía un refresh/F5.
    // Ahora la canción se carga UNA VEZ al crear el controlador.
    try {
      controller.seek?.(startRef.current);
    } catch {
      // El segundo intento se hace al recibir playback_started.
    }

    controller.play?.();
  }, [ready]);

  const pause = useCallback(() => {
    seekPendingRef.current = false;
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
