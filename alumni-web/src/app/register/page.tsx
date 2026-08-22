"use client";

import { useState } from "react";
import Link from "next/link";
import { AtSign, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e?: React.FormEvent) {
    e?.preventDefault();

    const cleanUsername = username.trim().replace(/\s+/g, "");

    if (!cleanUsername || !email.trim() || !password) return;

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    if (!data.user) {
      alert("No se pudo crear el usuario.");
      setSubmitting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        username: cleanUsername,
      });

    if (profileError) {
      alert(profileError.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      window.location.href = "/settings";
    } else {
      alert("Cuenta creada. Revisa tu correo si Supabase requiere confirmación.");
      window.location.href = "/login";
    }
  }

  return (
    <main className="min-h-screen bg-[#090b0f] text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-block text-xl font-black tracking-[-0.04em]">
              AlumniConnections<span className="text-[#7f8cff]">.</span>
            </Link>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">Empieza tu red</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-zinc-600">Tu perfil Alumni comienza con lo esencial.</p>

            <form onSubmit={handleRegister} className="mt-8 space-y-4">
              <Field icon={<AtSign size={17} />} label="Usuario">
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="samuel" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
              </Field>

              <Field icon={<Mail size={17} />} label="Correo electrónico">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
              </Field>

              <Field icon={<LockKeyhole size={17} />} label="Contraseña">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-zinc-700 transition hover:text-zinc-300">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </Field>

              <Field icon={<LockKeyhole size={17} />} label="Confirmar contraseña">
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
              </Field>

              <button type="submit" disabled={submitting || !username.trim() || !email.trim() || !password || !confirmPassword} className="mt-2 h-12 w-full rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700">
                {submitting ? "Creando cuenta..." : "Crear mi cuenta"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-600">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-bold text-[#8d98ff] hover:text-white">
                Inicia sesión
              </Link>
            </p>
          </div>
        </section>

        <section className="relative hidden overflow-hidden border-l border-white/[0.07] lg:flex">
          <div className="absolute left-[10%] top-[10%] h-96 w-96 rounded-full bg-violet-600/10 blur-[130px]" />
          <div className="absolute bottom-[5%] right-[-5%] h-96 w-96 rounded-full bg-[#6d7cff]/12 blur-[140px]" />

          <div className="relative m-auto max-w-lg px-12">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">AlumniConnections</p>
            <h2 className="mt-5 text-5xl font-black leading-[1.04] tracking-[-0.05em]">
              Tu carrera cambia. Tu red puede crecer contigo.
            </h2>
            <p className="mt-5 text-base leading-7 text-zinc-500">
              Crea un perfil que conecte tu universidad, carrera y comunidad profesional.
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
      <span className="mb-2 block text-xs font-bold text-zinc-500">{label}</span>
      <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 text-zinc-700 focus-within:border-[#6d7cff]/45">
        {icon}
        {children}
      </div>
    </label>
  );
}
