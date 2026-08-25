"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Loader2,
  RefreshCw,
} from "lucide-react";

const TRIGGER_DISTANCE = 74;
const MAX_PULL = 112;

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

    /*
      Desactiva el pull-to-refresh nativo
      del navegador para usar solamente
      la interacción visual de Alumni.
    */
    html.style.overscrollBehaviorY =
      "none";

    body.style.overscrollBehaviorY =
      "none";

    function reset() {
      activeRef.current = false;
      pullRef.current = 0;
      setPull(0);
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

      /*
        Si el gesto es horizontal,
        no interferimos con carruseles,
        historias o navegación.
      */
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
        Resistencia progresiva:
        se siente como una app nativa
        y evita que el contenido "salte".
      */
      const distance =
        Math.min(
          MAX_PULL,
          deltaY * 0.48
        );

      pullRef.current =
        distance;

      setPull(distance);
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

        pullRef.current = 62;
        setPull(62);

        /*
          Recarga real:
          vuelve a consultar toda la
          pantalla actual y sus providers.
        */
        window.setTimeout(
          () => {
            window.location.reload();
          },
          260
        );

        return;
      }

      pullRef.current = 0;
      setPull(0);
    }

    function onTouchCancel() {
      reset();
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

  const armed =
    progress >= 1;

  const visible =
    refreshing ||
    pull > 4;

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 z-[99990] flex -translate-x-1/2 items-center gap-2.5 transition-[opacity,transform] duration-150 ${
        visible
          ? "opacity-100"
          : "opacity-0"
      }`}
      style={{
        top:
          "max(8px, env(safe-area-inset-top))",
        transform: `translate3d(-50%, ${
          visible
            ? Math.max(
                0,
                pull * 0.12
              )
            : -16
        }px, 0)`,
      }}
    >
      <span className="relative flex h-8 w-8 items-center justify-center">
        {refreshing ? (
          <Loader2
            size={19}
            className="animate-spin text-[var(--app-accent)]"
          />
        ) : (
          <>
            <svg
              viewBox="0 0 36 36"
              className="absolute inset-0 h-8 w-8 -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--app-border)]"
              />

              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="87.96"
                strokeDashoffset={
                  87.96 *
                  (1 -
                    progress)
                }
                className="text-[var(--app-accent)] transition-[stroke-dashoffset] duration-75"
              />
            </svg>

            <RefreshCw
              size={12}
              className={`text-[var(--app-text)] transition-transform duration-150 ${
                armed
                  ? "rotate-180"
                  : ""
              }`}
            />
          </>
        )}
      </span>

      <div className="min-w-0">
        <p className="whitespace-nowrap text-[9px] font-black uppercase tracking-[0.16em] text-[var(--app-text)]">
          {refreshing
            ? "Actualizando Alumni"
            : armed
            ? "Suelta para actualizar"
            : "Desliza para actualizar"}
        </p>

        <span className="mt-1 block h-px w-full overflow-hidden bg-[var(--app-border)]">
          <span
            className="block h-full bg-[var(--app-accent)] transition-[width] duration-75"
            style={{
              width: `${
                refreshing
                  ? 100
                  : progress *
                    100
              }%`,
            }}
          />
        </span>
      </div>
    </div>
  );
}
