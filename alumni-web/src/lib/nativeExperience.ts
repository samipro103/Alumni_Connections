"use client";

import { Capacitor } from "@capacitor/core";

export type NativeHapticKind =
  | "selection"
  | "light"
  | "medium"
  | "success"
  | "warning"
  | "error";

export type AlumniSharePayload = {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
};

export type AlumniShareResult =
  | "shared"
  | "copied"
  | "cancelled"
  | "unavailable";

const THEME_COLORS: Record<
  string,
  string
> = {
  dark: "#090b0f",
  light: "#f4f6fa",
  pride: "#120b16",
};

export function isNativeAlumniApp() {
  return Capacitor.isNativePlatform();
}

function cancelledShare(
  error: unknown
) {
  const value =
    error &&
    typeof error === "object"
      ? (error as {
          name?: string;
          message?: string;
        })
      : null;

  const text =
    `${value?.name || ""} ${value?.message || ""}`
      .trim()
      .toLowerCase();

  return (
    text.includes("abort") ||
    text.includes("cancel") ||
    text.includes("dismiss")
  );
}

export async function nativeHaptic(
  kind: NativeHapticKind = "light"
) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const {
      Haptics,
      ImpactStyle,
      NotificationType,
    } = await import(
      "@capacitor/haptics"
    );

    if (
      kind === "success" ||
      kind === "warning" ||
      kind === "error"
    ) {
      const type =
        kind === "success"
          ? NotificationType.Success
          : kind === "warning"
          ? NotificationType.Warning
          : NotificationType.Error;

      await Haptics.notification({
        type,
      });
      return;
    }

    await Haptics.impact({
      style:
        kind === "medium"
          ? ImpactStyle.Medium
          : ImpactStyle.Light,
    });
  } catch {
    // APK antigua o dispositivo sin soporte:
    // la experiencia web sigue funcionando.
  }
}

export async function syncNativeTheme(
  theme: string
) {
  const color =
    THEME_COLORS[theme] ||
    THEME_COLORS.dark;

  if (
    typeof document !==
    "undefined"
  ) {
    const meta =
      document.querySelector<HTMLMetaElement>(
        'meta[name="theme-color"]'
      );

    meta?.setAttribute(
      "content",
      color
    );
  }

  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const {
      StatusBar,
      Style,
    } = await import(
      "@capacitor/status-bar"
    );

    await StatusBar.show();

    await StatusBar.setStyle({
      style:
        theme === "light"
          ? Style.Dark
          : Style.Light,
    });
  } catch {
    // Mantiene compatibilidad con APK anteriores.
  }
}

export async function shareAlumniContent(
  payload: AlumniSharePayload
): Promise<AlumniShareResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } =
        await import(
          "@capacitor/share"
        );

      const canShare =
        await Share.canShare();

      if (canShare.value) {
        void nativeHaptic(
          "selection"
        );

        await Share.share({
          title:
            payload.title,
          text:
            payload.text,
          url:
            payload.url,
          dialogTitle:
            payload.dialogTitle ||
            "Compartir",
        });

        return "shared";
      }
    } catch (error) {
      if (
        cancelledShare(error)
      ) {
        return "cancelled";
      }
    }
  }

  if (
    typeof navigator !==
      "undefined" &&
    typeof navigator.share ===
      "function"
  ) {
    try {
      await navigator.share({
        title:
          payload.title,
        text:
          payload.text,
        url:
          payload.url,
      });

      return "shared";
    } catch (error) {
      if (
        cancelledShare(error)
      ) {
        return "cancelled";
      }
    }
  }

  if (
    typeof navigator !==
      "undefined" &&
    navigator.clipboard &&
    payload.url
  ) {
    try {
      await navigator.clipboard.writeText(
        payload.url
      );

      return "copied";
    } catch {}
  }

  return "unavailable";
}

/* ALUMNI_3_5_0_NATIVE_EXPERIENCE */
