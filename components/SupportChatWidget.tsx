import React, { useEffect, useMemo, useRef, useState } from "react";

type Msg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

const cx = (...a: Array<string | false | undefined>) => a.filter(Boolean).join(" ");

export const SupportChatWidget: React.FC<{
  module?: string;
  selectedEntity?: { type: string; id: string | number } | null;
}> = ({ module = "App", selectedEntity = null }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const context = useMemo(
    () => ({
      route: typeof window !== "undefined" ? window.location.pathname : "",
      module,
      selectedEntity,
    }),
    [module, selectedEntity]
  );

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [open]);

  useEffect(() => {
    if (messages.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length]);

  function onOpen() {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "Hi, I’m your support agent. Paste an error message or tell me what you’re trying to do.",
        },
      ]);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);

    const optimistic: Msg = { role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);

    // Offline echo/assistant
    const reply = [
      "I’m running in offline mode (Netlify functions removed).",
      "Here’s what I got from you:",
      `"${text}"`,
      `Context: ${context.module || "App"} ${context.route || ""}`,
      "If you need deeper help, share steps to reproduce and I’ll suggest next actions.",
    ].join("\n");

    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", content: reply, created_at: new Date().toISOString() }]);
      setLoading(false);
    }, 300);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      <button
        onClick={() => (open ? setOpen(false) : onOpen())}
        className={cx(
          "fixed bottom-5 right-5 z-50 h-12 px-4 rounded-full shadow-lg border",
          "bg-white text-slate-900 border-slate-200 hover:bg-slate-50 transition",
          "flex items-center gap-2 font-semibold"
        )}
        aria-label="Open support chat"
      >
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        Support
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900">Support agent</div>
              <div className="text-xs text-slate-500">
                Context: {module} • {context.route}
              </div>
            </div>
            <button className="text-xs font-semibold text-slate-600 hover:text-slate-900" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div ref={listRef} className="h-[340px] overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, idx) => (
              <div
                key={m.id || idx}
                className={cx(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "ml-auto bg-orange-500 text-white"
                    : "mr-auto bg-white text-slate-900 border border-slate-200"
                )}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-3 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ask a quick question…"
              disabled={loading}
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="text-xs text-slate-500">Offline assistant (no Netlify backend)</div>
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
