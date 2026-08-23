export type SpotifyIframeApi = {
  createController: (
    element: HTMLElement,
    options: {
      uri?: string;
      url?: string;
      width?: number | string;
      height?: number | string;
    },
    callback: (controller: any) => void
  ) => void;
};

const SPOTIFY_IFRAME_API_SRC =
  "https://open.spotify.com/embed/iframe-api/v1";

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIframeApi) => void;
    __alumniSpotifyIframeApi?: SpotifyIframeApi;
    __alumniSpotifyIframePromise?: Promise<SpotifyIframeApi>;
  }
}

export function loadSpotifyIframeApi(): Promise<SpotifyIframeApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Spotify requiere navegador."));
  }

  if (window.__alumniSpotifyIframeApi) {
    return Promise.resolve(window.__alumniSpotifyIframeApi);
  }

  if (window.__alumniSpotifyIframePromise) {
    return window.__alumniSpotifyIframePromise;
  }

  window.__alumniSpotifyIframePromise = new Promise<SpotifyIframeApi>(
    (resolve, reject) => {
      let settled = false;

      const finishResolve = (api: SpotifyIframeApi) => {
        if (settled) return;
        settled = true;
        window.__alumniSpotifyIframeApi = api;
        resolve(api);
      };

      const finishReject = (message: string) => {
        if (settled) return;
        settled = true;
        window.__alumniSpotifyIframePromise = undefined;
        reject(new Error(message));
      };

      const previousReady = window.onSpotifyIframeApiReady;

      // IMPORTANTE:
      // La callback global debe existir ANTES de cargar el script.
      // En la versión anterior, si el script ya estaba cargado por una
      // navegación previa, la promesa podía quedar esperando para siempre.
      window.onSpotifyIframeApiReady = (api) => {
        finishResolve(api);

        if (
          previousReady &&
          previousReady !== window.onSpotifyIframeApiReady
        ) {
          try {
            previousReady(api);
          } catch {
            // No permitimos que una callback anterior rompa Alumni.
          }
        }
      };

      // Si había una copia previa del script pero no tenemos la API guardada,
      // la retiramos y la cargamos de nuevo para que Spotify vuelva a disparar
      // onSpotifyIframeApiReady.
      document
        .querySelectorAll<HTMLScriptElement>(
          'script[src^="https://open.spotify.com/embed/iframe-api/v1"]'
        )
        .forEach((script) => script.remove());

      const script = document.createElement("script");
      script.src = SPOTIFY_IFRAME_API_SRC;
      script.async = true;

      script.onerror = () => {
        finishReject("No se pudo cargar el reproductor de Spotify.");
      };

      document.body.appendChild(script);

      // Nunca más dejamos un spinner infinito.
      window.setTimeout(() => {
        if (window.__alumniSpotifyIframeApi) {
          finishResolve(window.__alumniSpotifyIframeApi);
          return;
        }

        finishReject(
          "Spotify tardó demasiado en responder. Intenta de nuevo."
        );
      }, 7000);
    }
  );

  return window.__alumniSpotifyIframePromise;
}
