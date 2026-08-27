"use client";

export type AlumniOutboxItem = {
  id: string;
  scope: "direct" | "group";
  conversationId: string;
  receiverId?: string;
  content: string;
  replyToId?: number | null;
  createdAt: string;
};

const KEY = "alumni-message-outbox-v1";

export function getOutbox(): AlumniOutboxItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      localStorage.getItem(KEY) || "[]"
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function setOutbox(
  items: AlumniOutboxItem[]
) {
  localStorage.setItem(
    KEY,
    JSON.stringify(items)
  );
}

export function queueOutbox(
  item: AlumniOutboxItem
) {
  const current = getOutbox();

  if (
    current.some(
      (entry) =>
        entry.id === item.id
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
  scope: "direct" | "group",
  conversationId: string
) {
  return getOutbox().filter(
    (item) =>
      item.scope === scope &&
      item.conversationId ===
        conversationId
  );
}

/* ALUMNI_1_5_0_OUTBOX */
