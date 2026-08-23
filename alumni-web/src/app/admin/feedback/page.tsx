"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bug,
  CheckCircle2,
  ExternalLink,
  ImageIcon,
  Lightbulb,
  MonitorSmartphone,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase";

type FeedbackReport = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  expected_behavior?: string | null;
  steps_to_reproduce?: string | null;
  source_path?: string | null;
  platform?: string | null;
  app_version?: string | null;
  priority: string;
  status: string;
  attachments: string[];
  admin_notes?: string | null;
  created_at: string;
  profiles?: {
    username?: string | null;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  reviewing: "Revisando",
  resolved: "Corregido",
  closed: "Cerrado",
};

const TYPE_LABELS: Record<string, string> = {
  bug: "Error",
  ui: "Visual",
  suggestion: "Sugerencia",
  missing_feature: "Función",
  other: "Otro",
};

function typeIcon(type: string) {
  if (type === "bug") return Bug;
  if (type === "ui") return Sparkles;
  if (type === "suggestion") return Lightbulb;
  if (type === "missing_feature") return Wrench;
  return MonitorSmartphone;
}

export default function AdminFeedbackPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const selected =
    reports.find((report) => report.id === selectedId) || null;

  useEffect(() => {
    if (!selected) {
      setSignedUrls([]);
      setNotes("");
      return;
    }

    setNotes(selected.admin_notes || "");
    loadAttachments(selected.attachments || []);
  }, [selectedId]);

  async function loadReports() {
    setLoading(true);

    const { data, error } = await supabase
      .from("feedback_reports")
      .select(
        "*, profiles:user_id(username, full_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(250);

    if (error) {
      console.error(error);
      alert(error.message);
    }

    const next = (data || []) as unknown as FeedbackReport[];
    setReports(next);
    setSelectedId((current) => current || next[0]?.id || null);
    setLoading(false);
  }

  async function loadAttachments(paths: string[]) {
    if (!paths.length) {
      setSignedUrls([]);
      return;
    }

    const { data, error } = await supabase.storage
      .from("feedback")
      .createSignedUrls(paths, 3600);

    if (error) {
      console.error(error);
      setSignedUrls([]);
      return;
    }

    setSignedUrls(
      (data || [])
        .map((item: any) => item.signedUrl)
        .filter(Boolean)
    );
  }

  async function updateReport(
    reportId: string,
    patch: Record<string, any>
  ) {
    setSaving(true);

    const { error } = await supabase
      .from("feedback_reports")
      .update(patch)
      .eq("id", reportId);

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    setReports((current) =>
      current.map((report) =>
        report.id === reportId ? { ...report, ...patch } : report
      )
    );

    setSaving(false);
  }

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        report.title,
        report.description,
        report.profiles?.username,
        report.profiles?.full_name,
        report.platform,
        report.app_version,
        report.source_path,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [reports, statusFilter, search]);

  const counts = useMemo(
    () => ({
      new: reports.filter((r) => r.status === "new").length,
      reviewing: reports.filter((r) => r.status === "reviewing").length,
      resolved: reports.filter((r) => r.status === "resolved").length,
    }),
    [reports]
  );

  return (
    <AdminShell
      title="Feedback de testers"
      description="Errores, observaciones y sugerencias recibidas desde Alumni."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["new", "Nuevos", counts.new],
          ["reviewing", "Revisando", counts.reviewing],
          ["resolved", "Corregidos", counts.resolved],
        ].map(([value, label, count]) => (
          <button
            key={String(value)}
            onClick={() =>
              setStatusFilter(
                statusFilter === value ? "all" : String(value)
              )
            }
            className={`border-b px-1 pb-4 text-left transition ${
              statusFilter === value
                ? "border-[#6d7cff]"
                : "border-white/[0.07]"
            }`}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.13em] text-zinc-700">
              {label}
            </p>
            <p className="mt-1 text-2xl font-black tracking-[-0.04em]">
              {count}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex h-11 items-center border-b border-white/[0.08]">
        <Search size={16} className="text-zinc-700" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar reporte, usuario, versión..."
          className="h-full flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-700"
        />
        <span className="text-[11px] font-black text-zinc-700">
          {filtered.length}
        </span>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-zinc-600">
          Cargando feedback...
        </div>
      ) : (
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {filtered.length === 0 ? (
              <div className="py-14 text-center text-sm text-zinc-600">
                No hay reportes en este filtro.
              </div>
            ) : (
              filtered.map((report) => {
                const Icon = typeIcon(report.type);
                const active = report.id === selectedId;

                return (
                  <button
                    key={report.id}
                    onClick={() => setSelectedId(report.id)}
                    className={`flex w-full gap-3 px-2 py-4 text-left transition ${
                      active ? "bg-white/[0.035]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-500">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-black text-zinc-200">
                          {report.title}
                        </p>
                        {report.priority === "blocker" && (
                          <span className="shrink-0 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-red-400">
                            Bloquea
                          </span>
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-600">
                        {report.description}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-zinc-700">
                        <span>
                          @{report.profiles?.username || "usuario"}
                        </span>
                        <span>{report.platform || "Web"}</span>
                        <span>
                          {new Date(report.created_at).toLocaleString("es-SV")}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-[10px] font-black text-zinc-600">
                      {STATUS_LABELS[report.status] || report.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <aside className="h-fit lg:sticky lg:top-[112px]">
            {!selected ? (
              <div className="py-14 text-center text-sm text-zinc-700">
                Selecciona un reporte.
              </div>
            ) : (
              <div className="space-y-5">
                <div className="border-b border-white/[0.07] pb-5">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-zinc-700">
                    <span>{TYPE_LABELS[selected.type] || selected.type}</span>
                    <span>·</span>
                    <span>{selected.priority}</span>
                    <span>·</span>
                    <span>{selected.app_version || "sin versión"}</span>
                  </div>

                  <h2 className="mt-2 text-lg font-black tracking-[-0.03em]">
                    {selected.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {selected.description}
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  {selected.expected_behavior && (
                    <div>
                      <p className="font-black text-zinc-400">
                        Esperaba que ocurriera
                      </p>
                      <p className="mt-1 leading-5 text-zinc-600">
                        {selected.expected_behavior}
                      </p>
                    </div>
                  )}

                  {selected.steps_to_reproduce && (
                    <div>
                      <p className="font-black text-zinc-400">
                        Pasos para repetir
                      </p>
                      <p className="mt-1 whitespace-pre-wrap leading-5 text-zinc-600">
                        {selected.steps_to_reproduce}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="font-black text-zinc-400">Contexto</p>
                    <p className="mt-1 leading-5 text-zinc-600">
                      {selected.platform || "Web"} ·{" "}
                      {selected.source_path || "/"} ·{" "}
                      {selected.app_version || "sin versión"}
                    </p>
                  </div>
                </div>

                {signedUrls.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs font-black text-zinc-400">
                      <ImageIcon size={14} />
                      Capturas
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {signedUrls.map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.07]"
                        >
                          <img
                            src={url}
                            alt={`Captura ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 opacity-0 transition group-hover:opacity-100">
                            <ExternalLink size={13} />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-black text-zinc-400">
                    Estado
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {["new", "reviewing", "resolved", "closed"].map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() =>
                            updateReport(selected.id, { status })
                          }
                          disabled={saving}
                          className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                            selected.status === status
                              ? "border-[#6d7cff]/40 bg-[#6d7cff]/10 text-[#a8b0ff]"
                              : "border-white/[0.07] text-zinc-600 hover:text-zinc-300"
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-black text-zinc-400">
                    Nota interna
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Diagnóstico, decisión o detalle para el equipo..."
                    className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-xs leading-5 outline-none placeholder:text-zinc-700 focus:border-[#6d7cff]/40"
                  />
                  <button
                    onClick={() =>
                      updateReport(selected.id, {
                        admin_notes: notes.trim() || null,
                      })
                    }
                    disabled={saving}
                    className="mt-2 flex h-9 items-center gap-2 rounded-xl bg-white/[0.06] px-3 text-xs font-black text-zinc-300 transition hover:bg-white/[0.09]"
                  >
                    <CheckCircle2 size={14} />
                    Guardar nota
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </AdminShell>
  );
}
