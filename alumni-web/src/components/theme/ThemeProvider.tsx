"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AlumniTheme =
  | "dark"
  | "light"
  | "pride";

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
  {
    id: "pride",
    name: "Pride",
    description:
      "Oscuro elegante con acento arcoíris de alto contraste.",
    swatches: [
      "#120b16",
      "#1b121f",
      "linear-gradient(90deg,#d93663,#b65312,#8a6c00,#167b43,#2365b1,#6741d9,#9b38b5)",
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
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    theme,
    setThemeState,
  ] =
    useState<AlumniTheme>(
      "dark"
    );

  useEffect(() => {
    const saved =
      localStorage.getItem(
        "alumni-theme"
      ) as
        | AlumniTheme
        | null;

    const valid =
      ALUMNI_THEMES.some(
        (item) =>
          item.id ===
          saved
      );

    const next =
      valid && saved
        ? saved
        : "dark";

    if (!valid && saved) {
      localStorage.setItem(
        "alumni-theme",
        "dark"
      );
    }

    setThemeState(
      next
    );

    applyTheme(next);
  }, []);

  function setTheme(
    next: AlumniTheme
  ) {
    setThemeState(
      next
    );

    localStorage.setItem(
      "alumni-theme",
      next
    );

    applyTheme(next);
  }

  const value =
    useMemo(
      () => ({
        theme,
        setTheme,
      }),
      [theme]
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

/* ALUMNI_1_4_2_THREE_THEMES */
