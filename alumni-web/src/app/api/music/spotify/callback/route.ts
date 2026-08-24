import { NextResponse } from "next/server";
import {
  consumeOAuthState,
  exchangeSpotifyCode,
  getSpotifyMe,
  saveSpotifyTokens,
  upsertSpotifyConnection,
} from "@/lib/spotifyServer";

function redirectTo(
  request: Request,
  returnTo: string,
  status: string
) {
  const destination = new URL(
    returnTo,
    new URL(request.url).origin
  );

  destination.searchParams.set(
    "spotify",
    status
  );

  return NextResponse.redirect(destination);
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code =
    url.searchParams.get("code") || "";

  const state =
    url.searchParams.get("state") || "";

  const spotifyError =
    url.searchParams.get("error") || "";

  if (!state) {
    return NextResponse.redirect(
      new URL(
        "/settings?section=music&spotify=oauth-state",
        url.origin
      )
    );
  }

  let oauthState;

  try {
    oauthState =
      await consumeOAuthState(state);
  } catch (error: any) {
    console.error(
      "Spotify OAuth state DB:",
      error?.message || error
    );

    return NextResponse.redirect(
      new URL(
        "/settings?section=music&spotify=database-error",
        url.origin
      )
    );
  }

  if (!oauthState) {
    return NextResponse.redirect(
      new URL(
        "/settings?section=music&spotify=oauth-state",
        url.origin
      )
    );
  }

  if (spotifyError || !code) {
    return redirectTo(
      request,
      oauthState.returnTo,
      spotifyError === "access_denied"
        ? "cancelled"
        : "error"
    );
  }

  try {
    const redirectUri =
      `${url.origin}/api/music/spotify/callback`;

    const token =
      await exchangeSpotifyCode(
        code,
        redirectUri
      );

    const me =
      await getSpotifyMe(
        token.access_token
      );

    await saveSpotifyTokens(
      oauthState.userId,
      token
    );

    await upsertSpotifyConnection(
      oauthState.userId,
      me,
      "pending"
    );

    return redirectTo(
      request,
      oauthState.returnTo,
      "connected"
    );
  } catch (error: any) {
    console.error(
      "Spotify callback:",
      error?.message || error
    );

    return redirectTo(
      request,
      oauthState.returnTo,
      error?.status === 403
        ? "not-authorized"
        : "error"
    );
  }
}
