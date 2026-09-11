"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminAuditPage() {
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
          "admin_audit_log"
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
            item.action,
            item.actor_user_id,
            item.target_user_id,
            JSON.stringify(
              item.details ||
                {}
            ),
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
      title="Auditoría"
      description="Registro de acciones administrativas y de moderación."
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
          placeholder="Buscar acción..."
          className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none"
        />
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Cargando auditoría...
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {filtered.map(
            (item) => (
              <article
                key={
                  item.id
                }
                className="py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm text-[var(--app-text)]">
                    {
                      item.action
                    }
                  </strong>

                  <span className="text-[10px] text-[var(--app-muted)]">
                    {new Date(
                      item.created_at
                    ).toLocaleString(
                      "es-SV"
                    )}
                  </span>
                </div>

                <p className="mt-2 break-all text-xs text-[var(--app-muted)]">
                  Actor:{" "}
                  {item.actor_user_id ||
                    "sistema"}
                </p>

                {item.target_user_id && (
                  <p className="mt-1 break-all text-xs text-[var(--app-muted)]">
                    Usuario:{" "}
                    {
                      item.target_user_id
                    }
                  </p>
                )}

                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl bg-[var(--app-soft)] p-3 text-[11px] leading-5 text-[var(--app-text-soft)]">
                  {JSON.stringify(
                    item.details ||
                      {},
                    null,
                    2
                  )}
                </pre>
              </article>
            )
          )}
        </div>
      )}
    </AdminShell>
  );
}

/* ALUMNI_ADMIN_CONTROL_CENTER_1_0 */
