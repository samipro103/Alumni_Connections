import { NextResponse } from "next/server";
import {
  getSpotifyConnection,
  resolveSpotifyAccessForUser,
  verifyAlumniUser,
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

  const connection =
    await getSpotifyConnection(
      user.id
    );

  if (
    !connection ||
    connection.product !==
      "premium"
  ) {
    return NextResponse.json(
      {
        error:
          "Spotify Premium es obligatorio.",
      },
      { status: 403 }
    );
  }

  const body = await request
    .json()
    .catch(() => ({}));

  const trackId =
    String(
      body?.track_id || ""
    ).trim();

  const deviceId =
    String(
      body?.device_id || ""
    ).trim();

  const startSeconds =
    Math.max(
      0,
      Math.floor(
        Number(
          body?.start_seconds || 0
        )
      )
    );

  if (!trackId || !deviceId) {
    return NextResponse.json(
      {
        error:
          "Falta canción o reproductor.",
      },
      { status: 400 }
    );
  }

  try {
    const resolved =
      await resolveSpotifyAccessForUser(
        user.id
      );

    const endpoint = new URL(
      "https://api.spotify.com/v1/me/player/play"
    );

    endpoint.searchParams.set(
      "device_id",
      deviceId
    );

    const spotifyResponse =
      await fetch(endpoint, {
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
      });

    if (!spotifyResponse.ok) {
      return NextResponse.json(
        {
          error:
            spotifyResponse.status ===
            403
              ? "Spotify Premium es obligatorio para reproducir dentro de Alumni."
              : "Spotify no pudo iniciar la canción.",
        },
        {
          status:
            spotifyResponse.status,
        }
      );
    }

    return NextResponse.json({
      ok: true,
    });
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
