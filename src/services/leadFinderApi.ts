type LeadFinderApiResponse<T> = {
  ok?: boolean;
  error?: string;
  detail?: string;
  cached?: boolean;
  reasonHints?: string[];
  results?: T[];
};

const asList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const norm = (value: unknown) => String(value || "").trim();

const normalizeBrowserCriteria = (payload: Record<string, any>) => {
  const query = norm(payload.query);
  const geography = norm(payload.geography);
  const industryFocus = norm(payload.industryFocus);
  const intentFocus = norm(payload.intentFocus);
  const minHeadcount = norm(payload.minHeadcount);

  const legacyIndustry = norm(payload.industry);
  const legacyLocation = norm(payload.location);
  const legacyKeywords = norm(payload.keywords);
  const legacyCompanySize = norm(payload.companySize);

  return {
    query:
      query ||
      [legacyIndustry, legacyLocation, legacyKeywords]
        .filter(Boolean)
        .join(" ")
        .trim(),
    geography: geography || legacyLocation,
    industryFocus: industryFocus || legacyIndustry,
    intentFocus: intentFocus || legacyKeywords,
    minHeadcount: minHeadcount || legacyCompanySize,
  };
};

const containsAny = (haystack: string, needles: string[]) => {
  const h = String(haystack || "").toLowerCase();
  return needles.some((n) => n && h.includes(n.toLowerCase()));
};

export async function searchLeadFinder<T>(payload: Record<string, any>): Promise<{
  results: T[];
  cached: boolean;
  reasonHints: string[];
}> {
  const response = await fetch("/api/lead-finder-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: LeadFinderApiResponse<T> = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    const detail = String(data.detail || "");
    const blockedByReferrer = detail.includes("API_KEY_HTTP_REFERRER_BLOCKED");
    if (blockedByReferrer) {
      try {
        const { findPotentialLeads } = await import("../../services/geminiService");
        const criteria = normalizeBrowserCriteria(payload);
        const excludeIndustries = asList(payload.excludeIndustries).map((s) => s.toLowerCase());
        const excludeKeywords = asList(payload.excludeKeywords).map((s) => s.toLowerCase());
        const raw = await findPotentialLeads(criteria as any);

        const reasonHints: string[] = [];
        const filtered = (raw || []).filter((lead: any) => {
          const industry = norm(lead?.industry).toLowerCase();
          const haystack = [
            lead?.companyName,
            lead?.summary,
            lead?.intentSignal,
            lead?.website,
            lead?.sourceUrl,
            lead?.industry,
          ]
            .map((v) => norm(v).toLowerCase())
            .join(" ");

          if (excludeIndustries.length && containsAny(industry, excludeIndustries)) {
            reasonHints.push(`Excluded "${lead?.companyName || "lead"}" due to industry exclusion.`);
            return false;
          }
          if (excludeKeywords.length && containsAny(haystack, excludeKeywords)) {
            reasonHints.push(`Excluded "${lead?.companyName || "lead"}" due to keyword exclusion.`);
            return false;
          }
          return true;
        });

        return {
          results: filtered as T[],
          cached: false,
          reasonHints: reasonHints.slice(0, 20),
        };
      } catch {
        // fall through to original error
      }
    }

    const message =
      data.error ||
      data.detail ||
      `Lead Finder request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    results: Array.isArray(data.results) ? data.results : [],
    cached: Boolean(data.cached),
    reasonHints: Array.isArray(data.reasonHints) ? data.reasonHints : [],
  };
}
