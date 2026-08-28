import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 2_000_000;

function privateIp(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;

  if (address.startsWith("127.")) return true;
  if (address.startsWith("10.")) return true;
  if (address.startsWith("192.168.")) return true;
  if (address.startsWith("169.254.")) return true;

  const parts = address.split(".").map(Number);
  if (
    parts.length === 4 &&
    parts[0] === 172 &&
    parts[1] >= 16 &&
    parts[1] <= 31
  ) {
    return true;
  }

  const normalized = address.toLowerCase();
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
    return true;
  }
  if (normalized.startsWith("fe80:")) return true;

  return false;
}

async function assertSafeUrl(raw: string) {
  const url = new URL(raw);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL no permitida.");
  }

  if (url.username || url.password) {
    throw new Error("URL no permitida.");
  }

  if (
    url.port &&
    !["80", "443"].includes(url.port)
  ) {
    throw new Error("Puerto no permitido.");
  }

  const host = url.hostname.toLowerCase();

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Host no permitido.");
  }

  if (isIP(host) && privateIp(host)) {
    throw new Error("Host no permitido.");
  }

  const addresses = await lookup(host, { all: true });

  if (
    !addresses.length ||
    addresses.some((entry) => privateIp(entry.address))
  ) {
    throw new Error("Host no permitido.");
  }

  return url;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(Number(num))
    )
    .trim();
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return "";
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]
    ? decodeHtml(match[1].replace(/\s+/g, " "))
    : "";
}

async function fetchHtml(initial: URL) {
  let current = initial;

  for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
    await assertSafeUrl(current.toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    try {
      const response = await fetch(current, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AlumniLinkPreview/1.0)",
          Accept: "text/html,application/xhtml+xml",
        },
        cache: "no-store",
      });

      if (
        response.status >= 300 &&
        response.status < 400
      ) {
        const location = response.headers.get("location");

        if (!location || count === MAX_REDIRECTS) {
          throw new Error("Demasiadas redirecciones.");
        }

        current = new URL(location, current);
        continue;
      }

      if (!response.ok) {
        throw new Error("No se pudo leer el enlace.");
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("text/html")) {
        throw new Error("El enlace no es una página web.");
      }

      const declared = Number(
        response.headers.get("content-length") || "0"
      );

      if (declared > MAX_HTML_BYTES) {
        throw new Error("Página demasiado grande.");
      }

      const html = (await response.text()).slice(
        0,
        MAX_HTML_BYTES
      );

      return {
        html,
        finalUrl: current,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("No se pudo leer el enlace.");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")?.trim();

  if (!raw) {
    return NextResponse.json(
      { error: "Falta URL." },
      { status: 400 }
    );
  }

  try {
    const initial = await assertSafeUrl(raw);
    const { html, finalUrl } = await fetchHtml(initial);

    const title =
      meta(html, "og:title") ||
      meta(html, "twitter:title") ||
      titleTag(html) ||
      finalUrl.hostname;

    const description =
      meta(html, "og:description") ||
      meta(html, "twitter:description") ||
      meta(html, "description");

    const imageRaw =
      meta(html, "og:image") ||
      meta(html, "twitter:image");

    let image = "";

    if (imageRaw) {
      try {
        image = new URL(imageRaw, finalUrl).toString();
      } catch {}
    }

    return NextResponse.json(
      {
        url: finalUrl.toString(),
        domain: finalUrl.hostname.replace(/^www\./, ""),
        title: title.slice(0, 180),
        description: description.slice(0, 320),
        image,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Vista previa no disponible." },
      { status: 422 }
    );
  }
}

/* ALUMNI_1_4_0_LINK_PREVIEW_API */
