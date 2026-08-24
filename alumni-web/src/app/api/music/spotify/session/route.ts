import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  getSpotifyMe,
  resolveSpotifyAccess,
  signOwner,
  upsertSpotifyConnection,
  verifyAlumniUser,
  verifyOwner,
} from "@/lib/spotifyServer";

function clearSpotifySession(
  response: NextResponse
) {
  for (const name of [
    SPOTIFY_COOKIES.owner,
    SPOTIFY_COOKIES.access,
    SPOTIFY_COOKIES.refresh,
    SPOTIFY_COOKIES.expiresAt,
  ]) {
    response.cookies.set(
      name,
      "",
      cookieOptions(0)
    );
  }
}

export async function GET(request: Request) {
  const user = await verifyAlumniUser(
    request.headers.get("authorization")
  );

  if (!user) {
    return NextResponse.json(
      {
        connected: false,
        premium: false,
        reason: "alumni-session",
      },
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
        connected: false,
        premium: false,
        reason: "disconnected",
      },
      { status: 401 }
    );
  }

  try {
    const resolved =
      await resolveSpotifyAccess(
        cookieStore
      );

    const me = await getSpotifyMe(
      resolved.accessToken
    );

    await upsertSpotifyConnection(
      user.id,
      me
    );

    const premium =
      (me.product || "").toLowerCase() ===
      "premium";

    const response = NextResponse.json(
      {
        connected: premium,
        premium,
        display_name:
          me.display_name || null,
        product: me.product || null,
        reason: premium
          ? null
          : "not_premium",
      },
      {
        status: premium ? 200 : 402,
      }
    );

    if (premium) {
      response.cookies.set(
        SPOTIFY_COOKIES.owner,
        signOwner(user.id),
        cookieOptions(
          180 * 24 * 60 * 60
        )
      );
    }

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

    if (!premium) {
      clearSpotifySession(response);
    }

    return response;
  } catch (error: any) {
    console.error(
      "Spotify session:",
      error?.message || error
    );

    const response = NextResponse.json(
      {
        connected: false,
        premium: false,
        reason: "disconnected",
      },
      { status: 401 }
    );

    clearSpotifySession(response);
    return response;
  }
}
