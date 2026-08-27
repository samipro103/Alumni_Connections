"use client";

import {
  Heart,
  MessageCircle,
  Repeat2,
  ArrowUpRight,
} from "lucide-react";
import { useMemo } from "react";

export default function ExplorePostCard({
  post,
  onOpen,
  compact = false,
}: {
  post: any;
  onOpen?: () => void;
  compact?: boolean;
}) {
  const tags = useMemo(
    () =>
      String(post.content || "")
        .match(/#[A-Za-z0-9_]{2,40}/g)
        ?.slice(0, 5) || [],
    [post.content]
  );

  const media =
    post.mediaItems?.[0] || null;

  const imageUrl =
    media?.media_type === "image"
      ? media.media_url
      : post.image_url;

  const short =
    String(post.content || "").length > (compact ? 180 : 420)
      ? `${String(post.content || "")
          .slice(0, compact ? 180 : 420)
          .trim()}…`
      : String(post.content || "");

  return (
    <article className="alumni-explore-post">
      <div className="flex items-center gap-3">
        <a
          href={`/u/${post.profiles?.username}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--app-soft-strong)] text-[12px] font-black text-[var(--app-text)]"
        >
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            post.profiles?.username?.charAt(0)?.toUpperCase() || "A"
          )}
        </a>

        <div className="min-w-0 flex-1">
          <a
            href={`/u/${post.profiles?.username}`}
            className="truncate text-[14px] font-black text-[var(--app-text)] hover:underline"
          >
            @{post.profiles?.username || "alumni"}
          </a>
          <p className="mt-0.5 truncate text-[12px] text-[var(--app-muted-2)]">
            {[post.profiles?.career, post.profiles?.education_institution_name || post.profiles?.university]
              .filter(Boolean)
              .join(" · ") || "Comunidad Alumni"}
          </p>
        </div>

        <a
          href={`/feed?post=${post.id}`}
          onClick={onOpen}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Abrir publicación"
        >
          <ArrowUpRight size={17} />
        </a>
      </div>

      {short && (
        <p className="mt-3 whitespace-pre-wrap text-[14px] leading-6 text-[var(--app-text-soft)]">
          {short}
        </p>
      )}

      {imageUrl && (
        <a
          href={`/feed?post=${post.id}`}
          onClick={onOpen}
          className="mt-3 block overflow-hidden bg-[#05070b]"
        >
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className={`w-full object-contain ${compact ? "max-h-[320px]" : "max-h-[520px]"}`}
          />
        </a>
      )}

      {media?.media_type === "video" && media.media_url && (
        <a
          href={`/feed?post=${post.id}`}
          onClick={onOpen}
          className="mt-3 block overflow-hidden bg-[#05070b]"
        >
          <video
            src={media.media_url}
            muted
            playsInline
            preload="metadata"
            className={`w-full object-contain ${compact ? "max-h-[320px]" : "max-h-[520px]"}`}
          />
        </a>
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <a
              key={tag.toLowerCase()}
              href={`/explore/tag/${encodeURIComponent(tag.slice(1).toLowerCase())}`}
              className="text-[12px] font-bold text-[var(--app-accent)] hover:underline"
            >
              {tag}
            </a>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-5 border-t border-[var(--app-border)] pt-3 font-mono text-[12px] font-semibold text-[var(--app-muted-2)]">
        <span className="inline-flex items-center gap-1.5">
          <Heart size={15} />
          {post.likesCount ?? post.likes?.length ?? 0}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle size={15} />
          {post.commentsCount ?? 0}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Repeat2 size={15} />
          {post.repostsCount ?? 0}
        </span>
      </div>
    </article>
  );
}

/* ALUMNI_1_6_0_EXPLORE_POST_CARD */
