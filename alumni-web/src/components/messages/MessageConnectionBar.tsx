"use client";

import {
  Clock3,
  RotateCw,
  WifiOff,
} from "lucide-react";
import {
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  OUTBOX_CHANGE_EVENT,
  outboxFor,
  requestOutboxRetry,
  type OutboxScope,
} from "@/lib/messageOutbox";

function subscribe(
  notify: () => void
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return () => {};
  }

  window.addEventListener(
    "online",
    notify
  );

  window.addEventListener(
    "offline",
    notify
  );

  window.addEventListener(
    OUTBOX_CHANGE_EVENT,
    notify
  );

  return () => {
    window.removeEventListener(
      "online",
      notify
    );

    window.removeEventListener(
      "offline",
      notify
    );

    window.removeEventListener(
      OUTBOX_CHANGE_EVENT,
      notify
    );
  };
}

export default function MessageConnectionBar({
  scope,
  conversationId,
}: {
  scope: OutboxScope;
  conversationId: string;
}) {
  const getSnapshot =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return "online:0";
      }

      const online =
        navigator.onLine;

      const queued =
        outboxFor(
          scope,
          conversationId
        ).length;

      return `${
        online
          ? "online"
          : "offline"
      }:${queued}`;
    }, [
      scope,
      conversationId,
    ]);

  const snapshot =
    useSyncExternalStore(
      subscribe,
      getSnapshot,
      () => "online:0"
    );

  const [
    networkState,
    queuedValue,
  ] =
    snapshot.split(":");

  const online =
    networkState ===
    "online";

  const queuedCount =
    Number(
      queuedValue || 0
    );

  if (
    online &&
    queuedCount === 0
  ) {
    return null;
  }

  return (
    <div
      className="relative z-40 shrink-0 border-b border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_94%,var(--app-accent)_6%)] px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex w-full max-w-[760px] items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted-2)]">
          {online ? (
            <Clock3
              size={14}
            />
          ) : (
            <WifiOff
              size={14}
            />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-black text-[var(--app-text-soft)]">
            {online
              ? `${queuedCount} ${
                  queuedCount ===
                  1
                    ? "mensaje pendiente"
                    : "mensajes pendientes"
                }`
              : "Sin conexión"}
          </p>

          <p className="mt-0.5 truncate text-[9.5px] font-semibold text-[var(--app-muted-2)]">
            {!online &&
            queuedCount > 0
              ? `${queuedCount} ${
                  queuedCount ===
                  1
                    ? "mensaje de texto se enviará"
                    : "mensajes de texto se enviarán"
                } al volver la conexión.`
              : !online
              ? "Puedes escribir texto; los archivos requieren conexión."
              : "La conexión volvió. Puedes reintentar ahora."}
          </p>
        </div>

        {online &&
          queuedCount > 0 && (
          <button
            type="button"
            onClick={() =>
              requestOutboxRetry(
                scope,
                conversationId
              )
            }
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-[10px] font-black text-[var(--app-text-soft)] transition active:bg-[var(--app-soft)]"
          >
            <RotateCw
              size={12}
            />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

/* ALUMNI_10_2_MESSAGE_CONNECTION_BAR */