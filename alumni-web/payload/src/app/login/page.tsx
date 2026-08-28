"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole,
  Mail, RotateCcw, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";

type Step = "credentials" | "code";
type Email2FAResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
  requires_2fa?: boolean;
  challenge_id?: string;
  masked_email?: string;
  access_token?: string;
  refresh_token?: string;
};

const FUNCTION_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/email-2fa`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function email2fa(payload: Record<string, unknown>) {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Email2FAResponse;

  if (!response.ok || !data.ok) {
    const error = new Error(
      data.error || "No pudimos completar la verificación."
    ) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  return data;
}

export default function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(
      () => setResendSeconds((current) => Math.max(0, current - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  async function establishSession(accessToken?: string, refreshToken?: string) {
    if (!accessToken || !refreshToken) {
      throw new Error("No pudimos iniciar la sesión.");
    }

    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) throw error;
    window.location.href = "/feed";
  }

  async function handleLogin(event?: React.FormEvent) {
    event?.preventDefault();
    if (!email.trim() || !password || submitting) return;

    setSubmitting(true);

    try {
      await supabase.auth.signOut({ scope: "local" });

      const result = await email2fa({
        action: "begin",
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.requires_2fa) {
        setChallengeId(result.challenge_id || "");
        setMaskedEmail(result.masked_email || email.trim());
        setCode("");
        setPassword("");
        setStep("code");
        setResendSeconds(60);
        return;
      }

      await establishSession(result.access_token, result.refresh_token);
    } catch (error: any) {
      if (error?.code === "EMAIL_PROVIDER_NOT_CONFIGURED") {
        alert("El correo de seguridad de Alumni todavía no está configurado en el servidor.");
      } else {
        alert(error?.message || "No pudimos iniciar sesión.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!challengeId || code.length !== 6 || verifying) return;
    setVerifying(true);

    try {
      const result = await email2fa({
        action: "verify",
        challenge_id: challengeId,
        code,
      });

      await establishSession(result.access_token, result.refresh_token);
    } catch (error: any) {
      alert(error?.message || "El código no es válido.");
      setCode("");
      setVerifying(false);
    }
  }

  async function resendCode() {
    if (!challengeId || resending || resendSeconds > 0) return;
    setResending(true);

    try {
      const result = await email2fa({
        action: "resend",
        challenge_id: challengeId,
      });
      if (result.masked_email) setMaskedEmail(result.masked_email);
      setCode("");
      setResendSeconds(60);
    } catch (error: any) {
      alert(error?.message || "No pudimos reenviar el código.");
    } finally {
      setResending(false);
    }
  }

  function restartLogin() {
    setStep("credentials");
    setChallengeId("");
    setMaskedEmail("");
    setCode("");
    setPassword("");
    setResendSeconds(0);
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/[0.07] lg:flex">
          <div className="absolute left-[-10%] top-[10%] h-96 w-96 rounded-full bg-[#6d7cff]/15 blur-[130px]" />
          <div className="absolute bottom-[5%] right-[-5%] h-96 w-96 rounded-full bg-violet-600/10 blur-[140px]" />

          <div className="relative m-auto max-w-lg px-12">
            <Link href="/" aria-label="Alumni.">
              <BrandMark className="text-xl text-white" />
            </Link>

            <h1 className="mt-10 text-5xl font-black leading-[1.04] tracking-[-0.05em]">
              Vuelve a donde están tus conexiones.
            </h1>

            <p className="mt-5 text-base leading-7 text-zinc-500">
              Personas, conversaciones, publicaciones y momentos de tu comunidad Alumni.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-block lg:hidden" aria-label="Alumni.">
              <BrandMark className="text-xl text-white" />
            </Link>

            {step === "code" ? (
              <>
                <button
                  type="button"
                  onClick={restartLogin}
                  className="mb-7 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
                >
                  <ArrowLeft size={15} />
                  Volver
                </button>

                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8d98ff]/20 bg-[#6d7cff]/10 text-[#aeb6ff]">
                  <ShieldCheck size={21} />
                </span>

                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.17em] text-[#8d98ff]">
                  Verificación de seguridad
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                  Revisa tu correo
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  Enviamos un código de 6 dígitos a{" "}
                  <strong className="font-black text-zinc-300">{maskedEmail}</strong>.
                </p>

                <div className="mt-9">
                  <label className="block">
                    <span className="mb-3 block text-xs font-bold text-zinc-500">
                      Código de seguridad
                    </span>

                    <input
                      autoFocus
                      value={code}
                      onChange={(event) =>
                        setCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void verifyCode();
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="h-[76px] w-full rounded-[22px] border border-white/[0.09] bg-white/[0.035] px-5 text-center text-[30px] font-black tracking-[0.42em] text-white outline-none transition placeholder:text-zinc-800 focus:border-[#6d7cff]/55"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void verifyCode()}
                    disabled={code.length !== 6 || verifying}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
                  >
                    {verifying && <Loader2 size={16} className="animate-spin" />}
                    {verifying ? "Verificando…" : "Confirmar y entrar"}
                  </button>

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
                    <span className="text-[11px] text-zinc-700">¿No llegó?</span>

                    <button
                      type="button"
                      onClick={() => void resendCode()}
                      disabled={resending || resendSeconds > 0}
                      className="inline-flex min-h-8 items-center gap-2 text-[11px] font-black text-[#8d98ff] disabled:text-zinc-700"
                    >
                      {resending ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <RotateCcw size={13} />
                      )}

                      {resendSeconds > 0
                        ? `Reenviar en ${resendSeconds}s`
                        : "Reenviar código"}
                    </button>
                  </div>

                  <p className="mt-5 text-[10px] leading-5 text-zinc-700">
                    El código expira en 10 minutos. Alumni nunca te pedirá que lo compartas.
                  </p>
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
                  Tu contraseña es el primer paso. Después confirmaremos tu acceso por correo.
                </p>

                <form onSubmit={handleLogin} className="mt-8 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold text-zinc-500">
                      Correo electrónico
                    </span>

                    <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                      <Mail size={17} className="text-zinc-700" />

                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
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
                      <LockKeyhole size={17} className="text-zinc-700" />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Tu contraseña"
                        autoComplete="current-password"
                        className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-zinc-700 transition hover:text-zinc-300"
                        aria-label="Mostrar contraseña"
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </label>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-[11px] font-bold text-zinc-600 transition hover:text-[#8d98ff]"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !email.trim() || !password}
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
                  >
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    {submitting ? "Verificando…" : "Continuar"}
                  </button>
                </form>

                <div className="mt-6 flex items-start gap-3 border-t border-white/[0.06] pt-5">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#8d98ff]" />
                  <p className="text-[10px] leading-5 text-zinc-700">
                    Alumni envía un código al correo registrado después de validar tu contraseña.
                  </p>
                </div>

                <p className="mt-7 text-center text-sm text-zinc-600">
                  ¿Todavía no tienes cuenta?{" "}
                  <Link href="/register" className="font-bold text-[#8d98ff] hover:text-white">
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

/* ALUMNI_2_4_0_EMAIL_2FA_LOGIN */
