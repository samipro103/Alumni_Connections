"use client";

import {
  useState,
} from "react";
import Link from "next/link";
import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";

export default function RegisterPage() {
  const [
    username,
    setUsername,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
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
    waitingEmail,
    setWaitingEmail,
  ] = useState(false);

  async function handleRegister(
    event?: React.FormEvent
  ) {
    event?.preventDefault();

    const cleanUsername =
      username
        .trim()
        .replace(
          /\s+/g,
          ""
        );

    if (
      !cleanUsername ||
      !email.trim() ||
      !password
    ) {
      return;
    }

    if (
      !/^[a-zA-Z0-9._-]{3,30}$/.test(
        cleanUsername
      )
    ) {
      alert(
        "El usuario debe tener entre 3 y 30 caracteres y usar solo letras, números, punto, guion o guion bajo."
      );
      return;
    }

    /*
      Subimos el mínimo respecto a la versión anterior.
      El segundo factor no sustituye una contraseña fuerte.
    */
    if (
      password.length <
      10
    ) {
      alert(
        "La contraseña debe tener al menos 10 caracteres."
      );
      return;
    }

    if (
      !/[A-Za-z]/.test(
        password
      ) ||
      !/\d/.test(
        password
      )
    ) {
      alert(
        "La contraseña debe combinar letras y números."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      alert(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setSubmitting(true);

    const {
      data,
      error,
    } =
      await supabase.auth.signUp({
        email:
          email.trim(),
        password,
        options: {
          data: {
            username:
              cleanUsername,
          },
          emailRedirectTo:
            `${window.location.origin}/login`,
        },
      });

    if (error) {
      alert(
        error.message
      );
      setSubmitting(false);
      return;
    }

    if (!data.user) {
      alert(
        "No se pudo crear el usuario."
      );
      setSubmitting(false);
      return;
    }

    if (data.session) {
      window.location.href =
        "/mfa/setup";
      return;
    }

    setWaitingEmail(true);
    setSubmitting(false);
  }

  if (waitingEmail) {
    return (
      <main className="min-h-screen bg-[#090b0f] text-white">
        <div className="mx-auto flex min-h-screen max-w-lg items-center px-5">
          <div>
            <BrandMark className="text-xl text-white" />

            <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full border border-[#8d98ff]/20 bg-[#6d7cff]/10 text-[#aeb6ff]">
              <Mail
                size={21}
              />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">
              Paso 1 de 2
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Confirma tu correo
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Te enviamos un enlace de verificación. Después de confirmarlo,
              inicia sesión y Alumni te llevará automáticamente a configurar
              el autenticador de dos pasos.
            </p>

            <Link
              href="/login"
              className="mt-7 inline-flex h-11 items-center rounded-2xl bg-[#6d7cff] px-5 text-xs font-black"
            >
              Ir a iniciar sesión
            </Link>
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
              <ShieldCheck
                size={15}
              />

              <p className="text-xs font-bold uppercase tracking-[0.16em]">
                Cuenta protegida
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">
              Crea tu cuenta
            </h1>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Al terminar configuraremos un autenticador de dos pasos obligatorio.
            </p>

            <form
              onSubmit={
                handleRegister
              }
              className="mt-8 space-y-4"
            >
              <Field
                icon={
                  <AtSign
                    size={17}
                  />
                }
                label="Usuario"
              >
                <input
                  value={
                    username
                  }
                  onChange={(event) =>
                    setUsername(
                      event.target.value
                    )
                  }
                  placeholder="samuel"
                  autoComplete="username"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />
              </Field>

              <Field
                icon={
                  <Mail
                    size={17}
                  />
                }
                label="Correo electrónico"
              >
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
              </Field>

              <Field
                icon={
                  <LockKeyhole
                    size={17}
                  />
                }
                label="Contraseña"
              >
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
                  placeholder="Mínimo 10 caracteres"
                  autoComplete="new-password"
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
              </Field>

              <Field
                icon={
                  <LockKeyhole
                    size={17}
                  />
                }
                label="Confirmar contraseña"
              >
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    confirmPassword
                  }
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
                />
              </Field>

              <p className="text-[10px] leading-5 text-zinc-700">
                Después del registro necesitarás una aplicación de autenticación
                para generar códigos de 6 dígitos.
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
                {submitting && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {submitting
                  ? "Creando cuenta…"
                  : "Crear cuenta segura"}
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
              Una red profesional también debe proteger tu identidad.
            </h2>

            <p className="mt-5 text-base leading-7 text-zinc-500">
              Correo, contraseña y un código temporal que solamente existe en tu dispositivo.
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
  icon:
    React.ReactNode;
  label: string;
  children:
    React.ReactNode;
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
