"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  CircleHelp,
  X,
} from "lucide-react";
import { Toaster, toast } from "sonner";

export type AlumniToastTone =
  | "success"
  | "error"
  | "warning"
  | "info";

export type AlumniConfirmTone =
  | "default"
  | "danger";

export type AlumniConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AlumniConfirmTone;
};

type AlumniUXContextValue = {
  notify: (
    message: string,
    tone?: AlumniToastTone,
    description?: string
  ) => void;
  confirm: (
    options: AlumniConfirmOptions
  ) => Promise<boolean>;
};

type DialogRequest = AlumniConfirmOptions & {
  resolve: (value: boolean) => void;
};

const AlumniUXContext =
  createContext<AlumniUXContextValue | null>(null);

function normalizedMessage(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value instanceof Error) {
    return value.message.trim();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function inferLegacyTone(message: string): AlumniToastTone {
  const text = message.toLowerCase();

  if (
    /(error|no se pudo|no pudimos|fall|incorrect|inválid|rechaz|deneg|expir|problema)/i.test(
      text
    )
  ) {
    return "error";
  }

  if (
    /(copiad|guardad|actualiz|eliminad|cread|enviad|publicad|listo|éxito|correctamente)/i.test(
      text
    )
  ) {
    return "success";
  }

  return "info";
}

function showToast(
  message: string,
  tone: AlumniToastTone = "info",
  description?: string
) {
  const text = normalizedMessage(message);
  if (!text) return;

  const options = {
    description:
      normalizedMessage(description) || undefined,
    duration: tone === "error" ? 4400 : 3200,
  };

  if (tone === "success") {
    toast.success(text, options);
    return;
  }

  if (tone === "error") {
    toast.error(text, options);
    return;
  }

  if (tone === "warning") {
    toast.warning(text, options);
    return;
  }

  toast.info(text, options);
}

export function AlumniUXProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [dialog, setDialog] =
    useState<DialogRequest | null>(null);

  const requestRef =
    useRef<DialogRequest | null>(null);
  const panelRef =
    useRef<HTMLDivElement>(null);
  const cancelRef =
    useRef<HTMLButtonElement>(null);
  const confirmRef =
    useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  const notify = useCallback(
    (
      message: string,
      tone: AlumniToastTone = "info",
      description?: string
    ) => {
      showToast(message, tone, description);
    },
    []
  );

  const settle = useCallback((value: boolean) => {
    const request = requestRef.current;
    if (!request) return;

    requestRef.current = null;
    setDialog(null);
    request.resolve(value);
  }, []);

  const confirm = useCallback(
    (options: AlumniConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        if (requestRef.current) {
          requestRef.current.resolve(false);
        }

        const request: DialogRequest = {
          ...options,
          resolve,
        };

        requestRef.current = request;
        setDialog(request);
      }),
    []
  );

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        requestRef.current.resolve(false);
        requestRef.current = null;
      }
    };
  }, []);

  /*
   * Puente de compatibilidad:
   * cualquier alert() legado de la app pasa a verse como un
   * toast Alumni sin tener que mantener el popup del navegador.
   */
  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (message?: unknown) => {
      const text = normalizedMessage(message);
      if (!text) return;

      showToast(
        text,
        inferLegacyTone(text)
      );
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  /*
   * Comportamiento app móvil:
   * - evita gesture zoom del navegador;
   * - evita double-tap zoom accidental.
   * El editor 4:5 usa Pointer Events propios y touch-action:none,
   * por lo que su pinch-to-zoom continúa funcionando.
   */
  useEffect(() => {
    const touchPhone =
      window.matchMedia(
        "(max-width: 900px) and (pointer: coarse)"
      ).matches ||
      (
        navigator.maxTouchPoints > 0 &&
        window.innerWidth <= 900
      );

    if (!touchPhone) return;

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const preventDoubleClickZoom = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener(
      "gesturestart",
      preventGesture,
      { passive: false }
    );
    document.addEventListener(
      "gesturechange",
      preventGesture,
      { passive: false }
    );
    document.addEventListener(
      "gestureend",
      preventGesture,
      { passive: false }
    );
    document.addEventListener(
      "dblclick",
      preventDoubleClickZoom,
      { passive: false }
    );

    return () => {
      document.removeEventListener(
        "gesturestart",
        preventGesture
      );
      document.removeEventListener(
        "gesturechange",
        preventGesture
      );
      document.removeEventListener(
        "gestureend",
        preventGesture
      );
      document.removeEventListener(
        "dblclick",
        preventDoubleClickZoom
      );
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const frame = window.requestAnimationFrame(() => {
      if (dialog.tone === "danger") {
        cancelRef.current?.focus();
      } else {
        confirmRef.current?.focus();
      }
    });

    function keyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        settle(false);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", keyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener(
        "keydown",
        keyDown
      );
      document.body.style.overflow =
        previousOverflow;
    };
  }, [dialog, settle]);

  const value = useMemo<AlumniUXContextValue>(
    () => ({
      notify,
      confirm,
    }),
    [notify, confirm]
  );

  const danger =
    dialog?.tone === "danger";

  return (
    <AlumniUXContext.Provider value={value}>
      {children}

      <Toaster
        position="top-center"
        closeButton={false}
        richColors={false}
        toastOptions={{
          duration: 3200,
        }}
      />

      {dialog && (
        <div
          className="alumni-ux-dialog-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              settle(false);
            }
          }}
        >
          <div
            ref={panelRef}
            className="alumni-ux-dialog"
            data-tone={
              danger ? "danger" : "default"
            }
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={
              dialog.description
                ? descriptionId
                : undefined
            }
          >
            <header className="alumni-ux-dialog-header">
              <div
                className="alumni-ux-dialog-icon"
                aria-hidden="true"
              >
                {danger ? (
                  <AlertTriangle size={21} />
                ) : (
                  <CircleHelp size={21} />
                )}
              </div>

              <button
                type="button"
                className="alumni-ux-dialog-close"
                onClick={() => settle(false)}
                aria-label="Cerrar"
              >
                <X size={19} />
              </button>
            </header>

            <div className="alumni-ux-dialog-copy">
              <h2 id={titleId}>
                {dialog.title}
              </h2>

              {dialog.description && (
                <p id={descriptionId}>
                  {dialog.description}
                </p>
              )}
            </div>

            <footer className="alumni-ux-dialog-actions">
              <button
                ref={cancelRef}
                type="button"
                className="is-secondary"
                onClick={() => settle(false)}
              >
                {dialog.cancelLabel ||
                  "Cancelar"}
              </button>

              <button
                ref={confirmRef}
                type="button"
                className={
                  danger
                    ? "is-danger"
                    : "is-primary"
                }
                onClick={() => settle(true)}
              >
                {dialog.confirmLabel ||
                  "Continuar"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </AlumniUXContext.Provider>
  );
}

export function useAlumniUX() {
  const context = useContext(AlumniUXContext);

  if (!context) {
    throw new Error(
      "useAlumniUX debe usarse dentro de AlumniUXProvider."
    );
  }

  return context;
}

/* ALUMNI_2_6_0_GLOBAL_UX_PROVIDER */
