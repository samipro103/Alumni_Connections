import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  resolveSpotifyAccess,
  verifyAlumniUser,
  verifyOwner,
} from "@/lib/spotifyServer";

export async function GET(request: Request) {
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
      { error: "Conecta Spotify Premium." },
      { status: 401 }
    );
  }

  try {
    const resolved =
      await resolveSpotifyAccess(
        cookieStore
      );

    const response = NextResponse.json({
      access_token:
        resolved.accessToken,
      expires_at:
        resolved.expiresAt,
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
  } catch {
    return NextResponse.json(
      { error: "Vuelve a conectar Spotify Premium." },
      { status: 401 }
    );
  }
}
