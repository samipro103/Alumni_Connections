"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LandingPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      window.location.href = "/feed";
    }
  }, [user, loading]);

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-sm text-zinc-600">
        Cargando AlumniConnections...
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b0f] text-white">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-8">
          <Link href="/" className="text-xl font-black tracking-[-0.04em]">
            AlumniConnections<span className="text-[#7f8cff]">.</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/login" className="rounded-xl px-4 py-2.5 text-sm font-bold text-zinc-400 transition hover:bg-white/[0.04] hover:text-white">
              Iniciar sesión
            </Link>
            <Link href="/register" className="rounded-xl bg-[#6d7cff] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#7b87ff]">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-[#6d7cff]/10 blur-[120px]" />
        <div className="absolute right-[8%] top-10 h-80 w-80 rounded-full bg-violet-600/10 blur-[140px]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full border border-[#7f8cff]/20 bg-[#7f8cff]/[0.07] px-3 py-1.5 text-xs font-bold text-[#9da6ff]">
              La red de estudiantes y graduados
            </div>

            <h1 className="text-5xl font-black leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Las conexiones que empiezan en la universidad pueden llegar mucho más lejos.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-zinc-500 sm:text-lg">
              Comparte logros, descubre profesionales, encuentra eventos y mantén viva tu comunidad académica.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#6d7cff] px-5 text-sm font-black text-white transition hover:bg-[#7b87ff]">
                Únete a Alumni
                <ArrowRight size={17} />
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center rounded-xl border border-white/[0.08] bg-white/[0.035] px-5 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.06]">
                Ya tengo una cuenta
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[30px] border border-white/[0.08] bg-[#101318]/90 p-4 shadow-[0_30px_100px_rgba(0,0,0,.35)] backdrop-blur">
              <div className="border-b border-white/[0.06] px-3 pb-4 pt-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-700">Tu comunidad</p>
                <p className="mt-2 text-xl font-black tracking-[-0.03em]">Todo lo importante, en un solo lugar.</p>
              </div>

              <div className="grid gap-2 pt-4 sm:grid-cols-2">
                {[
                  [Users, "Conexiones", "Encuentra personas de tu carrera y universidad."],
                  [MessageCircle, "Conversaciones", "Mantén contacto con tu red profesional."],
                  [GraduationCap, "Comunidad", "Comparte experiencias entre estudiantes y graduados."],
                  [Briefcase, "Oportunidades", "Una base preparada para empleo, mentoría y proyectos."],
                ].map(([Icon, title, description]: any) => (
                  <div key={title} className="rounded-2xl bg-white/[0.035] p-4">
                    <Icon size={19} className="text-[#8d98ff]" />
                    <p className="mt-4 text-sm font-black text-zinc-200">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
