import { NextResponse } from "next/server";
import {
  deleteSpotifyAccountData,
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

  await deleteSpotifyAccountData(
    user.id
  );

  return NextResponse.json({
    ok: true,
  });
}
