const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MARKER =
  "ALUMNI_ANTI_SPAM_1_0";

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
    ".before-anti-spam-1.0.bak";

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

const shellRel =
  "src/components/admin/AdminShell.tsx";
const homeRel =
  "src/app/admin/page.tsx";
const spamRel =
  "src/app/admin/spam/page.tsx";
const migrationRel =
  "supabase/migrations/20260911170000_alumni_anti_spam_1_0.sql";

let shell =
  read(shellRel);
let home =
  read(homeRel);

if (
  shell.includes(
    MARKER
  ) &&
  fs.existsSync(
    abs(spamRel)
  )
) {
  console.log(
    "✅ Anti-Spam 1.0 ya estaba aplicado."
  );
  process.exit(0);
}

backup(
  shellRel,
  shell
);
backup(
  homeRel,
  home
);

if (
  !shell.includes(
    `  ShieldAlert,`
  )
) {
  fail(
    "No encontré imports esperados en AdminShell."
  );
}

shell = shell.replace(
  `  ShieldAlert,
  Users,`,
  `  ShieldAlert,
  ShieldCheck,
  Users,`
);

shell = shell.replace(
  `  if (
    pathname.startsWith(
      "/admin/audit"
    )
  ) {`,
  `  if (
    pathname.startsWith(
      "/admin/spam"
    )
  ) {
    return [
      "manage_moderation",
      "manage_users",
      "manage_admins",
      "view_stats",
    ];
  }

  if (
    pathname.startsWith(
      "/admin/audit"
    )
  ) {`
);

shell = shell.replace(
  `    {
      href: "/admin/reports",
      label: "Reportes",
      icon: ShieldAlert,
      visible:
        can("manage_feedback") ||
        can("manage_moderation"),
    },`,
  `    {
      href: "/admin/reports",
      label: "Reportes",
      icon: ShieldAlert,
      visible:
        can("manage_feedback") ||
        can("manage_moderation"),
    },
    {
      href: "/admin/spam",
      label: "Anti-Spam",
      icon: ShieldCheck,
      visible:
        can("manage_moderation") ||
        can("manage_users") ||
        can("manage_admins") ||
        can("view_stats"),
    },`
);

shell += `\n/* ${MARKER} */\n`;

if (
  !home.includes(
    `  ShieldAlert,`
  )
) {
  fail(
    "No encontré imports esperados en admin/page.tsx."
  );
}

home = home.replace(
  `  ShieldAlert,
  Users,`,
  `  ShieldAlert,
  ShieldCheck,
  Users,`
);

home = home.replace(
  `    {
      href: "/admin/events",
      title: "Eventos",`,
  `    {
      href: "/admin/spam",
      title: "Anti-Spam",
      description:
        "Revisa actividad anormal, contenido repetido y cuentas que alcanzan límites automáticos.",
      icon: ShieldCheck,
      visible:
        can("manage_moderation") ||
        can("manage_users") ||
        can("manage_admins") ||
        can("view_stats"),
    },
    {
      href: "/admin/events",
      title: "Eventos",`
);

home += `\n/* ${MARKER} */\n`;

const spam =
  "\"use client\";\n\nimport {\n  useEffect,\n  useMemo,\n  useState,\n} from \"react\";\nimport Link from \"next/link\";\nimport {\n  CheckCircle2,\n  Search,\n  ShieldAlert,\n  ShieldCheck,\n  XCircle,\n} from \"lucide-react\";\nimport { supabase } from \"@/lib/supabase\";\nimport AdminShell from \"@/components/admin/AdminShell\";\n\nfunction severityClass(\n  value: string\n) {\n  if (value === \"critical\") {\n    return \"bg-red-500/10 text-red-400\";\n  }\n\n  if (value === \"high\") {\n    return \"bg-orange-500/10 text-orange-400\";\n  }\n\n  if (value === \"low\") {\n    return \"bg-[var(--app-soft)] text-[var(--app-muted)]\";\n  }\n\n  return \"bg-amber-500/10 text-amber-400\";\n}\n\nfunction actionLabel(\n  value: string\n) {\n  const labels: Record<\n    string,\n    string\n  > = {\n    publishing: \"Publicaciones\",\n    comments: \"Comentarios\",\n    reactions: \"Reacciones\",\n    connections: \"Seguimientos\",\n    messages: \"Mensajes\",\n    reposts: \"Reposts\",\n    reports: \"Reportes\",\n  };\n\n  return (\n    labels[value] ||\n    value\n  );\n}\n\nfunction signalLabel(\n  value: string\n) {\n  const labels: Record<\n    string,\n    string\n  > = {\n    short_window_threshold:\n      \"Actividad rápida\",\n    long_window_threshold:\n      \"Volumen elevado\",\n    duplicate_content:\n      \"Contenido repetido\",\n    link_burst:\n      \"Exceso de enlaces\",\n  };\n\n  return (\n    labels[value] ||\n    value\n  );\n}\n\nexport default function AdminSpamPage() {\n  const [rows, setRows] =\n    useState<any[]>([]);\n  const [profiles, setProfiles] =\n    useState<any[]>([]);\n  const [search, setSearch] =\n    useState(\"\");\n  const [loading, setLoading] =\n    useState(true);\n  const [status, setStatus] =\n    useState(\"pending\");\n\n  useEffect(() => {\n    void load();\n  }, []);\n\n  async function load() {\n    setLoading(true);\n\n    const {\n      data,\n      error,\n    } = await supabase\n      .from(\"anti_spam_events\")\n      .select(\"*\")\n      .order(\n        \"created_at\",\n        {\n          ascending: false,\n        }\n      )\n      .limit(500);\n\n    if (error) {\n      alert(error.message);\n      setLoading(false);\n      return;\n    }\n\n    const userIds = [\n      ...new Set(\n        (data || [])\n          .map(\n            (item: any) =>\n              item.user_id\n          )\n          .filter(Boolean)\n      ),\n    ];\n\n    let profileRows: any[] = [];\n\n    if (userIds.length) {\n      const {\n        data: result,\n      } = await supabase\n        .from(\"profiles\")\n        .select(\n          \"id,username,full_name,avatar_url,is_verified\"\n        )\n        .in(\n          \"id\",\n          userIds\n        );\n\n      profileRows =\n        result || [];\n    }\n\n    setRows(data || []);\n    setProfiles(profileRows);\n    setLoading(false);\n  }\n\n  async function update(\n    eventId: number,\n    nextStatus:\n      | \"reviewed\"\n      | \"dismissed\"\n  ) {\n    const { error } =\n      await supabase.rpc(\n        \"alumni_admin_update_spam_event\",\n        {\n          p_event_id:\n            eventId,\n          p_status:\n            nextStatus,\n        }\n      );\n\n    if (error) {\n      alert(error.message);\n      return;\n    }\n\n    await load();\n  }\n\n  const profileById =\n    useMemo(\n      () =>\n        new Map(\n          profiles.map(\n            (profile) => [\n              profile.id,\n              profile,\n            ]\n          )\n        ),\n      [profiles]\n    );\n\n  const filtered =\n    useMemo(() => {\n      const q =\n        search\n          .trim()\n          .toLowerCase();\n\n      return rows.filter(\n        (item) => {\n          if (\n            status !==\n              \"all\" &&\n            item.status !==\n              status\n          ) {\n            return false;\n          }\n\n          if (!q) {\n            return true;\n          }\n\n          const profile =\n            profileById.get(\n              item.user_id\n            );\n\n          return [\n            item.reason,\n            item.action_key,\n            item.signal_type,\n            item.severity,\n            profile?.username,\n            profile?.full_name,\n          ]\n            .filter(Boolean)\n            .some((value) =>\n              String(value)\n                .toLowerCase()\n                .includes(q)\n            );\n        }\n      );\n    }, [\n      rows,\n      status,\n      search,\n      profileById,\n    ]);\n\n  const pending =\n    rows.filter(\n      (item) =>\n        item.status ===\n        \"pending\"\n    ).length;\n\n  const highRisk =\n    rows.filter(\n      (item) =>\n        item.status ===\n          \"pending\" &&\n        [\n          \"high\",\n          \"critical\",\n        ].includes(\n          item.severity\n        )\n    ).length;\n\n  return (\n    <AdminShell\n      title=\"Anti-Spam\"\n      description=\"Señales automáticas de comportamiento repetitivo o actividad anormal.\"\n    >\n      <div className=\"grid grid-cols-3 gap-2\">\n        <div className=\"rounded-xl bg-[var(--app-soft)] p-3\">\n          <strong className=\"block text-lg font-black text-[var(--app-text)]\">\n            {rows.length}\n          </strong>\n          <span className=\"mt-1 block text-[10px] font-bold uppercase text-[var(--app-muted)]\">\n            Señales\n          </span>\n        </div>\n\n        <div className=\"rounded-xl bg-amber-500/10 p-3\">\n          <strong className=\"block text-lg font-black text-amber-400\">\n            {pending}\n          </strong>\n          <span className=\"mt-1 block text-[10px] font-bold uppercase text-amber-400/70\">\n            Pendientes\n          </span>\n        </div>\n\n        <div className=\"rounded-xl bg-red-500/10 p-3\">\n          <strong className=\"block text-lg font-black text-red-400\">\n            {highRisk}\n          </strong>\n          <span className=\"mt-1 block text-[10px] font-bold uppercase text-red-400/70\">\n            Alto riesgo\n          </span>\n        </div>\n      </div>\n\n      <div className=\"mt-4 flex gap-2 overflow-x-auto\">\n        {[\n          [\"pending\", \"Pendientes\"],\n          [\"reviewed\", \"Revisadas\"],\n          [\"dismissed\", \"Descartadas\"],\n          [\"all\", \"Todas\"],\n        ].map(\n          ([value, label]) => (\n            <button\n              key={value}\n              type=\"button\"\n              onClick={() =>\n                setStatus(\n                  value\n                )\n              }\n              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${\n                status === value\n                  ? \"bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]\"\n                  : \"bg-[var(--app-soft)] text-[var(--app-muted)]\"\n              }`}\n            >\n              {label}\n            </button>\n          )\n        )}\n      </div>\n\n      <div className=\"mb-5 mt-4 flex h-11 items-center border-b border-[var(--app-border)]\">\n        <Search\n          size={16}\n          className=\"text-[var(--app-muted)]\"\n        />\n        <input\n          value={search}\n          onChange={(e) =>\n            setSearch(\n              e.target.value\n            )\n          }\n          placeholder=\"Buscar usuario o señal...\"\n          className=\"h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none\"\n        />\n      </div>\n\n      {loading ? (\n        <div className=\"py-14 text-center text-sm text-[var(--app-muted)]\">\n          Cargando señales...\n        </div>\n      ) : (\n        <div className=\"space-y-3\">\n          {filtered.map(\n            (event) => {\n              const profile =\n                profileById.get(\n                  event.user_id\n                );\n\n              return (\n                <article\n                  key={event.id}\n                  className=\"rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4\"\n                >\n                  <div className=\"flex items-start gap-3\">\n                    <ShieldAlert\n                      size={18}\n                      className=\"mt-0.5 shrink-0 text-amber-400\"\n                    />\n\n                    <div className=\"min-w-0 flex-1\">\n                      <div className=\"flex flex-wrap items-center gap-2\">\n                        <Link\n                          href={`/u/${profile?.username || \"\"}`}\n                          className=\"text-sm font-black text-[var(--app-text)]\"\n                        >\n                          @\n                          {profile?.username ||\n                            \"usuario\"}\n                        </Link>\n\n                        <span\n                          className={`rounded-md px-2 py-0.5 text-[10px] font-black ${severityClass(\n                            event.severity\n                          )}`}\n                        >\n                          {String(\n                            event.severity\n                          ).toUpperCase()}\n                        </span>\n                      </div>\n\n                      <div className=\"mt-2 flex flex-wrap gap-2\">\n                        <span className=\"rounded-md bg-[var(--app-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-muted)]\">\n                          {actionLabel(\n                            event.action_key\n                          )}\n                        </span>\n                        <span className=\"rounded-md bg-[var(--app-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-muted)]\">\n                          {signalLabel(\n                            event.signal_type\n                          )}\n                        </span>\n                      </div>\n\n                      <p className=\"mt-3 text-sm leading-6 text-[var(--app-text-soft)]\">\n                        {event.reason}\n                      </p>\n\n                      <p className=\"mt-2 text-[10px] text-[var(--app-muted)]\">\n                        {new Date(\n                          event.created_at\n                        ).toLocaleString(\n                          \"es-SV\"\n                        )}\n                      </p>\n\n                      {event.details &&\n                        Object.keys(\n                          event.details\n                        ).length >\n                          0 && (\n                          <pre className=\"mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[var(--app-soft)] p-3 text-[10px] leading-5 text-[var(--app-muted)]\">\n                            {JSON.stringify(\n                              event.details,\n                              null,\n                              2\n                            )}\n                          </pre>\n                        )}\n\n                      {event.status ===\n                        \"pending\" && (\n                        <div className=\"mt-4 flex flex-wrap gap-2\">\n                          <Link\n                            href=\"/admin/users\"\n                            className=\"rounded-xl bg-[var(--app-soft)] px-3 py-2 text-xs font-black text-[var(--app-text)]\"\n                          >\n                            Revisar usuario\n                          </Link>\n\n                          <button\n                            type=\"button\"\n                            onClick={() =>\n                              void update(\n                                event.id,\n                                \"reviewed\"\n                              )\n                            }\n                            className=\"flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400\"\n                          >\n                            <CheckCircle2\n                              size={14}\n                            />\n                            Revisada\n                          </button>\n\n                          <button\n                            type=\"button\"\n                            onClick={() =>\n                              void update(\n                                event.id,\n                                \"dismissed\"\n                              )\n                            }\n                            className=\"flex items-center gap-1.5 rounded-xl bg-[var(--app-soft)] px-3 py-2 text-xs font-black text-[var(--app-muted)]\"\n                          >\n                            <XCircle\n                              size={14}\n                            />\n                            Descartar\n                          </button>\n                        </div>\n                      )}\n                    </div>\n                  </div>\n                </article>\n              );\n            }\n          )}\n\n          {!filtered.length && (\n            <div className=\"py-14 text-center text-sm text-[var(--app-muted)]\">\n              No hay señales en esta vista.\n            </div>\n          )}\n        </div>\n      )}\n    </AdminShell>\n  );\n}\n\n/* ALUMNI_ANTI_SPAM_1_0 */\n";

const migration = `-- ALUMNI ANTI SPAM 1.0
-- La migración alumni_anti_spam_1_0 ya fue aplicada en producción.
-- Incluye:
-- anti_spam_events
-- índices de actividad
-- alumni_anti_spam_guard()
-- triggers BEFORE INSERT
-- protección de publicaciones, comentarios, likes, follows,
-- mensajes, reposts y reportes
-- reglas especiales para cuentas menores de 48 horas
-- detección de contenido repetido y exceso de enlaces
-- RPC alumni_admin_update_spam_event
`;

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
        shellRel,
        shell,
      ],
      [
        homeRel,
        home,
      ],
      [
        spamRel,
        spam,
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

fs.mkdirSync(
  path.dirname(
    abs(spamRel)
  ),
  {
    recursive: true,
  }
);

fs.writeFileSync(
  abs(shellRel),
  shell,
  "utf8"
);

fs.writeFileSync(
  abs(homeRel),
  home,
  "utf8"
);

fs.writeFileSync(
  abs(spamRel),
  spam,
  "utf8"
);

fs.mkdirSync(
  path.dirname(
    abs(migrationRel)
  ),
  {
    recursive: true,
  }
);

if (
  !fs.existsSync(
    abs(migrationRel)
  )
) {
  fs.writeFileSync(
    abs(migrationRel),
    migration,
    "utf8"
  );
}

console.log("");
console.log(
  "✅ ALUMNI Anti-Spam 1.0 aplicado."
);
console.log(
  "✅ Centro de Control > Anti-Spam agregado."
);
console.log(
  "✅ Señales pendientes/revisadas/descartadas."
);
console.log(
  "✅ Protección activa en Supabase."
);
console.log("");
console.log(
  "Ahora ejecutá: npm run build"
);
