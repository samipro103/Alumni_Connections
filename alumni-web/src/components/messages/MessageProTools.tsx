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
  mine,
  currentUserId,
  onReply,
  onReact,
}: {
  message: any;
  messages?: any[];
  mine: boolean;
  currentUserId?:
    | string
    | null;
  onReply: () => void;
  onReact: (
    emoji: string
  ) => void | Promise<void>;
}) {
  const [open, setOpen] =
    useState(false);

  const grouped =
    useMemo(() => {
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
      className={`mt-0.5 flex max-w-[78%] items-center gap-1 ${
        mine
          ? "ml-auto justify-end"
          : "mr-auto justify-start"
      } sm:max-w-[64%]`}
    >
      {grouped.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
                className={`rounded-full border px-1.5 py-0.5 text-[9px] leading-4 ${
                  info.mine
                    ? "border-[color-mix(in_srgb,var(--app-accent)_32%,transparent)] bg-[var(--app-accent-soft)]"
                    : "border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_78%,transparent)]"
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

      <div className="relative flex items-center gap-0.5">
        <button
          type="button"
          onClick={onReply}
          className="hidden h-6 w-6 items-center justify-center rounded-full text-[var(--app-muted-3)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)] sm:flex"
          aria-label="Responder mensaje"
          title="Responder"
        >
          <Reply size={12} />
        </button>

        <button
          type="button"
          onClick={() =>
            setOpen(
              (value) =>
                !value
            )
          }
          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--app-muted-3)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Reaccionar"
          title="Reaccionar"
        >
          <SmilePlus
            size={12}
          />
        </button>

        {open && (
          <div
            className={`absolute bottom-7 z-[130] flex gap-0.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[0_14px_40px_var(--app-shadow)] ${
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
                    setOpen(
                      false
                    );
                    void onReact(
                      emoji
                    );
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[15px] transition hover:bg-[var(--app-soft)]"
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
