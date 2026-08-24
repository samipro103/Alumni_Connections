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
  const readyRef = useRef(false);
  const playingRef = useRef(false);

  const startRef = useRef(
    Math.max(0, Math.floor(startSeconds))
  );

  const clipDurationRef = useRef(
    Math.max(1, clipDurationSeconds)
  );

  const loadedStartRef =
    useRef<number | null>(0);

  const prepareTimerRef =
    useRef<number | null>(null);

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

  const ensureIframeCapabilities =
    useCallback(() => {
      const iframe =
        mountRef.current?.querySelector(
          "iframe"
        );

      if (!iframe) return;

      /*
       * Spotify necesita encrypted-media para reproducir
       * correctamente dentro del Embed.
       */
      iframe.setAttribute(
        "allow",
        "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      );

      iframe.setAttribute(
        "allowfullscreen",
        ""
      );
    }, [mountRef]);

  const prepareStart =
    useCallback(
      (selectedStart: number) => {
        const controller =
          controllerRef.current;

        if (
          !controller ||
          !readyRef.current ||
          !trackUrl
        ) {
          return;
        }

        if (
          loadedStartRef.current ===
          selectedStart
        ) {
          return;
        }

        try {
          /*
           * Solo preparamos la entidad.
           * NO hacemos play() aquí.
           *
           * En móvil el usuario podrá tocar el botón Play
           * directamente en el Embed oficial de Spotify.
           */
          controller.loadEntity?.(
            trackUrl,
            false,
            selectedStart
          );

          loadedStartRef.current =
            selectedStart;

          window.setTimeout(
            ensureIframeCapabilities,
            0
          );
        } catch (prepareError) {
          console.warn(
            "Spotify prepare start failed:",
            prepareError
          );
        }
      },
      [
        ensureIframeCapabilities,
        trackUrl,
      ]
    );

  useEffect(() => {
    const nextStart = Math.max(
      0,
      Math.floor(startSeconds)
    );

    startRef.current = nextStart;
    setPositionMs(nextStart * 1000);

    if (
      prepareTimerRef.current !== null
    ) {
      window.clearTimeout(
        prepareTimerRef.current
      );

      prepareTimerRef.current = null;
    }

    /*
     * Si estaba sonando y el usuario mueve el selector,
     * pausamos primero. Después esperamos a que termine
     * de moverlo y hacemos UNA sola preparación.
     */
    if (playingRef.current) {
      try {
        controllerRef.current?.pause?.();
      } catch {}

      playingRef.current = false;
      setIsPlaying(false);
    }

    loadedStartRef.current = null;

    if (!readyRef.current) {
      return;
    }

    prepareTimerRef.current =
      window.setTimeout(() => {
        prepareTimerRef.current = null;
        prepareStart(nextStart);
      }, 260);
  }, [
    startSeconds,
    prepareStart,
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

    if (
      !mountRef.current ||
      !trackUrl
    ) {
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

        /*
         * En móvil usamos el tamaño REAL del contenedor.
         * Antes siempre eran 300px dentro de un contenedor
         * prácticamente invisible.
         */
        const measuredWidth =
          mountRef.current.clientWidth;

        const embedWidth =
          measuredWidth >= 260
            ? Math.floor(measuredWidth)
            : 300;

        api.createController(
          mountRef.current,
          {
            url: trackUrl,
            width: embedWidth,
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
              if (cancelled) return;

              if (!readyRef.current) {
                readyRef.current = true;
                setReady(true);
                setFailed(false);
                setError("");
              }

              window.setTimeout(
                ensureIframeCapabilities,
                0
              );

              /*
               * Si el perfil ya tenía guardado un inicio avanzado,
               * lo preparamos una sola vez. El handler ready está
               * protegido, así que loadEntity no crea un loop.
               */
              if (
                startRef.current > 0 &&
                loadedStartRef.current !==
                  startRef.current
              ) {
                window.setTimeout(
                  () =>
                    prepareStart(
                      startRef.current
                    ),
                  40
                );
              }
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

                  window.setTimeout(
                    () =>
                      prepareStart(
                        startRef.current
                      ),
                    40
                  );
                }
              }
            );

            fallbackReadyId =
              window.setTimeout(
                markReady,
                260
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

      if (
        prepareTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          prepareTimerRef.current
        );

        prepareTimerRef.current = null;
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
    ensureIframeCapabilities,
    prepareStart,
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
       * Desktop:
       * el botón custom sigue usando la API.
       *
       * Móvil:
       * el usuario dispone además del reproductor oficial visible,
       * por lo que puede tocar Play directamente dentro del iframe.
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
