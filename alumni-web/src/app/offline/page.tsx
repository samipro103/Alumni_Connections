"use client";

import {
  CheckCircle2,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import {
  useSyncExternalStore,
} from "react";
import styles from "./offline.module.css";

function subscribe(
  notify: () => void
) {
  window.addEventListener(
    "online",
    notify
  );

  window.addEventListener(
    "offline",
    notify
  );

  return () => {
    window.removeEventListener(
      "online",
      notify
    );

    window.removeEventListener(
      "offline",
      notify
    );
  };
}

function onlineSnapshot() {
  return navigator.onLine;
}

export default function OfflinePage() {
  const online =
    useSyncExternalStore(
      subscribe,
      onlineSnapshot,
      () => false
    );

  return (
    <main className={styles.page}>
      <div className={styles.mark}>
        A.
      </div>

      <div className={styles.copy}>
        <span>
          {online
            ? "Conexión disponible"
            : "Sin conexión"}
        </span>

        <h1>
          {online
            ? "La conexión volvió."
            : "Alumni sigue aquí."}
        </h1>

        <p>
          {online
            ? "Ya puedes volver a cargar Alumni. Tus datos privados se obtendrán nuevamente desde la red."
            : "No pudimos cargar esta pantalla porque no hay conexión. Tus páginas y datos privados no se guardan como contenido offline."}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          window.location.reload()
        }
      >
        <RefreshCw size={16} />
        {online
          ? "Volver a Alumni"
          : "Reintentar"}
      </button>

      <div className={styles.line}>
        {online ? (
          <CheckCircle2
            size={14}
          />
        ) : (
          <CloudOff
            size={14}
          />
        )}

        {online
          ? "La red está disponible otra vez."
          : "Los mensajes de texto compatibles con la cola offline se enviarán cuando vuelva la conexión."}
      </div>
    </main>
  );
}

/* ALUMNI_2_0_OFFLINE_PAGE */
/* ALUMNI_10_9_OFFLINE_STATUS */