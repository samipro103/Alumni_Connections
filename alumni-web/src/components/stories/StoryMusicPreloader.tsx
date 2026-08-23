"use client";

import { useEffect, useRef } from "react";
import { loadSpotifyIframeApi } from "@/lib/spotifyIframe";
import {
  markStoryMusicReady,
  registerStoryMusicController,
  unregisterStoryMusicController,
  updateStoryMusicState,
} from "@/lib/storyMusicBridge";

type Props = {
  storyId: string;
  trackUrl: string;
  startSeconds?: number;
  clipDurationSeconds?: number;
};

export default function StoryMusicPreloader({
  storyId,
  trackUrl,
  startSeconds = 0,
  clipDurationSeconds = 15,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let readyTimer: number | null = null;
    let controller: any = null;
    let prepared = false;

    async function setup() {
      try {
        const api = await loadSpotifyIframeApi();

        if (cancelled || !mountRef.current) return;

        api.createController(
          mountRef.current,
          {
            url: trackUrl,
            width: 300,
            height: 80,
          },
          (nextController: any) => {
            if (cancelled) {
              nextController?.destroy?.();
              return;
            }

            controller = nextController;

            registerStoryMusicController(
              storyId,
              controller,
              trackUrl,
              startSeconds,
              clipDurationSeconds
            );

            const prepare = () => {
              if (prepared || cancelled) return;
              prepared = true;

              // El punto elegido se prepara ANTES de que el usuario abra
              // la historia. Al tocar el círculo solo queda hacer play().
              if (startSeconds > 0) {
                try {
                  controller.loadEntity?.(
                    trackUrl,
                    false,
                    Math.max(
                      0,
                      Math.floor(startSeconds)
                    )
                  );
                } catch {
                  try {
                    controller.seek?.(
                      Math.max(
                        0,
                        Math.floor(startSeconds)
                      )
                    );
                  } catch {
                    // Fallback silencioso.
                  }
                }
              }

              readyTimer = window.setTimeout(() => {
                if (!cancelled) {
                  markStoryMusicReady(storyId);
                }
              }, startSeconds > 0 ? 320 : 80);
            };

            controller.addListener?.(
              "ready",
              prepare
            );

            controller.addListener?.(
              "playback_started",
              () => {
                updateStoryMusicState(storyId, {
                  isPaused: false,
                });
              }
            );

            controller.addListener?.(
              "playback_update",
              (event: any) => {
                const data = event?.data || {};

                updateStoryMusicState(storyId, {
                  isPaused: Boolean(
                    data.isPaused
                  ),
                  position:
                    typeof data.position ===
                    "number"
                      ? data.position
                      : undefined,
                });
              }
            );

            // El callback suele llegar con el controlador utilizable.
            prepare();
          }
        );
      } catch (error) {
        console.error(
          "Story music preload failed:",
          error
        );
      }
    }

    void setup();

    return () => {
      cancelled = true;

      if (readyTimer !== null) {
        window.clearTimeout(readyTimer);
      }

      unregisterStoryMusicController(storyId);

      if (controller) {
        try {
          controller.destroy?.();
        } catch {
          // Ignorar cleanup duplicado.
        }
      }
    };
  }, [
    storyId,
    trackUrl,
    startSeconds,
    clipDurationSeconds,
  ]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed -left-[10000px] top-0 z-[-1] h-[80px] w-[300px] overflow-hidden opacity-[0.01]"
    >
      <div ref={mountRef} />
    </div>
  );
}
