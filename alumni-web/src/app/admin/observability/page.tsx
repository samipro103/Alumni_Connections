"use client";

import {
  Activity,
  Bug,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  useAdminAccess,
} from "@/hooks/useAdminAccess";
import {
  supabase,
} from "@/lib/supabase";

type ErrorEvent = {
  id: string;
  created_at: string;
  fingerprint: string;
  kind: string;
  severity: string;
  message: string;
  stack?: string | null;
  route?: string | null;
  source?: string | null;
  app_version?: string | null;
  platform?: string | null;
  browser?: string | null;
  device_type?: string | null;
  user_id?: string | null;
  anonymous_id?: string | null;
};

type SeverityFilter =
  | "all"
  | "warning"
  | "error"
  | "fatal";

type GroupedError = {
  fingerprint: string;
  message: string;
  severity: string;
  route?: string | null;
  kind: string;
  count: number;
  latestAt: string;
  affected: number;
};

function severityRank(
  value: string
) {
  if (value === "fatal") {
    return 3;
  }

  if (value === "error") {
    return 2;
  }

  if (value === "warning") {
    return 1;
  }

  return 0;
}

function severityClass(
  value: string
) {
  if (value === "fatal") {
    return "bg-red-500/10 text-red-400";
  }

  if (value === "warning") {
    return "bg-amber-500/10 text-amber-400";
  }

  return "bg-orange-500/10 text-orange-400";
}

export default function ObservabilityPage() {
  const {
    can,
    loading:
      accessLoading,
  } =
    useAdminAccess();

  const canViewObservability =
    can(
      "manage_feedback"
    );

  const [rows, setRows] =
    useState<
      ErrorEvent[]
    >([]);

  const [loaded, setLoaded] =
    useState(false);

  const [
    loadedAt,
    setLoadedAt,
  ] =
    useState<
      number | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    severityFilter,
    setSeverityFilter,
  ] =
    useState<SeverityFilter>(
      "all"
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const load =
    useCallback(
      async (
        refresh =
          false
      ) => {
        if (
          accessLoading ||
          !canViewObservability
        ) {
          return;
        }

        if (refresh) {
          setRefreshing(
            true
          );
        }

        const {
          data,
          error,
        } =
          await supabase
            .from(
              "app_error_events"
            )
            .select("*")
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            )
            .limit(500);

        if (error) {
          console.error(
            "Observability:",
            error
          );
        } else {
          setRows(
            (data ||
              []) as unknown as
              ErrorEvent[]
          );
          setLoadedAt(
            Date.now()
          );
        }

        setLoaded(
          true
        );
        setRefreshing(
          false
        );
      },
      [
        accessLoading,
        canViewObservability,
      ]
    );

  useEffect(() => {
    if (
      accessLoading ||
      !canViewObservability
    ) {
      return;
    }

    let active =
      true;

    void (async () => {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "app_error_events"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(500);

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Observability:",
          error
        );
      } else {
        setRows(
          (data ||
            []) as unknown as
            ErrorEvent[]
        );
        setLoadedAt(
          Date.now()
        );
      }

      setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, [
    accessLoading,
    canViewObservability,
  ]);

  const loading =
    accessLoading ||
    (
      canViewObservability &&
      !loaded
    );

  const dayAgo =
    loadedAt === null
      ? Number
          .POSITIVE_INFINITY
      : loadedAt -
        86400000;

  const day =
    useMemo(
      () =>
        rows.filter(
          (row) =>
            new Date(
              row.created_at
            ).getTime() >=
            dayAgo
        ),
      [
        rows,
        dayAgo,
      ]
    );

  const unique =
    useMemo(
      () =>
        new Set(
          day.map(
            (row) =>
              row.fingerprint
          )
        ).size,
      [day]
    );

  const fatal =
    useMemo(
      () =>
        day.filter(
          (row) =>
            row.severity ===
            "fatal"
        ).length,
      [day]
    );

  const affected =
    useMemo(
      () =>
        new Set(
          day
            .map(
              (row) =>
                row.user_id ||
                row.anonymous_id
            )
            .filter(Boolean)
        ).size,
      [day]
    );

  const grouped =
    useMemo(() => {
      const map =
        new Map<
          string,
          GroupedError & {
            actors:
              Set<string>;
          }
        >();

      for (
        const row
        of day
      ) {
        const actor =
          row.user_id ||
          row.anonymous_id ||
          "";

        const existing =
          map.get(
            row.fingerprint
          );

        if (existing) {
          existing.count +=
            1;

          if (actor) {
            existing
              .actors
              .add(actor);
          }

          if (
            severityRank(
              row.severity
            ) >
            severityRank(
              existing.severity
            )
          ) {
            existing.severity =
              row.severity;
          }

          continue;
        }

        map.set(
          row.fingerprint,
          {
            fingerprint:
              row.fingerprint,
            message:
              row.message,
            severity:
              row.severity,
            route:
              row.route,
            kind:
              row.kind,
            count: 1,
            latestAt:
              row.created_at,
            affected: 0,
            actors:
              new Set(
                actor
                  ? [actor]
                  : []
              ),
          }
        );
      }

      return [
        ...map.values(),
      ]
        .map(
          ({
            actors,
            ...item
          }) => ({
            ...item,
            affected:
              actors.size,
          })
        )
        .sort(
          (a, b) =>
            b.count -
              a.count ||
            severityRank(
              b.severity
            ) -
              severityRank(
                a.severity
              )
        )
        .slice(
          0,
          8
        );
    }, [day]);

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return rows.filter(
        (row) => {
          if (
            severityFilter !==
              "all" &&
            row.severity !==
              severityFilter
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          return [
            row.message,
            row.route,
            row.kind,
            row.severity,
            row.platform,
            row.browser,
            row.app_version,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q);
        }
      );
    }, [
      rows,
      search,
      severityFilter,
    ]);

  if (
    !accessLoading &&
    !canViewObservability
  ) {
    return (
      <AdminShell
        title="Observabilidad"
        description="Errores automáticos y salud operativa de Alumni."
      >
        <div className="py-16 text-center text-sm text-[var(--app-muted)]">
          No tienes permiso para consultar observabilidad.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Observabilidad"
      description="Errores de producción, frecuencia, impacto, pantalla y dispositivo."
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-[var(--app-muted-2)]">
          {loadedAt
            ? `Actualizado ${new Date(
                loadedAt
              ).toLocaleTimeString(
                "es-SV",
                {
                  hour:
                    "2-digit",
                  minute:
                    "2-digit",
                }
              )}`
            : "Monitoreo de producción"}
        </p>

        <button
          type="button"
          onClick={() =>
            void load(true)
          }
          disabled={
            refreshing ||
            loading
          }
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted-2)] disabled:opacity-50"
          aria-label="Actualizar observabilidad"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {([
          [
            "Últimas 24 h",
            day.length,
            Activity,
          ],
          [
            "Errores distintos",
            unique,
            Bug,
          ],
          [
            "Fatales",
            fatal,
            ShieldAlert,
          ],
          [
            "Afectados",
            affected,
            Users,
          ],
        ] as const).map(
          ([
            label,
            value,
            Icon,
          ]) => (
            <div
              key={String(
                label
              )}
              className="rounded-[18px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
            >
              <Icon
                size={16}
                className="text-[var(--app-accent)]"
              />

              <p className="mt-3 text-2xl font-black text-[var(--app-text)]">
                {String(
                  value
                )}
              </p>

              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--app-muted-3)]">
                {String(
                  label
                )}
              </p>
            </div>
          )
        )}
      </div>

      {grouped.length >
        0 && (
        <section className="mt-8">
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
              Prioridad
            </p>
            <h2 className="mt-1 text-lg font-black text-[var(--app-text)]">
              Errores más repetidos
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--app-muted-2)]">
              Agrupados por fingerprint en las últimas 24 horas.
            </p>
          </div>

          <div className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
            {grouped.map(
              (item) => (
                <article
                  key={
                    item.fingerprint
                  }
                  className="flex items-start gap-3 py-3"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted-2)]">
                    <Bug
                      size={14}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[var(--app-text-soft)]">
                      {
                        item.message
                      }
                    </p>

                    <p className="mt-1 text-[10px] font-semibold text-[var(--app-muted-3)]">
                      {item.route ||
                        "sin ruta"}{" "}
                      ·{" "}
                      {
                        item.kind
                      }
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black ${severityClass(
                        item.severity
                      )}`}
                    >
                      {
                        item.severity
                      }
                    </span>

                    <p className="mt-1 text-[10px] font-black text-[var(--app-text)]">
                      {item.count}x
                    </p>

                    <p className="text-[9px] font-semibold text-[var(--app-muted-3)]">
                      {
                        item.affected
                      }{" "}
                      afectados
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-h-11 flex-1 items-center gap-2 border-b border-[var(--app-border)]">
            <Search
              size={15}
              className="text-[var(--app-muted-2)]"
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Buscar error, ruta, versión..."
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[var(--app-text)] outline-none"
            />
          </label>

          <div
            className="flex gap-1 overflow-x-auto"
            aria-label="Filtrar por gravedad"
          >
            {(
              [
                [
                  "all",
                  "Todos",
                ],
                [
                  "warning",
                  "Warnings",
                ],
                [
                  "error",
                  "Errores",
                ],
                [
                  "fatal",
                  "Fatales",
                ],
              ] as Array<
                [
                  SeverityFilter,
                  string,
                ]
              >
            ).map(
              ([
                value,
                label,
              ]) => (
                <button
                  key={
                    value
                  }
                  type="button"
                  onClick={() =>
                    setSeverityFilter(
                      value
                    )
                  }
                  data-active={
                    severityFilter ===
                    value
                      ? "true"
                      : "false"
                  }
                  className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${
                    severityFilter ===
                    value
                      ? "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
                      : "bg-[var(--app-soft)] text-[var(--app-muted-2)]"
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--app-muted)]">
            Cargando observabilidad...
          </div>
        ) : (
          <div className="mt-5 divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
            {filtered.map(
              (row) => (
                <details
                  key={
                    row.id
                  }
                  className="py-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[var(--app-text-soft)]">
                          {
                            row.message
                          }
                        </p>

                        <p className="mt-1 text-xs text-[var(--app-muted-3)]">
                          {row.route ||
                            "sin ruta"}{" "}
                          ·{" "}
                          {row.platform ||
                            "?"}{" "}
                          ·{" "}
                          {row.browser ||
                            "?"}
                        </p>
                      </div>

                      <span
                        className={`h-fit rounded-full px-2 py-0.5 text-[9px] font-black ${severityClass(
                          row.severity
                        )}`}
                      >
                        {
                          row.severity
                        }
                      </span>
                    </div>
                  </summary>

                  <div className="mt-4 grid gap-2 text-xs text-[var(--app-muted)]">
                    <p>
                      Tipo:{" "}
                      {row.kind}
                    </p>
                    <p>
                      Fuente:{" "}
                      {row.source ||
                        "—"}
                    </p>
                    <p>
                      Versión:{" "}
                      {row.app_version ||
                        "—"}{" "}
                      · Dispositivo:{" "}
                      {row.device_type ||
                        "—"}
                    </p>
                    <p className="break-all font-mono text-[10px]">
                      Fingerprint:{" "}
                      {
                        row.fingerprint
                      }
                    </p>

                    {row.stack ? (
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--app-soft)] p-3 text-[10px]">
                        {
                          row.stack
                        }
                      </pre>
                    ) : null}
                  </div>
                </details>
              )
            )}

            {!filtered.length && (
              <div className="py-14 text-center text-sm text-[var(--app-muted)]">
                No hay errores en este filtro.
              </div>
            )}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

/* ALUMNI_3_7_6_OBSERVABILITY_ADMIN */
/* ALUMNI_10_8_OBSERVABILITY_ADMIN */