"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export type StoryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_path?: string | null;
  media_type: "image" | "video";
  created_at: string;
  expires_at: string;
  viewed?: boolean;
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

const IMAGE_DURATION_MS = 6500;

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

  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setGroupIndex(
      Math.min(
        Math.max(startGroupIndex, 0),
        Math.max(groups.length - 1, 0)
      )
    );
    setStoryIndex(Math.max(startStoryIndex, 0));
  }, [open, startGroupIndex, startStoryIndex, groups.length]);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const ownStory = story?.user_id === currentUserId;

  useEffect(() => {
    if (!open || !story) return;

    setProgress(0);
    setViewCount(null);
    setReply("");
    recordView();
    loadStoryLikes();

    cancelAnimation();

    if (story.media_type === "image") {
      const startedAt = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startedAt;
        const nextProgress = Math.min(
          100,
          (elapsed / IMAGE_DURATION_MS) * 100
        );

        setProgress(nextProgress);

        if (nextProgress >= 100) {
          next();
          return;
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    }

    return cancelAnimation;
  }, [open, story?.id, storyIndex, groupIndex]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function recordView() {
    if (!story) return;

    if (!ownStory) {
      await supabase.from("story_views").upsert(
        {
          story_id: story.id,
          viewer_id: currentUserId,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "story_id,viewer_id" }
      );
    } else {
      const { count } = await supabase
        .from("story_views")
        .select("id", { count: "exact", head: true })
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
      rows.some((row: any) => row.user_id === currentUserId)
    );
  }

  async function toggleStoryLike() {
    if (!story || ownStory || likeBusy) return;

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
        setLikeCount((value) => Math.max(0, value - 1));
      } else {
        const { error } = await supabase
          .from("story_likes")
          .insert({
            story_id: story.id,
            user_id: currentUserId,
          });

        if (error) throw error;

        await supabase.from("notifications").insert({
          user_id: story.user_id,
          actor_id: currentUserId,
          type: "like",
          target_type: "story",
          target_id: story.id,
        });

        setLiked(true);
        setLikeCount((value) => value + 1);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo actualizar el me gusta.");
    } finally {
      setLikeBusy(false);
    }
  }

  async function sendStoryReply() {
    if (!story || ownStory || !reply.trim() || sendingReply) return;

    const content = reply.trim();
    setSendingReply(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: story.user_id,
        content,
        message_type: "story_reply",
        story_id: story.id,
        story_media_url: story.media_url,
      });

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: story.user_id,
        actor_id: currentUserId,
        type: "story_reply",
        target_type: "message",
        target_id: story.id,
      });

      setReply("");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo responder la historia.");
    } finally {
      setSendingReply(false);
    }
  }

  function cancelAnimation() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function next() {
    cancelAnimation();
    if (!group) return;

    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((value) => value + 1);
      return;
    }

    if (groupIndex < groups.length - 1) {
      setGroupIndex((value) => value + 1);
      setStoryIndex(0);
      return;
    }

    onClose();
  }

  function previous() {
    cancelAnimation();
    if (!group) return;

    if (storyIndex > 0) {
      setStoryIndex((value) => value - 1);
      return;
    }

    if (groupIndex > 0) {
      const previousGroup = groups[groupIndex - 1];
      setGroupIndex((value) => value - 1);
      setStoryIndex(Math.max(previousGroup.stories.length - 1, 0));
    }
  }

  async function deleteCurrentStory() {
    if (!story || !ownStory || deleting) return;

    const confirmed = confirm("¿Eliminar esta historia?");
    if (!confirmed) return;

    setDeleting(true);

    try {
      const { data: fullStory } = await supabase
        .from("stories")
        .select("media_path")
        .eq("id", story.id)
        .maybeSingle();

      const { error: deleteError } = await supabase
        .from("stories")
        .delete()
        .eq("id", story.id);

      if (deleteError) throw deleteError;

      if (fullStory?.media_path) {
        await supabase.storage
          .from("stories")
          .remove([fullStory.media_path]);
      }

      await onChanged?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo eliminar la historia.");
    } finally {
      setDeleting(false);
    }
  }

  const createdLabel = useMemo(() => {
    if (!story) return "";

    const minutes = Math.max(
      0,
      Math.floor(
        (Date.now() - new Date(story.created_at).getTime()) / 60000
      )
    );

    if (minutes < 1) return "ahora";
    if (minutes < 60) return `hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    return `hace ${hours} h`;
  }, [story?.created_at]);

  if (!open || !story || !group) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black">
      <div className="relative mx-auto flex h-dvh w-full max-w-[560px] items-center justify-center overflow-hidden bg-[#050506] sm:border-x sm:border-white/[0.08]">
        <div className="absolute left-3 right-3 top-3 z-30 rounded-full bg-black/25 px-2 py-2 backdrop-blur">
          <div className="flex gap-1">
            {group.stories.map((item, index) => (
              <div
                key={item.id}
                className="h-[4px] flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <div
                  className="h-full rounded-full bg-white transition-[width]"
                  style={{
                    width:
                      index < storyIndex
                        ? "100%"
                        : index === storyIndex
                          ? `${progress}%`
                          : "0%",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute left-4 right-4 top-8 z-30 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs font-black text-white ring-1 ring-white/20 shadow-[0_6px_18px_rgba(0,0,0,.22)]">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.username}
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              group.username?.charAt(0)?.toUpperCase() || "U"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">
              @{group.username}
            </p>
            <p className="text-[10px] text-white/55">{createdLabel}</p>
          </div>

          {ownStory && (
            <button
              type="button"
              onClick={deleteCurrentStory}
              disabled={deleting}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-white/70 shadow-[0_8px_24px_rgba(0,0,0,.26)] backdrop-blur transition hover:border-red-400/25 hover:text-red-300"
              aria-label="Eliminar historia"
            >
              <Trash2 size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-white/80 shadow-[0_8px_24px_rgba(0,0,0,.26)] backdrop-blur transition hover:border-white/20 hover:text-white"
            aria-label="Cerrar historia"
          >
            <X size={19} />
          </button>
        </div>

        <div className="absolute inset-x-0 top-0 z-20 h-36 bg-gradient-to-b from-black/65 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-20 h-44 bg-gradient-to-t from-black/70 to-transparent" />

        {story.media_type === "video" ? (
          <video
            ref={videoRef}
            key={story.id}
            src={story.media_url}
            autoPlay
            playsInline
            onLoadedMetadata={() => setProgress(0)}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (!video || !video.duration) return;
              setProgress((video.currentTime / video.duration) * 100);
            }}
            onEnded={next}
            className="h-full w-full object-contain"
          />
        ) : (
          <img
            key={story.id}
            src={story.media_url}
            alt={`Historia de @${group.username}`}
            className="h-full w-full object-contain"
            loading="eager"
          />
        )}

        <button
          type="button"
          onClick={previous}
          className="absolute inset-y-[90px] left-0 z-10 w-[31%]"
          aria-label="Historia anterior"
        />

        <button
          type="button"
          onClick={next}
          className="absolute inset-y-[90px] right-0 z-10 w-[31%]"
          aria-label="Historia siguiente"
        />

        <button
          type="button"
          onClick={previous}
          className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/12 bg-black/35 text-white/80 shadow-[0_12px_28px_rgba(0,0,0,.28)] backdrop-blur transition hover:scale-[1.02] hover:border-white/20 hover:text-white"
          aria-label="Anterior"
        >
          <ChevronLeft size={21} />
        </button>

        <button
          type="button"
          onClick={next}
          className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/12 bg-black/35 text-white/80 shadow-[0_12px_28px_rgba(0,0,0,.28)] backdrop-blur transition hover:scale-[1.02] hover:border-white/20 hover:text-white"
          aria-label="Siguiente"
        >
          <ChevronRight size={21} />
        </button>

        {ownStory ? (
          <div className="absolute bottom-5 left-5 z-30 flex items-center gap-2">
            {viewCount !== null && (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur">
                <Eye size={15} />
                {viewCount} {viewCount === 1 ? "vista" : "vistas"}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white/80 backdrop-blur">
              <Heart size={15} fill={likeCount > 0 ? "currentColor" : "none"} />
              {likeCount}
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center rounded-[18px] border border-white/15 bg-black/40 px-3 backdrop-blur-xl focus-within:border-white/30">
              <input
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendStoryReply();
                  }
                }}
                placeholder={`Responder a @${group.username}...`}
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45"
              />

              <button
                type="button"
                onClick={sendStoryReply}
                disabled={!reply.trim() || sendingReply}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                aria-label="Enviar respuesta"
              >
                <Send size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleStoryLike}
              disabled={likeBusy}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border backdrop-blur-xl transition ${
                liked
                  ? "border-red-400/20 bg-red-500/15 text-red-400"
                  : "border-white/15 bg-black/40 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              aria-label="Me gusta esta historia"
            >
              <Heart
                size={20}
                fill={liked ? "currentColor" : "none"}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
