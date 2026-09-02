import { reportAppError } from "@/lib/observability";

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    void reportAppError({
      kind: "unhandled_error",
      error: event.error || event.message,
      source: event.filename || "window.error",
      metadata: { component: "window" },
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void reportAppError({
      kind: "unhandled_rejection",
      error: event.reason,
      source: "window.unhandledrejection",
      metadata: { component: "promise" },
    });
  });
}
/* ALUMNI_3_7_6_CLIENT_INSTRUMENTATION */
