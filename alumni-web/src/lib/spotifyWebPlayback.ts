"use client";

export type SpotifyPlayerState = {
  paused: boolean;
  position: number;
};

type SpotifyPlayerError = {
  message: string;
};

type SpotifyPlayerListenerMap = {
  ready: (payload: { device_id: string }) => void;
  not_ready: (payload?: { device_id?: string }) => void;
  player_state_changed: (state: SpotifyPlayerState | null) => void;
  account_error: (payload: SpotifyPlayerError) => void;
  authentication_error: (payload: SpotifyPlayerError) => void;
  initialization_error: (payload: SpotifyPlayerError) => void;
  playback_error: (payload: SpotifyPlayerError) => void;
  autoplay_failed: () => void;
};

export type SpotifyWebPlaybackPlayer = {
  addListener<K extends keyof SpotifyPlayerListenerMap>(
    event: K,
    callback: SpotifyPlayerListenerMap[K]
  ): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getCurrentState(): Promise<SpotifyPlayerState | null>;
  seek(positionMs: number): Promise<void>;
};

type SpotifyPlayerOptions = {
  name: string;
  getOAuthToken: (
    callback: (token: string) => void
  ) => void | Promise<void>;
  volume?: number;
};

export type SpotifyWebPlaybackSdk = {
  Player: new (
    options: SpotifyPlayerOptions
  ) => SpotifyWebPlaybackPlayer;
};

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

function getSpotifySdk(): SpotifyWebPlaybackSdk | undefined {
  return (
    window as Window & {
      Spotify?: SpotifyWebPlaybackSdk;
    }
  ).Spotify;
}

const SDK_SRC =
  "https://sdk.scdn.co/spotify-player.js";

let sdkPromise:
  | Promise<SpotifyWebPlaybackSdk>
  | null = null;

export function loadSpotifyWebPlaybackSdk(): Promise<SpotifyWebPlaybackSdk> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error(
        "Spotify solo funciona en el navegador."
      )
    );
  }

  if (getSpotifySdk()?.Player) {
    return Promise.resolve(
      getSpotifySdk() as SpotifyWebPlaybackSdk
    );
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise =
    new Promise<SpotifyWebPlaybackSdk>(
      (resolve, reject) => {
        let settled = false;
        let timeoutId:
          | number
          | null = null;

        const previous =
          window.onSpotifyWebPlaybackSDKReady;

        function finish() {
          if (
            settled ||
            !getSpotifySdk()?.Player
          ) {
            return;
          }

          settled = true;

          if (timeoutId !== null) {
            window.clearTimeout(
              timeoutId
            );
          }

          resolve(
            getSpotifySdk() as SpotifyWebPlaybackSdk
          );
        }

        function fail(
          message: string
        ) {
          if (settled) return;

          settled = true;

          if (timeoutId !== null) {
            window.clearTimeout(
              timeoutId
            );
          }

          sdkPromise = null;
          reject(new Error(message));
        }

        window.onSpotifyWebPlaybackSDKReady =
          () => {
            try {
              previous?.();
            } catch {}

            finish();
          };

        let script =
          document.querySelector(
            `script[src="${SDK_SRC}"]`
          ) as
            | HTMLScriptElement
            | null;

        if (!script) {
          script =
            document.createElement(
              "script"
            );

          script.src = SDK_SRC;
          script.async = true;
          script.dataset.alumniSpotifySdk =
            "true";

          document.body.appendChild(
            script
          );
        }

        script.addEventListener(
          "load",
          finish,
          { once: true }
        );

        script.addEventListener(
          "error",
          () =>
            fail(
              "No se pudo cargar el reproductor de Spotify."
            ),
          { once: true }
        );

        timeoutId =
          window.setTimeout(() => {
            if (
              getSpotifySdk()?.Player
            ) {
              finish();
              return;
            }

            fail(
              "Spotify tardó demasiado en cargar el reproductor."
            );
          }, 10000);

        window.setTimeout(
          finish,
          0
        );
      }
    );

  return sdkPromise;
}

/* ALUMNI_1_3_7_1_SPOTIFY_SDK_LOADER */