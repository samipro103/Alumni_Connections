"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Info,
  MessageCircleMore,
  Search,
  Settings2,
  Sparkles,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import "./more-premium.css";

type MoreItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
  }>;
  tag?: string;
};

const exploreItems: MoreItem[] = [
  {
    href: "/search",
    label: "Buscar",
    description:
      "Descubre personas, publicaciones y conexiones.",
    icon: Search,
  },
  {
    href: "/messages",
    label: "Mensajes",
    description:
      "Sigue conversaciones y mantén el contacto.",
    icon: MessageCircleMore,
  },
];

const communityItems: MoreItem[] = [
  {
    href: "/communities",
    label: "Comunidades",
    description:
      "Participa en grupos y espacios compartidos.",
    icon: UsersRound,
  },
  {
    href: "/events",
    label: "Eventos",
    description:
      "Encuentra encuentros, actividades y experiencias.",
    icon: CalendarDays,
  },
];

const systemItems: MoreItem[] = [
  {
    href: "/feedback",
    label: "Feedback",
    description:
      "Reporta problemas y propón mejoras para ALUMNI.",
    icon: CircleHelp,
  },
  {
    href: "/about",
    label: "Acerca de ALUMNI",
    description:
      "Conoce la app, su autor y el camino del proyecto.",
    icon: Info,
    tag: "Nuevo",
  },
  {
    href: "/settings",
    label: "Ajustes",
    description:
      "Personaliza tu experiencia, notificaciones y cuenta.",
    icon: Settings2,
  },
];

function Section({
  eyebrow,
  title,
  copy,
  items,
  delay = 0,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  items: MoreItem[];
  delay?: number;
}) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.section
      className="alumni-more-premium-section"
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 18,
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.18,
      }}
      transition={{
        duration: 0.46,
        delay:
          reduceMotion
            ? 0
            : delay,
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
    >
      <header className="alumni-more-premium-section-head">
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{copy}</p>
      </header>

      <div className="alumni-more-premium-list">
        {items.map(
          (
            {
              href,
              label,
              description,
              icon: Icon,
              tag,
            },
            index
          ) => (
            <motion.div
              key={href}
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 12,
                    }
              }
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.34,
                delay:
                  reduceMotion
                    ? 0
                    : delay +
                      index * 0.05,
              }}
            >
              <Link
                href={href}
                className="alumni-more-premium-row"
                data-alumni-motion="card"
              >
                <span className="alumni-more-premium-row-icon">
                  <Icon
                    size={18}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="alumni-more-premium-row-copy">
                  <span className="alumni-more-premium-row-top">
                    <strong>{label}</strong>

                    {tag && (
                      <em>{tag}</em>
                    )}
                  </span>

                  <small>
                    {description}
                  </small>
                </span>

                <ChevronRight
                  size={18}
                  className="alumni-more-premium-row-chevron"
                />
              </Link>
            </motion.div>
          )
        )}
      </div>
    </motion.section>
  );
}

export default function MorePage() {
  const reduceMotion =
    useReducedMotion();

  return (
    <AppShell>
      <main className="alumni-more-premium-page mx-auto w-full max-w-[680px]">
        <motion.section
          className="alumni-more-premium-hero"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 18,
                  scale: 0.992,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.58,
            ease: [
              0.2,
              0.8,
              0.2,
              1,
            ],
          }}
        >
          <div
            className="alumni-more-premium-orbit alumni-more-premium-orbit-a"
            aria-hidden="true"
          />
          <div
            className="alumni-more-premium-orbit alumni-more-premium-orbit-b"
            aria-hidden="true"
          />

          <motion.span
            className="alumni-more-premium-badge"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    scale: 0.9,
                  }
            }
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              delay: 0.12,
              duration: 0.38,
            }}
          >
            <Sparkles size={13} />
            Más claridad, menos ruido
          </motion.span>

          <h1>Más</h1>

          <p>
            Un espacio limpio para acceder a funciones,
            comunidad y soporte sin que todo se vea
            amontonado.
          </p>

          <div className="alumni-more-premium-note">
            Separé las opciones normales de las opciones del
            sistema para que la navegación se sienta más
            profesional y enfocada.
          </div>
        </motion.section>

        <Section
          eyebrow="ACCESO RÁPIDO"
          title="Explorar y conectar"
          copy="Lo principal para moverte dentro de la experiencia diaria de ALUMNI."
          items={exploreItems}
          delay={0.05}
        />

        <Section
          eyebrow="COMUNIDAD"
          title="Espacios y actividades"
          copy="Todo lo relacionado con participación, grupos y encuentros."
          items={communityItems}
          delay={0.08}
        />

        <Section
          eyebrow="SOPORTE Y SISTEMA"
          title="Cuenta, ayuda y producto"
          copy="Aquí viven las opciones de ajustes, feedback y la información de ALUMNI."
          items={systemItems}
          delay={0.11}
        />
      </main>
    </AppShell>
  );
}

/* ALUMNI_VISUAL_LANGUAGE_1_0_MORE_GROUPED */
