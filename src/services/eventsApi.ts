const STREAM_BASE = "/api";

export function openEventStream(token?: string) {
  const url = token ? `${STREAM_BASE}/stream?token=${encodeURIComponent(token)}` : `${STREAM_BASE}/stream`;
  return new EventSource(url);
}

export async function publishEvent(type: string, payload: any, token?: string) {
  const res = await fetch(`${STREAM_BASE}/events/publish${token ? `?token=${encodeURIComponent(token)}` : ""}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? {} : {}),
    },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "publish_failed");
  }
  return res.json();
}
