"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Code2,
  Heart,
  Layers3,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import "../about.css";

const journey = [
  {
    icon: Sparkles,
    kicker: "El comienzo",
    title: "Una idea antes que una aplicación",
    body:
      "ALUMNI comenzó con una pregunta sencilla: ¿qué pasa con las conexiones que construimos cuando una etapa termina? La idea fue crear un lugar que no dependiera solamente de recordar personas, sino que permitiera seguir encontrándolas, compartir lo que estamos haciendo y abrir nuevas oportunidades.",
  },
  {
    icon: Code2,
    kicker: "Construir solo",
    title: "Aprender cada parte del camino",
    body:
      "Convertir una idea en una aplicación real significó asumir muchos papeles al mismo tiempo. Producto, diseño, experiencia de usuario, base de datos, seguridad, rendimiento, pruebas y cada pequeño detalle de una pantalla. No siempre hubo una respuesta clara; muchas veces la única forma de avanzar fue probar, equivocarse, entender el problema y volver a construir.",
  },
  {
    icon: Wrench,
    kicker: "Iterar",
    title: "Hacer, romper, corregir y mejorar",
    body:
      "Muchas partes de ALUMNI no se quedaron como fueron creadas por primera vez. El feed cambió, los perfiles evolucionaron, la mensajería se simplificó y la navegación se volvió más enfocada. Cada problema encontrado terminó convirtiéndose en una nueva versión. Construir ALUMNI ha sido aprender a no enamorarse de la primera solución, sino del problema que queremos resolver.",
  },
  {
    icon: Layers3,
    kicker: "Crecer",
    title: "De pantallas a un sistema completo",
    body:
      "Con el tiempo dejó de ser solamente una colección de pantallas. Llegaron las comunidades, eventos, perfiles, publicaciones, comentarios, mensajes, notificaciones, búsqueda y herramientas para administrar toda la plataforma. Cada módulo obligó a pensar cómo debía convivir con los demás sin perder la sensación de una aplicación sencilla.",
  },
  {
    icon: ShieldCheck,
    kicker: "Responsabilidad",
    title: "Construir confianza también es desarrollar",
    body:
      "Mientras ALUMNI crecía, también creció la responsabilidad detrás de ella. La seguridad, la privacidad, la moderación, los permisos, el control de abuso y la protección de los datos dejaron de ser detalles técnicos para convertirse en parte del producto. Una comunidad solo funciona si las personas sienten que pueden usarla con confianza.",
  },
  {
    icon: Rocket,
    kicker: "Lo que sigue",
    title: "Todavía estamos empezando",
    body:
      "Llegar hasta aquí no significa que ALUMNI esté terminada. Significa que ya existe una base capaz de seguir creciendo. El objetivo sigue siendo el mismo: construir una herramienta útil, humana y duradera, mejorarla con cada experiencia real y demostrar que una idea puede avanzar muchísimo cuando se trabaja en ella un problema a la vez.",
  },
];

export default function DeveloperAboutPage() {
  return (
    <AppShell>
      <main className="alumni-about-page alumni-developer-page mx-auto w-full max-w-[620px]">
        <header className="alumni-about-topbar">
          <Link
            href="/about"
            className="alumni-about-back"
            aria-label="Volver"
          >
            <ArrowLeft size={19} />
          </Link>

          <h1>Desarrollador</h1>

          <span className="alumni-about-topbar-spacer" />
        </header>

        <section className="alumni-developer-hero">
          <div className="alumni-developer-avatar">
            <Code2 size={27} />
          </div>

          <p className="alumni-developer-eyebrow">
            Detrás de ALUMNI
          </p>

          <h2>Sami</h2>

          <p className="alumni-developer-role">
            Fundador &amp; desarrollador
          </p>

          <blockquote>
            “Construir algo solo no significa hacerlo sin
            ayuda. Significa aprender a convertir cada
            obstáculo en la siguiente versión.”
          </blockquote>
        </section>

        <section className="alumni-developer-opening">
          <p>
            Crear ALUMNI ha sido mucho más que escribir código.
            Ha significado tomar una idea, verla fallar en
            algunas formas, mejorarla en otras y aprender a
            tomar decisiones que van desde un espacio entre dos
            botones hasta la manera en que miles de personas
            podrían usar la plataforma de forma segura.
          </p>

          <p>
            Esta es una pequeña parte de ese camino. No es la
            historia definitiva; ALUMNI todavía se está
            escribiendo.
          </p>
        </section>

        <section className="alumni-developer-timeline">
          {journey.map(
            ({
              icon: Icon,
              kicker,
              title,
              body,
            },
            index
          ) => (
            <article
              key={title}
              className="alumni-developer-step"
            >
              <div className="alumni-developer-step-rail">
                <span className="alumni-developer-step-icon">
                  <Icon size={17} />
                </span>

                {index < journey.length - 1 && (
                  <i />
                )}
              </div>

              <div className="alumni-developer-step-copy">
                <small>{kicker}</small>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="alumni-developer-closing">
          <Heart size={18} />
          <h3>Gracias por estar aquí.</h3>
          <p>
            Si estás usando ALUMNI, ya eres parte de esta
            historia. Cada persona, conversación, sugerencia y
            error encontrado ayuda a decidir qué versión viene
            después.
          </p>
        </section>
      </main>
    </AppShell>
  );
}

/* ALUMNI_ABOUT_1_0_APP_STORE */
