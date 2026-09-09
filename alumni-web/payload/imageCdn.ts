const PUBLIC_STORAGE_PREFIXES = [
  "/storage/v1/object/public/",
  "/storage/v1/render/image/public/",
] as const;

function cleanBaseUrl(value?: string) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "");
}

export function isPublicSupabaseImageUrl(
  value?: string | null
) {
  const source =
    typeof value === "string"
      ? value.trim()
      : "";

  const supabaseBase =
    cleanBaseUrl(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL
    );

  if (!source || !supabaseBase) {
    return false;
  }

  try {
    const sourceUrl =
      new URL(source);

    const supabaseUrl =
      new URL(supabaseBase);

    if (
      sourceUrl.origin !==
      supabaseUrl.origin
    ) {
      return false;
    }

    return PUBLIC_STORAGE_PREFIXES.some(
      (prefix) =>
        sourceUrl.pathname.startsWith(
          prefix
        )
    );
  } catch {
    return false;
  }
}

export function toPublicImageCdnUrl(
  value?: string | null
) {
  const source =
    typeof value === "string"
      ? value.trim()
      : "";

  const cdnBase =
    cleanBaseUrl(
      process.env
        .NEXT_PUBLIC_IMAGE_CDN_URL
    );

  if (
    !source ||
    !cdnBase ||
    !isPublicSupabaseImageUrl(
      source
    )
  ) {
    return source;
  }

  try {
    const sourceUrl =
      new URL(source);

    const cdnUrl =
      new URL(cdnBase);

    cdnUrl.pathname =
      sourceUrl.pathname;

    cdnUrl.search =
      sourceUrl.search;

    cdnUrl.hash = "";

    return cdnUrl.toString();
  } catch {
    return source;
  }
}

/* ALUMNI_2_9_2_PUBLIC_IMAGE_CDN */
