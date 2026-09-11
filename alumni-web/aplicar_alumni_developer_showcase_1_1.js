const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_DEVELOPER_SHOWCASE_1_1";

const PAGE =
  "src/app/about/developer/page.tsx";
const CSS =
  "src/app/about/about.css";

function abs(rel) {
  return path.join(
    ROOT,
    rel
  );
}

function fail(message) {
  console.error(
    "❌ " + message
  );
  process.exit(1);
}

function read(rel) {
  if (
    !fs.existsSync(
      abs(rel)
    )
  ) {
    fail(
      `No encontré ${rel}`
    );
  }

  return fs
    .readFileSync(
      abs(rel),
      "utf8"
    )
    .replace(/\r\n/g, "\n");
}

function backup(
  rel,
  content
) {
  const target =
    abs(rel) +
    ".before-developer-showcase-1.1.bak";

  if (
    !fs.existsSync(
      target
    )
  ) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

if (
  !fs.existsSync(
    abs("package.json")
  )
) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let currentPage =
  read(PAGE);
let currentCss =
  read(CSS);

if (
  currentPage.includes(
    MARKER
  )
) {
  console.log(
    "✅ Developer Showcase 1.1 ya estaba aplicado."
  );
  process.exit(0);
}

if (
  !currentPage.includes(
    "ALUMNI_ABOUT_1_0_APP_STORE"
  )
) {
  fail(
    "Primero debe estar aplicado ALUMNI Acerca de 1.0."
  );
}

if (
  !fs.existsSync(
    abs(
      "node_modules/framer-motion"
    )
  )
) {
  console.warn(
    "⚠️ No encontré node_modules/framer-motion. npm install debe estar ejecutado."
  );
}

backup(
  PAGE,
  currentPage
);
backup(
  CSS,
  currentCss
);

const nextPage =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  ArrowLeft,\n  Boxes,\n  Braces,\n  Code2,\n  Database,\n  Heart,\n  Layers3,\n  LockKeyhole,\n  Rocket,\n  ShieldCheck,\n  Smartphone,\n  Sparkles,\n  WandSparkles,\n  Wrench,\n} from \"lucide-react\";\nimport {\n  motion,\n  useReducedMotion,\n  useScroll,\n  useSpring,\n} from \"framer-motion\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"../about.css\";\n\nconst technologies = [\n  \"Next.js\",\n  \"React\",\n  \"TypeScript\",\n  \"Supabase\",\n  \"PostgreSQL\",\n  \"Capacitor\",\n];\n\nconst capabilities = [\n  {\n    icon: WandSparkles,\n    index: \"01\",\n    title: \"Producto\",\n    body:\n      \"Convertir una idea en decisiones reales: qué construir, qué quitar y qué debe sentirse simple.\",\n  },\n  {\n    icon: Braces,\n    index: \"02\",\n    title: \"Experiencia\",\n    body:\n      \"Interfaces mobile-first, interacción, motion y detalles visuales pensados como parte del producto.\",\n  },\n  {\n    icon: Database,\n    index: \"03\",\n    title: \"Infraestructura\",\n    body:\n      \"Datos, autenticación, realtime, rendimiento y lógica que hacen que ALUMNI funcione más allá de la pantalla.\",\n  },\n  {\n    icon: LockKeyhole,\n    index: \"04\",\n    title: \"Seguridad\",\n    body:\n      \"Permisos, moderación, protección contra abuso y controles diseñados para una comunidad real.\",\n  },\n];\n\nconst journey = [\n  {\n    icon: Sparkles,\n    kicker: \"El comienzo\",\n    title: \"Primero existió una pregunta\",\n    body:\n      \"ALUMNI comenzó pensando en algo sencillo: ¿qué pasa con las conexiones que construimos cuando una etapa termina? La respuesta no era otra red social por tener una más. La idea era crear un lugar donde las personas pudieran volver a encontrarse, descubrir qué están construyendo y mantener abiertas nuevas oportunidades.\",\n  },\n  {\n    icon: Code2,\n    kicker: \"Construir solo\",\n    title: \"Aprender lo que hiciera falta\",\n    body:\n      \"Crear una aplicación completa prácticamente solo significó asumir producto, diseño, frontend, backend, base de datos, seguridad, pruebas y decisiones de experiencia al mismo tiempo. No se trató de saberlo todo desde el inicio. Se trató de aprender la siguiente pieza cada vez que el proyecto la necesitaba.\",\n  },\n  {\n    icon: Wrench,\n    kicker: \"Iterar\",\n    title: \"La primera solución casi nunca fue la última\",\n    body:\n      \"El feed cambió, los perfiles evolucionaron, la mensajería se simplificó, la navegación se hizo más clara y muchas ideas fueron descartadas después de verlas funcionando. ALUMNI se fue construyendo con una regla constante: si algo puede sentirse mejor, todavía no está terminado.\",\n  },\n  {\n    icon: Layers3,\n    kicker: \"Sistema\",\n    title: \"De pantallas bonitas a un producto conectado\",\n    body:\n      \"Perfiles, publicaciones, comentarios, mensajería, búsqueda, eventos, comunidades, notificaciones y administración empezaron a convivir dentro del mismo sistema. El reto dejó de ser hacer una pantalla; pasó a ser conseguir que toda la aplicación se sintiera como una sola experiencia.\",\n  },\n  {\n    icon: ShieldCheck,\n    kicker: \"Responsabilidad\",\n    title: \"Una comunidad necesita confianza\",\n    body:\n      \"Cuando el producto empezó a crecer, seguridad y moderación dejaron de ser tareas para después. Permisos, reglas de acceso, verificación, auditoría, anti-spam y controles administrativos se convirtieron en parte de la arquitectura. Construir una comunidad también significa protegerla.\",\n  },\n  {\n    icon: Rocket,\n    kicker: \"Ahora\",\n    title: \"Lo construido es solamente la base\",\n    body:\n      \"ALUMNI ya puede verse y sentirse como un producto real, pero esa no es la meta final. Cada versión abre la puerta a una mejor. El objetivo sigue siendo construir algo útil, humano y capaz de crecer sin perder la intención con la que comenzó.\",\n  },\n];\n\nconst platformHighlights = [\n  {\n    icon: Smartphone,\n    title: \"Web + Android\",\n    body: \"Una misma experiencia pensada para vivir donde está la comunidad.\",\n  },\n  {\n    icon: Boxes,\n    title: \"Full-stack\",\n    body: \"Producto, interfaz, datos y servicios conectados de extremo a extremo.\",\n  },\n  {\n    icon: ShieldCheck,\n    title: \"Pensado para producción\",\n    body: \"Rendimiento, seguridad, moderación y operación forman parte del diseño.\",\n  },\n];\n\nexport default function DeveloperAboutPage() {\n  const reduceMotion =\n    useReducedMotion();\n\n  const {\n    scrollYProgress,\n  } = useScroll();\n\n  const progress =\n    useSpring(\n      scrollYProgress,\n      reduceMotion\n        ? {\n            stiffness: 1000,\n            damping: 1000,\n          }\n        : {\n            stiffness: 150,\n            damping: 28,\n            mass: 0.22,\n          }\n    );\n\n  return (\n    <AppShell>\n      <motion.div\n        className=\"alumni-dev-scroll-progress\"\n        style={{\n          scaleX: progress,\n        }}\n        aria-hidden=\"true\"\n      />\n\n      <main className=\"alumni-about-page alumni-developer-page alumni-dev-showcase mx-auto w-full max-w-[680px]\">\n        <header className=\"alumni-about-topbar alumni-dev-topbar\">\n          <Link\n            href=\"/about\"\n            className=\"alumni-about-back\"\n            aria-label=\"Volver\"\n          >\n            <ArrowLeft size={19} />\n          </Link>\n\n          <motion.h1\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: -8,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              duration: 0.45,\n            }}\n          >\n            Desarrollador\n          </motion.h1>\n\n          <span className=\"alumni-about-topbar-spacer\" />\n        </header>\n\n        <motion.section\n          className=\"alumni-dev-hero\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 20,\n                  scale: 0.985,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n            scale: 1,\n          }}\n          transition={{\n            duration: 0.7,\n            ease: [0.2, 0.8, 0.2, 1],\n          }}\n        >\n          <div\n            className=\"alumni-dev-orbit alumni-dev-orbit-one\"\n            aria-hidden=\"true\"\n          />\n          <div\n            className=\"alumni-dev-orbit alumni-dev-orbit-two\"\n            aria-hidden=\"true\"\n          />\n\n          <motion.div\n            className=\"alumni-dev-build-badge\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    scale: 0.9,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              scale: 1,\n            }}\n            transition={{\n              delay: 0.18,\n              duration: 0.45,\n            }}\n          >\n            <Sparkles size={13} />\n            Construido desde cero\n          </motion.div>\n\n          <motion.div\n            className=\"alumni-dev-avatar-shell\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    rotate: -8,\n                    scale: 0.82,\n                  }\n            }\n            animate={{\n              rotate: 0,\n              scale: 1,\n            }}\n            transition={{\n              delay: 0.16,\n              type: \"spring\",\n              stiffness: 160,\n              damping: 14,\n            }}\n          >\n            <div className=\"alumni-dev-avatar\">\n              <Code2\n                size={32}\n                strokeWidth={1.8}\n              />\n            </div>\n          </motion.div>\n\n          <motion.p\n            className=\"alumni-dev-kicker\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 8,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.24,\n              duration: 0.45,\n            }}\n          >\n            Detrás de ALUMNI\n          </motion.p>\n\n          <motion.h2\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 12,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.3,\n              duration: 0.5,\n            }}\n          >\n            Sami\n          </motion.h2>\n\n          <motion.p\n            className=\"alumni-dev-role\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                  }\n            }\n            animate={{\n              opacity: 1,\n            }}\n            transition={{\n              delay: 0.38,\n              duration: 0.5,\n            }}\n          >\n            Fundador &amp; desarrollador\n          </motion.p>\n\n          <motion.h3\n            className=\"alumni-dev-hero-statement\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 16,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.42,\n              duration: 0.6,\n            }}\n          >\n            Una idea.\n            <br />\n            Una persona.\n            <br />\n            <span>Un producto completo.</span>\n          </motion.h3>\n\n          <motion.p\n            className=\"alumni-dev-hero-copy\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                  }\n            }\n            animate={{\n              opacity: 1,\n            }}\n            transition={{\n              delay: 0.55,\n              duration: 0.6,\n            }}\n          >\n            ALUMNI nació aprendiendo una pieza a la vez:\n            producto, diseño, código, datos, seguridad y todo\n            lo que hace falta para convertir una idea en una\n            experiencia real.\n          </motion.p>\n\n          <motion.div\n            className=\"alumni-dev-tech-row\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 10,\n                  }\n            }\n            animate={{\n              opacity: 1,\n              y: 0,\n            }}\n            transition={{\n              delay: 0.65,\n              duration: 0.5,\n            }}\n          >\n            {technologies.map(\n              (technology) => (\n                <span key={technology}>\n                  {technology}\n                </span>\n              )\n            )}\n          </motion.div>\n\n          <motion.div\n            className=\"alumni-dev-scroll-cue\"\n            animate={\n              reduceMotion\n                ? undefined\n                : {\n                    y: [0, 5, 0],\n                  }\n            }\n            transition={{\n              duration: 1.7,\n              repeat: Infinity,\n              ease: \"easeInOut\",\n            }}\n            aria-hidden=\"true\"\n          >\n            <i />\n          </motion.div>\n        </motion.section>\n\n        <motion.section\n          className=\"alumni-dev-manifesto\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 22,\n                }\n          }\n          whileInView={{\n            opacity: 1,\n            y: 0,\n          }}\n          viewport={{\n            once: true,\n            amount: 0.35,\n          }}\n          transition={{\n            duration: 0.6,\n          }}\n        >\n          <span>La idea detrás del proceso</span>\n          <blockquote>\n            “No necesitaba saber construirlo todo desde el\n            primer día. Necesitaba estar dispuesto a aprender\n            todo lo que el siguiente problema exigiera.”\n          </blockquote>\n        </motion.section>\n\n        <section className=\"alumni-dev-section\">\n          <motion.div\n            className=\"alumni-dev-section-heading\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 18,\n                  }\n            }\n            whileInView={{\n              opacity: 1,\n              y: 0,\n            }}\n            viewport={{\n              once: true,\n              amount: 0.5,\n            }}\n          >\n            <small>De extremo a extremo</small>\n            <h2>\n              Mucho más que escribir código.\n            </h2>\n            <p>\n              Construir ALUMNI significó aprender a mirar el\n              mismo producto desde cuatro lados diferentes.\n            </p>\n          </motion.div>\n\n          <div className=\"alumni-dev-capability-grid\">\n            {capabilities.map(\n              (\n                {\n                  icon: Icon,\n                  index,\n                  title,\n                  body,\n                },\n                itemIndex\n              ) => (\n                <motion.article\n                  key={title}\n                  className=\"alumni-dev-capability-card\"\n                  initial={\n                    reduceMotion\n                      ? false\n                      : {\n                          opacity: 0,\n                          y: 24,\n                          scale: 0.98,\n                        }\n                  }\n                  whileInView={{\n                    opacity: 1,\n                    y: 0,\n                    scale: 1,\n                  }}\n                  viewport={{\n                    once: true,\n                    amount: 0.3,\n                  }}\n                  transition={{\n                    delay:\n                      reduceMotion\n                        ? 0\n                        : itemIndex *\n                          0.07,\n                    duration: 0.5,\n                  }}\n                  whileHover={\n                    reduceMotion\n                      ? undefined\n                      : {\n                          y: -4,\n                        }\n                  }\n                >\n                  <div className=\"alumni-dev-capability-top\">\n                    <span className=\"alumni-dev-capability-icon\">\n                      <Icon size={18} />\n                    </span>\n                    <span className=\"alumni-dev-capability-index\">\n                      {index}\n                    </span>\n                  </div>\n\n                  <h3>{title}</h3>\n                  <p>{body}</p>\n                </motion.article>\n              )\n            )}\n          </div>\n        </section>\n\n        <section className=\"alumni-dev-section alumni-dev-journey-section\">\n          <motion.div\n            className=\"alumni-dev-section-heading\"\n            initial={\n              reduceMotion\n                ? false\n                : {\n                    opacity: 0,\n                    y: 18,\n                  }\n            }\n            whileInView={{\n              opacity: 1,\n              y: 0,\n            }}\n            viewport={{\n              once: true,\n              amount: 0.5,\n            }}\n          >\n            <small>El camino</small>\n            <h2>\n              Lo que no se ve cuando una app simplemente\n              funciona.\n            </h2>\n          </motion.div>\n\n          <div className=\"alumni-dev-timeline-v2\">\n            {journey.map(\n              (\n                {\n                  icon: Icon,\n                  kicker,\n                  title,\n                  body,\n                },\n                index\n              ) => (\n                <motion.article\n                  key={title}\n                  className=\"alumni-dev-timeline-item\"\n                  initial={\n                    reduceMotion\n                      ? false\n                      : {\n                          opacity: 0,\n                          x: -18,\n                        }\n                  }\n                  whileInView={{\n                    opacity: 1,\n                    x: 0,\n                  }}\n                  viewport={{\n                    once: true,\n                    amount: 0.25,\n                  }}\n                  transition={{\n                    duration: 0.55,\n                  }}\n                >\n                  <div className=\"alumni-dev-timeline-rail\">\n                    <motion.span\n                      className=\"alumni-dev-timeline-node\"\n                      initial={\n                        reduceMotion\n                          ? false\n                          : {\n                              scale: 0.72,\n                            }\n                      }\n                      whileInView={{\n                        scale: 1,\n                      }}\n                      viewport={{\n                        once: true,\n                      }}\n                      transition={{\n                        type: \"spring\",\n                        stiffness: 180,\n                        damping: 14,\n                      }}\n                    >\n                      <Icon size={16} />\n                    </motion.span>\n\n                    {index <\n                      journey.length -\n                        1 && (\n                      <motion.i\n                        initial={\n                          reduceMotion\n                            ? false\n                            : {\n                                scaleY: 0,\n                              }\n                        }\n                        whileInView={{\n                          scaleY: 1,\n                        }}\n                        viewport={{\n                          once: true,\n                          amount: 0.3,\n                        }}\n                        transition={{\n                          duration: 0.7,\n                          delay: 0.12,\n                        }}\n                      />\n                    )}\n                  </div>\n\n                  <div className=\"alumni-dev-timeline-copy\">\n                    <small>\n                      0{index + 1} ·{\" \"}\n                      {kicker}\n                    </small>\n                    <h3>{title}</h3>\n                    <p>{body}</p>\n                  </div>\n                </motion.article>\n              )\n            )}\n          </div>\n        </section>\n\n        <motion.section\n          className=\"alumni-dev-stack-showcase\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 24,\n                }\n          }\n          whileInView={{\n            opacity: 1,\n            y: 0,\n          }}\n          viewport={{\n            once: true,\n            amount: 0.25,\n          }}\n          transition={{\n            duration: 0.6,\n          }}\n        >\n          <div className=\"alumni-dev-stack-header\">\n            <span className=\"alumni-dev-stack-symbol\">\n              <Layers3 size={21} />\n            </span>\n            <div>\n              <small>\n                Tecnología real\n              </small>\n              <h2>\n                No es una maqueta.\n              </h2>\n            </div>\n          </div>\n\n          <p className=\"alumni-dev-stack-intro\">\n            ALUMNI conecta una aplicación web moderna con una\n            capa móvil, servicios de datos, autenticación,\n            realtime y herramientas de operación.\n          </p>\n\n          <div className=\"alumni-dev-platform-grid\">\n            {platformHighlights.map(\n              (\n                {\n                  icon: Icon,\n                  title,\n                  body,\n                },\n                index\n              ) => (\n                <motion.div\n                  key={title}\n                  className=\"alumni-dev-platform-card\"\n                  initial={\n                    reduceMotion\n                      ? false\n                      : {\n                          opacity: 0,\n                          y: 16,\n                        }\n                  }\n                  whileInView={{\n                    opacity: 1,\n                    y: 0,\n                  }}\n                  viewport={{\n                    once: true,\n                  }}\n                  transition={{\n                    delay:\n                      reduceMotion\n                        ? 0\n                        : index *\n                          0.08,\n                    duration: 0.45,\n                  }}\n                >\n                  <Icon size={18} />\n                  <strong>\n                    {title}\n                  </strong>\n                  <span>{body}</span>\n                </motion.div>\n              )\n            )}\n          </div>\n\n          <div className=\"alumni-dev-code-line\">\n            <span>$</span>\n            <code>\n              idea → diseño → código → producto → comunidad\n            </code>\n            <i />\n          </div>\n        </motion.section>\n\n        <motion.section\n          className=\"alumni-dev-closing-v2\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 26,\n                  scale: 0.985,\n                }\n          }\n          whileInView={{\n            opacity: 1,\n            y: 0,\n            scale: 1,\n          }}\n          viewport={{\n            once: true,\n            amount: 0.35,\n          }}\n          transition={{\n            duration: 0.65,\n          }}\n        >\n          <motion.div\n            className=\"alumni-dev-closing-mark\"\n            animate={\n              reduceMotion\n                ? undefined\n                : {\n                    rotate: [\n                      0, 5, -5, 0,\n                    ],\n                  }\n            }\n            transition={{\n              duration: 5,\n              repeat: Infinity,\n              repeatDelay: 2,\n            }}\n          >\n            <Heart size={20} />\n          </motion.div>\n\n          <small>\n            Todavía estamos empezando\n          </small>\n\n          <h2>\n            Lo mejor de ALUMNI todavía no ha sido construido.\n          </h2>\n\n          <p>\n            Si estás viendo esta pantalla, ya formas parte de\n            la historia. Cada prueba, conversación, error,\n            sugerencia y persona que usa ALUMNI ayuda a decidir\n            qué versión viene después.\n          </p>\n\n          <div className=\"alumni-dev-signature\">\n            <span>S</span>\n            <div>\n              <strong>Sami</strong>\n              <small>\n                Fundador &amp; desarrollador de ALUMNI\n              </small>\n            </div>\n          </div>\n        </motion.section>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_ABOUT_1_0_APP_STORE */\n/* ALUMNI_DEVELOPER_SHOWCASE_1_1 */\n";
const extraCss =
  "\n/* =========================================================\n   ALUMNI Developer Showcase 1.1\n   ========================================================= */\n\n.alumni-dev-showcase {\n  --dev-accent-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  --dev-accent-line:\n    color-mix(\n      in srgb,\n      var(--app-accent) 32%,\n      var(--app-border)\n    );\n  overflow: visible;\n}\n\n.alumni-dev-scroll-progress {\n  position: fixed;\n  z-index: 120;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 3px;\n  transform-origin: 0 50%;\n  background: var(--app-accent);\n  pointer-events: none;\n}\n\n.alumni-dev-topbar {\n  position: relative;\n  z-index: 4;\n}\n\n.alumni-dev-hero {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  min-height: 610px;\n  padding: 38px 24px 30px;\n  border: 1px solid var(--app-border);\n  border-radius: 28px;\n  background: var(--app-surface);\n  text-align: center;\n}\n\n.alumni-dev-hero::before,\n.alumni-dev-hero::after {\n  content: \"\";\n  position: absolute;\n  z-index: -2;\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n.alumni-dev-hero::before {\n  width: 270px;\n  height: 270px;\n  top: -132px;\n  right: -118px;\n  border: 1px solid var(--dev-accent-line);\n}\n\n.alumni-dev-hero::after {\n  width: 180px;\n  height: 180px;\n  left: -104px;\n  bottom: 54px;\n  border: 1px solid var(--app-border);\n}\n\n.alumni-dev-orbit {\n  position: absolute;\n  z-index: -1;\n  border: 1px solid var(--app-border);\n  border-radius: 50%;\n  opacity: 0.65;\n  pointer-events: none;\n}\n\n.alumni-dev-orbit::after {\n  content: \"\";\n  position: absolute;\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: var(--app-accent);\n  box-shadow:\n    0 0 0 5px var(--dev-accent-wash);\n}\n\n.alumni-dev-orbit-one {\n  width: 118px;\n  height: 118px;\n  top: 96px;\n  left: -60px;\n}\n\n.alumni-dev-orbit-one::after {\n  top: 16px;\n  right: 10px;\n}\n\n.alumni-dev-orbit-two {\n  width: 148px;\n  height: 148px;\n  right: -82px;\n  bottom: 130px;\n}\n\n.alumni-dev-orbit-two::after {\n  bottom: 25px;\n  left: 12px;\n}\n\n.alumni-dev-build-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 28px;\n  margin: 0 auto 22px;\n  padding: 0 10px;\n  border: 1px solid var(--dev-accent-line);\n  border-radius: 999px;\n  background: var(--dev-accent-wash);\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-avatar-shell {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 94px;\n  height: 94px;\n  margin: 0 auto 17px;\n  border: 1px solid var(--dev-accent-line);\n  border-radius: 29px;\n  background: var(--app-bg);\n  box-shadow:\n    0 14px 36px\n    color-mix(\n      in srgb,\n      var(--app-text) 8%,\n      transparent\n    );\n}\n\n.alumni-dev-avatar {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 72px;\n  height: 72px;\n  border-radius: 22px;\n  background: var(--app-accent-fill);\n  color: var(--app-on-accent);\n}\n\n.alumni-dev-kicker {\n  margin: 0 0 6px;\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.17em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-hero > h2 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: clamp(28px, 8vw, 38px);\n  line-height: 1;\n  font-weight: 950;\n  letter-spacing: -0.05em;\n}\n\n.alumni-dev-role {\n  margin: 7px 0 0;\n  color: var(--app-muted);\n  font-size: 12px;\n  font-weight: 750;\n}\n\n.alumni-dev-hero-statement {\n  max-width: 520px;\n  margin: 33px auto 0;\n  color: var(--app-text);\n  font-size: clamp(31px, 9vw, 48px);\n  line-height: 0.98;\n  font-weight: 950;\n  letter-spacing: -0.058em;\n}\n\n.alumni-dev-hero-statement span {\n  color: var(--app-accent);\n}\n\n.alumni-dev-hero-copy {\n  max-width: 500px;\n  margin: 22px auto 0;\n  color: var(--app-text-soft);\n  font-size: 13px;\n  line-height: 1.72;\n}\n\n.alumni-dev-tech-row {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: center;\n  gap: 7px;\n  max-width: 500px;\n  margin: 24px auto 0;\n}\n\n.alumni-dev-tech-row span {\n  display: inline-flex;\n  align-items: center;\n  min-height: 29px;\n  padding: 0 10px;\n  border: 1px solid var(--app-border);\n  border-radius: 9px;\n  background: var(--app-bg);\n  color: var(--app-muted);\n  font-size: 10px;\n  font-weight: 800;\n}\n\n.alumni-dev-scroll-cue {\n  display: flex;\n  justify-content: center;\n  margin: 26px auto 0;\n}\n\n.alumni-dev-scroll-cue i {\n  position: relative;\n  display: block;\n  width: 20px;\n  height: 32px;\n  border: 1px solid var(--app-border);\n  border-radius: 999px;\n}\n\n.alumni-dev-scroll-cue i::after {\n  content: \"\";\n  position: absolute;\n  top: 7px;\n  left: 50%;\n  width: 3px;\n  height: 6px;\n  transform: translateX(-50%);\n  border-radius: 99px;\n  background: var(--app-accent);\n}\n\n.alumni-dev-manifesto {\n  margin: 54px 0 12px;\n  padding: 0 8px;\n  text-align: center;\n}\n\n.alumni-dev-manifesto > span {\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.15em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-manifesto blockquote {\n  max-width: 610px;\n  margin: 14px auto 0;\n  color: var(--app-text);\n  font-size: clamp(23px, 6.5vw, 34px);\n  line-height: 1.18;\n  font-weight: 850;\n  letter-spacing: -0.04em;\n}\n\n.alumni-dev-section {\n  padding-top: 66px;\n}\n\n.alumni-dev-section-heading {\n  max-width: 570px;\n  margin-bottom: 25px;\n}\n\n.alumni-dev-section-heading small,\n.alumni-dev-stack-header small {\n  display: block;\n  margin-bottom: 7px;\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.15em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-section-heading h2,\n.alumni-dev-stack-header h2 {\n  margin: 0;\n  color: var(--app-text);\n  font-size: clamp(25px, 7vw, 34px);\n  line-height: 1.05;\n  font-weight: 950;\n  letter-spacing: -0.045em;\n}\n\n.alumni-dev-section-heading p {\n  margin: 12px 0 0;\n  color: var(--app-muted);\n  font-size: 13px;\n  line-height: 1.65;\n}\n\n.alumni-dev-capability-grid {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0, 1fr)\n    );\n  gap: 10px;\n}\n\n.alumni-dev-capability-card {\n  min-height: 210px;\n  padding: 17px;\n  border: 1px solid var(--app-border);\n  border-radius: 20px;\n  background: var(--app-surface);\n}\n\n.alumni-dev-capability-top {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.alumni-dev-capability-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 36px;\n  height: 36px;\n  border-radius: 11px;\n  background: var(--dev-accent-wash);\n  color: var(--app-accent);\n}\n\n.alumni-dev-capability-index {\n  color: var(--app-muted-3);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.09em;\n}\n\n.alumni-dev-capability-card h3 {\n  margin: 24px 0 8px;\n  color: var(--app-text);\n  font-size: 17px;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n\n.alumni-dev-capability-card p {\n  margin: 0;\n  color: var(--app-muted);\n  font-size: 11px;\n  line-height: 1.62;\n}\n\n.alumni-dev-journey-section {\n  padding-top: 76px;\n}\n\n.alumni-dev-timeline-v2 {\n  margin-top: 35px;\n}\n\n.alumni-dev-timeline-item {\n  display: grid;\n  grid-template-columns: 39px minmax(0, 1fr);\n  gap: 15px;\n}\n\n.alumni-dev-timeline-rail {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n}\n\n.alumni-dev-timeline-node {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 39px;\n  height: 39px;\n  flex: 0 0 39px;\n  border: 1px solid var(--dev-accent-line);\n  border-radius: 13px;\n  background: var(--app-surface);\n  color: var(--app-accent);\n}\n\n.alumni-dev-timeline-rail i {\n  width: 1px;\n  min-height: 60px;\n  flex: 1;\n  transform-origin: 50% 0;\n  background: var(--dev-accent-line);\n}\n\n.alumni-dev-timeline-copy {\n  padding: 3px 0 40px;\n}\n\n.alumni-dev-timeline-copy small {\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.13em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-timeline-copy h3 {\n  margin: 7px 0 11px;\n  color: var(--app-text);\n  font-size: 19px;\n  line-height: 1.15;\n  font-weight: 900;\n  letter-spacing: -0.03em;\n}\n\n.alumni-dev-timeline-copy p {\n  margin: 0;\n  color: var(--app-text-soft);\n  font-size: 12px;\n  line-height: 1.72;\n}\n\n.alumni-dev-stack-showcase {\n  margin-top: 42px;\n  padding: 22px;\n  border: 1px solid var(--app-border);\n  border-radius: 24px;\n  background: var(--app-surface);\n}\n\n.alumni-dev-stack-header {\n  display: flex;\n  align-items: center;\n  gap: 13px;\n}\n\n.alumni-dev-stack-symbol {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 44px;\n  height: 44px;\n  flex: 0 0 44px;\n  border-radius: 14px;\n  background: var(--app-accent-fill);\n  color: var(--app-on-accent);\n}\n\n.alumni-dev-stack-intro {\n  margin: 20px 0;\n  color: var(--app-text-soft);\n  font-size: 12px;\n  line-height: 1.7;\n}\n\n.alumni-dev-platform-grid {\n  display: grid;\n  gap: 8px;\n}\n\n.alumni-dev-platform-card {\n  display: grid;\n  grid-template-columns: 28px minmax(0, 1fr);\n  align-items: start;\n  column-gap: 9px;\n  padding: 13px 0;\n  border-top: 1px solid var(--app-border);\n}\n\n.alumni-dev-platform-card > svg {\n  grid-row: 1 / span 2;\n  margin-top: 1px;\n  color: var(--app-accent);\n}\n\n.alumni-dev-platform-card strong {\n  color: var(--app-text);\n  font-size: 12px;\n  font-weight: 900;\n}\n\n.alumni-dev-platform-card span {\n  margin-top: 3px;\n  color: var(--app-muted);\n  font-size: 10px;\n  line-height: 1.5;\n}\n\n.alumni-dev-code-line {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  overflow: hidden;\n  margin-top: 16px;\n  padding: 12px 13px;\n  border-radius: 12px;\n  background: var(--app-bg);\n  color: var(--app-muted);\n}\n\n.alumni-dev-code-line > span {\n  color: var(--app-accent);\n  font-size: 12px;\n  font-weight: 900;\n}\n\n.alumni-dev-code-line code {\n  overflow: hidden;\n  flex: 1;\n  font-size: 9px;\n  font-weight: 700;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-dev-code-line i {\n  width: 5px;\n  height: 13px;\n  flex: 0 0 5px;\n  background: var(--app-accent);\n  animation:\n    alumniDevCursor\n    1.05s\n    steps(1)\n    infinite;\n}\n\n.alumni-dev-closing-v2 {\n  margin-top: 70px;\n  padding: 31px 24px;\n  border: 1px solid var(--dev-accent-line);\n  border-radius: 28px;\n  background: var(--dev-accent-wash);\n  text-align: center;\n}\n\n.alumni-dev-closing-mark {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 46px;\n  height: 46px;\n  margin: 0 auto 17px;\n  border-radius: 15px;\n  background: var(--app-accent-fill);\n  color: var(--app-on-accent);\n}\n\n.alumni-dev-closing-v2 > small {\n  color: var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing: 0.14em;\n  text-transform: uppercase;\n}\n\n.alumni-dev-closing-v2 > h2 {\n  max-width: 520px;\n  margin: 10px auto 0;\n  color: var(--app-text);\n  font-size: clamp(26px, 7.5vw, 38px);\n  line-height: 1.06;\n  font-weight: 950;\n  letter-spacing: -0.048em;\n}\n\n.alumni-dev-closing-v2 > p {\n  max-width: 500px;\n  margin: 17px auto 0;\n  color: var(--app-text-soft);\n  font-size: 12px;\n  line-height: 1.7;\n}\n\n.alumni-dev-signature {\n  display: inline-flex;\n  align-items: center;\n  gap: 10px;\n  margin-top: 25px;\n  text-align: left;\n}\n\n.alumni-dev-signature > span {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 37px;\n  height: 37px;\n  border-radius: 50%;\n  background: var(--app-text);\n  color: var(--app-bg);\n  font-size: 13px;\n  font-weight: 950;\n}\n\n.alumni-dev-signature div {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.alumni-dev-signature strong {\n  color: var(--app-text);\n  font-size: 11px;\n  font-weight: 900;\n}\n\n.alumni-dev-signature small {\n  color: var(--app-muted);\n  font-size: 9px;\n  font-weight: 650;\n}\n\n@keyframes alumniDevCursor {\n  0%,\n  45% {\n    opacity: 1;\n  }\n\n  46%,\n  100% {\n    opacity: 0;\n  }\n}\n\n@media (max-width: 480px) {\n  .alumni-dev-hero {\n    min-height: 0;\n    padding:\n      30px\n      17px\n      26px;\n    border-radius: 24px;\n  }\n\n  .alumni-dev-hero-statement {\n    margin-top: 28px;\n  }\n\n  .alumni-dev-tech-row {\n    gap: 6px;\n  }\n\n  .alumni-dev-tech-row span {\n    padding:\n      0\n      8px;\n  }\n\n  .alumni-dev-capability-grid {\n    grid-template-columns: 1fr;\n  }\n\n  .alumni-dev-capability-card {\n    min-height: 0;\n  }\n\n  .alumni-dev-section {\n    padding-top: 58px;\n  }\n\n  .alumni-dev-stack-showcase {\n    padding:\n      20px\n      17px;\n  }\n\n  .alumni-dev-closing-v2 {\n    margin-top: 58px;\n    padding:\n      28px\n      18px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-dev-code-line i {\n    animation: none;\n    opacity: 1;\n  }\n}\n\n/* ALUMNI_DEVELOPER_SHOWCASE_1_1 */\n";

let nextCss =
  currentCss;

if (
  !nextCss.includes(
    MARKER
  )
) {
  nextCss =
    nextCss.trimEnd() +
    "\n\n" +
    extraCss.trim() +
    "\n";
}

try {
  const ts =
    require(
      "typescript"
    );

  const parsed =
    ts.createSourceFile(
      PAGE,
      nextPage,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );

  const diagnostics =
    parsed.parseDiagnostics ||
    [];

  if (
    diagnostics.length
  ) {
    const first =
      diagnostics[0];

    fail(
      `TSX inválido: ${ts.flattenDiagnosticMessageText(
        first.messageText,
        "\n"
      )}`
    );
  }

  console.log(
    "✅ Parser TypeScript: archivo válido"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error ===
        "object" &&
      error.code ===
        "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.writeFileSync(
  abs(PAGE),
  nextPage,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  nextCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Developer Showcase 1.1 aplicado."
);
console.log(
  "✅ Hero cinematográfico."
);
console.log(
  "✅ Scroll progress."
);
console.log(
  "✅ Reveal animations."
);
console.log(
  "✅ Timeline animado."
);
console.log(
  "✅ Stack tecnológico."
);
console.log(
  "✅ Capacidades full-stack."
);
console.log(
  "✅ Respeta prefers-reduced-motion."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
