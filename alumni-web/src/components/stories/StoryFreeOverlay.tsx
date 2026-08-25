"use client";

import {
  useRef,
} from "react";
import {
  ArrowUpRight,
} from "lucide-react";

export type SharedPostStoryPayload = {
  id: string | number;
  username: string;
  avatar_url?: string | null;
  content?: string | null;
  image_url?: string | null;
};

export type StoryOverlayData = {
  version: 1;
  text?: {
    value: string;
    x: number;
    y: number;
    size:
      | "small"
      | "medium"
      | "large";
    style:
      | "clean"
      | "glass"
      | "accent";
  };
  link?: {
    url: string;
    label?: string | null;
  };
  shared_post?:
    | SharedPostStoryPayload
    | null;
};

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function normalizeExternalUrl(
  value: string
) {
  const trimmed =
    value.trim();

  if (!trimmed) return "";

  return /^https?:\/\//i.test(
    trimmed
  )
    ? trimmed
    : `https://${trimmed}`;
}

function TextContent({
  value,
  interactive,
}: {
  value: string;
  interactive: boolean;
}) {
  const pieces =
    value.split(
      /(@[a-zA-Z0-9._-]+)/g
    );

  return (
    <>
      {pieces.map(
        (piece, index) => {
          if (
            /^@[a-zA-Z0-9._-]+$/.test(
              piece
            )
          ) {
            const username =
              piece.slice(1);

            return interactive ? (
              <a
                key={`${piece}-${index}`}
                href={`/u/${encodeURIComponent(
                  username
                )}`}
                onPointerDown={(event) =>
                  event.stopPropagation()
                }
                onClick={(event) =>
                  event.stopPropagation()
                }
                className="pointer-events-auto text-[#aeb6ff] underline decoration-[#8d98ff]/35 underline-offset-4"
              >
                {piece}
              </a>
            ) : (
              <span
                key={`${piece}-${index}`}
                className="text-[#aeb6ff]"
              >
                {piece}
              </span>
            );
          }

          return (
            <span
              key={`${piece}-${index}`}
            >
              {piece}
            </span>
          );
        }
      )}
    </>
  );
}

export default function StoryFreeOverlay({
  overlay,
  editable = false,
  onPositionChange,
}: {
  overlay?:
    | StoryOverlayData
    | null;
  editable?: boolean;
  onPositionChange?: (
    position: {
      x: number;
      y: number;
    }
  ) => void;
}) {
  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const dragRef =
    useRef<{
      pointerId: number;
    } | null>(null);

  if (!overlay) {
    return null;
  }

  const text =
    overlay.text;

  const sharedPost =
    overlay.shared_post;

  const link =
    overlay.link;

  const textSize =
    text?.size === "large"
      ? "text-[clamp(28px,7vw,44px)]"
      : text?.size === "small"
      ? "text-[clamp(16px,4vw,22px)]"
      : "text-[clamp(21px,5.4vw,32px)]";

  const textStyle =
    text?.style === "glass"
      ? "rounded-[18px] border border-white/15 bg-black/30 px-4 py-3 shadow-[0_16px_45px_rgba(0,0,0,.24)] backdrop-blur-xl"
      : text?.style === "accent"
      ? "rounded-[18px] border border-[#8d98ff]/30 bg-[#6d7cff]/20 px-4 py-3 shadow-[0_16px_45px_rgba(0,0,0,.20)] backdrop-blur-xl"
      : "drop-shadow-[0_4px_20px_rgba(0,0,0,.62)]";

  function updatePosition(
    clientX: number,
    clientY: number
  ) {
    const rect =
      rootRef.current
        ?.getBoundingClientRect();

    if (
      !rect ||
      !onPositionChange
    ) {
      return;
    }

    onPositionChange({
      x: clamp(
        ((clientX -
          rect.left) /
          rect.width) *
          100,
        10,
        90
      ),
      y: clamp(
        ((clientY -
          rect.top) /
          rect.height) *
          100,
        15,
        76
      ),
    });
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[36]"
    >
      {sharedPost && (
        <div className="absolute inset-x-[8%] bottom-[15%]">
          {editable ? (
            <SharedPostCard
              post={sharedPost}
              interactive={false}
            />
          ) : (
            <a
              href={`/feed?post=${encodeURIComponent(
                String(
                  sharedPost.id
                )
              )}`}
              onPointerDown={(event) =>
                event.stopPropagation()
              }
              onClick={(event) =>
                event.stopPropagation()
              }
              className="pointer-events-auto block"
            >
              <SharedPostCard
                post={sharedPost}
                interactive
              />
            </a>
          )}
        </div>
      )}

      {text?.value && (
        <div
          className={`absolute max-w-[82%] whitespace-pre-wrap text-center font-black leading-[1.04] tracking-[-0.045em] text-white ${textSize} ${textStyle} ${
            editable
              ? "pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
              : ""
          }`}
          style={{
            left: `${text.x}%`,
            top: `${text.y}%`,
            transform:
              "translate(-50%, -50%)",
          }}
          onPointerDown={
            editable
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  dragRef.current = {
                    pointerId:
                      event.pointerId,
                  };

                  event.currentTarget.setPointerCapture(
                    event.pointerId
                  );

                  updatePosition(
                    event.clientX,
                    event.clientY
                  );
                }
              : undefined
          }
          onPointerMove={
            editable
              ? (event) => {
                  if (
                    dragRef.current
                      ?.pointerId !==
                    event.pointerId
                  ) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();

                  updatePosition(
                    event.clientX,
                    event.clientY
                  );
                }
              : undefined
          }
          onPointerUp={
            editable
              ? (event) => {
                  if (
                    dragRef.current
                      ?.pointerId ===
                    event.pointerId
                  ) {
                    dragRef.current =
                      null;

                    event.currentTarget.releasePointerCapture(
                      event.pointerId
                    );
                  }
                }
              : undefined
          }
        >
          <TextContent
            value={text.value}
            interactive={
              !editable
            }
          />
        </div>
      )}

      {link?.url && (
        <div className="absolute inset-x-0 bottom-[7.2%] flex justify-center px-6">
          <a
            href={normalizeExternalUrl(
              link.url
            )}
            target="_blank"
            rel="noreferrer"
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-black/38 px-4 text-[10px] font-black uppercase tracking-[0.11em] text-white/90 backdrop-blur-xl ${
              editable
                ? "pointer-events-none"
                : "pointer-events-auto"
            }`}
          >
            {link.label ||
              "Abrir enlace"}

            <ArrowUpRight
              size={13}
            />
          </a>
        </div>
      )}
    </div>
  );
}

function SharedPostCard({
  post,
  interactive,
}: {
  post: SharedPostStoryPayload;
  interactive: boolean;
}) {
  const content =
    String(
      post.content || ""
    ).trim();

  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-white/14 bg-[#10141d]/88 shadow-[0_22px_70px_rgba(0,0,0,.44)] backdrop-blur-2xl ${
        interactive
          ? "transition active:scale-[0.985]"
          : ""
      }`}
    >
      {post.image_url && (
        <div className="relative aspect-[16/9] overflow-hidden bg-black/30">
          <img
            src={
              post.image_url
            }
            alt=""
            loading="eager"
            decoding="async"
            fetchPriority="high"
            draggable={false}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-[10px] font-black text-white">
            {post.avatar_url ? (
              <img
                src={
                  post.avatar_url
                }
                alt=""
                loading="eager"
                decoding="async"
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              post.username
                ?.charAt(0)
                ?.toUpperCase() ||
              "A"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-black text-white">
              @
              {
                post.username
              }
            </p>

            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/35">
              Publicación Alumni
            </p>
          </div>

          <ArrowUpRight
            size={14}
            className="text-white/45"
          />
        </div>

        {content && (
          <p className="mt-3 line-clamp-3 text-[12px] font-semibold leading-5 text-white/72">
            {content}
          </p>
        )}
      </div>
    </div>
  );
}
