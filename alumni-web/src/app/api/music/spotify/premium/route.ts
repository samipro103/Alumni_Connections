import { NextResponse } from "next/server";
import {
  setSpotifyPremiumStatus,
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

  const body = await request
    .json()
    .catch(() => ({}));

  const premium =
    body?.premium === true;

  try {
    await setSpotifyPremiumStatus(
      user.id,
      premium
    );

    return NextResponse.json({
      ok: true,
      premium,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          "No se pudo validar Spotify.",
      },
      { status: 500 }
    );
  }
}
