"use client";

import {
  BellOff,
  BellRing,
  Flag,
  Loader2,
  MoreHorizontal,
  ShieldBan,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

const REASONS = [
  ["spam", "Spam"],
  ["harassment", "Acoso"],
  ["impersonation", "Suplantación"],
  ["inappropriate", "Contenido inapropiado"],
  ["fraud", "Fraude o estafa"],
  ["privacy", "Privacidad"],
  ["other", "Otro"],
] as const;

export default function UserSafetyActions({
  targetUserId,
  targetUsername,
  onBlocked,
}: {
  targetUserId: string;
  targetUsername: string;
  onBlocked?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] =
    useState(false);
  const [reportOpen, setReportOpen] =
    useState(false);
  const [muted, setMuted] =
    useState(false);
  const [blocked, setBlocked] =
    useState(false);
  const [busy, setBusy] =
    useState(false);
  const [reason, setReason] =
    useState("spam");
  const [details, setDetails] =
    useState("");
  const menuRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      !user ||
      user.id === targetUserId
    ) {
      return;
    }

    let active = true;

    void (async () => {
      const [
        { data: mute },
        { data: block },
      ] = await Promise.all([
        supabase
          .from("user_mutes")
          .select("muted_user_id")
          .eq("user_id", user.id)
          .eq(
            "muted_user_id",
            targetUserId
          )
          .maybeSingle(),
        supabase
          .from("user_blocks")
          .select("blocked_id")
          .eq("blocker_id", user.id)
          .eq(
            "blocked_id",
            targetUserId
          )
          .maybeSingle(),
      ]);

      if (active) {
        setMuted(Boolean(mute));
        setBlocked(Boolean(block));
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.id, targetUserId]);

  useEffect(() => {
    if (!open) return;

    const close = (
      event: PointerEvent
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      close
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        close
      );
  }, [open]);

  if (
    !user ||
    user.id === targetUserId
  ) {
    return null;
  }

  async function toggleMute() {
    if (!user || busy) return;
    setBusy(true);

    try {
      if (muted) {
        const { error } =
          await supabase
            .from("user_mutes")
            .delete()
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "muted_user_id",
              targetUserId
            );

        if (error) throw error;
        setMuted(false);
      } else {
        const { error } =
          await supabase
            .from("user_mutes")
            .insert({
              user_id: user.id,
              muted_user_id:
                targetUserId,
            });

        if (error) throw error;
        setMuted(true);
      }

      setOpen(false);
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo actualizar el silencio."
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleBlock() {
    if (!user || busy) return;

    const accepted = blocked
      ? confirm(
          `¿Desbloquear a @${targetUsername}?`
        )
      : confirm(
          `¿Bloquear a @${targetUsername}? Ya no podrán seguirse, ver contenido privado ni enviarse mensajes.`
        );

    if (!accepted) return;

    setBusy(true);

    try {
      const { error } =
        await supabase.rpc(
          blocked
            ? "unblock_user"
            : "block_user",
          {
            p_target:
              targetUserId,
          }
        );

      if (error) throw error;

      setBlocked(!blocked);
      setOpen(false);

      if (!blocked) {
        onBlocked?.();
      }
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo actualizar el bloqueo."
      );
    } finally {
      setBusy(false);
    }
  }

  async function submitReport() {
    if (
      !user ||
      busy ||
      !reason
    ) {
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase
          .from("user_reports")
          .insert({
            reporter_id:
              user.id,
            target_user_id:
              targetUserId,
            target_type:
              "user",
            target_id:
              targetUserId,
            reason,
            details:
              details.trim() ||
              null,
          });

      if (error) throw error;

      setReportOpen(false);
      setOpen(false);
      setDetails("");
      alert(
        "Reporte enviado. Gracias por ayudarnos a cuidar Alumni."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo enviar el reporte."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div
        ref={menuRef}
        className="relative"
      >
        <button
          type="button"
          onClick={() =>
            setOpen(
              (value) => !value
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
          aria-label="Seguridad y privacidad"
          title="Seguridad y privacidad"
        >
          {busy ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <MoreHorizontal
              size={18}
            />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-12 z-[120] w-64 overflow-hidden rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-1.5 shadow-[0_22px_70px_var(--app-shadow)]">
            <button
              type="button"
              onClick={() =>
                void toggleMute()
              }
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-soft)]"
            >
              {muted ? (
                <BellRing size={16} />
              ) : (
                <BellOff size={16} />
              )}
              {muted
                ? "Dejar de silenciar"
                : "Silenciar contenido"}
            </button>

            <button
              type="button"
              onClick={() => {
                setReportOpen(true);
                setOpen(false);
              }}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-xs font-bold text-[var(--app-text-soft)] transition hover:bg-[var(--app-soft)]"
            >
              <Flag size={16} />
              Reportar usuario
            </button>

            <button
              type="button"
              onClick={() =>
                void toggleBlock()
              }
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-[13px] px-3 py-3 text-left text-xs font-bold text-red-400 transition hover:bg-red-500/[0.08]"
            >
              {blocked ? (
                <ShieldCheck size={16} />
              ) : (
                <ShieldBan size={16} />
              )}
              {blocked
                ? "Desbloquear"
                : "Bloquear usuario"}
            </button>
          </div>
        )}
      </div>

      {reportOpen && (
        <div
          className="fixed inset-0 z-[2147483100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          role="dialog"
          aria-modal="true"
          data-pull-refresh-lock="true"
        >
          <div className="w-full max-w-[480px] rounded-t-[28px] border border-white/[0.08] bg-[var(--app-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--app-accent)]">
                  Confianza y seguridad
                </p>
                <h3 className="mt-1 text-lg font-black text-[var(--app-text)]">
                  Reportar @{targetUsername}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReportOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--app-muted)] hover:bg-[var(--app-soft)]"
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-[var(--app-muted)]">
                  Motivo
                </span>
                <select
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-soft)] px-3 text-sm text-[var(--app-text)] outline-none"
                >
                  {REASONS.map(
                    ([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-[var(--app-muted)]">
                  Detalles opcionales
                </span>
                <textarea
                  value={details}
                  onChange={(event) =>
                    setDetails(
                      event.target.value.slice(
                        0,
                        2000
                      )
                    )
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[var(--app-border)] bg-[var(--app-soft)] p-3 text-sm text-[var(--app-text)] outline-none"
                  placeholder="Cuéntanos qué ocurrió..."
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                void submitReport()
              }
              disabled={busy}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-500/90 text-xs font-black text-white disabled:opacity-50"
            >
              {busy && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}
              Enviar reporte
            </button>
          </div>
        </div>
      )}
    </>
  );
}
