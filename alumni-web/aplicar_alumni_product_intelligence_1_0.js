const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const files = {
  layout:
    "src/app/layout.tsx",
  adminShell:
    "src/components/admin/AdminShell.tsx",
  tracker:
    "src/components/analytics/ProductAnalyticsTracker.tsx",
  page:
    "src/app/admin/intelligence/page.tsx",
  css:
    "src/app/admin/intelligence/product-intelligence.css",
};

function abs(rel) {
  return path.join(ROOT, rel);
}

function fail(message) {
  console.error("❌ " + message);
  process.exit(1);
}

function read(rel) {
  if (!fs.existsSync(abs(rel))) {
    fail(
      `No encontré ${rel}. Ejecutá este parche dentro de alumni-web.`
    );
  }

  return fs
    .readFileSync(abs(rel), "utf8")
    .replace(/\r\n/g, "\n");
}

function write(rel, content) {
  fs.mkdirSync(
    path.dirname(abs(rel)),
    { recursive: true }
  );

  fs.writeFileSync(
    abs(rel),
    content,
    "utf8"
  );
}

function backup(rel, content) {
  const dir =
    abs(".alumni_backups/product-intelligence-1-0");
  const target =
    path.join(dir, rel);

  if (!fs.existsSync(target)) {
    fs.mkdirSync(
      path.dirname(target),
      { recursive: true }
    );
    fs.writeFileSync(
      target,
      content,
      "utf8"
    );
  }
}

function replaceRequired(
  source,
  before,
  after,
  label
) {
  if (source.includes(after)) {
    return source;
  }

  if (!source.includes(before)) {
    fail(
      `No encontré ${label}. No escribí cambios.`
    );
  }

  return source.replace(
    before,
    after
  );
}

if (!fs.existsSync(abs("package.json"))) {
  fail(
    "Este script debe ejecutarse desde alumni-web."
  );
}

let layout =
  read(files.layout);
let adminShell =
  read(files.adminShell);

backup(
  files.layout,
  layout
);
backup(
  files.adminShell,
  adminShell
);

/* tracker import */
if (
  !layout.includes(
    'import ProductAnalyticsTracker from "@/components/analytics/ProductAnalyticsTracker";'
  )
) {
  layout =
    replaceRequired(
      layout,
      'import PWAProBootstrap from "@/components/pwa/PWAProBootstrap";',
      'import PWAProBootstrap from "@/components/pwa/PWAProBootstrap";\nimport ProductAnalyticsTracker from "@/components/analytics/ProductAnalyticsTracker";',
      "import PWAProBootstrap"
    );
}

/* tracker mount under AuthProvider */
if (
  !layout.includes(
    "<ProductAnalyticsTracker />"
  )
) {
  layout =
    replaceRequired(
      layout,
      `            <GlobalPullToRefresh />
            <PWAProBootstrap />`,
      `            <GlobalPullToRefresh />
            <PWAProBootstrap />
            <ProductAnalyticsTracker />`,
      "bootstrap del layout"
    );
}

/* admin icon */
if (
  !adminShell.includes(
    "  Activity,\n"
  )
) {
  adminShell =
    replaceRequired(
      adminShell,
      `import {
  BarChart3,`,
      `import {
  Activity,
  BarChart3,`,
      "icons AdminShell"
    );
}

/* permission */
if (
  !adminShell.includes(
    '"/admin/intelligence"'
  )
) {
  adminShell =
    replaceRequired(
      adminShell,
      `  if (
    pathname.startsWith(
      "/admin/stats"
    )
  ) {
    return "view_stats";
  }`,
      `  if (
    pathname.startsWith(
      "/admin/intelligence"
    ) ||
    pathname.startsWith(
      "/admin/stats"
    )
  ) {
    return "view_stats";
  }`,
      "permiso stats AdminShell"
    );
}

/* nav item */
if (
  !adminShell.includes(
    'href: "/admin/intelligence"'
  )
) {
  adminShell =
    replaceRequired(
      adminShell,
      `    {
      href: "/admin/stats",
      label: "Estadísticas",
      icon: BarChart3,
      visible: can("view_stats"),
    },`,
      `    {
      href: "/admin/intelligence",
      label: "Producto",
      icon: Activity,
      visible: can("view_stats"),
    },
    {
      href: "/admin/stats",
      label: "Estadísticas",
      icon: BarChart3,
      visible: can("view_stats"),
    },`,
      "link Estadísticas AdminShell"
    );
}

if (
  !layout.includes(
    "ALUMNI_PRODUCT_INTELLIGENCE_1_0"
  )
) {
  layout +=
    "\n/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:ROOT */\n";
}

if (
  !adminShell.includes(
    "ALUMNI_PRODUCT_INTELLIGENCE_1_0"
  )
) {
  adminShell +=
    "\n/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:ADMIN_SHELL */\n";
}

const tracker =
  "\"use client\";\n\nimport {\n  useEffect,\n  useRef,\n} from \"react\";\nimport {\n  usePathname,\n} from \"next/navigation\";\nimport {\n  useAuth,\n} from \"@/components/auth/AuthProvider\";\nimport {\n  supabase,\n} from \"@/lib/supabase\";\n\nconst SESSION_KEY =\n  \"alumni:product-intelligence:session:v1\";\nconst SESSION_STARTED_KEY =\n  \"alumni:product-intelligence:started:v1\";\n\nconst EXCLUDED_PREFIXES = [\n  \"/admin\",\n  \"/login\",\n  \"/register\",\n  \"/forgot-password\",\n  \"/reset-password\",\n  \"/mfa\",\n];\n\nfunction makeUuid() {\n  if (\n    typeof crypto !== \"undefined\" &&\n    typeof crypto.randomUUID === \"function\"\n  ) {\n    return crypto.randomUUID();\n  }\n\n  const bytes =\n    new Uint8Array(16);\n\n  crypto.getRandomValues(bytes);\n\n  bytes[6] =\n    (bytes[6] & 0x0f) | 0x40;\n  bytes[8] =\n    (bytes[8] & 0x3f) | 0x80;\n\n  const value =\n    Array.from(bytes)\n      .map((item) =>\n        item\n          .toString(16)\n          .padStart(2, \"0\")\n      )\n      .join(\"\");\n\n  return [\n    value.slice(0, 8),\n    value.slice(8, 12),\n    value.slice(12, 16),\n    value.slice(16, 20),\n    value.slice(20),\n  ].join(\"-\");\n}\n\nfunction sessionId() {\n  if (\n    typeof window === \"undefined\"\n  ) {\n    return null;\n  }\n\n  try {\n    const existing =\n      window.sessionStorage.getItem(\n        SESSION_KEY\n      );\n\n    if (existing) {\n      return existing;\n    }\n\n    const created =\n      makeUuid();\n\n    window.sessionStorage.setItem(\n      SESSION_KEY,\n      created\n    );\n\n    return created;\n  } catch {\n    return makeUuid();\n  }\n}\n\nfunction normalizeRoute(\n  pathname: string\n) {\n  const clean =\n    pathname\n      .split(\"?\")[0]\n      .replace(/\\/+$/, \"\") ||\n    \"/\";\n\n  const parts =\n    clean.split(\"/\");\n\n  if (\n    parts[1] === \"events\" &&\n    parts.length >= 3\n  ) {\n    return \"/events/[id]\";\n  }\n\n  if (\n    parts[1] === \"community\" &&\n    parts.length >= 3\n  ) {\n    return \"/community/[slug]\";\n  }\n\n  if (\n    parts[1] === \"messages\" &&\n    parts.length >= 3\n  ) {\n    return \"/messages/[username]\";\n  }\n\n  if (\n    parts[1] === \"u\" &&\n    parts.length >= 3\n  ) {\n    return \"/u/[username]\";\n  }\n\n  return clean;\n}\n\nfunction shouldTrack(\n  pathname: string\n) {\n  return !EXCLUDED_PREFIXES.some(\n    (prefix) =>\n      pathname === prefix ||\n      pathname.startsWith(\n        `${prefix}/`\n      )\n  );\n}\n\nfunction displayMode() {\n  if (\n    typeof window === \"undefined\"\n  ) {\n    return \"unknown\";\n  }\n\n  return window.matchMedia(\n    \"(display-mode: standalone)\"\n  ).matches\n    ? \"standalone\"\n    : \"web\";\n}\n\nfunction widthBucket() {\n  if (\n    typeof window === \"undefined\"\n  ) {\n    return \"unknown\";\n  }\n\n  const width =\n    window.innerWidth;\n\n  if (width <= 374) {\n    return \"small_phone\";\n  }\n\n  if (width <= 430) {\n    return \"phone\";\n  }\n\n  if (width <= 768) {\n    return \"tablet\";\n  }\n\n  return \"desktop\";\n}\n\nexport default function ProductAnalyticsTracker() {\n  const pathname =\n    usePathname();\n\n  const {\n    user,\n    loading,\n  } = useAuth();\n\n  const previousRef =\n    useRef(\"\");\n\n  useEffect(() => {\n    if (\n      loading ||\n      !user?.id ||\n      !pathname ||\n      !shouldTrack(pathname)\n    ) {\n      return;\n    }\n\n    const route =\n      normalizeRoute(pathname);\n\n    const key =\n      `${user.id}:${route}`;\n\n    if (\n      previousRef.current === key\n    ) {\n      return;\n    }\n\n    previousRef.current = key;\n\n    const id =\n      sessionId();\n\n    if (!id) {\n      return;\n    }\n\n    const properties = {\n      display_mode:\n        displayMode(),\n      viewport:\n        widthBucket(),\n    };\n\n    void supabase.rpc(\n      \"alumni_track_product_event_v1\",\n      {\n        p_event_name:\n          \"page_view\",\n        p_route:\n          route,\n        p_session_id:\n          id,\n        p_properties:\n          properties,\n      }\n    );\n\n    try {\n      const started =\n        window.sessionStorage.getItem(\n          SESSION_STARTED_KEY\n        );\n\n      if (!started) {\n        window.sessionStorage.setItem(\n          SESSION_STARTED_KEY,\n          \"1\"\n        );\n\n        void supabase.rpc(\n          \"alumni_track_product_event_v1\",\n          {\n            p_event_name:\n              \"session_start\",\n            p_route:\n              route,\n            p_session_id:\n              id,\n            p_properties:\n              properties,\n          }\n        );\n      }\n    } catch {\n      // sessionStorage unavailable:\n      // page_view is still enough.\n    }\n  }, [\n    loading,\n    pathname,\n    user?.id,\n  ]);\n\n  return null;\n}\n\n/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:TRACKER */\n";
const page =
  "\"use client\";\n\nimport {\n  motion,\n  useReducedMotion,\n} from \"framer-motion\";\nimport {\n  Activity,\n  ArrowDownRight,\n  ArrowRight,\n  Clock3,\n  Eye,\n  Loader2,\n  MessageCircle,\n  MousePointer2,\n  RefreshCw,\n  Repeat2,\n  Send,\n  Sparkles,\n  UserCheck,\n  Users,\n} from \"lucide-react\";\nimport {\n  useEffect,\n  useMemo,\n  useState,\n} from \"react\";\nimport AdminShell from \"@/components/admin/AdminShell\";\nimport {\n  useAdminAccess,\n} from \"@/hooks/useAdminAccess\";\nimport {\n  supabase,\n} from \"@/lib/supabase\";\nimport \"./product-intelligence.css\";\n\ntype RetentionItem = {\n  eligible: number;\n  returned: number;\n  rate: number | null;\n};\n\ntype IntelligencePayload = {\n  generated_at: string;\n  days: number;\n  tracking_since: string | null;\n  active_users: {\n    dau: number;\n    wau: number;\n    mau: number;\n  };\n  funnel: {\n    registered: number;\n    profile_completed: number;\n    followed_someone: number;\n    sent_message: number;\n    published_post: number;\n  };\n  retention: {\n    d1: RetentionItem;\n    d7: RetentionItem;\n    d30: RetentionItem;\n  };\n  publisher_pct_30:\n    number | null;\n  publishers_30: number;\n  avg_first_connection_minutes:\n    number | null;\n  top_routes: Array<{\n    route: string;\n    views: number;\n    users: number;\n    sessions: number;\n  }>;\n  exit_routes: Array<{\n    route: string;\n    sessions: number;\n    exits: number;\n    exit_rate: number | null;\n  }>;\n  daily: Array<{\n    day: string;\n    active_users: number;\n    registrations: number;\n    posts: number;\n  }>;\n};\n\nfunction pct(\n  value: number,\n  total: number\n) {\n  if (!total) {\n    return \"—\";\n  }\n\n  return `${Math.round(\n    (value / total) * 100\n  )}%`;\n}\n\nfunction timeLabel(\n  minutes: number | null\n) {\n  if (\n    minutes === null ||\n    !Number.isFinite(minutes)\n  ) {\n    return \"—\";\n  }\n\n  if (minutes < 60) {\n    return `${Math.round(\n      minutes\n    )} min`;\n  }\n\n  if (minutes < 1440) {\n    return `${(\n      minutes / 60\n    ).toFixed(1)} h`;\n  }\n\n  return `${(\n    minutes / 1440\n  ).toFixed(1)} d`;\n}\n\nfunction routeLabel(\n  route: string\n) {\n  const labels: Record<\n    string,\n    string\n  > = {\n    \"/feed\": \"Feed\",\n    \"/explore\": \"Buscar\",\n    \"/messages\": \"Mensajes\",\n    \"/messages/[username]\":\n      \"Conversación\",\n    \"/profile\": \"Perfil\",\n    \"/more\": \"Más\",\n    \"/events\": \"Eventos\",\n    \"/events/[id]\":\n      \"Detalle de evento\",\n    \"/community\":\n      \"Comunidades\",\n    \"/community/[slug]\":\n      \"Detalle de comunidad\",\n    \"/notifications\":\n      \"Notificaciones\",\n    \"/settings\":\n      \"Configuración\",\n    \"/feedback\":\n      \"Feedback\",\n    \"/passport\":\n      \"Pasaporte\",\n  };\n\n  return (\n    labels[route] ||\n    route\n  );\n}\n\nfunction Metric({\n  label,\n  value,\n  detail,\n  icon: Icon,\n}: {\n  label: string;\n  value: string | number;\n  detail?: string;\n  icon: React.ComponentType<{\n    size?: number;\n  }>;\n}) {\n  return (\n    <div className=\"alumni-pi-metric\">\n      <span className=\"alumni-pi-metric-icon\">\n        <Icon size={15} />\n      </span>\n\n      <div>\n        <span>{label}</span>\n        <strong>\n          {value}\n        </strong>\n        {detail ? (\n          <small>\n            {detail}\n          </small>\n        ) : null}\n      </div>\n    </div>\n  );\n}\n\nexport default function ProductIntelligencePage() {\n  const reduceMotion =\n    useReducedMotion();\n\n  const {\n    can,\n    loading: accessLoading,\n  } = useAdminAccess();\n\n  const [data, setData] =\n    useState<IntelligencePayload | null>(\n      null\n    );\n\n  const [loading, setLoading] =\n    useState(true);\n\n  const [error, setError] =\n    useState(\"\");\n\n  async function load() {\n    if (\n      accessLoading ||\n      !can(\"view_stats\")\n    ) {\n      return;\n    }\n\n    setLoading(true);\n    setError(\"\");\n\n    const result =\n      await supabase.rpc(\n        \"alumni_product_intelligence_v1\",\n        {\n          p_days: 30,\n        }\n      );\n\n    if (result.error) {\n      console.error(\n        \"[Product Intelligence]\",\n        result.error\n      );\n\n      setError(\n        \"No se pudieron cargar las métricas.\"\n      );\n      setLoading(false);\n      return;\n    }\n\n    setData(\n      result.data as IntelligencePayload\n    );\n    setLoading(false);\n  }\n\n  useEffect(() => {\n    if (\n      !accessLoading &&\n      can(\"view_stats\")\n    ) {\n      void load();\n    } else if (\n      !accessLoading\n    ) {\n      setLoading(false);\n    }\n  }, [\n    accessLoading,\n  ]);\n\n  const maxDaily =\n    useMemo(\n      () =>\n        Math.max(\n          1,\n          ...(data?.daily || []).map(\n            (item) =>\n              item.active_users\n          )\n        ),\n      [data]\n    );\n\n  const registered =\n    data?.funnel.registered ||\n    0;\n\n  const funnel = data\n    ? [\n        {\n          label:\n            \"Registrados\",\n          value:\n            data.funnel\n              .registered,\n          icon: Users,\n        },\n        {\n          label:\n            \"Perfil listo\",\n          value:\n            data.funnel\n              .profile_completed,\n          icon: UserCheck,\n        },\n        {\n          label:\n            \"Primera conexión\",\n          value:\n            data.funnel\n              .followed_someone,\n          icon: Sparkles,\n        },\n        {\n          label:\n            \"Primer mensaje\",\n          value:\n            data.funnel\n              .sent_message,\n          icon: Send,\n        },\n        {\n          label:\n            \"Publicó\",\n          value:\n            data.funnel\n              .published_post,\n          icon: MessageCircle,\n        },\n      ]\n    : [];\n\n  const trackingDate =\n    data?.tracking_since\n      ? new Date(\n          data.tracking_since\n        )\n      : null;\n\n  const trackingDays =\n    trackingDate\n      ? Math.max(\n          0,\n          Math.floor(\n            (Date.now() -\n              trackingDate.getTime()) /\n              86400000\n          )\n        )\n      : 0;\n\n  return (\n    <AdminShell\n      title=\"Producto\"\n      description=\"Uso real, activación y retención.\"\n    >\n      <main\n        className=\"alumni-pi\"\n        data-alumni-motion-ignore=\"true\"\n      >\n        <motion.div\n          className=\"alumni-pi-top\"\n          initial={\n            reduceMotion\n              ? false\n              : {\n                  opacity: 0,\n                  y: 6,\n                }\n          }\n          animate={{\n            opacity: 1,\n            y: 0,\n          }}\n          transition={{\n            duration: .34,\n          }}\n        >\n          <div>\n            <span>\n              Últimos 30 días\n            </span>\n\n            {data?.generated_at ? (\n              <small>\n                Actualizado{\" \"}\n                {new Date(\n                  data.generated_at\n                ).toLocaleTimeString(\n                  \"es-SV\",\n                  {\n                    hour: \"2-digit\",\n                    minute:\n                      \"2-digit\",\n                  }\n                )}\n              </small>\n            ) : null}\n          </div>\n\n          <button\n            type=\"button\"\n            onClick={() =>\n              void load()\n            }\n            disabled={\n              loading ||\n              !can(\"view_stats\")\n            }\n            aria-label=\"Actualizar\"\n          >\n            <RefreshCw\n              size={16}\n              className={\n                loading\n                  ? \"animate-spin\"\n                  : \"\"\n              }\n            />\n          </button>\n        </motion.div>\n\n        {loading ? (\n          <div className=\"alumni-pi-loading\">\n            <Loader2\n              size={20}\n              className=\"animate-spin\"\n            />\n            <span>\n              Calculando…\n            </span>\n          </div>\n        ) : error ? (\n          <div className=\"alumni-pi-empty\">\n            {error}\n          </div>\n        ) : !data ? (\n          <div className=\"alumni-pi-empty\">\n            Sin datos todavía.\n          </div>\n        ) : (\n          <>\n            <section className=\"alumni-pi-metrics\">\n              <Metric\n                label=\"DAU\"\n                value={\n                  data.active_users.dau\n                }\n                detail=\"24 horas\"\n                icon={Activity}\n              />\n\n              <Metric\n                label=\"WAU\"\n                value={\n                  data.active_users.wau\n                }\n                detail=\"7 días\"\n                icon={Repeat2}\n              />\n\n              <Metric\n                label=\"MAU\"\n                value={\n                  data.active_users.mau\n                }\n                detail=\"30 días\"\n                icon={Users}\n              />\n\n              <Metric\n                label=\"Publican\"\n                value={\n                  data.publisher_pct_30 ===\n                  null\n                    ? \"—\"\n                    : `${data.publisher_pct_30}%`\n                }\n                detail={`${data.publishers_30} usuarios`}\n                icon={MousePointer2}\n              />\n\n              <Metric\n                label=\"1ª conexión\"\n                value={timeLabel(\n                  data.avg_first_connection_minutes\n                )}\n                detail=\"tiempo promedio\"\n                icon={Clock3}\n              />\n            </section>\n\n            <section className=\"alumni-pi-section\">\n              <header>\n                <div>\n                  <span>\n                    Activación\n                  </span>\n                  <h2>\n                    Del registro al uso\n                  </h2>\n                </div>\n              </header>\n\n              <div className=\"alumni-pi-funnel\">\n                {funnel.map(\n                  (\n                    item,\n                    index\n                  ) => {\n                    const Icon =\n                      item.icon;\n\n                    return (\n                      <motion.div\n                        key={\n                          item.label\n                        }\n                        className=\"alumni-pi-funnel-row\"\n                        initial={\n                          reduceMotion\n                            ? false\n                            : {\n                                opacity:\n                                  0,\n                                x: 5,\n                              }\n                        }\n                        animate={{\n                          opacity: 1,\n                          x: 0,\n                        }}\n                        transition={{\n                          duration:\n                            .28,\n                          delay:\n                            index *\n                            .035,\n                        }}\n                      >\n                        <span className=\"alumni-pi-funnel-icon\">\n                          <Icon\n                            size={\n                              15\n                            }\n                          />\n                        </span>\n\n                        <div>\n                          <strong>\n                            {\n                              item.label\n                            }\n                          </strong>\n                          <small>\n                            {index ===\n                            0\n                              ? \"Base\"\n                              : pct(\n                                  item.value,\n                                  registered\n                                )}\n                          </small>\n                        </div>\n\n                        <b>\n                          {\n                            item.value\n                          }\n                        </b>\n\n                        {index <\n                        funnel.length -\n                          1 ? (\n                          <ArrowRight\n                            size={\n                              13\n                            }\n                          />\n                        ) : null}\n                      </motion.div>\n                    );\n                  }\n                )}\n              </div>\n            </section>\n\n            <section className=\"alumni-pi-section\">\n              <header>\n                <div>\n                  <span>\n                    Retención\n                  </span>\n                  <h2>\n                    ¿Regresan?\n                  </h2>\n                </div>\n              </header>\n\n              <div className=\"alumni-pi-retention\">\n                {(\n                  [\n                    [\n                      \"D1\",\n                      data.retention\n                        .d1,\n                    ],\n                    [\n                      \"D7\",\n                      data.retention\n                        .d7,\n                    ],\n                    [\n                      \"D30\",\n                      data.retention\n                        .d30,\n                    ],\n                  ] as const\n                ).map(\n                  ([\n                    label,\n                    item,\n                  ]) => (\n                    <div\n                      key={label}\n                      className=\"alumni-pi-retention-item\"\n                    >\n                      <span>\n                        {label}\n                      </span>\n                      <strong>\n                        {item.rate ===\n                        null\n                          ? \"—\"\n                          : `${item.rate}%`}\n                      </strong>\n                      <small>\n                        {\n                          item.returned\n                        }\n                        /\n                        {\n                          item.eligible\n                        }\n                      </small>\n                    </div>\n                  )\n                )}\n              </div>\n\n              {trackingDays <\n              30 ? (\n                <p className=\"alumni-pi-note\">\n                  La retención\n                  comienza a ser\n                  confiable conforme\n                  acumulemos días de\n                  tracking.\n                </p>\n              ) : null}\n            </section>\n\n            <section className=\"alumni-pi-section\">\n              <header>\n                <div>\n                  <span>\n                    Actividad\n                  </span>\n                  <h2>\n                    Usuarios por día\n                  </h2>\n                </div>\n              </header>\n\n              <div className=\"alumni-pi-chart\">\n                {data.daily.map(\n                  (item) => {\n                    const height =\n                      Math.max(\n                        5,\n                        Math.round(\n                          (item.active_users /\n                            maxDaily) *\n                            100\n                        )\n                      );\n\n                    return (\n                      <div\n                        key={\n                          item.day\n                        }\n                        className=\"alumni-pi-bar-wrap\"\n                        title={`${item.day}: ${item.active_users}`}\n                      >\n                        <motion.span\n                          className=\"alumni-pi-bar\"\n                          initial={\n                            reduceMotion\n                              ? false\n                              : {\n                                  height:\n                                    \"5%\",\n                                }\n                          }\n                          animate={{\n                            height:\n                              `${height}%`,\n                          }}\n                          transition={{\n                            duration:\n                              .38,\n                            ease:\n                              \"easeOut\",\n                          }}\n                        />\n                      </div>\n                    );\n                  }\n                )}\n              </div>\n            </section>\n\n            <section className=\"alumni-pi-section alumni-pi-route-grid\">\n              <div>\n                <header>\n                  <div>\n                    <span>\n                      Pantallas\n                    </span>\n                    <h2>\n                      Más usadas\n                    </h2>\n                  </div>\n                </header>\n\n                <div className=\"alumni-pi-routes\">\n                  {data.top_routes\n                    .slice(0, 8)\n                    .map(\n                      (\n                        item,\n                        index\n                      ) => (\n                        <div\n                          key={\n                            item.route\n                          }\n                          className=\"alumni-pi-route\"\n                        >\n                          <b>\n                            {index +\n                              1}\n                          </b>\n                          <div>\n                            <strong>\n                              {routeLabel(\n                                item.route\n                              )}\n                            </strong>\n                            <small>\n                              {\n                                item.users\n                              }{\" \"}\n                              usuarios\n                            </small>\n                          </div>\n                          <span>\n                            {\n                              item.views\n                            }\n                          </span>\n                        </div>\n                      )\n                    )}\n\n                  {!data.top_routes\n                    .length ? (\n                    <p className=\"alumni-pi-list-empty\">\n                      Empezará a\n                      llenarse desde\n                      ahora.\n                    </p>\n                  ) : null}\n                </div>\n              </div>\n\n              <div>\n                <header>\n                  <div>\n                    <span>\n                      Salidas\n                    </span>\n                    <h2>\n                      Última pantalla\n                    </h2>\n                  </div>\n                </header>\n\n                <div className=\"alumni-pi-routes\">\n                  {data.exit_routes\n                    .slice(0, 8)\n                    .map(\n                      (item) => (\n                        <div\n                          key={\n                            item.route\n                          }\n                          className=\"alumni-pi-route\"\n                        >\n                          <span className=\"alumni-pi-exit-icon\">\n                            <ArrowDownRight\n                              size={\n                                14\n                              }\n                            />\n                          </span>\n                          <div>\n                            <strong>\n                              {routeLabel(\n                                item.route\n                              )}\n                            </strong>\n                            <small>\n                              {\n                                item.sessions\n                              }{\" \"}\n                              sesiones\n                            </small>\n                          </div>\n                          <span>\n                            {\n                              item.exits\n                            }\n                          </span>\n                        </div>\n                      )\n                    )}\n\n                  {!data.exit_routes\n                    .length ? (\n                    <p className=\"alumni-pi-list-empty\">\n                      Empezará a\n                      llenarse desde\n                      ahora.\n                    </p>\n                  ) : null}\n                </div>\n              </div>\n            </section>\n\n            <div className=\"alumni-pi-foot\">\n              <Eye size={13} />\n              <span>\n                Solo métricas\n                agregadas. No se\n                muestran conversaciones\n                ni contenido privado.\n              </span>\n            </div>\n          </>\n        )}\n      </main>\n    </AdminShell>\n  );\n}\n\n/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:ADMIN */\n";
const css =
  "/*\n * ALUMNI_PRODUCT_INTELLIGENCE_1_0\n * Admin product intelligence.\n */\n\n.alumni-pi {\n  width: 100%;\n  max-width: 100%;\n  min-width: 0;\n  padding-bottom: 42px;\n}\n\n.alumni-pi-top {\n  display: flex;\n  min-height: 45px;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  padding: 0 0 12px;\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-top > div {\n  display: grid;\n  gap: 3px;\n}\n\n.alumni-pi-top span {\n  color:\n    var(--app-text-soft);\n  font-size: 11px;\n  font-weight: 850;\n}\n\n.alumni-pi-top small {\n  color:\n    var(--app-muted-3);\n  font-size: 9px;\n}\n\n.alumni-pi-top button {\n  display: grid;\n  width: 38px;\n  height: 38px;\n  place-items: center;\n  border:\n    1px solid\n    var(--app-border);\n  border-radius: 13px;\n  background:\n    var(--app-soft);\n  color:\n    var(--app-text-soft);\n  transition:\n    transform 150ms\n      cubic-bezier(.2,.8,.2,1),\n    background-color 150ms ease;\n}\n\n.alumni-pi-top button:active {\n  transform: scale(.92);\n  background:\n    var(--app-soft-strong);\n}\n\n.alumni-pi-loading,\n.alumni-pi-empty {\n  display: flex;\n  min-height: 280px;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  color:\n    var(--app-muted-2);\n  font-size: 12px;\n}\n\n.alumni-pi-metrics {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      5,\n      minmax(0,1fr)\n    );\n  gap: 0;\n  margin-top: 19px;\n  border-top:\n    1px solid\n    var(--app-border);\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-metric {\n  display: flex;\n  min-width: 0;\n  gap: 10px;\n  padding:\n    16px 12px;\n  border-right:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-metric:last-child {\n  border-right: 0;\n}\n\n.alumni-pi-metric-icon {\n  display: grid;\n  width: 31px;\n  height: 31px;\n  flex: 0 0 31px;\n  place-items: center;\n  border-radius: 10px;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 8%,\n      transparent\n    );\n  color:\n    var(--app-accent);\n}\n\n.alumni-pi-metric > div {\n  min-width: 0;\n}\n\n.alumni-pi-metric\ndiv > span,\n.alumni-pi-section\nheader span {\n  display: block;\n  color:\n    var(--app-muted-3);\n  font-size: 8px;\n  font-weight: 900;\n  letter-spacing: .12em;\n  text-transform: uppercase;\n}\n\n.alumni-pi-metric strong {\n  display: block;\n  margin-top: 4px;\n  color:\n    var(--app-text);\n  font-size: 20px;\n  font-weight: 950;\n  letter-spacing: -.04em;\n}\n\n.alumni-pi-metric small {\n  display: block;\n  margin-top: 2px;\n  overflow: hidden;\n  color:\n    var(--app-muted-2);\n  font-size: 8.5px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-pi-section {\n  padding: 25px 0 4px;\n}\n\n.alumni-pi-section\nheader {\n  display: flex;\n  align-items: flex-end;\n  justify-content: space-between;\n  gap: 14px;\n  margin-bottom: 14px;\n}\n\n.alumni-pi-section\nheader h2 {\n  margin: 4px 0 0;\n  color:\n    var(--app-text);\n  font-size: 17px;\n  font-weight: 920;\n  letter-spacing: -.03em;\n}\n\n.alumni-pi-funnel {\n  border-top:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-funnel-row {\n  display: grid;\n  min-width: 0;\n  min-height: 57px;\n  grid-template-columns:\n    34px\n    minmax(0,1fr)\n    auto\n    18px;\n  align-items: center;\n  gap: 9px;\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-funnel-icon {\n  display: grid;\n  width: 30px;\n  height: 30px;\n  place-items: center;\n  border-radius: 10px;\n  background:\n    var(--app-soft);\n  color:\n    var(--app-accent);\n}\n\n.alumni-pi-funnel-row > div {\n  min-width: 0;\n}\n\n.alumni-pi-funnel-row\ndiv strong {\n  display: block;\n  color:\n    var(--app-text-soft);\n  font-size: 11px;\n  font-weight: 820;\n}\n\n.alumni-pi-funnel-row\ndiv small {\n  display: block;\n  margin-top: 2px;\n  color:\n    var(--app-muted-3);\n  font-size: 8px;\n}\n\n.alumni-pi-funnel-row > b {\n  color:\n    var(--app-text);\n  font-size: 16px;\n  font-weight: 950;\n}\n\n.alumni-pi-funnel-row > svg {\n  color:\n    var(--app-muted-3);\n}\n\n.alumni-pi-retention {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      3,\n      minmax(0,1fr)\n    );\n  border-top:\n    1px solid\n    var(--app-border);\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-retention-item {\n  padding:\n    16px 13px;\n  border-right:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-retention-item:last-child {\n  border-right: 0;\n}\n\n.alumni-pi-retention-item span {\n  display: block;\n  color:\n    var(--app-muted-3);\n  font-size: 8px;\n  font-weight: 900;\n  letter-spacing: .1em;\n}\n\n.alumni-pi-retention-item strong {\n  display: block;\n  margin-top: 4px;\n  color:\n    var(--app-text);\n  font-size: 23px;\n  font-weight: 950;\n  letter-spacing: -.045em;\n}\n\n.alumni-pi-retention-item small {\n  display: block;\n  margin-top: 2px;\n  color:\n    var(--app-muted-2);\n  font-size: 8px;\n}\n\n.alumni-pi-note {\n  margin: 9px 0 0;\n  color:\n    var(--app-muted-3);\n  font-size: 9px;\n  line-height: 1.45;\n}\n\n.alumni-pi-chart {\n  display: flex;\n  height: 104px;\n  align-items: flex-end;\n  gap: 3px;\n  padding:\n    8px 0 0;\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-bar-wrap {\n  display: flex;\n  height: 100%;\n  flex: 1 1 0;\n  align-items: flex-end;\n  justify-content: center;\n}\n\n.alumni-pi-bar {\n  display: block;\n  width: 100%;\n  max-width: 12px;\n  min-height: 3px;\n  border-radius:\n    3px 3px 0 0;\n  background:\n    color-mix(\n      in srgb,\n      var(--app-accent) 66%,\n      var(--app-text)\n    );\n  opacity: .72;\n}\n\n.alumni-pi-route-grid {\n  display: grid;\n  grid-template-columns:\n    repeat(\n      2,\n      minmax(0,1fr)\n    );\n  gap: 30px;\n}\n\n.alumni-pi-routes {\n  border-top:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-route {\n  display: grid;\n  min-height: 54px;\n  grid-template-columns:\n    25px\n    minmax(0,1fr)\n    auto;\n  align-items: center;\n  gap: 8px;\n  border-bottom:\n    1px solid\n    var(--app-border);\n}\n\n.alumni-pi-route > b {\n  color:\n    var(--app-muted-3);\n  font-size: 8px;\n  font-weight: 900;\n}\n\n.alumni-pi-route > div {\n  min-width: 0;\n}\n\n.alumni-pi-route\ndiv strong {\n  display: block;\n  overflow: hidden;\n  color:\n    var(--app-text-soft);\n  font-size: 10.5px;\n  font-weight: 820;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.alumni-pi-route\ndiv small {\n  display: block;\n  margin-top: 2px;\n  color:\n    var(--app-muted-3);\n  font-size: 8px;\n}\n\n.alumni-pi-route > span {\n  color:\n    var(--app-text);\n  font-size: 11px;\n  font-weight: 900;\n}\n\n.alumni-pi-exit-icon {\n  display: grid;\n  place-items: center;\n  color:\n    var(--app-muted-3) !important;\n}\n\n.alumni-pi-list-empty {\n  margin:\n    16px 0;\n  color:\n    var(--app-muted-3);\n  font-size: 9px;\n}\n\n.alumni-pi-foot {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  margin-top: 28px;\n  padding-top: 14px;\n  border-top:\n    1px solid\n    var(--app-border);\n  color:\n    var(--app-muted-3);\n  font-size: 8.5px;\n}\n\n@media (max-width: 720px) {\n  .alumni-pi-metrics {\n    grid-template-columns:\n      repeat(\n        2,\n        minmax(0,1fr)\n      );\n  }\n\n  .alumni-pi-metric {\n    border-bottom:\n      1px solid\n      var(--app-border);\n  }\n\n  .alumni-pi-metric:nth-child(2n) {\n    border-right: 0;\n  }\n\n  .alumni-pi-metric:last-child {\n    grid-column:\n      1 / -1;\n    border-bottom: 0;\n  }\n\n  .alumni-pi-route-grid {\n    grid-template-columns:\n      1fr;\n    gap: 4px;\n  }\n}\n\n@media (max-width: 430px) {\n  .alumni-pi-metric {\n    padding:\n      14px 9px;\n  }\n\n  .alumni-pi-metric-icon {\n    width: 28px;\n    height: 28px;\n    flex-basis: 28px;\n  }\n\n  .alumni-pi-metric strong {\n    font-size: 18px;\n  }\n\n  .alumni-pi-funnel-row {\n    grid-template-columns:\n      31px\n      minmax(0,1fr)\n      auto\n      13px;\n  }\n\n  .alumni-pi-retention-item {\n    padding:\n      14px 9px;\n  }\n\n  .alumni-pi-retention-item strong {\n    font-size: 20px;\n  }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .alumni-pi *,\n  .alumni-pi *::before,\n  .alumni-pi *::after {\n    scroll-behavior:\n      auto !important;\n    transition-duration:\n      .01ms !important;\n    animation-duration:\n      .01ms !important;\n    animation-iteration-count:\n      1 !important;\n  }\n}\n\n/* ALUMNI_PRODUCT_INTELLIGENCE_1_0 */\n";

/* parse TSX before write */
try {
  const ts =
    require("typescript");

  for (
    const [name, source]
    of [
      [files.layout, layout],
      [files.adminShell, adminShell],
      [files.tracker, tracker],
      [files.page, page],
    ]
  ) {
    const parsed =
      ts.createSourceFile(
        name,
        source,
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
        `${name}: ${ts.flattenDiagnosticMessageText(
          first.messageText,
          "\n"
        )}`
      );
    }
  }

  console.log(
    "✅ Parser TypeScript: Product Intelligence válido"
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

write(
  files.layout,
  layout
);
write(
  files.adminShell,
  adminShell
);
write(
  files.tracker,
  tracker
);
write(
  files.page,
  page
);
write(
  files.css,
  css
);

console.log("");
console.log(
  "✅ ALUMNI Product Intelligence 1.0 aplicado."
);
console.log(
  "✅ Tracking autenticado de page_view/session_start."
);
console.log(
  "✅ Sin query strings ni contenido privado."
);
console.log(
  "✅ Nueva pantalla Admin → Producto."
);
console.log(
  "✅ Funnel, DAU/WAU/MAU, retención, rutas y tiempo a primera conexión."
);
console.log(
  "ℹ️ La migración de Supabase alumni_product_intelligence_1_0 ya fue aplicada al proyecto de producción."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
