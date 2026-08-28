"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { supabase } from "@/lib/supabase";
import {
  challengeTotp,
  getMfaState,
} from "@/lib/mfa";

type Enrollment = {
  id: string;
  qrCode: string;
  secret: string;
};

export default function MfaSetupPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    enrollment,
    setEnrollment,
  ] =
    useState<Enrollment | null>(
      null
    );

  const [
    code,
    setCode,
  ] = useState("");

  const [
    verifying,
    setVerifying,
  ] = useState(false);

  const [
    copied,
    setCopied,
  ] = useState(false);

  useEffect(() => {
    void initialize();
  }, []);

  async function initialize() {
    setLoading(true);

    const state =
      await getMfaState();

    if (!state.authenticated) {
      window.location.href =
        "/login";
      return;
    }

    if (
      !state.required
    ) {
      window.location.href =
        "/feed";
      return;
    }

    if (
      state.hasVerifiedFactor &&
      state.currentLevel ===
        "aal2"
    ) {
      window.location.href =
        "/settings";
      return;
    }

    if (
      state.hasVerifiedFactor
    ) {
      window.location.href =
        "/login?mfa=1";
      return;
    }

    /*
      Elimina factores TOTP no verificados abandonados,
      evitando acumular QR inválidos si el usuario recarga.
    */
    const {
      data: existingFactors,
    } =
      await supabase.auth.mfa.listFactors();

    for (
      const factor of
      existingFactors?.totp || []
    ) {
      if (
        factor.status !==
        "verified"
      ) {
        await supabase.auth.mfa.unenroll({
          factorId:
            factor.id,
        });
      }
    }

    const {
      data,
      error,
    } =
      await supabase.auth.mfa.enroll({
        factorType:
          "totp",
        friendlyName:
          "Alumni Authenticator",
      });

    if (error) {
      alert(
        error.message
      );
      setLoading(false);
      return;
    }

    setEnrollment({
      id:
        data.id,
      qrCode:
        data.totp.qr_code,
      secret:
        data.totp.secret,
    });

    setLoading(false);
  }

  async function verify() {
    if (
      !enrollment ||
      verifying
    ) {
      return;
    }

    setVerifying(true);

    try {
      await challengeTotp(
        enrollment.id,
        code
      );

      window.location.href =
        "/settings";
    } catch (error: any) {
      alert(
        error?.message ||
          "El código no es válido."
      );
      setVerifying(false);
    }
  }

  async function copySecret() {
    if (
      !enrollment?.secret
    ) {
      return;
    }

    await navigator.clipboard.writeText(
      enrollment.secret
    );

    setCopied(true);

    window.setTimeout(
      () =>
        setCopied(false),
      1600
    );
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1080px] items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[560px]">
          <Link
            href="/"
            aria-label="Alumni."
            className="inline-block"
          >
            <BrandMark className="text-xl text-white" />
          </Link>

          <div className="mt-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#8d98ff]/20 bg-[#6d7cff]/10 text-[#aeb6ff]">
              <ShieldCheck
                size={21}
              />
            </span>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8d98ff]">
                Seguridad de la cuenta
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-[-0.035em]">
                Protege tu acceso
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-500">
            Alumni requiere un segundo factor para las cuentas nuevas.
            Escanea el código con Google Authenticator, Microsoft Authenticator,
            Authy, 1Password u otra aplicación compatible.
          </p>

          {loading ? (
            <div className="mt-12 flex items-center gap-3 text-sm text-zinc-500">
              <Loader2
                size={17}
                className="animate-spin"
              />
              Preparando autenticador…
            </div>
          ) : enrollment ? (
            <>
              <div className="mt-8 flex justify-center">
                <div className="overflow-hidden rounded-[24px] bg-white p-4 shadow-[0_24px_70px_rgba(0,0,0,.35)]">
                  <img
                    src={
                      enrollment.qrCode
                    }
                    alt="Código QR para configurar el autenticador"
                    className="h-[220px] w-[220px]"
                  />
                </div>
              </div>

              <div className="mt-6 border-y border-white/[0.07] py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600">
                  ¿No puedes escanear?
                </p>

                <button
                  type="button"
                  onClick={
                    copySecret
                  }
                  className="mt-2 flex w-full items-center justify-between gap-3 text-left"
                >
                  <code className="min-w-0 break-all text-[11px] font-bold text-zinc-400">
                    {
                      enrollment.secret
                    }
                  </code>

                  <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.1em] text-[#8d98ff]">
                    {copied
                      ? "Copiado"
                      : "Copiar"}
                  </span>
                </button>
              </div>

              <div className="mt-7">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold text-zinc-500">
                    Código de 6 dígitos
                  </span>

                  <div className="flex h-14 items-center rounded-[18px] border border-white/[0.09] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/55">
                    <KeyRound
                      size={17}
                      className="text-zinc-700"
                    />

                    <input
                      value={
                        code
                      }
                      onChange={(event) =>
                        setCode(
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
                          void verify();
                        }
                      }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="h-full flex-1 bg-transparent px-4 text-center text-xl font-black tracking-[0.3em] outline-none placeholder:text-zinc-800"
                    />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() =>
                    void verify()
                  }
                  disabled={
                    code.length !==
                      6 ||
                    verifying
                  }
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700"
                >
                  {verifying ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2
                      size={16}
                    />
                  )}

                  {verifying
                    ? "Verificando…"
                    : "Activar autenticación de dos pasos"}
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
