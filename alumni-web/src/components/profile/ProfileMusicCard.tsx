"use client";

import { useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Music2,
  Play,
  Sparkles,
} from "lucide-react";
import type { ProfileMusic } from "@/lib/profileMusic";

type Props = {
  track: ProfileMusic | null | undefined;
  className?: string;
};

export default function ProfileMusicCard({
  track,
  className = "",
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!track) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#0f1218] ${className}`}
    >
      {track.artwork_url && (
        <>
          <img
            src={track.artwork_url}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-[0.13] blur-3xl"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,18,24,.76),rgba(15,18,24,.93))]" />
        </>
      )}

      <div className="relative p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-[74px] w-[74px] shrink-0">
            <div
              className={`absolute -inset-2 rounded-full border border-[#6d7cff]/25 opacity-60 ${
                expanded ? "animate-pulse" : ""
              }`}
            />
            <div
              className={`relative h-full w-full overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#191d27] shadow-[0_12px_30px_rgba(0,0,0,.25)] ${
                expanded ? "animate-[musicFloat_3.2s_ease-in-out_infinite]" : ""
              }`}
            >
              {track.artwork_url ? (
                <img
                  src={track.artwork_url}
                  alt={`Portada de ${track.track_title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#8d98ff]">
                  <Music2 size={25} />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-1.5 text-[#8d98ff]">
              <Sparkles size={12} />
              <span className="text-[10px] font-black uppercase tracking-[0.16em]">
                Mi vibra
              </span>
            </div>

            <p className="truncate text-[15px] font-black text-zinc-100">
              {track.track_title}
            </p>

            <p className="mt-1 truncate text-xs text-zinc-600">
              {track.artist_name || "Canción elegida en Spotify"}
            </p>

            {expanded && (
              <div className="mt-3 flex h-4 items-end gap-1">
                {[8, 14, 10, 16, 12, 7, 13].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-1 rounded-full bg-[#8d98ff]/70 animate-[musicBar_.9s_ease-in-out_infinite_alternate]"
                    style={{
                      height,
                      animationDelay: `${index * 90}ms`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition ${
              expanded
                ? "bg-white/[0.08] text-zinc-300"
                : "bg-[#6d7cff] text-white shadow-[0_8px_24px_rgba(109,124,255,.28)] hover:bg-[#7b87ff]"
            }`}
            aria-label={expanded ? "Cerrar reproductor" : "Escuchar canción"}
          >
            {expanded ? <ChevronDown size={19} /> : <Play size={18} fill="currentColor" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 overflow-hidden rounded-[16px] border border-white/[0.07] bg-black/20">
            <iframe
              src={track.embed_url}
              title={`Spotify: ${track.track_title}`}
              width="100%"
              height="152"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="block w-full"
            />
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <p className="text-[10px] font-bold text-zinc-700">
            Reproducción mediante Spotify.
          </p>
          <a
            href={track.track_url}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-1 text-[10px] font-black text-zinc-600 transition hover:text-zinc-300"
          >
            Spotify <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes musicFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-3px) rotate(1deg); }
        }
        @keyframes musicBar {
          from { transform: scaleY(0.45); opacity: 0.42; }
          to { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
