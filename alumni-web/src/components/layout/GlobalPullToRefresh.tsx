"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

const TRIGGER_DISTANCE = 78;
const MAX_PULL = 116;

function blockedTarget(
  target: EventTarget | null
) {
  if (
    !(target instanceof Element)
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

function brandStage(
  progress: number
) {
  if (progress < 0.14) {
    return "Alumni.";
  }

  if (progress < 0.28) {
    return "lumni.";
  }

  if (progress < 0.42) {
    return "umni.";
  }

  if (progress < 0.56) {
    return "mni.";
  }

  if (progress < 0.70) {
    return "ni.";
  }

  if (progress < 0.84) {
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

      /*
        Resistencia:
        el contenido sí baja, pero menos
        que el movimiento del dedo.
      */
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

        pullRef.current = 68;
        setPull(68);

        setShellOffset(
          68,
          true
        );

        /*
          Deja ver la animación del punto
          antes de ejecutar la recarga real.
        */
        window.setTimeout(
          () => {
            window.location.reload();
          },
          650
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
              pull / 24
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
            className="select-none whitespace-pre text-[17px] font-black tracking-[-0.045em] text-[var(--app-text)]"
            style={{
              transform:
                `translateY(${Math.max(
                  0,
                  8 -
                    progress * 8
                )}px)`,
              opacity:
                0.55 +
                progress * 0.45,
            }}
          >
            {stage}
          </span>
        )}
      </div>

      <style jsx>{`
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
            var(--app-accent);
        }

        .alumni-refresh-dot-core {
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background:
            var(--app-text);
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
