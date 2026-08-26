"use client";

declare global {
  interface Window {
    Spotify?: any;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_SRC = "https://sdk.scdn.co/spotify-player.js";

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

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId: number | null = null;

    const previous = window.onSpotifyWebPlaybackSDKReady;

    function finish() {
      if (settled || !window.Spotify?.Player) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      resolve(window.Spotify);
    }

    function fail(message: string) {
      if (settled) return;
      settled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      sdkPromise = null;
      reject(new Error(message));
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      try { previous?.(); } catch {}
      finish();
    };

    let script = document.querySelector(
      `script[src="${SDK_SRC}"]`
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.dataset.alumniSpotifySdk = "true";
      document.body.appendChild(script);
    }

    script.addEventListener("load", finish, { once: true });
    script.addEventListener(
      "error",
      () => fail("No se pudo cargar el reproductor de Spotify."),
      { once: true }
    );

    timeoutId = window.setTimeout(() => {
      if (window.Spotify?.Player) {
        finish();
        return;
      }

      fail("Spotify tardó demasiado en cargar el reproductor.");
    }, 10000);

    window.setTimeout(finish, 0);
  });

  return sdkPromise;
}

/* ALUMNI_1_3_7_1_SPOTIFY_SDK_LOADER */
