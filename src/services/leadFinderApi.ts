type LeadFinderApiResponse<T> = {
  ok?: boolean;
  error?: string;
  detail?: string;
  cached?: boolean;
  reasonHints?: string[];
  results?: T[];
  warningCode?: string;
  warningMessage?: string;
};

type LeadFinderErrorCode =
  | "lead_finder_key_missing"
  | "lead_finder_key_restricted"
  | "lead_finder_failed"
  | string;

export class LeadFinderRequestError extends Error {
  status: number;
  code: LeadFinderErrorCode;
  detail: string;

  constructor(message: string, opts: { status: number; code?: LeadFinderErrorCode; detail?: string }) {
    super(message);
    this.name = "LeadFinderRequestError";
    this.status = opts.status;
    this.code = opts.code || "lead_finder_failed";
    this.detail = opts.detail || "";
  }
}

export const isLeadFinderServerConfigError = (err: unknown) => {
  const e = err as Partial<LeadFinderRequestError> | undefined;
  const code = String(e?.code || "");
  const message = String((e as any)?.message || err || "").toLowerCase();
  const detail = String(e?.detail || "").toLowerCase();
  return (
    code === "lead_finder_key_missing" ||
    code === "lead_finder_key_restricted" ||
    message.includes("not configured on the server") ||
    message.includes("server-side gemini_api_key") ||
    detail.includes("api_key_http_referrer_blocked")
  );
};

const toUserFacingError = (status: number, data: LeadFinderApiResponse<unknown>) => {
  const detail = String(data.detail || "");
  const error = String(data.error || "");
  const serverText = `${error} ${detail}`;

  if (serverText.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
    return "Lead Finder AI key is blocked by HTTP referrer policy. Configure a server-side GEMINI_API_KEY (not browser-referrer restricted) and restart the API server.";
  }

  if (serverText.toLowerCase().includes("not configured on the server")) {
    return "Lead Finder AI is not configured on the server. Set GEMINI_API_KEY in backend env and restart.";
  }

  if (status === 401 || status === 403) {
    return "Lead Finder AI authorization failed. Check backend Gemini API key restrictions and permissions.";
  }

  return error || detail || `Lead Finder request failed with status ${status}.`;
};

export async function searchLeadFinder<T>(payload: Record<string, any>): Promise<{
  results: T[];
  cached: boolean;
  reasonHints: string[];
  warningCode?: string;
  warningMessage?: string;
}> {
  const response = await fetch("/api/lead-finder-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: LeadFinderApiResponse<T> = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new LeadFinderRequestError(toUserFacingError(response.status, data), {
      status: response.status,
      code: String(data.error || "lead_finder_failed"),
      detail: String(data.detail || ""),
    });
  }

  return {
    results: Array.isArray(data.results) ? data.results : [],
    cached: Boolean(data.cached),
    reasonHints: Array.isArray(data.reasonHints) ? data.reasonHints : [],
    warningCode: data.warningCode ? String(data.warningCode) : undefined,
    warningMessage: data.warningMessage ? String(data.warningMessage) : undefined,
  };
}
