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
  const playerRef = useRef<any>(null);
  const stopTimerRef =
    useRef<number | null>(null);

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
              } catch (tokenError: any) {
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
              Number(state.position || 0)
            );
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
      } catch (setupError: any) {
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

      if (
        stopTimerRef.current !== null
      ) {
        window.clearTimeout(
          stopTimerRef.current
        );
      }

      try {
        playerRef.current?.disconnect?.();
      } catch {}

      playerRef.current = null;
      setReady(false);
      setDeviceId("");
      setIsPlaying(false);
    };
  }, [enabled]);

  const pause =
    useCallback(async () => {
      if (
        stopTimerRef.current !== null
      ) {
        window.clearTimeout(
          stopTimerRef.current
        );

        stopTimerRef.current = null;
      }

      try {
        await playerRef.current?.pause?.();
      } catch {}

      setIsPlaying(false);
    }, []);

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

        setError("");

        /*
         * Safari/iOS necesita activar el elemento de audio
         * desde una interacción del usuario.
         */
        try {
          playerRef.current
            ?.activateElement?.();
        } catch {}

        const alumniToken =
          await getAlumniAccessToken();

        const response = await fetch(
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
              device_id: deviceId,
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

        const data = await response
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
            Math.floor(startSeconds)
          ) * 1000
        );

        if (
          stopTimerRef.current !== null
        ) {
          window.clearTimeout(
            stopTimerRef.current
          );
        }

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
      [deviceId, pause]
    );

  return {
    ready,
    deviceId,
    isPlaying,
    positionMs,
    error,
    playFragment,
    pause,
  };
}
