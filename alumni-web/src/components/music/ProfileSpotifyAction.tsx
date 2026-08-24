"use client";

import {
  CheckCircle2,
  ExternalLink,
  Headphones,
  Loader2,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import ProfileMusicSettings from "@/components/settings/ProfileMusicSettings";
import SpotifyLogo from "@/components/music/SpotifyLogo";
import {
  disconnectSpotify,
  getSpotifyPremiumSession,
  startSpotifyConnect,
} from "@/lib/spotifyClient";

type ViewState =
  | "checking"
  | "intro"
  | "premium"
  | "not_premium"
  | "not_authorized"
  | "cancelled"
  | "error";

type Props = {
  userId: string;
  username: string;
};

function currentSpotifyStatus() {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  return new URLSearchParams(
    window.location.search
  ).get("spotify");
}

function clearSpotifyStatus() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.delete(
    "spotify"
  );

  window.history.replaceState(
    {},
    "",
    url.pathname +
      url.search +
      url.hash
  );
}

function AlumniSpotifyBrand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <img
          src="/icons/alumni-192.png"
          alt="Alumni"
          className="h-8 w-8 rounded-[10px]"
        />

        <span className="text-sm font-black tracking-[-0.03em] text-white">
          Alumni
        </span>
      </div>

      <span className="text-zinc-800">
        ×
      </span>

      <div className="flex items-center gap-2 text-[#1ed760]">
        <SpotifyLogo
          size={25}
        />

        <span className="text-sm font-black tracking-[-0.03em]">
          Spotify
        </span>
      </div>
    </div>
  );
}

export default function ProfileSpotifyAction({
  userId,
  username,
}: Props) {
  const [open, setOpen] =
    useState(false);

  const [view, setView] =
    useState<ViewState>(
      "checking"
    );

  const [
    displayName,
    setDisplayName,
  ] = useState<
    string | null
  >(null);

  const [
    connecting,
    setConnecting,
  ] = useState(false);

  const [
    disconnecting,
    setDisconnecting,
  ] = useState(false);

  useEffect(() => {
    const status =
      currentSpotifyStatus();

    if (!status) return;

    setOpen(true);

    if (
      status ===
      "not-premium"
    ) {
      setView(
        "not_premium"
      );
      clearSpotifyStatus();
      return;
    }

    if (
      status ===
      "not-authorized"
    ) {
      setView(
        "not_authorized"
      );
      clearSpotifyStatus();
      return;
    }

    if (
      status ===
      "cancelled"
    ) {
      setView("cancelled");
      clearSpotifyStatus();
      return;
    }

    if (
      status === "error"
    ) {
      setView("error");
      clearSpotifyStatus();
      return;
    }

    void inspectSession(
      status === "connected"
    );

    clearSpotifyStatus();
  }, [userId]);

  async function inspectSession(
    keepOpen = true
  ) {
    setView("checking");

    if (keepOpen) {
      setOpen(true);
    }

    try {
      const session =
        await getSpotifyPremiumSession();

      if (
        session.connected &&
        session.premium
      ) {
        setDisplayName(
          session.display_name ||
            null
        );

        setView("premium");
      } else if (
        session.reason ===
        "not_premium"
      ) {
        setView(
          "not_premium"
        );
      } else {
        setView("intro");
      }
    } catch {
      setView("intro");
    }
  }

  async function connect() {
    if (connecting) return;

    setConnecting(true);

    try {
      await startSpotifyConnect(
        `/u/${encodeURIComponent(
          username
        )}`
      );
    } catch {
      setView("error");
      setConnecting(false);
    }
  }

  async function disconnect() {
    if (
      disconnecting
    ) {
      return;
    }

    setDisconnecting(true);

    try {
      await disconnectSpotify();

      setDisplayName(null);
      setView("intro");
    } catch {
      setView("error");
    } finally {
      setDisconnecting(
        false
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() =>
          void inspectSession()
        }
        className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-[#1ed760] transition hover:border-[#1ed760]/25 hover:bg-[#1ed760]/[0.08]"
        aria-label="Música con Spotify"
        title="Alumni × Spotify"
      >
        <SpotifyLogo
          size={21}
          className="transition group-hover:scale-105"
        />
      </button>

      {open && (
        <div className="fixed inset-0 z-[170] flex items-end justify-center bg-black/75 backdrop-blur-md sm:items-center sm:p-5">
          <button
            type="button"
            aria-label="Cerrar"
            className="absolute inset-0"
            onClick={() =>
              setOpen(false)
            }
          />

          <div className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[30px] border border-white/[0.08] bg-[#090c10] shadow-[0_-30px_100px_rgba(0,0,0,.62)] sm:max-h-[88vh] sm:max-w-[760px] sm:rounded-[30px]">
            <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#1ed760]/10 blur-[95px]" />

            <div className="relative flex shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-7">
              <AlumniSpotifyBrand />

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.045] text-zinc-600 transition hover:bg-white/[0.08] hover:text-white"
              >
                <X size={17} />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-7 sm:px-7 sm:pb-7">
              {view ===
              "checking" ? (
                <Checking />
              ) : view ===
                "premium" ? (
                <PremiumView
                  userId={userId}
                  displayName={
                    displayName
                  }
                  disconnecting={
                    disconnecting
                  }
                  onDisconnect={
                    disconnect
                  }
                />
              ) : view ===
                "not_premium" ? (
                <NotPremium />
              ) : view ===
                "not_authorized" ? (
                <NotAuthorized />
              ) : view ===
                "cancelled" ? (
                <RetryState
                  title="Conexión cancelada."
                  description="No se hizo ningún cambio. Puedes conectar Spotify cuando quieras."
                  connecting={
                    connecting
                  }
                  onConnect={
                    connect
                  }
                />
              ) : view ===
                "error" ? (
                <RetryState
                  title="No pudimos conectar Spotify."
                  description="Inténtalo de nuevo. Alumni nunca te pedirá tu contraseña de Spotify."
                  connecting={
                    connecting
                  }
                  onConnect={
                    connect
                  }
                />
              ) : (
                <Intro
                  connecting={
                    connecting
                  }
                  onConnect={
                    connect
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Checking() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1ed760]/20 bg-[#1ed760]/[0.07] text-[#1ed760]">
        <Loader2
          size={24}
          className="animate-spin"
        />
      </span>

      <p className="mt-5 text-sm font-black text-zinc-300">
        Revisando tu Spotify...
      </p>
    </div>
  );
}

function Intro({
  connecting,
  onConnect,
}: {
  connecting: boolean;
  onConnect: () => void;
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-[#1ed760]/15 bg-[#1ed760]/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#1ed760]">
        <Sparkles size={12} />
        Música en tu perfil
      </div>

      <h2 className="mt-5 max-w-[560px] text-[31px] font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-[38px]">
        Comparte tu buen gusto musical.
      </h2>

      <p className="mt-4 max-w-[560px] text-sm leading-6 text-zinc-500">
        Conecta tu cuenta Spotify Premium con Alumni, encuentra la canción que te representa y elige exactamente los 30 segundos que quieres mostrar en tu perfil.
      </p>

      <div className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
        <Feature
          icon={Headphones}
          title="Busca tu canción"
          description="Usamos el catálogo de Spotify para encontrar canciones, artistas y álbumes."
        />

        <Feature
          icon={SlidersHorizontal}
          title="Elige tu fragmento favorito"
          description="Mueve el selector al segundo exacto y pruébalo antes de guardarlo."
        />

        <Feature
          icon={Sparkles}
          title="Hazlo parte de tu perfil"
          description="Tu canción aparecerá junto a tu identidad dentro de Alumni."
        />
      </div>

      <div className="mt-6 flex items-start gap-2.5 text-[11px] font-bold leading-5 text-zinc-700">
        <ShieldCheck
          size={15}
          className="mt-0.5 shrink-0 text-[#1ed760]/70"
        />

        <span>
          Esta función requiere Spotify Premium. La autorización ocurre directamente en Spotify; Alumni no ve ni guarda tu contraseña.
        </span>
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a] shadow-[0_16px_40px_rgba(30,215,96,.12)] transition hover:brightness-105 disabled:opacity-60"
      >
        {connecting ? (
          <Loader2
            size={17}
            className="animate-spin"
          />
        ) : (
          <SpotifyLogo
            size={20}
          />
        )}

        {connecting
          ? "Conectando..."
          : "Conectar Spotify Premium"}
      </button>
    </div>
  );
}

function PremiumView({
  userId,
  displayName,
  disconnecting,
  onDisconnect,
}: {
  userId: string;
  displayName: string | null;
  disconnecting: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={15}
              className="text-[#1ed760]"
            />

            <p className="text-xs font-black text-zinc-300">
              Spotify Premium conectado
            </p>
          </div>

          <p className="mt-1 text-[10px] text-zinc-700">
            {displayName
              ? `${displayName} · listo para elegir música`
              : "Listo para elegir música"}
          </p>
        </div>

        <button
          type="button"
          onClick={onDisconnect}
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

      <div className="pt-6">
        <ProfileMusicSettings
          userId={userId}
        />
      </div>
    </div>
  );
}

function NotPremium() {
  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
        <Headphones size={24} />
      </span>

      <h2 className="mt-5 text-[29px] font-black leading-[1.04] tracking-[-0.045em] text-white">
        Spotify Premium es necesario.
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
        Lo siento, tienes que ser usuario Premium de Spotify para usar Música en Alumni. Premium nos permite reproducir tu canción y comenzar exactamente en el fragmento que elegiste.
      </p>

      <a
        href="https://www.spotify.com/premium/"
        target="_blank"
        rel="noreferrer"
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a]"
      >
        Visitar Spotify Premium
        <ExternalLink
          size={15}
        />
      </a>
    </div>
  );
}

function NotAuthorized() {
  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d7cff]/12 text-[#9aa4ff]">
        <ShieldCheck size={24} />
      </span>

      <h2 className="mt-5 text-[26px] font-black leading-[1.07] tracking-[-0.04em] text-white">
        Esta cuenta aún no está habilitada para la beta.
      </h2>

      <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-500">
        La cuenta puede ser Premium, pero Spotify no la autorizó para esta app en modo de desarrollo. Debe estar incluida entre los usuarios permitidos de la beta de Spotify.
      </p>
    </div>
  );
}

function RetryState({
  title,
  description,
  connecting,
  onConnect,
}: {
  title: string;
  description: string;
  connecting: boolean;
  onConnect: () => void;
}) {
  return (
    <div>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-[#1ed760]">
        <SpotifyLogo
          size={27}
        />
      </span>

      <h2 className="mt-5 text-[27px] font-black tracking-[-0.04em] text-white">
        {title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-zinc-500">
        {description}
      </p>

      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className="mt-7 h-12 w-full rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a] disabled:opacity-60"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    size?: number;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.035] text-zinc-600">
        <Icon size={17} />
      </span>

      <div>
        <p className="text-xs font-black text-zinc-300">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-zinc-700">
          {description}
        </p>
      </div>
    </div>
  );
}
