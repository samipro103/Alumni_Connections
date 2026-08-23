"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  commentId: number;
  commentOwnerId: string;
  currentUserId?: string | null;
};

export default function CommentLikeButton({
  commentId,
  commentOwnerId,
  currentUserId,
}: Props) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadState();
  }, [commentId, currentUserId]);

  async function loadState() {
    const { data, error } = await supabase
      .from("comment_likes")
      .select("user_id")
      .eq("comment_id", commentId);

    if (error) {
      console.error(error);
      return;
    }

    const rows = data || [];
    setCount(rows.length);
    setLiked(
      Boolean(
        currentUserId &&
          rows.some((row: any) => row.user_id === currentUserId)
      )
    );
  }

  async function toggleLike() {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      if (liked) {
        const { error } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", currentUserId);

        if (error) throw error;

        if (commentOwnerId !== currentUserId) {
          await supabase
            .from("notifications")
            .delete()
            .eq("user_id", commentOwnerId)
            .eq("actor_id", currentUserId)
            .eq("type", "like")
            .eq("target_type", "comment")
            .eq("target_id", String(commentId));
        }

        setLiked(false);
        setCount((value) => Math.max(0, value - 1));
      } else {
        const { error } = await supabase
          .from("comment_likes")
          .insert({
            comment_id: commentId,
            user_id: currentUserId,
          });

        if (error) throw error;

        if (commentOwnerId !== currentUserId) {
          await supabase.from("notifications").insert({
            user_id: commentOwnerId,
            actor_id: currentUserId,
            type: "like",
            target_type: "comment",
            target_id: String(commentId),
          });
        }

        setLiked(true);
        setCount((value) => value + 1);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo actualizar el me gusta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={busy}
      className={`mt-2 flex h-7 items-center gap-1.5 rounded-lg px-2 text-[11px] font-bold transition ${
        liked
          ? "bg-red-500/10 text-red-400"
          : "text-zinc-700 hover:bg-white/[0.04] hover:text-zinc-400"
      }`}
      aria-label="Me gusta este comentario"
    >
      <Heart
        size={13}
        fill={liked ? "currentColor" : "none"}
      />
      {count > 0 ? count : "Me gusta"}
    </button>
  );
}
