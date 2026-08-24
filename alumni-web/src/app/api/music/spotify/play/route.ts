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

    return {
      message:
        data?.error?.message ||
        data?.message ||
        null,
      reason:
        data?.error?.reason ||
        null,
    };
  } catch {
    return {
      message: null,
      reason: null,
    };
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

    const headers = {
      Authorization:
        `Bearer ${resolved.accessToken}`,
      "Content-Type":
        "application/json",
    };

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
          headers,
          body:
            JSON.stringify({
              uris: [
                `spotify:track:${trackId}`,
              ],
              position_ms:
                startSeconds *
                1000,
            }),
          cache: "no-store",
        }
      );
    }

    async function transferPlayback() {
      return fetch(
        "https://api.spotify.com/v1/me/player",
        {
          method: "PUT",
          headers,
          body:
            JSON.stringify({
              device_ids: [
                deviceId,
              ],
              play: false,
            }),
          cache: "no-store",
        }
      );
    }

    /*
     * Primer intento directo.
     * Normalmente funciona si el Web Playback SDK ya es
     * el dispositivo activo.
     */
    let spotifyResponse =
      await startPlayback();

    if (
      spotifyResponse.ok
    ) {
      return NextResponse.json({
        ok: true,
      });
    }

    const firstStatus =
      spotifyResponse.status;

    const firstError =
      await readSpotifyError(
        spotifyResponse
      );

    /*
     * En móvil el SDK puede emitir "ready" unos instantes antes
     * de que Spotify Connect reconozca el device_id como activo.
     *
     * Cuando pasa eso /play suele responder 404.
     * Transferimos el playback a Alumni, esperamos un instante
     * y reintentamos. Esto ocurre solo al cargar la canción;
     * después el selector usa player.seek() local.
     */
    if (
      firstStatus === 404
    ) {
      const transfer =
        await transferPlayback();

      if (
        transfer.ok
      ) {
        for (
          let attempt = 0;
          attempt < 3;
          attempt += 1
        ) {
          await sleep(
            260 +
              attempt * 180
          );

          spotifyResponse =
            await startPlayback();

          if (
            spotifyResponse.ok
          ) {
            return NextResponse.json(
              {
                ok: true,
                recovered:
                  true,
              }
            );
          }

          if (
            spotifyResponse.status !==
            404
          ) {
            break;
          }
        }
      }
    }

    const finalError =
      await readSpotifyError(
        spotifyResponse
      );

    console.error(
      "Spotify playback error",
      {
        status:
          spotifyResponse.status,
        first_status:
          firstStatus,
        reason:
          finalError.reason ||
          firstError.reason ||
          null,
        message:
          finalError.message ||
          firstError.message ||
          null,
      }
    );

    if (
      spotifyResponse.status ===
      403
    ) {
      return NextResponse.json(
        {
          error:
            "Spotify no permitió controlar la reproducción. Verifica que la cuenta siga conectada como Premium.",
        },
        { status: 403 }
      );
    }

    if (
      spotifyResponse.status ===
      404
    ) {
      return NextResponse.json(
        {
          error:
            "El reproductor de Spotify tardó en activarse. Toca la onda una vez más.",
        },
        { status: 409 }
      );
    }

    if (
      spotifyResponse.status ===
      429
    ) {
      return NextResponse.json(
        {
          error:
            "Spotify está limitando temporalmente la reproducción. Espera unos segundos.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          finalError.message ||
          firstError.message ||
          "Spotify no pudo iniciar la canción.",
      },
      {
        status:
          spotifyResponse.status ||
          502,
      }
    );
  } catch (
    error: any
  ) {
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
