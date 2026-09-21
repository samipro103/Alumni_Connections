"use client";

import {
  CircleAlert,
  X,
} from "lucide-react";

export default function MessageErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="mb-2 flex items-start gap-2 rounded-[14px] border border-[color-mix(in_srgb,#ef4444_26%,var(--app-border))] bg-[color-mix(in_srgb,#ef4444_8%,var(--app-surface))] px-3 py-2.5"
      role="alert"
      aria-live="polite"
    >
      <CircleAlert
        size={15}
        className="mt-0.5 shrink-0 text-red-500"
      />

      <p className="min-w-0 flex-1 text-[11px] font-semibold leading-5 text-[var(--app-text-soft)]">
        {message}
      </p>

      <button
        type="button"
        onClick={onDismiss}
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--app-muted-2)] transition active:bg-[var(--app-soft)]"
        aria-label="Cerrar aviso"
      >
        <X size={13} />
      </button>
    </div>
  );
}

/* ALUMNI_10_2_2_MESSAGE_ERROR_BANNER */