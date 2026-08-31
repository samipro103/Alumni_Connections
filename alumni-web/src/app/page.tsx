import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  GraduationCap,
  LockKeyhole,
  MessageCircle,
  Plane,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import SignedInLandingRedirect from "@/components/landing/SignedInLandingRedirect";
import "./public-landing.css";

export const metadata: Metadata = {
  title: "Alumni | Red de estudiantes y graduados",
  description:
    "Alumni conecta estudiantes y graduados para compartir experiencias, descubrir personas, participar en comunidades y mantener activa su red académica y profesional.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Alumni | Red de estudiantes y graduados",
    description:
      "Una comunidad para compartir, descubrir personas, participar en eventos y mantener activa tu red académica y profesional.",
    url: "/",
    type: "website",
  },
};

const featureGroups = [
  {
    icon: Users,
    title: "Conexiones",
    description:
      "Descubre personas por afinidad académica y amplía tu red con perfiles que aportan contexto sobre formación, intereses y trayectoria.",
  },
  {
    icon: Sparkles,
    title: "Publicaciones e historias",
    description:
      "Comparte ideas, logros, preguntas, fotografías y momentos con una experiencia pensada para conversaciones útiles dentro de la comunidad.",
  },
  {
    icon: Compass,
    title: "Explorar y Radar Alumni",
    description:
      "Encuentra personas, temas y recomendaciones relevantes para tu red sin limitarte a una lista cronológica de publicaciones.",
  },
  {
    icon: CalendarDays,
    title: "Comunidades y eventos",
    description:
      "Participa en espacios temáticos, descubre actividades y mantente al tanto de oportunidades para conectar dentro y fuera del campus.",
  },
  {
    icon: Plane,
    title: "Pasaporte Alumni",
    description:
      "Organiza países y experiencias que forman parte de tu historia y compártelas desde tu perfil con una presentación visual propia.",
  },
  {
    icon: MessageCircle,
    title: "Mensajes",
    description:
      "Continúa las conversaciones de forma privada con personas de tu red y grupos en los que participas.",
  },
];

const trustPoints = [
  {
    icon: LockKeyhole,
    title: "Controles de privacidad",
    description:
      "Puedes usar una cuenta privada, administrar solicitudes de seguimiento y controlar quién accede a determinadas publicaciones e historias.",
  },
  {
    icon: ShieldCheck,
    title: "Herramientas de seguridad",
    description:
      "Alumni incorpora bloqueo, silencio, reportes y normas de comunidad para reducir abuso, spam, fraude y conductas que afecten la confianza.",
  },
  {
    icon: GraduationCap,
    title: "Contexto académico",
    description:
      "La experiencia está diseñada alrededor de relaciones académicas y profesionales, no solo de métricas de popularidad.",
  },
];

export default function LandingPage() {
  return (
    <main className="alumni-public">
      <SignedInLandingRedirect />

      <header className="alumni-public-header">
        <div className="alumni-public-container alumni-public-nav">
          <Link href="/" className="alumni-public-brand" aria-label="Alumni">
            Alumni<span>.</span>
          </Link>

          <nav className="alumni-public-links" aria-label="Navegación pública">
            <a href="#que-es">Qué es Alumni</a>
            <a href="#funciones">Funciones</a>
            <a href="#confianza">Confianza</a>
          </nav>

          <div className="alumni-public-actions">
            <Link href="/login" className="alumni-public-login">
              Iniciar sesión
            </Link>
            <Link href="/register" className="alumni-public-primary alumni-public-primary-small">
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <section className="alumni-public-hero">
        <div className="alumni-public-container alumni-public-hero-grid">
          <div className="alumni-public-hero-copy">
            <div className="alumni-public-eyebrow">
              Comunidad académica y profesional
            </div>

            <h1>
              Tu red académica puede seguir creciendo mucho después del aula.
            </h1>

            <p className="alumni-public-lead">
              Alumni es un espacio para estudiantes y graduados que quieren
              compartir experiencias, descubrir personas, participar en
              comunidades y mantener activas las conexiones que nacen durante
              su formación.
            </p>

            <div className="alumni-public-hero-actions">
              <Link href="/register" className="alumni-public-primary">
                Únete a Alumni
                <ArrowRight size={18} />
              </Link>
              <Link href="/login" className="alumni-public-secondary">
                Ya tengo una cuenta
              </Link>
            </div>

            <p className="alumni-public-note">
              Crear una cuenta te permite acceder al Feed, perfiles,
              comunidades, eventos, mensajes y otras funciones de la red.
            </p>
          </div>

          <div className="alumni-public-preview" aria-label="Resumen de Alumni">
            <div className="alumni-public-preview-top">
              <span>Alumni.</span>
              <small>Tu comunidad</small>
            </div>

            <div className="alumni-public-preview-feed">
              <article>
                <div className="alumni-public-avatar">A</div>
                <div>
                  <strong>Comparte lo que estás construyendo</strong>
                  <p>
                    Logros, proyectos, preguntas, experiencias y momentos que
                    pueden abrir una conversación con tu red.
                  </p>
                </div>
              </article>

              <article>
                <div className="alumni-public-avatar alumni-public-avatar-alt">R</div>
                <div>
                  <strong>Descubre personas relevantes</strong>
                  <p>
                    Explora perfiles y recomendaciones con contexto académico y
                    profesional.
                  </p>
                </div>
              </article>

              <article>
                <div className="alumni-public-avatar alumni-public-avatar-soft">E</div>
                <div>
                  <strong>Participa en tu comunidad</strong>
                  <p>
                    Encuentra eventos y espacios donde una conexión digital
                    puede convertirse en colaboración.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="que-es" className="alumni-public-section alumni-public-about">
        <div className="alumni-public-container alumni-public-two-column">
          <div>
            <p className="alumni-public-kicker">Qué es Alumni</p>
            <h2>Una red construida alrededor de relaciones que sí tienen contexto.</h2>
          </div>

          <div className="alumni-public-prose">
            <p>
              Una universidad, un programa académico, una generación o una
              experiencia compartida pueden ser el punto de partida de una red
              valiosa. Alumni organiza esas relaciones en un producto social
              donde el perfil, el contenido y las comunidades ayudan a entender
              quién es cada persona y qué puede aportar.
            </p>
            <p>
              La plataforma combina publicación de contenido, descubrimiento,
              eventos, comunidades, mensajes y elementos de identidad como el
              Pasaporte Alumni. El objetivo es que una conexión no termine
              cuando termina una clase, una promoción o una etapa académica.
            </p>
          </div>
        </div>
      </section>

      <section id="funciones" className="alumni-public-section">
        <div className="alumni-public-container">
          <div className="alumni-public-section-heading">
            <p className="alumni-public-kicker">Funciones</p>
            <h2>Herramientas para participar, descubrir y mantenerte cerca de tu red.</h2>
            <p>
              Cada área de Alumni está pensada para una parte distinta de la
              experiencia social y académica.
            </p>
          </div>

          <div className="alumni-public-feature-grid">
            {featureGroups.map(({ icon: Icon, title, description }) => (
              <article key={title} className="alumni-public-feature">
                <div className="alumni-public-feature-icon">
                  <Icon size={21} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="alumni-public-section alumni-public-how">
        <div className="alumni-public-container">
          <div className="alumni-public-section-heading alumni-public-section-heading-narrow">
            <p className="alumni-public-kicker">Cómo funciona</p>
            <h2>Empieza con tu perfil y deja que la red gane valor con tu participación.</h2>
          </div>

          <div className="alumni-public-steps">
            <article>
              <span>01</span>
              <h3>Crea tu identidad en Alumni</h3>
              <p>
                Completa tu perfil con la información que quieras compartir y
                añade contexto académico, profesional y personal.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Construye tu red</h3>
              <p>
                Sigue personas, explora recomendaciones y encuentra comunidades
                o eventos relacionados con tus intereses.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Participa</h3>
              <p>
                Publica, conversa, comparte experiencias y convierte afinidades
                en conexiones que puedan mantenerse en el tiempo.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="confianza" className="alumni-public-section alumni-public-trust">
        <div className="alumni-public-container">
          <div className="alumni-public-section-heading">
            <p className="alumni-public-kicker">Confianza y comunidad</p>
            <h2>Una red útil necesita controles claros y reglas comprensibles.</h2>
            <p>
              Alumni combina controles de privacidad con herramientas para
              reportar y gestionar interacciones no deseadas.
            </p>
          </div>

          <div className="alumni-public-trust-grid">
            {trustPoints.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <Icon size={22} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>

          <div className="alumni-public-policy-links">
            <Link href="/legal/privacy">Privacidad</Link>
            <Link href="/legal/terms">Términos de uso</Link>
            <Link href="/legal/community">Normas de comunidad</Link>
          </div>
        </div>
      </section>

      <section className="alumni-public-cta">
        <div className="alumni-public-container alumni-public-cta-inner">
          <div>
            <p className="alumni-public-kicker">Alumni.</p>
            <h2>Haz que tu red siga creciendo contigo.</h2>
            <p>
              Crea tu perfil, encuentra a tu comunidad y empieza a construir
              conexiones que puedan acompañar tu siguiente etapa.
            </p>
          </div>

          <Link href="/register" className="alumni-public-primary">
            Crear mi cuenta
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="alumni-public-footer">
        <div className="alumni-public-container alumni-public-footer-inner">
          <div>
            <Link href="/" className="alumni-public-brand" aria-label="Alumni">
              Alumni<span>.</span>
            </Link>
            <p>
              Comunidad para estudiantes, graduados y conexiones académicas.
            </p>
          </div>

          <div className="alumni-public-footer-links">
            <Link href="/legal/privacy">Privacidad</Link>
            <Link href="/legal/terms">Términos</Link>
            <Link href="/legal/community">Normas</Link>
            <Link href="/login">Iniciar sesión</Link>
            <Link href="/register">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ALUMNI_3_6_1_PUBLIC_LANDING_ADSENSE_READINESS */
