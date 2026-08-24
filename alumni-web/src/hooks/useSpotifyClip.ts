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
  const readyRef = useRef(false);

  /*
   * null = el Embed necesita volver a cargar la entidad
   * antes del siguiente Play.
   */
  const loadedStartRef =
    useRef<number | null>(0);

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

  /*
   * CAMBIO CLAVE 6.1:
   * mover el selector YA NO llama loadEntity() ni seek().
   *
   * En la versión anterior el evento ready llamaba loadEntity(),
   * loadEntity volvía a provocar ready y se podía formar un ciclo:
   *
   * ready -> loadEntity -> ready -> loadEntity...
   *
   * Ese ciclo era lo que dejaba el selector/reproductor trabado.
   */
  useEffect(() => {
    const nextStart = Math.max(
      0,
      Math.floor(startSeconds)
    );

    startRef.current = nextStart;
    setPositionMs(nextStart * 1000);

    /*
     * El inicio cambió. Marcamos la entidad como pendiente,
     * pero no tocamos Spotify hasta que el usuario pulse Play.
     */
    loadedStartRef.current = null;

    if (playingRef.current) {
      try {
        controllerRef.current?.pause?.();
      } catch {}

      playingRef.current = false;
      setIsPlaying(false);
    }
  }, [startSeconds]);

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
    let fallbackReadyId:
      | number
      | null = null;

    setReady(false);
    setFailed(false);
    setError("");
    setDurationMs(0);

    readyRef.current = false;
    playingRef.current = false;
    loadedStartRef.current = 0;

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

            const markReady = () => {
              if (
                cancelled ||
                readyRef.current
              ) {
                return;
              }

              /*
               * IMPORTANTE:
               * aquí NO llamamos loadEntity().
               * Solo marcamos el controlador listo.
               */
              readyRef.current = true;
              setReady(true);
              setFailed(false);
              setError("");
            };

            controller.addListener?.(
              "ready",
              markReady
            );

            controller.addListener?.(
              "playback_started",
              () => {
                playingRef.current =
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

                const endMs =
                  (startRef.current +
                    clipDurationRef.current) *
                  1000;

                /*
                 * Al terminar el fragmento pausamos.
                 * El próximo Play vuelve a preparar el inicio seleccionado.
                 */
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
                  setIsPlaying(false);

                  setPositionMs(
                    startRef.current *
                      1000
                  );

                  loadedStartRef.current =
                    null;
                }
              }
            );

            /*
             * Algunos navegadores entregan el controller cuando
             * ya ocurrió ready. Este fallback SOLO marca ready;
             * nunca recarga la entidad.
             */
            fallbackReadyId =
              window.setTimeout(
                markReady,
                220
              );
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
        fallbackReadyId !== null
      ) {
        window.clearTimeout(
          fallbackReadyId
        );
      }

      readyRef.current = false;
      playingRef.current = false;
      loadedStartRef.current = null;

      setIsPlaying(false);
      setReady(false);

      controllerRef.current?.destroy?.();
      controllerRef.current = null;
    };
  }, [
    mountRef,
    trackId,
    trackUrl,
  ]);

  const play = useCallback(() => {
    const controller =
      controllerRef.current;

    if (
      !controller ||
      !readyRef.current
    ) {
      return;
    }

    setError("");

    const selectedStart =
      startRef.current;

    try {
      /*
       * Solo al tocar Play hacemos UNA preparación del punto elegido.
       * Se ejecuta dentro del gesto del usuario para evitar romper
       * las políticas de reproducción del navegador.
       */
      if (
        loadedStartRef.current !==
        selectedStart
      ) {
        controller.loadEntity?.(
          trackUrl,
          false,
          selectedStart
        );

        loadedStartRef.current =
          selectedStart;
      }

      /*
       * play() se llama en el mismo click.
       * No esperamos un setTimeout ni otro evento para iniciarlo.
       */
      controller.play?.();
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
  }, [trackUrl]);

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
