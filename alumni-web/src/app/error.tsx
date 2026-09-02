"use client";
import { useEffect } from "react";
import RecoveryScreen from "@/components/stability/RecoveryScreen";
import { reportAppError } from "@/lib/observability";

export default function ErrorPage({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Alumni recovery]", error);
    void reportAppError({
      kind: "react_boundary",
      error,
      digest: error.digest,
      source: "app/error.tsx",
      metadata: { component: "route-error-boundary" },
    });
  }, [error]);

  return <RecoveryScreen
    title="Algo no cargó como debía."
    description="Tu sesión sigue intacta. Puedes volver a intentar esta pantalla sin perder el resto de Alumni."
    onRetry={reset}
  />;
}
/* ALUMNI_2_0_ROUTE_ERROR_BOUNDARY */
/* ALUMNI_3_7_6_OBSERVABILITY */
