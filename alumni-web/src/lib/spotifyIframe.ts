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
      const previousReady = window.onSpotifyIframeApiReady;

      window.onSpotifyIframeApiReady = (api) => {
        window.__alumniSpotifyIframeApi = api;
        previousReady?.(api);
        resolve(api);
      };

      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://open.spotify.com/embed/iframe-api/v1"]'
      );

      if (existing) {
        const waitForApi = window.setInterval(() => {
          if (window.__alumniSpotifyIframeApi) {
            window.clearInterval(waitForApi);
            resolve(window.__alumniSpotifyIframeApi);
          }
        }, 100);

        window.setTimeout(() => {
          window.clearInterval(waitForApi);
        }, 10000);

        return;
      }

      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      script.onerror = () =>
        reject(new Error("No se pudo cargar Spotify."));
      document.body.appendChild(script);
    }
  );

  return window.__alumniSpotifyIframePromise;
}
