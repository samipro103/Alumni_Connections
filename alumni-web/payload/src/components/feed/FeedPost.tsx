"use client";

import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import LinkPreviewCard from "@/components/feed/LinkPreviewCard";
import type { PostMediaItem } from "@/lib/feedMedia";

function compactRepeatedLines(text: string) {
  const lines = text.split(/\r?\n/);
  const seenUrls = new Set<string>();
  const output: string[] = [];
  let repeated = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const isUrl = /^https?:\/\/\S+$/i.test(trimmed);

    if (isUrl && seenUrls.has(trimmed)) {
      repeated += 1;
      continue;
    }

    if (isUrl) {
      seenUrls.add(trimmed);
    }

    output.push(line);
  }

  return {
    text: output.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    repeated,
  };
}

function firstUrl(text: string) {
  return text.match(/https?:\/\/[^\s<>"']+/i)?.[0] || "";
}

function FeedVideo({
  item,
  active,
  onOpen,
}: {
  item: PostMediaItem;
  active: boolean;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (active) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.58) {
          video.pause();
          return;
        }

        if (active) {
          void video.play().catch(() => {});
        }
      },
      {
        threshold: [0, 0.58, 0.9],
      }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, [active]);

  return (
    <div className="alumni-feed-video-wrap">
      <video
        ref={ref}
        src={item.media_url || ""}
        playsInline
        muted={muted}
        preload="metadata"
        className="alumni-feed-video"
        onClick={() => {
          const video = ref.current;
          if (!video) return;

          if (video.paused) {
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }}
        onDoubleClick={onOpen}
      />

      <button
        type="button"
        className="alumni-feed-video-mute"
        onClick={(event) => {
          event.stopPropagation();
          setMuted((value) => !value);
        }}
        aria-label={muted ? "Activar sonido" : "Silenciar"}
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}

export default function FeedPost({
  post,
  postIndex,
  currentUserId,
  onLike,
  onRepost,
  onShare,
  onStory,
  onSave,
  onDelete,
  onReport,
  onCopyLink,
  onOpenComments,
  onOpenEngagement,
  onOpenMedia,
}: {
  post: any;
  postIndex: number;
  currentUserId?: string | null;
  onLike: () => void;
  onRepost: () => void;
  onShare: () => void;
  onStory: () => void;
  onSave: () => void;
  onDelete: () => void;
  onReport: () => void;
  onCopyLink: () => void;
  onOpenComments: () => void;
  onOpenEngagement: (mode: "likes" | "reposts") => void;
  onOpenMedia: (item: PostMediaItem) => void;
}) {
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [heartBurst, setHeartBurst] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<number | null>(null);

  const ownPost = post.user_id === currentUserId;

  const media: PostMediaItem[] = post.mediaItems || [];

  const compacted = useMemo(
    () => compactRepeatedLines(post.content || ""),
    [post.content]
  );

  const previewUrl = useMemo(
    () => firstUrl(post.content || ""),
    [post.content]
  );

  const longCaption =
    compacted.text.length > 300 ||
    compacted.text.split("\n").length > 4;

  useEffect(() => {
    if (!menuOpen) return;

    function close(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(`[data-feed-menu="${post.id}"]`)
      ) {
        return;
      }

      setMenuOpen(false);
    }

    document.addEventListener("pointerdown", close);

    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [menuOpen, post.id]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  function burstLike() {
    setHeartBurst(false);
    requestAnimationFrame(() => {
      setHeartBurst(true);
      window.setTimeout(() => setHeartBurst(false), 720);
    });

    if (!post.liked) {
      onLike();
    }
  }

  function handleImagePointer(item: PostMediaItem) {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    lastTapRef.current = now;

    if (delta > 0 && delta < 300) {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      burstLike();
      return;
    }

    singleTapTimerRef.current = window.setTimeout(() => {
      singleTapTimerRef.current = null;
      onOpenMedia(item);
    }, 240);
  }

  function syncCarouselIndex() {
    const node = carouselRef.current;
    if (!node || !node.clientWidth) return;

    const next = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.max(0, Math.min(media.length - 1, next)));
  }

  function goToMedia(index: number) {
    const node = carouselRef.current;
    if (!node) return;

    node.scrollTo({
      left: node.clientWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }

  const latestComment =
    post.comments?.[post.comments.length - 1] || null;

  const showRepostLabel =
    post.latestRepostProfile &&
    post.latestRepostAt &&
    new Date(post.latestRepostAt).getTime() >
      new Date(post.created_at).getTime();

  function renderMenu() {
    return (
      <div
        className="alumni-pro-post-menu-zone"
        data-feed-menu={post.id}
      >
        <button
          type="button"
          className="alumni-pro-menu-trigger"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Más opciones"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal size={21} />
        </button>

        {menuOpen && (
          <div className="alumni-pro-menu-popover">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onSave();
              }}
            >
              {post.saved ? <Check size={17} /> : <Bookmark size={17} />}
              {post.saved ? "Guardado" : "Guardar publicación"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onCopyLink();
              }}
            >
              <Copy size={17} />
              Copiar enlace
            </button>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onStory();
              }}
            >
              <Sparkles size={17} />
              Compartir en historia
            </button>

            {ownPost ? (
              <button
                type="button"
                data-danger="true"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                <Trash2 size={17} />
                Eliminar publicación
              </button>
            ) : (
              <button
                type="button"
                data-danger="true"
                onClick={() => {
                  setMenuOpen(false);
                  onReport();
                }}
              >
                <Flag size={17} />
                Reportar publicación
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <article
      id={`post-${post.id}`}
      className="alumni-pro-post"
    >
      {showRepostLabel && (
        <div className="alumni-pro-repost-label">
          <Repeat2 size={14} />
          <a href={`/u/${post.latestRepostProfile.username}`}>
            @{post.latestRepostProfile.username}
          </a>
          <span>compartió</span>
        </div>
      )}

      <header className="alumni-pro-post-header">
        <a
          href={`/u/${post.profiles?.username}`}
          className="alumni-pro-avatar"
        >
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt=""
            />
          ) : (
            post.profiles?.username?.charAt(0)?.toUpperCase() || "A"
          )}
        </a>

        <div className="alumni-pro-author">
          <div>
            <a href={`/u/${post.profiles?.username}`}>
              @{post.profiles?.username || "alumni"}
            </a>
            <span>·</span>
            <time>
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </time>
          </div>

          <p>
            {[post.profiles?.career, post.profiles?.university]
              .filter(Boolean)
              .join(" · ") || "Comunidad Alumni"}
          </p>
        </div>

        {!media.length && renderMenu()}
      </header>

      {compacted.text && (
        <div className="alumni-pro-caption-wrap">
          <p
            className={`alumni-pro-caption ${
              !captionExpanded && longCaption ? "is-clamped" : ""
            }`}
          >
            {compacted.text}
          </p>

          {longCaption && (
            <button
              type="button"
              className="alumni-pro-caption-more"
              onClick={() =>
                setCaptionExpanded((value) => !value)
              }
            >
              {captionExpanded ? "menos" : "más"}
            </button>
          )}

          {compacted.repeated > 0 && (
            <span className="alumni-pro-repeated-links">
              +{compacted.repeated}{" "}
              {compacted.repeated === 1
                ? "enlace repetido"
                : "enlaces repetidos"}
            </span>
          )}
        </div>
      )}

      {previewUrl && (
        <LinkPreviewCard url={previewUrl} />
      )}

      {media.length > 0 && (
        <div className="alumni-pro-media-shell">
          <div
            ref={carouselRef}
            className="alumni-pro-carousel"
            onScroll={syncCarouselIndex}
          >
            {media.map((item, index) => (
              <div
                key={item.id || `${post.id}-${index}`}
                className="alumni-pro-media-slide"
              >
                {item.media_type === "video" ? (
                  <FeedVideo
                    item={item}
                    active={activeIndex === index}
                    onOpen={() => onOpenMedia(item)}
                  />
                ) : (
                  <button
                    type="button"
                    className="alumni-pro-image-button"
                    onPointerUp={() => handleImagePointer(item)}
                    aria-label="Abrir fotografía"
                  >
                    <img
                      src={item.media_url || ""}
                      alt="Publicación"
                      loading={postIndex < 2 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={postIndex === 0 ? "high" : "auto"}
                      draggable={false}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="alumni-pro-media-menu">
            {renderMenu()}
          </div>

          {media.length > 1 && (
            <>
              <span className="alumni-pro-carousel-count">
                {activeIndex + 1}/{media.length}
              </span>

              <div className="alumni-pro-carousel-dots">
                {media.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={
                      activeIndex === index ? "is-active" : ""
                    }
                    onClick={() => goToMedia(index)}
                    aria-label={`Ir al medio ${index + 1}`}
                  />
                ))}
              </div>

              <button
                type="button"
                className="alumni-pro-carousel-arrow is-left"
                disabled={activeIndex === 0}
                onClick={() => goToMedia(activeIndex - 1)}
                aria-label="Anterior"
              >
                <ChevronLeft size={19} />
              </button>

              <button
                type="button"
                className="alumni-pro-carousel-arrow is-right"
                disabled={activeIndex === media.length - 1}
                onClick={() => goToMedia(activeIndex + 1)}
                aria-label="Siguiente"
              >
                <ChevronRight size={19} />
              </button>
            </>
          )}

          {heartBurst && (
            <div className="alumni-pro-heart-burst">
              <Heart fill="currentColor" />
            </div>
          )}
        </div>
      )}

      <div className="alumni-pro-actions">
        <button
          type="button"
          data-active={post.liked ? "true" : "false"}
          className="is-like"
          onClick={onLike}
          aria-label={post.liked ? "Quitar Me gusta" : "Me gusta"}
        >
          <Heart
            size={24}
            fill={post.liked ? "currentColor" : "none"}
          />
        </button>

        <button
          type="button"
          onClick={onOpenComments}
          aria-label="Comentarios"
        >
          <MessageCircle size={24} />
        </button>

        <button
          type="button"
          className="is-repost"
          data-active={post.reposted ? "true" : "false"}
          disabled={ownPost}
          onClick={onRepost}
          aria-label="Repost"
        >
          <Repeat2 size={25} />
        </button>

        <button
          type="button"
          onClick={onShare}
          aria-label="Compartir"
        >
          <Share2 size={24} />
        </button>
      </div>

      {(post.likesCount > 0 ||
        post.comments?.length > 0 ||
        post.repostsCount > 0) && (
        <div className="alumni-pro-stats">
          {post.likesCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenEngagement("likes")}
            >
              <strong>{post.likesCount}</strong> me gusta
            </button>
          )}

          <span />

          {post.comments?.length > 0 && (
            <button
              type="button"
              onClick={onOpenComments}
            >
              {post.comments.length}{" "}
              {post.comments.length === 1
                ? "comentario"
                : "comentarios"}
            </button>
          )}

          {post.repostsCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenEngagement("reposts")}
            >
              {post.repostsCount}{" "}
              {post.repostsCount === 1
                ? "compartido"
                : "compartidos"}
            </button>
          )}
        </div>
      )}

      {latestComment && (
        <button
          type="button"
          className="alumni-pro-comment-preview"
          onClick={onOpenComments}
        >
          <strong>
            @{latestComment.profile?.username || "usuario"}
          </strong>
          <span>{latestComment.content}</span>
        </button>
      )}

      {(post.comments?.length || 0) > 1 && (
        <button
          type="button"
          className="alumni-pro-view-comments"
          onClick={onOpenComments}
        >
          Ver los {post.comments.length} comentarios
        </button>
      )}
    </article>
  );
}

/* ALUMNI_1_4_0_FEED_POST */
