import { NextResponse } from "next/server";

type SpotifyOEmbedResponse = {
  html?: string;
  title?: string;
  thumbnail_url?: string | null;
};

function extractEmbedUrl(html: string) {
  const match = html.match(/src=["']([^"']+)["']/i);
  return match?.[1]?.replace(/&amp;/g, "&") || "";
}

function extractTrackId(embedUrl: string) {
  const match = embedUrl.match(/\/embed\/track\/([^?/"']+)/i);
  return match?.[1] || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spotifyUrl = searchParams.get("url")?.trim();

  if (!spotifyUrl) {
    return NextResponse.json(
      { error: "Pega el enlace de una canción de Spotify." },
      { status: 400 }
    );
  }

  try {
    const parsed = new URL(spotifyUrl);
    const allowedHost =
      parsed.hostname === "open.spotify.com" ||
      parsed.hostname === "spotify.link";

    if (!allowedHost) {
      return NextResponse.json(
        { error: "El enlace debe ser de Spotify." },
        { status: 400 }
      );
    }

    const endpoint = new URL("https://open.spotify.com/oembed");
    endpoint.searchParams.set("url", spotifyUrl);

    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Spotify no pudo reconocer ese enlace. Usa Compartir > Copiar enlace en una canción.",
        },
        { status: 400 }
      );
    }

    const data = (await response.json()) as SpotifyOEmbedResponse;
    const embedUrl = data.html ? extractEmbedUrl(data.html) : "";
    const trackId = extractTrackId(embedUrl);

    if (!embedUrl || !trackId) {
      return NextResponse.json(
        { error: "Por ahora Alumni Música acepta canciones individuales de Spotify." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      provider: "spotify",
      provider_track_id: trackId,
      track_title: data.title || "Canción de Spotify",
      artist_name: null,
      album_name: null,
      artwork_url: data.thumbnail_url || null,
      track_url: spotifyUrl,
      embed_url: embedUrl,
    });
  } catch (error) {
    console.error("Spotify oEmbed error:", error);
    return NextResponse.json(
      { error: "No se pudo leer el enlace de Spotify." },
      { status: 500 }
    );
  }
}
