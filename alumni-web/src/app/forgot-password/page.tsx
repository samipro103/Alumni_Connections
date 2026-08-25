"use client";

import {
  ArrowLeft,
  Loader2,
  Mail,
} from "lucide-react";
import Link from "next/link";
import {
  useState,
} from "react";
import BrandMark from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");
  const [busy, setBusy] =
    useState(false);
  const [sent, setSent] =
    useState(false);

  async function submit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (
      !email.trim() ||
      busy
    ) {
      return;
    }

    setBusy(true);

    try {
      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            email.trim(),
            {
              redirectTo:
                `${window.location.origin}/reset-password`,
            }
          );

      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      alert(
        error?.message ||
          "No se pudo enviar el correo."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[520px] items-center px-5 py-12">
        <div className="w-full">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-600 hover:text-zinc-300"
          >
            <ArrowLeft size={15} />
            Volver
          </Link>

          <BrandMark className="mt-10 text-xl text-white" />

          <p className="mt-9 text-[10px] font-black uppercase tracking-[0.16em] text-[#8d98ff]">
            Recuperación segura
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Recupera tu cuenta
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Te enviaremos un enlace seguro al correo asociado con tu cuenta.
          </p>

          {sent ? (
            <div className="mt-8 border-y border-white/[0.07] py-6">
              <Mail
                size={22}
                className="text-[#8d98ff]"
              />
              <p className="mt-4 text-sm font-black text-zinc-300">
                Revisa tu correo
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Si existe una cuenta asociada a ese correo, recibirás las instrucciones para establecer una nueva contraseña.
              </p>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="mt-8"
            >
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                placeholder="tu@correo.com"
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm outline-none focus:border-[#6d7cff]/45"
              />

              <button
                type="submit"
                disabled={
                  busy ||
                  !email.trim()
                }
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black disabled:opacity-40"
              >
                {busy && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}
                Enviar enlace
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
