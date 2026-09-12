"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";
import {
  ArrowDown,
  RefreshCw,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

const TRIGGER_DISTANCE = 80;
const MAX_PULL = 122;
const HOLD_OFFSET = 76;

function clamp(
  value: number,
  min = 0,
  max = 1
) {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

function blockedTarget(
  target: EventTarget | null
) {
  if (
    !(target instanceof Element)
  ) {
    return false;
  }

  if (
    target.closest(
      '[data-pull-refresh-pass="true"]'
    )
  ) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "input",
        "textarea",
        "select",
        "button",
        "a",
        '[contenteditable="true"]',
        '[role="dialog"]',
        '[data-pull-refresh-lock="true"]',
        ".alumni-story-viewer",
        ".alumni-story-composer-shell",
      ].join(",")
    )
  );
}

function refreshTarget() {
  return (
    document.getElementById(
      "alumni-global-shell"
    ) ||
    document.getElementById(
      "alumni-root-content"
    )
  );
}

function clearTargetStyles(
  target: HTMLElement
) {
  target.style.transition = "";
  target.style.transform = "";
}

function setContentOffset(
  value: number,
  animate = false
) {
  const target =
    refreshTarget();

  if (!target) return;

  const next =
    Math.max(0, value);

  if (
    next === 0 &&
    !animate
  ) {
    clearTargetStyles(
      target
    );
    return;
  }

  target.style.transition =
    animate
      ? "transform 245ms cubic-bezier(.22,.8,.24,1)"
      : "none";

  target.style.transform =
    `translate3d(0, ${next}px, 0)`;

  if (
    next === 0 &&
    animate
  ) {
    window.setTimeout(
      () => {
        if (
          target.style.transform ===
          "translate3d(0, 0px, 0)"
        ) {
          clearTargetStyles(
            target
          );
        }
      },
      270
    );
  }
}

function PullRefreshIndicator({
  progress,
  refreshing,
}: {
  progress: number;
  refreshing: boolean;
}) {
  const reduceMotion =
    useReducedMotion();

  const ready =
    progress >= 1 &&
    !refreshing;

  const safeProgress =
    clamp(progress);

  const circumference =
    2 * Math.PI * 15;

  const dashOffset =
    circumference *
    (1 - safeProgress);

  const label =
    refreshing
      ? "Actualizando"
      : ready
      ? "Suelta para actualizar"
      : "Desliza para actualizar";

  return (
    <motion.div
      className="alumni-refresh-glass"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: -10,
              scale: 0.96,
            }
      }
      animate={{
        opacity:
          refreshing
            ? 1
            : 0.28 +
              safeProgress * 0.72,
        y:
          refreshing
            ? 0
            : -5 +
              safeProgress * 5,
        scale:
          refreshing
            ? 1
            : 0.97 +
              safeProgress * 0.03,
      }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: -8,
              scale: 0.97,
            }
      }
      transition={{
        duration:
          reduceMotion
            ? 0.08
            : 0.16,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      data-ready={
        ready
          ? "true"
          : "false"
      }
      data-refreshing={
        refreshing
          ? "true"
          : "false"
      }
    >
      <span
        className="alumni-refresh-glass-icon"
        aria-hidden="true"
      >
        <svg
          className="alumni-refresh-progress"
          viewBox="0 0 36 36"
        >
          <circle
            cx="18"
            cy="18"
            r="15"
            className="alumni-refresh-progress-track"
          />

          <circle
            cx="18"
            cy="18"
            r="15"
            className="alumni-refresh-progress-value"
            strokeDasharray={circumference}
            strokeDashoffset={
              refreshing
                ? 0
                : dashOffset
            }
          />
        </svg>

        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {refreshing ? (
            <motion.span
              key="refreshing"
              className="alumni-refresh-symbol alumni-refresh-symbol-spin"
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      scale: 0.72,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                duration: 0.14,
              }}
            >
              <RefreshCw
                size={15}
                strokeWidth={2.15}
              />
            </motion.span>
          ) : (
            <motion.span
              key="arrow"
              className="alumni-refresh-symbol"
              initial={false}
              animate={{
                rotate:
                  ready
                    ? 180
                    : safeProgress * 35,
                scale:
                  ready
                    ? 1.06
                    : 1,
              }}
              transition={{
                duration:
                  reduceMotion
                    ? 0
                    : 0.16,
              }}
            >
              <ArrowDown
                size={16}
                strokeWidth={2.2}
              />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span className="alumni-refresh-glass-copy">
        <strong>
          {label}
        </strong>

        <span>
          {refreshing
            ? "Un momento"
            : ready
            ? "Listo"
            : "Actualiza ALUMNI"}
        </span>
      </span>

      <span
        className="alumni-refresh-glass-dot"
        aria-hidden="true"
      />

      <style jsx>{`
        .alumni-refresh-glass {
          pointer-events: none;
          position: relative;
          display: grid;
          min-width: 198px;
          max-width: calc(100vw - 32px);
          min-height: 54px;
          grid-template-columns:
            38px
            minmax(0, 1fr)
            8px;
          align-items: center;
          gap: 10px;
          padding: 7px 12px 7px 8px;
          overflow: hidden;
          border:
            1px solid
            color-mix(
              in srgb,
              var(--app-border) 58%,
              transparent
            );
          border-radius: 18px;
          background:
            color-mix(
              in srgb,
              var(--app-surface) 66%,
              transparent
            );
          -webkit-backdrop-filter:
            blur(20px)
            saturate(1.14);
          backdrop-filter:
            blur(20px)
            saturate(1.14);
          box-shadow:
            0 10px 28px
              color-mix(
                in srgb,
                var(--app-shadow) 34%,
                transparent
              ),
            inset 0 1px 0
              color-mix(
                in srgb,
                var(--app-text) 4%,
                transparent
              );
          transform-origin: center top;
        }

        .alumni-refresh-glass::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(
              180deg,
              color-mix(
                in srgb,
                var(--app-text) 2.4%,
                transparent
              ),
              transparent 56%
            );
        }

        .alumni-refresh-glass-icon {
          position: relative;
          z-index: 1;
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background:
            color-mix(
              in srgb,
              var(--app-soft-strong) 74%,
              transparent
            );
          color: var(--app-text-soft);
        }

        .alumni-refresh-progress {
          position: absolute;
          inset: 2px;
          width: 34px;
          height: 34px;
          transform: rotate(-90deg);
        }

        .alumni-refresh-progress-track,
        .alumni-refresh-progress-value {
          fill: none;
          stroke-width: 1.6;
        }

        .alumni-refresh-progress-track {
          stroke:
            color-mix(
              in srgb,
              var(--app-border) 80%,
              transparent
            );
        }

        .alumni-refresh-progress-value {
          stroke: var(--app-accent);
          stroke-linecap: round;
          transition:
            stroke-dashoffset
            70ms linear;
        }

        .alumni-refresh-symbol {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--app-text-soft);
        }

        .alumni-refresh-symbol-spin {
          color: var(--app-accent);
          animation:
            alumni-refresh-glass-spin
            .82s linear infinite;
        }

        .alumni-refresh-glass-copy {
          position: relative;
          z-index: 1;
          display: block;
          min-width: 0;
        }

        .alumni-refresh-glass-copy strong,
        .alumni-refresh-glass-copy > span {
          display: block;
        }

        .alumni-refresh-glass-copy strong {
          overflow: hidden;
          color: var(--app-text);
          font-size: 11px;
          font-weight: 870;
          line-height: 1.2;
          letter-spacing: -.012em;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .alumni-refresh-glass-copy > span {
          margin-top: 2px;
          color: var(--app-muted-2);
          font-size: 8.5px;
          font-weight: 650;
          line-height: 1.2;
        }

        .alumni-refresh-glass-dot {
          position: relative;
          z-index: 1;
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: var(--app-muted-3);
          transition:
            background-color 150ms ease,
            box-shadow 150ms ease,
            transform 150ms
              cubic-bezier(.2,.8,.2,1);
        }

        .alumni-refresh-glass[
          data-ready="true"
        ]
        .alumni-refresh-glass-dot,
        .alumni-refresh-glass[
          data-refreshing="true"
        ]
        .alumni-refresh-glass-dot {
          background: var(--app-accent);
          box-shadow:
            0 0 10px
              color-mix(
                in srgb,
                var(--app-accent) 28%,
                transparent
              );
          transform: scale(1.08);
        }

        .alumni-refresh-glass[
          data-ready="true"
        ]
        .alumni-refresh-glass-icon {
          background:
            color-mix(
              in srgb,
              var(--app-accent) 9%,
              var(--app-soft)
            );
          color: var(--app-accent);
        }

        @keyframes alumni-refresh-glass-spin {
          to {
            transform: rotate(360deg);
          }
        }

        html[data-theme="light"]
        .alumni-refresh-glass {
          background:
            color-mix(
              in srgb,
              var(--app-surface) 74%,
              transparent
            );
        }

        @supports not (
          backdrop-filter: blur(1px)
        ) {
          .alumni-refresh-glass {
            background:
              color-mix(
                in srgb,
                var(--app-surface) 94%,
                transparent
              );
          }
        }

        @media (
          prefers-reduced-motion: reduce
        ) {
          .alumni-refresh-progress-value {
            transition: none;
          }

          .alumni-refresh-symbol-spin {
            animation-duration: 1.6s;
          }

          .alumni-refresh-glass-dot {
            transition: none;
          }
        }
      `}</style>
    </motion.div>
  );
}

export default function GlobalPullToRefresh() {
  const pathname =
    usePathname();

  const reduceMotion =
    useReducedMotion();

  /*
   * Chats own their vertical gesture.
   * Pull-to-refresh is disabled ONLY
   * inside an actual conversation:
   * /messages/[username]
   * /messages/group/[id]
   *
   * /messages inbox and the rest of Alumni
   * keep the global refresh.
   */
  const chatRefreshDisabled =
    Boolean(
      pathname &&
      pathname.startsWith(
        "/messages/"
      )
    );

  const [
    pull,
    setPull,
  ] = useState(0);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const startYRef =
    useRef(0);

  const startXRef =
    useRef(0);

  const activeRef =
    useRef(false);

  const candidateRef =
    useRef(false);

  const gestureRef =
    useRef<
      "pending" | "pull" | "scroll"
    >("pending");

  const pullRef =
    useRef(0);

  const refreshingRef =
    useRef(false);

  useEffect(() => {
    refreshingRef.current =
      refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (
      chatRefreshDisabled
    ) {
      activeRef.current =
        false;

      pullRef.current = 0;

      refreshingRef.current =
        false;

      setPull(0);
      setRefreshing(false);

      const target =
        refreshTarget();

      if (target) {
        clearTargetStyles(
          target
        );
      }

      return;
    }

    const html =
      document.documentElement;

    const body =
      document.body;

    const previousHtml =
      html.style
        .overscrollBehaviorY;

    const previousBody =
      body.style
        .overscrollBehaviorY;

    html.style.overscrollBehaviorY =
      "none";

    body.style.overscrollBehaviorY =
      "none";

    function reset(
      animate = true
    ) {
      const hadPull =
        pullRef.current > 0;

      candidateRef.current =
        false;

      gestureRef.current =
        "pending";

      activeRef.current =
        false;

      pullRef.current = 0;
      setPull(0);

      setContentOffset(
        0,
        animate && hadPull
      );
    }

    function onTouchStart(
      event: TouchEvent
    ) {
      if (
        refreshingRef.current ||
        window.scrollY > 1 ||
        event.touches.length !== 1 ||
        blockedTarget(
          event.target
        ) ||
        document.querySelector(
          '[data-pull-refresh-lock="true"]'
        )
      ) {
        candidateRef.current =
          false;
        activeRef.current =
          false;
        return;
      }

      const touch =
        event.touches[0];

      startYRef.current =
        touch.clientY;

      startXRef.current =
        touch.clientX;

      candidateRef.current =
        true;

      gestureRef.current =
        "pending";

      activeRef.current =
        false;

      pullRef.current = 0;
    }

    function onTouchMove(
      event: TouchEvent
    ) {
      if (
        event.touches.length !== 1
      ) {
        return;
      }

      const touch =
        event.touches[0];

      const deltaY =
        touch.clientY -
        startYRef.current;

      const deltaX =
        touch.clientX -
        startXRef.current;

      const absY =
        Math.abs(deltaY);

      const absX =
        Math.abs(deltaX);

      if (
        candidateRef.current &&
        !activeRef.current
      ) {
        if (
          Math.max(
            absX,
            absY
          ) < 10
        ) {
          return;
        }

        const verticalPull =
          deltaY > 10 &&
          absY >
            absX * 1.2 &&
          window.scrollY <= 1;

        if (!verticalPull) {
          candidateRef.current =
            false;

          gestureRef.current =
            "scroll";

          return;
        }

        activeRef.current =
          true;

        gestureRef.current =
          "pull";
      }

      if (
        !activeRef.current ||
        gestureRef.current !==
          "pull"
      ) {
        return;
      }

      if (
        absX >
        absY * 0.8
      ) {
        reset(false);
        return;
      }

      if (
        deltaY <= 0 ||
        window.scrollY > 1
      ) {
        reset(false);
        return;
      }

      event.preventDefault();

      const effectiveDelta =
        Math.max(
          0,
          deltaY - 8
        );

      const distance =
        Math.min(
          MAX_PULL,
          effectiveDelta * 0.5
        );

      if (distance < 1) {
        return;
      }

      pullRef.current =
        distance;

      setPull(distance);

      setContentOffset(
        distance,
        false
      );
    }

    function onTouchEnd() {
      candidateRef.current =
        false;

      if (
        !activeRef.current
      ) {
        gestureRef.current =
          "pending";
        return;
      }

      activeRef.current =
        false;

      if (
        pullRef.current >=
        TRIGGER_DISTANCE
      ) {
        refreshingRef.current =
          true;

        setRefreshing(true);

        pullRef.current =
          HOLD_OFFSET;

        setPull(
          HOLD_OFFSET
        );

        setContentOffset(
          HOLD_OFFSET,
          true
        );

        window.setTimeout(
          () => {
            window.location.reload();
          },
          900
        );

        return;
      }

      reset(true);
    }

    function onTouchCancel() {
      reset(true);
    }

    window.addEventListener(
      "touchstart",
      onTouchStart,
      {
        passive: true,
        capture: true,
      }
    );

    window.addEventListener(
      "touchmove",
      onTouchMove,
      {
        passive: false,
        capture: true,
      }
    );

    window.addEventListener(
      "touchend",
      onTouchEnd,
      {
        passive: true,
        capture: true,
      }
    );

    window.addEventListener(
      "touchcancel",
      onTouchCancel,
      {
        passive: true,
        capture: true,
      }
    );

    return () => {
      html.style.overscrollBehaviorY =
        previousHtml;

      body.style.overscrollBehaviorY =
        previousBody;

      const target =
        refreshTarget();

      if (target) {
        clearTargetStyles(
          target
        );
      }

      window.removeEventListener(
        "touchstart",
        onTouchStart,
        true
      );

      window.removeEventListener(
        "touchmove",
        onTouchMove,
        true
      );

      window.removeEventListener(
        "touchend",
        onTouchEnd,
        true
      );

      window.removeEventListener(
        "touchcancel",
        onTouchCancel,
        true
      );
    };
  }, [
    chatRefreshDisabled,
  ]);

  const progress =
    clamp(
      pull /
        TRIGGER_DISTANCE
    );

  const visible =
    !chatRefreshDisabled &&
    (
      refreshing ||
      pull > 2
    );

  /*
   * El componente permanece montado para que
   * AnimatePresence cierre el indicador suavemente
   * cuando termina el gesto.
   */
  return (
    <AnimatePresence
      initial={false}
    >
      {visible && (
        <motion.div
          key="alumni-pull-refresh-glass"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-[68] flex justify-center px-4 lg:hidden"
          style={{
            top:
              "calc(env(safe-area-inset-top) + 72px)",
          }}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: -10,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={
            reduceMotion
              ? { opacity: 0 }
              : {
                  opacity: 0,
                  y: -8,
                }
          }
          transition={{
            duration:
              reduceMotion
                ? 0.08
                : 0.16,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <PullRefreshIndicator
            progress={progress}
            refreshing={refreshing}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ALUMNI_1_2_3_SCROLL_MESSAGES_STABILITY:PULL_REFRESH */

/* ALUMNI_1_3_6_1_CHAT_NO_PULL_REFRESH */

/* ALUMNI_1_3_7_MESSAGING_GLOBAL_STABILITY:REFRESH_LAYER */

/* ALUMNI_PERFORMANCE_HARDENING_HYDRATION_PULL_REFRESH_V8 */

/* ALUMNI_PULL_TO_REFRESH_GLASS_6_1 */
