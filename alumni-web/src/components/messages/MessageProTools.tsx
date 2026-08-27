"use client";

import {
  EyeOff,
  MoreHorizontal,
  Pencil,
  Reply,
  SmilePlus,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
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
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}: {
  message: any;
  messages?: any[];
  mine: boolean;
  currentUserId?: string | null;
  onReply: () => void;
  onReact: (
    emoji: string
  ) => void | Promise<void>;
  onEdit?: () => void;
  onDeleteForMe?: () => void;
  onDeleteForEveryone?: () => void;
}) {
  const [reactionOpen, setReactionOpen] =
    useState(false);
  const [menuOpen, setMenuOpen] =
    useState(false);
  const menuRef =
    useRef<HTMLDivElement>(null);

  const deleted =
    Boolean(message?.deleted_at) ||
    message?.message_type === "deleted";

  const createdAt =
    new Date(
      message?.created_at || 0
    ).getTime();

  const canEdit =
    mine &&
    Boolean(message?.content) &&
    Number.isFinite(createdAt) &&
    Date.now() - createdAt <=
      30 * 60 * 1000;

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

  useEffect(() => {
    if (!menuOpen) return;

    function close(
      event: PointerEvent
    ) {
      const target =
        event.target;

      if (
        menuRef.current &&
        target instanceof Node &&
        !menuRef.current.contains(
          target
        )
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      close
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        close
      );
    };
  }, [menuOpen]);

  if (deleted) {
    return null;
  }

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
                className={`rounded-full border px-1.5 py-0.5 text-[10px] leading-4 ${
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

      <div
        ref={menuRef}
        className="relative flex items-center gap-0.5"
      >
        <button
          type="button"
          onClick={onReply}
          className="hidden h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)] sm:flex"
          aria-label="Responder mensaje"
          title="Responder"
        >
          <Reply size={13} />
        </button>

        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            setReactionOpen(
              (value) =>
                !value
            );
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Reaccionar"
          title="Reaccionar"
        >
          <SmilePlus size={13} />
        </button>

        <button
          type="button"
          onClick={() => {
            setReactionOpen(false);
            setMenuOpen(
              (value) =>
                !value
            );
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--app-muted-2)] transition hover:bg-[var(--app-soft)] hover:text-[var(--app-text)]"
          aria-label="Más acciones"
          title="Más"
        >
          <MoreHorizontal size={14} />
        </button>

        {reactionOpen && (
          <div
            className={`absolute bottom-8 z-[150] flex gap-0.5 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[0_14px_40px_var(--app-shadow)] ${
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
                    setReactionOpen(
                      false
                    );
                    void onReact(
                      emoji
                    );
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[16px] transition hover:bg-[var(--app-soft)]"
                >
                  {emoji}
                </button>
              )
            )}
          </div>
        )}

        {menuOpen && (
          <div
            className={`absolute bottom-8 z-[160] w-48 overflow-hidden rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-[0_18px_48px_var(--app-shadow)] ${
              mine
                ? "right-0"
                : "left-0"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onReply();
              }}
              className="flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[12px] font-bold text-[var(--app-text-soft)] hover:bg-[var(--app-soft)]"
            >
              <Reply size={15} />
              Responder
            </button>

            {canEdit &&
              onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[12px] font-bold text-[var(--app-text-soft)] hover:bg-[var(--app-soft)]"
                >
                  <Pencil size={15} />
                  Editar
                </button>
              )}

            {onDeleteForMe && (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteForMe();
                }}
                className="flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[12px] font-bold text-[var(--app-text-soft)] hover:bg-[var(--app-soft)]"
              >
                <EyeOff size={15} />
                Eliminar para mí
              </button>
            )}

            {mine &&
              onDeleteForEveryone && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteForEveryone();
                  }}
                  className="flex min-h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-[12px] font-bold text-[#ef6b75] hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                  Eliminar para todos
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ALUMNI_1_5_0_MESSAGE_TOOLS */

/* ALUMNI_1_8_1_PROFILE_RESTORE_PIN_EDIT_LIMITS:CHAT_EDIT_30_MIN */
