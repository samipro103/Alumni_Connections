"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
} from "next/navigation";

const TRIGGER_DISTANCE = 68;
const MAX_PULL = 86;
const HOLD_OFFSET = 44;

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
    Math.max(
      0,
      Math.min(
        24,
        value * 0.4
      )
    );

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
      ? "transform 260ms cubic-bezier(.16,.84,.26,1)"
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
      290
    );
  }
}

function clearVisual() {
  const html =
    document.documentElement;

  delete html.dataset
    .alumniPullRefresh;

  [
    "--alumni-pull-progress",
    "--alumni-pull-group-y",
    "--alumni-pull-brand-scale",
    "--alumni-pull-side-scale",
    "--alumni-pull-light-opacity",
    "--alumni-pull-light-scale",
  ].forEach(
    (name) => {
      html.style.removeProperty(
        name
      );
    }
  );
}

function writeVisual(
  progress: number,
  state:
    | "pulling"
    | "ready"
    | "refreshing"
) {
  const html =
    document.documentElement;

  const p =
    clamp(progress);

  html.dataset.alumniPullRefresh =
    state;

  html.style.setProperty(
    "--alumni-pull-progress",
    String(p)
  );

  html.style.setProperty(
    "--alumni-pull-group-y",
    `${(
      p * 2.4
    ).toFixed(3)}px`
  );

  html.style.setProperty(
    "--alumni-pull-brand-scale",
    String(
      1 +
        p * 0.022
    )
  );

  html.style.setProperty(
    "--alumni-pull-side-scale",
    String(
      1 -
        p * 0.018
    )
  );

  html.style.setProperty(
    "--alumni-pull-light-opacity",
    String(
      0.12 +
        p * 0.76
    )
  );

  html.style.setProperty(
    "--alumni-pull-light-scale",
    String(
      0.18 +
        p * 0.82
    )
  );
}

export default function GlobalPullToRefresh() {
  const pathname =
    usePathname();

  const chatRefreshDisabled =
    Boolean(
      pathname &&
      pathname.startsWith(
        "/messages/"
      )
    );

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
      "pending" |
      "pull" |
      "scroll"
    >("pending");

  const pullRef =
    useRef(0);

  const refreshingRef =
    useRef(false);

  const visualCurrentRef =
    useRef(0);

  const visualTargetRef =
    useRef(0);

  const visualStateRef =
    useRef<
      | "idle"
      | "pulling"
      | "ready"
      | "refreshing"
    >("idle");

  const visualFrameRef =
    useRef<number | null>(
      null
    );

  function stopVisualFrame() {
    if (
      visualFrameRef.current !==
      null
    ) {
      window.cancelAnimationFrame(
        visualFrameRef.current
      );

      visualFrameRef.current =
        null;
    }
  }

  function runVisualFrame() {
    stopVisualFrame();

    const tick = () => {
      const current =
        visualCurrentRef.current;

      const target =
        visualTargetRef.current;

      const delta =
        target - current;

      const next =
        Math.abs(delta) < 0.002
          ? target
          : current +
            delta * 0.24;

      visualCurrentRef.current =
        next;

      const state =
        visualStateRef.current;

      if (
        state === "idle" &&
        next <= 0.002
      ) {
        visualCurrentRef.current =
          0;

        clearVisual();

        visualFrameRef.current =
          null;

        return;
      }

      if (
        state !== "idle"
      ) {
        writeVisual(
          next,
          state ===
            "refreshing"
            ? "refreshing"
            : next >= 0.985
            ? "ready"
            : "pulling"
        );
      }

      if (
        Math.abs(
          target - next
        ) >= 0.002 ||
        state ===
          "refreshing"
      ) {
        visualFrameRef.current =
          window.requestAnimationFrame(
            tick
          );

        return;
      }

      visualFrameRef.current =
        null;
    };

    visualFrameRef.current =
      window.requestAnimationFrame(
        tick
      );
  }

  function setVisualTarget(
    distance: number,
    refreshing = false
  ) {
    visualTargetRef.current =
      refreshing
        ? 1
        : clamp(
            distance /
              TRIGGER_DISTANCE
          );

    visualStateRef.current =
      refreshing
        ? "refreshing"
        : visualTargetRef.current >= 1
        ? "ready"
        : visualTargetRef.current > 0
        ? "pulling"
        : "idle";

    runVisualFrame();
  }

  function resetVisual() {
    visualTargetRef.current = 0;
    visualStateRef.current =
      "idle";

    runVisualFrame();
  }

  useEffect(() => {
    if (
      chatRefreshDisabled
    ) {
      activeRef.current =
        false;

      candidateRef.current =
        false;

      pullRef.current =
        0;

      refreshingRef.current =
        false;

      visualCurrentRef.current =
        0;

      visualTargetRef.current =
        0;

      visualStateRef.current =
        "idle";

      stopVisualFrame();
      clearVisual();

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

      pullRef.current =
        0;

      resetVisual();

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

      pullRef.current =
        0;
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
        Math.abs(
          deltaY
        );

      const absX =
        Math.abs(
          deltaX
        );

      if (
        candidateRef.current &&
        !activeRef.current
      ) {
        if (
          Math.max(
            absX,
            absY
          ) < 8
        ) {
          return;
        }

        const verticalPull =
          deltaY > 8 &&
          absY >
            absX * 1.18 &&
          window.scrollY <= 1;

        if (
          !verticalPull
        ) {
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
        absY * 0.82
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
          deltaY - 6
        );

      const distance =
        Math.min(
          MAX_PULL,
          effectiveDelta *
            0.46
        );

      if (
        distance < 0.5
      ) {
        return;
      }

      pullRef.current =
        distance;

      setVisualTarget(
        distance,
        false
      );

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

        pullRef.current =
          HOLD_OFFSET;

        setVisualTarget(
          TRIGGER_DISTANCE,
          true
        );

        setContentOffset(
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
      html.style
        .overscrollBehaviorY =
          previousHtml;

      body.style
        .overscrollBehaviorY =
          previousBody;

      stopVisualFrame();

      visualCurrentRef.current =
        0;

      visualTargetRef.current =
        0;

      visualStateRef.current =
        "idle";

      clearVisual();

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

  return null;
}

/* ALUMNI_PULL_REFRESH_FLUID_LIGHT_6_3 */
