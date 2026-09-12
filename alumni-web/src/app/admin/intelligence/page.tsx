"use client";

import {
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  Clock3,
  Eye,
  Loader2,
  MessageCircle,
  MousePointer2,
  RefreshCw,
  Repeat2,
  Send,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import {
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
import "./product-intelligence.css";

type RetentionItem = {
  eligible: number;
  returned: number;
  rate: number | null;
};

type IntelligencePayload = {
  generated_at: string;
  days: number;
  tracking_since: string | null;
  active_users: {
    dau: number;
    wau: number;
    mau: number;
  };
  funnel: {
    registered: number;
    profile_completed: number;
    followed_someone: number;
    sent_message: number;
    published_post: number;
  };
  retention: {
    d1: RetentionItem;
    d7: RetentionItem;
    d30: RetentionItem;
  };
  publisher_pct_30:
    number | null;
  publishers_30: number;
  avg_first_connection_minutes:
    number | null;
  top_routes: Array<{
    route: string;
    views: number;
    users: number;
    sessions: number;
  }>;
  exit_routes: Array<{
    route: string;
    sessions: number;
    exits: number;
    exit_rate: number | null;
  }>;
  daily: Array<{
    day: string;
    active_users: number;
    registrations: number;
    posts: number;
  }>;
};

function pct(
  value: number,
  total: number
) {
  if (!total) {
    return "—";
  }

  return `${Math.round(
    (value / total) * 100
  )}%`;
}

function timeLabel(
  minutes: number | null
) {
  if (
    minutes === null ||
    !Number.isFinite(minutes)
  ) {
    return "—";
  }

  if (minutes < 60) {
    return `${Math.round(
      minutes
    )} min`;
  }

  if (minutes < 1440) {
    return `${(
      minutes / 60
    ).toFixed(1)} h`;
  }

  return `${(
    minutes / 1440
  ).toFixed(1)} d`;
}

function routeLabel(
  route: string
) {
  const labels: Record<
    string,
    string
  > = {
    "/feed": "Feed",
    "/explore": "Buscar",
    "/messages": "Mensajes",
    "/messages/[username]":
      "Conversación",
    "/profile": "Perfil",
    "/more": "Más",
    "/events": "Eventos",
    "/events/[id]":
      "Detalle de evento",
    "/community":
      "Comunidades",
    "/community/[slug]":
      "Detalle de comunidad",
    "/notifications":
      "Notificaciones",
    "/settings":
      "Configuración",
    "/feedback":
      "Feedback",
    "/passport":
      "Pasaporte",
  };

  return (
    labels[route] ||
    route
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon: React.ComponentType<{
    size?: number;
  }>;
}) {
  return (
    <div className="alumni-pi-metric">
      <span className="alumni-pi-metric-icon">
        <Icon size={15} />
      </span>

      <div>
        <span>{label}</span>
        <strong>
          {value}
        </strong>
        {detail ? (
          <small>
            {detail}
          </small>
        ) : null}
      </div>
    </div>
  );
}

export default function ProductIntelligencePage() {
  const reduceMotion =
    useReducedMotion();

  const {
    can,
    loading: accessLoading,
  } = useAdminAccess();

  const [data, setData] =
    useState<IntelligencePayload | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function load() {
    if (
      accessLoading ||
      !can("view_stats")
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const result =
      await supabase.rpc(
        "alumni_product_intelligence_v1",
        {
          p_days: 30,
        }
      );

    if (result.error) {
      console.error(
        "[Product Intelligence]",
        result.error
      );

      setError(
        "No se pudieron cargar las métricas."
      );
      setLoading(false);
      return;
    }

    setData(
      result.data as IntelligencePayload
    );
    setLoading(false);
  }

  useEffect(() => {
    if (
      !accessLoading &&
      can("view_stats")
    ) {
      void load();
    } else if (
      !accessLoading
    ) {
      setLoading(false);
    }
  }, [
    accessLoading,
  ]);

  const maxDaily =
    useMemo(
      () =>
        Math.max(
          1,
          ...(data?.daily || []).map(
            (item) =>
              item.active_users
          )
        ),
      [data]
    );

  const registered =
    data?.funnel.registered ||
    0;

  const funnel = data
    ? [
        {
          label:
            "Registrados",
          value:
            data.funnel
              .registered,
          icon: Users,
        },
        {
          label:
            "Perfil listo",
          value:
            data.funnel
              .profile_completed,
          icon: UserCheck,
        },
        {
          label:
            "Primera conexión",
          value:
            data.funnel
              .followed_someone,
          icon: Sparkles,
        },
        {
          label:
            "Primer mensaje",
          value:
            data.funnel
              .sent_message,
          icon: Send,
        },
        {
          label:
            "Publicó",
          value:
            data.funnel
              .published_post,
          icon: MessageCircle,
        },
      ]
    : [];

  const trackingDate =
    data?.tracking_since
      ? new Date(
          data.tracking_since
        )
      : null;

  const trackingDays =
    trackingDate
      ? Math.max(
          0,
          Math.floor(
            (Date.now() -
              trackingDate.getTime()) /
              86400000
          )
        )
      : 0;

  return (
    <AdminShell
      title="Producto"
      description="Uso real, activación y retención."
    >
      <main
        className="alumni-pi"
        data-alumni-motion-ignore="true"
      >
        <motion.div
          className="alumni-pi-top"
          initial={
            reduceMotion
              ? false
              : {
                  opacity: 0,
                  y: 6,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: .34,
          }}
        >
          <div>
            <span>
              Últimos 30 días
            </span>

            {data?.generated_at ? (
              <small>
                Actualizado{" "}
                {new Date(
                  data.generated_at
                ).toLocaleTimeString(
                  "es-SV",
                  {
                    hour: "2-digit",
                    minute:
                      "2-digit",
                  }
                )}
              </small>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() =>
              void load()
            }
            disabled={
              loading ||
              !can("view_stats")
            }
            aria-label="Actualizar"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </motion.div>

        {loading ? (
          <div className="alumni-pi-loading">
            <Loader2
              size={20}
              className="animate-spin"
            />
            <span>
              Calculando…
            </span>
          </div>
        ) : error ? (
          <div className="alumni-pi-empty">
            {error}
          </div>
        ) : !data ? (
          <div className="alumni-pi-empty">
            Sin datos todavía.
          </div>
        ) : (
          <>
            <section className="alumni-pi-metrics">
              <Metric
                label="DAU"
                value={
                  data.active_users.dau
                }
                detail="24 horas"
                icon={Activity}
              />

              <Metric
                label="WAU"
                value={
                  data.active_users.wau
                }
                detail="7 días"
                icon={Repeat2}
              />

              <Metric
                label="MAU"
                value={
                  data.active_users.mau
                }
                detail="30 días"
                icon={Users}
              />

              <Metric
                label="Publican"
                value={
                  data.publisher_pct_30 ===
                  null
                    ? "—"
                    : `${data.publisher_pct_30}%`
                }
                detail={`${data.publishers_30} usuarios`}
                icon={MousePointer2}
              />

              <Metric
                label="1ª conexión"
                value={timeLabel(
                  data.avg_first_connection_minutes
                )}
                detail="tiempo promedio"
                icon={Clock3}
              />
            </section>

            <section className="alumni-pi-section">
              <header>
                <div>
                  <span>
                    Activación
                  </span>
                  <h2>
                    Del registro al uso
                  </h2>
                </div>
              </header>

              <div className="alumni-pi-funnel">
                {funnel.map(
                  (
                    item,
                    index
                  ) => {
                    const Icon =
                      item.icon;

                    return (
                      <motion.div
                        key={
                          item.label
                        }
                        className="alumni-pi-funnel-row"
                        initial={
                          reduceMotion
                            ? false
                            : {
                                opacity:
                                  0,
                                x: 5,
                              }
                        }
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          duration:
                            .28,
                          delay:
                            index *
                            .035,
                        }}
                      >
                        <span className="alumni-pi-funnel-icon">
                          <Icon
                            size={
                              15
                            }
                          />
                        </span>

                        <div>
                          <strong>
                            {
                              item.label
                            }
                          </strong>
                          <small>
                            {index ===
                            0
                              ? "Base"
                              : pct(
                                  item.value,
                                  registered
                                )}
                          </small>
                        </div>

                        <b>
                          {
                            item.value
                          }
                        </b>

                        {index <
                        funnel.length -
                          1 ? (
                          <ArrowRight
                            size={
                              13
                            }
                          />
                        ) : null}
                      </motion.div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="alumni-pi-section">
              <header>
                <div>
                  <span>
                    Retención
                  </span>
                  <h2>
                    ¿Regresan?
                  </h2>
                </div>
              </header>

              <div className="alumni-pi-retention">
                {(
                  [
                    [
                      "D1",
                      data.retention
                        .d1,
                    ],
                    [
                      "D7",
                      data.retention
                        .d7,
                    ],
                    [
                      "D30",
                      data.retention
                        .d30,
                    ],
                  ] as const
                ).map(
                  ([
                    label,
                    item,
                  ]) => (
                    <div
                      key={label}
                      className="alumni-pi-retention-item"
                    >
                      <span>
                        {label}
                      </span>
                      <strong>
                        {item.rate ===
                        null
                          ? "—"
                          : `${item.rate}%`}
                      </strong>
                      <small>
                        {
                          item.returned
                        }
                        /
                        {
                          item.eligible
                        }
                      </small>
                    </div>
                  )
                )}
              </div>

              {trackingDays <
              30 ? (
                <p className="alumni-pi-note">
                  La retención
                  comienza a ser
                  confiable conforme
                  acumulemos días de
                  tracking.
                </p>
              ) : null}
            </section>

            <section className="alumni-pi-section">
              <header>
                <div>
                  <span>
                    Actividad
                  </span>
                  <h2>
                    Usuarios por día
                  </h2>
                </div>
              </header>

              <div className="alumni-pi-chart">
                {data.daily.map(
                  (item) => {
                    const height =
                      Math.max(
                        5,
                        Math.round(
                          (item.active_users /
                            maxDaily) *
                            100
                        )
                      );

                    return (
                      <div
                        key={
                          item.day
                        }
                        className="alumni-pi-bar-wrap"
                        title={`${item.day}: ${item.active_users}`}
                      >
                        <motion.span
                          className="alumni-pi-bar"
                          initial={
                            reduceMotion
                              ? false
                              : {
                                  height:
                                    "5%",
                                }
                          }
                          animate={{
                            height:
                              `${height}%`,
                          }}
                          transition={{
                            duration:
                              .38,
                            ease:
                              "easeOut",
                          }}
                        />
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="alumni-pi-section alumni-pi-route-grid">
              <div>
                <header>
                  <div>
                    <span>
                      Pantallas
                    </span>
                    <h2>
                      Más usadas
                    </h2>
                  </div>
                </header>

                <div className="alumni-pi-routes">
                  {data.top_routes
                    .slice(0, 8)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={
                            item.route
                          }
                          className="alumni-pi-route"
                        >
                          <b>
                            {index +
                              1}
                          </b>
                          <div>
                            <strong>
                              {routeLabel(
                                item.route
                              )}
                            </strong>
                            <small>
                              {
                                item.users
                              }{" "}
                              usuarios
                            </small>
                          </div>
                          <span>
                            {
                              item.views
                            }
                          </span>
                        </div>
                      )
                    )}

                  {!data.top_routes
                    .length ? (
                    <p className="alumni-pi-list-empty">
                      Empezará a
                      llenarse desde
                      ahora.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <header>
                  <div>
                    <span>
                      Salidas
                    </span>
                    <h2>
                      Última pantalla
                    </h2>
                  </div>
                </header>

                <div className="alumni-pi-routes">
                  {data.exit_routes
                    .slice(0, 8)
                    .map(
                      (item) => (
                        <div
                          key={
                            item.route
                          }
                          className="alumni-pi-route"
                        >
                          <span className="alumni-pi-exit-icon">
                            <ArrowDownRight
                              size={
                                14
                              }
                            />
                          </span>
                          <div>
                            <strong>
                              {routeLabel(
                                item.route
                              )}
                            </strong>
                            <small>
                              {
                                item.sessions
                              }{" "}
                              sesiones
                            </small>
                          </div>
                          <span>
                            {
                              item.exits
                            }
                          </span>
                        </div>
                      )
                    )}

                  {!data.exit_routes
                    .length ? (
                    <p className="alumni-pi-list-empty">
                      Empezará a
                      llenarse desde
                      ahora.
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            <div className="alumni-pi-foot">
              <Eye size={13} />
              <span>
                Solo métricas
                agregadas. No se
                muestran conversaciones
                ni contenido privado.
              </span>
            </div>
          </>
        )}
      </main>
    </AdminShell>
  );
}

/* ALUMNI_PRODUCT_INTELLIGENCE_1_0:ADMIN */
