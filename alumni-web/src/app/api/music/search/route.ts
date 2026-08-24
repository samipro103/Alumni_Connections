import { NextResponse } from "next/server";
import {
  resolveSpotifyAccessForUser,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

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

  const prefix = `${variableName}=`;

  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

async function getClientCredentialsToken() {
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
      "Spotify Search no está configurado."
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
      authError =
        (await response.json()) as SpotifyAuthError;
    } catch {
      authError = null;
    }

    console.error("Spotify token error", {
      status: response.status,
      error: authError?.error || "unknown",
      description:
        authError?.error_description || "none",
    });

    throw new Error(
      "Spotify no pudo autenticar la aplicación."
    );
  }

  const token =
    (await response.json()) as SpotifyToken;

  cachedToken = {
    value: token.access_token,
    expiresAt:
      Date.now() +
      token.expires_in * 1000,
  };

  return cachedToken.value;
}

async function getSearchToken(
  request: Request
) {
  /*
   * IMPORTANTE:
   * Para un usuario que ya conectó Spotify usamos SU token OAuth.
   *
   * Esto evita depender de Client Credentials para la búsqueda
   * en Development Mode y hace que el catálogo se consulte dentro
   * de la misma sesión Spotify que Alumni ya verificó.
   *
   * Dejamos Client Credentials solo como fallback para otros
   * módulos que todavía llamen este endpoint sin sesión de usuario.
   */
  const authorization =
    request.headers.get("authorization");

  if (authorization) {
    const user =
      await verifyAlumniUser(
        authorization
      );

    if (user) {
      const resolved =
        await resolveSpotifyAccessForUser(
          user.id
        );

      return {
        token:
          resolved.accessToken,
        source:
          "user" as const,
      };
    }
  }

  const token =
    await getClientCredentialsToken();

  return {
    token,
    source:
      "client_credentials" as const,
  };
}

export async function GET(
  request: Request
) {
  const url = new URL(request.url);

  const query =
    url.searchParams
      .get("q")
      ?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({
      tracks: [],
    });
  }

  const rawMarket =
    url.searchParams
      .get("market")
      ?.toUpperCase() ||
    cleanCredential(
      process.env.SPOTIFY_MARKET,
      "SPOTIFY_MARKET"
    ).toUpperCase() ||
    "SV";

  const market =
    /^[A-Z]{2}$/.test(rawMarket)
      ? rawMarket
      : "SV";

  try {
    const auth =
      await getSearchToken(
        request
      );

    const endpoint = new URL(
      "https://api.spotify.com/v1/search"
    );

    endpoint.searchParams.set(
      "q",
      query
    );

    endpoint.searchParams.set(
      "type",
      "track"
    );

    endpoint.searchParams.set(
      "limit",
      "10"
    );

    endpoint.searchParams.set(
      "market",
      market
    );

    const response =
      await fetch(endpoint, {
        headers: {
          Authorization:
            `Bearer ${auth.token}`,
          Accept:
            "application/json",
        },
        cache: "no-store",
      });

    if (!response.ok) {
      let detail: any = null;

      try {
        detail =
          await response.json();
      } catch {
        detail = null;
      }

      console.error(
        "Spotify search error",
        {
          status:
            response.status,
          source:
            auth.source,
          reason:
            detail?.error
              ?.reason || null,
          message:
            detail?.error
              ?.message || null,
        }
      );

      if (
        response.status === 403
      ) {
        return NextResponse.json(
          {
            error:
              "Spotify no permitió buscar con esta cuenta. Si la app está en Development Mode, confirma que esta cuenta esté agregada en Users Management.",
          },
          { status: 403 }
        );
      }

      if (
        response.status === 429
      ) {
        const reason =
          detail?.error?.reason;

        return NextResponse.json(
          {
            error:
              reason ===
              "QUOTA_EXCEEDED"
                ? "Se alcanzó temporalmente la cuota de Spotify. Intenta de nuevo más tarde."
                : "Spotify está limitando temporalmente las búsquedas. Espera unos segundos e intenta otra vez.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error:
            detail?.error
              ?.message ||
            "No se pudo buscar en Spotify.",
        },
        { status: 502 }
      );
    }

    const data =
      await response.json();

    const items =
      (data?.tracks?.items ||
        []) as SpotifyTrack[];

    const tracks =
      items.map((track) => {
        const trackUrl =
          track.external_urls
            ?.spotify ||
          `https://open.spotify.com/track/${track.id}`;

        return {
          provider:
            "spotify" as const,
          provider_track_id:
            track.id,
          track_title:
            track.name,
          artist_name:
            (track.artists || [])
              .map(
                (artist) =>
                  artist.name
              )
              .filter(Boolean)
              .join(", ") ||
            "Spotify",
          album_name:
            track.album?.name ||
            null,
          artwork_url:
            track.album
              ?.images?.[0]
              ?.url || null,
          track_url:
            trackUrl,
          embed_url:
            `https://open.spotify.com/embed/track/${track.id}`,
          preview_url:
            track.preview_url ||
            null,
          duration_ms:
            typeof track
              .duration_ms ===
            "number"
              ? track.duration_ms
              : null,
        };
      });

    return NextResponse.json({
      tracks,
      market,
      auth_source:
        auth.source,
    });
  } catch (error: any) {
    console.error(
      "Spotify catalog search:",
      error?.message || error
    );

    const message =
      String(
        error?.message || ""
      );

    return NextResponse.json(
      {
        error:
          message.includes(
            "Spotify no está conectado"
          ) ||
          message.includes(
            "reconexión"
          )
            ? "Tu sesión de Spotify necesita reconectarse."
            : message ||
              "No se pudo inicializar la búsqueda de Spotify.",
      },
      { status: 500 }
    );
  }
}
