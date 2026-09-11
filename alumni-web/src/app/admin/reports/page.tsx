"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

const CATEGORIES = [
  ["spam", "Spam"],
  ["harassment", "Acoso"],
  ["hate", "Odio"],
  ["sexual", "Contenido sexual"],
  ["violence", "Violencia"],
  ["threat", "Amenazas"],
  ["scam", "Fraude / estafa"],
  ["impersonation", "Suplantación"],
  ["privacy", "Privacidad"],
  ["illegal", "Actividad ilícita"],
  ["self_harm", "Autolesión"],
  ["misinformation", "Información engañosa"],
  ["other", "Otro"],
] as const;

function categoryLabel(
  value: string
) {
  return (
    CATEGORIES.find(
      ([key]) =>
        key === value
    )?.[1] || value
  );
}

function severityClass(
  value: string
) {
  if (
    value === "critical"
  ) {
    return "bg-red-500/10 text-red-400";
  }

  if (
    value === "high"
  ) {
    return "bg-orange-500/10 text-orange-400";
  }

  if (
    value === "low"
  ) {
    return "bg-[var(--app-soft)] text-[var(--app-muted)]";
  }

  return "bg-amber-500/10 text-amber-400";
}

export default function AdminReportsPage() {
  const [rows, setRows] =
    useState<any[]>([]);
  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [
    statusFilter,
    setStatusFilter,
  ] = useState("open");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from(
          "user_reports"
        )
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
    }

    setRows(
      data || []
    );
    setLoading(false);
  }

  function patchReport(
    id: string,
    patch: Record<
      string,
      any
    >
  ) {
    setRows((current) =>
      current.map(
        (item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
              }
            : item
      )
    );
  }

  async function saveReport(
    report: any,
    status:
      | "reviewing"
      | "resolved"
      | "dismissed"
  ) {
    let note =
      report.resolution_note ||
      "";

    if (
      status ===
        "resolved" ||
      status ===
        "dismissed"
    ) {
      const typed =
        window.prompt(
          status ===
            "dismissed"
            ? "Motivo para descartar:"
            : "Nota de resolución:",
          note
        );

      if (
        typed === null
      ) {
        return;
      }

      note = typed;
    }

    const { error } =
      await supabase.rpc(
        "alumni_admin_update_report_v2",
        {
          p_report_id:
            report.id,
          p_status: status,
          p_category:
            report.category ||
            "other",
          p_severity:
            report.severity ||
            "medium",
          p_resolution_note:
            note || null,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    await load();
  }

  const filtered =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return rows.filter(
        (item) => {
          if (
            statusFilter ===
              "open" &&
            ![
              "pending",
              "reviewing",
            ].includes(
              item.status
            )
          ) {
            return false;
          }

          if (
            statusFilter !==
              "all" &&
            statusFilter !==
              "open" &&
            item.status !==
              statusFilter
          ) {
            return false;
          }

          if (!q) {
            return true;
          }

          return [
            item.reason,
            item.details,
            item.target_type,
            item.target_id,
            item.status,
            item.category,
            item.severity,
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
      search,
      statusFilter,
    ]);

  const openCount =
    rows.filter((item) =>
      [
        "pending",
        "reviewing",
      ].includes(item.status)
    ).length;

  return (
    <AdminShell
      title="Reportes"
      description="Cola de moderación con categoría, gravedad y resolución documentada."
    >
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[var(--app-soft)] p-3">
          <strong className="text-lg font-black text-[var(--app-text)]">
            {
              rows.length
            }
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-[var(--app-muted)]">
            Total
          </span>
        </div>

        <div className="rounded-xl bg-amber-500/10 p-3">
          <strong className="text-lg font-black text-amber-400">
            {openCount}
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-amber-400/70">
            Abiertos
          </span>
        </div>

        <div className="rounded-xl bg-red-500/10 p-3">
          <strong className="text-lg font-black text-red-400">
            {
              rows.filter(
                (item) =>
                  item.severity ===
                  "critical"
              ).length
            }
          </strong>
          <span className="mt-1 block text-[10px] font-bold uppercase text-red-400/70">
            Críticos
          </span>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          ["open", "Pendientes"],
          ["resolved", "Resueltos"],
          ["dismissed", "Descartados"],
          ["all", "Todos"],
        ].map(
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
                setStatusFilter(
                  value
                )
              }
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                statusFilter ===
                value
                  ? "bg-[var(--app-accent-fill)] text-[var(--app-on-accent)]"
                  : "bg-[var(--app-soft)] text-[var(--app-muted)]"
              }`}
            >
              {label}
            </button>
          )
        )}
      </div>

      <div className="mb-5 flex h-11 items-center border-b border-[var(--app-border)]">
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
          placeholder="Buscar reporte..."
          className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none"
        />
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Cargando reportes...
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(
            (report) => (
              <article
                key={
                  report.id
                }
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldAlert
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-[var(--app-text)]">
                        {
                          report.reason
                        }
                      </strong>

                      <span className="rounded-md bg-[var(--app-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
                        {
                          report.status
                        }
                      </span>

                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-black ${severityClass(
                          report.severity ||
                            "medium"
                        )}`}
                      >
                        {(
                          report.severity ||
                          "medium"
                        ).toUpperCase()}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-[var(--app-muted)]">
                      {
                        report.target_type
                      }
                      {report.target_id
                        ? ` · ${report.target_id}`
                        : ""}
                    </p>

                    {report.details && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--app-text-soft)]">
                        {
                          report.details
                        }
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-bold text-[var(--app-muted)]">
                        Categoría
                        <select
                          value={
                            report.category ||
                            "other"
                          }
                          onChange={(e) =>
                            patchReport(
                              report.id,
                              {
                                category:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="mt-2 h-10 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 text-sm text-[var(--app-text)]"
                        >
                          {CATEGORIES.map(
                            ([
                              value,
                              label,
                            ]) => (
                              <option
                                key={
                                  value
                                }
                                value={
                                  value
                                }
                              >
                                {
                                  label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="text-xs font-bold text-[var(--app-muted)]">
                        Gravedad
                        <select
                          value={
                            report.severity ||
                            "medium"
                          }
                          onChange={(e) =>
                            patchReport(
                              report.id,
                              {
                                severity:
                                  e
                                    .target
                                    .value,
                              }
                            )
                          }
                          className="mt-2 h-10 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-bg)] px-3 text-sm text-[var(--app-text)]"
                        >
                          <option value="low">
                            Baja
                          </option>
                          <option value="medium">
                            Media
                          </option>
                          <option value="high">
                            Alta
                          </option>
                          <option value="critical">
                            Crítica
                          </option>
                        </select>
                      </label>
                    </div>

                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--app-muted)]">
                      {categoryLabel(
                        report.category ||
                          "other"
                      )}
                    </p>

                    {report.resolution_note && (
                      <p className="mt-3 rounded-xl bg-[var(--app-soft)] p-3 text-xs text-[var(--app-muted)]">
                        Resolución:{" "}
                        {
                          report.resolution_note
                        }
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void saveReport(
                            report,
                            "reviewing"
                          )
                        }
                        className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-black text-amber-400"
                      >
                        En revisión
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveReport(
                            report,
                            "resolved"
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400"
                      >
                        <CheckCircle2
                          size={14}
                        />
                        Resolver
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveReport(
                            report,
                            "dismissed"
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-400"
                      >
                        <XCircle
                          size={14}
                        />
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}

          {!filtered.length && (
            <div className="py-14 text-center text-sm text-[var(--app-muted)]">
              No hay reportes en esta vista.
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */
/* ALUMNI_ADMIN_CONTROL_CENTER_2_0 */
