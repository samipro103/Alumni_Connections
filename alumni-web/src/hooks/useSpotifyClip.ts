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
  const startChangeTimerRef = useRef<number | null>(null);
  const restartAfterSeekRef = useRef(false);
  const transitionUntilRef = useRef(0);
  const correctionWindowUntilRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(startSeconds * 1000);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const nextStart = Math.max(0, Math.floor(startSeconds));
    startRef.current = nextStart;
    correctionDoneRef.current = false;
    setPositionMs(nextStart * 1000);

    const controller = controllerRef.current;
    if (!controller || !ready) return;

    if (startChangeTimerRef.current !== null) {
      window.clearTimeout(startChangeTimerRef.current);
      startChangeTimerRef.current = null;
    }

    // Si el usuario mueve el selector mientras suena, pausamos una sola vez.
    // Después esperamos a que deje de moverlo para hacer UN seek y reanudar.
    // Esto evita una lluvia de seek/play que era la causa principal del bug.
    if (playingRef.current) {
      restartAfterSeekRef.current = true;
      try {
        controller.pause?.();
      } catch {}
      playingRef.current = false;
      setIsPlaying(false);
    }

    startChangeTimerRef.current = window.setTimeout(() => {
      startChangeTimerRef.current = null;
      const latestController = controllerRef.current;
      if (!latestController) return;

      transitionUntilRef.current = Date.now() + 900;
      correctionWindowUntilRef.current = Date.now() + 1800;
      correctionDoneRef.current = false;

      try {
        latestController.seek?.(startRef.current);
      } catch {}

      if (restartAfterSeekRef.current) {
        restartAfterSeekRef.current = false;
        window.setTimeout(() => {
          const activeController = controllerRef.current;
          if (!activeController) return;
          try {
            activeController.play?.();
          } catch {}
        }, 90);
      }
    }, 220);
  }, [startSeconds, ready]);

  useEffect(() => {
    clipDurationRef.current = Math.max(1, clipDurationSeconds);
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
                  } catch {}
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
              // Ignora un playback_started viejo mientras el usuario todavía
              // está moviendo el fragmento. El nuevo play llegará después.
              if (startChangeTimerRef.current !== null) return;

              playingRef.current = true;
              correctionDoneRef.current = false;
              correctionWindowUntilRef.current = Date.now() + 1800;
              setIsPlaying(true);
            });

            controller.addListener?.("playback_update", (event: any) => {
              const state = event?.data || {};
              const nextDuration = Number(state.duration || 0);
              const nextPosition = Number(state.position || 0);
              const paused = Boolean(state.isPaused);

              if (nextDuration > 0) setDurationMs(nextDuration);

              // Durante un cambio de fragmento pueden llegar eventos viejos.
              // Los ignoramos por un instante para que no salte el UI ni se pause
              // usando la posición anterior.
              if (Date.now() < transitionUntilRef.current) return;

              if (nextPosition >= 0) setPositionMs(nextPosition);

              playingRef.current = !paused;
              setIsPlaying(!paused);

              const startMs = startRef.current * 1000;
              const endMs =
                (startRef.current + clipDurationRef.current) * 1000;

              // Corrección única justo al iniciar/reanudar el fragmento.
              // Sirve tanto si Spotify quedó antes como después del nuevo inicio.
              if (
                !paused &&
                Date.now() < correctionWindowUntilRef.current &&
                Math.abs(nextPosition - startMs) > 2200 &&
                !correctionDoneRef.current
              ) {
                correctionDoneRef.current = true;
                transitionUntilRef.current = Date.now() + 600;

                try {
                  controller.seek?.(startRef.current);
                } catch {}
                return;
              }

              if (!paused && nextPosition >= endMs - 180) {
                try {
                  controller.pause?.();
                } catch {}
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

      if (startChangeTimerRef.current !== null) {
        window.clearTimeout(startChangeTimerRef.current);
        startChangeTimerRef.current = null;
      }

      playingRef.current = false;
      preparedRef.current = false;
      correctionDoneRef.current = false;
      restartAfterSeekRef.current = false;
      transitionUntilRef.current = 0;
      correctionWindowUntilRef.current = 0;
      setIsPlaying(false);
      setReady(false);

      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [mountRef, trackId, trackUrl]);

  const play = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller || !ready) return;

    transitionUntilRef.current = Date.now() + 650;
    correctionWindowUntilRef.current = Date.now() + 1800;
    correctionDoneRef.current = false;

    try {
      controller.seek?.(startRef.current);
    } catch {}

    window.setTimeout(() => {
      try {
        controllerRef.current?.play?.();
      } catch {}
    }, 70);
  }, [ready]);

  const pause = useCallback(() => {
    restartAfterSeekRef.current = false;
    try {
      controllerRef.current?.pause?.();
    } catch {}
    playingRef.current = false;
    setIsPlaying(false);
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
