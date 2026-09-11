const fs = require("fs");
const path = require("path");

const ROOT =
  process.cwd();

const MARKER =
  "ALUMNI_VISUAL_PASS_2_0";

const TOPBAR =
  "src/components/layout/TopBar.tsx";
const MORE =
  "src/app/more/page.tsx";
const PROFILE_CSS =
  "src/app/profile/profile-option-3-launch.css";
const GLOBALS =
  "src/app/globals.css";

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
    ".before-visual-pass-2.0.bak";

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

function replaceExact(
  source,
  before,
  after,
  label
) {
  if (
    !source.includes(
      before
    )
  ) {
    fail(
      `No encontré bloque esperado: ${label}`
    );
  }

  return source.replace(
    before,
    after
  );
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

let topbar =
  read(TOPBAR);
const oldMore =
  read(MORE);
let profileCss =
  read(PROFILE_CSS);
let globals =
  read(GLOBALS);

if (
  topbar.includes(
    MARKER
  ) &&
  oldMore.includes(
    MARKER
  ) &&
  globals.includes(
    MARKER
  )
) {
  console.log(
    "✅ Visual Pass 2.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  TOPBAR,
  topbar
);
backup(
  MORE,
  oldMore
);
backup(
  PROFILE_CSS,
  profileCss
);
backup(
  GLOBALS,
  globals
);

/* ======================================================
   TOPBAR: profile avatar always visible on profile routes
   ====================================================== */

if (
  !topbar.includes(
    "usePathname"
  )
) {
  topbar =
    replaceExact(
      topbar,
      `import {
  useRouter,
} from "next/navigation";`,
      `import {
  usePathname,
  useRouter,
} from "next/navigation";`,
      "TopBar usePathname import"
    );
}

if (
  !topbar.includes(
    "const pathname ="
  )
) {
  topbar =
    replaceExact(
      topbar,
      `export default function TopBar() {
  const router =
    useRouter();`,
      `export default function TopBar() {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const keepProfileNavVisible =
    pathname === "/profile" ||
    pathname.startsWith("/u/");`,
      "TopBar profile route state"
    );
}

if (
  !topbar.includes(
    "keepProfileNavVisible &&"
  )
) {
  const effectNeedle =
    `  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }`;

  const effectReplacement =
    `  useEffect(() => {
    if (
      keepProfileNavVisible
    ) {
      setHiddenByScroll(
        false
      );
      return;
    }

    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }`;

  topbar =
    replaceExact(
      topbar,
      effectNeedle,
      effectReplacement,
      "TopBar scroll effect"
    );

  topbar =
    topbar.replace(
      `  }, []);`,
      `  }, [
    keepProfileNavVisible,
  ]);`,
      1
    );
}

topbar =
  topbar.replace(
    `hiddenByScroll
          ? "-translate-y-full"
          : "translate-y-0"`,
    `hiddenByScroll &&
        !keepProfileNavVisible
          ? "-translate-y-full"
          : "translate-y-0"`
  );

topbar =
  topbar.replace(
    `className="ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full`,
    `className="alumni-topbar-profile-avatar ml-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full`
  );

topbar +=
  `\n/* ${MARKER}:TOPBAR */\n`;

/* ======================================================
   MORE: definitive grouped version
   ====================================================== */

const nextMore =
  "\"use client\";\n\nimport {\n  Bell,\n  Bookmark,\n  BookOpen,\n  CalendarDays,\n  ChevronRight,\n  CircleHelp,\n  Info,\n  LogOut,\n  Settings,\n  Sparkles,\n  Users,\n} from \"lucide-react\";\nimport Link from \"next/link\";\nimport {\n  useEffect,\n  useMemo,\n  useState,\n} from \"react\";\nimport {\n  useRouter,\n} from \"next/navigation\";\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport AppShell from \"@/components/layout/AppShell\";\nimport {\n  useAuth,\n} from \"@/components/auth/AuthProvider\";\nimport {\n  supabase,\n} from \"@/lib/supabase\";\nimport {\n  AlumniAvatar,\n} from \"@/components/ui/AlumniImage\";\nimport \"./more-2-0.css\";\n\ntype MoreProfile = {\n  username?: string | null;\n  full_name?: string | null;\n  avatar_url?: string | null;\n  career?: string | null;\n  university?: string | null;\n  education_institution_name?:\n    | string\n    | null;\n};\n\nconst activityItems = [\n  {\n    href: \"/notifications\",\n    label: \"Notificaciones\",\n    description:\n      \"Mantente al día con tu actividad\",\n    icon: Bell,\n  },\n  {\n    href: \"/community\",\n    label: \"Comunidad\",\n    description:\n      \"Conecta con otros alumni\",\n    icon: Users,\n  },\n  {\n    href: \"/events\",\n    label: \"Eventos\",\n    description:\n      \"Encuentros y actividades\",\n    icon: CalendarDays,\n  },\n  {\n    href: \"/passport\",\n    label: \"Pasaporte Alumni\",\n    description:\n      \"Tu recorrido, en un solo lugar\",\n    icon: BookOpen,\n  },\n  {\n    href:\n      \"/settings?section=profile&view=saved\",\n    label: \"Guardados\",\n    description:\n      \"Publicaciones y recursos\",\n    icon: Bookmark,\n  },\n];\n\nconst systemItems = [\n  {\n    href: \"/settings\",\n    label: \"Configuración\",\n    description:\n      \"Cuenta, privacidad y preferencias\",\n    icon: Settings,\n  },\n  {\n    href: \"/feedback\",\n    label: \"Ayuda y feedback\",\n    description:\n      \"Soporte, problemas e ideas\",\n    icon: CircleHelp,\n  },\n  {\n    href: \"/about\",\n    label: \"Acerca de ALUMNI\",\n    description:\n      \"La app, su autor y el proyecto\",\n    icon: Info,\n  },\n];\n\nfunction MoreSection({\n  eyebrow,\n  title,\n  description,\n  items,\n}: {\n  eyebrow: string;\n  title: string;\n  description: string;\n  items: typeof activityItems;\n}) {\n  const reduceMotion =\n    useReducedMotion();\n\n  return (\n    <motion.section\n      className=\"alumni-more-vp-section\"\n      initial={\n        reduceMotion\n          ? false\n          : {\n              opacity: 0,\n              y: 18,\n            }\n      }\n      whileInView={{\n        opacity: 1,\n        y: 0,\n      }}\n      viewport={{\n        once: true,\n        amount: 0.18,\n      }}\n      transition={{\n        duration: 0.46,\n        ease: [\n          0.2,\n          0.8,\n          0.2,\n          1,\n        ],\n      }}\n    >\n      <header className=\"alumni-more-vp-section-head\">\n        <small>\n          {eyebrow}\n        </small>\n        <h2>{title}</h2>\n        <p>\n          {description}\n        </p>\n      </header>\n\n      <nav className=\"alumni-more-vp-list\">\n        {items.map(\n          ({\n            href,\n            label,\n            description:\n              itemDescription,\n            icon: Icon,\n          }) => (\n            <Link\n              key={href}\n              href={href}\n              className=\"alumni-more-vp-row\"\n              data-alumni-motion=\"card\"\n            >\n              <span className=\"alumni-more-vp-row-icon\">\n                <Icon\n                  size={18}\n                  strokeWidth={1.9}\n                />\n              </span>\n\n              <span className=\"alumni-more-vp-row-copy\">\n                <strong>\n                  {label}\n                </strong>\n                <small>\n                  {itemDescription}\n                </small>\n              </span>\n\n              <ChevronRight\n                size={17}\n                className=\"alumni-more-vp-chevron\"\n              />\n            </Link>\n          )\n        )}\n      </nav>\n    </motion.section>\n  );\n}\n\nexport default function MorePage() {\n  const router =\n    useRouter();\n\n  const {\n    user,\n    loading,\n  } = useAuth();\n\n  const reduceMotion =\n    useReducedMotion();\n\n  const [\n    profile,\n    setProfile,\n  ] =\n    useState<MoreProfile | null>(\n      null\n    );\n\n  const [\n    profileLoading,\n    setProfileLoading,\n  ] = useState(true);\n\n  const [\n    signingOut,\n    setSigningOut,\n  ] = useState(false);\n\n  useEffect(() => {\n    if (\n      !loading &&\n      !user\n    ) {\n      router.replace(\n        \"/login\"\n      );\n    }\n  }, [\n    loading,\n    user,\n    router,\n  ]);\n\n  useEffect(() => {\n    if (!user?.id) {\n      setProfile(null);\n      setProfileLoading(false);\n      return;\n    }\n\n    let active = true;\n\n    async function loadProfile() {\n      setProfileLoading(true);\n\n      const {\n        data,\n        error,\n      } =\n        await supabase\n          .from(\"profiles\")\n          .select(\n            \"username,full_name,avatar_url,career,university,education_institution_name\"\n          )\n          .eq(\n            \"id\",\n            user!.id\n          )\n          .maybeSingle();\n\n      if (!active) {\n        return;\n      }\n\n      if (error) {\n        console.warn(\n          \"[Alumni More] profile:\",\n          error\n        );\n      }\n\n      setProfile(\n        data || null\n      );\n      setProfileLoading(\n        false\n      );\n    }\n\n    void loadProfile();\n\n    return () => {\n      active = false;\n    };\n  }, [user?.id]);\n\n  const education =\n    useMemo(\n      () =>\n        profile\n          ?.education_institution_name ||\n        profile?.university ||\n        \"\",\n      [\n        profile\n          ?.education_institution_name,\n        profile?.university,\n      ]\n    );\n\n  async function logout() {\n    if (signingOut) {\n      return;\n    }\n\n    const approved =\n      window.confirm(\n        \"¿Cerrar sesión en Alumni?\"\n      );\n\n    if (!approved) {\n      return;\n    }\n\n    setSigningOut(true);\n\n    try {\n      await supabase.auth.signOut();\n      window.location.href =\n        \"/login\";\n    } finally {\n      setSigningOut(false);\n    }\n  }\n\n  if (\n    loading ||\n    !user\n  ) {\n    return (\n      <AppShell>\n        <main className=\"alumni-more-vp mx-auto w-full max-w-[680px]\">\n          <div className=\"alumni-more-loading\">\n            Cargando...\n          </div>\n        </main>\n      </AppShell>\n    );\n  }\n\n  return (\n    <AppShell>\n      <main className=\"alumni-more-vp mx-auto w-full max-w-[680px]\">\n        <motion.section\n          className=\"alumni-more-vp-hero\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 18,\n                  scale: 0.992,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n            scale: 1,\n          }}\n          transition={{\n            duration: 0.58,\n            ease: [\n              0.2,\n              0.8,\n              0.2,\n              1,\n            ],\n          }}\n        >\n          <div\n            className=\"alumni-more-vp-orbit is-one\"\n            aria-hidden=\"true\"\n          />\n          <div\n            className=\"alumni-more-vp-orbit is-two\"\n            aria-hidden=\"true\"\n          />\n\n          <span className=\"alumni-more-vp-badge\">\n            <Sparkles size={13} />\n            Tu espacio\n          </span>\n\n          <h1>Más</h1>\n\n          <p>\n            Accede a tu actividad, comunidad y opciones de\n            ALUMNI con una estructura más clara.\n          </p>\n        </motion.section>\n\n        <motion.div\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 14,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            delay: 0.12,\n            duration: 0.45,\n          }}\n        >\n          <Link\n            href=\"/profile\"\n            className=\"alumni-more-vp-profile\"\n          >\n            <span className=\"alumni-more-vp-avatar\">\n              {profileLoading ? (\n                <span className=\"alumni-more-avatar-skeleton\" />\n              ) : (\n                <AlumniAvatar\n                  src={\n                    profile\n                      ?.avatar_url ||\n                    null\n                  }\n                  name={\n                    profile\n                      ?.full_name ||\n                    profile\n                      ?.username ||\n                    \"Alumni\"\n                  }\n                  alt=\"\"\n                  className=\"h-full w-full\"\n                  imageClassName=\"h-full w-full object-cover\"\n                  priority\n                />\n              )}\n            </span>\n\n            <span className=\"alumni-more-vp-profile-copy\">\n              <small>\n                MI PERFIL\n              </small>\n\n              <strong>\n                {profileLoading\n                  ? \"Mi perfil\"\n                  : profile\n                      ?.full_name ||\n                    (profile\n                      ?.username\n                      ? `@${profile.username}`\n                      : \"Mi perfil\")}\n              </strong>\n\n              <span>\n                {[\n                  profile?.career,\n                  education,\n                ]\n                  .filter(Boolean)\n                  .join(\" · \") ||\n                  \"Ver y administrar tu perfil\"}\n              </span>\n            </span>\n\n            <ChevronRight\n              size={18}\n            />\n          </Link>\n        </motion.div>\n\n        <MoreSection\n          eyebrow=\"ACTIVIDAD\"\n          title=\"Tu experiencia\"\n          description=\"Las funciones que usas para conectar, participar y volver a lo que guardaste.\"\n          items={activityItems}\n        />\n\n        <MoreSection\n          eyebrow=\"SOPORTE Y SISTEMA\"\n          title=\"ALUMNI\"\n          description=\"Configuración, ayuda e información del producto viven separadas del resto.\"\n          items={systemItems}\n        />\n\n        <motion.button\n          type=\"button\"\n          onClick={() =>\n            void logout()\n          }\n          disabled={signingOut}\n          className=\"alumni-more-vp-logout\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 10,\n                }\n          }\n          whileInView={{\n            opacity: 1,\n            y: 0,\n          }}\n          viewport={{\n            once: true,\n          }}\n        >\n          <LogOut\n            size={18}\n          />\n\n          <span>\n            <strong>\n              {signingOut\n                ? \"Cerrando sesión...\"\n                : \"Cerrar sesión\"}\n            </strong>\n            <small>\n              Salir de tu cuenta de ALUMNI\n            </small>\n          </span>\n        </motion.button>\n      </main>\n    </AppShell>\n  );\n}\n\n/* ALUMNI_MORE_2_0_LISTA_LIMPIA */\n/* ALUMNI_VISUAL_PASS_2_0 */\n";

/* ======================================================
   PROFILE + GLOBAL VISUAL PASS
   ====================================================== */

const extraCss =
  "\n/* =========================================================\n   ALUMNI Visual Pass 2.0\n   Developer-showcase inspired visual language\n   ========================================================= */\n\n:root {\n  --vp-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 9%,\n      transparent\n    );\n  --vp-line:\n    color-mix(\n      in srgb,\n      var(--app-accent) 26%,\n      var(--app-border)\n    );\n}\n\n/* ---------------------------------------------------------\n   Shared premium language\n   --------------------------------------------------------- */\n\n.alumni-feed-page,\n.alumni-profile-launch,\n.alumni-explore-pro,\n.alumni-messages-page,\n.alumni-settings-classic,\n.alumni-events-2,\n.alumni-community-2,\n.alumni-notifications-pro {\n  color:\n    var(--app-text);\n}\n\n:is(\n  .alumni-explore-hero,\n  .alumni-inbox-header,\n  .events2-hero,\n  .community2-hero,\n  .alumni-notifications-header\n) {\n  position: relative;\n  isolation: isolate;\n}\n\n:is(\n  .events2-hero,\n  .community2-hero\n) {\n  overflow: hidden;\n  padding:\n    24px 20px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    24px;\n  background:\n    var(--app-surface);\n}\n\n:is(\n  .events2-hero,\n  .community2-hero\n)::after {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -82px;\n  right: -72px;\n  width: 170px;\n  height: 170px;\n  border:\n    1px solid\n    var(--vp-line);\n  border-radius: 50%;\n  pointer-events: none;\n}\n\n:is(\n  .events2-hero,\n  .community2-hero\n) h1 {\n  font-size:\n    clamp(\n      30px,\n      8vw,\n      40px\n    );\n  font-weight: 950;\n  letter-spacing:\n    -.05em;\n}\n\n/* ---------------------------------------------------------\n   Back buttons: same clarity as Developer\n   --------------------------------------------------------- */\n\n:is(\n  .alumni-profile-launch-cover-action.is-back,\n  .alumni-settings-classic-back,\n  .alumni-settings-detail-header > button,\n  .alumni-about-back,\n  .alumni-help-header > button\n) {\n  transition:\n    transform\n      150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color\n      160ms\n      ease,\n    border-color\n      160ms\n      ease;\n}\n\n:is(\n  .alumni-profile-launch-cover-action.is-back,\n  .alumni-settings-classic-back,\n  .alumni-settings-detail-header > button,\n  .alumni-about-back,\n  .alumni-help-header > button\n):active {\n  transform:\n    scale(.92);\n}\n\n/* ---------------------------------------------------------\n   Feed\n   --------------------------------------------------------- */\n\n.alumni-feed-page\n.alumni-pro-composer {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    21px;\n  background:\n    var(--app-surface);\n  box-shadow:\n    0 12px 34px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 42%,\n      transparent\n    );\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs {\n  margin-top: 12px;\n  margin-bottom: 14px;\n  padding: 4px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    15px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs\nbutton {\n  min-height: 38px;\n  border-radius: 11px;\n}\n\n.alumni-feed-page\n.alumni-pro-feed-tabs\nbutton[data-active=\"true\"] {\n  background:\n    var(--vp-wash);\n  color:\n    var(--app-accent);\n}\n\n.alumni-feed-page\n.alumni-feed-post-viewport {\n  margin-bottom:\n    13px;\n}\n\n.alumni-feed-page\n.alumni-pro-toast {\n  border:\n    1px solid\n    var(--vp-line);\n  border-radius:\n    14px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-surface) 96%,\n      transparent\n    );\n  box-shadow:\n    0 16px 40px\n    var(--app-shadow);\n  backdrop-filter:\n    blur(16px);\n}\n\n/* ---------------------------------------------------------\n   Profile — avatar must always remain visible\n   --------------------------------------------------------- */\n\n.alumni-profile-launch-hero {\n  position: relative;\n  isolation: isolate;\n}\n\n.alumni-profile-launch-header,\n.alumni-profile-launch-avatar-row,\n.alumni-profile-launch-avatar-wrap {\n  overflow: visible !important;\n}\n\n.alumni-profile-launch-avatar-row {\n  position: relative;\n  z-index: 8;\n}\n\n.alumni-profile-launch-avatar-wrap {\n  top: -42px !important;\n  z-index: 12;\n  opacity: 1 !important;\n  visibility: visible !important;\n  transform: none !important;\n}\n\n.alumni-profile-launch-avatar {\n  position: relative;\n  z-index: 3;\n  opacity: 1 !important;\n  visibility: visible !important;\n  border:\n    3px solid\n    var(--app-bg);\n  box-shadow:\n    0 10px 30px\n    rgba(0,0,0,.28);\n}\n\n.alumni-profile-launch-avatar\n.alumni-image-shell,\n.alumni-profile-launch-avatar\n.alumni-image-element,\n.alumni-profile-launch-avatar\nbutton {\n  display: block;\n  width: 100%;\n  height: 100%;\n  opacity: 1 !important;\n  visibility: visible !important;\n}\n\n.alumni-profile-launch-camera {\n  z-index: 14;\n}\n\n.alumni-profile-launch-actions\n> * {\n  transition:\n    transform\n      140ms\n      cubic-bezier(.2,.8,.2,1),\n    border-color\n      160ms\n      ease,\n    background-color\n      160ms\n      ease;\n}\n\n.alumni-profile-launch-actions\n> *:active {\n  transform:\n    scale(.975);\n}\n\n.alumni-profile-launch-stats {\n  margin-top: 18px;\n  border-top:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-profile-launch-tabs {\n  border:\n    1px solid\n    var(--app-border);\n  border-right: 0;\n  border-left: 0;\n  box-shadow:\n    0 8px 22px\n    color-mix(\n      in srgb,\n      var(--app-shadow) 18%,\n      transparent\n    );\n}\n\n/* ---------------------------------------------------------\n   Search\n   --------------------------------------------------------- */\n\n.alumni-explore-pro\n.alumni-explore-hero {\n  overflow: hidden;\n  padding:\n    23px 20px\n    18px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    24px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-explore-pro\n.alumni-explore-hero::after {\n  content: \"\";\n  position: absolute;\n  z-index: -1;\n  top: -92px;\n  right: -78px;\n  width: 182px;\n  height: 182px;\n  border:\n    1px solid\n    var(--vp-line);\n  border-radius: 50%;\n}\n\n.alumni-explore-pro\n.alumni-explore-hero h1 {\n  font-size:\n    clamp(\n      30px,\n      8vw,\n      40px\n    );\n  font-weight: 950;\n  letter-spacing:\n    -.05em;\n}\n\n.alumni-explore-pro\n.alumni-explore-search {\n  border:\n    1px solid\n    var(--app-border);\n  background:\n    var(--app-bg);\n}\n\n.alumni-explore-pro\n.alumni-explore-section {\n  margin-top: 22px;\n}\n\n.alumni-explore-pro\n.alumni-explore-section-title h2 {\n  font-weight: 920;\n  letter-spacing:\n    -.035em;\n}\n\n/* ---------------------------------------------------------\n   Messages\n   --------------------------------------------------------- */\n\n.alumni-messages-page\n.alumni-inbox-header {\n  margin-bottom: 14px;\n  padding:\n    20px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    22px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-messages-page\n.alumni-inbox-header h1 {\n  font-weight: 950 !important;\n  letter-spacing:\n    -.05em !important;\n}\n\n.alumni-messages-page\n:is(\n  .alumni-inbox-list,\n  .alumni-message-list\n) {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    20px;\n  background:\n    var(--app-surface);\n}\n\n/* ---------------------------------------------------------\n   Settings\n   --------------------------------------------------------- */\n\n.alumni-settings-classic\n.alumni-settings-classic-header {\n  margin-bottom: 14px;\n  padding:\n    0 4px\n    14px;\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-settings-classic\n.alumni-settings-classic-header h1 {\n  font-weight: 940;\n  letter-spacing:\n    -.04em;\n}\n\n.alumni-settings-profile-row {\n  margin-bottom: 14px;\n  padding:\n    14px;\n  border:\n    1px solid\n    var(--vp-line) !important;\n  border-radius:\n    20px !important;\n  background:\n    var(--vp-wash) !important;\n}\n\n.alumni-settings-classic-list {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    20px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-settings-classic-row {\n  padding-right:\n    14px !important;\n  padding-left:\n    14px !important;\n}\n\n.alumni-settings-logout {\n  margin-top: 14px;\n  border:\n    1px solid\n    color-mix(\n      in srgb,\n      var(--app-danger) 22%,\n      var(--app-border)\n    ) !important;\n  border-radius:\n    18px !important;\n}\n\n/* ---------------------------------------------------------\n   Events + Community\n   --------------------------------------------------------- */\n\n:is(\n  .events2-navigation,\n  .community2-navigation\n) {\n  margin-top: 12px;\n  padding: 8px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    17px;\n  background:\n    var(--app-surface);\n}\n\n:is(\n  .events2-list,\n  .community2-list\n) {\n  overflow: hidden;\n  margin-top: 14px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    21px;\n  background:\n    var(--app-surface);\n}\n\n:is(\n  .events2-row,\n  .community2-row\n) {\n  padding-right:\n    15px;\n  padding-left:\n    15px;\n}\n\n:is(\n  .events2-primary-action,\n  .community2-primary-action\n) {\n  border-radius:\n    13px !important;\n  box-shadow:\n    0 9px 24px\n    color-mix(\n      in srgb,\n      var(--app-accent) 12%,\n      transparent\n    );\n}\n\n/* ---------------------------------------------------------\n   Notifications\n   --------------------------------------------------------- */\n\n.alumni-notifications-pro\n.alumni-notifications-header {\n  overflow: hidden;\n  margin-bottom: 12px;\n  padding:\n    20px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    22px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-notifications-pro\n.alumni-notifications-header h1 {\n  font-weight: 950;\n  letter-spacing:\n    -.045em;\n}\n\n/* ---------------------------------------------------------\n   More — grouped + developer-style clarity\n   --------------------------------------------------------- */\n\n.alumni-more-vp {\n  --more-wash:\n    color-mix(\n      in srgb,\n      var(--app-accent) 10%,\n      transparent\n    );\n  --more-line:\n    color-mix(\n      in srgb,\n      var(--app-accent) 28%,\n      var(--app-border)\n    );\n  padding-bottom:\n    30px;\n}\n\n.alumni-more-vp-hero {\n  position: relative;\n  isolation: isolate;\n  overflow: hidden;\n  padding:\n    28px 21px\n    24px;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    26px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-more-vp-hero::before {\n  content: \"\";\n  position: absolute;\n  z-index: -2;\n  top: -104px;\n  right: -105px;\n  width: 220px;\n  height: 220px;\n  border:\n    1px solid\n    var(--more-line);\n  border-radius: 50%;\n}\n\n.alumni-more-vp-orbit {\n  position: absolute;\n  z-index: -1;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 50%;\n  opacity: .68;\n}\n\n.alumni-more-vp-orbit::after {\n  content: \"\";\n  position: absolute;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background:\n    var(--app-accent);\n  box-shadow:\n    0 0 0 5px\n    var(--more-wash);\n}\n\n.alumni-more-vp-orbit.is-one {\n  left: -62px;\n  bottom: 16px;\n  width: 108px;\n  height: 108px;\n}\n\n.alumni-more-vp-orbit.is-one::after {\n  top: 14px;\n  right: 9px;\n}\n\n.alumni-more-vp-orbit.is-two {\n  right: 12px;\n  bottom: -42px;\n  width: 78px;\n  height: 78px;\n}\n\n.alumni-more-vp-orbit.is-two::after {\n  top: 9px;\n  left: 8px;\n}\n\n.alumni-more-vp-badge {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  min-height: 27px;\n  padding: 0 10px;\n  border:\n    1px solid\n    var(--more-line);\n  border-radius: 999px;\n  background:\n    var(--more-wash);\n  color:\n    var(--app-accent);\n  font-size: 9px;\n  font-weight: 900;\n  letter-spacing:\n    .12em;\n  text-transform:\n    uppercase;\n}\n\n.alumni-more-vp-hero h1 {\n  margin:\n    22px 0 0;\n  font-size:\n    clamp(\n      34px,\n      9vw,\n      46px\n    );\n  line-height: 1;\n  font-weight: 950;\n  letter-spacing:\n    -.055em;\n}\n\n.alumni-more-vp-hero p {\n  max-width: 500px;\n  margin:\n    12px 0 0;\n  color:\n    var(--app-text-soft);\n  font-size: 12px;\n  line-height: 1.7;\n}\n\n.alumni-more-vp-profile {\n  display: grid;\n  grid-template-columns:\n    58px\n    minmax(0,1fr)\n    20px;\n  align-items: center;\n  gap: 13px;\n  margin-top: 13px;\n  padding:\n    14px;\n  border:\n    1px solid\n    var(--more-line);\n  border-radius:\n    20px;\n  background:\n    var(--more-wash);\n  color: inherit;\n  text-decoration: none;\n}\n\n.alumni-more-vp-avatar {\n  width: 56px;\n  height: 56px;\n  overflow: hidden;\n  border:\n    2px solid\n    var(--app-bg);\n  border-radius: 50%;\n  background:\n    var(--app-surface-2);\n}\n\n.alumni-more-vp-profile-copy {\n  display: flex;\n  min-width: 0;\n  flex-direction:\n    column;\n}\n\n.alumni-more-vp-profile-copy\nsmall {\n  color:\n    var(--app-accent);\n  font-size: 8px;\n  font-weight: 900;\n  letter-spacing:\n    .12em;\n}\n\n.alumni-more-vp-profile-copy\nstrong {\n  overflow: hidden;\n  margin-top: 4px;\n  font-size: 14px;\n  font-weight: 900;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-more-vp-profile-copy\nspan {\n  overflow: hidden;\n  margin-top: 3px;\n  color:\n    var(--app-muted);\n  font-size: 9.5px;\n  text-overflow:\n    ellipsis;\n  white-space:\n    nowrap;\n}\n\n.alumni-more-vp-section {\n  margin-top: 34px;\n}\n\n.alumni-more-vp-section-head {\n  padding:\n    0 3px\n    12px;\n}\n\n.alumni-more-vp-section-head\nsmall {\n  color:\n    var(--app-accent);\n  font-size: 8.5px;\n  font-weight: 900;\n  letter-spacing:\n    .14em;\n}\n\n.alumni-more-vp-section-head h2 {\n  margin:\n    6px 0 0;\n  font-size:\n    23px;\n  line-height: 1.05;\n  font-weight: 930;\n  letter-spacing:\n    -.04em;\n}\n\n.alumni-more-vp-section-head p {\n  max-width: 520px;\n  margin:\n    7px 0 0;\n  color:\n    var(--app-muted);\n  font-size: 10.5px;\n  line-height: 1.6;\n}\n\n.alumni-more-vp-list {\n  overflow: hidden;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius:\n    20px;\n  background:\n    var(--app-surface);\n}\n\n.alumni-more-vp-row {\n  display: grid;\n  grid-template-columns:\n    39px\n    minmax(0,1fr)\n    18px;\n  align-items: center;\n  gap: 12px;\n  min-height: 72px;\n  padding:\n    11px 14px;\n  border-top:\n    1px solid\n    var(--app-border);\n  color: inherit;\n  text-decoration: none;\n}\n\n.alumni-more-vp-row:first-child {\n  border-top: 0;\n}\n\n.alumni-more-vp-row:active {\n  background:\n    var(--app-soft);\n}\n\n.alumni-more-vp-row-icon {\n  display: inline-flex;\n  width: 38px;\n  height: 38px;\n  align-items: center;\n  justify-content: center;\n  border-radius: 12px;\n  background:\n    var(--more-wash);\n  color:\n    var(--app-accent);\n}\n\n.alumni-more-vp-row-copy {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 3px;\n}\n\n.alumni-more-vp-row-copy\nstrong {\n  font-size: 12px;\n  font-weight: 880;\n}\n\n.alumni-more-vp-row-copy\nsmall {\n  color:\n    var(--app-muted);\n  font-size: 9.5px;\n  line-height: 1.45;\n}\n\n.alumni-more-vp-chevron {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-more-vp-logout {\n  display: grid;\n  width: 100%;\n  grid-template-columns:\n    30px\n    minmax(0,1fr);\n  align-items: center;\n  gap: 10px;\n  margin-top: 26px;\n  padding:\n    13px 4px;\n  border: 0;\n  border-top:\n    1px solid\n    var(--app-border);\n  border-bottom:\n    1px solid\n    var(--app-border);\n  background:\n    transparent;\n  color:\n    var(--app-danger);\n  text-align: left;\n}\n\n.alumni-more-vp-logout\n> span {\n  display: flex;\n  flex-direction:\n    column;\n  gap: 2px;\n}\n\n.alumni-more-vp-logout\nstrong {\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.alumni-more-vp-logout\nsmall {\n  color:\n    var(--app-muted);\n  font-size: 9px;\n}\n\n/* ---------------------------------------------------------\n   Mobile refinements\n   --------------------------------------------------------- */\n\n@media (max-width: 480px) {\n  :is(\n    .events2-hero,\n    .community2-hero,\n    .alumni-explore-pro\n      .alumni-explore-hero,\n    .alumni-messages-page\n      .alumni-inbox-header,\n    .alumni-notifications-pro\n      .alumni-notifications-header\n  ) {\n    border-radius:\n      20px;\n  }\n\n  .alumni-more-vp-hero {\n    padding:\n      25px 18px\n      22px;\n    border-radius:\n      22px;\n  }\n\n  .alumni-more-vp-profile {\n    border-radius:\n      18px;\n  }\n\n  .alumni-more-vp-list {\n    border-radius:\n      18px;\n  }\n}\n\n/* ALUMNI_VISUAL_PASS_2_0 */\n";

if (
  !globals.includes(
    MARKER
  )
) {
  globals =
    globals.trimEnd() +
    "\n\n" +
    extraCss.trim() +
    "\n";
}

if (
  !profileCss.includes(
    `${MARKER}:PROFILE`
  )
) {
  profileCss =
    profileCss.trimEnd() +
    `

/* ${MARKER}:PROFILE */
.alumni-profile-launch-avatar-row,
.alumni-profile-launch-avatar-wrap,
.alumni-profile-launch-avatar {
  overflow: visible;
}

.alumni-profile-launch-avatar-wrap {
  z-index: 12;
}

.alumni-profile-launch-avatar {
  opacity: 1;
  visibility: visible;
}
`;
}

/* ======================================================
   Syntax validation
   ====================================================== */

try {
  const ts =
    require(
      "typescript"
    );

  for (
    const [
      rel,
      content,
    ] of [
      [
        TOPBAR,
        topbar,
      ],
      [
        MORE,
        nextMore,
      ],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        rel,
        content,
        ts.ScriptTarget
          .Latest,
        true,
        ts.ScriptKind
          .TSX
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
  abs(TOPBAR),
  topbar,
  "utf8"
);

fs.writeFileSync(
  abs(MORE),
  nextMore,
  "utf8"
);

fs.writeFileSync(
  abs(PROFILE_CSS),
  profileCss,
  "utf8"
);

fs.writeFileSync(
  abs(GLOBALS),
  globals,
  "utf8"
);

console.log("");
console.log(
  "✅ ALUMNI Visual Pass 2.0 aplicado."
);
console.log(
  "✅ Navbar fija en Perfil."
);
console.log(
  "✅ Foto de perfil siempre visible."
);
console.log(
  "✅ Más separado en Actividad / Soporte y Sistema."
);
console.log(
  "✅ Feed refinado."
);
console.log(
  "✅ Perfil refinado."
);
console.log(
  "✅ Buscar refinado."
);
console.log(
  "✅ Mensajes refinados."
);
console.log(
  "✅ Ajustes refinados."
);
console.log(
  "✅ Eventos refinados."
);
console.log(
  "✅ Comunidades refinadas."
);
console.log(
  "✅ Notificaciones refinadas."
);
console.log(
  "✅ Lenguaje inspirado en Desarrollador."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
