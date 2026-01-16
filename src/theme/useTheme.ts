import { useEffect, useMemo, useState } from "react";

export type Theme = "system" | "light" | "dark";
const KEY = "hf-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  // Force light mode; never apply the dark class
  root.classList.remove("dark");
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // Persist light mode so future loads stay light
    try {
      localStorage.setItem(KEY, "light");
    } catch {
      // ignore storage errors
    }
    applyTheme("light");
  }, [theme]);

  // Expose theme state, but we always apply light on effect
  return useMemo(() => ({ theme, setTheme }), [theme]);
}

export default useTheme;
