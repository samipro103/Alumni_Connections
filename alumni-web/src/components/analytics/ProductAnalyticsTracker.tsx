"use client";

import {
  useEffect,
  useRef,
} from "react";
import {
  usePathname,
} from "next/navigation";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

const SESSION_KEY =
  "alumni:product-intelligence:session:v1";
const SESSION_STARTED_KEY =
  "alumni:product-intelligence:started:v1";

const EXCLUDED_PREFIXES = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/mfa",
];

function makeUuid() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  const bytes =
    new Uint8Array(16);

  crypto.getRandomValues(bytes);

  bytes[6] =
    (bytes[6] & 0x0f) | 0x40;
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80;

  const value =
    Array.from(bytes)
      .map((item) =>
        item
          .toString(16)
          .padStart(2, "0")
      )
      .join("");

  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join("-");
}

function sessionId() {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const existing =
      window.sessionStorage.getItem(
        SESSION_KEY
      );

    if (existing) {
      return existing;
    }

    const created =
      makeUuid();

    window.sessionStorage.setItem(
      SESSION_KEY,
      created
    );

    return created;
  } catch {
    return makeUuid();
  }
}

function normalizeRoute(
  pathname: string
) {
  const clean =
    pathname
      .split("?")[0]
      .replace(/\/+$/, "") ||
    "/";

  const parts =
    clean.split("/");

  if (
    parts[1] === "events" &&
    parts.length >= 3
  ) {
    return "/events/[id]";
  }

  if (
    parts[1] === "community" &&
    parts.length >= 3
  ) {
    return "/community/[slug]";
  }

  if (
    parts[1] === "messages" &&
    parts.length >= 3
  ) {
    return "/messages/[username]";
  }

  if (
    parts[1] === "u" &&
    parts.length >= 3
  ) {
    return "/u/[username]";
  }

  return clean;
}

function shouldTrack(
  pathname: string
) {
  return !EXCLUDED_PREFIXES.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(
        `${prefix}/`
      )
  );
}

function displayMode() {
  if (
    typeof window === "undefined"
  ) {
    return "unknown";
  }

  return window.matchMedia(
    "(display-mode: standalone)"
  ).matches
    ? "standalone"
    : "web";
}

function widthBucket() {
  if (
    typeof window === "undefined"
  ) {
    return "unknown";
  }

  const width =
    window.innerWidth;

  if (width <= 374) {
    return "small_phone";
  }

  if (width <= 430) {
    return "phone";
  }

  if (width <= 768) {
    return "tablet";
  }

  return "desktop";
}

export default function ProductAnalyticsTracker() {
  const pathname =
    usePathname();

  const {
    user,
    loading,
  } = useAuth();

  const previousRef =
    useRef("");

  useEffect(() => {
    if (
      loading ||
      !user?.id ||
      !pathname ||
      !shouldTrack(pathname)
    ) {
      return;
    }

    const route =
      normalizeRoute(pathname);

    const key =
      `${user.id}:${route}`;

    if (
      previousRef.current === key
    ) {
      return;
    }

    previousRef.current = key;

    const id =
      sessionId();

    if (!id) {
      return;
    }

    const properties = {
      display_mode:
        displayMode(),
      viewport:
        widthBucket(),
    };

    void supabase.rpc(
      "alumni_track_product_event_v1",
      {
        p_event_name:
          "page_view",
        p_route:
          route,
        p_session_id:
          id,
        p_properties:
          properties,
      }
    );

    try {
      const started =
        window.sessionStorage.getItem(
          SESSION_STARTED_KEY
        );

      if (!started) {
        window.sessionStorage.setItem(
          SESSION_STARTED_KEY,
          "1"
        );

        void supabase.rpc(
          "alumni_track_product_event_v1",
          {
            p_event_name:
              "session_start",
            p_route:
              route,
            p_session_id:
              id,
            p_properties:
              properties,
          }
        );
      }
    } catch {
      // sessionStorage unavailable:
      // page_view is still enough.
    }
  }, [
    loading,
    pathname,
    user?.id,
  ]);

  return null;
}

/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:TRACKER */
