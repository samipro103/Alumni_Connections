"use client";

import {
  useEffect,
} from "react";

/*
 * Stability-first motion director.
 *
 * Motion sigue siendo parte de ALUMNI, pero el director automático
 * ya no toca cualquier clase que contenga "row", "profile", "item", etc.
 * Esas coincidencias amplias podían animar contenedores estructurales.
 *
 * Las pantallas premium usan Framer Motion de forma explícita.
 * Este director queda como respaldo únicamente para superficies seguras.
 */

const SAFE_SELECTOR = [
  "[data-alumni-motion-auto-target='true']",
  ".alumni-feed-post-viewport",
  ".events2-row",
  ".community2-row",
  "[role='dialog']",
  "dialog",
  "[role='alert']",
  ".alumni-pro-toast",
].join(",");

function kindOf(
  element: HTMLElement
) {
  const role =
    element.getAttribute(
      "role"
    );

  if (
    role === "dialog" ||
    element.tagName ===
      "DIALOG"
  ) {
    return "overlay";
  }

  if (
    role === "alert" ||
    element.classList.contains(
      "alumni-pro-toast"
    )
  ) {
    return "toast";
  }

  return "card";
}

function shouldSkip(
  element: HTMLElement
) {
  if (
    element.closest(
      "[data-alumni-motion-ignore='true']"
    )
  ) {
    return true;
  }

  if (
    element.closest(
      "[data-alumni-mobile-nav='true']"
    ) ||
    element.closest(
      "[data-alumni-topbar='true']"
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

  const style =
    window.getComputedStyle(
      element
    );

  if (
    style.position ===
      "fixed" ||
    style.position ===
      "sticky"
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

    const watched =
      new WeakSet<HTMLElement>();

    const observer =
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

            observer.unobserve(
              element
            );
          }
        },
        {
          root: null,
          rootMargin:
            "0px 0px -2% 0px",
          threshold: 0.04,
        }
      );

    function register(
      element: HTMLElement,
      order = 0
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
            order,
            4
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

      observer.observe(
        element
      );
    }

    function scan(
      root:
        | Document
        | HTMLElement
    ) {
      if (
        root instanceof
          HTMLElement &&
        root.matches(
          SAFE_SELECTOR
        )
      ) {
        register(
          root,
          0
        );
      }

      root
        .querySelectorAll<HTMLElement>(
          SAFE_SELECTOR
        )
        .forEach(
          (
            element,
            index
          ) =>
            register(
              element,
              index % 5
            )
        );
    }

    scan(
      document
    );

    const mutation =
      new MutationObserver(
        (changes) => {
          for (
            const change
            of changes
          ) {
            if (
              change.type !==
              "childList"
            ) {
              continue;
            }

            for (
              const node
              of change.addedNodes
            ) {
              if (
                node instanceof
                  HTMLElement
              ) {
                scan(
                  node
                );
              }
            }
          }
        }
      );

    mutation.observe(
      document.body,
      {
        subtree: true,
        childList: true,
      }
    );

    return () => {
      mutation.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}

/* ALUMNI_MOTION_PASS_2_0_FULL_APP */
/* ALUMNI_STABILITY_PASS_1_0 */
