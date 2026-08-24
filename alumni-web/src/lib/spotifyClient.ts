"use client";

import { supabase } from "@/lib/supabase";

export type SpotifyPremiumSession = {
  connected: boolean;
  premium: boolean;
  display_name?: string | null;
  product?: string | null;
  reason?: string | null;
};

async function authHeader() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Tu sesión de Alumni no está activa."
    );
  }

  return {
    Authorization:
      `Bearer ${session.access_token}`,
  };
}

export async function getSpotifyPremiumSession() {
  const headers = await authHeader();

  const response = await fetch(
    "/api/music/spotify/session",
    {
      headers,
      cache: "no-store",
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    return {
      connected: false,
      premium: false,
      reason:
        data?.reason ||
        "disconnected",
    } as SpotifyPremiumSession;
  }

  return data as SpotifyPremiumSession;
}

export async function startSpotifyConnect(
  returnTo =
    "/settings?section=music"
) {
  const headers = await authHeader();

  const response = await fetch(
    "/api/music/spotify/connect",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        return_to: returnTo,
      }),
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    !data?.url
  ) {
    throw new Error(
      data?.error ||
        "No se pudo iniciar la conexión con Spotify."
    );
  }

  window.location.assign(data.url);
}

export async function disconnectSpotify() {
  const headers = await authHeader();

  const response = await fetch(
    "/api/music/spotify/disconnect",
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      data?.error ||
        "No se pudo desconectar Spotify."
    );
  }
}

export async function setSpotifyPremiumVerified(
  premium: boolean
) {
  const headers = await authHeader();

  const response = await fetch(
    "/api/music/spotify/premium",
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        premium,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      "No se pudo validar Spotify Premium."
    );
  }
}

export async function alumniSpotifyAuthHeader() {
  return authHeader();
}
