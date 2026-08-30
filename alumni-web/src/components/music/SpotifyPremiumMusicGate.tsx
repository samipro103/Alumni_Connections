"use client";

import {
  CheckCircle2,
  Loader2,
  LogOut,
  Music2,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import ProfileMusicSettings from "@/components/settings/ProfileMusicSettings";
import SpotifyConnectModal, {
  type SpotifyConnectState,
} from "@/components/music/SpotifyConnectModal";
import SpotifyLogo from "@/components/music/SpotifyLogo";
import SpotifyPremiumVerifier from "@/components/music/SpotifyPremiumVerifier";
import {
  disconnectSpotify,
  getSpotifyPremiumSession,
  startSpotifyConnect,
} from "@/lib/spotifyClient";

type Props = {
  userId: string;
};

function statusFromQuery():
  SpotifyConnectState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value =
    new URLSearchParams(
      window.location.search
    ).get("spotify");

  if (value === "connected") {
    return "connected";
  }

  if (value === "not-premium") {
    return "not_premium";
  }

  if (value === "not-authorized") {
    return "not_authorized";
  }

  if (value === "cancelled") {
    return "cancelled";
  }

  if (value === "error") {
    return "error";
  }

  return null;
}

export default function SpotifyPremiumMusicGate({
  userId,
}: Props) {
  const [checking, setChecking] =
    useState(true);

  const [premium, setPremium] =
    useState(false);

  const [verificationRequired, setVerificationRequired] =
    useState(false);

  const [displayName, setDisplayName] =
    useState<string | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [modalState, setModalState] =
    useState<SpotifyConnectState>(
      "checking"
    );

  const [connecting, setConnecting] =
    useState(false);

  const [disconnecting, setDisconnecting] =
    useState(false);

  useEffect(() => {
    void check();
  }, [userId]);

  async function check() {
    if (!userId) return;

    setChecking(true);

    const queryState =
      statusFromQuery();

    try {
      const session =
        await getSpotifyPremiumSession();

      setPremium(
        Boolean(
          session.connected &&
            session.premium
        )
      );

      setVerificationRequired(
        Boolean(
          session.connected &&
          session.reason ===
            "verification_required"
        )
      );

      setDisplayName(
        session.display_name || null
      );

      if (
        session.connected &&
        session.premium
      ) {
        if (
          queryState === "connected"
        ) {
          setModalState(
            "connected"
          );
          setModalOpen(true);
        } else {
          setModalOpen(false);
        }
      } else {
        const nextState =
          queryState ||
          (session.reason ===
          "not_premium"
            ? "not_premium"
            : "intro");

        setModalState(nextState);
        setModalOpen(true);
      }
    } catch {
      setPremium(false);
      setModalState(
        queryState || "intro"
      );
      setModalOpen(true);
    } finally {
      setChecking(false);
    }

    if (queryState) {
      const url = new URL(
        window.location.href
      );

      url.searchParams.delete(
        "spotify"
      );

      window.history.replaceState(
        {},
        "",
        url.pathname +
          url.search
      );
    }
  }

  async function connect() {
    if (connecting) return;

    setConnecting(true);

    try {
      await startSpotifyConnect();
    } catch {
      setModalState("error");
      setModalOpen(true);
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (disconnecting) return;

    setDisconnecting(true);

    try {
      await disconnectSpotify();

      setPremium(false);
      setDisplayName(null);
      setModalState("intro");
      setModalOpen(true);
    } catch {
      setModalState("error");
      setModalOpen(true);
    } finally {
      setDisconnecting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-sm font-bold text-zinc-700">
        <Loader2
          size={17}
          className="mr-2 animate-spin"
        />
        Comprobando Spotify Premium...
      </div>
    );
  }

  return (
    <>
      {verificationRequired ? (
        <SpotifyPremiumVerifier
          onVerified={() => {
            setVerificationRequired(false);
            setPremium(true);
            setModalOpen(false);
          }}
          onRejected={() => {
            setVerificationRequired(false);
            setPremium(false);
            setModalState("not_premium");
            setModalOpen(true);
          }}
          onError={() => {
            setVerificationRequired(false);
            setPremium(false);
            setModalState("error");
            setModalOpen(true);
          }}
        />
      ) : premium ? (
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1ed760]/10 text-[#1ed760]">
                <SpotifyLogo
                  size={22}
                />
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-black text-zinc-300">
                    Spotify Premium conectado
                  </p>

                  <CheckCircle2
                    size={13}
                    className="text-[#1ed760]"
                  />
                </div>

                {displayName && (
                  <p className="mt-1 text-[10px] text-zinc-700">
                    {displayName}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={disconnect}
              disabled={disconnecting}
              className="flex h-9 items-center gap-2 rounded-xl px-3 text-[10px] font-black text-zinc-700 transition hover:bg-white/[0.04] hover:text-zinc-400"
            >
              {disconnecting ? (
                <Loader2
                  size={13}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={13} />
              )}
              Desconectar
            </button>
          </div>

          <ProfileMusicSettings
            userId={userId}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-[#0c0f14] px-5 py-10 text-center">
          <SpotifyLogo
            size={34}
            className="mx-auto text-[#1ed760]"
          />

          <p className="mt-4 text-base font-black text-zinc-200">
            Música con Spotify Premium
          </p>


          <button
            type="button"
            onClick={() => {
              setModalState("intro");
              setModalOpen(true);
            }}
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#1ed760] px-4 text-xs font-black text-[#07110a]"
          >
            <Music2 size={14} />
            Conectar Spotify
          </button>
        </div>
      )}

      <SpotifyConnectModal
        open={modalOpen}
        state={modalState}
        displayName={displayName}
        connecting={connecting}
        onClose={() =>
          setModalOpen(false)
        }
        onConnect={connect}
        onGoMusic={() =>
          setModalOpen(false)
        }
      />
    </>
  );
}

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */
