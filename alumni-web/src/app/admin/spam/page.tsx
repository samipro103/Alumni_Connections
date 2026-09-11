"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

function severityClass(
  value: string
) {
  if (value === "critical") {
    return "bg-red-500/10 text-red-400";
  }

  if (value === "high") {
    return "bg-orange-500/10 text-orange-400";
  }

  if (value === "low") {
    return "bg-[var(--app-soft)] text-[var(--app-muted)]";
  }

  return "bg-amber-500/10 text-amber-400";
}

function actionLabel(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    publishing: "Publicaciones",
    comments: "Comentarios",
    reactions: "Reacciones",
    connections: "Seguimientos",
    messages: "Mensajes",
    reposts: "Reposts",
    reports: "Reportes",
  };

  return (
    labels[value] ||
    value
  );
}

function signalLabel(
  value: string
) {
  const labels: Record<
    string,
    string
  > = {
    short_window_threshold:
      "Actividad rápida",
    long_window_threshold:
      "Volumen elevado",
    duplicate_content:
      "Contenido repetido",
    link_burst:
      "Exceso de enlaces",
  };

  return (
    labels[value] ||
    value
  );
}

export default function AdminSpamPage() {
  const [rows, setRows] =
    useState<any[]>([]);
  const [profiles, setProfiles] =
    useState<any[]>([]);
  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [status, setStatus] =
    useState("pending");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from("anti_spam_events")
      .select("*")
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(500);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const userIds = [
      ...new Set(
        (data || [])
          .map(
            (item: any) =>
              item.user_id
          )
          .filter(Boolean)
      ),
    ];

    let profileRows: any[] = [];

    if (userIds.length) {
      const {
        data: result,
      } = await supabase
        .from("profiles")
        .select(
          "id,username,full_name,avatar_url,is_verified"
        )
        .in(
          "id",
          userIds
        );

      profileRows =
        result || [];
    }

    setRows(data || []);
    setProfiles(profileRows);
    setLoading(false);
  }

  async function update(
    eventId: number,
    nextStatus:
      | "reviewed"
      | "dismissed"
  ) {
    const { error } =
      await supabase.rpc(
        "alumni_admin_update_spam_event",
        {
          p_event_id:
            eventId,
          p_status:
            nextStatus,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  }

  const profileById =
    useMemo(
      () =>
        new Map(
          profiles.map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        ),
      [profiles]
    );

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return rows.filter(
        (item) => {
          if (
            status !==
              "all" &&
            item.status !==
              status
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          const profile =
            profileById.get(
              item.user_id
            );

          return [
            item.reason,
            item.action_key,
            item.signal_type,
            item.severity,
            profile?.username,
            profile?.full_name,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(q)
            );
        }
      );
    }, [
      rows,
      status,
      search,
      profileById,
    ]);

  const pending =
    rows.filter(
      (item) =>
        item.status ===
        "pending"
    ).length;

  const highRisk =
    rows.filter(
      (item) =>
        item.status ===
          "pending" &&
        [
          "high",
          "critical",
        ].includes(
          item.severity
        )
    ).length;

  return (
    <AdminShell
      title="Anti-Spam"
      description="Señales automáticas de comportamiento repetitivo o actividad anormal."
    >
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[var(--app-soft)] p-3">
          <strong className="block text-lg font-black text-[var(--app-text)]">
            {rows.length}
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-[var(--app-muted)]">
            Señales
          </span>
        </div>

        <div className="rounded-xl bg-amber-500/10 p-3">
          <strong className="block text-lg font-black text-amber-400">
            {pending}
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-amber-400/70">
            Pendientes
          </span>
        </div>

        <div className="rounded-xl bg-red-500/10 p-3">
          <strong className="block text-lg font-black text-red-400">
            {highRisk}
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-red-400/70">
            Alto riesgo
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {[
          ["pending", "Pendientes"],
          ["reviewed", "Revisadas"],
          ["dismissed", "Descartadas"],
          ["all", "Todas"],
        ].map(
          ([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setStatus(
                  value
                )
              }
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                status === value
                  ? "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
                  : "bg-[var(--app-soft)] text-[var(--app-muted)]"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="mb-5 mt-4 flex h-11 items-center border-b border-[var(--app-border)]">
        <Search
          size={16}
          className="text-[var(--app-muted)]"
        />
        <input
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Buscar usuario o señal..."
          className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none"
        />
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Cargando señales...
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(
            (event) => {
              const profile =
                profileById.get(
                  event.user_id
                );

              return (
                <article
                  key={event.id}
                  className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-400"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/u/${profile?.username || ""}`}
                          className="text-sm font-black text-[var(--app-text)]"
                        >
                          @
                          {profile?.username ||
                            "usuario"}
                        </Link>

                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black ${severityClass(
                            event.severity
                          )}`}
                        >
                          {String(
                            event.severity
                          ).toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-md bg-[var(--app-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-muted)]">
                          {actionLabel(
                            event.action_key
                          )}
                        </span>
                        <span className="rounded-md bg-[var(--app-soft)] px-2 py-1 text-[10px] font-bold text-[var(--app-muted)]">
                          {signalLabel(
                            event.signal_type
                          )}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[var(--app-text-soft)]">
                        {event.reason}
                      </p>

                      <p className="mt-2 text-[10px] text-[var(--app-muted)]">
                        {new Date(
                          event.created_at
                        ).toLocaleString(
                          "es-SV"
                        )}
                      </p>

                      {event.details &&
                        Object.keys(
                          event.details
                        ).length >
                          0 && (
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[var(--app-soft)] p-3 text-[10px] leading-5 text-[var(--app-muted)]">
                            {JSON.stringify(
                              event.details,
                              null,
                              2
                            )}
                          </pre>
                        )}

                      {event.status ===
                        "pending" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href="/admin/users"
                            className="rounded-xl bg-[var(--app-soft)] px-3 py-2 text-xs font-black text-[var(--app-text)]"
                          >
                            Revisar usuario
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              void update(
                                event.id,
                                "reviewed"
                              )
                            }
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400"
                          >
                            <CheckCircle2
                              size={14}
                            />
                            Revisada
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void update(
                                event.id,
                                "dismissed"
                              )
                            }
                            className="flex items-center gap-1.5 rounded-xl bg-[var(--app-soft)] px-3 py-2 text-xs font-black text-[var(--app-muted)]"
                          >
                            <XCircle
                              size={14}
                            />
                            Descartar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            }
          )}

          {!filtered.length && (
            <div className="py-14 text-center text-sm text-[var(--app-muted)]">
              No hay señales en esta vista.
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ANTI_SPAM_1_0 */
