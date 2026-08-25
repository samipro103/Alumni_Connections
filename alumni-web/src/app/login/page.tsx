"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";
import {
  challengeTotp,
  getMfaState,
} from "@/lib/mfa";

export default function LoginPage() {
  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    mfaFactorId,
    setMfaFactorId,
  ] =
    useState<string | null>(
      null
    );

  const [
    mfaCode,
    setMfaCode,
  ] = useState("");

  const [
    verifyingMfa,
    setVerifyingMfa,
  ] = useState(false);

  async function handleLogin(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    if (
      !email.trim() ||
      !password ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);

    const {
      error,
    } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim(),
        password,
      });

    if (error) {
      alert(
        error.message
      );
      setSubmitting(false);
      return;
    }

    const state =
      await getMfaState();

    if (
      state.required &&
      !state.hasVerifiedFactor
    ) {
      window.location.href =
        "/mfa/setup";
      return;
    }

    if (
      state.hasVerifiedFactor &&
      state.nextLevel ===
        "aal2" &&
      state.currentLevel !==
        "aal2"
    ) {
      setMfaFactorId(
        state.verifiedFactor
          ?.id || null
      );
      setSubmitting(false);
      return;
    }

    window.location.href =
      "/feed";
  }

  async function verifyMfa() {
    if (
      !mfaFactorId ||
      verifyingMfa ||
      mfaCode.length !== 6
    ) {
      return;
    }

    setVerifyingMfa(true);

    try {
      await challengeTotp(
        mfaFactorId,
        mfaCode
      );

      window.location.href =
        "/feed";
    } catch (error: any) {
      alert(
        error?.message ||
          "Código incorrecto."
      );
      setVerifyingMfa(false);
    }
  }

  const mfaStep =
    Boolean(mfaFactorId);

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/[0.07] lg:flex">
          <div className="absolute left-[-10%] top-[10%] h-96 w-96 rounded-full bg-[#6d7cff]/15 blur-[130px]" />
          <div className="absolute bottom-[5%] right-[-5%] h-96 w-96 rounded-full bg-violet-600/10 blur-[140px]" />

          <div className="relative m-auto max-w-lg px-12">
            <Link
              href="/"
              aria-label="Alumni."
            >
              <BrandMark className="text-xl text-white" />
            </Link>

            <h1 className="mt-10 text-5xl font-black leading-[1.04] tracking-[-0.05em]">
              Vuelve a donde están tus conexiones.
            </h1>

            <p className="mt-5 text-base leading-7 text-zinc-500">
              Personas, conversaciones, publicaciones y oportunidades de tu comunidad académica.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-block lg:hidden"
              aria-label="Alumni."
            >
              <BrandMark className="text-xl text-white" />
            </Link>

            {mfaStep ? (
              <>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8d98ff]/20 bg-[#6d7cff]/10 text-[#aeb6ff]">
                  <ShieldCheck
                    size={21}
                  />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">
                  Segundo paso
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Confirma que eres tú
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Abre tu aplicación de autenticación e ingresa el código actual de 6 dígitos.
                </p>

                <div className="mt-8">
                  <div className="flex h-14 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                    <KeyRound
                      size={17}
                      className="text-zinc-700"
                    />

                    <input
                      autoFocus
                      value={
                        mfaCode
                      }
                      onChange={(event) =>
                        setMfaCode(
                          event.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              6
                            )
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                          "Enter"
                        ) {
                          void verifyMfa();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="h-full flex-1 bg-transparent px-3 text-center text-xl font-black tracking-[0.3em] outline-none placeholder:text-zinc-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void verifyMfa()
                    }
                    disabled={
                      mfaCode.length !==
                        6 ||
                      verifyingMfa
                    }
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
                  >
                    {verifyingMfa && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {verifyingMfa
                      ? "Verificando…"
                      : "Confirmar código"}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setMfaFactorId(
                        null
                      );
                      setMfaCode("");
                      setPassword("");
                    }}
                    className="mt-4 w-full text-center text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
                  >
                    Volver al inicio de sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">
                  Bienvenido de nuevo
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Inicia sesión
                </h2>

                <p className="mt-2 text-sm text-zinc-600">
                  Continúa construyendo tu red Alumni.
                </p>

                <form
                  onSubmit={
                    handleLogin
                  }
                  className="mt-8 space-y-4"
                >
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      Correo electrónico
                    </span>

                    <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                      <Mail
                        size={17}
                        className="text-zinc-700"
                      />

                      <input
                        type="email"
                        value={
                          email
                        }
                        onChange={(event) =>
                          setEmail(
                            event.target.value
                          )
                        }
                        placeholder="tu@correo.com"
                        autoComplete="email"
                        className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      Contraseña
                    </span>

                    <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                      <LockKeyhole
                        size={17}
                        className="text-zinc-700"
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        value={
                          password
                        }
                        onChange={(event) =>
                          setPassword(
                            event.target.value
                          )
                        }
                        placeholder="Tu contraseña"
                        autoComplete="current-password"
                        className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) =>
                              !value
                          )
                        }
                        className="text-zinc-700 transition hover:text-zinc-300"
                        aria-label="Mostrar contraseña"
                      >
                        {showPassword ? (
                          <EyeOff
                            size={17}
                          />
                        ) : (
                          <Eye
                            size={17}
                          />
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      !email.trim() ||
                      !password
                    }
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
                  >
                    {submitting && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {submitting
                      ? "Verificando…"
                      : "Entrar a Alumni"}
                  </button>
                </form>

                <p className="mt-7 text-center text-sm text-zinc-600">
                  ¿Todavía no tienes cuenta?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[#8d98ff] hover:text-white"
                  >
                    Crear cuenta
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
