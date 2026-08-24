"use client";

import {
  useState,
} from "react";
import { useRouter } from "next/navigation";
import SpotifyConnectModal, {
  type SpotifyConnectState,
} from "@/components/music/SpotifyConnectModal";
import SpotifyLogo from "@/components/music/SpotifyLogo";
import {
  getSpotifyPremiumSession,
  startSpotifyConnect,
} from "@/lib/spotifyClient";

type Props = {
  ownProfile: boolean;
  trackUrl?: string | null;
};

export default function ProfileSpotifyCorner({
  ownProfile,
  trackUrl,
}: Props) {
  const router = useRouter();

  const [open, setOpen] =
    useState(false);

  const [state, setState] =
    useState<SpotifyConnectState>(
      "intro"
    );

  const [displayName, setDisplayName] =
    useState<string | null>(null);

  const [connecting, setConnecting] =
    useState(false);

  async function click() {
    if (!ownProfile) {
      window.open(
        trackUrl ||
          "https://open.spotify.com/",
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    setOpen(true);
    setState("checking");

    try {
      const session =
        await getSpotifyPremiumSession();

      if (
        session.connected &&
        session.premium
      ) {
        setDisplayName(
          session.display_name || null
        );
        setState("connected");
      } else if (
        session.reason ===
        "not_premium"
      ) {
        setState("not_premium");
      } else {
        setState("intro");
      }
    } catch {
      setState("intro");
    }
  }

  async function connect() {
    if (connecting) return;

    setConnecting(true);

    try {
      await startSpotifyConnect();
    } catch {
      setState("error");
      setConnecting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={click}
        aria-label={
          ownProfile
            ? "Conectar o administrar Spotify"
            : "Abrir canción en Spotify"
        }
        title={
          ownProfile
            ? "Alumni × Spotify"
            : "Spotify"
        }
        className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.06] bg-black/20 text-[#1ed760] opacity-45 backdrop-blur-md transition hover:scale-105 hover:bg-black/35 hover:opacity-100 sm:right-5 sm:top-5"
      >
        <SpotifyLogo
          size={24}
        />
      </button>

      {ownProfile && (
        <SpotifyConnectModal
          open={open}
          state={state}
          displayName={displayName}
          connecting={connecting}
          onClose={() =>
            setOpen(false)
          }
          onConnect={connect}
          onGoMusic={() => {
            setOpen(false);
            router.push(
              "/settings?section=music"
            );
          }}
        />
      )}
    </>
  );
}
