"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  nativeHaptic,
  syncNativeTheme,
} from "@/lib/nativeExperience";

export type AlumniTheme =
  | "dark"
  | "light";

export const ALUMNI_THEMES: Array<{
  id: AlumniTheme;
  name: string;
  description: string;
  swatches: string[];
}> = [
  {
    id: "dark",
    name: "Oscuro",
    description:
      "Oscuro profesional, alto contraste y cómodo para uso prolongado.",
    swatches: [
      "#090b0f",
      "#101318",
      "#7f8cff",
    ],
  },
  {
    id: "light",
    name: "Claro",
    description:
      "Claro limpio, sobrio y con contraste reforzado.",
    swatches: [
      "#f4f6fa",
      "#ffffff",
      "#5267e8",
    ],
  },
];

interface ThemeContextValue {
  theme: AlumniTheme;
  setTheme: (
    theme: AlumniTheme
  ) => void;
}

const ThemeContext =
  createContext<ThemeContextValue | null>(
    null
  );

const themeListeners =
  new Set<() => void>();

function isAlumniTheme(
  value: unknown
): value is AlumniTheme {
  return ALUMNI_THEMES.some(
    (item) =>
      item.id === value
  );
}

function getBrowserTheme(): AlumniTheme {
  if (
    typeof document ===
    "undefined"
  ) {
    return "dark";
  }

  const domTheme =
    document.documentElement
      .dataset.theme;

  if (
    isAlumniTheme(
      domTheme
    )
  ) {
    return domTheme;
  }

  const saved =
    localStorage.getItem(
      "alumni-theme"
    );

  return isAlumniTheme(saved)
    ? saved
    : "dark";
}

function getServerTheme(): AlumniTheme {
  return "dark";
}

function subscribeTheme(
  listener: () => void
) {
  themeListeners.add(
    listener
  );

  return () => {
    themeListeners.delete(
      listener
    );
  };
}

function emitThemeChange() {
  themeListeners.forEach(
    (listener) =>
      listener()
  );
}

function applyTheme(
  theme: AlumniTheme
) {
  const root =
    document.documentElement;

  root.dataset.theme =
    theme;

  root.style.colorScheme =
    theme === "light"
      ? "light"
      : "dark";

  /*
   * Mantiene también la barra del navegador/PWA
   * alineada con el tema visual de ALUMNI.
   */
  const themeColor =
    theme === "light"
      ? "#f4f6fa"
      : "#090b0f";

  document
    .querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    )
    ?.setAttribute(
      "content",
      themeColor
    );

  void syncNativeTheme(
    theme
  );
}

function persistTheme(
  theme: AlumniTheme
) {
  localStorage.setItem(
    "alumni-theme",
    theme
  );

  applyTheme(theme);
  emitThemeChange();
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme =
    useSyncExternalStore<AlumniTheme>(
      subscribeTheme,
      getBrowserTheme,
      getServerTheme
    );

  useEffect(() => {
    /*
     * layout.tsx ya establece data-theme antes de hidratar.
     * Aquí completamos la sincronización con theme-color
     * y la capa nativa sin forzar un setState post-mount.
     */
    applyTheme(theme);
  }, [theme]);

  const setTheme =
    useCallback(
      (
        next: AlumniTheme
      ) => {
        persistTheme(next);

        void nativeHaptic(
          "selection"
        );
      },
      []
    );

  const value =
    useMemo<ThemeContextValue>(
      () => ({
        theme,
        setTheme,
      }),
      [
        theme,
        setTheme,
      ]
    );

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context =
    useContext(
      ThemeContext
    );

  if (!context) {
    throw new Error(
      "useTheme debe usarse dentro de ThemeProvider"
    );
  }

  return context;
}

/* ALUMNI_THEME_1_4_3_DARK_LIGHT_FEED_STORIES */

/* ALUMNI_3_5_0_NATIVE_EXPERIENCE */

/* ALUMNI_STORIES_THEME_1_4_4B_CLEAN_PUBLISH_DUAL_THEME */

/* ALUMNI_INTERNAL_UI_1_0_DARK_LIGHT_CLEAN */