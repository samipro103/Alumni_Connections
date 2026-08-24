import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  exchangeSpotifyCode,
  getSpotifyMe,
  safeSpotifyReturnPath,
  signOwner,
  upsertSpotifyConnection,
  verifyPendingUser,
} from "@/lib/spotifyServer";

function redirectTo(
  request: Request,
  status: string,
  returnTo?: string | null
) {
  const origin = new URL(request.url).origin;

  const destination = new URL(
    safeSpotifyReturnPath(returnTo),
    origin
  );

  destination.searchParams.set(
    "spotify",
    status
  );

  return NextResponse.redirect(destination);
}

function clearPending(
  response: NextResponse
) {
  for (const name of [
    SPOTIFY_COOKIES.state,
    SPOTIFY_COOKIES.pendingUser,
    SPOTIFY_COOKIES.returnTo,
  ]) {
    response.cookies.set(
      name,
      "",
      cookieOptions(0)
    );
  }
}

function clearSession(
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

export async function GET(
  request: Request
) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code") || "";

  const state =
    url.searchParams.get("state") || "";

  const spotifyError =
    url.searchParams.get("error") || "";

  const cookieStore = await cookies();

  const expectedState =
    cookieStore.get(
      SPOTIFY_COOKIES.state
    )?.value || "";

  const returnTo =
    cookieStore.get(
      SPOTIFY_COOKIES.returnTo
    )?.value || null;

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
        : "oauth-state",
      returnTo
    );

    clearPending(response);
    return response;
  }

  const userId =
    verifyPendingUser(
      cookieStore.get(
        SPOTIFY_COOKIES.pendingUser
      )?.value,
      state
    );

  if (!userId) {
    const response = redirectTo(
      request,
      "oauth-state",
      returnTo
    );

    clearPending(response);
    return response;
  }

  try {
    const origin =
      new URL(request.url).origin;

    const redirectUri =
      `${origin}/api/music/spotify/callback`;

    let token;

    try {
      token =
        await exchangeSpotifyCode(
          code,
          redirectUri
        );
    } catch (error: any) {
      console.error(
        "Spotify callback token:",
        {
          code: error?.code || null,
          status: error?.status || null,
          message: error?.message || String(error),
        }
      );

      const response = redirectTo(
        request,
        "token-error",
        returnTo
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    let me;

    try {
      me = await getSpotifyMe(
        token.access_token
      );
    } catch (error: any) {
      console.error(
        "Spotify callback profile:",
        {
          code: error?.code || null,
          status: error?.status || null,
          message: error?.message || String(error),
        }
      );

      const response = redirectTo(
        request,
        error?.status === 403
          ? "not-authorized"
          : "profile-error",
        returnTo
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    try {
      await upsertSpotifyConnection(
        userId,
        me
      );
    } catch (error: any) {
      console.error(
        "Spotify callback Supabase:",
        {
          code: error?.code || null,
          message: error?.message || String(error),
        }
      );

      const response = redirectTo(
        request,
        error?.code ===
          "SUPABASE_ADMIN_MISSING"
          ? "server-config"
          : "database-error",
        returnTo
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    const product =
      (
        me.product || ""
      ).toLowerCase();

    if (product !== "premium") {
      const response = redirectTo(
        request,
        "not-premium",
        returnTo
      );

      clearPending(response);
      clearSession(response);
      return response;
    }

    const response = redirectTo(
      request,
      "connected",
      returnTo
    );

    clearPending(response);

    response.cookies.set(
      SPOTIFY_COOKIES.owner,
      signOwner(userId),
      cookieOptions(
        180 * 24 * 60 * 60
      )
    );

    response.cookies.set(
      SPOTIFY_COOKIES.access,
      token.access_token,
      cookieOptions(
        Math.max(
          60,
          Number(
            token.expires_in || 3600
          )
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
            Number(
              token.expires_in || 3600
            )
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
      "Spotify callback unexpected:",
      error?.message || error
    );

    const response = redirectTo(
      request,
      "error",
      returnTo
    );

    clearPending(response);
    clearSession(response);

    return response;
  }
}
