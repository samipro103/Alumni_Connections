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

export default function AdminReportsPage() {
  const [rows, setRows] =
    useState<any[]>([]);
  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);

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

  async function resolve(
    report: any,
    status:
      | "reviewing"
      | "resolved"
      | "dismissed"
  ) {
    const note =
      window.prompt(
        status ===
          "dismissed"
          ? "Motivo para descartar:"
          : "Nota de resolución:"
      );

    if (
      note === null
    ) {
      return;
    }

    const { error } =
      await supabase.rpc(
        "alumni_admin_resolve_report",
        {
          p_report_id:
            report.id,
          p_status: status,
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

      if (!q) {
        return rows;
      }

      return rows.filter(
        (item) =>
          [
            item.reason,
            item.details,
            item.target_type,
            item.target_id,
            item.status,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(q)
            )
      );
    }, [rows, search]);

  return (
    <AdminShell
      title="Reportes"
      description="Denuncias enviadas por usuarios y su resolución."
    >
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
                          void resolve(
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
                          void resolve(
                            report,
                            "resolved"
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-400"
                      >
                        <CheckCircle2
                          size={
                            14
                          }
                        />
                        Resolver
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void resolve(
                            report,
                            "dismissed"
                          )
                        }
                        className="flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-400"
                      >
                        <XCircle
                          size={
                            14
                          }
                        />
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */
