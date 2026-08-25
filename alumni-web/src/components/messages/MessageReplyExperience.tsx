"use client";

import {
  Reply,
  X,
} from "lucide-react";
import {
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

const SWIPE_TRIGGER = 56;
const SWIPE_MAX = 82;

function messageSummary(
  message: any
) {
  if (!message) {
    return "Mensaje";
  }

  if (
    message.content &&
    String(message.content).trim()
  ) {
    return String(
      message.content
    ).trim();
  }

  if (
    message.media_type === "image"
  ) {
    return "📷 Foto";
  }

  if (
    message.media_type === "video"
  ) {
    return "🎥 Video";
  }

  if (
    message.message_type ===
    "story_reply"
  ) {
    return "Respuesta a historia";
  }

  return (
    message.media_name ||
    "Mensaje"
  );
}

export function SwipeToReply({
  children,
  onReply,
}: {
  children: ReactNode;
  onReply: () => void;
}) {
  const [offset, setOffset] =
    useState(0);
  const [dragging, setDragging] =
    useState(false);

  const startRef =
    useRef<{
      x: number;
      y: number;
      pointerId: number;
    } | null>(null);

  const axisRef =
    useRef<
      "x" | "y" | "blocked" | null
    >(null);

  const armedRef =
    useRef(false);

  const suppressClickRef =
    useRef(false);

  function reset() {
    setOffset(0);
    setDragging(false);
    startRef.current = null;
    axisRef.current = null;
    armedRef.current = false;
  }

  function interactiveTarget(
    target: EventTarget | null
  ) {
    const element =
      target instanceof Element
        ? target
        : null;

    return Boolean(
      element?.closest(
        "button,input,textarea,select,video,audio"
      )
    );
  }

  function onPointerDown(
    event: PointerEvent<HTMLDivElement>
  ) {
    if (
      !event.isPrimary ||
      (event.pointerType ===
        "mouse" &&
        event.button !== 0) ||
      interactiveTarget(
        event.target
      )
    ) {
      return;
    }

    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId:
        event.pointerId,
    };

    axisRef.current = null;
    armedRef.current = false;
  }

  function onPointerMove(
    event: PointerEvent<HTMLDivElement>
  ) {
    const start =
      startRef.current;

    if (
      !start ||
      start.pointerId !==
        event.pointerId
    ) {
      return;
    }

    const dx =
      event.clientX -
      start.x;
    const dy =
      event.clientY -
      start.y;

    const absX =
      Math.abs(dx);
    const absY =
      Math.abs(dy);

    if (
      axisRef.current ===
        null &&
      Math.max(
        absX,
        absY
      ) >= 7
    ) {
      if (
        dx > 0 &&
        absX >
          absY * 1.15
      ) {
        axisRef.current =
          "x";

        try {
          event.currentTarget
            .setPointerCapture(
              event.pointerId
            );
        } catch {
          // Pointer capture is optional.
        }
      } else if (
        absY >= absX
      ) {
        axisRef.current =
          "y";
      } else {
        axisRef.current =
          "blocked";
      }
    }

    if (
      axisRef.current !==
      "x"
    ) {
      return;
    }

    event.preventDefault();

    setDragging(true);

    const raw =
      Math.max(0, dx);

    const resisted =
      raw <= SWIPE_TRIGGER
        ? raw * 0.88
        : SWIPE_TRIGGER *
            0.88 +
          (raw -
            SWIPE_TRIGGER) *
            0.22;

    const next =
      Math.min(
        SWIPE_MAX,
        resisted
      );

    setOffset(next);

    if (
      next >=
        SWIPE_TRIGGER &&
      !armedRef.current
    ) {
      armedRef.current =
        true;

      if (
        typeof navigator !==
          "undefined" &&
        "vibrate" in navigator
      ) {
        navigator.vibrate?.(
          8
        );
      }
    }

    if (
      next <
      SWIPE_TRIGGER - 8
    ) {
      armedRef.current =
        false;
    }
  }

  function finish(
    event: PointerEvent<HTMLDivElement>
  ) {
    const horizontal =
      axisRef.current ===
      "x";

    const shouldReply =
      horizontal &&
      offset >=
        SWIPE_TRIGGER;

    if (shouldReply) {
      suppressClickRef.current =
        true;

      onReply();

      window.setTimeout(
        () => {
          suppressClickRef.current =
            false;
        },
        80
      );
    }

    try {
      if (
        event.currentTarget
          .hasPointerCapture(
            event.pointerId
          )
      ) {
        event.currentTarget
          .releasePointerCapture(
            event.pointerId
          );
      }
    } catch {
      // Safe cleanup.
    }

    reset();
  }

  return (
    <div
      className="relative w-full"
      style={{
        touchAction: "pan-y",
      }}
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={finish}
      onPointerCancel={
        finish
      }
      onClickCapture={(
        event
      ) => {
        if (
          suppressClickRef.current
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm"
        style={{
          opacity:
            Math.min(
              1,
              offset / 42
            ),
          transform:
            `translateY(-50%) scale(${Math.min(
              1,
              0.72 +
                offset /
                  180
            )})`,
        }}
      >
        <Reply size={15} />
      </div>

      <div
        style={{
          transform:
            `translate3d(${offset}px,0,0)`,
          transition:
            dragging
              ? "none"
              : "transform 180ms cubic-bezier(.2,.8,.2,1)",
          willChange:
            offset
              ? "transform"
              : "auto",
          userSelect:
            dragging
              ? "none"
              : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function MessageReplyQuote({
  message,
  messages,
  currentUserId,
  peerUsername,
}: {
  message: any;
  messages: any[];
  currentUserId?:
    | string
    | null;
  peerUsername?: string;
}) {
  const reply =
    message?.reply_to_id
      ? messages.find(
          (item) =>
            item.id ===
            message.reply_to_id
        )
      : null;

  if (!reply) {
    return null;
  }

  const author =
    reply.sender_id ===
    currentUserId
      ? "Tú"
      : `@${
          peerUsername ||
          "usuario"
        }`;

  return (
    <div className="mb-2 flex min-w-0 overflow-hidden rounded-[10px] bg-[color-mix(in_srgb,var(--app-soft-strong)_78%,transparent)]">
      <span className="w-[3px] shrink-0 bg-[var(--app-accent)]" />

      <div className="min-w-0 px-2.5 py-1.5">
        <p className="truncate text-[9px] font-black text-[var(--app-accent)]">
          {author}
        </p>

        <p className="mt-0.5 max-w-[300px] truncate text-[10.5px] leading-4 text-[var(--app-muted)]">
          {messageSummary(
            reply
          )}
        </p>
      </div>
    </div>
  );
}

export function ComposerReplyPreview({
  message,
  currentUserId,
  peerUsername,
  onClose,
}: {
  message: any;
  currentUserId?:
    | string
    | null;
  peerUsername?: string;
  onClose: () => void;
}) {
  if (!message) {
    return null;
  }

  const author =
    message.sender_id ===
    currentUserId
      ? "Tú"
      : `@${
          peerUsername ||
          "usuario"
        }`;

  return (
    <div className="mb-1 flex min-w-0 overflow-hidden rounded-[12px] bg-[color-mix(in_srgb,var(--app-soft-strong)_88%,transparent)]">
      <span className="w-[3px] shrink-0 bg-[var(--app-accent)]" />

      <div className="min-w-0 flex-1 px-3 py-2">
        <p className="truncate text-[9px] font-black text-[var(--app-accent)]">
          Responder a{" "}
          {author}
        </p>

        <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--app-muted)]">
          {messageSummary(
            message
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex w-10 shrink-0 items-center justify-center text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
        aria-label="Cancelar respuesta"
      >
        <X size={14} />
      </button>
    </div>
  );
}
