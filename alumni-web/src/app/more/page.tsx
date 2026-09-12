"use client";

import Link from "next/link";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  CalendarDays,
  ChevronRight,
  Info,
  MessageCircleMore,
  Settings2,
  UsersRound,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import "./more-premium.css";

const actionItems = [
  {
    href: "/settings",
    label: "Ajustes",
    icon: Settings2,
  },
  {
    href: "/feedback",
    label: "Enviar feedback",
    icon: MessageCircleMore,
    tone: "accent",
  },
];

const informationItems = [
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
      <main
        className="alumni-more-clean mx-auto w-full max-w-[680px]"
        data-alumni-motion-ignore="true"
      >
        <motion.header
          className="alumni-more-clean-header"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: -6,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.4,
            ease: [
              0.2,
              0.8,
              0.2,
              1,
            ],
          }}
        >
          <h1>
            Conecta con más
          </h1>
        </motion.header>

        <section className="alumni-more-clean-featured">
          <motion.div
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 10,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.07,
              duration: 0.4,
            }}
            whileTap={
              reduceMotion
                ? undefined
                : {
                    scale: 0.98,
                  }
            }
          >
            <Link
              href="/events"
              className="alumni-more-clean-card"
            >
              <span className="alumni-more-clean-card-icon">
                <CalendarDays
                  size={21}
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
                    y: 10,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12,
              duration: 0.4,
            }}
            whileTap={
              reduceMotion
                ? undefined
                : {
                    scale: 0.98,
                  }
            }
          >
            <Link
              href="/community"
              className="alumni-more-clean-card"
            >
              <span className="alumni-more-clean-card-icon">
                <UsersRound
                  size={21}
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
                  y: 10,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.16,
            duration: 0.42,
          }}
        >
          <div className="alumni-more-clean-list">
            {actionItems.map(
              ({
                href,
                label,
                icon: Icon,
                tone,
              }) => (
                <Link
                  key={href}
                  href={href}
                  className={`alumni-more-clean-row${tone === "accent" ? " is-accent" : ""}`}
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
              )
            )}
          </div>

          <div className="alumni-more-clean-list alumni-more-clean-list-information">
            {informationItems.map(
              ({
                href,
                label,
                icon: Icon,
              }) => (
                <Link
                  key={href}
                  href={href}
                  className="alumni-more-clean-row is-information"
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
              )
            )}
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_MORE_CLEAN_2_1 */
/* ALUMNI_STABILITY_PASS_1_0 */

/* ALUMNI_MORE_INFORMATION_REORDER_1_0 */
