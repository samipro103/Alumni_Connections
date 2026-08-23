import { NextResponse } from "next/server";

type SpotifyToken = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms?: number;
  preview_url?: string | null;
  artists?: Array<{ name?: string }>;
  album?: {
    name?: string;
    images?: Array<{
      url: string;
      height?: number | null;
      width?: number | null;
    }>;
  };
  external_urls?: {
    spotify?: string;
  };
};

type SpotifyAuthError = {
  error?: string;
  error_description?: string;
};

let cachedToken:
  | {
      value: string;
      expiresAt: number;
    }
  | null = null;

function cleanCredential(
  rawValue: string | undefined,
  variableName: string
) {
  let value = (rawValue || "").trim();

  // Permite corregir el error común de pegar:
  // SPOTIFY_CLIENT_ID=xxxx
  // como VALUE completo dentro de Vercel.
  const prefix = `${variableName}=`;

  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }

  // También tolera valores pegados con comillas.
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

async function getSpotifyToken() {
  const clientId = cleanCredential(
    process.env.SPOTIFY_CLIENT_ID,
    "SPOTIFY_CLIENT_ID"
  );

  const clientSecret = cleanCredential(
    process.env.SPOTIFY_CLIENT_SECRET,
    "SPOTIFY_CLIENT_SECRET"
  );

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify Search no está configurado. Revisa SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en Vercel."
    );
  }

  if (
    cachedToken &&
    Date.now() < cachedToken.expiresAt - 60_000
  ) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let authError: SpotifyAuthError | null = null;

    try {
      authError = (await response.json()) as SpotifyAuthError;
    } catch {
      authError = null;
    }

    console.error("Spotify token error", {
      status: response.status,
      error: authError?.error || "unknown",
      description: authError?.error_description || "none",
      // Nunca loguear Client ID ni Client Secret.
    });

    if (
      response.status === 400 ||
      response.status === 401 ||
      authError?.error === "invalid_client"
    ) {
      throw new Error(
        "Spotify no pudo autenticar Alumni. Revisa que el Client ID y Client Secret sean de la misma app, que en Vercel hayas pegado SOLO el valor (sin SPOTIFY_CLIENT_ID= ni comillas), que las variables estén habilitadas para Production y después haz Redeploy. Las apps nuevas de Spotify en Development Mode también requieren que el dueño de la app tenga Spotify Premium."
      );
    }

    throw new Error(
      "Spotify no pudo autenticar la aplicación en este momento."
    );
  }

  const token = (await response.json()) as SpotifyToken;

  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return cachedToken.value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ tracks: [] });
  }

  const rawMarket =
    url.searchParams.get("market")?.toUpperCase() ||
    cleanCredential(process.env.SPOTIFY_MARKET, "SPOTIFY_MARKET").toUpperCase() ||
    "SV";

  const market = /^[A-Z]{2}$/.test(rawMarket)
    ? rawMarket
    : "SV";

  try {
    const token = await getSpotifyToken();

    const endpoint = new URL(
      "https://api.spotify.com/v1/search"
    );

    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("type", "track");
    endpoint.searchParams.set("limit", "10");
    endpoint.searchParams.set("market", market);

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let detail: any = null;

      try {
        detail = await response.json();
      } catch {
        detail = null;
      }

      console.error("Spotify search error", {
        status: response.status,
        reason: detail?.error?.reason || null,
        message: detail?.error?.message || null,
      });

      if (response.status === 429) {
        const reason = detail?.error?.reason;

        return NextResponse.json(
          {
            error:
              reason === "QUOTA_EXCEEDED"
                ? "Se alcanzó temporalmente la cuota de Spotify para esta app. Intenta más tarde."
                : "Spotify está limitando temporalmente las búsquedas. Intenta de nuevo en unos segundos.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            detail?.error?.message ||
            "No se pudo buscar en Spotify.",
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    const items = (data?.tracks?.items || []) as SpotifyTrack[];

    const tracks = items.map((track) => {
      const trackUrl =
        track.external_urls?.spotify ||
        `https://open.spotify.com/track/${track.id}`;

      return {
        provider: "spotify" as const,
        provider_track_id: track.id,
        track_title: track.name,
        artist_name:
          (track.artists || [])
            .map((artist) => artist.name)
            .filter(Boolean)
            .join(", ") || "Spotify",
        album_name: track.album?.name || null,
        artwork_url: track.album?.images?.[0]?.url || null,
        track_url: trackUrl,
        embed_url: `https://open.spotify.com/embed/track/${track.id}`,
        preview_url: track.preview_url || null,
        duration_ms:
          typeof track.duration_ms === "number"
            ? track.duration_ms
            : null,
      };
    });

    return NextResponse.json({
      tracks,
      market,
    });
  } catch (error: any) {
    console.error("Spotify catalog search:", error?.message || error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "No se pudo inicializar la búsqueda de Spotify.",
      },
      { status: 500 }
    );
  }
}
