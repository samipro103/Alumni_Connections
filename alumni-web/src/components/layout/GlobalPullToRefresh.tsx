"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const TRIGGER_DISTANCE = 78;
const MAX_PULL = 118;

function blockedTarget(
  target: EventTarget | null
) {
  if (
    !(target instanceof Element)
  ) {
    return false;
  }

  /*
    Dejamos pasar imágenes, banners y zonas
    de perfil. Solo bloqueamos controles
    realmente interactivos o flujos delicados.
  */
  return Boolean(
    target.closest(
      [
        "input",
        "textarea",
        "select",
        "button",
        '[contenteditable="true"]',
        '[role="dialog"]',
        '[data-pull-refresh-lock="true"]',
        ".alumni-story-viewer",
        ".alumni-story-composer-shell",
      ].join(",")
    )
  );
}

function brandStage(
  progress: number
) {
  if (progress < 0.58) {
    return "Alumni.";
  }

  if (progress < 0.68) {
    return "lumni.";
  }

  if (progress < 0.76) {
    return "umni.";
  }

  if (progress < 0.84) {
    return "mni.";
  }

  if (progress < 0.90) {
    return "ni.";
  }

  if (progress < 0.96) {
    return "i.";
  }

  return ".";
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

  shell.style.transition =
    animate
      ? "transform 220ms cubic-bezier(.22,.8,.24,1)"
      : "none";

  shell.style.transform =
    `translate3d(0, ${Math.max(
      0,
      value
    )}px, 0)`;
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

        pullRef.current = 70;
        setPull(70);

        setShellOffset(
          70,
          true
        );

        window.setTimeout(
          () => {
            window.location.reload();
          },
          680
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

      setShellOffset(
        0,
        false
      );

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
    Math.min(
      1,
      pull /
        TRIGGER_DISTANCE
    );

  const visible =
    refreshing ||
    pull > 3;

  const stage =
    brandStage(progress);

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
          "max(10px, env(safe-area-inset-top))",
      }}
    >
      <div
        className="flex min-h-12 items-center justify-center"
        style={{
          opacity:
            Math.min(
              1,
              pull / 22
            ),
        }}
      >
        {refreshing ? (
          <span
            className="alumni-refresh-dot-spinner"
            aria-label="Actualizando Alumni"
          >
            <span className="alumni-refresh-dot-core" />
          </span>
        ) : (
          <span
            className="alumni-refresh-brand select-none whitespace-pre"
            style={{
              transform:
                `translateY(${Math.max(
                  0,
                  7 -
                    progress * 7
                )}px)`,
            }}
          >
            {stage}
          </span>
        )}
      </div>

      <style jsx>{`
        .alumni-refresh-brand {
          font-size: 17px;
          font-weight: 900;
          letter-spacing: -0.045em;
          color: var(--app-text);
          background-image: linear-gradient(
            90deg,
            var(--app-text) 0%,
            var(--app-text) 72%,
            color-mix(
                in srgb,
                var(--app-accent) 42%,
                var(--app-text) 58%
              )
              100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 1px 0
            color-mix(
              in srgb,
              var(--app-accent) 12%,
              transparent
            );
        }

        .alumni-refresh-dot-spinner {
          position: relative;
          display: inline-flex;
          width: 22px;
          height: 22px;
          align-items: center;
          justify-content: center;
          animation:
            alumni-refresh-spin 0.78s linear infinite;
        }

        .alumni-refresh-dot-spinner::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: 999px;
          border: 2px solid
            var(--app-border);
          border-top-color:
            var(--app-accent);
          border-right-color:
            color-mix(
              in srgb,
              var(--app-accent) 70%,
              var(--app-text) 30%
            );
        }

        .alumni-refresh-dot-core {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background:
            color-mix(
              in srgb,
              var(--app-accent) 35%,
              var(--app-text) 65%
            );
        }

        @keyframes alumni-refresh-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        @media
          (prefers-reduced-motion:
            reduce) {
          .alumni-refresh-dot-spinner {
            animation-duration:
              1.6s;
          }
        }
      `}</style>
    </div>
  );
}
