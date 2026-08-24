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

type SpotifyDevice = {
  id?: string | null;
  is_active?: boolean;
  is_restricted?: boolean;
  name?: string;
};

async function readJson(
  response: Response
) {
  try {
    return await response.json();
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

    const headers = {
      Authorization:
        `Bearer ${resolved.accessToken}`,
      "Content-Type":
        "application/json",
      Accept:
        "application/json",
    };

    async function getDevices() {
      const response =
        await fetch(
          "https://api.spotify.com/v1/me/player/devices",
          {
            headers,
            cache:
              "no-store",
          }
        );

      if (!response.ok) {
        return [];
      }

      const data =
        await readJson(
          response
        );

      return (
        data?.devices || []
      ) as SpotifyDevice[];
    }

    async function waitForDevice() {
      for (
        let attempt = 0;
        attempt < 8;
        attempt += 1
      ) {
        const devices =
          await getDevices();

        const target =
          devices.find(
            (device) =>
              device.id ===
              deviceId
          );

        if (
          target &&
          !target.is_restricted
        ) {
          return true;
        }

        await sleep(
          180 +
            attempt * 70
        );
      }

      return false;
    }

    async function transferToAlumni() {
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

              /*
               * En iPhone activateElement() se llama desde el gesto
               * antes de llegar a este endpoint. play:true hace que
               * Spotify deje Alumni como dispositivo realmente activo.
               */
              play: true,
            }),
          cache:
            "no-store",
        }
      );
    }

    async function isAlumniActive() {
      const response =
        await fetch(
          "https://api.spotify.com/v1/me/player",
          {
            headers,
            cache:
              "no-store",
          }
        );

      if (
        response.status ===
        204
      ) {
        return false;
      }

      if (!response.ok) {
        return false;
      }

      const data =
        await readJson(
          response
        );

      return (
        data?.device?.id ===
        deviceId
      );
    }

    async function waitUntilActive() {
      for (
        let attempt = 0;
        attempt < 8;
        attempt += 1
      ) {
        if (
          await isAlumniActive()
        ) {
          return true;
        }

        await sleep(
          180 +
            attempt * 60
        );
      }

      return false;
    }

    async function playSelectedTrack() {
      /*
       * Ya transferimos y confirmamos el dispositivo activo.
       * No enviamos device_id otra vez para evitar la carrera
       * de Spotify Connect en iOS.
       */
      return fetch(
        "https://api.spotify.com/v1/me/player/play",
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
          cache:
            "no-store",
        }
      );
    }

    /*
     * 1) El SDK ya emitió ready, pero en iOS Spotify Connect
     * puede tardar un poco en publicar el device en Web API.
     */
    const deviceVisible =
      await waitForDevice();

    if (!deviceVisible) {
      return NextResponse.json(
        {
          error:
            "Spotify todavía está preparando el reproductor.",
        },
        { status: 409 }
      );
    }

    /*
     * 2) Transferimos Alumni y pedimos play:true.
     * Spotify recomienda activateElement() antes de esta transferencia
     * en navegadores móviles; eso ya ocurre en el pointer down.
     */
    const transfer =
      await transferToAlumni();

    if (!transfer.ok) {
      const detail =
        await readJson(
          transfer
        );

      console.error(
        "Spotify transfer error",
        {
          status:
            transfer.status,
          message:
            detail?.error
              ?.message ||
            null,
        }
      );

      return NextResponse.json(
        {
          error:
            transfer.status ===
            403
              ? "Spotify Premium no permitió activar el reproductor."
              : "Spotify no pudo activar el reproductor.",
        },
        {
          status:
            transfer.status ||
            502,
        }
      );
    }

    /*
     * 3) Spotify documenta que el orden entre Transfer Playback
     * y otros Player endpoints no está garantizado.
     * Por eso esperamos a VER el device como activo.
     */
    await waitUntilActive();

    /*
     * 4) Recién ahora cargamos la canción elegida.
     */
    let playback =
      await playSelectedTrack();

    for (
      let attempt = 0;
      !playback.ok &&
      playback.status ===
        404 &&
      attempt < 3;
      attempt += 1
    ) {
      await sleep(
        260 +
          attempt * 180
      );

      playback =
        await playSelectedTrack();
    }

    if (!playback.ok) {
      const detail =
        await readJson(
          playback
        );

      console.error(
        "Spotify play error",
        {
          status:
            playback.status,
          message:
            detail?.error
              ?.message ||
            null,
          reason:
            detail?.error
              ?.reason ||
            null,
        }
      );

      return NextResponse.json(
        {
          error:
            playback.status ===
            403
              ? "Spotify no permitió reproducir esta canción."
              : playback.status ===
                429
              ? "Spotify está limitando temporalmente la reproducción."
              : "Spotify no pudo iniciar la canción.",
        },
        {
          status:
            playback.status ||
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
    console.error(
      "Spotify play unexpected:",
      error?.message || error
    );

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
