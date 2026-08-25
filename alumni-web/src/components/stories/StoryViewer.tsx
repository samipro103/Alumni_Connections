"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Award,
  Bookmark,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Heart,
  Loader2,
  Music2,
  Pause,
  Play,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import StoryMusicPlayer from "@/components/stories/StoryMusicPlayer";
import StoryDesignOverlay from "@/components/stories/StoryDesignOverlay";
import {
  startStoryMusicNow,
  stopAllStoryMusic,
} from "@/lib/storyMusicBridge";

export type StoryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_path?: string | null;
  media_type: "image" | "video";
  created_at: string;
  expires_at: string;
  viewed?: boolean;
  music_provider?: string | null;
  music_track_id?: string | null;
  music_title?: string | null;
  music_artist?: string | null;
  music_artwork_url?: string | null;
  music_track_url?: string | null;
  music_embed_url?: string | null;
  music_preview_url?: string | null;
  music_duration_ms?: number | null;
  music_clip_start_seconds?: number | null;
  music_clip_duration_seconds?: number | null;
  caption?: string | null;
  story_kind?: "standard" | "achievement" | "opportunity";
  headline?: string | null;
  achievement_type?: string | null;
  organization?: string | null;
  opportunity_type?: string | null;
  work_mode?: string | null;
  location_text?: string | null;
  action_url?: string | null;
  story_template?: string | null;
  story_accent?: string | null;
  story_animation?: string | null;
  story_photo_style?: string | null;
  story_decor?: string | null;
  story_font_style?: string | null;
};

export type StoryGroup = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  stories: StoryItem[];
};

type Props = {
  open: boolean;
  groups: StoryGroup[];
  startGroupIndex: number;
  startStoryIndex?: number;
  currentUserId: string;
  onClose: () => void;
  onChanged?: () => void | Promise<void>;
};

const STORY_DURATION_MS = 15000;

// Spotify sigue disponible para Música de Perfil.
// No usamos pistas Spotify como soundtrack sincronizado de Stories.
const STORY_SPOTIFY_SOUNDTRACKS_ENABLED = false;

function SpotifyGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.1"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <path
        d="M7.25 9.45c3.35-1.02 7.3-.75 10.2.75M7.85 12.25c2.76-.8 6.16-.57 8.7.66M8.45 14.83c2.15-.57 4.78-.4 6.78.54"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StoryViewer({
  open,
  groups,
  startGroupIndex,
  startStoryIndex = 0,
  currentUserId,
  onClose,
  onChanged,
}: Props) {
  const rafRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pausedRef = useRef(false);
  const advancingRef = useRef(false);

  const [groupIndex, setGroupIndex] =
    useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] =
    useState<number | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] =
    useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [replyFocused, setReplyFocused] =
    useState(false);
  const [storyMusicPlaying, setStoryMusicPlaying] =
    useState(false);

  useEffect(() => {
    pausedRef.current = paused || replyFocused;
  }, [paused, replyFocused]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    setGroupIndex(
      Math.min(
        Math.max(startGroupIndex, 0),
        Math.max(groups.length - 1, 0)
      )
    );
    setStoryIndex(Math.max(startStoryIndex, 0));
  }, [
    open,
    startGroupIndex,
    startStoryIndex,
    groups.length,
  ]);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const ownStory =
    story?.user_id === currentUserId;

  useEffect(() => {
    if (!open || !story) return;

    advancingRef.current = false;
    setProgress(0);
    setViewCount(null);
    setReply("");
    setPaused(false);
    setReplyFocused(false);
    setStoryMusicPlaying(false);
    setVideoMuted(false);

    void recordView();
    void loadStoryLikes();
    void loadStorySave();

    cancelAnimation();

    // Todas las historias duran exactamente 15 segundos.
    // El progreso ya no depende de la duración del video ni de si lleva música.
    let elapsed = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;

      if (!pausedRef.current) {
        elapsed += delta;
      }

      const nextProgress = Math.min(
        100,
        (elapsed / STORY_DURATION_MS) * 100
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        next();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return cancelAnimation;
  }, [
    open,
    story?.id,
    storyIndex,
    groupIndex,
  ]);

  useEffect(() => {
    const video = videoRef.current;

    if (
      !video ||
      story?.media_type !== "video"
    ) {
      return;
    }

    if (paused || replyFocused) {
      video.pause();
    } else {
      void video.play().catch(() => {
        setPaused(true);
      });
    }
  }, [
    paused,
    replyFocused,
    story?.id,
    story?.media_type,
  ]);

  useEffect(() => {
    if (!videoRef.current) return;

    videoRef.current.muted =
      videoMuted || storyMusicPlaying;
  }, [videoMuted, storyMusicPlaying]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();

      if (
        event.key === " " &&
        !replyFocused
      ) {
        event.preventDefault();
        setPaused((value) => !value);
      }
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
  }, [
    open,
    replyFocused,
    groupIndex,
    storyIndex,
  ]);

  async function recordView() {
    if (!story) return;

    if (!ownStory) {
      await supabase.from("story_views").upsert(
        {
          story_id: story.id,
          viewer_id: currentUserId,
          viewed_at: new Date().toISOString(),
        },
        {
          onConflict:
            "story_id,viewer_id",
        }
      );
    } else {
      const { count } = await supabase
        .from("story_views")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("story_id", story.id);

      setViewCount(count || 0);
    }
  }

  async function loadStoryLikes() {
    if (!story) return;

    const { data, error } = await supabase
      .from("story_likes")
      .select("user_id")
      .eq("story_id", story.id);

    if (error) {
      console.error(error);
      setLikeCount(0);
      setLiked(false);
      return;
    }

    const rows = data || [];
    setLikeCount(rows.length);
    setLiked(
      rows.some(
        (row: any) =>
          row.user_id === currentUserId
      )
    );
  }

  async function toggleStoryLike() {
    if (
      !story ||
      ownStory ||
      likeBusy
    ) {
      return;
    }

    setLikeBusy(true);

    try {
      if (liked) {
        const { error } = await supabase
          .from("story_likes")
          .delete()
          .eq("story_id", story.id)
          .eq("user_id", currentUserId);

        if (error) throw error;

        await supabase
          .from("notifications")
          .delete()
          .eq("user_id", story.user_id)
          .eq("actor_id", currentUserId)
          .eq("type", "like")
          .eq("target_type", "story")
          .eq("target_id", story.id);

        setLiked(false);
        setLikeCount((value) =>
          Math.max(0, value - 1)
        );
      } else {
        const { error } = await supabase
          .from("story_likes")
          .insert({
            story_id: story.id,
            user_id: currentUserId,
          });

        if (error) throw error;

        await supabase
          .from("notifications")
          .insert({
            user_id: story.user_id,
            actor_id: currentUserId,
            type: "like",
            target_type: "story",
            target_id: story.id,
          });

        setLiked(true);
        setLikeCount(
          (value) => value + 1
        );
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo actualizar el me gusta."
      );
    } finally {
      setLikeBusy(false);
    }
  }

  async function loadStorySave() {
    if (
      !story ||
      story.story_kind !== "opportunity"
    ) {
      setSaved(false);
      return;
    }

    const { data } = await supabase
      .from("story_saves")
      .select("id")
      .eq("story_id", story.id)
      .eq("user_id", currentUserId)
      .maybeSingle();

    setSaved(Boolean(data));
  }

  async function toggleStorySave() {
    if (
      !story ||
      story.story_kind !== "opportunity" ||
      saveBusy
    ) {
      return;
    }

    setSaveBusy(true);

    try {
      if (saved) {
        const { error } =
          await supabase
            .from("story_saves")
            .delete()
            .eq("story_id", story.id)
            .eq("user_id", currentUserId);

        if (error) throw error;
        setSaved(false);
      } else {
        const { error } =
          await supabase
            .from("story_saves")
            .insert({
              story_id: story.id,
              user_id: currentUserId,
            });

        if (error) throw error;
        setSaved(true);
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo guardar la oportunidad."
      );
    } finally {
      setSaveBusy(false);
    }
  }

  function openOpportunity() {
    if (!story?.action_url) return;

    const url =
      /^https?:\/\//i.test(
        story.action_url
      )
        ? story.action_url
        : `https://${story.action_url}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function sendStoryReply() {
    if (
      !story ||
      ownStory ||
      !reply.trim() ||
      sendingReply
    ) {
      return;
    }

    const content = reply.trim();
    setSendingReply(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: currentUserId,
          receiver_id: story.user_id,
          content,
          message_type: "story_reply",
          story_id: story.id,
          story_media_url:
            story.media_url,
        });

      if (error) throw error;

      await supabase
        .from("notifications")
        .insert({
          user_id: story.user_id,
          actor_id: currentUserId,
          type: "story_reply",
          target_type: "message",
          target_id: story.id,
        });

      setReply("");
      setReplyFocused(false);
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo responder la historia."
      );
    } finally {
      setSendingReply(false);
    }
  }

  function cancelAnimation() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(
        rafRef.current
      );
      rafRef.current = null;
    }
  }

  function next() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    cancelAnimation();

    if (!group) {
      advancingRef.current = false;
      return;
    }

    if (
      storyIndex <
      group.stories.length - 1
    ) {
      const target =
        group.stories[storyIndex + 1];

      if (STORY_SPOTIFY_SOUNDTRACKS_ENABLED && target?.music_track_url) {
        startStoryMusicNow(target.id);
      } else {
        stopAllStoryMusic();
      }

      setStoryIndex(
        (value) => value + 1
      );
      return;
    }

    if (
      groupIndex <
      groups.length - 1
    ) {
      const target =
        groups[groupIndex + 1]?.stories[0];

      if (STORY_SPOTIFY_SOUNDTRACKS_ENABLED && target?.music_track_url) {
        startStoryMusicNow(target.id);
      } else {
        stopAllStoryMusic();
      }

      setGroupIndex(
        (value) => value + 1
      );
      setStoryIndex(0);
      return;
    }

    stopAllStoryMusic();
    onClose();
  }

  function previous() {
    advancingRef.current = false;
    cancelAnimation();

    if (!group) return;

    if (storyIndex > 0) {
      const target =
        group.stories[storyIndex - 1];

      if (STORY_SPOTIFY_SOUNDTRACKS_ENABLED && target?.music_track_url) {
        startStoryMusicNow(target.id);
      } else {
        stopAllStoryMusic();
      }

      setStoryIndex(
        (value) => value - 1
      );
      return;
    }

    if (groupIndex > 0) {
      const previousGroup =
        groups[groupIndex - 1];

      const targetIndex = Math.max(
        previousGroup.stories.length - 1,
        0
      );

      const target =
        previousGroup.stories[targetIndex];

      if (STORY_SPOTIFY_SOUNDTRACKS_ENABLED && target?.music_track_url) {
        startStoryMusicNow(target.id);
      } else {
        stopAllStoryMusic();
      }

      setGroupIndex(
        (value) => value - 1
      );

      setStoryIndex(targetIndex);
    }
  }

  async function deleteCurrentStory() {
    if (
      !story ||
      !ownStory ||
      deleting
    ) {
      return;
    }

    const confirmed = confirm(
      "¿Eliminar esta historia?"
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const { data: fullStory } =
        await supabase
          .from("stories")
          .select("media_path")
          .eq("id", story.id)
          .maybeSingle();

      const { error: deleteError } =
        await supabase
          .from("stories")
          .delete()
          .eq("id", story.id);

      if (deleteError) {
        throw deleteError;
      }

      if (fullStory?.media_path) {
        await supabase.storage
          .from("stories")
          .remove([
            fullStory.media_path,
          ]);
      }

      await onChanged?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.message ||
          "No se pudo eliminar la historia."
      );
    } finally {
      setDeleting(false);
    }
  }

  const createdLabel = useMemo(() => {
    if (!story) return "";

    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(
            story.created_at
          ).getTime()) /
          60000
      )
    );

    if (minutes < 1) return "ahora";

    if (minutes < 60) {
      return `hace ${minutes} min`;
    }

    return `hace ${Math.floor(
      minutes / 60
    )} h`;
  }, [story?.created_at]);

  if (
    !open ||
    !story ||
    !group
  ) {
    return null;
  }

  return createPortal(
    <div data-theme-lock="dark" className="alumni-story-viewer fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-black">
      <div className="relative flex h-[100dvh] w-full max-w-[560px] items-center justify-center overflow-hidden bg-[#050506] sm:h-[calc(100dvh-24px)] sm:rounded-[30px] sm:border sm:border-white/[0.08] sm:shadow-[0_30px_100px_rgba(0,0,0,.5)]">
        <div className="absolute left-3 right-3 top-[max(10px,env(safe-area-inset-top))] z-40 px-1">
          <div className="flex gap-1">
            {group.stories.map(
              (item, index) => (
                <div
                  key={item.id}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/18"
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        index <
                        storyIndex
                          ? "100%"
                          : index ===
                              storyIndex
                            ? `${progress}%`
                            : "0%",
                    }}
                  />
                </div>
              )
            )}
          </div>
        </div>

        <div className="absolute left-4 right-4 top-[max(28px,calc(env(safe-area-inset-top)+18px))] z-40 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/15">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.username}
                className="h-full w-full object-cover"
              />
            ) : (
              group.username
                ?.charAt(0)
                ?.toUpperCase() || "U"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">
              @{group.username}
            </p>
            <p className="text-[10px] text-white/45">
              {createdLabel}
            </p>
          </div>

          {story.media_type ===
            "video" && (
            <button
              type="button"
              onClick={() =>
                setVideoMuted(
                  (value) => !value
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/70 backdrop-blur-xl"
              aria-label={
                videoMuted
                  ? "Activar audio"
                  : "Silenciar video"
              }
            >
              {videoMuted ? (
                <VolumeX size={17} />
              ) : (
                <Volume2 size={17} />
              )}
            </button>
          )}

          {ownStory && (
            <button
              type="button"
              onClick={
                deleteCurrentStory
              }
              disabled={deleting}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/65 backdrop-blur-xl transition hover:text-red-300"
              aria-label="Eliminar historia"
            >
              {deleting ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/80 backdrop-blur-xl"
            aria-label="Cerrar historia"
          >
            <X size={19} />
          </button>
        </div>

        <div className="absolute inset-x-0 top-0 z-20 h-36 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-20 h-64 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {story.media_type ===
        "video" ? (
          <video
            ref={videoRef}
            key={story.id}
            src={story.media_url}
            autoPlay
            playsInline
            muted={
              videoMuted ||
              storyMusicPlaying
            }
            loop
            className="h-full w-full object-cover sm:object-contain"
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt={`Historia de @${group.username}`}
            className="h-full w-full object-cover sm:object-contain"
            loading="eager"
          />
        )}

        <StoryDesignOverlay
          story={story}
        />

        <button
          type="button"
          onClick={previous}
          className="absolute inset-y-[90px] left-0 z-10 w-[28%]"
          aria-label="Historia anterior"
        />

        <button
          type="button"
          onClick={next}
          className="absolute inset-y-[90px] right-0 z-10 w-[28%]"
          aria-label="Historia siguiente"
        />

        <button
          type="button"
          onClick={() =>
            setPaused(
              (value) => !value
            )
          }
          className="absolute bottom-[100px] left-[28%] right-[28%] top-[90px] z-10"
          aria-label={
            paused
              ? "Reanudar historia"
              : "Pausar historia"
          }
        />

        {paused &&
          !replyFocused && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-xl">
              {story.media_type ===
              "video" ? (
                <Play
                  size={21}
                  fill="currentColor"
                />
              ) : (
                <Pause size={20} />
              )}
            </div>
          )}

        <button
          type="button"
          onClick={previous}
          className="absolute left-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/65 backdrop-blur-lg sm:flex"
          aria-label="Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/65 backdrop-blur-lg sm:flex"
          aria-label="Siguiente"
        >
          <ChevronRight size={20} />
        </button>

        {STORY_SPOTIFY_SOUNDTRACKS_ENABLED && story.music_track_url && (
          <div
            className={`absolute left-4 z-40 flex max-w-[78%] items-center gap-2.5 rounded-[17px] border border-white/10 bg-black/45 p-2.5 backdrop-blur-2xl ${
              ownStory
                ? "bottom-20"
                : "bottom-[92px]"
            }`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {story.music_artwork_url ? (
              <img
                src={
                  story.music_artwork_url
                }
                alt=""
                className="h-10 w-10 rounded-[10px] object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/10 text-white/60">
                <Music2 size={15} />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-black text-white/90">
                {story.music_title ||
                  "Canción"}
              </p>
              <p className="mt-0.5 truncate text-[9px] text-white/45">
                {story.music_artist || "Spotify"} · 15s
              </p>
            </div>

            <StoryMusicPlayer
              storyId={story.id}
              onPlayingChange={setStoryMusicPlaying}
            />

            <span
              className="text-white/30"
              aria-label="Spotify"
            >
              <SpotifyGlyph />
            </span>
          </div>
        )}

        {!ownStory &&
          story.story_kind === "opportunity" && (
            <div
              className="absolute bottom-[82px] left-4 right-4 z-40 flex items-center gap-2"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={() =>
                  void toggleStorySave()
                }
                disabled={saveBusy}
                className={`flex h-11 items-center gap-2 rounded-[15px] border px-4 text-xs font-black backdrop-blur-xl transition ${
                  saved
                    ? "border-emerald-300/25 bg-emerald-400/15 text-emerald-100"
                    : "border-white/10 bg-black/45 text-white/75"
                }`}
                aria-label="Guardar oportunidad"
              >
                <Bookmark
                  size={15}
                  fill={
                    saved
                      ? "currentColor"
                      : "none"
                  }
                />
                {saved
                  ? "Guardada"
                  : "Guardar"}
              </button>

              {story.action_url && (
                <button
                  type="button"
                  onClick={openOpportunity}
                  className="ml-auto flex h-11 items-center gap-2 rounded-[15px] bg-white px-4 text-xs font-black text-black transition hover:bg-zinc-200"
                >
                  Ver oportunidad
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          )}

        {ownStory ? (
          <div className="absolute bottom-5 left-5 z-40 flex items-center gap-2">
            {viewCount !== null && (
              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-[11px] font-bold text-white/70 backdrop-blur-xl">
                <Eye size={14} />
                {viewCount}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-2 text-[11px] font-bold text-white/70 backdrop-blur-xl">
              <Heart
                size={14}
                fill={
                  likeCount > 0
                    ? "currentColor"
                    : "none"
                }
              />
              {likeCount}
            </div>
          </div>
        ) : (
          <div
            className="absolute bottom-0 left-0 right-0 z-40 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-14"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex min-w-0 flex-1 items-center rounded-[22px] border bg-black/35 px-4 backdrop-blur-2xl transition ${
                  replyFocused
                    ? "border-white/25 bg-black/55"
                    : "border-white/10"
                }`}
              >
                <input
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  onFocus={() =>
                    setReplyFocused(true)
                  }
                  onBlur={() => {
                    if (!reply.trim()) {
                      setReplyFocused(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      void sendStoryReply();
                    }
                  }}
                  placeholder={`Responder a @${group.username}`}
                  className="h-12 min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/35"
                />

                <button
                  type="button"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    void sendStoryReply()
                  }
                  disabled={
                    !reply.trim() ||
                    sendingReply
                  }
                  className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition disabled:bg-white/10 disabled:text-white/25"
                  aria-label="Enviar respuesta"
                >
                  {sendingReply ? (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  void toggleStoryLike()
                }
                disabled={likeBusy}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border backdrop-blur-2xl transition ${
                  liked
                    ? "border-red-400/25 bg-red-500/12 text-red-400"
                    : "border-white/10 bg-black/35 text-white/70 hover:bg-black/55 hover:text-white"
                }`}
                aria-label={
                  story.story_kind === "achievement"
                    ? liked
                      ? "Quitar felicitación"
                      : "Felicitar"
                    : liked
                    ? "Quitar me gusta"
                    : "Me gusta"
                }
              >
                {story.story_kind === "achievement" ? (
                  <Award
                    size={18}
                    fill={
                      liked
                        ? "currentColor"
                        : "none"
                    }
                  />
                ) : (
                  <Heart
                    size={18}
                    fill={
                      liked
                        ? "currentColor"
                        : "none"
                    }
                  />
                )}
              </button>
            </div>

            {likeCount > 0 && (
              <p className="mt-2 pl-3 text-[9px] font-bold text-white/30">
                {likeCount} {story.story_kind === "achievement" ? "felicitaciones" : "me gusta"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
