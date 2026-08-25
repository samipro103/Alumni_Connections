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

  /*
    Banner y avatar HD son botones para abrir
    el visor, pero también deben permitir iniciar
    Pull-to-Refresh cuando el usuario arrastra.
  */
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

  /*
    Muy importante:
    al terminar el gesto quitamos transform
    por completo. Dejar transform: translateY(0)
    alteraría el comportamiento de elementos fixed.
  */
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

  /*
    La marca completa permanece durante casi
    todo el gesto. Solo cerca del umbral se
    empieza a desmaterializar de izquierda
    a derecha hasta dejar el punto.
  */
  const erase =
    clamp(
      (progress - 0.70) /
        0.30
    );

  const reveal =
    clamp(
      progress / 0.28
    );

  return (
    <div className="alumni-refresh-mark-wrap">
      <div
        className={`alumni-refresh-mark ${
          refreshing
            ? "is-refreshing"
            : ""
        }`}
        style={{
          opacity:
            refreshing
              ? 1
              : 0.38 +
                reveal * 0.62,
          transform:
            `translate3d(0, ${
              refreshing
                ? 0
                : (1 - reveal) *
                  7
            }px, 0) scale(${
              0.97 +
              reveal * 0.03
            })`,
        }}
      >
        {!refreshing && (
          <span
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
                    erase * 6 -
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
                          -3 *
                          localErase
                        }px, 0)`,
                      filter:
                        `blur(${
                          localErase *
                          3
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
          </span>
        )}

        {refreshing && (
          <span
            className="alumni-refresh-orbit"
            aria-label="Actualizando Alumni"
          >
            <span className="alumni-refresh-orbit-dot" />
          </span>
        )}
      </div>

      {!refreshing && (
        <span
          aria-hidden="true"
          className="alumni-refresh-accent-line"
          style={{
            width:
              `${
                14 +
                progress * 34
              }px`,
            opacity:
              0.12 +
              progress * 0.34,
          }}
        />
      )}

      <style jsx>{`
        .alumni-refresh-mark-wrap {
          position: relative;
          display: flex;
          min-width: 108px;
          min-height: 50px;
          align-items: center;
          justify-content: center;
        }

        .alumni-refresh-mark {
          position: relative;
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
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -0.055em;
          line-height: 1;
          color: var(--app-text);
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
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
          margin-left: 0.015em;
          color:
            color-mix(
              in srgb,
              var(--app-accent) 64%,
              var(--app-text) 36%
            );
          text-shadow:
            0 0 13px
              color-mix(
                in srgb,
                var(--app-accent) 18%,
                transparent
              );
          transform-origin: center;
          transition:
            transform 90ms linear;
        }

        .alumni-refresh-accent-line {
          position: absolute;
          bottom: 3px;
          left: 50%;
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
                var(--app-accent) 58%,
                var(--app-text) 42%
              ),
              transparent
            );
          transition:
            width 90ms linear,
            opacity 90ms linear;
        }

        .alumni-refresh-orbit {
          position: relative;
          display: inline-flex;
          width: 25px;
          height: 25px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
        }

        .alumni-refresh-orbit::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          border: 1.7px solid
            color-mix(
              in srgb,
              var(--app-border) 86%,
              transparent
            );
          border-top-color:
            color-mix(
              in srgb,
              var(--app-accent) 72%,
              var(--app-text) 28%
            );
          border-right-color:
            color-mix(
              in srgb,
              var(--app-accent) 36%,
              var(--app-text) 64%
            );
          animation:
            alumni-refresh-orbit-spin
            0.78s
            cubic-bezier(.5,.1,.5,.9)
            infinite;
        }

        .alumni-refresh-orbit::after {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: inherit;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 8%,
              transparent
            );
        }

        .alumni-refresh-orbit-dot {
          position: relative;
          z-index: 1;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 58%,
              var(--app-text) 42%
            );
          box-shadow:
            0 0 12px
              color-mix(
                in srgb,
                var(--app-accent) 28%,
                transparent
              );
          animation:
            alumni-refresh-dot-breathe
            0.9s ease-in-out
            infinite alternate;
        }

        @keyframes alumni-refresh-orbit-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @keyframes alumni-refresh-dot-breathe {
          from {
            transform:
              scale(.82);
            opacity: .72;
          }

          to {
            transform:
              scale(1.18);
            opacity: 1;
          }
        }

        @media
          (prefers-reduced-motion:
            reduce) {
          .alumni-refresh-letter,
          .alumni-refresh-mark,
          .alumni-refresh-dot,
          .alumni-refresh-accent-line {
            transition: none;
          }

          .alumni-refresh-orbit::before {
            animation-duration:
              1.5s;
          }

          .alumni-refresh-orbit-dot {
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

        setPull(
          HOLD_OFFSET
        );

        setShellOffset(
          HOLD_OFFSET,
          true
        );

        /*
          Se deja tiempo suficiente para ver
          la transición punto -> loader.
        */
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
        clearShellStyles(
          shell
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
        height:
          `${Math.max(
            0,
            pull
          )}px`,
        paddingTop:
          "max(7px, env(safe-area-inset-top))",
      }}
    >
      <AnimatedBrand
        progress={progress}
        refreshing={
          refreshing
        }
      />
    </div>
  );
}
