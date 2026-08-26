"use client";

import { supabase } from "@/lib/supabase";
import { loadSpotifyWebPlaybackSdk } from "@/lib/spotifyWebPlayback";

type Snapshot = {
  ready: boolean;
  deviceId: string;
  isPlaying: boolean;
  positionMs: number;
  error: string;
};

type Listener = (
  snapshot: Snapshot
) => void;

let player: any = null;
let connectPromise:
  | Promise<void>
  | null = null;

let snapshot: Snapshot = {
  ready: false,
  deviceId: "",
  isPlaying: false,
  positionMs: 0,
  error: "",
};

const listeners =
  new Set<Listener>();

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

async function getSpotifyAccessToken() {
  const alumniToken =
    await getAlumniAccessToken();

  const response =
    await fetch(
      "/api/music/spotify/token",
      {
        headers: {
          Authorization:
            `Bearer ${alumniToken}`,
        },
        cache:
          "no-store",
      }
    );

  const data =
    await response
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

  return String(
    data.access_token
  );
}

function emit(
  patch: Partial<Snapshot>
) {
  snapshot = {
    ...snapshot,
    ...patch,
  };

  for (
    const listener
    of listeners
  ) {
    listener(snapshot);
  }
}

function destroyPlayer() {
  try {
    player?.disconnect?.();
  } catch {}

  player = null;
  connectPromise = null;

  emit({
    ready: false,
    deviceId: "",
    isPlaying: false,
  });
}

async function createPlayer() {
  const Spotify =
    await loadSpotifyWebPlaybackSdk();

  const nextPlayer =
    new Spotify.Player({
      name:
        "Alumni Music",
      getOAuthToken:
        async (
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
            emit({
              error:
                tokenError
                  ?.message ||
                "Vuelve a conectar Spotify.",
            });
          }
        },
      volume: 0.72,
    });

  nextPlayer.addListener(
    "ready",
    ({
      device_id,
    }: {
      device_id: string;
    }) => {
      emit({
        ready: true,
        deviceId:
          device_id,
        error: "",
      });
    }
  );

  nextPlayer.addListener(
    "not_ready",
    () => {
      /*
       * Spotify confirma que este device quedó offline.
       * Limpiamos el ID inmediatamente para no volver a mandar
       * un device_id muerto al Web API.
       */
      emit({
        ready: false,
        deviceId: "",
        isPlaying: false,
      });
    }
  );

  nextPlayer.addListener(
    "player_state_changed",
    (state: any) => {
      if (!state) return;

      emit({
        isPlaying:
          !state.paused,
        positionMs:
          Number(
            state.position || 0
          ),
      });
    }
  );

  nextPlayer.addListener(
    "account_error",
    ({
      message,
    }: {
      message: string;
    }) => {
      emit({
        error:
          message ||
          "Spotify Premium es obligatorio.",
      });
    }
  );

  nextPlayer.addListener(
    "authentication_error",
    ({
      message,
    }: {
      message: string;
    }) => {
      emit({
        error:
          message ||
          "Vuelve a conectar Spotify.",
      });
    }
  );

  nextPlayer.addListener(
    "initialization_error",
    ({
      message,
    }: {
      message: string;
    }) => {
      emit({
        error:
          message ||
          "No se pudo iniciar Spotify.",
      });
    }
  );

  nextPlayer.addListener(
    "playback_error",
    ({
      message,
    }: {
      message: string;
    }) => {
      emit({
        error:
          message ||
          "Spotify no pudo reproducir.",
      });
    }
  );

  nextPlayer.addListener(
    "autoplay_failed",
    () => {
      emit({
        isPlaying: false,
        error:
          "El navegador bloqueó el inicio automático. Toca Play otra vez.",
      });
    }
  );

  player =
    nextPlayer;

  const connected =
    await nextPlayer.connect();

  if (!connected) {
    throw new Error(
      "Spotify no pudo conectar el reproductor."
    );
  }
}

export function subscribeSpotifyPlayer(
  listener: Listener
) {
  listeners.add(listener);

  listener(snapshot);

  return () => {
    listeners.delete(
      listener
    );

    /*
     * OJO:
     * NO desconectamos Spotify cuando un componente se desmonta.
     *
     * Antes cada selector/tarjeta creaba y destruía su propio
     * Spotify.Player. Cada Player es un Spotify Connect device.
     * Eso generaba IDs nuevos/offline y terminaba en Device not found.
     *
     * Ahora existe UN SOLO device durante toda la sesión de Alumni.
     */
  };
}

export function getSpotifyPlayerSnapshot() {
  return snapshot;
}

export async function ensureSpotifyPlayer() {
  if (
    player &&
    snapshot.ready &&
    snapshot.deviceId
  ) {
    return snapshot.deviceId;
  }

  /*
   * A stale Spotify.Player can exist without ever reaching ready.
   * Reusing that object leaves the profile button spinning forever.
   * A user retry now creates one clean Connect device.
   */
  if (
    player &&
    !connectPromise &&
    (!snapshot.ready ||
      !snapshot.deviceId)
  ) {
    destroyPlayer();
  }

  if (!connectPromise) {
    connectPromise =
      createPlayer()
        .catch(
          (error) => {
            destroyPlayer();

            emit({
              error:
                error?.message ||
                "No se pudo iniciar Spotify.",
            });

            throw error;
          }
        )
        .finally(() => {
          connectPromise =
            null;
        });
  }

  await connectPromise;

  if (
    snapshot.ready &&
    snapshot.deviceId
  ) {
    return snapshot.deviceId;
  }

  /*
   * connect() puede resolver un instante antes de ready.
   * Esperamos solo al evento REAL del SDK.
   */
  return new Promise<string>(
    (
      resolve,
      reject
    ) => {
      const started =
        Date.now();

      const interval =
        window.setInterval(
          () => {
            if (
              snapshot.ready &&
              snapshot.deviceId
            ) {
              window.clearInterval(
                interval
              );

              resolve(
                snapshot.deviceId
              );

              return;
            }

            if (
              Date.now() -
                started >
              6000
            ) {
              window.clearInterval(
                interval
              );

              reject(
                new Error(
                  "Spotify tardó demasiado en activar el reproductor."
                )
              );
            }
          },
          80
        );
    }
  );
}

export function activateSpotifyElement() {
  try {
    void player
      ?.activateElement?.();
  } catch {}
}

export async function spotifyPause() {
  try {
    await player?.pause?.();
  } catch {}

  emit({
    isPlaying: false,
  });
}

export async function spotifyResume() {
  try {
    await player?.resume?.();

    emit({
      isPlaying: true,
    });

    return true;
  } catch {
    return false;
  }
}

export async function spotifySeek(
  positionMs: number
) {
  if (!player) {
    return false;
  }

  try {
    const safe =
      Math.max(
        0,
        Math.round(
          positionMs
        )
      );

    await player.seek(
      safe
    );

    emit({
      positionMs: safe,
    });

    return true;
  } catch {
    return false;
  }
}

export function clearSpotifyPlayerError() {
  emit({
    error: "",
  });
}

/* ALUMNI_1_3_5_MEDIA_MODAL_SPOTIFY_FIX:SPOTIFY */

/* ALUMNI_1_3_6_CHAT_STABILITY_MEDIA_SPOTIFY:SPOTIFY_MANAGER */
