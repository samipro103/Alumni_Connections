"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  ExternalLink,
  Heart,
  Info,
  MessageCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import "./about.css";

export default function AboutPage() {
  return (
    <AppShell>
      <main className="alumni-about-page mx-auto w-full max-w-[560px]">
        <header className="alumni-about-topbar">
          <Link
            href="/more"
            className="alumni-about-back"
            aria-label="Volver"
          >
            <ArrowLeft size={19} />
          </Link>

          <h1>Acerca de</h1>

          <span className="alumni-about-topbar-spacer" />
        </header>

        <section className="alumni-about-app-hero">
          <div className="alumni-about-app-icon">
            <img
              src="/icons/alumni-192.png"
              alt=""
            />
          </div>

          <div className="alumni-about-app-copy">
            <h2>ALUMNI</h2>
            <p>Conecta. Comparte. Crece.</p>
            <small>Versión 0.1.0</small>
          </div>
        </section>

        <p className="alumni-about-intro">
          ALUMNI es una red creada para acercar personas,
          historias y oportunidades. Un espacio donde una
          comunidad puede mantenerse conectada más allá de
          una etapa, una institución o una distancia.
        </p>

        <section className="alumni-about-store-list">
          <Link
            href="/about/developer"
            className="alumni-about-store-row"
          >
            <span className="alumni-about-store-icon">
              <Code2 size={18} />
            </span>

            <span className="alumni-about-store-copy">
              <small>Desarrollador</small>
              <strong>Sami</strong>
              <span>Fundador &amp; desarrollador</span>
            </span>

            <ChevronRight
              size={17}
              className="alumni-about-chevron"
            />
          </Link>

          <a
            href="https://alumnisv.com"
            target="_blank"
            rel="noreferrer"
            className="alumni-about-store-row"
          >
            <span className="alumni-about-store-icon">
              <ExternalLink size={18} />
            </span>

            <span className="alumni-about-store-copy">
              <small>Sitio web</small>
              <strong>alumnisv.com</strong>
              <span>Visita ALUMNI en la web</span>
            </span>

            <ChevronRight
              size={17}
              className="alumni-about-chevron"
            />
          </a>

          <Link
            href="/feedback"
            className="alumni-about-store-row"
          >
            <span className="alumni-about-store-icon">
              <MessageCircle size={18} />
            </span>

            <span className="alumni-about-store-copy">
              <small>Contacto</small>
              <strong>Ayuda y feedback</strong>
              <span>Cuéntanos qué podemos mejorar</span>
            </span>

            <ChevronRight
              size={17}
              className="alumni-about-chevron"
            />
          </Link>
        </section>

        <section className="alumni-about-note">
          <Info size={17} />
          <div>
            <strong>Construida para la comunidad.</strong>
            <p>
              Cada versión de ALUMNI busca hacer más simple
              conectar, descubrir personas y mantener vivas
              las relaciones que importan.
            </p>
          </div>
        </section>

        <footer className="alumni-about-footer">
          <Heart size={14} />
          <span>Hecho con dedicación para ALUMNI.</span>
        </footer>
      </main>
    </AppShell>
  );
}

/* ALUMNI_ABOUT_1_0_APP_STORE */
