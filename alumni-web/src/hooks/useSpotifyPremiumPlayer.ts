"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import {
  activateSpotifyElement,
  clearSpotifyPlayerError,
  ensureSpotifyPlayer,
  getSpotifyPlayerSnapshot,
  spotifyPause,
  spotifyResume,
  spotifySeek,
  subscribeSpotifyPlayer,
} from "@/lib/spotifyPlayerManager";

type Options = {
  enabled?: boolean;
};

async function getAlumniAccessToken() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Inicia sesión en Alumni."
    );
  }

  return session.access_token;
}

export function useSpotifyPremiumPlayer({
  enabled = true,
}: Options = {}) {
  const stopTimerRef =
    useRef<number | null>(
      null
    );

  const loopTimerRef =
    useRef<number | null>(
      null
    );

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

  const initial =
    getSpotifyPlayerSnapshot();

  const [ready, setReady] =
    useState(
      initial.ready
    );

  const [deviceId, setDeviceId] =
    useState(
      initial.deviceId
    );

  const [isPlaying, setIsPlaying] =
    useState(
      initial.isPlaying
    );

  const [positionMs, setPositionMs] =
    useState(
      initial.positionMs
    );

  const [error, setError] =
    useState(
      initial.error
    );

  useEffect(() => {
    const unsubscribe =
      subscribeSpotifyPlayer(
        (next) => {
          setReady(
            next.ready
          );

          setDeviceId(
            next.deviceId
          );

          setIsPlaying(
            next.isPlaying
          );

          setPositionMs(
            next.positionMs
          );

          setError(
            next.error
          );
        }
      );

    if (enabled) {
      void ensureSpotifyPlayer()
        .catch(() => {});
    }

    return unsubscribe;
  }, [enabled]);

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

  const armLoop =
    useCallback(() => {
      clearLoopTimer();

      if (
        !continuousRef.current
      ) {
        return;
      }

      loopTimerRef.current =
        window.setTimeout(
          async () => {
            if (
              !continuousRef.current
            ) {
              return;
            }

            await spotifySeek(
              loopStartMsRef.current
            );

            await spotifyResume();

            armLoop();
          },
          Math.max(
            1000,
            loopDurationMsRef.current
          )
        );
    }, [clearLoopTimer]);

  useEffect(() => {
    return () => {
      clearStopTimer();
      clearLoopTimer();

      /*
       * Solo limpiamos timers locales del componente.
       * El Spotify.Player global sigue vivo.
       */
    };
  }, [
    clearStopTimer,
    clearLoopTimer,
  ]);

  const activateElement =
    useCallback(() => {
      activateSpotifyElement();
      clearSpotifyPlayerError();
    }, []);

  const pause =
    useCallback(async () => {
      clearStopTimer();
      clearLoopTimer();

      continuousRef.current =
        false;

      await spotifyPause();
    }, [
      clearStopTimer,
      clearLoopTimer,
    ]);

  const callPlayApi =
    useCallback(
      async ({
        trackId,
        targetDeviceId,
        startSeconds,
      }: {
        trackId: string;
        targetDeviceId:
          string;
        startSeconds:
          number;
      }) => {
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
                    targetDeviceId,
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
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Spotify no pudo iniciar la canción."
          );
        }

        return true;
      },
      []
    );

  const playFragment =
    useCallback(
      async ({
        trackId,
        startSeconds,
        durationSeconds = 30,
      }: {
        trackId: string;
        startSeconds: number;
        durationSeconds?:
          number;
      }) => {
        clearSpotifyPlayerError();

        try {
          const currentDeviceId =
            await ensureSpotifyPlayer();

          await callPlayApi({
            trackId,
            targetDeviceId:
              currentDeviceId,
            startSeconds,
          });

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
        } catch (
          playError: any
        ) {
          setError(
            playError?.message ||
              "Spotify no pudo iniciar la canción."
          );

          return false;
        }
      },
      [
        callPlayApi,
        clearStopTimer,
        pause,
      ]
    );

  const startContinuousFragment =
    useCallback(
      async ({
        trackId,
        startSeconds,
        durationSeconds = 30,
      }: {
        trackId: string;
        startSeconds: number;
        durationSeconds?:
          number;
      }) => {
        if (!trackId) {
          return false;
        }

        clearStopTimer();

        continuousRef.current =
          true;

        loopStartMsRef.current =
          Math.max(
            0,
            Math.round(
              startSeconds *
                1000
            )
          );

        loopDurationMsRef.current =
          Math.max(
            1000,
            Math.round(
              durationSeconds *
                1000
            )
          );

        if (
          activeTrackRef.current ===
          trackId
        ) {
          const moved =
            await spotifySeek(
              loopStartMsRef.current
            );

          if (!moved) {
            return false;
          }

          await spotifyResume();

          armLoop();

          return true;
        }

        if (
          startingTrackRef.current ===
          trackId
        ) {
          return false;
        }

        startingTrackRef.current =
          trackId;

        clearSpotifyPlayerError();

        try {
          const currentDeviceId =
            await ensureSpotifyPlayer();

          await callPlayApi({
            trackId,
            targetDeviceId:
              currentDeviceId,
            startSeconds,
          });

          activeTrackRef.current =
            trackId;

          setPositionMs(
            loopStartMsRef.current
          );

          setIsPlaying(true);

          try {
            await spotifyResume();
          } catch {}

          armLoop();

          return true;
        } catch (
          playError: any
        ) {
          setError(
            playError?.message ||
              "Spotify no pudo iniciar la canción."
          );

          return false;
        } finally {
          startingTrackRef.current =
            "";
        }
      },
      [
        armLoop,
        callPlayApi,
        clearStopTimer,
      ]
    );

  const seekContinuousFragment =
    useCallback(
      async ({
        startSeconds,
        durationSeconds = 30,
      }: {
        startSeconds: number;
        durationSeconds?:
          number;
      }) => {
        if (
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
              startSeconds *
                1000
            )
          );

        loopStartMsRef.current =
          startMs;

        loopDurationMsRef.current =
          Math.max(
            1000,
            Math.round(
              durationSeconds *
                1000
            )
          );

        const moved =
          await spotifySeek(
            startMs
          );

        if (!moved) {
          return false;
        }

        await spotifyResume();

        armLoop();

        return true;
      },
      [armLoop]
    );

  return {
    ready,
    deviceId,
    isPlaying,
    positionMs,
    error,
    playFragment,
    pause,
    activateElement,
    startContinuousFragment,
    seekContinuousFragment,
  };
}
