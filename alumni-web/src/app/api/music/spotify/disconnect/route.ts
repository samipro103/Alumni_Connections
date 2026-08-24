import { NextResponse } from "next/server";
import {
  SPOTIFY_COOKIES,
  cookieOptions,
  deleteSpotifyConnection,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

export async function POST(request: Request) {
  const user = await verifyAlumniUser(
    request.headers.get("authorization")
  );

  if (!user) {
    return NextResponse.json(
      { error: "Sesión Alumni no válida." },
      { status: 401 }
    );
  }

  try {
    await deleteSpotifyConnection(
      user.id
    );
  } catch (error) {
    console.error(
      "Spotify disconnect DB:",
      error
    );
  }

  const response = NextResponse.json({
    ok: true,
  });

  for (const name of Object.values(
    SPOTIFY_COOKIES
  )) {
    response.cookies.set(
      name,
      "",
      cookieOptions(0)
    );
  }

  return response;
}
