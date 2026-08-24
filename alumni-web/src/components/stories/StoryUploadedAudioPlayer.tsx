"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  startSeconds?: number;
  clipDurationSeconds?: number;
  paused?: boolean;
  onPlayingChange?: (playing: boolean) => void;
};

export default function StoryUploadedAudioPlayer({
  src,
  startSeconds = 0,
  clipDurationSeconds = 15,
  paused = false,
  onPlayingChange,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Guardamos una referencia ya validada para que TypeScript
    // conserve el tipo HTMLAudioElement dentro de callbacks anidados.
    const player = audio;

    const start = Math.max(0, Number(startSeconds || 0));
    const end =
      start +
      Math.max(1, Number(clipDurationSeconds || 15));

    function seekToStart() {
      try {
        player.currentTime = start;
      } catch {
        // El navegador volverá a intentarlo al cargar metadata.
      }
    }

    function onLoadedMetadata() {
      seekToStart();

      if (!paused) {
        void player.play().catch(() => {
          onPlayingChange?.(false);
        });
      }
    }

    function onTimeUpdate() {
      if (player.currentTime >= end - 0.08) {
        player.pause();
        onPlayingChange?.(false);
      }
    }

    function onPlay() {
      onPlayingChange?.(true);
    }

    function onPause() {
      onPlayingChange?.(false);
    }

    player.addEventListener(
      "loadedmetadata",
      onLoadedMetadata
    );
    player.addEventListener(
      "timeupdate",
      onTimeUpdate
    );
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);

    if (player.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      player.pause();
      onPlayingChange?.(false);
      player.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata
      );
      player.removeEventListener(
        "timeupdate",
        onTimeUpdate
      );
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [
    src,
    startSeconds,
    clipDurationSeconds,
    onPlayingChange,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (paused) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => {
      onPlayingChange?.(false);
    });
  }, [paused, onPlayingChange]);

  return (
    <audio
      ref={audioRef}
      src={src}
      preload="auto"
      playsInline
      className="hidden"
    />
  );
}
