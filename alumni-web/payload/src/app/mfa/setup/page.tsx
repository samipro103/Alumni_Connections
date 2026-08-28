"use client";

import { useEffect } from "react";

export default function LegacyMfaSetupPage() {
  useEffect(() => {
    window.location.replace("/login?security=email");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090b0f] text-sm text-zinc-500">
      Alumni ahora verifica tu acceso por correo…
    </main>
  );
}

/* ALUMNI_2_4_0_DISABLE_TOTP_SETUP */
