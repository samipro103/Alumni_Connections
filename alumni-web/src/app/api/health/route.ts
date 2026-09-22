export const dynamic =
  "force-dynamic";

export function GET() {
  return Response.json(
    {
      ok: true,
      service:
        "alumni-web",
      status:
        "ready",
      timestamp:
        new Date()
          .toISOString(),
    },
    {
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
        "X-Robots-Tag":
          "noindex, nofollow",
      },
    }
  );
}

/* ALUMNI_10_10_PRODUCTION_HEALTH */