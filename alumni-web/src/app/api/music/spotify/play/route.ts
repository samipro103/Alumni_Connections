import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  resolveSpotifyAccess,
  verifyAlumniUser,
  verifyOwner,
} from "@/lib/spotifyServer";

export async function POST(request: Request) {
  const user = await verifyAlumniUser(
    request.headers.get("authorization")
  );

  if (!user) {
    return NextResponse.json(
      { error: "Sesión Alumni no válida." },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();

  const ownerId = verifyOwner(
    cookieStore.get(
      SPOTIFY_COOKIES.owner
    )?.value
  );

  if (!ownerId || ownerId !== user.id) {
    return NextResponse.json(
      {
        error:
          "Conecta Spotify Premium para reproducir.",
        reason: "spotify_disconnected",
      },
      { status: 401 }
    );
  }

  const body = await request
    .json()
    .catch(() => ({}));

  const trackId =
    String(body?.track_id || "").trim();

  const deviceId =
    String(body?.device_id || "").trim();

  const startSeconds = Math.max(
    0,
    Math.floor(
      Number(body?.start_seconds || 0)
    )
  );

  if (!trackId || !deviceId) {
    return NextResponse.json(
      { error: "Falta canción o reproductor." },
      { status: 400 }
    );
  }

  try {
    const resolved =
      await resolveSpotifyAccess(
        cookieStore
      );

    const endpoint = new URL(
      "https://api.spotify.com/v1/me/player/play"
    );

    endpoint.searchParams.set(
      "device_id",
      deviceId
    );

    const spotifyResponse = await fetch(
      endpoint,
      {
        method: "PUT",
        headers: {
          Authorization:
            `Bearer ${resolved.accessToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          uris: [
            `spotify:track:${trackId}`,
          ],
          position_ms:
            startSeconds * 1000,
        }),
        cache: "no-store",
      }
    );

    if (!spotifyResponse.ok) {
      const detail = await spotifyResponse
        .json()
        .catch(() => ({}));

      const status =
        spotifyResponse.status;

      return NextResponse.json(
        {
          error:
            status === 403
              ? "Spotify Premium es obligatorio para reproducir dentro de Alumni."
              : detail?.error?.message ||
                "Spotify no pudo iniciar la canción.",
          reason:
            status === 403
              ? "premium_required"
              : "spotify_playback",
        },
        { status }
      );
    }

    const response = NextResponse.json({
      ok: true,
      start_seconds:
        startSeconds,
    });

    if (resolved.refreshed) {
      response.cookies.set(
        SPOTIFY_COOKIES.access,
        resolved.accessToken,
        cookieOptions(
          Math.max(
            60,
            Number(
              resolved.refreshed.expires_in ||
                3600
            )
          )
        )
      );

      response.cookies.set(
        SPOTIFY_COOKIES.refresh,
        resolved.refreshToken,
        cookieOptions(
          180 * 24 * 60 * 60
        )
      );

      response.cookies.set(
        SPOTIFY_COOKIES.expiresAt,
        String(resolved.expiresAt),
        cookieOptions(
          180 * 24 * 60 * 60
        )
      );
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Vuelve a conectar Spotify.",
      },
      { status: 401 }
    );
  }
}
