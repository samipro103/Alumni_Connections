"use client";

import {
  CloudOff,
  RefreshCw,
} from "lucide-react";
import styles from "./offline.module.css";

export default function OfflinePage() {
  return (
    <main className={styles.page}>
      <div className={styles.mark}>
        A.
      </div>

      <div className={styles.copy}>
        <span>
          Sin conexión
        </span>

        <h1>
          Alumni sigue aquí.
        </h1>

        <p>
          No pudimos cargar esta pantalla porque no hay conexión. Tus datos privados no se guardan como páginas offline; vuelve a intentar cuando tengas internet.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          window.location.reload()
        }
      >
        <RefreshCw size={16} />
        Reintentar
      </button>

      <div className={styles.line}>
        <CloudOff size={14} />
        La app se reconectará normalmente cuando vuelva la red.
      </div>
    </main>
  );
}

/* ALUMNI_2_0_OFFLINE_PAGE */
