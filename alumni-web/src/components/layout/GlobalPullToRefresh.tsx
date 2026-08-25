"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const TRIGGER_DISTANCE = 80;
const MAX_PULL = 120;
const HOLD_OFFSET = 72;

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

function clearShellStyles(
  shell: HTMLElement
) {
  shell.style.transition = "";
  shell.style.transform = "";
}

function setShellOffset(
  value: number,
  animate = false
) {
  const shell =
    document.getElementById(
      "alumni-global-shell"
    );

  if (!shell) return;

  const next =
    Math.max(0, value);

  if (next === 0 && !animate) {
    clearShellStyles(shell);
    return;
  }

  shell.style.transition =
    animate
      ? "transform 240ms cubic-bezier(.22,.8,.24,1)"
      : "none";

  shell.style.transform =
    `translate3d(0, ${next}px, 0)`;

  if (
    next === 0 &&
    animate
  ) {
    window.setTimeout(
      () => {
        if (
          shell.style.transform ===
          "translate3d(0, 0px, 0)"
        ) {
          clearShellStyles(
            shell
          );
        }
      },
      260
    );
  }
}

function AnimatedBrand({
  progress,
  refreshing,
}: {
  progress: number;
  refreshing: boolean;
}) {
  const letters =
    "Alumni".split("");

  const reveal =
    clamp(progress / 0.22);
  const erase =
    clamp((progress - 0.73) / 0.27);

  return (
    <div className="alumni-refresh-hero">
      <div
        className="alumni-refresh-glow"
        style={{
          opacity:
            refreshing
              ? 0.95
              : 0.22 +
                progress * 0.38,
          transform: `scale(${
            0.88 +
            progress * 0.18
          })`,
        }}
      />

      <div
        className="alumni-refresh-stage"
        style={{
          opacity:
            refreshing
              ? 1
              : 0.32 +
                reveal * 0.68,
          transform: `translate3d(0, ${
            refreshing
              ? 0
              : (1 - reveal) * 8
          }px, 0) scale(${
            0.97 +
            reveal * 0.03
          })`,
        }}
      >
        {!refreshing ? (
          <div
            className="alumni-refresh-word"
            aria-label="Alumni."
          >
            {letters.map(
              (
                letter,
                index
              ) => {
                const localErase =
                  clamp(
                    erase * 6.1 -
                      index
                  );

                return (
                  <span
                    key={`${letter}-${index}`}
                    className="alumni-refresh-letter"
                    aria-hidden="true"
                    style={{
                      opacity:
                        1 -
                        localErase,
                      maxWidth:
                        `${
                          1 -
                          localErase
                        }em`,
                      transform:
                        `translate3d(0, ${
                          -4 *
                          localErase
                        }px, 0)`,
                      filter:
                        `blur(${
                          localErase *
                          2.6
                        }px)`,
                    }}
                  >
                    {letter}
                  </span>
                );
              }
            )}

            <span
              aria-hidden="true"
              className="alumni-refresh-dot"
              style={{
                transform:
                  `scale(${
                    1 +
                    erase * 0.16
                  })`,
              }}
            >
              .
            </span>
          </div>
        ) : (
          <div
            className="alumni-refresh-loader"
            aria-label="Actualizando Alumni"
          >
            <span className="alumni-refresh-loader-core" />
          </div>
        )}
      </div>

      <div
        className="alumni-refresh-line"
        style={{
          opacity:
            refreshing
              ? 0.36
              : 0.12 +
                progress * 0.38,
          width:
            `${16 + progress * 44}px`,
        }}
      />

      <style jsx>{`
        .alumni-refresh-hero {
          position: relative;
          display: flex;
          min-width: 160px;
          min-height: 54px;
          align-items: center;
          justify-content: center;
        }

        .alumni-refresh-glow {
          position: absolute;
          inset: 5px auto auto 50%;
          width: 130px;
          height: 44px;
          border-radius: 999px;
          transform: translateX(-50%);
          background:
            radial-gradient(
              ellipse at center,
              color-mix(
                  in srgb,
                  var(--app-accent) 14%,
                  transparent
                )
                0%,
              color-mix(
                  in srgb,
                  var(--app-accent) 8%,
                  transparent
                )
                34%,
              transparent 72%
            );
          filter: blur(6px);
          pointer-events: none;
        }

        .alumni-refresh-stage {
          position: relative;
          z-index: 1;
          display: flex;
          min-height: 34px;
          align-items: center;
          justify-content: center;
          transform-origin: 50% 55%;
          transition:
            opacity 90ms linear,
            transform 90ms linear;
        }

        .alumni-refresh-word {
          display: inline-flex;
          align-items: baseline;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          letter-spacing: -0.062em;
          line-height: 1;
          color: #f5f7ff;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
          text-shadow:
            0 1px 0 rgba(255,255,255,0.04),
            0 0 18px rgba(13, 90, 255, 0.04);
        }

        .alumni-refresh-letter {
          display: inline-block;
          overflow: hidden;
          flex: 0 1 auto;
          transition:
            opacity 80ms linear,
            max-width 80ms linear,
            transform 80ms linear,
            filter 80ms linear;
        }

        .alumni-refresh-dot {
          display: inline-block;
          margin-left: 0.018em;
          color:
            color-mix(
              in srgb,
              var(--app-accent) 72%,
              #ffffff 28%
            );
          text-shadow:
            0 0 10px
              color-mix(
                in srgb,
                var(--app-accent) 18%,
                transparent
              ),
            0 0 24px
              color-mix(
                in srgb,
                var(--app-accent) 10%,
                transparent
              );
          transform-origin: center;
          transition:
            transform 90ms linear;
        }

        .alumni-refresh-line {
          position: absolute;
          left: 50%;
          bottom: 7px;
          height: 1px;
          border-radius: 999px;
          transform: translateX(-50%);
          background:
            linear-gradient(
              90deg,
              transparent,
              color-mix(
                in srgb,
                var(--app-accent) 52%,
                #ffffff 48%
              ),
              transparent
            );
          transition:
            width 90ms linear,
            opacity 90ms linear;
        }

        .alumni-refresh-loader {
          position: relative;
          display: inline-flex;
          width: 26px;
          height: 26px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
        }

        .alumni-refresh-loader::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          border: 1.8px solid
            rgba(255,255,255,0.12);
          border-top-color:
            color-mix(
              in srgb,
              var(--app-accent) 74%,
              #ffffff 26%
            );
          border-right-color:
            color-mix(
              in srgb,
              var(--app-accent) 38%,
              #ffffff 62%
            );
          animation:
            alumni-refresh-spin
            0.78s
            cubic-bezier(.5,.1,.5,.9)
            infinite;
        }

        .alumni-refresh-loader::after {
          content: "";
          position: absolute;
          inset: 7px;
          border-radius: inherit;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 8%,
              transparent
            );
        }

        .alumni-refresh-loader-core {
          position: relative;
          z-index: 1;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 64%,
              #ffffff 36%
            );
          box-shadow:
            0 0 12px
              color-mix(
                in srgb,
                var(--app-accent) 28%,
                transparent
              );
          animation:
            alumni-refresh-pulse
            0.9s ease-in-out
            infinite alternate;
        }

        @keyframes alumni-refresh-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes alumni-refresh-pulse {
          from {
            transform: scale(0.82);
            opacity: 0.72;
          }

          to {
            transform: scale(1.18);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alumni-refresh-stage,
          .alumni-refresh-letter,
          .alumni-refresh-dot,
          .alumni-refresh-line {
            transition: none;
          }

          .alumni-refresh-loader::before {
            animation-duration: 1.5s;
          }

          .alumni-refresh-loader-core {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function GlobalPullToRefresh() {
  const [pull, setPull] =
    useState(0);
  const [refreshing, setRefreshing] =
    useState(false);

  const startYRef =
    useRef(0);
  const startXRef =
    useRef(0);
  const activeRef =
    useRef(false);
  const pullRef =
    useRef(0);
  const refreshingRef =
    useRef(false);

  useEffect(() => {
    refreshingRef.current =
      refreshing;
  }, [refreshing]);

  useEffect(() => {
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
      activeRef.current =
        false;
      pullRef.current = 0;
      setPull(0);
      setShellOffset(
        0,
        animate
      );
    }

    function onTouchStart(
      event: TouchEvent
    ) {
      if (
        refreshingRef.current ||
        window.scrollY > 0 ||
        event.touches.length !== 1 ||
        blockedTarget(
          event.target
        ) ||
        document.querySelector(
          '[data-pull-refresh-lock="true"]'
        )
      ) {
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
      activeRef.current = true;
      pullRef.current = 0;

      setShellOffset(
        0,
        false
      );
    }

    function onTouchMove(
      event: TouchEvent
    ) {
      if (
        !activeRef.current ||
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

      if (
        Math.abs(deltaX) >
        Math.abs(deltaY) * 0.8
      ) {
        reset();
        return;
      }

      if (
        deltaY <= 0 ||
        window.scrollY > 0
      ) {
        reset();
        return;
      }

      event.preventDefault();

      const distance =
        Math.min(
          MAX_PULL,
          deltaY * 0.5
        );

      pullRef.current =
        distance;
      setPull(distance);
      setShellOffset(
        distance,
        false
      );
    }

    function onTouchEnd() {
      if (
        !activeRef.current
      ) {
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
        setPull(HOLD_OFFSET);
        setShellOffset(
          HOLD_OFFSET,
          true
        );

        window.setTimeout(
          () => {
            window.location.reload();
          },
          760
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

      const shell =
        document.getElementById(
          "alumni-global-shell"
        );

      if (shell) {
        clearShellStyles(shell);
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
  }, []);

  const progress =
    clamp(
      pull /
        TRIGGER_DISTANCE
    );
  const visible =
    refreshing ||
    pull > 2;

  return (
    <div
      aria-live="polite"
      aria-hidden={
        visible
          ? undefined
          : true
      }
      className={`pointer-events-none fixed inset-x-0 top-0 z-[40] flex justify-center overflow-hidden transition-opacity duration-150 ${
        visible
          ? "opacity-100"
          : "opacity-0"
      }`}
      style={{
        height: `${Math.max(
          0,
          pull
        )}px`,
        paddingTop:
          "max(8px, env(safe-area-inset-top))",
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-full"
        style={{
          opacity:
            0.28 +
            progress * 0.34,
          background:
            "linear-gradient(180deg, rgba(6,13,28,.76) 0%, rgba(6,13,28,.48) 48%, rgba(6,13,28,0) 100%)",
          backdropFilter:
            "blur(8px)",
        }}
      />

      <AnimatedBrand
        progress={progress}
        refreshing={
          refreshing
        }
      />
    </div>
  );
}
