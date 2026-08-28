export type SocialKind =
  | "website"
  | "instagram"
  | "linkedin"
  | "github";

const BLOCKED_PROTOCOL =
  /^(javascript|data|vbscript|file|blob):/i;

function cleanValue(
  value: unknown
) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /[\u0000-\u001F\u007F]/g,
      ""
    );
}

function httpsUrl(
  value: string
) {
  const clean =
    cleanValue(value);

  if (
    !clean ||
    BLOCKED_PROTOCOL.test(
      clean
    )
  ) {
    return null;
  }

  const candidate =
    /^https:\/\//i.test(
      clean
    )
      ? clean
      : /^http:\/\//i.test(
          clean
        )
      ? clean.replace(
          /^http:\/\//i,
          "https://"
        )
      : `https://${clean}`;

  try {
    const url =
      new URL(candidate);

    if (
      url.protocol !==
      "https:"
    ) {
      return null;
    }

    url.username = "";
    url.password = "";

    return url;
  } catch {
    return null;
  }
}

function normalizedHandle(
  value: string
) {
  return cleanValue(value)
    .replace(/^@+/, "")
    .replace(/^\/+|\/+$/g, "")
    .split(/[/?#]/)[0]
    .trim();
}

function socialUrl(
  value: string,
  kind:
    | "instagram"
    | "linkedin"
    | "github"
) {
  const clean =
    cleanValue(value);

  if (
    !clean ||
    BLOCKED_PROTOCOL.test(
      clean
    )
  ) {
    return "";
  }

  const parsed =
    httpsUrl(clean);

  if (parsed) {
    const host =
      parsed.hostname
        .toLowerCase()
        .replace(
          /^www\./,
          ""
        );

    if (
      kind ===
        "instagram" &&
      host ===
        "instagram.com"
    ) {
      const handle =
        parsed.pathname
          .split("/")
          .filter(Boolean)[0];

      return handle
        ? `https://www.instagram.com/${encodeURIComponent(
            handle
          )}/`
        : "";
    }

    if (
      kind ===
        "github" &&
      host ===
        "github.com"
    ) {
      const handle =
        parsed.pathname
          .split("/")
          .filter(Boolean)[0];

      return handle
        ? `https://github.com/${encodeURIComponent(
            handle
          )}`
        : "";
    }

    if (
      kind ===
        "linkedin" &&
      host ===
        "linkedin.com"
    ) {
      const parts =
        parsed.pathname
          .split("/")
          .filter(Boolean);

      const markerIndex =
        parts.findIndex(
          (part) =>
            part === "in"
        );

      const handle =
        markerIndex >= 0
          ? parts[
              markerIndex +
                1
            ]
          : parts[0];

      return handle
        ? `https://www.linkedin.com/in/${encodeURIComponent(
            handle
          )}/`
        : "";
    }

    /*
      Si el usuario pegó una URL completa
      de otro dominio en un campo social,
      NO la convertimos en link confiable.
    */
    return "";
  }

  const handle =
    normalizedHandle(clean);

  if (!handle) {
    return "";
  }

  if (
    kind === "instagram"
  ) {
    return `https://www.instagram.com/${encodeURIComponent(
      handle
    )}/`;
  }

  if (kind === "github") {
    return `https://github.com/${encodeURIComponent(
      handle
    )}`;
  }

  return `https://www.linkedin.com/in/${encodeURIComponent(
    handle
  )}/`;
}

export function safeExternalUrl(
  value: unknown,
  kind:
    | SocialKind =
      "website"
) {
  const clean =
    cleanValue(value);

  if (!clean) {
    return "";
  }

  if (
    kind !==
    "website"
  ) {
    return socialUrl(
      clean,
      kind
    );
  }

  const parsed =
    httpsUrl(clean);

  if (!parsed) {
    return "";
  }

  /*
    Sitios personales: HTTPS únicamente.
    No incluimos credenciales del URL.
  */
  parsed.hash =
    parsed.hash.slice(
      0,
      256
    );

  return parsed.toString();
}

export function externalLinkRel() {
  return "noopener noreferrer external";
}

export function safeExternalDisplay(
  value: unknown,
  fallback: string
) {
  const clean =
    cleanValue(value);

  if (!clean) {
    return fallback;
  }

  try {
    const parsed =
      httpsUrl(clean);

    if (parsed) {
      const path =
        parsed.pathname
          .replace(
            /^\/|\/$/g,
            ""
          );

      return (
        path ||
        parsed.hostname.replace(
          /^www\./,
          ""
        )
      );
    }
  } catch {}

  return clean
    .replace(/^@+/, "")
    .slice(0, 80);
}
