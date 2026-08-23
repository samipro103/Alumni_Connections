"use client";

import { usePathname, useRouter } from "next/navigation";
import { MessageSquareWarning, ShieldCheck } from "lucide-react";
import { useAdminAccess } from "@/hooks/useAdminAccess";

export default function AppUtilities() {
  const pathname = usePathname();
  const router = useRouter();
  const { access } = useAdminAccess();

  function openFeedback() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("alumni_feedback_from", pathname || "/");
    }
    router.push("/feedback");
  }

  const hideFeedback = pathname === "/feedback";

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 lg:bottom-6 lg:right-6">
      {access.is_admin && !pathname.startsWith("/admin") && (
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="group flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#101318]/95 px-3.5 text-xs font-black text-zinc-400 shadow-2xl backdrop-blur-xl transition hover:border-[#6d7cff]/30 hover:text-white"
          title="Centro de administración"
        >
          <ShieldCheck size={17} className="text-[#8d98ff]" />
          <span className="hidden sm:inline">Administración</span>
        </button>
      )}

      {!hideFeedback && (
        <button
          type="button"
          onClick={openFeedback}
          className="group flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#101318]/95 px-3.5 text-xs font-black text-zinc-500 shadow-2xl backdrop-blur-xl transition hover:border-[#6d7cff]/30 hover:text-zinc-200"
          title="Reportar problema o sugerencia"
        >
          <MessageSquareWarning size={17} />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      )}
    </div>
  );
}
