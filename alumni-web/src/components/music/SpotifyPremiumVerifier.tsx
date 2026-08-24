"use client";

import {
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { loadSpotifyWebPlaybackSdk } from "@/lib/spotifyWebPlayback";
import { setSpotifyPremiumVerified } from "@/lib/spotifyClient";

type Props = {
  onVerified: () => void;
  onRejected: () => void;
  onError: () => void;
};

async function getSpotifyToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error(
      "Sesión Alumni no disponible."
    );
  }

  const response = await fetch(
    "/api/music/spotify/token",
    {
      headers: {
        Authorization:
          `Bearer ${session.access_token}`,
      },
      cache: "no-store",
    }
  );

  const data = await response
    .json()
    .catch(() => ({}));

  if (
    !response.ok ||
    !data?.access_token
  ) {
    throw new Error(
      data?.error ||
        "Spotify no está conectado."
    );
  }

  return String(
    data.access_token
  );
}

export default function SpotifyPremiumVerifier({
  onVerified,
  onRejected,
  onError,
}: Props) {
  const startedRef =
    useRef(false);

  const [message, setMessage] =
    useState(
      "Validando tu cuenta Premium..."
    );

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;

    let cancelled = false;
    let player: any = null;
    let timeout:
      | number
      | null = null;

    async function verify() {
      try {
        const token =
          await getSpotifyToken();

        const Spotify =
          await loadSpotifyWebPlaybackSdk();

        if (cancelled) return;

        player =
          new Spotify.Player({
            name:
              "Alumni Premium Check",
            getOAuthToken: (
              callback: (
                value: string
              ) => void
            ) => {
              callback(token);
            },
            volume: 0.5,
          });

        player.addListener(
          "ready",
          async () => {
            if (cancelled) return;

            if (
              timeout !== null
            ) {
              window.clearTimeout(
                timeout
              );
            }

            setMessage(
              "Spotify Premium verificado."
            );

            await setSpotifyPremiumVerified(
              true
            );

            try {
              player?.disconnect?.();
            } catch {}

            window.setTimeout(
              onVerified,
              350
            );
          }
        );

        player.addListener(
          "account_error",
          async () => {
            if (cancelled) return;

            if (
              timeout !== null
            ) {
              window.clearTimeout(
                timeout
              );
            }

            try {
              await setSpotifyPremiumVerified(
                false
              );
            } catch {}

            try {
              player?.disconnect?.();
            } catch {}

            onRejected();
          }
        );

        player.addListener(
          "authentication_error",
          () => {
            if (!cancelled) {
              onError();
            }
          }
        );

        player.addListener(
          "initialization_error",
          () => {
            if (!cancelled) {
              onError();
            }
          }
        );

        const connected =
          await player.connect();

        if (!connected) {
          throw new Error(
            "Spotify Player no pudo conectarse."
          );
        }

        timeout =
          window.setTimeout(
            () => {
              if (!cancelled) {
                onError();
              }
            },
            12000
          );
      } catch {
        if (!cancelled) {
          onError();
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;

      if (timeout !== null) {
        window.clearTimeout(
          timeout
        );
      }

      try {
        player?.disconnect?.();
      } catch {}
    };
  }, [
    onError,
    onRejected,
    onVerified,
  ]);

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#1ed760]/20 bg-[#1ed760]/[0.07] text-[#1ed760]">
        <Loader2
          size={24}
          className="animate-spin"
        />
      </div>

      <h2 className="mt-5 text-xl font-black tracking-[-0.03em] text-white">
        Comprobando Spotify Premium
      </h2>

      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600">
        {message}
      </p>

      <div className="mt-5 flex items-center gap-2 text-[10px] font-bold text-zinc-700">
        <CheckCircle2
          size={13}
          className="text-[#1ed760]/70"
        />
        Esta verificación se hace con el reproductor oficial de Spotify.
      </div>
    </div>
  );
}
