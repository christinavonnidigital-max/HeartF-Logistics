import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "hf_theme";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export default function useTheme() {
  const [theme, setTheme] = useState<Theme>(getPreferredTheme);

  useEffect(() => {
    const el = document.documentElement;
    if (theme === "dark") el.classList.add("dark");
    else el.classList.remove("dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle } as const;
}
