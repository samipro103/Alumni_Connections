"use client";

import {
  Download,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Trash2,
  UserRoundX,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";

function Panel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/[0.07] bg-[#101318]/95 p-5 sm:p-6">
      {children}
    </div>
  );
}

export default function AccountTrustPanel({
  email,
  logout,
}: {
  email: string;
  logout: () => void;
}) {
  const { user } = useAuth();
  const [password, setPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [changingPassword, setChangingPassword] =
    useState(false);
  const [sendingRecovery, setSendingRecovery] =
    useState(false);
  const [exporting, setExporting] =
    useState(false);
  const [deleteText, setDeleteText] =
    useState("");
  const [deleting, setDeleting] =
    useState(false);
  const [blocked, setBlocked] =
    useState<any[]>([]);
  const [muted, setMuted] =
    useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    void loadSafetyLists();
  }, [user?.id]);

  async function loadSafetyLists() {
    if (!user) return;

    const [
      { data: blockRows },
      { data: muteRows },
    ] = await Promise.all([
      supabase
        .from("user_blocks")
        .select("blocked_id")
        .eq("blocker_id", user.id),
      supabase
        .from("user_mutes")
        .select("muted_user_id")
        .eq("user_id", user.id),
    ]);

    const blockedIds =
      (blockRows || []).map(
        (row: any) =>
          row.blocked_id
      );

    const mutedIds =
      (muteRows || []).map(
        (row: any) =>
          row.muted_user_id
      );

    const all = [
      ...new Set([
        ...blockedIds,
        ...mutedIds,
      ]),
    ];

    let people: any[] = [];

    if (all.length) {
      const { data } =
        await supabase
          .from("profiles")
          .select(
            "id,username,avatar_url"
          )
          .in("id", all);

      people = data || [];
    }

    const person = (id: string) =>
      people.find(
        (item) =>
          item.id === id
      ) || {
        id,
        username: "usuario",
        avatar_url: null,
      };

    setBlocked(
      blockedIds.map(person)
    );
    setMuted(
      mutedIds.map(person)
    );
  }

  async function changePassword() {
    if (
      changingPassword ||
      password.length < 10
    ) {
      return;
    }

    if (
      password !== confirmPassword
    ) {
      alert(
        "Las contraseñas no coinciden."
      );
      return;
    }

    if (
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      alert(
        "La contraseña debe combinar letras y números."
      );
      return;
    }

    setChangingPassword(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) throw error;

      setPassword("");
      setConfirmPassword("");
      alert(
        "Contraseña actualizada."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo cambiar la contraseña."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function sendRecovery() {
    if (
      !email ||
      sendingRecovery
    ) {
      return;
    }

    setSendingRecovery(true);

    try {
      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                `${window.location.origin}/reset-password`,
            }
          );

      if (error) throw error;

      alert(
        "Te enviamos un correo para recuperar o cambiar tu contraseña."
      );
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo enviar el correo."
      );
    } finally {
      setSendingRecovery(false);
    }
  }

  async function exportData() {
    if (!user || exporting) return;

    setExporting(true);

    try {
      const [
        profile,
        posts,
        comments,
        follows,
        followRequests,
        messages,
        reports,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at"),
        supabase
          .from("comments")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at"),
        supabase
          .from("follows")
          .select("*")
          .or(
            `follower_id.eq.${user.id},following_id.eq.${user.id}`
          ),
        supabase
          .from("follow_requests")
          .select("*")
          .or(
            `requester_id.eq.${user.id},target_id.eq.${user.id}`
          ),
        supabase
          .from("messages")
          .select(
            "id,created_at,sender_id,receiver_id,content,message_type,story_id,read_at,media_type,media_name,reply_to_id"
          )
          .or(
            `sender_id.eq.${user.id},receiver_id.eq.${user.id}`
          )
          .order("created_at"),
        supabase
          .from("user_reports")
          .select("*")
          .eq("reporter_id", user.id)
          .order("created_at"),
      ]);

      const exportPayload = {
        exported_at:
          new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email,
        },
        profile:
          profile.data || null,
        posts:
          posts.data || [],
        comments:
          comments.data || [],
        follows:
          follows.data || [],
        follow_requests:
          followRequests.data || [],
        messages:
          messages.data || [],
        reports:
          reports.data || [],
      };

      const blob = new Blob(
        [
          JSON.stringify(
            exportPayload,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement("a");
      anchor.href = url;
      anchor.download =
        `alumni-data-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudieron exportar tus datos."
      );
    } finally {
      setExporting(false);
    }
  }

  async function unblock(id: string) {
    const { error } =
      await supabase.rpc(
        "unblock_user",
        {
          p_target: id,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    await loadSafetyLists();
  }

  async function unmute(id: string) {
    if (!user) return;

    const { error } =
      await supabase
        .from("user_mutes")
        .delete()
        .eq("user_id", user.id)
        .eq(
          "muted_user_id",
          id
        );

    if (error) {
      alert(error.message);
      return;
    }

    await loadSafetyLists();
  }

  async function deleteAccount() {
    if (
      !user ||
      deleteText !== "ELIMINAR" ||
      deleting
    ) {
      return;
    }

    if (
      !confirm(
        "Esta acción elimina tu cuenta y no se puede deshacer. ¿Continuar?"
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const { error } =
        await supabase.functions.invoke(
          "account-delete",
          {
            body: {
              confirmation:
                "ELIMINAR",
            },
          }
        );

      if (error) throw error;

      await supabase.auth.signOut();
      window.location.href =
        "/login";
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo eliminar la cuenta."
      );
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-start gap-3">
          <ShieldCheck
            size={18}
            className="mt-0.5 text-[#8d98ff]"
          />
          <div>
            <p className="text-sm font-black text-zinc-200">
              Seguridad de la cuenta
            </p>
          </div>
        </div>

        <div className="mt-5 border-y border-white/[0.06] py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">
            Correo
          </p>
          <p className="mt-1 break-all text-sm text-zinc-300">
            {email ||
              "Sin correo disponible"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void sendRecovery()
          }
          disabled={sendingRecovery}
          className="mt-4 flex h-10 items-center gap-2 text-xs font-black text-[#8d98ff] disabled:opacity-50"
        >
          {sendingRecovery ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Mail size={15} />
          )}
          Enviar correo de recuperación
        </button>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2">
          <KeyRound
            size={17}
            className="text-[#8d98ff]"
          />
          <p className="text-sm font-black text-zinc-200">
            Cambiar contraseña
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-sm text-zinc-300 outline-none"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(
                event.target.value
              )
            }
            placeholder="Confirmar contraseña"
            autoComplete="new-password"
            className="h-11 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-sm text-zinc-300 outline-none"
          />
        </div>

        <p className="mt-2 text-[10px] leading-5 text-zinc-700">
          Mínimo 10 caracteres, con letras y números.
        </p>

        <button
          type="button"
          onClick={() =>
            void changePassword()
          }
          disabled={
            changingPassword ||
            password.length < 10 ||
            !confirmPassword
          }
          className="mt-3 flex h-10 items-center gap-2 text-xs font-black text-[#8d98ff] disabled:opacity-40"
        >
          {changingPassword ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <LockKeyhole
              size={15}
            />
          )}
          Actualizar contraseña
        </button>
      </Panel>

      {(blocked.length > 0 ||
        muted.length > 0) && (
        <Panel>
          <p className="text-sm font-black text-zinc-200">
            Controles de comunidad
          </p>

          {blocked.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">
                Bloqueados
              </p>
              <div className="divide-y divide-white/[0.06]">
                {blocked.map(
                  (person) => (
                    <div
                      key={
                        person.id
                      }
                      className="flex items-center gap-3 py-3"
                    >
                      <UserRoundX
                        size={16}
                        className="text-red-400"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-400">
                        @
                        {
                          person.username
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void unblock(
                            person.id
                          )
                        }
                        className="text-[10px] font-black text-[#8d98ff]"
                      >
                        Desbloquear
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {muted.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-700">
                Silenciados
              </p>
              <div className="divide-y divide-white/[0.06]">
                {muted.map(
                  (person) => (
                    <div
                      key={
                        person.id
                      }
                      className="flex items-center gap-3 py-3"
                    >
                      <VolumeX
                        size={16}
                        className="text-zinc-600"
                      />
                      <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-400">
                        @
                        {
                          person.username
                        }
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void unmute(
                            person.id
                          )
                        }
                        className="text-[10px] font-black text-[#8d98ff]"
                      >
                        Activar
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </Panel>
      )}

      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Tus datos y confianza
        </p>

        <button
          type="button"
          onClick={() =>
            void exportData()
          }
          disabled={exporting}
          className="mt-4 flex h-10 items-center gap-2 text-xs font-black text-[#8d98ff] disabled:opacity-50"
        >
          {exporting ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Download size={15} />
          )}
          Descargar mis datos
        </button>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-xs font-bold text-zinc-600">
          <Link
            href="/legal/privacy"
            className="hover:text-zinc-300"
          >
            Privacidad
          </Link>
          <Link
            href="/legal/terms"
            className="hover:text-zinc-300"
          >
            Términos
          </Link>
          <Link
            href="/legal/community"
            className="hover:text-zinc-300"
          >
            Normas de comunidad
          </Link>
        </div>
      </Panel>

      <Panel>
        <p className="text-sm font-black text-zinc-200">
          Sesión
        </p>

        <button
          type="button"
          onClick={logout}
          className="mt-4 flex h-10 items-center gap-2 text-xs font-black text-zinc-500 transition hover:text-white"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2 text-red-400">
          <Trash2 size={17} />
          <p className="text-sm font-black">
            Eliminar cuenta
          </p>
        </div>

        <p className="mt-2 text-xs leading-5 text-zinc-700">
          Elimina permanentemente tu cuenta de Alumni y los datos asociados que podamos vincular a ella. Esta acción no se puede deshacer.
        </p>

        <input
          value={deleteText}
          onChange={(event) =>
            setDeleteText(
              event.target.value
                .toUpperCase()
                .slice(0, 8)
            )
          }
          placeholder='Escribe "ELIMINAR"'
          className="mt-4 h-11 w-full rounded-xl border border-red-500/15 bg-red-500/[0.025] px-3 text-sm text-red-300 outline-none"
        />

        <button
          type="button"
          onClick={() =>
            void deleteAccount()
          }
          disabled={
            deleteText !==
              "ELIMINAR" ||
            deleting
          }
          className="mt-3 flex h-10 items-center gap-2 text-xs font-black text-red-400 disabled:opacity-30"
        >
          {deleting && (
            <Loader2
              size={15}
              className="animate-spin"
            />
          )}
          Eliminar mi cuenta
        </button>
      </Panel>
    </div>
  );
}

/* ALUMNI_3_1_1_PRODUCT_COPY_CLEANUP */
