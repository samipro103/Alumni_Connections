import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  exchangeSpotifyCode,
  getSpotifyMe,
  signOwner,
  upsertSpotifyConnection,
  verifyPendingUser,
} from "@/lib/spotifyServer";

function redirectTo(
  request: Request,
  status: string
) {
  const origin = new URL(request.url).origin;

  return NextResponse.redirect(
    `${origin}/settings?section=music&spotify=${encodeURIComponent(
      status
    )}`
  );
}

function clearPending(response: NextResponse) {
  response.cookies.set(
    SPOTIFY_COOKIES.state,
    "",
    cookieOptions(0)
  );

  response.cookies.set(
    SPOTIFY_COOKIES.pendingUser,
    "",
    cookieOptions(0)
  );
}

function clearSession(response: NextResponse) {
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
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const spotifyError =
    url.searchParams.get("error") || "";

  const cookieStore = await cookies();
  const expectedState =
    cookieStore.get(SPOTIFY_COOKIES.state)?.value || "";

  if (
    spotifyError ||
    !code ||
    !state ||
    !expectedState ||
    state !== expectedState
  ) {
    const response = redirectTo(
      request,
      spotifyError === "access_denied"
        ? "cancelled"
        : "error"
    );

    clearPending(response);
    return response;
  }

  const userId = verifyPendingUser(
    cookieStore.get(
      SPOTIFY_COOKIES.pendingUser
    )?.value,
    state
  );

  if (!userId) {
    const response = redirectTo(
      request,
      "error"
    );

    clearPending(response);
    return response;
  }

  try {
    const origin = new URL(request.url).origin;
    const redirectUri =
      `${origin}/api/music/spotify/callback`;

    const token = await exchangeSpotifyCode(
      code,
      redirectUri
    );

    let me;

    try {
      me = await getSpotifyMe(
        token.access_token
      );
    } catch (profileError: any) {
      const response = redirectTo(
        request,
        profileError?.status === 403
          ? "not-authorized"
          : "error"
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    await upsertSpotifyConnection(
      userId,
      me
    );

    const product =
      (me.product || "").toLowerCase();

    if (product !== "premium") {
      const response = redirectTo(
        request,
        "not-premium"
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    const response = redirectTo(
      request,
      "connected"
    );

    clearPending(response);

    response.cookies.set(
      SPOTIFY_COOKIES.owner,
      signOwner(userId),
      cookieOptions(180 * 24 * 60 * 60)
    );

    response.cookies.set(
      SPOTIFY_COOKIES.access,
      token.access_token,
      cookieOptions(
        Math.max(
          60,
          Number(token.expires_in || 3600)
        )
      )
    );

    if (token.refresh_token) {
      response.cookies.set(
        SPOTIFY_COOKIES.refresh,
        token.refresh_token,
        cookieOptions(
          180 * 24 * 60 * 60
        )
      );
    }

    response.cookies.set(
      SPOTIFY_COOKIES.expiresAt,
      String(
        Date.now() +
          Math.max(
            60,
            Number(token.expires_in || 3600)
          ) *
            1000
      ),
      cookieOptions(
        180 * 24 * 60 * 60
      )
    );

    return response;
  } catch (error: any) {
    console.error(
      "Spotify callback:",
      error?.message || error
    );

    const response = redirectTo(
      request,
      "error"
    );

    clearPending(response);
    clearSession(response);
    return response;
  }
}
