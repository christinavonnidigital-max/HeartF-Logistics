import React from "react";
import { useTheme } from "../src/theme/useTheme";
import { SparklesIcon } from "./icons";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const next = () => {
    setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system");
  };

  return (
    <button
      type="button"
      onClick={next}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-muted"
      aria-label="Toggle theme"
      title={`Theme: ${theme}`}
    >
      <SparklesIcon className="h-4 w-4 text-slate-700" />
      <span className="capitalize text-slate-700">{theme}</span>
    </button>
  );
};
