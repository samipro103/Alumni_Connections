"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    setIsAdmin(data?.role === "admin");
    setLoading(false);
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-zinc-600">Verificando permisos...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
          <ShieldAlert size={24} />
        </div>
        <h1 className="mt-5 text-xl font-black text-zinc-200">Acceso restringido</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">Esta sección solo está disponible para administradores de AlumniConnections.</p>
        <Link href="/feed" className="mt-5 inline-flex rounded-xl bg-white/[0.06] px-4 py-2.5 text-xs font-black text-zinc-300 transition hover:bg-white/[0.1]">
          Volver al inicio
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
