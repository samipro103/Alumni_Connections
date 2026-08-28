"use client";

import {
  Home,
  RefreshCw,
} from "lucide-react";
import styles from "./RecoveryScreen.module.css";

export default function RecoveryScreen({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        A.
      </div>

      <div className={styles.copy}>
        <span>
          Recuperación
        </span>

        <h1>{title}</h1>

        <p>
          {description}
        </p>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          Reintentar
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href =
              "/feed";
          }}
        >
          <Home size={16} />
          Ir al inicio
        </button>
      </div>

      <p className={styles.note}>
        Si acaba de publicarse una nueva versión, Alumni intentará cargar los archivos actuales al reintentar.
      </p>
    </main>
  );
}

/* ALUMNI_2_0_RECOVERY_SCREEN */
