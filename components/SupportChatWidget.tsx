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
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement | null>(null);

  const context = useMemo(
    () => ({
      route: typeof window !== "undefined" ? window.location.pathname : "",
      module,
      selectedEntity,
    }),
    [module, selectedEntity]
  );

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Unexpected response. Ensure Netlify functions are running (netlify dev).");
    }
  };

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

  async function ensureThread() {
    if (threadId) return threadId;

    const res = await fetch("/.netlify/functions/chat-thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ title: "Support" }),
    });

    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to create thread");

    setThreadId(data.threadId);
    return data.threadId as string;
  }

  async function loadMessages(tid: string) {
    const res = await fetch(`/.netlify/functions/chat-messages?threadId=${encodeURIComponent(tid)}`, {
      credentials: "include",
    });
    const data = await safeJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to load messages");
    setMessages(data.messages || []);
  }

  async function onOpen() {
    setOpen(true);
    setError(null);
    try {
      const tid = await ensureThread();
      await loadMessages(tid);
      if ((messages?.length || 0) === 0) {
        setMessages([
          {
            role: "assistant",
            content:
              "Hi, I’m your support agent. Tell me what you’re trying to do, or paste the error message you’re seeing.",
          },
        ]);
      }
    } catch (e: any) {
      setError(e?.message || "Could not open chat");
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setLoading(true);

    const optimistic: Msg = { role: "user", content: text };
    setMessages((m) => [...m, optimistic]);

    try {
      const tid = await ensureThread();

      const res = await fetch("/.netlify/functions/chat-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ threadId: tid, message: text, context }),
      });

      const data = await safeJson(res);
      if (!res.ok || data?.error) throw new Error(data?.error || "Send failed");

      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e?.message || "Send failed");
    } finally {
      setLoading(false);
    }
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
            <button
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
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
                    ? "ml-auto bg-orange-600 text-white"
                    : "mr-auto bg-white border border-slate-200 text-slate-900"
                )}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="mr-auto bg-white border border-slate-200 text-slate-600 rounded-2xl px-3 py-2 text-sm">
                Typing…
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-t border-rose-100">
              {error}
            </div>
          )}

          <div className="p-3 border-t border-slate-200 bg-white">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              placeholder="Type a message. Enter to send, Shift+Enter for a new line."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="mt-2 flex justify-between items-center">
              <div className="text-[11px] text-slate-500">Saved to Neon. Private to your account.</div>
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="h-9 px-3 rounded-xl bg-orange-600 text-white text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed hover:bg-orange-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportChatWidget;
