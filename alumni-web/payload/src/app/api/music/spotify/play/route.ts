import {
  NextResponse,
} from "next/server";
import {
  getSpotifyConnection,
  resolveSpotifyAccessForUser,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

export async function POST(
  request: Request
) {
  const user =
    await verifyAlumniUser(
      request.headers.get(
        "authorization"
      )
    );

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Sesión Alumni no válida.",
      },
      {
        status: 401,
      }
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
      {
        status: 403,
      }
    );
  }

  const body =
    await request
      .json()
      .catch(
        () => ({})
      );

  const trackId =
    String(
      body?.track_id ||
        ""
    ).trim();

  const deviceId =
    String(
      body?.device_id ||
        ""
    ).trim();

  const startSeconds =
    Math.max(
      0,
      Math.floor(
        Number(
          body?.start_seconds ||
            0
        )
      )
    );

  if (
    !trackId ||
    !deviceId
  ) {
    return NextResponse.json(
      {
        error:
          "Falta canción o reproductor.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const resolved =
      await resolveSpotifyAccessForUser(
        user.id
      );

    const endpoint =
      new URL(
        "https://api.spotify.com/v1/me/player/play"
      );

    endpoint.searchParams.set(
      "device_id",
      deviceId
    );

    const spotifyResponse =
      await fetch(
        endpoint,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${resolved.accessToken}`,
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              uris: [
                `spotify:track:${trackId}`,
              ],
              position_ms:
                startSeconds *
                1000,
            }),
          cache:
            "no-store",
        }
      );

    if (
      !spotifyResponse.ok
    ) {
      const detail =
        await spotifyResponse
          .json()
          .catch(
            () => ({})
          );

      const spotifyMessage =
        String(
          detail?.error
            ?.message ||
            detail?.message ||
            ""
        ).trim();

      const status =
        spotifyResponse
          .status;

      const message =
        status === 404
          ? "Spotify perdió el reproductor de Alumni. Toca Play para reconectarlo."
          : status === 403
          ? spotifyMessage ||
            "Spotify rechazó la reproducción. Confirma que la cuenta conectada siga siendo Premium."
          : status === 401
          ? "La sesión de Spotify venció. Vuelve a conectar Spotify."
          : spotifyMessage ||
            "Spotify no pudo iniciar la canción.";

      return NextResponse.json(
        {
          error:
            message,
          spotify_status:
            status,
        },
        {
          status,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      device_id:
        deviceId,
    });
  } catch (
    error: any
  ) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Vuelve a conectar Spotify.",
      },
      {
        status: 401,
      }
    );
  }
}

/* ALUMNI_1_3_7_1_SPOTIFY_PLAY_DIAGNOSTICS */
