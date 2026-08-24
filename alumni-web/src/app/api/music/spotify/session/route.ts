import { NextResponse } from "next/server";
import {
  getSpotifyConnection,
  getSpotifyMe,
  resolveSpotifyAccessForUser,
  upsertSpotifyConnection,
  verifyAlumniUser,
} from "@/lib/spotifyServer";

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

  try {
    const connection =
      await getSpotifyConnection(user.id);

    if (!connection) {
      return NextResponse.json(
        {
          connected: false,
          premium: false,
          reason: "disconnected",
        },
        { status: 401 }
      );
    }

    const resolved =
      await resolveSpotifyAccessForUser(
        user.id
      );

    const me = await getSpotifyMe(
      resolved.accessToken
    );

    await upsertSpotifyConnection(
      user.id,
      me,
      String(connection.product || "pending")
    );

    const product =
      String(connection.product || "pending");

    return NextResponse.json({
      connected: true,
      premium:
        product === "premium",
      display_name:
        me.display_name || null,
      product,
      reason:
        product === "premium"
          ? null
          : product === "free"
          ? "not_premium"
          : "verification_required",
    });
  } catch (error: any) {
    console.error(
      "Spotify session:",
      error?.message || error
    );

    return NextResponse.json(
      {
        connected: false,
        premium: false,
        reason: "disconnected",
      },
      { status: 401 }
    );
  }
}
