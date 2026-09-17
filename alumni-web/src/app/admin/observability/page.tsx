"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { supabase } from "@/lib/supabase";

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

export default function ObservabilityPage() {
  const {
    can,
    loading: accessLoading,
  } = useAdminAccess();

  const canViewObservability =
    can("manage_feedback");

  const [rows, setRows] =
    useState<ErrorEvent[]>([]);
  const [loaded, setLoaded] =
    useState(false);
  const [loadedAt, setLoadedAt] =
    useState<number | null>(null);
  const [search, setSearch] =
    useState("");

  useEffect(() => {
    if (
      accessLoading ||
      !canViewObservability
    ) {
      return;
    }

    let active = true;

    void (async () => {
      const { data, error } =
        await supabase
          .from("app_error_events")
          .select("*")
          .order("created_at", {
            ascending: false,
          })
          .limit(500);

      if (!active) {
        return;
      }

      if (error) {
        console.error(
          "Observability:",
          error
        );
      }

      setRows(
        (data ||
          []) as unknown as
          ErrorEvent[]
      );
      setLoadedAt(Date.now());
      setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, [
    accessLoading,
    canViewObservability,
  ]);

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
        (row) =>
          [
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
            .includes(q)
      );
    }, [rows, search]);

  const loading =
    accessLoading ||
    (
      canViewObservability &&
      !loaded
    );

  const dayAgo =
    loadedAt === null
      ? Number.POSITIVE_INFINITY
      : loadedAt -
        86400000;

  const day =
    rows.filter(
      (row) =>
        new Date(
          row.created_at
        ).getTime() >=
        dayAgo
    );

  const unique =
    new Set(
      day.map(
        (row) =>
          row.fingerprint
      )
    ).size;

  const fatal =
    day.filter(
      (row) =>
        row.severity ===
        "fatal"
    ).length;

  const affected =
    new Set(
      day
        .map(
          (row) =>
            row.user_id ||
            row.anonymous_id
        )
        .filter(Boolean)
    ).size;

  if (
    !accessLoading &&
    !canViewObservability
  ) {
    return (
      <AdminShell
        title="Observabilidad"
        description="Errores automáticos y salud operativa de Alumni."
      >
        <div className="py-16 text-center text-sm text-zinc-600">
          No tienes permiso para consultar observabilidad.
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Observabilidad"
      description="Errores automáticos, frecuencia, pantalla, versión y dispositivo."
    >
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          [
            "Últimas 24 h",
            day.length,
          ],
          [
            "Errores distintos",
            unique,
          ],
          [
            "Fatales",
            fatal,
          ],
          [
            "Afectados",
            affected,
          ],
        ].map(
          ([
            label,
            value,
          ]) => (
            <div
              key={String(
                label
              )}
              className="border-b border-white/[0.07] pb-4"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.13em] text-zinc-700">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black">
                {value}
              </p>
            </div>
          )
        )}
      </div>

      <input
        value={search}
        onChange={(event) =>
          setSearch(
            event.target.value
          )
        }
        placeholder="Buscar error, ruta, versión..."
        className="mt-6 h-11 w-full border-b border-white/[0.08] bg-transparent text-sm outline-none"
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-600">
          Cargando observabilidad...
        </div>
      ) : (
        <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {filtered.map(
            (row) => (
              <details
                key={row.id}
                className="py-4"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-300">
                        {
                          row.message
                        }
                      </p>
                      <p className="mt-1 text-xs text-zinc-700">
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

                    <span className="text-[10px] uppercase text-zinc-600">
                      {
                        row.severity
                      }
                    </span>
                  </div>
                </summary>

                <div className="mt-4 grid gap-2 text-xs text-zinc-500">
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
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-[10px]">
                      {row.stack}
                    </pre>
                  ) : null}
                </div>
              </details>
            )
          )}

          {!filtered.length && (
            <div className="py-14 text-center text-sm text-zinc-600">
              No hay errores en este filtro.
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_3_7_6_OBSERVABILITY_ADMIN */