import { createHmac, timingSafeEqual } from "crypto";

export const SPOTIFY_COOKIES = {
  state: "alumni_spotify_state",
  pendingUser: "alumni_spotify_pending_user",
  owner: "alumni_spotify_owner",
  access: "alumni_spotify_access",
  refresh: "alumni_spotify_refresh",
  expiresAt: "alumni_spotify_expires_at",
  returnTo: "alumni_spotify_return_to",
} as const;

export type SpotifyTokenPayload = {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
  refresh_token?: string;
};

export type SpotifyMe = {
  account_id?: string | null;
  id?: string | null;
  display_name?: string | null;
  product?: string | null;
  email?: string | null;
};

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

function cleanCredential(
  rawValue: string | undefined,
  variableName: string
) {
  let value = (rawValue || "").trim();

  const prefix = `${variableName}=`;

  if (value.startsWith(prefix)) {
    value = value.slice(prefix.length).trim();
  }

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value;
}

export function getSpotifyClientId() {
  const value = cleanCredential(
    process.env.SPOTIFY_CLIENT_ID,
    "SPOTIFY_CLIENT_ID"
  );

  if (!value) {
    throw new Error("SPOTIFY_CLIENT_ID no está configurado.");
  }

  return value;
}

export function getSpotifyClientSecret() {
  const value = cleanCredential(
    process.env.SPOTIFY_CLIENT_SECRET,
    "SPOTIFY_CLIENT_SECRET"
  );

  if (!value) {
    throw new Error("SPOTIFY_CLIENT_SECRET no está configurado.");
  }

  return value;
}

function getSupabaseConfig() {
  const url = cleanCredential(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );

  const anon = cleanCredential(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );

  const secret = cleanCredential(
    process.env.SUPABASE_SECRET_KEY,
    "SUPABASE_SECRET_KEY"
  );

  const legacyService = cleanCredential(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY"
  );

  const adminKey =
    secret || legacyService;

  const adminIsLegacy =
    !secret && Boolean(legacyService);

  if (!url || !anon) {
    throw new Error(
      "Supabase no está configurado para validar la sesión."
    );
  }

  return {
    url,
    anon,
    adminKey,
    adminIsLegacy,
  };
}

function getAdminHeaders() {
  const {
    adminKey,
    adminIsLegacy,
  } = getSupabaseConfig();

  if (!adminKey) {
    throw new Error(
      "Configura SUPABASE_SECRET_KEY en Vercel."
    );
  }

  return {
    apikey: adminKey,
    ...(adminIsLegacy
      ? {
          Authorization:
            `Bearer ${adminKey}`,
        }
      : {}),
  };
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function safeSpotifyReturnPath(
  value: string | null | undefined
) {
  const fallback = "/settings?section=music";
  const raw = (value || "").trim();

  if (
    !raw.startsWith("/") ||
    raw.startsWith("//")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(
      raw,
      "https://alumni.local"
    );

    if (
      parsed.origin !==
      "https://alumni.local"
    ) {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return fallback;
  }
}

function hmac(value: string) {
  return createHmac(
    "sha256",
    getSpotifyClientSecret()
  )
    .update(value)
    .digest("hex");
}

export function signPendingUser(
  userId: string,
  state: string
) {
  return `${userId}.${hmac(`${userId}:${state}`)}`;
}

export function verifyPendingUser(
  signedValue: string | undefined,
  state: string
) {
  if (!signedValue) return null;

  const separator = signedValue.lastIndexOf(".");
  if (separator <= 0) return null;

  const userId = signedValue.slice(0, separator);
  const supplied = signedValue.slice(separator + 1);
  const expected = hmac(`${userId}:${state}`);

  if (supplied.length !== expected.length) {
    return null;
  }

  const valid = timingSafeEqual(
    Buffer.from(supplied),
    Buffer.from(expected)
  );

  return valid ? userId : null;
}

export function signOwner(userId: string) {
  return `${userId}.${hmac(`owner:${userId}`)}`;
}

export function verifyOwner(
  signedValue: string | undefined
) {
  if (!signedValue) return null;

  const separator = signedValue.lastIndexOf(".");
  if (separator <= 0) return null;

  const userId = signedValue.slice(0, separator);
  const supplied = signedValue.slice(separator + 1);
  const expected = hmac(`owner:${userId}`);

  if (supplied.length !== expected.length) {
    return null;
  }

  const valid = timingSafeEqual(
    Buffer.from(supplied),
    Buffer.from(expected)
  );

  return valid ? userId : null;
}

export async function verifyAlumniUser(
  authorization: string | null
) {
  const token =
    authorization?.match(/^Bearer\s+(.+)$/i)?.[1] || "";

  if (!token) {
    return null;
  }

  const { url, anon } = getSupabaseConfig();

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = await response.json();

  return user?.id
    ? {
        id: String(user.id),
        email: user.email ? String(user.email) : null,
      }
    : null;
}

export async function exchangeSpotifyCode(
  code: string,
  redirectUri: string
) {
  const credentials = Buffer.from(
    `${getSpotifyClientId()}:${getSpotifyClientSecret()}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "Spotify no pudo completar la conexión."
    );
  }

  return data as SpotifyTokenPayload;
}

export async function refreshSpotifyToken(
  refreshToken: string
) {
  const credentials = Buffer.from(
    `${getSpotifyClientId()}:${getSpotifyClientSecret()}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.error_description ||
        data?.error ||
        "La sesión de Spotify venció."
    );
  }

  return data as SpotifyTokenPayload;
}

export async function getSpotifyMe(
  accessToken: string
): Promise<SpotifyMe> {
  const response = await fetch(
    "https://api.spotify.com/v1/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        "Spotify no permitió leer la cuenta."
    ) as Error & { status?: number };

    error.status = response.status;
    throw error;
  }

  return data as SpotifyMe;
}

export async function upsertSpotifyConnection(
  userId: string,
  me: SpotifyMe
) {
  const { url } = getSupabaseConfig();
  const adminHeaders = getAdminHeaders();

  const response = await fetch(
    `${url}/rest/v1/spotify_connections?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        ...adminHeaders,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        spotify_account_id:
          me.account_id || me.id || "unknown",
        spotify_user_id: me.id || null,
        display_name: me.display_name || null,
        product: (me.product || "unknown").toLowerCase(),
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail ||
        "No se pudo guardar la conexión Spotify."
    );
  }
}

export async function deleteSpotifyConnection(
  userId: string
) {
  const { url } = getSupabaseConfig();
  const adminHeaders = getAdminHeaders();

  await fetch(
    `${url}/rest/v1/spotify_connections?user_id=eq.${encodeURIComponent(
      userId
    )}`,
    {
      method: "DELETE",
      headers: {
        ...adminHeaders,
      },
      cache: "no-store",
    }
  );
}

export async function resolveSpotifyAccess(
  cookieStore: CookieReader
) {
  const access =
    cookieStore.get(SPOTIFY_COOKIES.access)?.value || "";

  const refresh =
    cookieStore.get(SPOTIFY_COOKIES.refresh)?.value || "";

  const expiresAt = Number(
    cookieStore.get(SPOTIFY_COOKIES.expiresAt)?.value || 0
  );

  if (
    access &&
    expiresAt > Date.now() + 60_000
  ) {
    return {
      accessToken: access,
      refreshToken: refresh,
      expiresAt,
      refreshed: null as SpotifyTokenPayload | null,
    };
  }

  if (!refresh) {
    throw new Error("Spotify no está conectado.");
  }

  const refreshed = await refreshSpotifyToken(refresh);
  const nextExpiresAt =
    Date.now() +
    Math.max(60, Number(refreshed.expires_in || 3600)) *
      1000;

  return {
    accessToken: refreshed.access_token,
    refreshToken:
      refreshed.refresh_token || refresh,
    expiresAt: nextExpiresAt,
    refreshed,
  };
}
