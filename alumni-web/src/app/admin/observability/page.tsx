"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { supabase } from "@/lib/supabase";

type ErrorEvent = {
  id:string; created_at:string; fingerprint:string; kind:string; severity:string;
  message:string; stack?:string|null; route?:string|null; source?:string|null;
  app_version?:string|null; platform?:string|null; browser?:string|null;
  device_type?:string|null; user_id?:string|null; anonymous_id?:string|null;
};

export default function ObservabilityPage() {
  const { can, loading: accessLoading } = useAdminAccess();
  const [rows,setRows]=useState<ErrorEvent[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");

  async function load() {
    setLoading(true);
    const { data,error }=await supabase.from("app_error_events")
      .select("*").order("created_at",{ascending:false}).limit(500);
    if (error) console.error("Observability:",error);
    setRows((data||[]) as ErrorEvent[]);
    setLoading(false);
  }

  useEffect(()=>{
    if (!accessLoading && can("manage_feedback")) void load();
    else if (!accessLoading) setLoading(false);
  },[accessLoading]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    if(!q)return rows;
    return rows.filter(r=>[
      r.message,r.route,r.kind,r.severity,r.platform,r.browser,r.app_version
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  },[rows,search]);

  const dayAgo=Date.now()-86400000;
  const day=rows.filter(r=>new Date(r.created_at).getTime()>=dayAgo);
  const unique=new Set(day.map(r=>r.fingerprint)).size;
  const fatal=day.filter(r=>r.severity==="fatal").length;
  const affected=new Set(day.map(r=>r.user_id||r.anonymous_id).filter(Boolean)).size;

  if(!accessLoading && !can("manage_feedback")) {
    return <AdminShell title="Observabilidad"
      description="Errores automáticos y salud operativa de Alumni.">
      <div className="py-16 text-center text-sm text-zinc-600">
        No tienes permiso para consultar observabilidad.
      </div>
    </AdminShell>;
  }

  return <AdminShell title="Observabilidad"
    description="Errores automáticos, frecuencia, pantalla, versión y dispositivo.">
    <div className="grid gap-3 sm:grid-cols-4">
      {[
        ["Últimas 24 h",day.length],["Errores distintos",unique],
        ["Fatales",fatal],["Afectados",affected]
      ].map(([label,value])=>
        <div key={String(label)} className="border-b border-white/[0.07] pb-4">
          <p className="text-[11px] font-black uppercase tracking-[0.13em] text-zinc-700">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black">{value}</p>
        </div>
      )}
    </div>

    <input value={search} onChange={e=>setSearch(e.target.value)}
      placeholder="Buscar error, ruta, versión..."
      className="mt-6 h-11 w-full border-b border-white/[0.08] bg-transparent text-sm outline-none" />

    {loading ? <div className="py-16 text-center text-sm text-zinc-600">
      Cargando observabilidad...
    </div> :
    <div className="mt-5 divide-y divide-white/[0.06] border-y border-white/[0.06]">
      {filtered.map(r=><details key={r.id} className="py-4">
        <summary className="cursor-pointer list-none">
          <div className="flex justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-300">{r.message}</p>
              <p className="mt-1 text-xs text-zinc-700">
                {r.route||"sin ruta"} · {r.platform||"?"} · {r.browser||"?"}
              </p>
            </div>
            <span className="text-[10px] uppercase text-zinc-600">{r.severity}</span>
          </div>
        </summary>
        <div className="mt-4 grid gap-2 text-xs text-zinc-500">
          <p>Tipo: {r.kind}</p><p>Fuente: {r.source||"—"}</p>
          <p>Versión: {r.app_version||"—"} · Dispositivo: {r.device_type||"—"}</p>
          <p className="break-all font-mono text-[10px]">Fingerprint: {r.fingerprint}</p>
          {r.stack ? <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-[10px]">
            {r.stack}
          </pre>:null}
        </div>
      </details>)}
      {!filtered.length && <div className="py-14 text-center text-sm text-zinc-600">
        No hay errores en este filtro.
      </div>}
    </div>}
  </AdminShell>;
}
/* ALUMNI_3_7_6_OBSERVABILITY_ADMIN */
