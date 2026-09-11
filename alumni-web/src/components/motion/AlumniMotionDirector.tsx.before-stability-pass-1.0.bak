"use client";

import {
  useEffect,
} from "react";

const MOTION_SELECTOR = [
  "article",
  "[role='dialog']",
  "dialog",
  "[role='alert']",
  "[class*='card']",
  "[class*='Card']",
  "[class*='row']",
  "[class*='Row']",
  "[class*='item']",
  "[class*='Item']",
  "[class*='tile']",
  "[class*='Tile']",
  "[class*='result']",
  "[class*='Result']",
  "[class*='post']",
  "[class*='Post']",
  "[class*='message']",
  "[class*='Message']",
  "[class*='event']",
  "[class*='Event']",
  "[class*='community']",
  "[class*='Community']",
  "[class*='profile']",
  "[class*='Profile']",
  "[class*='modal']",
  "[class*='Modal']",
  "[class*='sheet']",
  "[class*='Sheet']",
  "[class*='drawer']",
  "[class*='Drawer']",
  "[class*='popover']",
  "[class*='Popover']",
  "[class*='toast']",
  "[class*='Toast']",
  "[class*='empty']",
  "[class*='Empty']",
  "[class*='loading']",
  "[class*='Loading']",
  "[class*='skeleton']",
  "[class*='Skeleton']",
].join(",");

const EXCLUDED_HINTS = [
  "wrapper",
  "container",
  "layout",
  "shell",
  "grid",
  "header",
  "topbar",
  "sidebar",
  "rail",
  "spacer",
  "copy",
  "icon",
  "avatar",
  "badge",
  "counter",
  "label",
  "title",
];

function classText(
  element: HTMLElement
) {
  return String(
    element.className || ""
  ).toLowerCase();
}

function kindOf(
  element: HTMLElement
) {
  const classes =
    classText(element);

  const role =
    element.getAttribute(
      "role"
    );

  if (
    element.tagName ===
      "DIALOG" ||
    role ===
      "dialog" ||
    /modal|sheet|drawer|popover/.test(
      classes
    )
  ) {
    return "overlay";
  }

  if (
    role === "alert" ||
    /toast/.test(
      classes
    )
  ) {
    return "toast";
  }

  if (
    /loading|skeleton/.test(
      classes
    )
  ) {
    return "loading";
  }

  if (
    /empty/.test(
      classes
    )
  ) {
    return "status";
  }

  if (
    /message|comment/.test(
      classes
    )
  ) {
    return "conversation";
  }

  if (
    /post|card|event|community|profile/.test(
      classes
    ) ||
    element.tagName ===
      "ARTICLE"
  ) {
    return "card";
  }

  return "row";
}

function shouldSkip(
  element: HTMLElement
) {
  if (
    element.dataset
      .alumniMotionManual ===
      "true" ||
    element.closest(
      "[data-alumni-motion-ignore='true']"
    )
  ) {
    return true;
  }

  if (
    element.dataset
      .alumniMotionAuto
  ) {
    return true;
  }

  if (
    element ===
      document.body ||
    element ===
      document.documentElement
  ) {
    return true;
  }

  const classes =
    classText(element);

  const hasStrongHint =
    /modal|sheet|drawer|popover|toast|loading|skeleton|empty/.test(
      classes
    ) ||
    element.getAttribute(
      "role"
    ) ===
      "dialog" ||
    element.tagName ===
      "DIALOG";

  if (
    !hasStrongHint &&
    EXCLUDED_HINTS.some(
      (hint) =>
        classes.includes(
          hint
        )
    )
  ) {
    return true;
  }

  if (
    element.closest(
      "[data-alumni-mobile-nav='true']"
    )
  ) {
    return true;
  }

  return false;
}

export default function AlumniMotionDirector() {
  useEffect(() => {
    const reduced =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    let frame = 0;

    const watched =
      new WeakSet<HTMLElement>();

    const intersection =
      new IntersectionObserver(
        (entries) => {
          for (
            const entry
            of entries
          ) {
            if (
              !entry.isIntersecting
            ) {
              continue;
            }

            const element =
              entry.target as HTMLElement;

            element.dataset.alumniMotionState =
              "visible";

            intersection.unobserve(
              element
            );
          }
        },
        {
          root: null,
          rootMargin:
            "0px 0px -3% 0px",
          threshold: 0.04,
        }
      );

    function register(
      element: HTMLElement,
      index = 0
    ) {
      if (
        watched.has(
          element
        ) ||
        shouldSkip(
          element
        )
      ) {
        return;
      }

      const rect =
        element.getBoundingClientRect();

      const classes =
        classText(element);

      const potentiallyHidden =
        /modal|sheet|drawer|popover|toast/.test(
          classes
        ) ||
        element.getAttribute(
          "role"
        ) ===
          "dialog" ||
        element.tagName ===
          "DIALOG";

      if (
        !potentiallyHidden &&
        (
          rect.width < 56 ||
          rect.height < 26
        )
      ) {
        return;
      }

      if (
        rect.width === 0 &&
        rect.height === 0
      ) {
        return;
      }

      watched.add(
        element
      );

      element.dataset.alumniMotionAuto =
        "true";
      element.dataset.alumniMotionKind =
        kindOf(
          element
        );

      element.style.setProperty(
        "--alumni-motion-order",
        String(
          Math.min(
            index,
            5
          )
        )
      );

      if (reduced) {
        element.dataset.alumniMotionState =
          "visible";
        return;
      }

      element.dataset.alumniMotionState =
        "pending";

      intersection.observe(
        element
      );
    }

    function scan(
      root:
        | Document
        | HTMLElement
    ) {
      const candidates =
        root.querySelectorAll<HTMLElement>(
          MOTION_SELECTOR
        );

      candidates.forEach(
        (
          element,
          index
        ) => {
          register(
            element,
            index % 6
          );
        }
      );

      if (
        root instanceof
          HTMLElement &&
        root.matches(
          MOTION_SELECTOR
        )
      ) {
        register(
          root
        );
      }
    }

    function scheduleScan(
      root:
        | Document
        | HTMLElement =
          document
    ) {
      window.cancelAnimationFrame(
        frame
      );

      frame =
        window.requestAnimationFrame(
          () => {
            scan(root);
          }
        );
    }

    scheduleScan(
      document
    );

    const mutation =
      new MutationObserver(
        (mutations) => {
          for (
            const change
            of mutations
          ) {
            if (
              change.type ===
                "childList"
            ) {
              for (
                const node
                of change.addedNodes
              ) {
                if (
                  node instanceof
                    HTMLElement
                ) {
                  scheduleScan(
                    node
                  );
                }
              }
            }

            if (
              change.type ===
                "attributes" &&
              change.target instanceof
                HTMLElement &&
              !change.target.dataset
                .alumniMotionAuto
            ) {
              scheduleScan(
                change.target
              );
            }
          }
        }
      );

    mutation.observe(
      document.body,
      {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "open",
          "aria-hidden",
          "data-state",
        ],
      }
    );

    return () => {
      window.cancelAnimationFrame(
        frame
      );
      mutation.disconnect();
      intersection.disconnect();
    };
  }, []);

  return null;
}

/* ALUMNI_MOTION_PASS_2_0_FULL_APP */
