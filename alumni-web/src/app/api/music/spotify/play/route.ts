import { NextResponse } from "next/server";
import {
  getSpotifyConnection,
  resolveSpotifyAccessForUser,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

function sleep(ms: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  );
}

async function readSpotifyError(
  response: Response
) {
  try {
    const data =
      await response.json();

    return (
      data?.error?.message ||
      data?.message ||
      null
    );
  } catch {
    return null;
  }
}

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

  const body =
    await request
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

  if (
    !trackId ||
    !deviceId
  ) {
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

    async function startPlayback() {
      const endpoint =
        new URL(
          "https://api.spotify.com/v1/me/player/play"
        );

      endpoint.searchParams.set(
        "device_id",
        deviceId
      );

      return fetch(
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
    }

    /*
     * Volvemos al comportamiento que ya funcionaba:
     * reproducir directamente sobre el device_id del Web Playback SDK.
     *
     * Solo añadimos dos reintentos cortos si Spotify devuelve 404
     * inmediatamente después de ready. No hacemos transfer playback,
     * no esperamos device lists y no bloqueamos el arranque.
     */
    let response =
      await startPlayback();

    if (
      !response.ok &&
      response.status ===
        404
    ) {
      await sleep(220);

      response =
        await startPlayback();
    }

    if (
      !response.ok &&
      response.status ===
        404
    ) {
      await sleep(380);

      response =
        await startPlayback();
    }

    if (!response.ok) {
      const message =
        await readSpotifyError(
          response
        );

      console.error(
        "Spotify play error",
        {
          status:
            response.status,
          message,
        }
      );

      return NextResponse.json(
        {
          error:
            response.status ===
            403
              ? "Spotify Premium no permitió la reproducción."
              : response.status ===
                429
              ? "Spotify está limitando temporalmente la reproducción."
              : message ||
                "Spotify no pudo iniciar la canción.",
        },
        {
          status:
            response.status ||
            502,
        }
      );
    }

    return NextResponse.json({
      ok: true,
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
      { status: 500 }
    );
  }
}
