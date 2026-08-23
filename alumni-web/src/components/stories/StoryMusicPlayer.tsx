"use client";

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
  const playingRef = useRef(false);
  const signatureRef = useRef("");
  const retryTimersRef = useRef<number[]>([]);

  const spotify = useSpotifyClip({
    mountRef: spotifyMountRef,
    trackUrl,
    trackId,
    startSeconds,
    clipDurationSeconds,
  });

  useEffect(() => {
    playingRef.current = spotify.isPlaying;
    onPlayingChange?.(spotify.isPlaying);
  }, [spotify.isPlaying, onPlayingChange]);

  useEffect(() => {
    const signature = `${trackId || trackUrl}:${Math.max(
      0,
      Math.floor(startSeconds)
    )}:${Math.max(1, Math.floor(clipDurationSeconds))}`;

    retryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    retryTimersRef.current = [];

    if (!spotify.ready || spotify.failed) return;

    if (signatureRef.current !== signature) {
      signatureRef.current = signature;
      playingRef.current = false;
    }

    // La historia ya fue abierta por una interacción del usuario.
    // Intentamos arrancar la música automáticamente en el fragmento guardado.
    // Los reintentos son espaciados y solo ocurren si Spotify todavía no reporta
    // reproducción, evitando loops de play/seek.
    [0, 260, 820].forEach((delay) => {
      const timer = window.setTimeout(() => {
        if (playingRef.current) return;
        spotify.play();
      }, delay);

      retryTimersRef.current.push(timer);
    });

    return () => {
      retryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      retryTimersRef.current = [];
    };
  }, [
    spotify.ready,
    spotify.failed,
    spotify.play,
    trackId,
    trackUrl,
    startSeconds,
    clipDurationSeconds,
  ]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-[10000px] top-0 h-[80px] w-[300px] overflow-hidden opacity-[0.01]"
    >
      <div ref={spotifyMountRef} />
    </div>
  );
}
