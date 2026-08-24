"use client";

import {
  Check,
  ExternalLink,
  Headphones,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import SpotifyLogo from "@/components/music/SpotifyLogo";

export type SpotifyConnectState =
  | "intro"
  | "checking"
  | "connected"
  | "not_premium"
  | "not_authorized"
  | "cancelled"
  | "error";

type Props = {
  open: boolean;
  state: SpotifyConnectState;
  displayName?: string | null;
  onClose: () => void;
  onConnect: () => void;
  onGoMusic?: () => void;
  connecting?: boolean;
};

function AlumniMark() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="/icons/alumni-192.png"
        alt="Alumni"
        className="h-9 w-9 rounded-xl"
      />
      <span className="text-sm font-black tracking-[-0.03em] text-white">
        Alumni
      </span>
    </div>
  );
}

export default function SpotifyConnectModal({
  open,
  state,
  displayName,
  onClose,
  onConnect,
  onGoMusic,
  connecting = false,
}: Props) {
  if (!open) return null;

  const notPremium =
    state === "not_premium";

  const notAuthorized =
    state === "not_authorized";

  const connected =
    state === "connected";

  const failed =
    state === "error";

  const cancelled =
    state === "cancelled";

  return (
    <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/72 p-0 backdrop-blur-md sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative w-full overflow-hidden rounded-t-[32px] border border-white/[0.08] bg-[#0a0d11] shadow-[0_-24px_80px_rgba(0,0,0,.5)] sm:max-w-[560px] sm:rounded-[32px]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#1ed760]/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#6d7cff]/12 blur-[90px]" />

        <div className="relative border-b border-white/[0.06] px-5 py-4 sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlumniMark />

              <span className="text-zinc-800">
                ×
              </span>

              <div className="flex items-center gap-2 text-[#1ed760]">
                <SpotifyLogo
                  size={28}
                />
                <span className="text-sm font-black tracking-[-0.03em]">
                  Spotify
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.045] text-zinc-600 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="relative px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-7 sm:px-7 sm:pb-7">
          {state === "checking" ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1ed760]/20 bg-[#1ed760]/8 text-[#1ed760]">
                <Loader2
                  size={24}
                  className="animate-spin"
                />
              </div>

              <p className="mt-5 text-base font-black text-zinc-200">
                Revisando tu Spotify...
              </p>
            </div>
          ) : connected ? (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1ed760]/12 text-[#1ed760]">
                <Check size={25} />
              </div>

              <h2 className="mt-5 text-[27px] font-black leading-[1.05] tracking-[-0.045em] text-white">
                Spotify Premium conectado.
              </h2>

              <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">
                {displayName
                  ? `Listo, ${displayName}.`
                  : "Todo listo."}{" "}
                Ya puedes elegir una canción y marcar el fragmento que quieres mostrar en tu perfil.
              </p>

              <button
                type="button"
                onClick={onGoMusic || onClose}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a] transition hover:brightness-105"
              >
                Elegir mi canción
              </button>
            </div>
          ) : notPremium ? (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                <Headphones size={24} />
              </div>

              <h2 className="mt-5 text-[27px] font-black leading-[1.05] tracking-[-0.045em] text-white">
                Spotify Premium es necesario.
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Lo siento, tienes que ser usuario Premium de Spotify para usar esta función en Alumni. Con Premium podemos reproducir y posicionar tu canción en el fragmento que elegiste.
              </p>

              <a
                href="https://www.spotify.com/premium/"
                target="_blank"
                rel="noreferrer"
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a]"
              >
                Visitar Spotify Premium
                <ExternalLink size={15} />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="mt-2 h-11 w-full text-xs font-black text-zinc-600"
              >
                Ahora no
              </button>
            </div>
          ) : notAuthorized ? (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6d7cff]/12 text-[#9aa4ff]">
                <ShieldCheck size={24} />
              </div>

              <h2 className="mt-5 text-[25px] font-black leading-[1.08] tracking-[-0.04em] text-white">
                Esta cuenta aún no está habilitada para la beta.
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Spotify rechazó el acceso de esta cuenta. Mientras Alumni esté usando el modo de desarrollo de Spotify, la cuenta debe estar autorizada dentro de la app de Spotify Developers.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-7 h-12 w-full rounded-2xl bg-white/[0.07] text-sm font-black text-zinc-200"
              >
                Entendido
              </button>
            </div>
          ) : failed || cancelled ? (
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05] text-zinc-500">
                <SpotifyLogo size={26} />
              </div>

              <h2 className="mt-5 text-[25px] font-black leading-[1.08] tracking-[-0.04em] text-white">
                {cancelled
                  ? "Conexión cancelada."
                  : "No pudimos conectar Spotify."}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-500">
                Puedes intentarlo de nuevo. Alumni nunca te pedirá tu contraseña de Spotify.
              </p>

              <button
                type="button"
                onClick={onConnect}
                className="mt-7 h-12 w-full rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a]"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#1ed760]/15 bg-[#1ed760]/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#1ed760]">
                <Sparkles size={12} />
                Música en tu perfil
              </div>

              <h2 className="mt-5 text-[31px] font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-[35px]">
                Comparte tu buen gusto musical.
              </h2>

              <p className="mt-4 max-w-[470px] text-sm leading-6 text-zinc-500">
                Conecta Spotify Premium con Alumni y elige el fragmento de la canción que mejor te representa.
              </p>

              <div className="mt-7 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                <Feature
                  icon={Headphones}
                  title="Tu canción, de verdad"
                  description="Busca directamente en el catálogo de Spotify."
                />

                <Feature
                  icon={SlidersHorizontal}
                  title="Elige tu fragmento"
                  description="Marca el segundo exacto desde donde quieres escuchar."
                />

                <Feature
                  icon={Sparkles}
                  title="Hazlo parte de tu perfil"
                  description="Una forma más personal de presentarte en Alumni."
                />
              </div>

              <div className="mt-6 flex items-center gap-2 text-[11px] font-bold text-zinc-700">
                <ShieldCheck
                  size={14}
                  className="text-[#1ed760]/70"
                />
                Requiere una cuenta Spotify Premium.
              </div>

              <button
                type="button"
                onClick={onConnect}
                disabled={connecting}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#1ed760] text-sm font-black text-[#07110a] shadow-[0_16px_40px_rgba(30,215,96,.12)] transition hover:brightness-105 disabled:opacity-60"
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

              <p className="mt-3 text-center text-[10px] leading-4 text-zinc-800">
                La autorización ocurre directamente en Spotify. Alumni no ve ni guarda tu contraseña.
              </p>
            </div>
          )}
        </div>
      </div>
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
