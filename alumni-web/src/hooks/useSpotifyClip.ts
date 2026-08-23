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

  const [ready, setReady] = useState(false);
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

    if (!mountRef.current || !trackUrl) return;

    async function createPlayer() {
      try {
        const api = await loadSpotifyIframeApi();

        if (cancelled || !mountRef.current) return;

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

            controllerRef.current = controller;

            controller.addListener?.("ready", () => {
              setReady(true);
              setError("");
            });

            controller.addListener?.("playback_started", () => {
              playingRef.current = true;
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

              const endMs =
                (startRef.current + clipDurationRef.current) * 1000;

              if (!paused && nextPosition >= endMs - 150) {
                controller.pause?.();
                playingRef.current = false;
                setIsPlaying(false);
              }
            });
          }
        );
      } catch (playerError: any) {
        if (!cancelled) {
          setError(
            playerError?.message || "No se pudo inicializar Spotify."
          );
        }
      }
    }

    void createPlayer();

    return () => {
      cancelled = true;
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

    try {
      controller.loadEntity?.(trackUrl, false, start);
    } catch {
      // Fallback below.
    }

    window.setTimeout(() => {
      try {
        controller.seek?.(start);
      } catch {
        // startAt from loadEntity remains the primary path.
      }

      controller.play?.();
    }, 80);
  }, [ready, trackUrl]);

  const pause = useCallback(() => {
    controllerRef.current?.pause?.();
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) pause();
    else play();
  }, [pause, play]);

  return {
    ready,
    isPlaying,
    positionMs,
    durationMs,
    error,
    play,
    pause,
    toggle,
  };
}
