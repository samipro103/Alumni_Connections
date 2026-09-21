"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  FileText,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase";

type MetricKey =
  | "users"
  | "posts"
  | "messages"
  | "comments"
  | "events"
  | "communities";

type CountResult = {
  count: number | null;
  error: {
    message?: string;
  } | null;
};

type Snapshot = Record<
  MetricKey,
  number
>;

type PeriodSnapshot = {
  current: Snapshot;
  previous: Snapshot;
};

const EMPTY_SNAPSHOT: Snapshot = {
  users: 0,
  posts: 0,
  messages: 0,
  comments: 0,
  events: 0,
  communities: 0,
};

const METRICS: Array<{
  key: MetricKey;
  label: string;
  icon:
    React.ComponentType<{
      size?: number;
    }>;
}> = [
  {
    key: "users",
    label: "Usuarios",
    icon: Users,
  },
  {
    key: "posts",
    label: "Publicaciones",
    icon: FileText,
  },
  {
    key: "messages",
    label: "Mensajes",
    icon: MessagesSquare,
  },
  {
    key: "comments",
    label: "Comentarios",
    icon: MessageCircle,
  },
  {
    key: "events",
    label: "Eventos",
    icon: CalendarDays,
  },
  {
    key: "communities",
    label: "Comunidades",
    icon: Activity,
  },
];

function countValue(
  result: CountResult
) {
  return result.count || 0;
}

function pctChange(
  current: number,
  previous: number
) {
  if (
    previous === 0
  ) {
    return current > 0
      ? null
      : 0;
  }

  return Math.round(
    (
      (current -
        previous) /
      previous
    ) *
      100
  );
}

function ChangeBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  const change =
    pctChange(
      current,
      previous
    );

  if (
    change === null
  ) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--app-accent)]">
        <ArrowUpRight
          size={11}
        />
        nuevo
      </span>
    );
  }

  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400">
        <ArrowUpRight
          size={11}
        />
        {change}%
      </span>
    );
  }

  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-400">
        <ArrowDownRight
          size={11}
        />
        {Math.abs(
          change
        )}%
      </span>
    );
  }

  return (
    <span className="text-[10px] font-black text-[var(--app-muted-2)]">
      0%
    </span>
  );
}

async function countTable(
  table: string,
  from?: string,
  to?: string
): Promise<CountResult> {
  let query =
    supabase
      .from(table)
      .select("*", {
        count: "exact",
        head: true,
      });

  if (from) {
    query =
      query.gte(
        "created_at",
        from
      );
  }

  if (to) {
    query =
      query.lt(
        "created_at",
        to
      );
  }

  const result =
    await query;

  return {
    count:
      result.count,
    error:
      result.error,
  };
}

async function loadSnapshot(
  from?: string,
  to?: string
): Promise<Snapshot> {
  const [
    users,
    posts,
    messages,
    comments,
    events,
    communities,
  ] =
    await Promise.all([
      countTable(
        "profiles",
        from,
        to
      ),
      countTable(
        "posts",
        from,
        to
      ),
      countTable(
        "messages",
        from,
        to
      ),
      countTable(
        "comments",
        from,
        to
      ),
      countTable(
        "events",
        from,
        to
      ),
      countTable(
        "communities",
        from,
        to
      ),
    ]);

  const results = [
    users,
    posts,
    messages,
    comments,
    events,
    communities,
  ];

  const firstError =
    results.find(
      (result) =>
        result.error
    )?.error;

  if (firstError) {
    throw new Error(
      firstError.message ||
        "No se pudieron cargar las estadísticas."
    );
  }

  return {
    users:
      countValue(users),
    posts:
      countValue(posts),
    messages:
      countValue(messages),
    comments:
      countValue(comments),
    events:
      countValue(events),
    communities:
      countValue(
        communities
      ),
  };
}

export default function AdminStatsPage() {
  const [totals, setTotals] =
    useState<Snapshot>(
      EMPTY_SNAPSHOT
    );

  const [
    period,
    setPeriod,
  ] =
    useState<PeriodSnapshot>({
      current:
        EMPTY_SNAPSHOT,
      previous:
        EMPTY_SNAPSHOT,
    });

  const [
    upcomingEvents,
    setUpcomingEvents,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    generatedAt,
    setGeneratedAt,
  ] =
    useState<Date | null>(
      null
    );

  async function load(
    refresh = false
  ) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const now =
        new Date();

      const currentStart =
        new Date(
          now.getTime() -
            7 *
              86400000
        );

      const previousStart =
        new Date(
          now.getTime() -
            14 *
              86400000
        );

      const [
        totalSnapshot,
        currentSnapshot,
        previousSnapshot,
        upcomingResult,
      ] =
        await Promise.all([
          loadSnapshot(),
          loadSnapshot(
            currentStart.toISOString(),
            now.toISOString()
          ),
          loadSnapshot(
            previousStart.toISOString(),
            currentStart.toISOString()
          ),
          supabase
            .from("events")
            .select("*", {
              count: "exact",
              head: true,
            })
            .gte(
              "event_date",
              now.toISOString()
            ),
        ]);

      if (
        upcomingResult.error
      ) {
        throw upcomingResult.error;
      }

      setTotals(
        totalSnapshot
      );

      setPeriod({
        current:
          currentSnapshot,
        previous:
          previousSnapshot,
      });

      setUpcomingEvents(
        upcomingResult.count ||
          0
      );

      setGeneratedAt(
        now
      );
    } catch (
      caught: unknown
    ) {
      console.error(
        "[Admin Stats]",
        caught
      );

      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudieron cargar las estadísticas."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const now =
          new Date();

        const currentStart =
          new Date(
            now.getTime() -
              7 *
                86400000
          );

        const previousStart =
          new Date(
            now.getTime() -
              14 *
                86400000
          );

        const [
          totalSnapshot,
          currentSnapshot,
          previousSnapshot,
          upcomingResult,
        ] =
          await Promise.all([
            loadSnapshot(),
            loadSnapshot(
              currentStart.toISOString(),
              now.toISOString()
            ),
            loadSnapshot(
              previousStart.toISOString(),
              currentStart.toISOString()
            ),
            supabase
              .from("events")
              .select("*", {
                count: "exact",
                head: true,
              })
              .gte(
                "event_date",
                now.toISOString()
              ),
          ]);

        if (!active) {
          return;
        }

        if (
          upcomingResult.error
        ) {
          throw upcomingResult.error;
        }

        setTotals(
          totalSnapshot
        );

        setPeriod({
          current:
            currentSnapshot,
          previous:
            previousSnapshot,
        });

        setUpcomingEvents(
          upcomingResult.count ||
            0
        );

        setGeneratedAt(
          now
        );
      } catch (
        caught: unknown
      ) {
        if (!active) {
          return;
        }

        console.error(
          "[Admin Stats]",
          caught
        );

        setError(
          caught instanceof Error
            ? caught.message
            : "No se pudieron cargar las estadísticas."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell
      title="Estadísticas"
      description="Tamaño de la red, actividad reciente y pulso operativo."
    >
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-[var(--app-border)] pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
            Resumen ejecutivo
          </p>

          <p className="mt-1 text-xs font-semibold text-[var(--app-muted-2)]">
            {generatedAt
              ? `Actualizado ${generatedAt.toLocaleTimeString(
                  "es-SV",
                  {
                    hour:
                      "2-digit",
                    minute:
                      "2-digit",
                  }
                )}`
              : "Datos actuales de Alumni"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void load(true)
          }
          disabled={
            loading ||
            refreshing
          }
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted-2)] disabled:opacity-50"
          aria-label="Actualizar estadísticas"
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

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Calculando estadísticas...
        </div>
      ) : error ? (
        <div className="rounded-[18px] border border-red-500/20 bg-red-500/[0.06] p-4 text-sm font-semibold text-red-300">
          {error}
        </div>
      ) : (
        <>
          <section>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {METRICS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                }) => (
                  <article
                    key={key}
                    className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                        <Icon
                          size={16}
                        />
                      </span>

                      <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[var(--app-muted-3)]">
                        total
                      </span>
                    </div>

                    <strong className="mt-4 block text-[28px] font-black tracking-[-0.04em] text-[var(--app-text)]">
                      {totals[
                        key
                      ].toLocaleString(
                        "es-SV"
                      )}
                    </strong>

                    <span className="mt-0.5 block text-xs font-semibold text-[var(--app-muted-2)]">
                      {label}
                    </span>
                  </article>
                )
              )}
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--app-muted-3)]">
                Últimos 7 días
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--app-text)]">
                Actividad reciente
              </h2>
              <p className="mt-1 text-xs font-semibold text-[var(--app-muted-2)]">
                Comparado con los 7 días anteriores.
              </p>
            </div>

            <div className="divide-y divide-[var(--app-border)] border-y border-[var(--app-border)]">
              {METRICS.map(
                ({
                  key,
                  label,
                  icon: Icon,
                }) => (
                  <div
                    key={`period-${key}`}
                    className="flex min-h-[58px] items-center gap-3 py-2"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--app-soft)] text-[var(--app-muted-2)]">
                      <Icon
                        size={14}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <strong className="block text-xs font-black text-[var(--app-text-soft)]">
                        {label}
                      </strong>

                      <small className="mt-0.5 block text-[10px] font-semibold text-[var(--app-muted-3)]">
                        semana anterior:{" "}
                        {period
                          .previous[
                            key
                          ].toLocaleString(
                            "es-SV"
                          )}
                      </small>
                    </span>

                    <span className="text-right">
                      <strong className="block text-base font-black text-[var(--app-text)]">
                        {period
                          .current[
                            key
                          ].toLocaleString(
                            "es-SV"
                          )}
                      </strong>

                      <ChangeBadge
                        current={
                          period
                            .current[
                              key
                            ]
                        }
                        previous={
                          period
                            .previous[
                              key
                            ]
                        }
                      />
                    </span>
                  </div>
                )
              )}
            </div>
          </section>

          <section className="mt-8 grid gap-3 sm:grid-cols-2">
            <article className="rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
              <CalendarDays
                size={17}
                className="text-[var(--app-accent)]"
              />

              <strong className="mt-4 block text-2xl font-black text-[var(--app-text)]">
                {upcomingEvents.toLocaleString(
                  "es-SV"
                )}
              </strong>

              <span className="mt-1 block text-xs font-semibold text-[var(--app-muted-2)]">
                Eventos próximos
              </span>
            </article>

            <Link
              href="/admin/intelligence"
              className="group rounded-[20px] border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition hover:bg-[var(--app-soft)]"
            >
              <Activity
                size={17}
                className="text-[var(--app-accent)]"
              />

              <strong className="mt-4 block text-sm font-black text-[var(--app-text)]">
                Analítica de Producto
              </strong>

              <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--app-muted-2)]">
                DAU, WAU, MAU, activación, retención y rutas más usadas.
              </span>

              <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-black text-[var(--app-accent)]">
                Ver detalle
                <ArrowRight
                  size={12}
                />
              </span>
            </Link>
          </section>

          <div className="mt-6 flex items-start gap-2 rounded-[14px] bg-[var(--app-soft)] px-3.5 py-3">
            <Activity
              size={14}
              className="mt-0.5 shrink-0 text-[var(--app-muted-2)]"
            />

            <p className="text-[10px] font-semibold leading-4 text-[var(--app-muted-2)]">
              Esta pantalla usa métricas agregadas. Para comportamiento, activación y retención usa la sección Producto.
            </p>
          </div>
        </>
      )}
    </AdminShell>
  );
}

/* ALUMNI_10_6_ADMIN_ANALYTICS */