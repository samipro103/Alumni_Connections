"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { loadSpotifyWebPlaybackSdk } from "@/lib/spotifyWebPlayback";

type Options = {
  enabled?: boolean;
};

async function getAlumniAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Inicia sesión en Alumni."
    );
  }

  return session.access_token;
}

async function getSpotifyAccessToken() {
  const alumniToken =
    await getAlumniAccessToken();

  const response = await fetch(
    "/api/music/spotify/token",
    {
      headers: {
        Authorization:
          `Bearer ${alumniToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    !data?.access_token
  ) {
    throw new Error(
      data?.error ||
        "Conecta Spotify Premium."
    );
  }

  return String(data.access_token);
}

export function useSpotifyPremiumPlayer({
  enabled = true,
}: Options = {}) {
  const playerRef =
    useRef<any>(null);

  // Modo clásico: usado en la tarjeta del perfil.
  const stopTimerRef =
    useRef<number | null>(null);

  // Modo editor continuo: usado por el selector.
  const loopTimerRef =
    useRef<number | null>(null);

  const loopStartMsRef =
    useRef(0);

  const loopDurationMsRef =
    useRef(30_000);

  const continuousRef =
    useRef(false);

  const activeTrackRef =
    useRef("");

  const startingTrackRef =
    useRef("");

  const [ready, setReady] =
    useState(false);

  const [deviceId, setDeviceId] =
    useState("");

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [positionMs, setPositionMs] =
    useState(0);

  const [error, setError] =
    useState("");

  const clearStopTimer =
    useCallback(() => {
      if (
        stopTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          stopTimerRef.current
        );

        stopTimerRef.current =
          null;
      }
    }, []);

  const clearLoopTimer =
    useCallback(() => {
      if (
        loopTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          loopTimerRef.current
        );

        loopTimerRef.current =
          null;
      }
    }, []);

  const armLoopRef =
    useRef<() => void>(() => {});

  const armLoop =
    useCallback(() => {
      clearLoopTimer();

      if (
        !continuousRef.current ||
        !playerRef.current
      ) {
        return;
      }

      const duration =
        Math.max(
          1000,
          loopDurationMsRef.current
        );

      loopTimerRef.current =
        window.setTimeout(
          async () => {
            if (
              !continuousRef.current ||
              !playerRef.current
            ) {
              return;
            }

            const startMs =
              loopStartMsRef.current;

            try {
              await playerRef.current.seek(
                startMs
              );

              await playerRef.current.resume();
            } catch {}

            setPositionMs(startMs);
            setIsPlaying(true);

            armLoopRef.current();
          },
          duration
        );
    }, [clearLoopTimer]);

  useEffect(() => {
    armLoopRef.current =
      armLoop;
  }, [armLoop]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function setup() {
      try {
        const Spotify =
          await loadSpotifyWebPlaybackSdk();

        if (cancelled) return;

        const player =
          new Spotify.Player({
            name: "Alumni",
            getOAuthToken: async (
              callback: (
                token: string
              ) => void
            ) => {
              try {
                callback(
                  await getSpotifyAccessToken()
                );
              } catch (
                tokenError: any
              ) {
                setError(
                  tokenError?.message ||
                    "Vuelve a conectar Spotify."
                );
              }
            },
            volume: 0.72,
          });

        playerRef.current =
          player;

        player.addListener(
          "ready",
          ({
            device_id,
          }: {
            device_id: string;
          }) => {
            if (cancelled) return;

            setDeviceId(device_id);
            setReady(true);
            setError("");
          }
        );

        player.addListener(
          "not_ready",
          () => {
            setReady(false);
          }
        );

        player.addListener(
          "player_state_changed",
          (state: any) => {
            if (!state) return;

            setIsPlaying(
              !state.paused
            );

            setPositionMs(
              Number(
                state.position || 0
              )
            );

            /*
             * En el editor queremos reproducción continua.
             * Si Spotify llega al final de nuestra ventana,
             * regresamos al inicio de los 30 segundos.
             */
            if (
              continuousRef.current &&
              !state.paused
            ) {
              const endMs =
                loopStartMsRef.current +
                loopDurationMsRef.current;

              if (
                Number(
                  state.position || 0
                ) >=
                endMs - 180
              ) {
                const startMs =
                  loopStartMsRef.current;

                void player
                  .seek(startMs)
                  .then(() =>
                    player.resume()
                  )
                  .catch(() => {});

                setPositionMs(
                  startMs
                );

                armLoopRef.current();
              }
            }
          }
        );

        player.addListener(
          "autoplay_failed",
          () => {
            if (
              continuousRef.current
            ) {
              setError(
                "Toca o arrastra la onda una vez para activar el audio."
              );
            }
          }
        );

        player.addListener(
          "account_error",
          ({
            message,
          }: {
            message: string;
          }) => {
            setError(
              message ||
                "Spotify Premium es obligatorio."
            );
          }
        );

        player.addListener(
          "authentication_error",
          ({
            message,
          }: {
            message: string;
          }) => {
            setError(
              message ||
                "Vuelve a conectar Spotify."
            );
          }
        );

        player.addListener(
          "initialization_error",
          ({
            message,
          }: {
            message: string;
          }) => {
            setError(
              message ||
                "No se pudo iniciar Spotify."
            );
          }
        );

        player.addListener(
          "playback_error",
          ({
            message,
          }: {
            message: string;
          }) => {
            setError(
              message ||
                "Spotify no pudo reproducir."
            );
          }
        );

        await player.connect();
      } catch (
        setupError: any
      ) {
        if (!cancelled) {
          setError(
            setupError?.message ||
              "No se pudo iniciar Spotify."
          );
        }
      }
    }

    void setup();

    return () => {
      cancelled = true;

      clearStopTimer();
      clearLoopTimer();

      continuousRef.current =
        false;

      activeTrackRef.current =
        "";

      startingTrackRef.current =
        "";

      try {
        playerRef.current
          ?.disconnect?.();
      } catch {}

      playerRef.current =
        null;

      setReady(false);
      setDeviceId("");
      setIsPlaying(false);
    };
  }, [
    enabled,
    clearStopTimer,
    clearLoopTimer,
  ]);

  /*
   * Importante en Safari/iOS:
   * esta función debe llamarse directamente desde un gesto
   * del usuario (pointer down / click) para desbloquear audio.
   */
  const activateElement =
    useCallback(() => {
      try {
        void playerRef.current
          ?.activateElement?.();

        setError("");
      } catch {}
    }, []);

  const pause =
    useCallback(async () => {
      clearStopTimer();
      clearLoopTimer();

      continuousRef.current =
        false;

      try {
        await playerRef.current
          ?.pause?.();
      } catch {}

      setIsPlaying(false);
    }, [
      clearStopTimer,
      clearLoopTimer,
    ]);

  /*
   * Reproducción clásica: mantiene el comportamiento existente
   * de la tarjeta de perfil (reproduce N segundos y pausa).
   */
  const playFragment =
    useCallback(
      async ({
        trackId,
        startSeconds,
        durationSeconds = 30,
      }: {
        trackId: string;
        startSeconds: number;
        durationSeconds?: number;
      }) => {
        if (
          !playerRef.current ||
          !deviceId
        ) {
          setError(
            "El reproductor todavía se está preparando."
          );

          return false;
        }

        clearLoopTimer();
        continuousRef.current =
          false;

        setError("");

        activateElement();

        const alumniToken =
          await getAlumniAccessToken();

        const response =
          await fetch(
            "/api/music/spotify/play",
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${alumniToken}`,
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                track_id: trackId,
                device_id:
                  deviceId,
                start_seconds:
                  Math.max(
                    0,
                    Math.floor(
                      startSeconds
                    )
                  ),
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          setError(
            data?.error ||
              "Spotify no pudo iniciar la canción."
          );

          return false;
        }

        setIsPlaying(true);

        setPositionMs(
          Math.max(
            0,
            Math.floor(
              startSeconds
            )
          ) * 1000
        );

        clearStopTimer();

        stopTimerRef.current =
          window.setTimeout(
            () => {
              void pause();
            },
            Math.max(
              1,
              durationSeconds
            ) * 1000
          );

        return true;
      },
      [
        deviceId,
        pause,
        clearLoopTimer,
        clearStopTimer,
        activateElement,
      ]
    );

  /*
   * Editor tipo Instagram:
   * inicia la canción UNA sola vez mediante el backend.
   * Después todos los movimientos usan player.seek(), que es local
   * al Web Playback SDK y mucho más rápido que hacer peticiones HTTP.
   */
  const startContinuousFragment =
    useCallback(
      async ({
        trackId,
        startSeconds,
        durationSeconds = 30,
      }: {
        trackId: string;
        startSeconds: number;
        durationSeconds?: number;
      }) => {
        if (
          !playerRef.current ||
          !deviceId ||
          !trackId
        ) {
          return false;
        }

        clearStopTimer();

        continuousRef.current =
          true;

        loopStartMsRef.current =
          Math.max(
            0,
            Math.round(
              startSeconds * 1000
            )
          );

        loopDurationMsRef.current =
          Math.max(
            1000,
            Math.round(
              durationSeconds * 1000
            )
          );

        /*
         * Si ya cargamos esta pista, no volvemos a tocar el backend.
         * Seek + resume son instantáneos dentro del SDK.
         */
        if (
          activeTrackRef.current ===
          trackId
        ) {
          try {
            await playerRef.current.seek(
              loopStartMsRef.current
            );

            await playerRef.current.resume();

            setPositionMs(
              loopStartMsRef.current
            );

            setIsPlaying(true);
            setError("");

            armLoopRef.current();

            return true;
          } catch {
            return false;
          }
        }

        if (
          startingTrackRef.current ===
          trackId
        ) {
          return false;
        }

        startingTrackRef.current =
          trackId;

        setError("");

        try {
          const alumniToken =
            await getAlumniAccessToken();

          const response =
            await fetch(
              "/api/music/spotify/play",
              {
                method: "POST",
                headers: {
                  Authorization:
                    `Bearer ${alumniToken}`,
                  "Content-Type":
                    "application/json",
                },
                body:
                  JSON.stringify({
                    track_id:
                      trackId,
                    device_id:
                      deviceId,
                    start_seconds:
                      Math.max(
                        0,
                        Math.floor(
                          startSeconds
                        )
                      ),
                  }),
              }
            );

          const data =
            await response
              .json()
              .catch(() => ({}));

          if (!response.ok) {
            setError(
              data?.error ||
                "Spotify no pudo iniciar la canción."
            );

            return false;
          }

          activeTrackRef.current =
            trackId;

          setPositionMs(
            loopStartMsRef.current
          );

          setIsPlaying(true);

          /*
           * Si el navegador ya fue activado por un gesto,
           * resume mantiene el audio sonando. Si iOS lo bloqueó,
           * el siguiente toque sobre la onda llama activateElement().
           */
          try {
            await playerRef.current.resume();
          } catch {}

          armLoopRef.current();

          return true;
        } finally {
          startingTrackRef.current =
            "";
        }
      },
      [
        deviceId,
        clearStopTimer,
      ]
    );

  /*
   * Este es el corazón del selector fluido:
   * no hace fetch. Solo mueve el cabezal local del SDK.
   */
  const seekContinuousFragment =
    useCallback(
      async ({
        startSeconds,
        durationSeconds = 30,
      }: {
        startSeconds: number;
        durationSeconds?: number;
      }) => {
        if (
          !playerRef.current ||
          !activeTrackRef.current
        ) {
          return false;
        }

        continuousRef.current =
          true;

        const startMs =
          Math.max(
            0,
            Math.round(
              startSeconds * 1000
            )
          );

        loopStartMsRef.current =
          startMs;

        loopDurationMsRef.current =
          Math.max(
            1000,
            Math.round(
              durationSeconds * 1000
            )
          );

        try {
          await playerRef.current.seek(
            startMs
          );

          await playerRef.current.resume();

          setPositionMs(startMs);
          setIsPlaying(true);
          setError("");

          armLoopRef.current();

          return true;
        } catch {
          return false;
        }
      },
      []
    );

  return {
    ready,
    deviceId,
    isPlaying,
    positionMs,
    error,
    playFragment,
    pause,

    // Editor continuo
    activateElement,
    startContinuousFragment,
    seekContinuousFragment,
  };
}
