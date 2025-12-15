import { useEffect, useMemo, useState } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "hf-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  const isDark = theme === "dark" || (theme === "system" && systemDark);
  root.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(KEY) as Theme | null;
    return saved ?? "system";
  });

  useEffect(() => {
    localStorage.setItem(KEY, theme);
    applyTheme(theme);

    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [theme]);

  return useMemo(() => ({ theme, setTheme }), [theme]);
}

export default useTheme;
