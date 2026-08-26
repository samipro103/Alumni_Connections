"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePathname,
} from "next/navigation";

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

function SideCelebration({
  side,
  progress,
  refreshing,
}: {
  side: "left" | "right";
  progress: number;
  refreshing: boolean;
}) {
  const strength =
    refreshing
      ? 1
      : clamp(
          (progress - 0.14) /
            0.86
        );

  return (
    <div
      className={`alumni-celebration alumni-celebration-${side}`}
      aria-hidden="true"
      style={{
        opacity:
          0.12 +
          strength * 0.88,
        transform:
          `scaleX(${
            0.45 +
            strength * 0.55
          })`,
      }}
    >
      <span className="alumni-celebration-line alumni-celebration-line-main" />
      <span className="alumni-celebration-line alumni-celebration-line-short" />
      <span className="alumni-celebration-line alumni-celebration-line-soft" />

      <span className="alumni-celebration-spark alumni-celebration-spark-a" />
      <span className="alumni-celebration-spark alumni-celebration-spark-b" />
      <span className="alumni-celebration-spark alumni-celebration-spark-c" />

      <style jsx>{`
        .alumni-celebration {
          position: absolute;
          top: 7px;
          width: min(30vw, 150px);
          height: 42px;
          transform-origin:
            ${side === "left"
              ? "right center"
              : "left center"};
          transition:
            opacity 100ms linear,
            transform 100ms linear;
        }

        .alumni-celebration-left {
          right:
            calc(50% + 68px);
        }

        .alumni-celebration-right {
          left:
            calc(50% + 68px);
        }

        .alumni-celebration-line {
          position: absolute;
          height: 1px;
          border-radius: 999px;
          overflow: hidden;
          background:
            linear-gradient(
              ${side === "left"
                ? "90deg"
                : "270deg"},
              transparent,
              color-mix(
                in srgb,
                var(--app-accent) 28%,
                rgba(255,255,255,.32) 72%
              )
            );
        }

        .alumni-celebration-line::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 38%;
          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.9),
              transparent
            );
          animation:
            alumni-celebration-travel
            1.35s ease-in-out
            infinite;
        }

        .alumni-celebration-line-main {
          top: 13px;
          width: 100%;
        }

        .alumni-celebration-line-short {
          top: 23px;
          width: 68%;
          opacity: .7;
          ${side === "left"
            ? "right: 0;"
            : "left: 0;"}
          animation:
            alumni-celebration-breathe
            1.7s ease-in-out
            infinite alternate;
        }

        .alumni-celebration-line-soft {
          top: 31px;
          width: 42%;
          opacity: .35;
          ${side === "left"
            ? "right: 5%;"
            : "left: 5%;"}
        }

        .alumni-celebration-spark {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 54%,
              white 46%
            );
          box-shadow:
            0 0 8px
              color-mix(
                in srgb,
                var(--app-accent) 22%,
                transparent
              );
          animation:
            alumni-celebration-spark
            1.15s ease-in-out
            infinite alternate;
        }

        .alumni-celebration-spark-a {
          top: 5px;
          ${side === "left"
            ? "right: 16%;"
            : "left: 16%;"}
        }

        .alumni-celebration-spark-b {
          top: 20px;
          ${side === "left"
            ? "right: 47%;"
            : "left: 47%;"}
          animation-delay: .22s;
        }

        .alumni-celebration-spark-c {
          top: 34px;
          ${side === "left"
            ? "right: 72%;"
            : "left: 72%;"}
          animation-delay: .44s;
        }

        @keyframes alumni-celebration-travel {
          from {
            transform:
              translateX(
                ${side === "left"
                  ? "-120%"
                  : "220%"}
              );
            opacity: 0;
          }

          35% {
            opacity: .8;
          }

          to {
            transform:
              translateX(
                ${side === "left"
                  ? "260%"
                  : "-160%"}
              );
            opacity: 0;
          }
        }

        @keyframes alumni-celebration-breathe {
          from {
            opacity: .25;
          }

          to {
            opacity: .85;
          }
        }

        @keyframes alumni-celebration-spark {
          from {
            transform:
              scale(.65);
            opacity: .25;
          }

          to {
            transform:
              scale(1.35);
            opacity: 1;
          }
        }

        @media
          (prefers-reduced-motion:
            reduce) {
          .alumni-celebration-line::after,
          .alumni-celebration-line-short,
          .alumni-celebration-spark {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
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
    clamp(
      progress / 0.20
    );

  const erase =
    clamp(
      (progress - 0.74) /
        0.26
    );

  return (
    <div className="alumni-refresh-hero">
      <SideCelebration
        side="left"
        progress={progress}
        refreshing={
          refreshing
        }
      />

      <SideCelebration
        side="right"
        progress={progress}
        refreshing={
          refreshing
        }
      />

      <div
        className="alumni-refresh-aurora"
        style={{
          opacity:
            refreshing
              ? 0.7
              : 0.18 +
                progress * 0.42,
          transform:
            `translateX(-50%) scale(${
              0.82 +
              progress * 0.2
            })`,
        }}
      />

      <div
        className="alumni-refresh-stage"
        style={{
          opacity:
            refreshing
              ? 1
              : 0.4 +
                reveal * 0.6,
          transform:
            `translate3d(0, ${
              refreshing
                ? 0
                : (1 -
                    reveal) *
                  7
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
                    aria-hidden="true"
                    className="alumni-refresh-letter"
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
                          2.7
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
                    erase *
                      0.18
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

      <span
        aria-hidden="true"
        className="alumni-refresh-center-line"
        style={{
          width:
            `${
              18 +
              progress * 42
            }px`,
          opacity:
            refreshing
              ? 0.38
              : 0.1 +
                progress * 0.38,
        }}
      />

      <style jsx>{`
        .alumni-refresh-hero {
          position: relative;
          z-index: 1;
          display: flex;
          width: min(100vw, 560px);
          min-height: 58px;
          align-items: center;
          justify-content: center;
        }

        .alumni-refresh-aurora {
          position: absolute;
          left: 50%;
          top: 2px;
          width: 170px;
          height: 46px;
          border-radius: 999px;
          background:
            radial-gradient(
              ellipse at center,
              color-mix(
                  in srgb,
                  var(--app-accent) 16%,
                  transparent
                )
                0%,
              color-mix(
                  in srgb,
                  var(--app-accent) 7%,
                  transparent
                )
                42%,
              transparent
                74%
            );
          filter: blur(8px);
          pointer-events: none;
          transition:
            opacity 100ms linear,
            transform 100ms linear;
        }

        .alumni-refresh-stage {
          position: relative;
          z-index: 2;
          display: flex;
          min-width: 106px;
          min-height: 36px;
          align-items: center;
          justify-content: center;
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
          color: #f6f8ff;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
          text-shadow:
            0 1px 0 rgba(255,255,255,.035);
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
          margin-left: .018em;
          color:
            color-mix(
              in srgb,
              var(--app-accent) 72%,
              white 28%
            );
          text-shadow:
            0 0 11px
              color-mix(
                in srgb,
                var(--app-accent) 20%,
                transparent
              );
          transform-origin: center;
          transition:
            transform 90ms linear;
        }

        .alumni-refresh-center-line {
          position: absolute;
          bottom: 5px;
          left: 50%;
          z-index: 2;
          height: 1px;
          transform:
            translateX(-50%);
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              transparent,
              color-mix(
                in srgb,
                var(--app-accent) 50%,
                white 50%
              ),
              transparent
            );
          transition:
            width 100ms linear,
            opacity 100ms linear;
        }

        .alumni-refresh-loader {
          position: relative;
          display: inline-flex;
          width: 28px;
          height: 28px;
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
            rgba(255,255,255,.11);
          border-top-color:
            color-mix(
              in srgb,
              var(--app-accent) 76%,
              white 24%
            );
          border-right-color:
            color-mix(
              in srgb,
              var(--app-accent) 38%,
              white 62%
            );
          animation:
            alumni-global-refresh-spin
            .75s
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
              var(--app-accent) 9%,
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
              var(--app-accent) 65%,
              white 35%
            );
          box-shadow:
            0 0 13px
              color-mix(
                in srgb,
                var(--app-accent) 30%,
                transparent
              );
          animation:
            alumni-global-refresh-pulse
            .88s ease-in-out
            infinite alternate;
        }

        @keyframes alumni-global-refresh-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes alumni-global-refresh-pulse {
          from {
            transform:
              scale(.78);
            opacity: .68;
          }

          to {
            transform:
              scale(1.22);
            opacity: 1;
          }
        }

        @media
          (prefers-reduced-motion:
            reduce) {
          .alumni-refresh-stage,
          .alumni-refresh-letter,
          .alumni-refresh-dot,
          .alumni-refresh-center-line {
            transition: none;
          }

          .alumni-refresh-loader::before {
            animation-duration:
              1.5s;
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
  const pathname =
    usePathname();

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

  if (
    chatRefreshDisabled
  ) {
    return null;
  }

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
        height:
          `${Math.max(
            0,
            pull
          )}px`,
        paddingTop:
          "max(8px, env(safe-area-inset-top))",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity:
            0.22 +
            progress * 0.38,
          background:
            "linear-gradient(180deg, rgba(7,15,34,.92) 0%, rgba(8,19,42,.58) 52%, rgba(7,15,34,0) 100%)",
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

/* ALUMNI_1_2_3_SCROLL_MESSAGES_STABILITY:PULL_REFRESH */

/* ALUMNI_1_3_6_1_CHAT_NO_PULL_REFRESH */
