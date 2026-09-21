"use client";

export type OutboxScope =
  | "direct"
  | "group";

export type AlumniOutboxItem = {
  id: string;
  scope: OutboxScope;
  conversationId: string;
  receiverId?: string;
  content: string;
  replyToId?: number | null;
  createdAt: string;
};

type OutboxRetryDetail = {
  scope: OutboxScope;
  conversationId: string;
};

const KEY =
  "alumni-message-outbox-v1";

export const OUTBOX_CHANGE_EVENT =
  "alumni-message-outbox-change";

export const OUTBOX_RETRY_EVENT =
  "alumni-message-outbox-retry";

function notifyOutboxChange() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      OUTBOX_CHANGE_EVENT
    )
  );
}

export function getOutbox():
  AlumniOutboxItem[] {
  if (
    typeof window ===
    "undefined"
  ) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          KEY
        ) || "[]"
      );

    return Array.isArray(
      parsed
    )
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function setOutbox(
  items:
    AlumniOutboxItem[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    KEY,
    JSON.stringify(
      items
    )
  );

  notifyOutboxChange();
}

export function queueOutbox(
  item: AlumniOutboxItem
) {
  const current =
    getOutbox();

  if (
    current.some(
      (entry) =>
        entry.id ===
        item.id
    )
  ) {
    return;
  }

  setOutbox([
    ...current,
    item,
  ]);
}

export function removeOutbox(
  id: string
) {
  setOutbox(
    getOutbox().filter(
      (item) =>
        item.id !== id
    )
  );
}

export function outboxFor(
  scope: OutboxScope,
  conversationId: string
) {
  return getOutbox().filter(
    (item) =>
      item.scope ===
        scope &&
      item.conversationId ===
        conversationId
  );
}

export function requestOutboxRetry(
  scope: OutboxScope,
  conversationId: string
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<OutboxRetryDetail>(
      OUTBOX_RETRY_EVENT,
      {
        detail: {
          scope,
          conversationId,
        },
      }
    )
  );
}

export function matchesOutboxRetryEvent(
  event: Event,
  scope: OutboxScope,
  conversationId: string
) {
  if (
    typeof CustomEvent ===
      "undefined" ||
    !(
      event instanceof
      CustomEvent
    )
  ) {
    return false;
  }

  const detail =
    event.detail as
      | OutboxRetryDetail
      | undefined;

  return (
    detail?.scope ===
      scope &&
    detail
      .conversationId ===
      conversationId
  );
}

/* ALUMNI_10_2_OUTBOX_RELIABILITY */