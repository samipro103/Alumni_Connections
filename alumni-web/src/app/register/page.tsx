"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";

type Step = "form" | "code";

type SignupCodeResponse = {
  ok?: boolean;
  error?: string;
  code?: string;
  challenge_id?: string;
  masked_email?: string;
};

const FUNCTION_URL =
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/signup-email-code`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function signupCode(payload: Record<string, unknown>) {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as SignupCodeResponse;

  if (!response.ok || !data.ok) {
    const error = new Error(
      data.error || "No pudimos completar el registro."
    ) as Error & { code?: string };
    error.code = data.code;
    throw error;
  }

  return data;
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("form");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  function cleanUsername() {
    return username.trim().replace(/\s+/g, "");
  }

  function validateForm() {
    const clean = cleanUsername();

    if (!clean || !email.trim() || !password || !confirmPassword) {
      return false;
    }

    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(clean)) {
      alert(
        "El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo."
      );
      return false;
    }

    if (password.length < 10) {
      alert("La contraseña debe tener al menos 10 caracteres.");
      return false;
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      alert("La contraseña debe combinar letras y números.");
      return false;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return false;
    }

    return true;
  }

  async function handleRegister(event?: React.FormEvent) {
    event?.preventDefault();

    if (submitting || !validateForm()) return;

    setSubmitting(true);

    try {
      const result = await signupCode({
        action: "begin",
        username: cleanUsername(),
        email: email.trim().toLowerCase(),
        password,
      });

      setChallengeId(result.challenge_id || "");
      setMaskedEmail(result.masked_email || email.trim());
      setCode("");
      setStep("code");
      setResendSeconds(60);
    } catch (error: any) {
      if (error?.code === "ACCOUNT_EXISTS") {
        alert("Ya existe una cuenta con este correo. Inicia sesión.");
      } else if (error?.code === "USERNAME_TAKEN") {
        alert("Ese nombre de usuario ya está en uso.");
      } else if (error?.code === "EMAIL_PROVIDER_NOT_CONFIGURED") {
        alert("El correo de verificación de Alumni todavía no está configurado.");
      } else {
        alert(error?.message || "No pudimos crear la cuenta.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode() {
    if (!challengeId || code.length !== 6 || verifying) return;

    setVerifying(true);

    try {
      await signupCode({
        action: "verify",
        challenge_id: challengeId,
        code,
      });

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        window.location.href = "/login?verified=1";
        return;
      }

      window.location.href = "/feed";
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
      const result = await signupCode({
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

  function backToForm() {
    setStep("form");
    setCode("");
  }

  if (step === "code") {
    return (
      <main className="min-h-screen bg-[#090b0f] text-white">
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-12">
          <div className="w-full">
            <BrandMark className="text-xl text-white" />

            <button
              type="button"
              onClick={backToForm}
              className="mt-8 inline-flex min-h-9 items-center gap-2 text-xs font-bold text-zinc-600 transition hover:text-zinc-300"
            >
              <ArrowLeft size={15} />
              Volver
            </button>

            <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-full border border-[#8d98ff]/20 bg-[#6d7cff]/10 text-[#aeb6ff]">
              <Mail size={21} />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">
              Confirma tu correo
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Revisa tu correo
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Enviamos un código de 6 dígitos a{" "}
              <strong className="font-black text-zinc-300">{maskedEmail}</strong>.
              Escríbelo para terminar de crear tu cuenta.
            </p>

            <div className="mt-8">
              <label className="block">
                <span className="mb-3 block text-xs font-bold text-zinc-500">
                  Código de verificación
                </span>

                <input
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
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
                {verifying ? "Verificando…" : "Confirmar correo"}
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
                El código expira en 10 minutos. No lo compartas con nadie.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-10 inline-block"
              aria-label="Alumni."
            >
              <BrandMark className="text-xl text-white" />
            </Link>

            <div className="flex items-center gap-2 text-[#8d98ff]">
              <ShieldCheck size={15} />
              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Verificación de correo
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Crea tu cuenta
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Al terminar te enviaremos un código de 6 dígitos para confirmar tu correo.
            </p>

            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <Field icon={<AtSign size={17} />} label="Usuario">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="samuel"
                  autoComplete="username"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />
              </Field>

              <Field icon={<Mail size={17} />} label="Correo electrónico">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />
              </Field>

              <Field icon={<LockKeyhole size={17} />} label="Contraseña">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 10 caracteres"
                  autoComplete="new-password"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-zinc-700 transition hover:text-zinc-300"
                  aria-label="Mostrar contraseña"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </Field>

              <Field icon={<LockKeyhole size={17} />} label="Confirmar contraseña">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />
              </Field>

              <p className="text-[10px] leading-5 text-zinc-700">
                El código se utiliza únicamente para confirmar tu correo al registrarte.
                Después iniciarás sesión normalmente con correo y contraseña.
              </p>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !username.trim() ||
                  !email.trim() ||
                  !password ||
                  !confirmPassword
                }
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Enviando código…" : "Crear cuenta"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login"
                className="font-bold text-[#8d98ff] hover:text-white"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-white/[0.07] lg:flex">
          <div className="absolute left-[10%] top-[10%] h-96 w-96 rounded-full bg-violet-600/10 blur-[130px]" />
          <div className="absolute bottom-[5%] right-[-5%] h-96 w-96 rounded-full bg-[#6d7cff]/12 blur-[140px]" />

          <div className="relative m-auto max-w-lg px-12">
            <BrandMark className="text-sm text-[#8d98ff]" />

            <h2 className="mt-5 text-5xl font-black leading-[1.04] tracking-[-0.05em]">
              Tu correo también forma parte de tu identidad Alumni.
            </h2>

            <p className="mt-5 text-base leading-7 text-zinc-500">
              Lo confirmamos una sola vez al crear tu cuenta. Después puedes entrar con tu correo y contraseña.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-zinc-500">
        {label}
      </span>

      <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-zinc-700 focus-within:border-[#6d7cff]/45">
        {icon}
        {children}
      </div>
    </label>
  );
}

/* ALUMNI_1_0_12_SIGNUP_EMAIL_CODE */
