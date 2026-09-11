"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Search,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminCommentsPage() {
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
        .from("comments")
        .select(
          "id,post_id,user_id,content,created_at,parent_comment_id,profiles:user_id(username,full_name,avatar_url,is_verified)"
        )
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

  async function remove(
    comment: any
  ) {
    const reason =
      window.prompt(
        "Motivo interno de eliminación:"
      );

    if (
      reason === null
    ) {
      return;
    }

    const { error } =
      await supabase.rpc(
        "alumni_admin_delete_comment",
        {
          p_comment_id:
            comment.id,
          p_reason:
            reason ||
            null,
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    setRows(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            comment.id
        )
    );
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
            item.content,
            item.profiles
              ?.username,
            item.profiles
              ?.full_name,
            item.post_id,
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
      title="Comentarios"
      description="Moderación global de comentarios y respuestas."
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
          placeholder="Buscar comentario o usuario..."
          className="h-full flex-1 bg-transparent px-3 text-sm text-[var(--app-text)] outline-none"
        />
        <span className="text-xs text-[var(--app-muted)]">
          {filtered.length}
        </span>
      </div>

      {loading ? (
        <div className="py-14 text-center text-sm text-[var(--app-muted)]">
          Cargando comentarios...
        </div>
      ) : (
        <div className="divide-y divide-[var(--app-border)]">
          {filtered.map(
            (comment) => (
              <article
                key={
                  comment.id
                }
                className="py-4"
              >
                <div className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm text-[var(--app-text)]">
                        @
                        {comment
                          .profiles
                          ?.username ||
                          "usuario"}
                      </strong>

                      {comment.parent_comment_id && (
                        <span className="rounded-md bg-[var(--app-soft)] px-2 py-0.5 text-[10px] font-bold text-[var(--app-muted)]">
                          Respuesta
                        </span>
                      )}

                      <span className="text-[11px] text-[var(--app-muted)]">
                        Post #
                        {
                          comment.post_id
                        }
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--app-text-soft)]">
                      {comment.content}
                    </p>

                    <p className="mt-2 text-[10px] text-[var(--app-muted)]">
                      {new Date(
                        comment.created_at
                      ).toLocaleString(
                        "es-SV"
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void remove(
                        comment
                      )
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] hover:bg-red-500/10 hover:text-red-400"
                    aria-label="Eliminar comentario"
                  >
                    <Trash2
                      size={16}
                    />
                  </button>
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
