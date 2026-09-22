"use client";

import {
  useEffect,
} from "react";
import {
  reportAppError,
} from "@/lib/observability";

function rejectionMessage(
  reason: unknown
) {
  if (
    reason instanceof Error
  ) {
    return reason.message;
  }

  if (
    typeof reason ===
      "string"
  ) {
    return reason;
  }

  try {
    return JSON.stringify(
      reason
    );
  } catch {
    return String(
      reason
    );
  }
}

export default function ObservabilityBootstrap() {
  useEffect(() => {
    function onError(
      event: ErrorEvent
    ) {
      void reportAppError({
        kind:
          "unhandled_error",
        severity:
          "error",
        error:
          event.error ||
          event.message,
        message:
          event.message ||
          "Unhandled browser error",
        source:
          event.filename ||
          "window.error",
        metadata: {
          action:
            "window_error",
        },
      });
    }

    function onUnhandledRejection(
      event:
        PromiseRejectionEvent
    ) {
      const reason =
        event.reason;

      void reportAppError({
        kind:
          "unhandled_rejection",
        severity:
          "error",
        error:
          reason,
        message:
          rejectionMessage(
            reason
          ) ||
          "Unhandled promise rejection",
        source:
          "window.unhandledrejection",
        metadata: {
          action:
            "unhandled_rejection",
        },
      });
    }

    window.addEventListener(
      "error",
      onError
    );

    window.addEventListener(
      "unhandledrejection",
      onUnhandledRejection
    );

    return () => {
      window.removeEventListener(
        "error",
        onError
      );

      window.removeEventListener(
        "unhandledrejection",
        onUnhandledRejection
      );
    };
  }, []);

  return null;
}

/* ALUMNI_10_8_OBSERVABILITY_BOOTSTRAP */