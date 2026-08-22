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
  | "chill"
  | "pride"
  | "midnight"
  | "emerald"
  | "executive";

export const ALUMNI_THEMES: Array<{
  id: AlumniTheme;
  name: string;
  description: string;
  swatches: string[];
}> = [
  {
    id: "dark",
    name: "Dark",
    description: "El estilo oscuro actual de Alumni.",
    swatches: ["#090b0f", "#101318", "#6d7cff"],
  },
  {
    id: "light",
    name: "Light",
    description: "Claro, limpio y profesional.",
    swatches: ["#f4f6fa", "#ffffff", "#5267e8"],
  },
  {
    id: "chill",
    name: "Chill",
    description: "Azules suaves, frescos y relajados.",
    swatches: ["#edf6fa", "#f8fcff", "#38a6c4"],
  },
  {
    id: "pride",
    name: "Pride / LGTB",
    description: "Oscuro elegante con acentos arcoíris.",
    swatches: ["#120b16", "#1b121f", "linear-gradient(90deg,#ff4d6d,#ffad33,#ffd43b,#35c46a,#38a7ff,#9b5cff)"],
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Azul noche con acento eléctrico.",
    swatches: ["#07101d", "#0d1827", "#3da6ff"],
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Verde sobrio con sensación premium.",
    swatches: ["#07110e", "#0d1a16", "#31b879"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Grafito y dorado para un look corporativo.",
    swatches: ["#0e0e0f", "#171719", "#c9a85e"],
  },
];

interface ThemeContextValue {
  theme: AlumniTheme;
  setTheme: (theme: AlumniTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: AlumniTheme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme =
    theme === "light" || theme === "chill" ? "light" : "dark";
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<AlumniTheme>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("alumni-theme") as AlumniTheme | null;
    const valid = ALUMNI_THEMES.some((item) => item.id === saved);
    const next = valid && saved ? saved : "dark";

    setThemeState(next);
    applyTheme(next);
  }, []);

  function setTheme(theme: AlumniTheme) {
    setThemeState(theme);
    localStorage.setItem("alumni-theme", theme);
    applyTheme(theme);
  }

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }

  return context;
}
