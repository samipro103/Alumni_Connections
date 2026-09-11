const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_ABOUT_1_0_APP_STORE";

const MORE =
  "src/app/more/page.tsx";
const ABOUT =
  "src/app/about/page.tsx";
const DEVELOPER =
  "src/app/about/developer/page.tsx";
const CSS =
  "src/app/about/about.css";

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(`No encontré ${rel}`);
  }

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function backup(rel, content) {
  const target =
    abs(rel) +
    ".before-about-1.0.bak";

  if (!fs.existsSync(target)) {
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

if (!fs.existsSync(abs("package.json"))) {
  fail(
    "Ejecutá este parche dentro de alumni-web."
  );
}

let more = read(MORE);

if (
  more.includes(MARKER) &&
  fs.existsSync(abs(ABOUT)) &&
  fs.existsSync(abs(DEVELOPER))
) {
  console.log(
    "✅ Acerca de 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(MORE, more);

if (
  !more.includes(
    `  CircleHelp,
  LogOut,`
  )
) {
  fail(
    "No encontré los imports esperados de More."
  );
}

more = more.replace(
  `  CircleHelp,
  LogOut,`,
  `  CircleHelp,
  Info,
  LogOut,`
);

const feedbackItem = `  {
    href: "/feedback",
    label: "Ayuda y feedback",
    description:
      "Estamos para ayudarte",
    icon: CircleHelp,
  },`;

if (!more.includes(feedbackItem)) {
  fail(
    "No encontré el item Ayuda y feedback."
  );
}

more = more.replace(
  feedbackItem,
  `${feedbackItem}
  {
    href: "/about",
    label: "Acerca de ALUMNI",
    description:
      "La app y quién la construye",
    icon: Info,
  },`
);

more += `\n/* ${MARKER} */\n`;

const about =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  ArrowLeft,\n  ChevronRight,\n  Code2,\n  ExternalLink,\n  Heart,\n  Info,\n  MessageCircle,\n} from \"lucide-react\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"./about.css\";\n\nexport default function AboutPage() {\n  return (\n    <AppShell>\n      <main className=\"alumni-about-page mx-auto w-full max-w-[560px]\">\n        <header className=\"alumni-about-topbar\">\n          <Link\n            href=\"/more\"\n            className=\"alumni-about-back\"\n            aria-label=\"Volver\"\n          >\n            <ArrowLeft size={19} />\n          </Link>\n\n          <h1>Acerca de</h1>\n\n          <span className=\"alumni-about-topbar-spacer\" />\n        </header>\n\n        <section className=\"alumni-about-app-hero\">\n          <div className=\"alumni-about-app-icon\">\n            <img\n              src=\"/icons/alumni-192.png\"\n              alt=\"\"\n            />\n          </div>\n\n          <div className=\"alumni-about-app-copy\">\n            <h2>ALUMNI</h2>\n            <p>Conecta. Comparte. Crece.</p>\n            <small>Versión 0.1.0</small>\n          </div>\n        </section>\n\n        <p className=\"alumni-about-intro\">\n          ALUMNI es una red creada para acercar personas,\n          historias y oportunidades. Un espacio donde una\n          comunidad puede mantenerse conectada más allá de\n          una etapa, una institución o una distancia.\n        </p>\n\n        <section className=\"alumni-about-store-list\">\n          <Link\n            href=\"/about/developer\"\n            className=\"alumni-about-store-row\"\n          >\n            <span className=\"alumni-about-store-icon\">\n              <Code2 size={18} />\n            </span>\n\n            <span className=\"alumni-about-store-copy\">\n              <small>Desarrollador</small>\n              <strong>Sami</strong>\n              <span>Fundador &amp; desarrollador</span>\n            </span>\n\n            <ChevronRight\n              size={17}\n              className=\"alumni-about-chevron\"\n            />\n          </Link>\n\n          <a\n            href=\"https://alumnisv.com\"\n            target=\"_blank\"\n            rel=\"noreferrer\"\n            className=\"alumni-about-store-row\"\n          >\n            <span className=\"alumni-about-store-icon\">\n              <ExternalLink size={18} />\n            </span>\n\n            <span className=\"alumni-about-store-copy\">\n              <small>Sitio web</small>\n              <strong>alumnisv.com</strong>\n              <span>Visita ALUMNI en la web</span>\n            </span>\n\n            <ChevronRight\n              size={17}\n              className=\"alumni-about-chevron\"\n            />\n          </a>\n\n          <Link\n            href=\"/feedback\"\n            className=\"alumni-about-store-row\"\n          >\n            <span className=\"alumni-about-store-icon\">\n              <MessageCircle size={18} />\n            </span>\n\n            <span className=\"alumni-about-store-copy\">\n              <small>Contacto</small>\n              <strong>Ayuda y feedback</strong>\n              <span>Cuéntanos qué podemos mejorar</span>\n            </span>\n\n            <ChevronRight\n              size={17}\n              className=\"alumni-about-chevron\"\n            />\n          </Link>\n        </section>\n\n        <section className=\"alumni-about-note\">\n          <Info size={17} />\n          <div>\n            <strong>Construida para la comunidad.</strong>\n            <p>\n              Cada versión de ALUMNI busca hacer más simple\n              conectar, descubrir personas y mantener vivas\n              las relaciones que importan.\n            </p>\n          </div>\n        </section>\n\n        <footer className=\"alumni-about-footer\">\n          <Heart size={14} />\n          <span>Hecho con dedicación para ALUMNI.</span>\n        </footer>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_ABOUT_1_0_APP_STORE */\n";

const developer =
  "\"use client\";\n\nimport Link from \"next/link\";\nimport {\n  ArrowLeft,\n  Code2,\n  Heart,\n  Layers3,\n  Rocket,\n  ShieldCheck,\n  Sparkles,\n  Wrench,\n} from \"lucide-react\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport \"../about.css\";\n\nconst journey = [\n  {\n    icon: Sparkles,\n    kicker: \"El comienzo\",\n    title: \"Una idea antes que una aplicación\",\n    body:\n      \"ALUMNI comenzó con una pregunta sencilla: ¿qué pasa con las conexiones que construimos cuando una etapa termina? La idea fue crear un lugar que no dependiera solamente de recordar personas, sino que permitiera seguir encontrándolas, compartir lo que estamos haciendo y abrir nuevas oportunidades.\",\n  },\n  {\n    icon: Code2,\n    kicker: \"Construir solo\",\n    title: \"Aprender cada parte del camino\",\n    body:\n      \"Convertir una idea en una aplicación real significó asumir muchos papeles al mismo tiempo. Producto, diseño, experiencia de usuario, base de datos, seguridad, rendimiento, pruebas y cada pequeño detalle de una pantalla. No siempre hubo una respuesta clara; muchas veces la única forma de avanzar fue probar, equivocarse, entender el problema y volver a construir.\",\n  },\n  {\n    icon: Wrench,\n    kicker: \"Iterar\",\n    title: \"Hacer, romper, corregir y mejorar\",\n    body:\n      \"Muchas partes de ALUMNI no se quedaron como fueron creadas por primera vez. El feed cambió, los perfiles evolucionaron, la mensajería se simplificó y la navegación se volvió más enfocada. Cada problema encontrado terminó convirtiéndose en una nueva versión. Construir ALUMNI ha sido aprender a no enamorarse de la primera solución, sino del problema que queremos resolver.\",\n  },\n  {\n    icon: Layers3,\n    kicker: \"Crecer\",\n    title: \"De pantallas a un sistema completo\",\n    body:\n      \"Con el tiempo dejó de ser solamente una colección de pantallas. Llegaron las comunidades, eventos, perfiles, publicaciones, comentarios, mensajes, notificaciones, búsqueda y herramientas para administrar toda la plataforma. Cada módulo obligó a pensar cómo debía convivir con los demás sin perder la sensación de una aplicación sencilla.\",\n  },\n  {\n    icon: ShieldCheck,\n    kicker: \"Responsabilidad\",\n    title: \"Construir confianza también es desarrollar\",\n    body:\n      \"Mientras ALUMNI crecía, también creció la responsabilidad detrás de ella. La seguridad, la privacidad, la moderación, los permisos, el control de abuso y la protección de los datos dejaron de ser detalles técnicos para convertirse en parte del producto. Una comunidad solo funciona si las personas sienten que pueden usarla con confianza.\",\n  },\n  {\n    icon: Rocket,\n    kicker: \"Lo que sigue\",\n    title: \"Todavía estamos empezando\",\n    body:\n      \"Llegar hasta aquí no significa que ALUMNI esté terminada. Significa que ya existe una base capaz de seguir creciendo. El objetivo sigue siendo el mismo: construir una herramienta útil, humana y duradera, mejorarla con cada experiencia real y demostrar que una idea puede avanzar muchísimo cuando se trabaja en ella un problema a la vez.\",\n  },\n];\n\nexport default function DeveloperAboutPage() {\n  return (\n    <AppShell>\n      <main className=\"alumni-about-page alumni-developer-page mx-auto w-full max-w-[620px]\">\n        <header className=\"alumni-about-topbar\">\n          <Link\n            href=\"/about\"\n            className=\"alumni-about-back\"\n            aria-label=\"Volver\"\n          >\n            <ArrowLeft size={19} />\n          </Link>\n\n          <h1>Desarrollador</h1>\n\n          <span className=\"alumni-about-topbar-spacer\" />\n        </header>\n\n        <section className=\"alumni-developer-hero\">\n          <div className=\"alumni-developer-avatar\">\n            <Code2 size={27} />\n          </div>\n\n          <p className=\"alumni-developer-eyebrow\">\n            Detrás de ALUMNI\n          </p>\n\n          <h2>Sami</h2>\n\n          <p className=\"alumni-developer-role\">\n            Fundador &amp; desarrollador\n          </p>\n\n          <blockquote>\n            “Construir algo solo no significa hacerlo sin\n            ayuda. Significa aprender a convertir cada\n            obstáculo en la siguiente versión.”\n          </blockquote>\n        </section>\n\n        <section className=\"alumni-developer-opening\">\n          <p>\n            Crear ALUMNI ha sido mucho más que escribir código.\n            Ha significado tomar una idea, verla fallar en\n            algunas formas, mejorarla en otras y aprender a\n            tomar decisiones que van desde un espacio entre dos\n            botones hasta la manera en que miles de personas\n            podrían usar la plataforma de forma segura.\n          </p>\n\n          <p>\n            Esta es una pequeña parte de ese camino. No es la\n            historia definitiva; ALUMNI todavía se está\n            escribiendo.\n          </p>\n        </section>\n\n        <section className=\"alumni-developer-timeline\">\n          {journey.map(\n            ({\n              icon: Icon,\n              kicker,\n              title,\n              body,\n            },\n            index\n          ) => (\n            <article\n              key={title}\n              className=\"alumni-developer-step\"\n            >\n              <div className=\"alumni-developer-step-rail\">\n                <span className=\"alumni-developer-step-icon\">\n                  <Icon size={17} />\n                </span>\n\n                {index < journey.length - 1 && (\n                  <i />\n                )}\n              </div>\n\n              <div className=\"alumni-developer-step-copy\">\n                <small>{kicker}</small>\n                <h3>{title}</h3>\n                <p>{body}</p>\n              </div>\n            </article>\n          ))}\n        </section>\n\n        <section className=\"alumni-developer-closing\">\n          <Heart size={18} />\n          <h3>Gracias por estar aquí.</h3>\n          <p>\n            Si estás usando ALUMNI, ya eres parte de esta\n            historia. Cada persona, conversación, sugerencia y\n            error encontrado ayuda a decidir qué versión viene\n            después.\n          </p>\n        </section>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_ABOUT_1_0_APP_STORE */\n";

const css =
  ".alumni-about-page {\n  padding-bottom: 36px;\n  color: var(--app-text);\n}\n\n.alumni-about-topbar {\n  display: grid;\n  grid-template-columns: 40px minmax(0, 1fr) 40px;\n  align-items: center;\n  min-height: 48px;\n  margin-bottom: 18px;\n}\n\n.alumni-about-topbar h1 {\n  margin: 0;\n  text-align: center;\n  font-size: 16px;\n  font-weight: 850;\n  letter-spacing: -0.02em;\n}\n\n.alumni-about-back {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 38px;\n  height: 38px;\n  border-radius: 12px;\n  color: var(--app-text);\n}\n\n.alumni-about-back:hover {\n  background: var(--app-soft);\n}\n\n.alumni-about-topbar-spacer {\n  width: 40px;\n}\n\n.alumni-about-app-hero {\n  display: flex;\n  align-items: center;\n  gap: 17px;\n  padding: 8px 2px 22px;\n}\n\n.alumni-about-app-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 84px;\n  height: 84px;\n  flex: 0 0 84px;\n  overflow: hidden;\n  border: 1px solid var(--app-border);\n  border-radius: 21px;\n  background: var(--app-surface);\n}\n\n.alumni-about-app-icon img {\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n.alumni-about-app-copy {\n  min-width: 0;\n}\n\n.alumni-about-app-copy h2 {\n  margin: 0;\n  font-size: 28px;\n  line-height: 1;\n  font-weight: 900;\n  letter-spacing: -0.045em;\n}\n\n.alumni-about-app-copy p {\n  margin: 8px 0 4px;\n  color: var(--app-text-soft);\n  font-size: 13px;\n  font-weight: 650;\n}\n\n.alumni-about-app-copy small {\n  color: var(--app-muted);\n  font-size: 11px;\n  font-weight: 650;\n}\n\n.alumni-about-intro {\n  margin: 0;\n  padding: 0 2px 22px;\n  border-bottom: 1px solid var(--app-border);\n  color: var(--app-text-soft);\n  font-size: 14px;\n  line-height: 1.65;\n}\n\n.alumni-about-store-list {\n  margin-top: 10px;\n  border-bottom: 1px solid var(--app-border);\n}\n\n.alumni-about-store-row {\n  display: grid;\n  grid-template-columns: 38px minmax(0, 1fr) 24px;\n  align-items: center;\n  gap: 11px;\n  min-height: 76px;\n  border-top: 1px solid var(--app-border);\n  color: inherit;\n  text-decoration: none;\n}\n\n.alumni-about-store-row:first-child {\n  border-top: 0;\n}\n\n.alumni-about-store-icon {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 34px;\n  height: 34px;\n  border-radius: 11px;\n  background: var(--app-soft);\n  color: var(--app-text);\n}\n\n.alumni-about-store-copy {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 2px;\n}\n\n.alumni-about-store-copy small {\n  color: var(--app-muted);\n  font-size: 10px;\n  font-weight: 800;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n}\n\n.alumni-about-store-copy strong {\n  overflow: hidden;\n  color: var(--app-text);\n  font-size: 14px;\n  font-weight: 850;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-about-store-copy span {\n  overflow: hidden;\n  color: var(--app-muted);\n  font-size: 11px;\n  font-weight: 600;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-about-chevron {\n  color: var(--app-muted-2);\n}\n\n.alumni-about-note {\n  display: flex;\n  gap: 12px;\n  margin-top: 22px;\n  padding: 17px;\n  border: 1px solid var(--app-border);\n  border-radius: 18px;\n  background: var(--app-surface);\n}\n\n.alumni-about-note > svg {\n  margin-top: 1px;\n  flex: 0 0 auto;\n  color: var(--app-accent);\n}\n\n.alumni-about-note strong {\n  display: block;\n  margin-bottom: 5px;\n  font-size: 13px;\n  font-weight: 850;\n}\n\n.alumni-about-note p {\n  margin: 0;\n  color: var(--app-muted);\n  font-size: 12px;\n  line-height: 1.55;\n}\n\n.alumni-about-footer {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 7px;\n  padding: 28px 0 8px;\n  color: var(--app-muted-2);\n  font-size: 11px;\n  font-weight: 650;\n}\n\n/* Developer story */\n\n.alumni-developer-hero {\n  padding: 24px 20px 28px;\n  border: 1px solid var(--app-border);\n  border-radius: 24px;\n  background: var(--app-surface);\n  text-align: center;\n}\n\n.alumni-developer-avatar {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 76px;\n  height: 76px;\n  margin: 0 auto 16px;\n  border-radius: 50%;\n  background: var(--app-soft-strong);\n  color: var(--app-accent);\n}\n\n.alumni-developer-eyebrow {\n  margin: 0 0 6px;\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.16em;\n  text-transform: uppercase;\n}\n\n.alumni-developer-hero h2 {\n  margin: 0;\n  font-size: 28px;\n  font-weight: 900;\n  letter-spacing: -0.04em;\n}\n\n.alumni-developer-role {\n  margin: 4px 0 0;\n  color: var(--app-muted);\n  font-size: 12px;\n  font-weight: 700;\n}\n\n.alumni-developer-hero blockquote {\n  max-width: 430px;\n  margin: 22px auto 0;\n  color: var(--app-text-soft);\n  font-size: 14px;\n  font-style: italic;\n  font-weight: 650;\n  line-height: 1.55;\n}\n\n.alumni-developer-opening {\n  padding: 28px 2px 4px;\n}\n\n.alumni-developer-opening p {\n  margin: 0 0 14px;\n  color: var(--app-text-soft);\n  font-size: 14px;\n  line-height: 1.75;\n}\n\n.alumni-developer-timeline {\n  padding-top: 20px;\n}\n\n.alumni-developer-step {\n  display: grid;\n  grid-template-columns: 34px minmax(0, 1fr);\n  gap: 14px;\n}\n\n.alumni-developer-step-rail {\n  display: flex;\n  min-height: 100%;\n  flex-direction: column;\n  align-items: center;\n}\n\n.alumni-developer-step-icon {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 34px;\n  height: 34px;\n  flex: 0 0 34px;\n  border: 1px solid var(--app-border);\n  border-radius: 50%;\n  background: var(--app-surface);\n  color: var(--app-accent);\n}\n\n.alumni-developer-step-rail i {\n  width: 1px;\n  min-height: 38px;\n  flex: 1;\n  background: var(--app-border);\n}\n\n.alumni-developer-step-copy {\n  padding: 1px 0 34px;\n}\n\n.alumni-developer-step-copy small {\n  color: var(--app-accent);\n  font-size: 10px;\n  font-weight: 900;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n}\n\n.alumni-developer-step-copy h3 {\n  margin: 5px 0 9px;\n  color: var(--app-text);\n  font-size: 18px;\n  line-height: 1.2;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n\n.alumni-developer-step-copy p {\n  margin: 0;\n  color: var(--app-text-soft);\n  font-size: 13px;\n  line-height: 1.7;\n}\n\n.alumni-developer-closing {\n  margin-top: 6px;\n  padding: 22px;\n  border-radius: 22px;\n  background: var(--app-soft);\n  text-align: center;\n}\n\n.alumni-developer-closing > svg {\n  color: var(--app-accent);\n}\n\n.alumni-developer-closing h3 {\n  margin: 10px 0 8px;\n  font-size: 18px;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n\n.alumni-developer-closing p {\n  max-width: 460px;\n  margin: 0 auto;\n  color: var(--app-muted);\n  font-size: 12px;\n  line-height: 1.65;\n}\n\n@media (max-width: 480px) {\n  .alumni-about-page {\n    padding-left: 0;\n    padding-right: 0;\n  }\n\n  .alumni-about-app-icon {\n    width: 76px;\n    height: 76px;\n    flex-basis: 76px;\n    border-radius: 19px;\n  }\n\n  .alumni-about-app-copy h2 {\n    font-size: 25px;\n  }\n\n  .alumni-developer-hero {\n    padding-left: 17px;\n    padding-right: 17px;\n  }\n}\n\n/* ALUMNI_ABOUT_1_0_APP_STORE */\n";

try {
  const ts = require("typescript");

  for (
    const [rel, content] of [
      [MORE, more],
      [ABOUT, about],
      [DEVELOPER, developer],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics || [];

    if (diagnostics.length) {
      const first =
        diagnostics[0];

      fail(
        `${rel}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: archivos válidos"
  );
} catch (error) {
  if (
    !(
      error &&
      typeof error === "object" &&
      error.code === "MODULE_NOT_FOUND"
    )
  ) {
    throw error;
  }
}

fs.mkdirSync(
  path.dirname(abs(ABOUT)),
  { recursive: true }
);

fs.mkdirSync(
  path.dirname(abs(DEVELOPER)),
  { recursive: true }
);

fs.writeFileSync(
  abs(MORE),
  more,
  "utf8"
);

fs.writeFileSync(
  abs(ABOUT),
  about,
  "utf8"
);

fs.writeFileSync(
  abs(DEVELOPER),
  developer,
  "utf8"
);

fs.writeFileSync(
  abs(CSS),
  css,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Acerca de 1.0 aplicado."
);
console.log(
  "✅ Más > Acerca de ALUMNI."
);
console.log(
  "✅ Diseño estilo App Store."
);
console.log(
  "✅ Pantalla Desarrollador."
);
console.log(
  "✅ Historia provisional del camino de ALUMNI."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
