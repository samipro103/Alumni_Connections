"use client";

import {
  Bell,
  Bookmark,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
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

const primaryItems = [
  {
    href: "/notifications",
    label: "Notificaciones",
    description:
      "Mantente al día",
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

const secondaryItems = [
  {
    href: "/settings",
    label: "Configuración",
    description:
      "Preferencias de la app",
    icon: Settings,
  },
  {
    href: "/feedback",
    label: "Ayuda y feedback",
    description:
      "Estamos para ayudarte",
    icon: CircleHelp,
  },
];

export default function MorePage() {
  const router =
    useRouter();

  const {
    user,
    loading,
  } = useAuth();

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
        <main className="alumni-more-clean mx-auto w-full max-w-[560px]">
          <div className="alumni-more-loading">
            Cargando...
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main
        className="alumni-more-clean mx-auto w-full max-w-[560px]"
        data-more-design="option-1-clean-list"
      >
        <header className="alumni-more-header">
          <h1>Más</h1>
        </header>

        <Link
          href="/profile"
          className="alumni-more-profile"
        >
          <span className="alumni-more-avatar">
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
              />
            )}
          </span>

          <span className="alumni-more-profile-copy">
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

            {profile
              ?.username &&
              profile
                ?.full_name && (
                <small>
                  @
                  {
                    profile.username
                  }
                </small>
              )}

            {(profile?.career ||
              education) && (
              <small>
                {[
                  profile
                    ?.career,
                  education,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            )}

            {!profileLoading &&
              !profile
                ?.career &&
              !education && (
                <small>
                  Ver tu perfil
                </small>
              )}
          </span>

          <ChevronRight
            size={18}
            className="alumni-more-chevron"
          />
        </Link>

        <nav
          className="alumni-more-list"
          aria-label="Más secciones de Alumni"
        >
          {primaryItems.map(
            ({
              href,
              label,
              description,
              icon: Icon,
            }) => (
              <Link
                key={href}
                href={href}
                className="alumni-more-row"
              >
                <span className="alumni-more-row-icon">
                  <Icon
                    size={19}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="alumni-more-row-copy">
                  <strong>
                    {label}
                  </strong>
                  <small>
                    {
                      description
                    }
                  </small>
                </span>

                <ChevronRight
                  size={17}
                  className="alumni-more-chevron"
                />
              </Link>
            )
          )}
        </nav>

        <nav
          className="alumni-more-list alumni-more-list-secondary"
          aria-label="Configuración y ayuda"
        >
          {secondaryItems.map(
            ({
              href,
              label,
              description,
              icon: Icon,
            }) => (
              <Link
                key={href}
                href={href}
                className="alumni-more-row"
              >
                <span className="alumni-more-row-icon">
                  <Icon
                    size={19}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="alumni-more-row-copy">
                  <strong>
                    {label}
                  </strong>
                  <small>
                    {
                      description
                    }
                  </small>
                </span>

                <ChevronRight
                  size={17}
                  className="alumni-more-chevron"
                />
              </Link>
            )
          )}
        </nav>

        <button
          type="button"
          onClick={() =>
            void logout()
          }
          disabled={signingOut}
          className="alumni-more-logout"
        >
          <span className="alumni-more-row-icon">
            <LogOut
              size={19}
              strokeWidth={1.9}
            />
          </span>

          <span className="alumni-more-row-copy">
            <strong>
              {signingOut
                ? "Cerrando sesión..."
                : "Cerrar sesión"}
            </strong>
          </span>
        </button>
      </main>
    </AppShell>
  );
}

/* ALUMNI_MORE_2_0_LISTA_LIMPIA */
