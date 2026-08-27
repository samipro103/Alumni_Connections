"use client";

import {
  Reply,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";

const SWIPE_TRIGGER = 54;
const SWIPE_MAX = 82;
const SETTLE_MS = 185;

function messageSummary(
  message: any
) {
  if (!message) return "Mensaje";

  if (
    message.content &&
    String(message.content).trim()
  ) {
    return String(message.content).trim();
  }

  if (message.media_type === "image") {
    return "📷 Foto";
  }

  if (message.media_type === "video") {
    return "🎥 Video";
  }

  if (
    message.message_type ===
    "story_reply"
  ) {
    return "Respuesta a historia";
  }

  return "Mensaje";
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

  const [settling, setSettling] =
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

  const offsetRef =
    useRef(0);

  const armedRef =
    useRef(false);

  const suppressClickRef =
    useRef(false);

  const settleTimerRef =
    useRef<number | null>(
      null
    );

  const clickTimerRef =
    useRef<number | null>(
      null
    );

  useEffect(() => {
    return () => {
      if (
        settleTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          settleTimerRef.current
        );
      }

      if (
        clickTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          clickTimerRef.current
        );
      }
    };
  }, []);

  function clearGestureRefs() {
    startRef.current = null;
    axisRef.current = null;
    armedRef.current =
      false;
  }

  function settleBack() {
    offsetRef.current = 0;
    setDragging(false);
    setSettling(true);
    setOffset(0);
    clearGestureRefs();

    if (
      settleTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        settleTimerRef.current
      );
    }

    settleTimerRef.current =
      window.setTimeout(
        () => {
          setSettling(false);
          settleTimerRef.current =
            null;
        },
        SETTLE_MS
      );
  }

  function interactiveTarget(
    target:
      EventTarget | null
  ) {
    const element =
      target instanceof Element
        ? target
        : null;

    return Boolean(
      element?.closest(
        [
          "button",
          "input",
          "textarea",
          "select",
          "video",
          "audio",
          "[role='dialog']",
        ].join(",")
      )
    );
  }

  function onPointerDown(
    event:
      PointerEvent<HTMLDivElement>
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

    if (
      settleTimerRef.current !==
      null
    ) {
      window.clearTimeout(
        settleTimerRef.current
      );
      settleTimerRef.current =
        null;
    }

    setSettling(false);
    setDragging(false);
    setOffset(0);
    offsetRef.current = 0;

    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId:
        event.pointerId,
    };

    axisRef.current = null;
    armedRef.current =
      false;
  }

  function onPointerMove(
    event:
      PointerEvent<HTMLDivElement>
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
      ) >= 8
    ) {
      if (
        dx > 0 &&
        absX >
          absY * 1.18
      ) {
        axisRef.current =
          "x";

        try {
          event.currentTarget
            .setPointerCapture(
              event.pointerId
            );
        } catch {}
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
      Math.max(
        0,
        dx
      );

    const resisted =
      raw <= SWIPE_TRIGGER
        ? raw * 0.9
        : SWIPE_TRIGGER *
            0.9 +
          (raw -
            SWIPE_TRIGGER) *
            0.2;

    const next =
      Math.min(
        SWIPE_MAX,
        resisted
      );

    offsetRef.current =
      next;

    setOffset(next);

    if (
      next >=
        SWIPE_TRIGGER &&
      !armedRef.current
    ) {
      armedRef.current =
        true;

      try {
        navigator.vibrate?.(
          8
        );
      } catch {}
    }

    if (
      next <
      SWIPE_TRIGGER - 9
    ) {
      armedRef.current =
        false;
    }
  }

  function releaseCapture(
    event:
      PointerEvent<HTMLDivElement>
  ) {
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
    } catch {}
  }

  function onPointerUp(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    const shouldReply =
      axisRef.current ===
        "x" &&
      offsetRef.current >=
        SWIPE_TRIGGER;

    releaseCapture(
      event
    );

    if (shouldReply) {
      suppressClickRef.current =
        true;

      onReply();

      if (
        clickTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          clickTimerRef.current
        );
      }

      clickTimerRef.current =
        window.setTimeout(
          () => {
            suppressClickRef.current =
              false;
            clickTimerRef.current =
              null;
          },
          120
        );
    }

    settleBack();
  }

  function onPointerCancel(
    event:
      PointerEvent<HTMLDivElement>
  ) {
    releaseCapture(
      event
    );
    settleBack();
  }

  const hasTransform =
    offset > 0 ||
    settling;

  return (
    <div
      className="relative w-full"
      style={{
        touchAction:
          "pan-y",
      }}
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={
        onPointerUp
      }
      onPointerCancel={
        onPointerCancel
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
        <Reply
          size={15}
        />
      </div>

      <div
        style={{
          transform:
            hasTransform
              ? `translate3d(${offset}px,0,0)`
              : undefined,
          transition:
            dragging
              ? "none"
              : settling
              ? `transform ${SETTLE_MS}ms cubic-bezier(.2,.8,.2,1)`
              : undefined,
          willChange:
            dragging ||
            settling
              ? "transform"
              : undefined,
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
    <div
      className="alumni-reply-quote"
      data-owner={
        message.sender_id ===
        currentUserId
          ? "mine"
          : "other"
      }
    >
      <div className="alumni-reply-quote-body">
        <p className="alumni-reply-author">
          {author}
        </p>

        <p className="alumni-reply-summary">
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
    <div className="alumni-composer-reply-preview">
      <div className="alumni-composer-reply-copy">
        <p className="alumni-reply-author">
          Responder a{" "}
          {author}
        </p>

        <p className="alumni-reply-summary">
          {messageSummary(
            message
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="alumni-composer-reply-close"
        aria-label="Cancelar respuesta"
      >
        <X
          size={15}
        />
      </button>
    </div>
  );
}

/* ALUMNI_1_4_2_THEME_CHAT_PROFILE_POLISH:REPLY */
