// Part 1: Shared API client with automatic logout on 401/403
// Goals:
// - Standardize fetch usage across the app
// - Force credentials: "include" (required for Netlify httpOnly cookie sessions)
// - Safe JSON parsing (won't crash on empty/non-JSON responses)
// - Timeout support (prevents "hanging" UI)
// - Auto-call onUnauthorized (logout) on 401/403

export type ApiError = {
  name: "ApiError";
  status: number;
  message: string;
  body?: unknown;
};

function makeApiError(status: number, message: string, body?: unknown): ApiError {
  return { name: "ApiError", status, message, body };
}

async function readJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type ApiFetchOptions = RequestInit & {
  timeoutMs?: number;
  onUnauthorized?: () => void | Promise<void>;
};

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    timeoutMs = 12_000,
    onUnauthorized,
    headers,
    credentials,
    ...rest
  } = options;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...rest,
      // Netlify Functions cookie session requires this:
      credentials: credentials ?? "include",
      headers: { ...(headers ?? {}) },
      signal: controller.signal,
    });

    // Treat both 401 and 403 as "not authorized to continue"
    if (res.status === 401 || res.status === 403) {
      try {
        await onUnauthorized?.();
      } catch {
        // ignore
      }
      throw makeApiError(res.status, "Unauthorized");
    }

    const body = await readJsonSafe(res);

    if (!res.ok) {
      const msg =
        (typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof (body as any).error === "string")
          ? (body as any).error
          : `Request failed (${res.status})`;

      throw makeApiError(res.status, msg, body);
    }

    return body as T;
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw makeApiError(408, "Request timed out");
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}
