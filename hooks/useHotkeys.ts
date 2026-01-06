import { useEffect } from "react";

type Hotkey = {
  combo: string; // e.g., "g d", "ctrl k"
  onTrigger: () => void;
};

const normalize = (e: KeyboardEvent) => {
  const keys = [];
  if (e.ctrlKey) keys.push("ctrl");
  if (e.metaKey) keys.push("meta");
  if (e.altKey) keys.push("alt");
  if (e.shiftKey) keys.push("shift");
  keys.push(e.key.toLowerCase());
  return keys.join(" ");
};

export function useHotkeys(hotkeys: Hotkey[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let seq: string[] = [];
    const timer = { id: 0 as any };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const isTyping =
        t?.tagName === "INPUT" || t?.tagName === "TEXTAREA" || (t as any)?.isContentEditable;
      if (isTyping) return;

      const key = normalize(e);

      for (const hk of hotkeys) {
        if (hk.combo.includes(" ") && hk.combo.split(" ").length <= 2 && hk.combo === key) {
          e.preventDefault();
          hk.onTrigger();
          return;
        }
      }

      seq.push(e.key.toLowerCase());
      clearTimeout(timer.id);
      timer.id = setTimeout(() => (seq = []), 700);

      const seqStr = seq.join(" ");
      for (const hk of hotkeys) {
        if (hk.combo === seqStr) {
          hk.onTrigger();
          seq = [];
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkeys, enabled]);
}
