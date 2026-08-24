import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  getSpotifyClientId,
  signPendingUser,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

const SCOPES = [
  "streaming",
  "user-read-private",
  "user-read-email",
  "user-read-playback-state",
  "user-modify-playback-state",
];

export async function POST(request: Request) {
  try {
    const user = await verifyAlumniUser(
      request.headers.get("authorization")
    );

    if (!user) {
      return NextResponse.json(
        { error: "Inicia sesión en Alumni para conectar Spotify." },
        { status: 401 }
      );
    }

    const origin = new URL(request.url).origin;
    const redirectUri =
      `${origin}/api/music/spotify/callback`;

    const state = randomBytes(24).toString("hex");

    const authorize = new URL(
      "https://accounts.spotify.com/authorize"
    );

    authorize.searchParams.set(
      "client_id",
      getSpotifyClientId()
    );

    authorize.searchParams.set(
      "response_type",
      "code"
    );

    authorize.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    authorize.searchParams.set(
      "scope",
      SCOPES.join(" ")
    );

    authorize.searchParams.set(
      "state",
      state
    );

    authorize.searchParams.set(
      "show_dialog",
      "true"
    );

    const response = NextResponse.json({
      url: authorize.toString(),
    });

    response.cookies.set(
      SPOTIFY_COOKIES.state,
      state,
      cookieOptions(10 * 60)
    );

    response.cookies.set(
      SPOTIFY_COOKIES.pendingUser,
      signPendingUser(user.id, state),
      cookieOptions(10 * 60)
    );

    return response;
  } catch (error: any) {
    console.error(
      "Spotify connect:",
      error?.message || error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "No se pudo iniciar Spotify.",
      },
      { status: 500 }
    );
  }
}
