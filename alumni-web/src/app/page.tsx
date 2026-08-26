"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  MessageCircle,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";

const mobileFeatures = [
  {
    Icon: Users,
    title: "Conexiones",
    description: "Personas de tu carrera y universidad.",
  },
  {
    Icon: MessageCircle,
    title: "Conversaciones",
    description: "Mantén cerca a tu red.",
  },
  {
    Icon: GraduationCap,
    title: "Comunidad",
    description: "Estudiantes y graduados.",
  },
  {
    Icon: Briefcase,
    title: "Oportunidades",
    description: "Empleo, mentoría y proyectos.",
  },
];

function AlumniAnimatedWordmark() {
  return (
    <div className="relative inline-flex items-end justify-center">
      <span className="text-[52px] font-black leading-none tracking-[-0.065em] text-white">
        Alumni
      </span>

      <span className="relative mb-[5px] ml-[6px] block h-[12px] w-[12px]">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-[#8d98ff]/55"
          animate={{
            scale: [1, 2.7],
            opacity: [0.55, 0],
          }}
          transition={{
            duration: 1.9,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />

        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-violet-400/35"
          animate={{
            scale: [1, 3.8],
            opacity: [0.35, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.55,
          }}
        />

        <motion.span
          aria-hidden="true"
          className="absolute inset-[-7px] rounded-full bg-[#7f8cff]/15 blur-md"
          animate={{
            scale: [0.85, 1.25, 0.85],
            opacity: [0.35, 0.8, 0.35],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.span
          className="absolute inset-0 rounded-full bg-[#7f8cff] shadow-[0_0_22px_rgba(127,140,255,.8)]"
          animate={{
            scale: [1, 1.22, 1],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </span>
    </div>
  );
}

function MobileLanding() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#090b0f] text-white md:hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-26%] top-[13%] h-[320px] w-[320px] rounded-full bg-[#6d7cff]/15 blur-[115px]" />
        <div className="absolute right-[-30%] top-[28%] h-[330px] w-[330px] rounded-full bg-violet-600/12 blur-[130px]" />
        <div className="absolute left-1/2 top-[31%] h-[430px] w-[430px] -translate-x-1/2 rounded-full border border-[#7887ff]/10 shadow-[0_0_100px_rgba(109,124,255,.08)]" />
        <div className="absolute left-1/2 top-[34%] h-[350px] w-[350px] -translate-x-1/2 rounded-full border border-violet-400/[0.06]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[520px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))]">
        {/* La marca visible dentro de la app siempre es Alumni. */}
        <header className="flex min-h-12 items-center">
          <Link
            href="/"
            aria-label="Alumni."
            className="alumni-brand inline-flex text-[20px] font-black tracking-[-0.055em] text-white"
          >
            Alumni<span className="alumni-brand-dot">.</span>
          </Link>
        </header>

        <section className="flex flex-1 flex-col justify-center pb-8 pt-4">
          <div className="text-center">
            <AlumniAnimatedWordmark />

            <div className="mt-6 inline-flex items-center rounded-full border border-[#7f8cff]/20 bg-[#7f8cff]/[0.07] px-3 py-1.5 text-[11px] font-bold text-[#9da6ff]">
              La red de estudiantes y graduados
            </div>

            <h1 className="mx-auto mt-6 max-w-[390px] text-[34px] font-black leading-[1.05] tracking-[-0.055em] text-white">
              Las conexiones que empiezan en la universidad pueden llegar mucho más lejos.
            </h1>

            <p className="mx-auto mt-5 max-w-[360px] text-[15px] leading-6 text-zinc-500">
              Comparte logros, descubre profesionales, encuentra eventos y mantén viva tu comunidad académica.
            </p>
          </div>

          {/* Solo queda un juego de acciones en móvil. */}
          <div className="mt-9 space-y-3">
            <Link
              href="/register"
              className="group flex h-[58px] w-full items-center rounded-[18px] bg-[#6d7cff] px-5 text-sm font-black text-white shadow-[0_18px_45px_rgba(109,124,255,.20)] transition active:scale-[0.985]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.10]">
                <Users size={17} />
              </span>

              <span className="ml-4">Únete a Alumni</span>

              <ArrowRight
                size={18}
                className="ml-auto opacity-90 transition group-active:translate-x-0.5"
              />
            </Link>

            <Link
              href="/login"
              className="group flex h-[58px] w-full items-center rounded-[18px] border border-white/[0.09] bg-white/[0.035] px-5 text-sm font-bold text-zinc-300 backdrop-blur transition active:scale-[0.985]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04]">
                <ArrowRight size={17} className="rotate-180 text-[#8d98ff]" />
              </span>

              <span className="ml-4">Accede a tu cuenta</span>

              <ArrowRight
                size={18}
                className="ml-auto text-zinc-500 transition group-active:translate-x-0.5"
              />
            </Link>
          </div>

          {/* Conserva la idea de "Tu comunidad" del inicio actual, pero más compacta para teléfono. */}
          <div className="mt-9 border-t border-white/[0.07] pt-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700">
                  Tu comunidad
                </p>
                <p className="mt-1 text-[17px] font-black tracking-[-0.03em] text-zinc-200">
                  Todo lo importante, en un solo lugar.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
              {mobileFeatures.map(({ Icon, title, description }) => (
                <div key={title} className="min-w-0">
                  <Icon size={18} className="text-[#8d98ff]" />
                  <p className="mt-2 text-[12px] font-black text-zinc-300">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] leading-[1.45] text-zinc-600">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DesktopLanding() {
  /*
   * IMPORTANTE:
   * Este bloque conserva el diseño web existente.
   * Solo se muestra desde md en adelante.
   */
  return (
    <main className="hidden min-h-screen overflow-hidden bg-[#090b0f] text-white md:block">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-8">
          <Link
            href="/"
            className="alumni-brand inline-flex text-xl font-black tracking-[-0.055em]"
            aria-label="Alumni."
          >
            Alumni<span className="alumni-brand-dot">.</span>
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
              Conexiones que te llevan más lejos.
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
        Cargando Alumni...
      </main>
    );
  }

  return (
    <>
      <MobileLanding />
      <DesktopLanding />
    </>
  );
}

/* ALUMNI_1_3_3_VISUAL_UX_HOTFIX:PC_HERO */
