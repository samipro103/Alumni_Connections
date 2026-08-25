"use client";

import {
  Reply,
  SmilePlus,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

const EMOJIS = [
  "❤️",
  "👍",
  "😂",
  "😮",
  "😢",
  "👏",
];

export default function MessageProTools({
  message,
  messages,
  mine,
  currentUserId,
  onReply,
  onReact,
}: {
  message: any;
  messages: any[];
  mine: boolean;
  currentUserId?: string | null;
  onReply: () => void;
  onReact: (
    emoji: string
  ) => void | Promise<void>;
}) {
  const [open, setOpen] =
    useState(false);

  const reply = useMemo(
    () =>
      message.reply_to_id
        ? messages.find(
            (item) =>
              item.id ===
              message.reply_to_id
          )
        : null,
    [
      message.reply_to_id,
      messages,
    ]
  );

  const grouped = useMemo(() => {
    const map =
      new Map<
        string,
        {
          count: number;
          mine: boolean;
        }
      >();

    for (
      const reaction of
      message.reactions || []
    ) {
      const current =
        map.get(
          reaction.emoji
        ) || {
          count: 0,
          mine: false,
        };

      current.count += 1;
      current.mine =
        current.mine ||
        reaction.user_id ===
          currentUserId;

      map.set(
        reaction.emoji,
        current
      );
    }

    return [
      ...map.entries(),
    ];
  }, [
    message.reactions,
    currentUserId,
  ]);

  return (
    <div
      className={`mt-1 flex max-w-[84%] flex-col ${
        mine
          ? "ml-auto items-end"
          : "mr-auto items-start"
      } sm:max-w-[72%]`}
    >
      {reply && (
        <button
          type="button"
          onClick={() => {}}
          className="mb-1 max-w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-soft)] px-2.5 py-1.5 text-left"
        >
          <p className="max-w-[260px] truncate text-[10px] font-bold text-[var(--app-muted)]">
            ↩{" "}
            {reply.content ||
              reply.media_name ||
              "Mensaje"}
          </p>
        </button>
      )}

      {grouped.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1">
          {grouped.map(
            ([
              emoji,
              info,
            ]) => (
              <button
                key={emoji}
                type="button"
                onClick={() =>
                  void onReact(
                    emoji
                  )
                }
                className={`rounded-full border px-2 py-1 text-[10px] ${
                  info.mine
                    ? "border-[var(--app-accent)]/30 bg-[var(--app-accent-soft)]"
                    : "border-[var(--app-border)] bg-[var(--app-soft)]"
                }`}
              >
                {emoji}
                {info.count > 1
                  ? ` ${info.count}`
                  : ""}
              </button>
            )
          )}
        </div>
      )}

      <div className="relative flex items-center gap-1 opacity-100 sm:transition">
        <button
          type="button"
          onClick={onReply}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted-3)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Responder mensaje"
          title="Responder"
        >
          <Reply size={13} />
        </button>

        <button
          type="button"
          onClick={() =>
            setOpen(
              (value) => !value
            )
          }
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted-3)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Reaccionar"
          title="Reaccionar"
        >
          <SmilePlus size={13} />
        </button>

        {open && (
          <div
            className={`absolute bottom-8 z-[130] flex gap-1 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[0_14px_40px_var(--app-shadow)] ${
              mine
                ? "right-0"
                : "left-0"
            }`}
          >
            {EMOJIS.map(
              (emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void onReact(
                      emoji
                    );
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base transition hover:bg-[var(--app-soft)]"
                >
                  {emoji}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
