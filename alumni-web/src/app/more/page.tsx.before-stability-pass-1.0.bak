"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Info,
  Settings2,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import "./more-premium.css";

const settingsItems = [
  {
    href: "/settings",
    label: "Configuración",
    icon: Settings2,
  },
  {
    href: "/notifications",
    label: "Notificaciones",
    icon: Bell,
  },
  {
    href:
      "/settings?section=profile&view=saved",
    label: "Guardados",
    icon: Bookmark,
  },
  {
    href: "/passport",
    label: "Pasaporte Alumni",
    icon: BookOpen,
  },
  {
    href: "/feedback",
    label: "Ayuda y feedback",
    icon: CircleHelp,
  },
  {
    href: "/about",
    label: "Acerca de ALUMNI",
    icon: Info,
  },
];

export default function MorePage() {
  const reduceMotion =
    useReducedMotion();

  return (
    <AppShell>
      <main className="alumni-more-clean mx-auto w-full max-w-[680px]">
        <motion.header
          className="alumni-more-clean-header"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: -8,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.42,
            ease: [
              0.2,
              0.8,
              0.2,
              1,
            ],
          }}
        >
          <h1>Más</h1>
        </motion.header>

        <section className="alumni-more-clean-featured">
          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 16,
                    scale: 0.985,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.08,
              duration: 0.45,
              ease: [
                0.2,
                0.8,
                0.2,
                1,
              ],
            }}
            whileTap={
              reduceMotion
                ? undefined
                : {
                    scale: 0.975,
                  }
            }
          >
            <Link
              href="/events"
              className="alumni-more-clean-card"
            >
              <span className="alumni-more-clean-card-icon">
                <CalendarDays
                  size={22}
                  strokeWidth={1.9}
                />
              </span>

              <strong>
                Eventos
              </strong>

              <ChevronRight
                size={17}
              />
            </Link>
          </motion.div>

          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 16,
                    scale: 0.985,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.13,
              duration: 0.45,
              ease: [
                0.2,
                0.8,
                0.2,
                1,
              ],
            }}
            whileTap={
              reduceMotion
                ? undefined
                : {
                    scale: 0.975,
                  }
            }
          >
            <Link
              href="/community"
              className="alumni-more-clean-card"
            >
              <span className="alumni-more-clean-card-icon">
                <UsersRound
                  size={22}
                  strokeWidth={1.9}
                />
              </span>

              <strong>
                Comunidades
              </strong>

              <ChevronRight
                size={17}
              />
            </Link>
          </motion.div>
        </section>

        <motion.section
          className="alumni-more-clean-settings"
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
            amount: 0.2,
          }}
          transition={{
            duration: 0.48,
            ease: [
              0.2,
              0.8,
              0.2,
              1,
            ],
          }}
        >
          <h2>Ajustes</h2>

          <div className="alumni-more-clean-list">
            {settingsItems.map(
              (
                {
                  href,
                  label,
                  icon: Icon,
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
                          x: -10,
                        }
                  }
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                  }}
                  transition={{
                    delay:
                      reduceMotion
                        ? 0
                        : index *
                          0.035,
                    duration: 0.32,
                  }}
                >
                  <Link
                    href={href}
                    className="alumni-more-clean-row"
                  >
                    <span className="alumni-more-clean-row-icon">
                      <Icon
                        size={18}
                        strokeWidth={1.9}
                      />
                    </span>

                    <strong>
                      {label}
                    </strong>

                    <ChevronRight
                      size={17}
                    />
                  </Link>
                </motion.div>
              )
            )}
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_MORE_CLEAN_2_1 */
