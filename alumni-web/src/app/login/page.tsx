"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BrandMark from "@/components/brand/BrandMark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();

    if (!email.trim() || !password || submitting) return;

    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    window.location.href = "/feed";
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
              Personas, conversaciones, publicaciones y oportunidades de tu comunidad académica.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 inline-block lg:hidden" aria-label="Alumni.">
              <BrandMark className="text-xl text-white" />
            </Link>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8d98ff]">Bienvenido de nuevo</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Inicia sesión</h2>
            <p className="mt-2 text-sm text-zinc-600">Continúa construyendo tu red Alumni.</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-zinc-500">Correo electrónico</span>
                <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                  <Mail size={17} className="text-zinc-700" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-zinc-500">Contraseña</span>
                <div className="flex h-12 items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 focus-within:border-[#6d7cff]/45">
                  <LockKeyhole size={17} className="text-zinc-700" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-zinc-700 transition hover:text-zinc-300" aria-label="Mostrar contraseña">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>

              <button type="submit" disabled={submitting || !email.trim() || !password} className="mt-2 h-12 w-full rounded-2xl bg-[#6d7cff] text-sm font-black transition hover:bg-[#7b87ff] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-zinc-700">
                {submitting ? "Entrando..." : "Entrar a Alumni"}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-zinc-600">
              ¿Todavía no tienes cuenta?{" "}
              <Link href="/register" className="font-bold text-[#8d98ff] hover:text-white">
                Crear cuenta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
