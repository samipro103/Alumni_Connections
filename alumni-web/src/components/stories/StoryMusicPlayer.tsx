"use client";

import { useEffect } from "react";
import {
  startStoryMusicNow,
  subscribeStoryMusic,
} from "@/lib/storyMusicBridge";

type Props = {
  storyId: string;
  onPlayingChange?: (playing: boolean) => void;
};

export default function StoryMusicPlayer({
  storyId,
  onPlayingChange,
}: Props) {
  useEffect(() => {
    const unsubscribe = subscribeStoryMusic(
      (changedStoryId, playing) => {
        if (changedStoryId === storyId) {
          onPlayingChange?.(playing);
        }
      }
    );

    // Fallback para aperturas que no vienen desde el rail
    // (por ejemplo un enlace directo). El arranque más fiable ocurre
    // en el tap del círculo, antes de montar el viewer.
    void startStoryMusicNow(storyId);

    return () => {
      unsubscribe();
      onPlayingChange?.(false);
    };
  }, [storyId, onPlayingChange]);

  return null;
}
