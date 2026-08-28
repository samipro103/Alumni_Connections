"use client";

import {
  Loader2,
  LockKeyhole,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import BrandMark from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [ready, setReady] =
    useState(false);
  const [password, setPassword] =
    useState("");
  const [confirm, setConfirm] =
    useState("");
  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      const {
        data: { session },
      } =
        await supabase.auth
          .getSession();

      if (active) {
        setReady(
          Boolean(session)
        );
      }
    })();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (_event, session) => {
            if (active) {
              setReady(
                Boolean(
                  session
                )
              );
            }
          }
        );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function save() {
    if (
      !ready ||
      busy ||
      password.length < 10
    ) {
      return;
    }

    if (
      password !== confirm
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

    setBusy(true);

    try {
      const { error } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (error) throw error;

      await supabase.auth.signOut();

      alert(
        "Contraseña actualizada. Inicia sesión nuevamente."
      );

      window.location.href =
        "/login";
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo actualizar la contraseña."
      );
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center px-5 py-12">
        <div className="w-full">
          <BrandMark className="text-xl text-white" />

          <LockKeyhole
            size={22}
            className="mt-10 text-[#8d98ff]"
          />

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em]">
            Nueva contraseña
          </h1>

          {!ready ? (
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              Abre esta página desde el enlace de recuperación enviado a tu correo. Si el enlace expiró, solicita uno nuevo desde Iniciar sesión.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Usa al menos 10 caracteres y combina letras con números.
              </p>

              <div className="mt-8 space-y-3">
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Nueva contraseña"
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none focus:border-[#6d7cff]/45"
                />
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) =>
                    setConfirm(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Confirmar contraseña"
                  className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none focus:border-[#6d7cff]/45"
                />

                <button
                  type="button"
                  onClick={() =>
                    void save()
                  }
                  disabled={
                    busy ||
                    password.length <
                      10 ||
                    !confirm
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black disabled:opacity-40"
                >
                  {busy && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}
                  Guardar contraseña
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
