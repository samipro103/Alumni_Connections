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

let cachedToken:
  | {
      value: string;
      expiresAt: number;
    }
  | null = null;

async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error(
      "Spotify Search no está configurado. Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET."
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
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("Spotify token error:", response.status, detail);

    throw new Error(
      "Spotify rechazó las credenciales de la aplicación."
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
    process.env.SPOTIFY_MARKET?.toUpperCase() ||
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
      const detail = await response.text();
      console.error(
        "Spotify search error:",
        response.status,
        detail
      );

      return NextResponse.json(
        {
          error:
            response.status === 429
              ? "Spotify está limitando temporalmente las búsquedas. Intenta de nuevo en unos segundos."
              : "No se pudo buscar en Spotify.",
        },
        { status: response.status === 429 ? 429 : 502 }
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
    console.error("Spotify catalog search:", error);

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
