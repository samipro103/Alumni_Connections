"use client";

declare global {
  interface Window {
    Spotify?: any;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let sdkPromise: Promise<any> | null = null;

export function loadSpotifyWebPlaybackSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Spotify solo funciona en el navegador.")
    );
  }

  if (window.Spotify?.Player) {
    return Promise.resolve(window.Spotify);
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src="https://sdk.scdn.co/spotify-player.js"]'
    );

    const previous =
      window.onSpotifyWebPlaybackSDKReady;

    window.onSpotifyWebPlaybackSDKReady = () => {
      try {
        previous?.();
      } catch {}

      if (window.Spotify?.Player) {
        resolve(window.Spotify);
      } else {
        reject(
          new Error(
            "Spotify Web Playback SDK no inició."
          )
        );
      }
    };

    if (!existing) {
      const script =
        document.createElement("script");

      script.src =
        "https://sdk.scdn.co/spotify-player.js";
      script.async = true;

      script.onerror = () => {
        sdkPromise = null;

        reject(
          new Error(
            "No se pudo cargar el reproductor de Spotify."
          )
        );
      };

      document.body.appendChild(
        script
      );
    }

    window.setTimeout(() => {
      if (window.Spotify?.Player) {
        resolve(window.Spotify);
      }
    }, 1200);
  });

  return sdkPromise;
}
