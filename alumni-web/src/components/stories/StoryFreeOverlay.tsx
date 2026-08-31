"use client";

import {
  useRef,
  useState,
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

export type StoryTextColor =
  | "white"
  | "black"
  | "indigo"
  | "cyan"
  | "emerald"
  | "gold"
  | "rose";

export type StoryTextFill =
  | "none"
  | "black"
  | "white";

export type StoryMediaFilter =
  | "original"
  | "vivid"
  | "warm"
  | "cool"
  | "mono"
  | "fade";

export type StoryOverlayData = {
  version: 1;
  text?: {
    value: string;
    x: number;
    y: number;
    size?:
      | "small"
      | "medium"
      | "large";
    scale?: number;
    style?:
      | "clean"
      | "glass"
      | "accent";
    color?:
      | StoryTextColor;
    fill?:
      | StoryTextFill;
  };
  media_filter?:
    | StoryMediaFilter;
  shared_post?:
    | SharedPostStoryPayload
    | null;

  shared_post_transform?: {
    x: number;
    y: number;
    scale?: number;
  };

  /*
    Compatibilidad con Stories 2.0 ya publicadas.
    D.2 no crea enlaces nuevos ni los muestra.
  */
  link?: {
    url: string;
    label?: string | null;
  };
};

export const STORY_FILTER_CSS:
  Record<
    StoryMediaFilter,
    string
  > = {
    original: "none",
    vivid:
      "saturate(1.18) contrast(1.06)",
    warm:
      "saturate(1.08) sepia(.16) contrast(1.03)",
    cool:
      "saturate(1.05) hue-rotate(8deg) contrast(1.03)",
    mono:
      "grayscale(1) contrast(1.08)",
    fade:
      "saturate(.82) contrast(.92) brightness(1.06)",
  };

const TEXT_COLORS:
  Record<
    StoryTextColor,
    string
  > = {
    white: "#ffffff",
    black: "#090b10",
    indigo: "#aeb6ff",
    cyan: "#8be9ff",
    emerald: "#8cf2c6",
    gold: "#ffd782",
    rose: "#ff9fc2",
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

function TextContent({
  value,
  interactive,
  color,
}: {
  value: string;
  interactive: boolean;
  color: string;
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
                className="pointer-events-auto underline decoration-current/35 underline-offset-4"
                style={{
                  color,
                }}
              >
                {piece}
              </a>
            ) : (
              <span
                key={`${piece}-${index}`}
                className="opacity-95"
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

function distance(
  a: {
    x: number;
    y: number;
  },
  b: {
    x: number;
    y: number;
  }
) {
  return Math.hypot(
    b.x - a.x,
    b.y - a.y
  );
}

export default function StoryFreeOverlay({
  overlay,
  editable = false,
  onPositionChange,
  onScaleChange,
  onSharedPostPositionChange,
  onSharedPostScaleChange,
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
  onScaleChange?: (
    scale: number
  ) => void;
  onSharedPostPositionChange?: (
    position: {
      x: number;
      y: number;
    }
  ) => void;
  onSharedPostScaleChange?: (
    scale: number
  ) => void;
}) {
  const rootRef =
    useRef<HTMLDivElement>(
      null
    );

  const pointersRef =
    useRef(
      new Map<
        number,
        {
          x: number;
          y: number;
        }
      >()
    );

  const pinchRef =
    useRef<{
      distance: number;
      scale: number;
    } | null>(null);

  const dragOffsetRef =
    useRef<{
      x: number;
      y: number;
    } | null>(null);

  const sharedPointersRef =
    useRef(
      new Map<
        number,
        {
          x: number;
          y: number;
        }
      >()
    );

  const sharedPinchRef =
    useRef<{
      distance: number;
      scale: number;
    } | null>(null);

  const sharedDragOffsetRef =
    useRef<{
      x: number;
      y: number;
    } | null>(null);

  const [guides, setGuides] =
    useState({
      x: false,
      y: false,
    });

  if (!overlay) {
    return null;
  }

  const text =
    overlay.text;

  const sharedPost =
    overlay.shared_post;

  const sharedTransform =
    overlay.shared_post_transform || {
      x: 50,
      y: 70,
      scale: 1,
    };

  const sharedScale =
    clamp(
      Number(
        sharedTransform.scale || 1
      ),
      0.6,
      1.7
    );

  const scale =
    clamp(
      Number(
        text?.scale || 1
      ),
      0.55,
      2.2
    );

  const sizeBase =
    text?.size === "large"
      ? {
          min: 28,
          vw: 7,
          max: 44,
        }
      : text?.size === "small"
      ? {
          min: 16,
          vw: 4,
          max: 22,
        }
      : {
          min: 21,
          vw: 5.4,
          max: 32,
        };

  const fontSize =
    `clamp(${(
      sizeBase.min *
      scale
    ).toFixed(2)}px, ${(
      sizeBase.vw *
      scale
    ).toFixed(2)}vw, ${(
      sizeBase.max *
      scale
    ).toFixed(2)}px)`;

  const textColor =
    TEXT_COLORS[
      text?.color ||
        "white"
    ];

  const fill =
    text?.fill ||
    "none";

  const legacyStyle =
    text?.style;

  const fillClass =
    fill === "black"
      ? "rounded-[18px] bg-black/72 px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,.28)] backdrop-blur-lg"
      : fill === "white"
      ? "rounded-[18px] bg-white/92 px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,.22)] backdrop-blur-lg"
      : legacyStyle === "glass"
      ? "rounded-[18px] border border-white/15 bg-black/30 px-4 py-3 shadow-[0_16px_45px_rgba(0,0,0,.24)] backdrop-blur-xl"
      : legacyStyle === "accent"
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

    const offset =
      dragOffsetRef.current || {
        x: 0,
        y: 0,
      };

    const rawX =
      ((clientX -
        offset.x -
        rect.left) /
        rect.width) *
      100;

    const rawY =
      ((clientY -
        offset.y -
        rect.top) /
        rect.height) *
      100;

    const snapX =
      Math.abs(rawX - 50) <=
      2.2;

    const snapY =
      Math.abs(rawY - 50) <=
      1.5;

    setGuides({
      x: snapX,
      y: snapY,
    });

    onPositionChange({
      x: snapX
        ? 50
        : clamp(
            rawX,
            10,
            90
          ),
      y: snapY
        ? 50
        : clamp(
            rawY,
            12,
            82
          ),
    });
  }

  function rememberPointer(
    event:
      React.PointerEvent<HTMLDivElement>
  ) {
    pointersRef.current.set(
      event.pointerId,
      {
        x:
          event.clientX,
        y:
          event.clientY,
      }
    );
  }

  function releasePointer(
    pointerId: number
  ) {
    pointersRef.current.delete(
      pointerId
    );

    if (
      pointersRef.current
        .size < 2
    ) {
      pinchRef.current =
        null;
    }

    if (
      pointersRef.current
        .size === 0
    ) {
      dragOffsetRef.current =
        null;

      setGuides({
        x: false,
        y: false,
      });
    }
  }

  function rememberSharedPointer(
    event:
      React.PointerEvent<HTMLDivElement>
  ) {
    sharedPointersRef.current.set(
      event.pointerId,
      {
        x: event.clientX,
        y: event.clientY,
      }
    );
  }

  function releaseSharedPointer(
    pointerId: number
  ) {
    sharedPointersRef.current.delete(
      pointerId
    );

    if (
      sharedPointersRef.current
        .size < 2
    ) {
      sharedPinchRef.current =
        null;
    }

    if (
      sharedPointersRef.current
        .size === 0
    ) {
      sharedDragOffsetRef.current =
        null;

      setGuides({
        x: false,
        y: false,
      });
    }
  }

  function updateSharedPosition(
    clientX: number,
    clientY: number
  ) {
    const rect =
      rootRef.current
        ?.getBoundingClientRect();

    if (
      !rect ||
      !onSharedPostPositionChange
    ) {
      return;
    }

    const offset =
      sharedDragOffsetRef.current || {
        x: 0,
        y: 0,
      };

    const rawX =
      ((clientX -
        offset.x -
        rect.left) /
        rect.width) *
      100;

    const rawY =
      ((clientY -
        offset.y -
        rect.top) /
        rect.height) *
      100;

    const snapX =
      Math.abs(rawX - 50) <=
      2.2;

    const snapY =
      Math.abs(rawY - 50) <=
      1.5;

    setGuides({
      x: snapX,
      y: snapY,
    });

    onSharedPostPositionChange({
      x: snapX
        ? 50
        : clamp(rawX, 10, 90),
      y: snapY
        ? 50
        : clamp(rawY, 18, 82),
    });
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-[36]"
    >
      {editable && guides.x && (
        <div
          className="pointer-events-none absolute inset-y-[6%] left-1/2 z-[90] w-px -translate-x-1/2 bg-[#aeb6ff]/90 shadow-[0_0_12px_rgba(174,182,255,.8)]"
          aria-hidden="true"
        />
      )}

      {editable && guides.y && (
        <div
          className="pointer-events-none absolute inset-x-[6%] top-1/2 z-[90] h-px -translate-y-1/2 bg-[#aeb6ff]/90 shadow-[0_0_12px_rgba(174,182,255,.8)]"
          aria-hidden="true"
        />
      )}

      {sharedPost && (
        editable ? (
          <div
            className="pointer-events-auto absolute z-[45] w-[84%] cursor-grab touch-none select-none active:cursor-grabbing"
            style={{
              left:
                `${sharedTransform.x}%`,
              top:
                `${sharedTransform.y}%`,
              transform:
                `translate(-50%, -50%) scale(${sharedScale})`,
              transformOrigin:
                "center center",
            }}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();

              event.currentTarget.setPointerCapture(
                event.pointerId
              );

              const rect =
                rootRef.current
                  ?.getBoundingClientRect();

              if (
                rect &&
                sharedPointersRef.current.size === 0
              ) {
                const currentX =
                  rect.left +
                  (rect.width *
                    sharedTransform.x) /
                    100;

                const currentY =
                  rect.top +
                  (rect.height *
                    sharedTransform.y) /
                    100;

                sharedDragOffsetRef.current = {
                  x:
                    event.clientX -
                    currentX,
                  y:
                    event.clientY -
                    currentY,
                };
              }

              rememberSharedPointer(event);

              const values =
                Array.from(
                  sharedPointersRef.current.values()
                );

              if (
                values.length >= 2 &&
                onSharedPostScaleChange
              ) {
                sharedPinchRef.current = {
                  distance:
                    Math.max(
                      1,
                      distance(
                        values[0],
                        values[1]
                      )
                    ),
                  scale:
                    sharedScale,
                };

                setGuides({
                  x: false,
                  y: false,
                });
              }
            }}
            onPointerMove={(event) => {
              if (
                !sharedPointersRef.current.has(
                  event.pointerId
                )
              ) {
                return;
              }

              event.preventDefault();
              event.stopPropagation();

              rememberSharedPointer(event);

              const values =
                Array.from(
                  sharedPointersRef.current.values()
                );

              if (
                values.length >= 2 &&
                sharedPinchRef.current &&
                onSharedPostScaleChange
              ) {
                const nextDistance =
                  Math.max(
                    1,
                    distance(
                      values[0],
                      values[1]
                    )
                  );

                setGuides({
                  x: false,
                  y: false,
                });

                onSharedPostScaleChange(
                  clamp(
                    sharedPinchRef.current.scale *
                      (nextDistance /
                        sharedPinchRef.current.distance),
                    0.6,
                    1.7
                  )
                );

                return;
              }

              if (
                values.length === 1
              ) {
                updateSharedPosition(
                  event.clientX,
                  event.clientY
                );
              }
            }}
            onPointerUp={(event) => {
              releaseSharedPointer(
                event.pointerId
              );

              try {
                event.currentTarget.releasePointerCapture(
                  event.pointerId
                );
              } catch {}
            }}
            onPointerCancel={(event) => {
              releaseSharedPointer(
                event.pointerId
              );
            }}
          >
            <SharedPostCard
              post={sharedPost}
              interactive={false}
            />
          </div>
        ) : overlay.shared_post_transform ? (
          <a
            href={`/feed?post=${encodeURIComponent(
              String(sharedPost.id)
            )}`}
            onPointerDown={(event) =>
              event.stopPropagation()
            }
            onClick={(event) =>
              event.stopPropagation()
            }
            className="pointer-events-auto absolute z-[45] block w-[84%]"
            style={{
              left:
                `${sharedTransform.x}%`,
              top:
                `${sharedTransform.y}%`,
              transform:
                `translate(-50%, -50%) scale(${sharedScale})`,
              transformOrigin:
                "center center",
            }}
          >
            <SharedPostCard
              post={sharedPost}
              interactive
            />
          </a>
        ) : (
          <div className="absolute inset-x-[8%] bottom-[15%]">
            <a
              href={`/feed?post=${encodeURIComponent(
                String(sharedPost.id)
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
          </div>
        )
      )}

      {text?.value && (
        <div
          className={`absolute max-w-[84%] whitespace-pre-wrap text-center font-black leading-[1.04] tracking-[-0.045em] ${fillClass} ${
            editable
              ? "pointer-events-auto cursor-grab touch-none select-none active:cursor-grabbing"
              : ""
          }`}
          style={{
            left:
              `${text.x}%`,
            top:
              `${text.y}%`,
            transform:
              "translate(-50%, -50%)",
            fontSize,
            color:
              fill === "white" &&
              !text?.color
                ? "#090b10"
                : textColor,
          }}
          onPointerDown={
            editable
              ? (event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  event.currentTarget.setPointerCapture(
                    event.pointerId
                  );

                  const rect =
                    rootRef.current
                      ?.getBoundingClientRect();

                  if (
                    rect &&
                    pointersRef.current.size === 0
                  ) {
                    const currentX =
                      rect.left +
                      (rect.width *
                        Number(
                          text?.x || 50
                        )) /
                        100;

                    const currentY =
                      rect.top +
                      (rect.height *
                        Number(
                          text?.y || 38
                        )) /
                        100;

                    dragOffsetRef.current = {
                      x:
                        event.clientX -
                        currentX,
                      y:
                        event.clientY -
                        currentY,
                    };
                  }

                  rememberPointer(
                    event
                  );

                  const values =
                    Array.from(
                      pointersRef.current.values()
                    );

                  if (
                    values.length >=
                      2 &&
                    onScaleChange
                  ) {
                    pinchRef.current =
                      {
                        distance:
                          Math.max(
                            1,
                            distance(
                              values[0],
                              values[1]
                            )
                          ),
                        scale,
                      };
                  } else {
                    setGuides({
                      x: false,
                      y: false,
                    });
                  }
                }
              : undefined
          }
          onPointerMove={
            editable
              ? (event) => {
                  if (
                    !pointersRef.current.has(
                      event.pointerId
                    )
                  ) {
                    return;
                  }

                  event.preventDefault();
                  event.stopPropagation();

                  rememberPointer(
                    event
                  );

                  const values =
                    Array.from(
                      pointersRef.current.values()
                    );

                  if (
                    values.length >=
                      2 &&
                    pinchRef.current &&
                    onScaleChange
                  ) {
                    const nextDistance =
                      Math.max(
                        1,
                        distance(
                          values[0],
                          values[1]
                        )
                      );

                    setGuides({
                      x: false,
                      y: false,
                    });

                    onScaleChange(
                      clamp(
                        pinchRef.current.scale *
                          (nextDistance /
                            pinchRef.current.distance),
                        0.55,
                        2.2
                      )
                    );

                    return;
                  }

                  if (
                    values.length ===
                    1
                  ) {
                    updatePosition(
                      event.clientX,
                      event.clientY
                    );
                  }
                }
              : undefined
          }
          onPointerUp={
            editable
              ? (event) => {
                  releasePointer(
                    event.pointerId
                  );

                  try {
                    event.currentTarget.releasePointerCapture(
                      event.pointerId
                    );
                  } catch {}
                }
              : undefined
          }
          onPointerCancel={
            editable
              ? (event) => {
                  releasePointer(
                    event.pointerId
                  );
                }
              : undefined
          }
        >
          <TextContent
            value={text.value}
            interactive={
              !editable
            }
            color={
              fill ===
                "white" &&
              !text?.color
                ? "#090b10"
                : textColor
            }
          />
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

/* ALUMNI_3_4_0_STORY_STUDIO_GESTURES_GUIDES */
