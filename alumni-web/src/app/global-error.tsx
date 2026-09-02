"use client";
import { useEffect } from "react";
import RecoveryScreen from "@/components/stability/RecoveryScreen";
import { reportAppError } from "@/lib/observability";

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Alumni global recovery]", error);
    void reportAppError({
      kind: "global_boundary",
      severity: "fatal",
      error,
      digest: error.digest,
      source: "app/global-error.tsx",
      metadata: { component: "global-error-boundary" },
    });
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin:0, background:"#0b0d12", color:"#f4f4f5",
        fontFamily:"Arial, Helvetica, sans-serif" }}>
        <RecoveryScreen
          title="Alumni necesita recargar esta parte."
          description="Ocurrió un error general de la aplicación. Reintentar suele resolverlo sin afectar tu cuenta."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
/* ALUMNI_2_0_GLOBAL_ERROR_BOUNDARY */
/* ALUMNI_3_7_6_OBSERVABILITY */
