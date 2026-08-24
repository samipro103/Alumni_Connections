"use client";

declare global {
  interface Window {
    Spotify?: any;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

const SDK_SRC =
  "https://sdk.scdn.co/spotify-player.js";

let sdkPromise:
  | Promise<any>
  | null = null;

function spotifyReady() {
  return Boolean(
    window.Spotify?.Player
  );
}

function waitForSpotify(
  timeoutMs: number
) {
  return new Promise<any>(
    (
      resolve,
      reject
    ) => {
      const started =
        Date.now();

      const timer =
        window.setInterval(
          () => {
            if (
              spotifyReady()
            ) {
              window.clearInterval(
                timer
              );

              resolve(
                window.Spotify
              );

              return;
            }

            if (
              Date.now() -
                started >=
              timeoutMs
            ) {
              window.clearInterval(
                timer
              );

              reject(
                new Error(
                  "Spotify Web Playback SDK tardó demasiado en iniciar."
                )
              );
            }
          },
          100
        );
    }
  );
}

function installSdkScript() {
  return new Promise<any>(
    (
      resolve,
      reject
    ) => {
      const previous =
        window.onSpotifyWebPlaybackSDKReady;

      let settled =
        false;

      function finish(
        spotify: any
      ) {
        if (settled) {
          return;
        }

        settled = true;
        resolve(spotify);
      }

      function fail(
        message: string
      ) {
        if (settled) {
          return;
        }

        settled = true;

        reject(
          new Error(message)
        );
      }

      window.onSpotifyWebPlaybackSDKReady =
        () => {
          try {
            previous?.();
          } catch {}

          if (
            spotifyReady()
          ) {
            finish(
              window.Spotify
            );
          }
        };

      const script =
        document.createElement(
          "script"
        );

      script.src = SDK_SRC;
      script.async = true;

      script.onerror =
        () => {
          fail(
            "No se pudo cargar el reproductor de Spotify."
          );
        };

      document.body.appendChild(
        script
      );

      void waitForSpotify(
        8000
      )
        .then(finish)
        .catch(() => {
          try {
            script.remove();
          } catch {}

          fail(
            "Spotify no pudo preparar el reproductor. Intenta nuevamente."
          );
        });
    }
  );
}

async function loadSdkFresh() {
  if (
    spotifyReady()
  ) {
    return window.Spotify;
  }

  /*
   * En PWA/iPhone puede quedar el <script> de Spotify en el DOM
   * después de cambiar de pantalla, pero su callback ya ocurrió.
   *
   * La versión anterior veía ese script y esperaba un callback
   * que nunca iba a volver a ejecutarse, dejando "Preparando audio"
   * para siempre.
   */
  const existing =
    document.querySelector<
      HTMLScriptElement
    >(
      `script[src="${SDK_SRC}"]`
    );

  if (existing) {
    try {
      return await waitForSpotify(
        1800
      );
    } catch {
      /*
       * Script huérfano / SDK no inicializado.
       * Lo retiramos y hacemos una carga limpia.
       */
      try {
        existing.remove();
      } catch {}
    }
  }

  return installSdkScript();
}

export function loadSpotifyWebPlaybackSdk() {
  if (
    typeof window ===
    "undefined"
  ) {
    return Promise.reject(
      new Error(
        "Spotify solo funciona en el navegador."
      )
    );
  }

  if (
    spotifyReady()
  ) {
    return Promise.resolve(
      window.Spotify
    );
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise =
    loadSdkFresh().catch(
      (error) => {
        /*
         * Muy importante:
         * si una inicialización falla, no dejamos una Promise
         * rechazada cacheada para siempre. El siguiente intento
         * puede cargar Spotify nuevamente.
         */
        sdkPromise = null;
        throw error;
      }
    );

  return sdkPromise;
}
