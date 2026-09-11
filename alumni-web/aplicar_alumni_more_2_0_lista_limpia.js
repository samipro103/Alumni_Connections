const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_MORE_2_0_LISTA_LIMPIA";

const mobileNavPath = path.join(
  ROOT,
  "src",
  "components",
  "layout",
  "MobileNav.tsx"
);

const moreDir = path.join(
  ROOT,
  "src",
  "app",
  "more"
);

const morePagePath = path.join(
  moreDir,
  "page.tsx"
);

const moreCssPath = path.join(
  moreDir,
  "more-2-0.css"
);

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

if (!fs.existsSync(mobileNavPath)) {
  fail(
    "No encontré src/components/layout/MobileNav.tsx. " +
    "Ejecutá este parche desde alumni-web."
  );
}

const originalMobileNav =
  fs.readFileSync(
    mobileNavPath,
    "utf8"
  );

if (
  originalMobileNav.includes(MARKER) &&
  fs.existsSync(morePagePath) &&
  fs.existsSync(moreCssPath)
) {
  console.log(
    "✅ ALUMNI Más 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

/*
 * Protección: comprobamos que la base sea la nav
 * conocida antes de reemplazarla.
 */
const requiredTokens = [
  'label: "Inicio"',
  'label: "Explorar"',
  'label: "Crear"',
  'label: "Mensajes"',
  'MoreHorizontal',
  'moreOpen',
];

for (const token of requiredTokens) {
  if (!originalMobileNav.includes(token)) {
    fail(
      `MobileNav cambió: no encontré "${token}". ` +
      "No escribí ningún archivo."
    );
  }
}

const mobileNav = `"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  createPortal,
} from "react-dom";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";
import {
  House,
  Search,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  useAuth,
} from "@/components/auth/AuthProvider";
import {
  supabase,
} from "@/lib/supabase";

const unreadMessagesCache =
  new Map<string, number>();

const navItems = [
  {
    href: "/feed",
    label: "Inicio",
    icon: House,
    kind: "feed",
  },
  {
    href: "/messages",
    label: "Mensajes",
    icon: MessageCircle,
    kind: "messages",
  },
  {
    href: "/explore",
    label: "Buscar",
    icon: Search,
    kind: "search",
  },
  {
    href: "/more",
    label: "Más",
    icon: MoreHorizontal,
    kind: "more",
  },
] as const;

function isMoreSection(
  pathname: string
) {
  return (
    pathname === "/more" ||
    pathname.startsWith("/more/") ||
    pathname === "/community" ||
    pathname.startsWith("/community/") ||
    pathname === "/events" ||
    pathname.startsWith("/events/") ||
    pathname === "/passport" ||
    pathname.startsWith("/passport/") ||
    pathname === "/notifications" ||
    pathname.startsWith("/notifications/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/feedback" ||
    pathname.startsWith("/feedback/")
  );
}

export default function MobileNav() {
  const pathname =
    usePathname();

  const { user } =
    useAuth();

  const [
    portalReady,
    setPortalReady,
  ] = useState(false);

  const [
    unreadMessages,
    setUnreadMessages,
  ] = useState(
    user
      ? unreadMessagesCache.get(
          user.id
        ) || 0
      : 0
  );

  useEffect(() => {
    setPortalReady(true);

    return () => {
      setPortalReady(false);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const cached =
      unreadMessagesCache.get(
        user.id
      );

    if (
      typeof cached ===
      "number"
    ) {
      setUnreadMessages(
        cached
      );
    }

    const currentUser =
      user;

    let active = true;

    async function refreshUnread() {
      const [
        directResult,
        groupResult,
      ] = await Promise.all([
        supabase
          .from("messages")
          .select(
            "id",
            {
              count: "exact",
              head: true,
            }
          )
          .eq(
            "receiver_id",
            currentUser.id
          )
          .is(
            "read_at",
            null
          ),
        supabase.rpc(
          "get_my_message_groups"
        ),
      ]);

      const groupUnread =
        (
          groupResult.data ||
          []
        ).reduce(
          (
            total: number,
            group: any
          ) =>
            total +
            Number(
              group.unread_count ||
                0
            ),
          0
        );

      if (active) {
        const next =
          (directResult.count ||
            0) +
          groupUnread;

        unreadMessagesCache.set(
          currentUser.id,
          next
        );

        setUnreadMessages(
          next
        );
      }
    }

    void refreshUnread();

    const channel =
      supabase
        .channel(
          \`mobile-msg:\${currentUser.id}\`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter:
              \`receiver_id=eq.\${currentUser.id}\`,
          },
          refreshUnread
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "group_messages",
          },
          refreshUnread
        )
        .subscribe();

    window.addEventListener(
      "focus",
      refreshUnread
    );

    return () => {
      active = false;

      supabase.removeChannel(
        channel
      );

      window.removeEventListener(
        "focus",
        refreshUnread
      );
    };
  }, [user?.id]);

  if (!portalReady) {
    return null;
  }

  function activeFor(
    kind: typeof navItems[number]["kind"],
    href: string
  ) {
    if (kind === "more") {
      return isMoreSection(
        pathname
      );
    }

    if (kind === "feed") {
      return pathname === "/feed";
    }

    return (
      pathname === href ||
      pathname.startsWith(
        \`\${href}/\`
      )
    );
  }

  return createPortal(
    <nav
      data-alumni-mobile-nav="true"
      data-nav-design="clean-four"
      className="alumni-mobile-nav-clean fixed inset-x-0 bottom-0 z-[2147482000] border-t border-[var(--app-border)] bg-[color-mix(in_srgb,var(--app-surface)_98%,transparent)] px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md [backface-visibility:hidden] [transform:translateZ(0)] lg:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {navItems.map(
          ({
            href,
            label,
            icon: Icon,
            kind,
          }) => {
            const active =
              activeFor(
                kind,
                href
              );

            const messages =
              kind === "messages";

            return (
              <Link
                key={href}
                href={href}
                onClick={(
                  event
                ) => {
                  if (
                    kind ===
                      "feed" &&
                    pathname ===
                      "/feed"
                  ) {
                    event.preventDefault();

                    window.scrollTo({
                      top: 0,
                      behavior:
                        "smooth",
                    });
                  }
                }}
                className="alumni-mobile-nav-item flex min-h-12 flex-col items-center justify-center gap-1"
                data-active={
                  active
                    ? "true"
                    : "false"
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
              >
                <span className="alumni-mobile-nav-icon relative flex h-9 w-11 items-center justify-center rounded-lg transition-colors duration-150">
                  <Icon
                    size={20}
                    strokeWidth={
                      active
                        ? 2.25
                        : 1.9
                    }
                  />

                  {messages &&
                    unreadMessages >
                      0 && (
                      <span className="absolute right-0.5 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--app-accent-fill)] px-1 text-[9px] font-black leading-none text-[var(--app-on-accent)] ring-2 ring-[var(--app-surface)]">
                        {unreadMessages >
                        99
                          ? "99+"
                          : unreadMessages}
                      </span>
                    )}
                </span>

                <span className="alumni-mobile-nav-label text-[10px]">
                  {label}
                </span>
              </Link>
            );
          }
        )}
      </div>
    </nav>,
    document.body
  );
}

/* ${MARKER} */
`;

const morePage = `"use client";

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
                    ? \`@\${profile.username}\`
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

/* ${MARKER} */
`;

const moreCss = `/*
 * ${MARKER}
 * Opción 1 — Lista limpia.
 * Mobile-first 360–430px.
 */

.alumni-more-clean {
  width: 100%;
  min-height: 100%;
  padding:
    0 0 36px;
  color: var(--app-text);
}

.alumni-more-header {
  display: flex;
  min-height: 54px;
  align-items: center;
  border-bottom:
    1px solid
    var(--app-border);
}

.alumni-more-header h1 {
  margin: 0;
  color: var(--app-text);
  font-size: 26px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -.045em;
}

.alumni-more-profile {
  display: grid;
  grid-template-columns:
    58px
    minmax(0, 1fr)
    auto;
  min-height: 100px;
  align-items: center;
  gap: 13px;
  padding: 16px 2px;
  border-bottom:
    1px solid
    var(--app-border);
  color: inherit;
  text-decoration: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-more-profile:active,
.alumni-more-row:active,
.alumni-more-logout:active {
  background:
    var(--app-soft);
}

.alumni-more-avatar {
  display: flex;
  width: 58px;
  height: 58px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border:
    1px solid
    var(--app-border);
  border-radius: 999px;
  background:
    var(--app-surface-2);
}

.alumni-more-avatar-skeleton {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(
      90deg,
      var(--app-soft),
      var(--app-soft-strong),
      var(--app-soft)
    );
  background-size:
    200% 100%;
  animation:
    alumni-more-pulse
    1.2s ease-in-out
    infinite;
}

@keyframes alumni-more-pulse {
  to {
    background-position:
      -200% 0;
  }
}

.alumni-more-profile-copy,
.alumni-more-row-copy {
  min-width: 0;
}

.alumni-more-profile-copy strong {
  display: block;
  overflow: hidden;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-more-profile-copy small {
  display: block;
  overflow: hidden;
  margin-top: 3px;
  color: var(--app-muted);
  font-size: 10px;
  font-weight: 550;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alumni-more-list {
  display: block;
}

.alumni-more-list-secondary {
  margin-top: 10px;
  border-top:
    1px solid
    var(--app-border);
}

.alumni-more-row,
.alumni-more-logout {
  display: grid;
  width: 100%;
  grid-template-columns:
    34px
    minmax(0, 1fr)
    auto;
  min-height: 66px;
  align-items: center;
  gap: 12px;
  padding: 9px 2px;
  border: 0;
  border-bottom:
    1px solid
    var(--app-border);
  background: transparent;
  color: inherit;
  text-align: left;
  text-decoration: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-more-row-icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: transparent;
  color:
    var(--app-text-soft);
}

.alumni-more-row-copy strong {
  display: block;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 830;
  line-height: 1.18;
}

.alumni-more-row-copy small {
  display: block;
  margin-top: 4px;
  color: var(--app-muted-2);
  font-size: 10px;
  font-weight: 500;
  line-height: 1.25;
}

.alumni-more-chevron {
  flex: 0 0 auto;
  color: var(--app-muted-3);
}

.alumni-more-logout {
  grid-template-columns:
    34px
    minmax(0, 1fr);
  margin-top: 10px;
  border-bottom: 0;
  cursor: pointer;
}

.alumni-more-logout
  .alumni-more-row-icon,
.alumni-more-logout
  .alumni-more-row-copy strong {
  color: var(--app-danger);
}

.alumni-more-logout:disabled {
  cursor: wait;
  opacity: .55;
}

.alumni-more-loading {
  padding: 60px 0;
  color: var(--app-muted-2);
  font-size: 12px;
  text-align: center;
}

/* Bottom nav — clean four destinations */
.alumni-mobile-nav-clean {
  box-shadow:
    0 -1px 0
    color-mix(
      in srgb,
      var(--app-border) 70%,
      transparent
    );
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-item {
  color: var(--app-muted-2);
  text-decoration: none;
  -webkit-tap-highlight-color:
    transparent;
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-icon {
  color: inherit;
  background: transparent;
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-label {
  color: inherit;
  font-weight: 520;
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-item[data-active="true"] {
  color: var(--app-accent);
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-item[data-active="true"]
  .alumni-mobile-nav-label {
  color: var(--app-accent);
  font-weight: 720;
}

/*
 * No fondo circular/pastilla en Más ni en
 * los otros destinos. La selección se comunica
 * solamente con icono + texto Accent.
 */
.alumni-mobile-nav-clean
  .alumni-mobile-nav-item:active
  .alumni-mobile-nav-icon {
  transform: scale(.94);
}

.alumni-mobile-nav-clean
  .alumni-mobile-nav-icon {
  transition:
    transform .12s ease,
    color .15s ease;
}

/* Dark / Light strictly use app tokens. */
html[data-theme="dark"]
  .alumni-more-clean,
html[data-theme="light"]
  .alumni-more-clean {
  background: transparent;
}

/* Very small phones */
@media (max-width: 374px) {
  .alumni-more-header h1 {
    font-size: 25px;
  }

  .alumni-more-profile {
    min-height: 92px;
  }

  .alumni-more-avatar {
    width: 54px;
    height: 54px;
  }

  .alumni-more-row,
  .alumni-more-logout {
    min-height: 62px;
  }

  .alumni-more-row-copy strong {
    font-size: 12.5px;
  }

  .alumni-more-row-copy small {
    font-size: 9.5px;
  }
}

/*
 * Desktop remains secondary:
 * same mobile language, simply centered.
 */
@media (min-width: 700px) {
  .alumni-more-clean {
    max-width: 540px !important;
    padding-top: 14px;
    padding-bottom: 52px;
  }

  .alumni-more-header {
    padding-inline: 14px;
    border:
      1px solid
      var(--app-border);
    border-radius:
      16px 16px 0 0;
    background:
      var(--app-surface);
  }

  .alumni-more-profile,
  .alumni-more-list,
  .alumni-more-logout {
    padding-inline: 14px;
  }
}

/* ${MARKER} */
`;

/*
 * Validate TS/TSX before touching disk.
 */
try {
  const ts =
    require("typescript");

  for (const [
    name,
    source,
  ] of [
    [
      "MobileNav.tsx",
      mobileNav,
    ],
    [
      "more/page.tsx",
      morePage,
    ],
  ]) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

    const diagnostics =
      parsed.parseDiagnostics ||
      [];

    if (diagnostics.length) {
      const first =
        diagnostics[0];

      const message =
        ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        );

      const pos =
        typeof first.start ===
        "number"
          ? parsed
              .getLineAndCharacterOfPosition(
                first.start
              )
          : null;

      fail(
        `${name}: sintaxis inválida` +
          (
            pos
              ? ` línea ${pos.line + 1}, columna ${pos.character + 1}`
              : ""
          ) +
          `: ${message}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: MobileNav y /more válidos"
  );
} catch (error) {
  if (
    error &&
    typeof error === "object" &&
    error.code ===
      "MODULE_NOT_FOUND"
  ) {
    console.warn(
      "⚠️ TypeScript no disponible para validación extra."
    );
  } else {
    throw error;
  }
}

/*
 * Backup current nav.
 */
const navBackup =
  mobileNavPath +
  ".before-more-2.0.bak";

if (!fs.existsSync(navBackup)) {
  fs.copyFileSync(
    mobileNavPath,
    navBackup
  );
}

fs.mkdirSync(
  moreDir,
  {
    recursive: true,
  }
);

fs.writeFileSync(
  mobileNavPath,
  mobileNav,
  "utf8"
);

fs.writeFileSync(
  morePagePath,
  morePage,
  "utf8"
);

fs.writeFileSync(
  moreCssPath,
  moreCss,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Más 2.0 aplicado."
);
console.log(
  "✅ Nav móvil: Inicio · Mensajes · Buscar · Más."
);
console.log(
  "✅ Crear eliminado de la barra inferior."
);
console.log(
  "✅ Más ahora abre /more como página completa."
);
console.log(
  "✅ Perfil destacado arriba."
);
console.log(
  "✅ Notificaciones, Comunidad, Eventos, Pasaporte y Guardados."
);
console.log(
  "✅ Configuración y Ayuda agrupados."
);
console.log(
  "✅ Cerrar sesión separado."
);
console.log(
  "✅ Dark / Light con tokens ALUMNI."
);
console.log(
  "✅ Mobile-first 360–430px."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
