"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileText, MessageCircle, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminStatsPage() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    messages: 0,
    events: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    const [users, posts, messages, events] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("posts").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase.from("events").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      users: users.count || 0,
      posts: posts.count || 0,
      messages: messages.count || 0,
      events: events.count || 0,
    });

    setLoading(false);
  }

  const cards = [
    { label: "Usuarios", value: stats.users, icon: Users },
    { label: "Publicaciones", value: stats.posts, icon: FileText },
    { label: "Mensajes", value: stats.messages, icon: MessageCircle },
    { label: "Eventos", value: stats.events, icon: CalendarDays },
  ];

  return (
    <AdminShell title="Estadísticas" description="Una vista rápida del volumen actual de la plataforma.">
      {loading ? (
        <div className="py-14 text-center text-sm text-zinc-600">Calculando estadísticas...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-[22px] border border-white/[0.07] bg-[#101318]/95 p-5">
              <Icon size={18} className="text-[#8d98ff]" />
              <p className="mt-5 text-3xl font-black tracking-[-0.05em]">{value.toLocaleString("es-SV")}</p>
              <p className="mt-1 text-xs text-zinc-600">{label}</p>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
