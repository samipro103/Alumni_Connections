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
import { AlumniAvatar } from "@/components/ui/AlumniImage";
import type { PostMediaItem } from "@/lib/feedMedia";
import { toPublicImageCdnUrl } from "@/lib/imageCdn";

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

function isFourFive(item: PostMediaItem) {
  const width = Number(item.width || 0);
  const height = Number(item.height || 0);

  if (!width || !height) return false;

  return Math.abs(width / height - 4 / 5) <= 0.025;
}

function FeedImage({
  item,
  postIndex,
  mediaIndex,
  shouldLoad,
  active,
  onPointerUp,
}: {
  item: PostMediaItem;
  postIndex: number;
  mediaIndex: number;
  shouldLoad: boolean;
  active: boolean;
  onPointerUp: () => void;
}) {
  const src =
    shouldLoad
      ? toPublicImageCdnUrl(
          item.media_url || ""
        )
      : "";
  const contain = !isFourFive(item);
  const [loaded, setLoaded] =
    useState(!shouldLoad || !src);

  useEffect(() => {
    setLoaded(
      !shouldLoad || !src
    );
  }, [shouldLoad, src]);

  return (
    <button
      type="button"
      className="alumni-pro-image-button alumni-feed-media-loadable"
      data-fit={contain ? "contain" : "cover"}
      data-loaded={loaded ? "true" : "false"}
      onPointerUp={onPointerUp}
      aria-label="Abrir fotografía"
      aria-busy={!loaded}
    >
      {contain && src && (
        <img
          className="alumni-feed-image-backdrop"
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      )}

      {src && (
        <img
          className="alumni-feed-image-main"
          src={src}
          alt="Publicación"
          loading={
            postIndex === 0 &&
            mediaIndex === 0 &&
            active
              ? "eager"
              : "lazy"
          }
          decoding="async"
          fetchPriority={
            postIndex === 0 &&
            mediaIndex === 0 &&
            active
              ? "high"
              : "auto"
          }
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </button>
  );
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
  const src = item.media_url || "";
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(!src);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    setReady(!src);
  }, [src]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (active && inView) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [active, inView]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(
          Boolean(
            entry?.isIntersecting &&
              entry.intersectionRatio >= 0.58
          )
        );
      },
      {
        threshold: [0, 0.58, 0.9],
      }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="alumni-feed-video-wrap alumni-feed-media-loadable"
      data-loaded={ready ? "true" : "false"}
      aria-busy={!ready}
    >
      <video
        ref={ref}
        src={src}
        playsInline
        muted={muted}
        preload="metadata"
        className="alumni-feed-video"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onError={() => setReady(true)}
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
  const [
    requestedImageIndexes,
    setRequestedImageIndexes,
  ] = useState<number[]>([0, 1]);
  const [carouselMoving, setCarouselMoving] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselTimerRef = useRef<number | null>(null);
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
    setActiveIndex((current) =>
      Math.max(0, Math.min(Math.max(0, media.length - 1), current))
    );
  }, [media.length]);

  useEffect(() => {
    setRequestedImageIndexes(
      (current) => {
        const next =
          new Set(
            current.filter(
              (index) =>
                index >= 0 &&
                index < media.length
            )
          );

        if (
          activeIndex >= 0 &&
          activeIndex < media.length
        ) {
          next.add(activeIndex);
        }

        if (
          activeIndex + 1 <
          media.length
        ) {
          next.add(
            activeIndex + 1
          );
        }

        return Array.from(next);
      }
    );
  }, [activeIndex, media.length]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current !== null) {
        window.clearTimeout(singleTapTimerRef.current);
      }

      if (carouselTimerRef.current !== null) {
        window.clearTimeout(carouselTimerRef.current);
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

  function markCarouselMoving() {
    setCarouselMoving(true);

    if (carouselTimerRef.current !== null) {
      window.clearTimeout(carouselTimerRef.current);
    }

    carouselTimerRef.current = window.setTimeout(() => {
      setCarouselMoving(false);
      carouselTimerRef.current = null;
    }, 140);
  }

  function syncCarouselIndex() {
    const node = carouselRef.current;
    if (!node || !node.clientWidth) return;

    markCarouselMoving();

    const next = Math.round(node.scrollLeft / node.clientWidth);
    setActiveIndex(Math.max(0, Math.min(media.length - 1, next)));
  }

  function goToMedia(index: number) {
    const node = carouselRef.current;
    if (!node) return;

    markCarouselMoving();
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
          <AlumniAvatar
            src={post.profiles?.avatar_url}
            name={post.profiles?.username}
            alt=""
            className="h-full w-full"
            imageClassName="h-full w-full object-cover"
            priority={postIndex < 2}
          />
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
                    active={!carouselMoving && activeIndex === index}
                    onOpen={() => onOpenMedia(item)}
                  />
                ) : (
                  <FeedImage
                    item={item}
                    postIndex={postIndex}
                    mediaIndex={index}
                    shouldLoad={
                      requestedImageIndexes.includes(
                        index
                      )
                    }
                    active={
                      activeIndex === index
                    }
                    onPointerUp={() => handleImagePointer(item)}
                  />
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
              <strong>{post.likesCount}</strong>{" "}
              {post.likesCount === 1
                ? "persona"
                : "personas"}
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
                ? "respuesta"
                : "respuestas"}
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
          Abrir conversación · {post.comments.length}
        </button>
      )}
    </article>
  );
}

/* ALUMNI_2_5_0_FEED_POST */

/* ALUMNI_2_9_0_IMAGE_LAYER:FEED_POST */

/* ALUMNI_2_9_2_PUBLIC_IMAGE_CDN:FEED_POST */

/* ALUMNI_2_9_3_FEED_MEDIA_DEFER */
