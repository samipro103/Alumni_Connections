"use client";

import {
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Info,
  LogOut,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  motion,
  useReducedMotion,
} from "framer-motion";
import AppShell from "@/components/layout/AppShell";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";
import {
  AlumniAvatar,
} from "@/components/ui/AlumniImage";
import "./more-2-0.css";

type MoreProfile = {
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  career?: string | null;
  university?: string | null;
  education_institution_name?:
    | string
    | null;
};

const activityItems = [
  {
    href: "/notifications",
    label: "Notificaciones",
    description:
      "Mantente al día con tu actividad",
    icon: Bell,
  },
  {
    href: "/community",
    label: "Comunidad",
    description:
      "Conecta con otros alumni",
    icon: Users,
  },
  {
    href: "/events",
    label: "Eventos",
    description:
      "Encuentros y actividades",
    icon: CalendarDays,
  },
  {
    href: "/passport",
    label: "Pasaporte Alumni",
    description:
      "Tu recorrido, en un solo lugar",
    icon: BookOpen,
  },
  {
    href:
      "/settings?section=profile&view=saved",
    label: "Guardados",
    description:
      "Publicaciones y recursos",
    icon: Bookmark,
  },
];

const systemItems = [
  {
    href: "/settings",
    label: "Configuración",
    description:
      "Cuenta, privacidad y preferencias",
    icon: Settings,
  },
  {
    href: "/feedback",
    label: "Ayuda y feedback",
    description:
      "Soporte, problemas e ideas",
    icon: CircleHelp,
  },
  {
    href: "/about",
    label: "Acerca de ALUMNI",
    description:
      "La app, su autor y el proyecto",
    icon: Info,
  },
];

function MoreSection({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: typeof activityItems;
}) {
  const reduceMotion =
    useReducedMotion();

  return (
    <motion.section
      className="alumni-more-vp-section"
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
        ease: [
          0.2,
          0.8,
          0.2,
          1,
        ],
      }}
    >
      <header className="alumni-more-vp-section-head">
        <small>
          {eyebrow}
        </small>
        <h2>{title}</h2>
        <p>
          {description}
        </p>
      </header>

      <nav className="alumni-more-vp-list">
        {items.map(
          ({
            href,
            label,
            description:
              itemDescription,
            icon: Icon,
          }) => (
            <Link
              key={href}
              href={href}
              className="alumni-more-vp-row"
              data-alumni-motion="card"
            >
              <span className="alumni-more-vp-row-icon">
                <Icon
                  size={18}
                  strokeWidth={1.9}
                />
              </span>

              <span className="alumni-more-vp-row-copy">
                <strong>
                  {label}
                </strong>
                <small>
                  {itemDescription}
                </small>
              </span>

              <ChevronRight
                size={17}
                className="alumni-more-vp-chevron"
              />
            </Link>
          )
        )}
      </nav>
    </motion.section>
  );
}

export default function MorePage() {
  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

  const reduceMotion =
    useReducedMotion();

  const [
    profile,
    setProfile,
  ] =
    useState<MoreProfile | null>(
      null
    );

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(true);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  useEffect(() => {
    if (
      !loading &&
      !user
    ) {
      router.replace(
        "/login"
      );
    }
  }, [
    loading,
    user,
    router,
  ]);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let active = true;

    async function loadProfile() {
      setProfileLoading(true);

      const {
        data,
        error,
      } =
        await supabase
          .from("profiles")
          .select(
            "username,full_name,avatar_url,career,university,education_institution_name"
          )
          .eq(
            "id",
            user!.id
          )
          .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        console.warn(
          "[Alumni More] profile:",
          error
        );
      }

      setProfile(
        data || null
      );
      setProfileLoading(
        false
      );
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const education =
    useMemo(
      () =>
        profile
          ?.education_institution_name ||
        profile?.university ||
        "",
      [
        profile
          ?.education_institution_name,
        profile?.university,
      ]
    );

  async function logout() {
    if (signingOut) {
      return;
    }

    const approved =
      window.confirm(
        "¿Cerrar sesión en Alumni?"
      );

    if (!approved) {
      return;
    }

    setSigningOut(true);

    try {
      await supabase.auth.signOut();
      window.location.href =
        "/login";
    } finally {
      setSigningOut(false);
    }
  }

  if (
    loading ||
    !user
  ) {
    return (
      <AppShell>
        <main className="alumni-more-vp mx-auto w-full max-w-[680px]">
          <div className="alumni-more-loading">
            Cargando...
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="alumni-more-vp mx-auto w-full max-w-[680px]">
        <motion.section
          className="alumni-more-vp-hero"
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
            className="alumni-more-vp-orbit is-one"
            aria-hidden="true"
          />
          <div
            className="alumni-more-vp-orbit is-two"
            aria-hidden="true"
          />

          <span className="alumni-more-vp-badge">
            <Sparkles size={13} />
            Tu espacio
          </span>

          <h1>Más</h1>

          <p>
            Accede a tu actividad, comunidad y opciones de
            ALUMNI con una estructura más clara.
          </p>
        </motion.section>

        <motion.div
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 14,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.12,
            duration: 0.45,
          }}
        >
          <Link
            href="/profile"
            className="alumni-more-vp-profile"
          >
            <span className="alumni-more-vp-avatar">
              {profileLoading ? (
                <span className="alumni-more-avatar-skeleton" />
              ) : (
                <AlumniAvatar
                  src={
                    profile
                      ?.avatar_url ||
                    null
                  }
                  name={
                    profile
                      ?.full_name ||
                    profile
                      ?.username ||
                    "Alumni"
                  }
                  alt=""
                  className="h-full w-full"
                  imageClassName="h-full w-full object-cover"
                  priority
                />
              )}
            </span>

            <span className="alumni-more-vp-profile-copy">
              <small>
                MI PERFIL
              </small>

              <strong>
                {profileLoading
                  ? "Mi perfil"
                  : profile
                      ?.full_name ||
                    (profile
                      ?.username
                      ? `@${profile.username}`
                      : "Mi perfil")}
              </strong>

              <span>
                {[
                  profile?.career,
                  education,
                ]
                  .filter(Boolean)
                  .join(" · ") ||
                  "Ver y administrar tu perfil"}
              </span>
            </span>

            <ChevronRight
              size={18}
            />
          </Link>
        </motion.div>

        <MoreSection
          eyebrow="ACTIVIDAD"
          title="Tu experiencia"
          description="Las funciones que usas para conectar, participar y volver a lo que guardaste."
          items={activityItems}
        />

        <MoreSection
          eyebrow="SOPORTE Y SISTEMA"
          title="ALUMNI"
          description="Configuración, ayuda e información del producto viven separadas del resto."
          items={systemItems}
        />

        <motion.button
          type="button"
          onClick={() =>
            void logout()
          }
          disabled={signingOut}
          className="alumni-more-vp-logout"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 10,
                }
          }
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
        >
          <LogOut
            size={18}
          />

          <span>
            <strong>
              {signingOut
                ? "Cerrando sesión..."
                : "Cerrar sesión"}
            </strong>
            <small>
              Salir de tu cuenta de ALUMNI
            </small>
          </span>
        </motion.button>
      </main>
    </AppShell>
  );
}

/* ALUMNI_MORE_2_0_LISTA_LIMPIA */
/* ALUMNI_VISUAL_PASS_2_0 */
