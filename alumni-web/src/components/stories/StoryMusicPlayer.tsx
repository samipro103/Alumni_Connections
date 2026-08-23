"use client";

import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useSpotifyClip } from "@/hooks/useSpotifyClip";

type Props = {
  trackUrl: string;
  trackId?: string | null;
  startSeconds?: number;
  clipDurationSeconds?: number;
  onPlayingChange?: (playing: boolean) => void;
};

export default function StoryMusicPlayer({
  trackUrl,
  trackId,
  startSeconds = 0,
  clipDurationSeconds = 15,
  onPlayingChange,
}: Props) {
  const spotifyMountRef = useRef<HTMLDivElement | null>(null);

  const spotify = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl,
    trackId,
    startSeconds,
    clipDurationSeconds,
  });

  useEffect(() => {
    onPlayingChange?.(spotify.isPlaying);
  }, [spotify.isPlaying, onPlayingChange]);

  function handleAction() {
    if (spotify.failed) {
      window.open(trackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    spotify.toggle();
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleAction();
        }}
        disabled={!spotify.ready && !spotify.failed}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/85 backdrop-blur-xl transition hover:bg-white/[0.14] disabled:cursor-wait disabled:text-white/35"
        aria-label={
          spotify.isPlaying
            ? "Pausar música"
            : "Reproducir música"
        }
      >
        {!spotify.ready && !spotify.failed ? (
          <Loader2 size={14} className="animate-spin" />
        ) : spotify.failed ? (
          <ExternalLink size={14} />
        ) : spotify.isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={15} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[10000px] top-0 h-[80px] w-[300px] overflow-hidden opacity-[0.01]"
      >
        <div ref={spotifyMountRef} />
      </div>
    </>
  );
}
