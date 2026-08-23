"use client";

import {
  ExternalLink,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSpotifyClip } from "@/hooks/useSpotifyClip";

type Props = {
  previewUrl?: string | null;
  trackUrl: string;
  trackId?: string | null;
  autoTry?: boolean;
  onPlayingChange?: (playing: boolean) => void;
};

export default function StoryMusicPlayer({
  previewUrl,
  trackUrl,
  trackId,
  autoTry = true,
  onPlayingChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const spotifyMountRef = useRef<HTMLDivElement | null>(null);

  const [audioPlaying, setAudioPlaying] = useState(false);
  const [autoBlocked, setAutoBlocked] = useState(false);

  const spotify = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl,
    trackId,
    startSeconds: 0,
    clipDurationSeconds: 30,
  });

  const usingPreview = Boolean(previewUrl);
  const playing = usingPreview
    ? audioPlaying
    : spotify.isPlaying;

  useEffect(() => {
    onPlayingChange?.(playing);
  }, [playing, onPlayingChange]);

  useEffect(() => {
    if (!usingPreview || !autoTry || !audioRef.current) return;

    const audio = audioRef.current;
    audio.currentTime = 0;

    const timer = window.setTimeout(() => {
      audio
        .play()
        .then(() => {
          setAutoBlocked(false);
        })
        .catch(() => {
          setAutoBlocked(true);
          setAudioPlaying(false);
        });
    }, 100);

    return () => {
      window.clearTimeout(timer);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [previewUrl, usingPreview, autoTry]);

  function togglePreview() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().then(() => {
        setAutoBlocked(false);
      });
    } else {
      audio.pause();
    }
  }

  function handleAction() {
    if (usingPreview) {
      togglePreview();
      return;
    }

    if (spotify.failed) {
      window.open(trackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    spotify.toggle();
  }

  return (
    <>
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          preload="auto"
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onEnded={() => setAudioPlaying(false)}
        />
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleAction();
        }}
        disabled={
          !usingPreview && !spotify.ready && !spotify.failed
        }
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/85 backdrop-blur-xl transition hover:bg-white/[0.14] disabled:cursor-wait disabled:text-white/35"
        aria-label={
          playing
            ? "Pausar música"
            : "Reproducir música"
        }
      >
        {!usingPreview &&
        !spotify.ready &&
        !spotify.failed ? (
          <Loader2 size={14} className="animate-spin" />
        ) : !usingPreview && spotify.failed ? (
          <ExternalLink size={14} />
        ) : playing ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play
            size={15}
            fill="currentColor"
            className="ml-0.5"
          />
        )}
      </button>

      {usingPreview && autoBlocked && (
        <span className="sr-only">
          El navegador bloqueó la reproducción automática. Pulsa
          reproducir.
        </span>
      )}

      {!usingPreview && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[10000px] top-0 h-[80px] w-[300px] overflow-hidden opacity-[0.01]"
        >
          <div ref={spotifyMountRef} />
        </div>
      )}
    </>
  );
}
