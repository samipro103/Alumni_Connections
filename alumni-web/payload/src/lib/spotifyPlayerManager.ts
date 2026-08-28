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

type Listener = (snapshot: Snapshot) => void;

let player: any = null;
let playerReadyPromise: Promise<string> | null = null;
let playerGeneration = 0;

let snapshot: Snapshot = {
  ready: false,
  deviceId: "",
  isPlaying: false,
  positionMs: 0,
  error: "",
};

const listeners = new Set<Listener>();

async function getAlumniAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Inicia sesión en Alumni.");
  }

  return session.access_token;
}

async function getSpotifyAccessToken() {
  const alumniToken = await getAlumniAccessToken();

  const response = await fetch("/api/music/spotify/token", {
    headers: {
      Authorization: `Bearer ${alumniToken}`,
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error || "Conecta Spotify Premium."
    );
  }

  return String(data.access_token);
}

function emit(patch: Partial<Snapshot>) {
  snapshot = {
    ...snapshot,
    ...patch,
  };

  for (const listener of listeners) {
    listener(snapshot);
  }
}

function disconnectCurrentPlayer() {
  const current = player;
  player = null;

  if (current) {
    try {
      current.disconnect?.();
    } catch {}
  }
}

function resetPlayer({
  preserveError = false,
}: {
  preserveError?: boolean;
} = {}) {
  playerGeneration += 1;
  disconnectCurrentPlayer();
  playerReadyPromise = null;

  emit({
    ready: false,
    deviceId: "",
    isPlaying: false,
    ...(preserveError ? {} : { error: "" }),
  });
}

async function createPlayerAndWaitReady(): Promise<string> {
  const generation = ++playerGeneration;
  const Spotify = await loadSpotifyWebPlaybackSdk();

  return new Promise<string>(async (resolve, reject) => {
    let settled = false;
    let timeoutId: number | null = null;

    const nextPlayer = new Spotify.Player({
      name: "Alumni Music",
      getOAuthToken: async (
        callback: (token: string) => void
      ) => {
        try {
          callback(await getSpotifyAccessToken());
        } catch (tokenError: any) {
          emit({
            error:
              tokenError?.message ||
              "Vuelve a conectar Spotify.",
          });
        }
      },
      volume: 0.72,
    });

    player = nextPlayer;

    function currentGeneration() {
      return (
        generation === playerGeneration &&
        player === nextPlayer
      );
    }

    function finishError(message: string) {
      if (settled || !currentGeneration()) return;

      settled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      try {
        nextPlayer.disconnect?.();
      } catch {}

      if (player === nextPlayer) player = null;

      emit({
        ready: false,
        deviceId: "",
        isPlaying: false,
        error: message,
      });

      reject(new Error(message));
    }

    nextPlayer.addListener(
      "ready",
      ({ device_id }: { device_id: string }) => {
        if (settled || !currentGeneration()) return;

        settled = true;

        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }

        emit({
          ready: true,
          deviceId: device_id,
          isPlaying: false,
          error: "",
        });

        resolve(device_id);
      }
    );

    nextPlayer.addListener(
      "not_ready",
      ({ device_id }: { device_id?: string } = {}) => {
        if (!currentGeneration()) return;

        if (!device_id || device_id === snapshot.deviceId) {
          emit({
            ready: false,
            deviceId: "",
            isPlaying: false,
          });
        }
      }
    );

    nextPlayer.addListener(
      "player_state_changed",
      (state: any) => {
        if (!state || !currentGeneration()) return;

        emit({
          isPlaying: !state.paused,
          positionMs: Number(state.position || 0),
          error: !state.paused ? "" : snapshot.error,
        });
      }
    );

    nextPlayer.addListener(
      "account_error",
      ({ message }: { message: string }) => {
        finishError(
          message || "Spotify Premium es obligatorio."
        );
      }
    );

    nextPlayer.addListener(
      "authentication_error",
      ({ message }: { message: string }) => {
        finishError(
          message || "Vuelve a conectar Spotify."
        );
      }
    );

    nextPlayer.addListener(
      "initialization_error",
      ({ message }: { message: string }) => {
        finishError(
          message ||
            "Este navegador no pudo iniciar Spotify."
        );
      }
    );

    nextPlayer.addListener(
      "playback_error",
      ({ message }: { message: string }) => {
        if (!currentGeneration()) return;

        emit({
          isPlaying: false,
          error: message || "Spotify no pudo reproducir.",
        });
      }
    );

    nextPlayer.addListener("autoplay_failed", () => {
      if (!currentGeneration()) return;

      emit({
        isPlaying: false,
        error:
          "El navegador bloqueó el audio. Toca Play nuevamente.",
      });
    });

    timeoutId = window.setTimeout(() => {
      finishError(
        "Spotify no logró activar el reproductor en este dispositivo."
      );
    }, 10000);

    try {
      const connected = await nextPlayer.connect();

      if (!connected) {
        finishError(
          "Spotify no pudo conectar el reproductor."
        );
      }
    } catch (connectionError: any) {
      finishError(
        connectionError?.message ||
          "Spotify no pudo conectar el reproductor."
      );
    }
  });
}

export function subscribeSpotifyPlayer(
  listener: Listener
) {
  listeners.add(listener);
  listener(snapshot);

  return () => {
    listeners.delete(listener);
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

  if (playerReadyPromise) {
    return await playerReadyPromise;
  }

  if (
    player &&
    (!snapshot.ready || !snapshot.deviceId)
  ) {
    disconnectCurrentPlayer();

    emit({
      ready: false,
      deviceId: "",
      isPlaying: false,
    });
  }

  let creation: Promise<string>;

  creation = createPlayerAndWaitReady()
    .catch((error: any) => {
      disconnectCurrentPlayer();

      emit({
        ready: false,
        deviceId: "",
        isPlaying: false,
        error:
          error?.message ||
          "No se pudo iniciar Spotify.",
      });

      throw error;
    })
    .finally(() => {
      if (playerReadyPromise === creation) {
        playerReadyPromise = null;
      }
    });

  playerReadyPromise = creation;

  return await creation;
}

export async function retrySpotifyPlayer() {
  resetPlayer();
  return await ensureSpotifyPlayer();
}

export async function activateSpotifyElement() {
  if (
    !player ||
    !snapshot.ready ||
    typeof player.activateElement !== "function"
  ) {
    return false;
  }

  try {
    await player.activateElement();
    return true;
  } catch {
    return false;
  }
}

export async function spotifyPause() {
  if (!player) return;

  try {
    await player.pause?.();
  } catch {}

  emit({
    isPlaying: false,
  });
}

export async function spotifyResume() {
  if (!player || typeof player.resume !== "function") {
    return false;
  }

  try {
    await player.resume();

    const started = Date.now();

    while (Date.now() - started < 1800) {
      try {
        const state = await player.getCurrentState?.();

        if (state && !state.paused) {
          emit({
            isPlaying: true,
            positionMs: Number(
              state.position ||
                snapshot.positionMs ||
                0
            ),
            error: "",
          });

          return true;
        }
      } catch {}

      if (snapshot.isPlaying) {
        return true;
      }

      await new Promise<void>((resolve) =>
        window.setTimeout(resolve, 120)
      );
    }

    return false;
  } catch {
    return false;
  }
}

export async function spotifySeek(positionMs: number) {
  if (!player) return false;

  try {
    const safe = Math.max(0, Math.round(positionMs));

    await player.seek(safe);

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

/* ALUMNI_1_3_7_1_SPOTIFY_SINGLETON_READY */
