"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Braces,
  Code2,
  Database,
  Heart,
  Layers3,
  LockKeyhole,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WandSparkles,
  Wrench,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import "../about.css";

const technologies = [
  "Next.js",
  "React",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "Capacitor",
];

const capabilities = [
  {
    icon: WandSparkles,
    index: "01",
    title: "Producto",
    body:
      "Convertir una idea en decisiones reales: qué construir, qué quitar y qué debe sentirse simple.",
  },
  {
    icon: Braces,
    index: "02",
    title: "Experiencia",
    body:
      "Interfaces mobile-first, interacción, motion y detalles visuales pensados como parte del producto.",
  },
  {
    icon: Database,
    index: "03",
    title: "Infraestructura",
    body:
      "Datos, autenticación, realtime, rendimiento y lógica que hacen que ALUMNI funcione más allá de la pantalla.",
  },
  {
    icon: LockKeyhole,
    index: "04",
    title: "Seguridad",
    body:
      "Permisos, moderación, protección contra abuso y controles diseñados para una comunidad real.",
  },
];

const journey = [
  {
    icon: Sparkles,
    kicker: "El comienzo",
    title: "Primero existió una pregunta",
    body:
      "ALUMNI comenzó pensando en algo sencillo: ¿qué pasa con las conexiones que construimos cuando una etapa termina? La respuesta no era otra red social por tener una más. La idea era crear un lugar donde las personas pudieran volver a encontrarse, descubrir qué están construyendo y mantener abiertas nuevas oportunidades.",
  },
  {
    icon: Code2,
    kicker: "Construir solo",
    title: "Aprender lo que hiciera falta",
    body:
      "Crear una aplicación completa prácticamente solo significó asumir producto, diseño, frontend, backend, base de datos, seguridad, pruebas y decisiones de experiencia al mismo tiempo. No se trató de saberlo todo desde el inicio. Se trató de aprender la siguiente pieza cada vez que el proyecto la necesitaba.",
  },
  {
    icon: Wrench,
    kicker: "Iterar",
    title: "La primera solución casi nunca fue la última",
    body:
      "El feed cambió, los perfiles evolucionaron, la mensajería se simplificó, la navegación se hizo más clara y muchas ideas fueron descartadas después de verlas funcionando. ALUMNI se fue construyendo con una regla constante: si algo puede sentirse mejor, todavía no está terminado.",
  },
  {
    icon: Layers3,
    kicker: "Sistema",
    title: "De pantallas bonitas a un producto conectado",
    body:
      "Perfiles, publicaciones, comentarios, mensajería, búsqueda, eventos, comunidades, notificaciones y administración empezaron a convivir dentro del mismo sistema. El reto dejó de ser hacer una pantalla; pasó a ser conseguir que toda la aplicación se sintiera como una sola experiencia.",
  },
  {
    icon: ShieldCheck,
    kicker: "Responsabilidad",
    title: "Una comunidad necesita confianza",
    body:
      "Cuando el producto empezó a crecer, seguridad y moderación dejaron de ser tareas para después. Permisos, reglas de acceso, verificación, auditoría, anti-spam y controles administrativos se convirtieron en parte de la arquitectura. Construir una comunidad también significa protegerla.",
  },
  {
    icon: Rocket,
    kicker: "Ahora",
    title: "Lo construido es solamente la base",
    body:
      "ALUMNI ya puede verse y sentirse como un producto real, pero esa no es la meta final. Cada versión abre la puerta a una mejor. El objetivo sigue siendo construir algo útil, humano y capaz de crecer sin perder la intención con la que comenzó.",
  },
];

const platformHighlights = [
  {
    icon: Smartphone,
    title: "Web + Android",
    body: "Una misma experiencia pensada para vivir donde está la comunidad.",
  },
  {
    icon: Boxes,
    title: "Full-stack",
    body: "Producto, interfaz, datos y servicios conectados de extremo a extremo.",
  },
  {
    icon: ShieldCheck,
    title: "Pensado para producción",
    body: "Rendimiento, seguridad, moderación y operación forman parte del diseño.",
  },
];

export default function DeveloperAboutPage() {
  const reduceMotion =
    useReducedMotion();

  const {
    scrollYProgress,
  } = useScroll();

  const progress =
    useSpring(
      scrollYProgress,
      reduceMotion
        ? {
            stiffness: 1000,
            damping: 1000,
          }
        : {
            stiffness: 150,
            damping: 28,
            mass: 0.22,
          }
    );

  return (
    <AppShell>
      <motion.div
        className="alumni-dev-scroll-progress"
        style={{
          scaleX: progress,
        }}
        aria-hidden="true"
      />

      <main className="alumni-about-page alumni-developer-page alumni-dev-showcase mx-auto w-full max-w-[680px]">
        <header className="alumni-about-topbar alumni-dev-topbar">
          <Link
            href="/about"
            className="alumni-about-back"
            aria-label="Volver"
          >
            <ArrowLeft size={19} />
          </Link>

          <motion.h1
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
              duration: 0.45,
            }}
          >
            Desarrollador
          </motion.h1>

          <span className="alumni-about-topbar-spacer" />
        </header>

        <motion.section
          className="alumni-dev-hero"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 20,
                  scale: 0.985,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <div
            className="alumni-dev-orbit alumni-dev-orbit-one"
            aria-hidden="true"
          />
          <div
            className="alumni-dev-orbit alumni-dev-orbit-two"
            aria-hidden="true"
          />

          <motion.div
            className="alumni-dev-build-badge"
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
              delay: 0.18,
              duration: 0.45,
            }}
          >
            <Sparkles size={13} />
            Construido desde cero
          </motion.div>

          <motion.div
            className="alumni-dev-avatar-shell"
            initial={
              reduceMotion
                ? false
                : {
                    rotate: -8,
                    scale: 0.82,
                  }
            }
            animate={{
              rotate: 0,
              scale: 1,
            }}
            transition={{
              delay: 0.16,
              type: "spring",
              stiffness: 160,
              damping: 14,
            }}
          >
            <div className="alumni-dev-avatar">
              <Code2
                size={32}
                strokeWidth={1.8}
              />
            </div>
          </motion.div>

          <motion.p
            className="alumni-dev-kicker"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.24,
              duration: 0.45,
            }}
          >
            Detrás de ALUMNI
          </motion.p>

          <motion.h2
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.3,
              duration: 0.5,
            }}
          >
            Sami
          </motion.h2>

          <motion.p
            className="alumni-dev-role"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                  }
            }
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.38,
              duration: 0.5,
            }}
          >
            Fundador &amp; desarrollador
          </motion.p>

          <motion.h3
            className="alumni-dev-hero-statement"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                    y: 16,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.42,
              duration: 0.6,
            }}
          >
            Una idea.
            <br />
            Una persona.
            <br />
            <span>Un producto completo.</span>
          </motion.h3>

          <motion.p
            className="alumni-dev-hero-copy"
            initial={
              reduceMotion
                ? false
                : {
                    opacity: 0,
                  }
            }
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.55,
              duration: 0.6,
            }}
          >
            ALUMNI nació aprendiendo una pieza a la vez:
            producto, diseño, código, datos, seguridad y todo
            lo que hace falta para convertir una idea en una
            experiencia real.
          </motion.p>

          <motion.div
            className="alumni-dev-tech-row"
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
              delay: 0.65,
              duration: 0.5,
            }}
          >
            {technologies.map(
              (technology) => (
                <span key={technology}>
                  {technology}
                </span>
              )
            )}
          </motion.div>

          <motion.div
            className="alumni-dev-scroll-cue"
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, 5, 0],
                  }
            }
            transition={{
              duration: 1.7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            aria-hidden="true"
          >
            <i />
          </motion.div>
        </motion.section>

        <motion.section
          className="alumni-dev-manifesto"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 22,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.35,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <span>La idea detrás del proceso</span>
          <blockquote>
            “No necesitaba saber construirlo todo desde el
            primer día. Necesitaba estar dispuesto a aprender
            todo lo que el siguiente problema exigiera.”
          </blockquote>
        </motion.section>

        <section className="alumni-dev-section">
          <motion.div
            className="alumni-dev-section-heading"
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
              amount: 0.5,
            }}
          >
            <small>De extremo a extremo</small>
            <h2>
              Mucho más que escribir código.
            </h2>
            <p>
              Construir ALUMNI significó aprender a mirar el
              mismo producto desde cuatro lados diferentes.
            </p>
          </motion.div>

          <div className="alumni-dev-capability-grid">
            {capabilities.map(
              (
                {
                  icon: Icon,
                  index,
                  title,
                  body,
                },
                itemIndex
              ) => (
                <motion.article
                  key={title}
                  className="alumni-dev-capability-card"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 24,
                          scale: 0.98,
                        }
                  }
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.3,
                  }}
                  transition={{
                    delay:
                      reduceMotion
                        ? 0
                        : itemIndex *
                          0.07,
                    duration: 0.5,
                  }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          y: -4,
                        }
                  }
                >
                  <div className="alumni-dev-capability-top">
                    <span className="alumni-dev-capability-icon">
                      <Icon size={18} />
                    </span>
                    <span className="alumni-dev-capability-index">
                      {index}
                    </span>
                  </div>

                  <h3>{title}</h3>
                  <p>{body}</p>
                </motion.article>
              )
            )}
          </div>
        </section>

        <section className="alumni-dev-section alumni-dev-journey-section">
          <motion.div
            className="alumni-dev-section-heading"
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
              amount: 0.5,
            }}
          >
            <small>El camino</small>
            <h2>
              Lo que no se ve cuando una app simplemente
              funciona.
            </h2>
          </motion.div>

          <div className="alumni-dev-timeline-v2">
            {journey.map(
              (
                {
                  icon: Icon,
                  kicker,
                  title,
                  body,
                },
                index
              ) => (
                <motion.article
                  key={title}
                  className="alumni-dev-timeline-item"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          x: -18,
                        }
                  }
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.25,
                  }}
                  transition={{
                    duration: 0.55,
                  }}
                >
                  <div className="alumni-dev-timeline-rail">
                    <motion.span
                      className="alumni-dev-timeline-node"
                      initial={
                        reduceMotion
                          ? false
                          : {
                              scale: 0.72,
                            }
                      }
                      whileInView={{
                        scale: 1,
                      }}
                      viewport={{
                        once: true,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 14,
                      }}
                    >
                      <Icon size={16} />
                    </motion.span>

                    {index <
                      journey.length -
                        1 && (
                      <motion.i
                        initial={
                          reduceMotion
                            ? false
                            : {
                                scaleY: 0,
                              }
                        }
                        whileInView={{
                          scaleY: 1,
                        }}
                        viewport={{
                          once: true,
                          amount: 0.3,
                        }}
                        transition={{
                          duration: 0.7,
                          delay: 0.12,
                        }}
                      />
                    )}
                  </div>

                  <div className="alumni-dev-timeline-copy">
                    <small>
                      0{index + 1} ·{" "}
                      {kicker}
                    </small>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </motion.article>
              )
            )}
          </div>
        </section>

        <motion.section
          className="alumni-dev-stack-showcase"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 24,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.25,
          }}
          transition={{
            duration: 0.6,
          }}
        >
          <div className="alumni-dev-stack-header">
            <span className="alumni-dev-stack-symbol">
              <Layers3 size={21} />
            </span>
            <div>
              <small>
                Tecnología real
              </small>
              <h2>
                No es una maqueta.
              </h2>
            </div>
          </div>

          <p className="alumni-dev-stack-intro">
            ALUMNI conecta una aplicación web moderna con una
            capa móvil, servicios de datos, autenticación,
            realtime y herramientas de operación.
          </p>

          <div className="alumni-dev-platform-grid">
            {platformHighlights.map(
              (
                {
                  icon: Icon,
                  title,
                  body,
                },
                index
              ) => (
                <motion.div
                  key={title}
                  className="alumni-dev-platform-card"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 16,
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
                    delay:
                      reduceMotion
                        ? 0
                        : index *
                          0.08,
                    duration: 0.45,
                  }}
                >
                  <Icon size={18} />
                  <strong>
                    {title}
                  </strong>
                  <span>{body}</span>
                </motion.div>
              )
            )}
          </div>

          <div className="alumni-dev-code-line">
            <span>$</span>
            <code>
              idea → diseño → código → producto → comunidad
            </code>
            <i />
          </div>
        </motion.section>

        <motion.section
          className="alumni-dev-closing-v2"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 26,
                  scale: 0.985,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{
            once: true,
            amount: 0.35,
          }}
          transition={{
            duration: 0.65,
          }}
        >
          <motion.div
            className="alumni-dev-closing-mark"
            animate={
              reduceMotion
                ? undefined
                : {
                    rotate: [
                      0, 5, -5, 0,
                    ],
                  }
            }
            transition={{
              duration: 5,
              repeat: Infinity,
              repeatDelay: 2,
            }}
          >
            <Heart size={20} />
          </motion.div>

          <small>
            Todavía estamos empezando
          </small>

          <h2>
            Lo mejor de ALUMNI todavía no ha sido construido.
          </h2>

          <p>
            Si estás viendo esta pantalla, ya formas parte de
            la historia. Cada prueba, conversación, error,
            sugerencia y persona que usa ALUMNI ayuda a decidir
            qué versión viene después.
          </p>

          <div className="alumni-dev-signature">
            <span>S</span>
            <div>
              <strong>Sami</strong>
              <small>
                Fundador &amp; desarrollador de ALUMNI
              </small>
            </div>
          </div>
        </motion.section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_ABOUT_1_0_APP_STORE */
/* ALUMNI_DEVELOPER_SHOWCASE_1_1 */
