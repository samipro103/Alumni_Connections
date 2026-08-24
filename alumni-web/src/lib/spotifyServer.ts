import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

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

  const adminKey =
    cleanCredential(
      process.env.SUPABASE_SECRET_KEY,
      "SUPABASE_SECRET_KEY"
    ) ||
    cleanCredential(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY"
    );

  if (!url || !anon) {
    throw new Error(
      "Supabase no está configurado para validar la sesión."
    );
  }

  return { url, anon, adminKey };
}

function adminClient() {
  const { url, adminKey } = getSupabaseConfig();

  if (!adminKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY no está disponible en servidor."
    );
  }

  return createClient(url, adminKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function safeSpotifyReturnPath(
  value: string | null | undefined
) {
  const fallback = "/settings?section=music";
  const raw = (value || "").trim();

  if (!raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(raw, "https://alumni.local");

    if (parsed.origin !== "https://alumni.local") {
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

export async function saveOAuthState(
  userId: string,
  state: string,
  returnTo: string
) {
  const admin = adminClient();

  await admin
    .from("spotify_oauth_states")
    .delete()
    .lt("expires_at", new Date().toISOString());

  const { error } = await admin
    .from("spotify_oauth_states")
    .insert({
      state,
      user_id: userId,
      return_to: safeSpotifyReturnPath(returnTo),
      expires_at: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString(),
    });

  if (error) {
    throw new Error(
      `No se pudo preparar OAuth: ${error.message}`
    );
  }
}

export async function consumeOAuthState(
  state: string
) {
  const admin = adminClient();

  const { data, error } = await admin
    .from("spotify_oauth_states")
    .select("state,user_id,return_to,expires_at")
    .eq("state", state)
    .maybeSingle();

  if (error) {
    throw new Error(
      `No se pudo leer OAuth state: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  await admin
    .from("spotify_oauth_states")
    .delete()
    .eq("state", state);

  if (
    new Date(data.expires_at).getTime() <
    Date.now()
  ) {
    return null;
  }

  return {
    userId: String(data.user_id),
    returnTo: safeSpotifyReturnPath(
      String(data.return_to || "")
    ),
  };
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

export async function saveSpotifyTokens(
  userId: string,
  token: SpotifyTokenPayload
) {
  const admin = adminClient();

  const expiresAt = new Date(
    Date.now() +
      Math.max(60, Number(token.expires_in || 3600)) *
        1000
  ).toISOString();

  const { data: existing } = await admin
    .from("spotify_oauth_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await admin
    .from("spotify_oauth_tokens")
    .upsert(
      {
        user_id: userId,
        access_token: token.access_token,
        refresh_token:
          token.refresh_token ||
          existing?.refresh_token ||
          null,
        expires_at: expiresAt,
        scope: token.scope || null,
        token_type: token.token_type || "Bearer",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(
      `No se pudieron guardar tokens Spotify: ${error.message}`
    );
  }
}

export async function resolveSpotifyAccessForUser(
  userId: string
) {
  const admin = adminClient();

  const { data, error } = await admin
    .from("spotify_oauth_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Spotify no está conectado.");
  }

  const expiresAt =
    new Date(data.expires_at).getTime();

  if (
    data.access_token &&
    expiresAt > Date.now() + 60_000
  ) {
    return {
      accessToken: String(data.access_token),
      expiresAt,
    };
  }

  if (!data.refresh_token) {
    throw new Error("Spotify necesita reconexión.");
  }

  const refreshed = await refreshSpotifyToken(
    String(data.refresh_token)
  );

  await saveSpotifyTokens(userId, refreshed);

  return {
    accessToken: refreshed.access_token,
    expiresAt:
      Date.now() +
      Math.max(
        60,
        Number(refreshed.expires_in || 3600)
      ) *
        1000,
  };
}

export async function upsertSpotifyConnection(
  userId: string,
  me: SpotifyMe,
  product = "pending"
) {
  const admin = adminClient();

  const { error } = await admin
    .from("spotify_connections")
    .upsert(
      {
        user_id: userId,
        spotify_account_id:
          me.account_id || me.id || "unknown",
        spotify_user_id: me.id || null,
        display_name: me.display_name || null,
        product,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(
      `No se pudo guardar la conexión Spotify: ${error.message}`
    );
  }
}

export async function getSpotifyConnection(
  userId: string
) {
  const admin = adminClient();

  const { data, error } = await admin
    .from("spotify_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function setSpotifyPremiumStatus(
  userId: string,
  premium: boolean
) {
  const admin = adminClient();

  const { error } = await admin
    .from("spotify_connections")
    .update({
      product: premium ? "premium" : "free",
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSpotifyAccountData(
  userId: string
) {
  const admin = adminClient();

  await Promise.all([
    admin
      .from("spotify_oauth_tokens")
      .delete()
      .eq("user_id", userId),
    admin
      .from("spotify_oauth_states")
      .delete()
      .eq("user_id", userId),
    admin
      .from("spotify_connections")
      .delete()
      .eq("user_id", userId),
  ]);
}
