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
  const startRef = useRef(
    Math.max(0, Math.floor(startSeconds))
  );
  const clipDurationRef = useRef(
    Math.max(1, clipDurationSeconds)
  );
  const playingRef = useRef(false);
  const hasStartedRef = useRef(false);
  const preparedStartRef =
    useRef<number | null>(null);
  const prepareTimerRef =
    useRef<number | null>(null);
  const recoveryTriedRef = useRef(false);

  const [ready, setReady] =
    useState(false);
  const [failed, setFailed] =
    useState(false);
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [positionMs, setPositionMs] =
    useState(
      Math.max(
        0,
        Math.floor(startSeconds)
      ) * 1000
    );
  const [durationMs, setDurationMs] =
    useState(0);
  const [error, setError] =
    useState("");

  const prepareSelectedStart =
    useCallback(() => {
      const controller =
        controllerRef.current;

      if (!controller) return;

      const selectedStart =
        startRef.current;

      try {
        /*
         * IMPORTANTE:
         * Spotify documenta startAt en loadEntity como el punto
         * desde el que debe comenzar cuando luego se llama play().
         *
         * Antes Alumni hacía seek(start) justo antes de play().
         * Para fragmentos avanzados eso podía dejar el Embed en
         * buffering/pausa. Ahora preparamos la entidad con startAt
         * y dejamos que play() arranque desde ese punto.
         */
        controller.loadEntity?.(
          trackUrl,
          false,
          selectedStart
        );

        preparedStartRef.current =
          selectedStart;
      } catch (prepareError) {
        console.warn(
          "Spotify loadEntity(startAt) failed:",
          prepareError
        );
        preparedStartRef.current =
          null;
      }
    }, [trackUrl]);

  useEffect(() => {
    const nextStart = Math.max(
      0,
      Math.floor(startSeconds)
    );

    startRef.current = nextStart;
    setPositionMs(nextStart * 1000);
    hasStartedRef.current = false;
    recoveryTriedRef.current = false;

    if (prepareTimerRef.current !== null) {
      window.clearTimeout(
        prepareTimerRef.current
      );
      prepareTimerRef.current = null;
    }

    const controller =
      controllerRef.current;

    if (!controller || !ready) {
      preparedStartRef.current = null;
      return;
    }

    if (playingRef.current) {
      try {
        controller.pause?.();
      } catch {}

      playingRef.current = false;
      setIsPlaying(false);
    }

    /*
     * Esperamos a que el usuario termine de mover el selector.
     * Solo hacemos un loadEntity con el inicio definitivo.
     */
    prepareTimerRef.current =
      window.setTimeout(() => {
        prepareTimerRef.current = null;
        prepareSelectedStart();
      }, 220);
  }, [
    startSeconds,
    ready,
    prepareSelectedStart,
  ]);

  useEffect(() => {
    clipDurationRef.current = Math.max(
      1,
      clipDurationSeconds
    );
  }, [clipDurationSeconds]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null =
      null;

    setReady(false);
    setFailed(false);
    setError("");
    setDurationMs(0);

    playingRef.current = false;
    hasStartedRef.current = false;
    preparedStartRef.current = null;
    recoveryTriedRef.current = false;

    if (!mountRef.current || !trackUrl) {
      return;
    }

    async function setup() {
      try {
        const api =
          await loadSpotifyIframeApi();

        if (
          cancelled ||
          !mountRef.current
        ) {
          return;
        }

        timeoutId =
          window.setTimeout(() => {
            if (
              cancelled ||
              controllerRef.current
            ) {
              return;
            }

            setFailed(true);
            setError(
              "Spotify tardó demasiado en iniciar."
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

            if (timeoutId !== null) {
              window.clearTimeout(
                timeoutId
              );
              timeoutId = null;
            }

            controllerRef.current =
              controller;

            const onReady = () => {
              if (cancelled) return;

              /*
               * Preparamos el inicio guardado ANTES de que el usuario
               * pulse Play. Esto es clave cuando el tramo empieza,
               * por ejemplo, en 2:00.
               */
              prepareSelectedStart();

              window.setTimeout(() => {
                if (cancelled) return;

                setReady(true);
                setFailed(false);
                setError("");
              }, 180);
            };

            controller.addListener?.(
              "ready",
              onReady
            );

            controller.addListener?.(
              "playback_started",
              () => {
                playingRef.current =
                  true;
                hasStartedRef.current =
                  true;
                setIsPlaying(true);
              }
            );

            controller.addListener?.(
              "playback_update",
              (event: any) => {
                const state =
                  event?.data || {};

                const nextDuration =
                  Number(
                    state.duration || 0
                  );

                const nextPosition =
                  Number(
                    state.position || 0
                  );

                const paused =
                  Boolean(
                    state.isPaused
                  );

                if (
                  nextDuration > 0
                ) {
                  setDurationMs(
                    nextDuration
                  );
                }

                if (
                  nextPosition >= 0
                ) {
                  setPositionMs(
                    nextPosition
                  );
                }

                playingRef.current =
                  !paused;

                setIsPlaying(
                  !paused
                );

                const startMs =
                  startRef.current *
                  1000;

                const endMs =
                  (startRef.current +
                    clipDurationRef.current) *
                  1000;

                /*
                 * Recuperación única:
                 * si Spotify empieza desde 0 aunque el fragmento
                 * guardado sea avanzado, volvemos a cargar la misma
                 * entidad con startAt. NO hacemos una lluvia de seek().
                 */
                if (
                  !paused &&
                  startRef.current > 0 &&
                  nextPosition <
                    startMs - 1800 &&
                  !recoveryTriedRef.current
                ) {
                  recoveryTriedRef.current =
                    true;

                  try {
                    controller.loadEntity?.(
                      trackUrl,
                      false,
                      startRef.current
                    );
                    preparedStartRef.current =
                      startRef.current;
                    controller.play?.();
                  } catch {}

                  return;
                }

                if (
                  !paused &&
                  nextPosition >=
                    endMs - 180
                ) {
                  try {
                    controller.pause?.();
                  } catch {}

                  playingRef.current =
                    false;
                  hasStartedRef.current =
                    false;
                  setIsPlaying(false);
                  setPositionMs(startMs);

                  /*
                   * Dejamos el fragmento preparado para que el
                   * siguiente Play vuelva a comenzar exactamente
                   * desde el inicio seleccionado.
                   */
                  try {
                    controller.loadEntity?.(
                      trackUrl,
                      false,
                      startRef.current
                    );
                    preparedStartRef.current =
                      startRef.current;
                  } catch {}
                }
              }
            );

            /*
             * Algunos builds del Embed entregan el controlador cuando
             * ya está listo y el evento ready puede haber ocurrido.
             */
            window.setTimeout(() => {
              if (
                cancelled ||
                ready
              ) {
                return;
              }

              onReady();
            }, 140);
          }
        );
      } catch (setupError: any) {
        if (!cancelled) {
          setFailed(true);
          setError(
            setupError?.message ||
              "No se pudo inicializar Spotify."
          );
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(
          timeoutId
        );
      }

      if (
        prepareTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          prepareTimerRef.current
        );
        prepareTimerRef.current =
          null;
      }

      playingRef.current = false;
      hasStartedRef.current = false;
      preparedStartRef.current = null;
      recoveryTriedRef.current = false;

      setIsPlaying(false);
      setReady(false);

      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [
    mountRef,
    trackId,
    trackUrl,
    prepareSelectedStart,
  ]);

  const play = useCallback(() => {
    const controller =
      controllerRef.current;

    if (!controller || !ready) {
      return;
    }

    recoveryTriedRef.current = false;

    try {
      /*
       * Si todavía no ha comenzado este fragmento, garantizamos que
       * loadEntity tenga el startAt correcto y llamamos play().
       *
       * Ya NO hacemos seek() antes de play(), que era el conflicto
       * que bloqueaba fragmentos avanzados.
       */
      if (!hasStartedRef.current) {
        if (
          preparedStartRef.current !==
          startRef.current
        ) {
          controller.loadEntity?.(
            trackUrl,
            false,
            startRef.current
          );

          preparedStartRef.current =
            startRef.current;
        }

        controller.play?.();
        return;
      }

      /*
       * Si solo estaba pausado dentro del mismo fragmento,
       * continuamos donde quedó.
       */
      if (controller.resume) {
        controller.resume();
      } else {
        controller.play?.();
      }
    } catch (playError: any) {
      console.error(
        "Spotify play failed:",
        playError
      );

      setError(
        playError?.message ||
          "Spotify no pudo iniciar el fragmento."
      );
    }
  }, [ready, trackUrl]);

  const pause = useCallback(() => {
    try {
      controllerRef.current?.pause?.();
    } catch {}

    playingRef.current = false;
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (playingRef.current) {
      pause();
    } else {
      play();
    }
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
