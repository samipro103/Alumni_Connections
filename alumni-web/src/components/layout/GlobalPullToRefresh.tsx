"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

const TRIGGER_DISTANCE = 72;
const MAX_PULL = 92;
const HOLD_OFFSET = 58;

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
        38,
        value * 0.64
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
      ? "transform 230ms cubic-bezier(.2,.8,.2,1)"
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
      250
    );
  }
}

function setTopbarRefreshVisual(
  distance: number,
  refreshing = false
) {
  const html =
    document.documentElement;

  const progress =
    refreshing
      ? 1
      : clamp(
          distance /
            TRIGGER_DISTANCE
        );

  if (
    distance <= 0 &&
    !refreshing
  ) {
    delete html.dataset
      .alumniPullRefresh;

    html.style.removeProperty(
      "--alumni-pull-progress"
    );

    html.style.removeProperty(
      "--alumni-pull-row-y"
    );

    html.style.removeProperty(
      "--alumni-pull-brand-x"
    );

    html.style.removeProperty(
      "--alumni-pull-brand-scale"
    );

    html.style.removeProperty(
      "--alumni-pull-bell-y"
    );

    html.style.removeProperty(
      "--alumni-pull-bell-rotate"
    );

    html.style.removeProperty(
      "--alumni-pull-avatar-y"
    );

    html.style.removeProperty(
      "--alumni-pull-avatar-scale"
    );

    html.style.removeProperty(
      "--alumni-pull-label-opacity"
    );

    return;
  }

  html.dataset.alumniPullRefresh =
    refreshing
      ? "refreshing"
      : progress >= 1
      ? "ready"
      : "pulling";

  html.style.setProperty(
    "--alumni-pull-progress",
    String(progress)
  );

  html.style.setProperty(
    "--alumni-pull-row-y",
    `${(
      progress * 4.5
    ).toFixed(2)}px`
  );

  html.style.setProperty(
    "--alumni-pull-brand-x",
    `${(
      progress * 2.5
    ).toFixed(2)}px`
  );

  html.style.setProperty(
    "--alumni-pull-brand-scale",
    String(
      1 +
        progress * 0.045
    )
  );

  html.style.setProperty(
    "--alumni-pull-bell-y",
    `${(
      progress * 2
    ).toFixed(2)}px`
  );

  html.style.setProperty(
    "--alumni-pull-bell-rotate",
    `${(
      progress * 9
    ).toFixed(2)}deg`
  );

  html.style.setProperty(
    "--alumni-pull-avatar-y",
    `${(
      progress * 2.5
    ).toFixed(2)}px`
  );

  html.style.setProperty(
    "--alumni-pull-avatar-scale",
    String(
      1 -
        progress * 0.035
    )
  );

  html.style.setProperty(
    "--alumni-pull-label-opacity",
    String(
      clamp(
        (progress - 0.12) /
          0.88
      )
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
      "pending" |
      "pull" |
      "scroll"
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
    setTopbarRefreshVisual(
      pull,
      refreshing
    );
  }, [
    pull,
    refreshing,
  ]);

  useEffect(() => {
    if (
      chatRefreshDisabled
    ) {
      activeRef.current =
        false;

      candidateRef.current =
        false;

      pullRef.current = 0;

      refreshingRef.current =
        false;

      setPull(0);
      setRefreshing(false);

      setTopbarRefreshVisual(
        0,
        false
      );

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

      setTopbarRefreshVisual(
        0,
        false
      );

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
          ) < 10
        ) {
          return;
        }

        const verticalPull =
          deltaY > 10 &&
          absY >
            absX * 1.2 &&
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
          effectiveDelta *
            0.47
        );

      if (
        distance < 1
      ) {
        return;
      }

      pullRef.current =
        distance;

      setPull(
        distance
      );

      setTopbarRefreshVisual(
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

        setRefreshing(true);

        pullRef.current =
          HOLD_OFFSET;

        setPull(
          HOLD_OFFSET
        );

        setTopbarRefreshVisual(
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
          820
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

      setTopbarRefreshVisual(
        0,
        false
      );

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

/* ALUMNI_PULL_REFRESH_UNIFIED_TOPBAR_6_2 */
