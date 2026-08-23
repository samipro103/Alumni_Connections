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
  const pendingSeekRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(startSeconds * 1000);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    startRef.current = Math.max(0, Math.floor(startSeconds));
    setPositionMs(startRef.current * 1000);
  }, [startSeconds]);

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
            "Spotify tardó demasiado en iniciar. Aún puedes elegir y guardar tu fragmento."
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

            // El callback ya significa que tenemos un controlador utilizable.
            // Antes esperábamos solo el evento "ready", que en algunos WebViews
            // podía haberse disparado antes de registrar el listener.
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

              if (pendingSeekRef.current) {
                pendingSeekRef.current = false;
                try {
                  controller.seek?.(startRef.current);
                } catch {
                  // loadEntity(startAt) sigue siendo la ruta principal.
                }
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

              // Si Spotify arranca desde otro punto, corregimos una sola vez.
              if (
                !paused &&
                nextPosition + 1200 < startMs &&
                !pendingSeekRef.current
              ) {
                try {
                  controller.seek?.(startRef.current);
                } catch {
                  // No crítico.
                }
              }

              if (!paused && nextPosition >= endMs - 150) {
                controller.pause?.();
                playingRef.current = false;
                setIsPlaying(false);
                setPositionMs(startMs);
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

      pendingSeekRef.current = false;
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

    const start = startRef.current;
    pendingSeekRef.current = true;

    try {
      controller.loadEntity?.(trackUrl, false, start);
    } catch {
      // Si la entidad ya está cargada, usamos seek como respaldo.
      try {
        controller.seek?.(start);
      } catch {
        // No crítico.
      }
    }

    window.setTimeout(() => {
      controller.play?.();
    }, 60);
  }, [ready, trackUrl]);

  const pause = useCallback(() => {
    pendingSeekRef.current = false;
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
