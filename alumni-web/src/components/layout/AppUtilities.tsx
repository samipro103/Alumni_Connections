"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, MessageSquareWarning, ShieldCheck } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AppUtilities() {
  const pathname = usePathname();
  const router = useRouter();
  const { access } = useAdminAccess();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("alumni_utilities_open");
    if (stored === "1") setOpen(true);
    else if (stored === "0") setOpen(false);
    else setOpen(window.innerWidth >= 1024);
    setReady(true);
  }, []);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    localStorage.setItem("alumni_utilities_open", next ? "1" : "0");
  }

  function openFeedback() {
    sessionStorage.setItem("alumni_feedback_from", pathname || "/");
    router.push("/feedback");
  }

  if (!ready) return null;

  return (
    <div className="fixed bottom-24 right-3 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {access.is_admin && !pathname.startsWith("/admin") && (
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#101318]/95 px-3 text-xs font-black text-zinc-400 shadow-2xl backdrop-blur-xl transition hover:border-[#6d7cff]/30 hover:text-white"
            >
              <ShieldCheck size={16} className="text-[#8d98ff]" />
              Administración
            </button>
          )}

          {pathname !== "/feedback" && (
            <button
              type="button"
              onClick={openFeedback}
              className="flex h-10 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#101318]/95 px-3 text-xs font-black text-zinc-500 shadow-2xl backdrop-blur-xl transition hover:border-[#6d7cff]/30 hover:text-zinc-200"
            >
              <MessageSquareWarning size={16} />
              Feedback
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={toggleOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#101318]/92 text-zinc-600 shadow-xl backdrop-blur-xl transition hover:text-zinc-200"
        aria-label={open ? "Ocultar accesos rápidos" : "Mostrar accesos rápidos"}
        title={open ? "Ocultar accesos" : "Mostrar accesos"}
      >
        {open ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
