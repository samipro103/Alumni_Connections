const ADSENSE_CLIENT =
  (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();

function validClient(value: string) {
  return /^ca-pub-\d+$/.test(value);
}

export async function GET() {
  if (!validClient(ADSENSE_CLIENT)) {
    return new Response("", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  const publisherId = ADSENSE_CLIENT.replace(/^ca-/, "");

  return new Response(
    `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    }
  );
}

/* ALUMNI_3_3_0_WEB_ADS:ADS_TXT */
