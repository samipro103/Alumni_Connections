"use client";

import { useEffect, useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  BellRing,
  CheckCircle2,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  userId: string | null;
};

type Mode =
  | "hidden"
  | "install"
  | "loading"
  | "enable"
  | "enabled"
  | "denied"
  | "unsupported"
  | "error";

function isIOS() {
  const ua = navigator.userAgent || "";
  const iOSUA = /iPad|iPhone|iPod/i.test(ua);
  const iPadDesktopUA =
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return iOSUA || iPadDesktopUA;
}

function isStandalone() {
  const nav = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function supportsWebPush() {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }

  return output.buffer;
}

export default function WebPushBootstrap({
  userId,
}: Props) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");
  const [registrationReady, setRegistrationReady] = useState(false);

  const canShow = useMemo(
    () => Boolean(userId),
    [userId]
  );

  useEffect(() => {
    if (!canShow) {
      setMode("hidden");
      return;
    }

    if (Capacitor.isNativePlatform()) {
      setMode("hidden");
      return;
    }

    if (!isIOS()) {
      setMode("hidden");
      return;
    }

    if (!isStandalone()) {
      setMode("install");
      return;
    }

    if (!supportsWebPush()) {
      setMode("unsupported");
      return;
    }

    let cancelled = false;

    async function saveExistingSubscription(
      subscription: PushSubscription
    ) {
      if (!userId) return;

      const serialized = subscription.toJSON();
      const endpoint = serialized.endpoint || "";
      const p256dh = serialized.keys?.p256dh || "";
      const auth = serialized.keys?.auth || "";

      if (!endpoint || !p256dh || !auth) return;

      const { error } = await supabase.rpc(
        "register_web_push_subscription",
        {
          p_endpoint: endpoint,
          p_p256dh: p256dh,
          p_auth: auth,
          p_user_agent: navigator.userAgent,
        }
      );

      if (error) {
        console.warn(
          "Could not refresh existing Web Push subscription:",
          error
        );
      }
    }

    async function prepare() {
      setMode("loading");

      try {
        const registration =
          await navigator.serviceWorker.register(
            "/sw.js",
            { scope: "/" }
          );

        await navigator.serviceWorker.ready;

        if (cancelled) return;

        setRegistrationReady(true);

        const existing =
          await registration.pushManager.getSubscription();

        if (existing) {
          await saveExistingSubscription(existing);
        }

        if (Notification.permission === "denied") {
          setMode("denied");
        } else if (
          Notification.permission === "granted" &&
          existing
        ) {
          setMode("enabled");
        } else {
          setMode("enable");
        }
      } catch (error) {
        console.error(
          "PWA push preparation failed:",
          error
        );

        if (!cancelled) {
          setMode("error");
          setMessage(
            "No se pudo preparar las notificaciones."
          );
        }
      }

      try {
        const { data, error } =
          await supabase.functions.invoke(
            "push",
            {
              body: {
                action: "vapid_public_key",
              },
            }
          );

        if (error) throw error;

        const key =
          typeof data?.publicKey === "string"
            ? data.publicKey
            : "";

        if (!key) {
          throw new Error(
            "La función push no devolvió la clave pública VAPID."
          );
        }

        if (!cancelled) {
          setVapidPublicKey(key);
        }
      } catch (error) {
        console.error(
          "Could not load VAPID public key:",
          error
        );

        if (!cancelled) {
          setMessage(
            "Falta terminar la configuración VAPID en Supabase."
          );
        }
      }
    }

    void prepare();

    return () => {
      cancelled = true;
    };
  }, [canShow, userId]);

  async function saveSubscription(
    subscription: PushSubscription
  ) {
    if (!userId) return;

    const serialized = subscription.toJSON();

    const endpoint = serialized.endpoint || "";
    const p256dh = serialized.keys?.p256dh || "";
    const auth = serialized.keys?.auth || "";

    if (!endpoint || !p256dh || !auth) {
      throw new Error(
        "La suscripción Web Push está incompleta."
      );
    }

    const { error: rpcError } =
      await supabase.rpc(
        "register_web_push_subscription",
        {
          p_endpoint: endpoint,
          p_p256dh: p256dh,
          p_auth: auth,
          p_user_agent: navigator.userAgent,
        }
      );

    if (!rpcError) return;

    console.warn(
      "register_web_push_subscription RPC failed, using RLS upsert:",
      rpcError
    );

    const { error: fallbackError } =
      await supabase
        .from("web_push_subscriptions")
        .upsert(
          {
            user_id: userId,
            endpoint,
            p256dh,
            auth,
            user_agent: navigator.userAgent,
            platform: "ios-pwa",
            active: true,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,endpoint",
          }
        );

    if (fallbackError) {
      throw fallbackError;
    }
  }

  async function enableNotifications() {
    if (busy || !supportsWebPush()) return;

    if (!vapidPublicKey) {
      setMessage(
        "Todavía no está lista la clave VAPID. Revisa Supabase."
      );
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      // En iOS, el permiso debe pedirse como resultado directo
      // del toque del usuario.
      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permission === "denied") {
        setMode("denied");
        setMessage(
          "iPhone bloqueó las notificaciones para Alumni."
        );
        return;
      }

      if (permission !== "granted") {
        setMode("enable");
        setMessage("No se concedió el permiso.");
        return;
      }

      const registration =
        await navigator.serviceWorker.ready;

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToArrayBuffer(vapidPublicKey),
          });
      }

      await saveSubscription(subscription);

      setMode("enabled");
      setMessage(
        "Listo. Este iPhone ya puede recibir notificaciones de Alumni."
      );
    } catch (error: any) {
      console.error(
        "Could not enable Web Push:",
        error
      );

      setMode("error");
      setMessage(
        error?.message ||
          "No se pudieron activar las notificaciones."
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (busy) return;

    setBusy(true);
    setMessage(
      "La prueba llegará en unos segundos. Puedes salir de Alumni."
    );

    try {
      const { data, error } =
        await supabase.functions.invoke(
          "push",
          {
            body: {
              action: "test_web_push",
              delay_ms: 4000,
            },
          }
        );

      if (error) throw error;

      if (
        !data ||
        Number(data?.web?.sent || 0) < 1
      ) {
        throw new Error(
          data?.web?.errors?.[0] ||
            "Supabase no encontró una suscripción activa para este iPhone."
        );
      }

      setMessage(
        "Prueba enviada. Revisa la parte superior del iPhone, la pantalla bloqueada o el Centro de Notificaciones."
      );
    } catch (error: any) {
      console.error(
        "Web Push test failed:",
        error
      );

      setMessage(
        error?.message ||
          "No se pudo enviar la notificación de prueba."
      );
    } finally {
      setBusy(false);
    }
  }

  if (mode === "hidden") {
    return null;
  }

  if (mode === "install") {
    return (
      <PushNotice
        icon={<Share size={19} />}
        title="Activa Alumni en tu iPhone"
        message="Para recibir notificaciones gratis: en Safari toca Compartir → Agregar a pantalla de inicio. Después abre Alumni desde el nuevo icono."
        actionLabel={null}
        onAction={null}
      />
    );
  }

  if (mode === "unsupported") {
    return (
      <PushNotice
        icon={<Smartphone size={19} />}
        title="Actualiza tu iPhone"
        message="Este iPhone o navegador todavía no ofrece Web Push para Alumni."
        actionLabel={null}
        onAction={null}
      />
    );
  }

  if (mode === "denied") {
    return (
      <PushNotice
        icon={<BellRing size={19} />}
        title="Notificaciones bloqueadas"
        message="Ve a Ajustes del iPhone → Notificaciones → Alumni y permite las notificaciones."
        actionLabel={null}
        onAction={null}
      />
    );
  }

  if (mode === "enabled") {
    return (
      <PushNotice
        icon={<CheckCircle2 size={19} />}
        title="Notificaciones activadas"
        message={
          message ||
          "Este iPhone ya está registrado para recibir notificaciones de Alumni."
        }
        actionLabel={
          busy
            ? "Enviando..."
            : "Probar notificación"
        }
        onAction={
          busy ? null : sendTest
        }
      />
    );
  }

  return (
    <PushNotice
      icon={<BellRing size={19} />}
      title={
        mode === "loading"
          ? "Preparando notificaciones"
          : mode === "error"
            ? "No se pudo activar"
            : "Notificaciones en iPhone"
      }
      message={
        message ||
        (mode === "loading"
          ? "Alumni está preparando Web Push para este iPhone."
          : registrationReady
            ? "Toca el botón para permitir notificaciones normales de iPhone."
            : "Abre Alumni desde el icono de la pantalla de inicio.")
      }
      actionLabel={
        mode === "enable"
          ? busy
            ? "Activando..."
            : "Activar notificaciones"
          : null
      }
      onAction={
        mode === "enable" && !busy
          ? enableNotifications
          : null
      }
    />
  );
}

function PushNotice({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel: string | null;
  onAction:
    | (() => void | Promise<void>)
    | null;
}) {
  const [visible, setVisible] =
    useState(true);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-[78px] z-[1000] mx-auto max-w-[560px] overflow-hidden rounded-[22px] border border-white/[0.10] bg-[#0d1016]/95 shadow-[0_22px_70px_rgba(0,0,0,0.52)] backdrop-blur-2xl sm:bottom-5">
      <div className="flex items-start gap-3 px-4 py-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#6d7cff]/15 text-[#96a0ff]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-zinc-100">
            {title}
          </p>

          <p className="mt-1 text-[12px] leading-5 text-zinc-500">
            {message}
          </p>

          {actionLabel && onAction && (
            <button
              type="button"
              onClick={() => {
                void onAction();
              }}
              className="mt-3 h-9 rounded-xl bg-[#6d7cff] px-4 text-[11px] font-black text-white transition hover:bg-[#7b87ff]"
            >
              {actionLabel}
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => setVisible(false)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
