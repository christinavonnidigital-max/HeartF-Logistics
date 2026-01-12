import type { Handler } from "@netlify/functions";
import { q } from "./_lib/db";
import { requireAuth, requireRole } from "./_lib/auth";
import { json, readJson } from "./_lib/http";

type LeadProspectingCriteria = {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: string;

  // NEW: lets UI bypass cache
  forceRefresh?: boolean;
};

type SearchItem = {
  title: string;
  link: string;
  snippet: string;
};

type LeadProspect = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  companySize?: string;
  industry?: string;
  summary?: string;
  intentSignal?: string;
  confidence?: number; // 0-100
  sourceUrl?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };

  // NEW: UI stability
  verified: boolean;
  sourcesCount: number;
};

const MAX_RESULTS = Math.max(1, Math.min(10, Number(process.env.LEAD_FINDER_MAX_RESULTS || "10")));
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// cache window
const CACHE_HOURS = Math.max(1, Math.min(48, Number(process.env.LEAD_FINDER_CACHE_HOURS || "6")));

function buildQuery(c: LeadProspectingCriteria) {
  const parts = [
    c.query?.trim(),
    c.industryFocus?.trim(),
    c.intentFocus?.trim(),
    c.geography?.trim(),
  ].filter(Boolean);

  return `${parts.join(" ")} (company OR ltd OR limited OR pvt OR services)`;
}

function makeCacheKey(searchQuery: string, criteria: LeadProspectingCriteria) {
  // stable key independent of insert order
  return JSON.stringify({
    q: searchQuery,
    geo: criteria.geography || "",
    ind: criteria.industryFocus || "",
    intent: criteria.intentFocus || "",
    size: criteria.minHeadcount || "",
  });
}

async function googleCseSearch(qry: string): Promise<SearchItem[]> {
  const key = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!key || !cx) throw new Error("SEARCH_NOT_CONFIGURED");

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", key);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", qry);
  url.searchParams.set("num", String(MAX_RESULTS));

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SEARCH_FAILED:${res.status}:${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .map((it: any) => ({
      title: String(it?.title || ""),
      link: String(it?.link || ""),
      snippet: String(it?.snippet || ""),
    }))
    .filter((it: SearchItem) => it.title && it.link);
}

function leadSchemaOpenApi() {
  return {
    type: "array",
    items: {
      type: "object",
      properties: {
        companyName: { type: "string" },
        website: { type: "string" },
        location: { type: "string" },
        companySize: { type: "string" },
        industry: { type: "string" },
        summary: { type: "string" },
        intentSignal: { type: "string" },
        confidence: { type: "integer", minimum: 0, maximum: 100 },
        sourceUrl: { type: "string" },
        contact: {
          type: "object",
          properties: {
            name: { type: "string" },
            title: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
          },
          additionalProperties: false,
        },
      },
      required: ["companyName", "sourceUrl", "confidence"],
      additionalProperties: false,
    },
  };
}

function buildExtractionPrompt(criteria: LeadProspectingCriteria, items: SearchItem[]) {
  const context = items
    .map((it, idx) => {
      const snip = it.snippet?.replace(/\s+/g, " ").trim();
      return `#${idx + 1}
title: ${it.title}
url: ${it.link}
snippet: ${snip}`;
    })
    .join("\n\n");

  return `
You are extracting business lead candidates ONLY from the provided search results.
Rules:
- Do NOT invent companies, websites, people, emails, phone numbers, or addresses.
- Every lead MUST be supported by at least one provided result.
- sourceUrl MUST exactly match one of the provided urls.
- If information is unknown from snippets, omit the field.
- Prefer official sites (company domain) over directories when possible.
- Deduplicate by company website/domain.

User criteria:
- query: ${criteria.query || ""}
- geography: ${criteria.geography || ""}
- industryFocus: ${criteria.industryFocus || ""}
- intentFocus: ${criteria.intentFocus || ""}
- minHeadcount: ${criteria.minHeadcount || ""}

Search results (evidence):
${context}

Return a JSON array of leads matching the schema.
`.trim();
}

async function geminiExtractLeads(criteria: LeadProspectingCriteria, items: SearchItem[]): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const prompt = buildExtractionPrompt(criteria, items);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: leadSchemaOpenApi(),
      temperature: 0.2,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GEMINI_FAILED:${res.status}:${text.slice(0, 250)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  }
}

function normalizeAndGuard(items: SearchItem[], leads: any[]): LeadProspect[] {
  const allowedUrls = new Set(items.map((i) => i.link));
  const now = Date.now();

  return leads
    .map((l, idx) => {
      const companyName = String(l.companyName || "").trim();
      const sourceUrl = String(l.sourceUrl || "").trim();
      const confidence = Number(l.confidence ?? 50);

      if (!companyName || !sourceUrl || !allowedUrls.has(sourceUrl)) return null;

      const website = l.website ? String(l.website).trim() : undefined;
      const location = l.location ? String(l.location).trim() : undefined;
      const companySize = l.companySize ? String(l.companySize).trim() : undefined;
      const industry = l.industry ? String(l.industry).trim() : undefined;
      const summary = l.summary ? String(l.summary).trim() : undefined;
      const intentSignal = l.intentSignal ? String(l.intentSignal).trim() : undefined;

      const contact =
        l.contact && typeof l.contact === "object"
          ? {
              name: l.contact.name ? String(l.contact.name).trim() : undefined,
              title: l.contact.title ? String(l.contact.title).trim() : undefined,
              email: l.contact.email ? String(l.contact.email).trim() : undefined,
              phone: l.contact.phone ? String(l.contact.phone).trim() : undefined,
            }
          : undefined;

      const conf = Math.max(0, Math.min(100, Math.round(confidence)));
      const hasContact = Boolean(contact?.email || contact?.phone);

      return {
        id: `lf_${now}_${idx + 1}`,
        companyName,
        sourceUrl,
        confidence: conf,
        website,
        location,
        companySize,
        industry,
        summary,
        intentSignal,
        contact,
        verified: hasContact,      // only true if contact exists (verification can upgrade later)
        sourcesCount: 1,           // each lead has at least 1 sourceUrl from CSE
      } as LeadProspect;
    })
    .filter(Boolean) as LeadProspect[];
}

function reasonHintsForEmpty(criteria: LeadProspectingCriteria) {
  const hints: string[] = [];
  if (criteria.minHeadcount) hints.push("Try removing company size.");
  if (criteria.intentFocus) hints.push("Try removing intent focus or using fewer keywords.");
  if (criteria.geography) hints.push("Try a broader location (country instead of city).");
  hints.push("Try adding 'Pvt Ltd' or 'services' to the query.");
  return hints;
}

async function loadCachedResults(orgId: string, searchId: string) {
  const r = await q<any>(
    `select id, company_name, website, location, summary, confidence, contact, source_url
     from lead_finder_results
     where org_id = $1 and search_id = $2
     order by confidence desc
     limit 100`,
    [orgId, searchId]
  );

  const mapped: LeadProspect[] = r.rows.map((x: any, idx: number) => {
    const contact = x.contact && typeof x.contact === "object" ? x.contact : {};
    const hasContact = Boolean(contact?.email || contact?.phone);
    return {
      id: String(x.id || `cached_${idx}`),
      companyName: String(x.company_name || ""),
      website: x.website || undefined,
      location: x.location || undefined,
      summary: x.summary || undefined,
      confidence: Math.round(Number(x.confidence ?? 50)),
      contact,
      sourceUrl: x.source_url || undefined,
      verified: hasContact,
      sourcesCount: x.source_url ? 1 : 0,
    };
  });

  return mapped;
}

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    requireRole(a, ["admin", "ops_manager", "dispatcher"]);

    const criteria = readJson<LeadProspectingCriteria>(event);
    const query = (criteria.query || "").trim();
    if (!query) return json(400, { error: "Missing query" });

    const mode = (process.env.LEAD_FINDER_MODE || "grounded").toLowerCase();
    const searchQuery = buildQuery(criteria);
    const cacheKey = makeCacheKey(searchQuery, criteria);
    const forceRefresh = Boolean(criteria.forceRefresh);

    // 1) Cache lookup: ONLY return cached if it has results
    if (!forceRefresh) {
      try {
        const cached = await q<{ id: string }>(
          `select id
           from lead_finder_searches
           where org_id = $1
             and query = $2
             and criteria->>'cacheKey' = $3
             and created_at > now() - ($4 || ' hours')::interval
           order by created_at desc
           limit 1`,
          [a.orgId, searchQuery, cacheKey, String(CACHE_HOURS)]
        );

        if (cached.rowCount === 1) {
          const cachedId = cached.rows[0].id;
          const cachedResults = await loadCachedResults(a.orgId, cachedId);

          // IMPORTANT: do not serve cached empty results
          if (cachedResults.length > 0) {
            return json(200, { ok: true, searchId: cachedId, results: cachedResults, cached: true });
          }
        }
      } catch {
        // ignore cache errors, fall through to fresh search
      }
    }

    // 2) Insert search record for this run (with cacheKey)
    let searchId: string | null = null;
    try {
      const ins = await q<{ id: string }>(
        `insert into lead_finder_searches(org_id, user_id, query, criteria)
         values ($1,$2,$3,$4)
         returning id`,
        [a.orgId, a.userId, searchQuery, JSON.stringify({ ...criteria, cacheKey })]
      );
      searchId = ins.rows[0]?.id || null;
    } catch {
      // optional
    }

    // 3) Grounding: Google search
    let items: SearchItem[] = [];
    try {
      items = await googleCseSearch(searchQuery);
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg === "SEARCH_NOT_CONFIGURED") {
        return json(500, { error: "Search provider not configured (GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX missing)" });
      }
      return json(500, { error: "Search failed" });
    }

    if (!items.length) {
      return json(200, {
        ok: true,
        searchId,
        results: [],
        cached: false,
        reasonHints: reasonHintsForEmpty(criteria),
      });
    }

    // 4) Extract leads
    let extracted: any[] = [];
    if (mode === "grounded") {
      try {
        extracted = await geminiExtractLeads(criteria, items);
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (msg === "GEMINI_NOT_CONFIGURED") {
          return json(500, { error: "Gemini not configured (GEMINI_API_KEY missing)" });
        }
        return json(500, { error: "AI extraction failed" });
      }
    } else {
      extracted = items.map((it) => ({
        companyName: it.title,
        sourceUrl: it.link,
        confidence: 40,
        summary: it.snippet,
      }));
    }

    let results = normalizeAndGuard(items, extracted);

    // 5) Persist results (optional)
    if (searchId) {
      try {
        for (const r of results) {
          await q(
            `insert into lead_finder_results
              (org_id, search_id, company_name, website, location, summary, confidence, contact, source_url)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
            [
              a.orgId,
              searchId,
              r.companyName || null,
              r.website || null,
              r.location || null,
              r.summary || null,
              r.confidence ?? 50,
              JSON.stringify(r.contact || {}),
              r.sourceUrl || null,
            ]
          );
        }
      } catch {
        // optional
      }
    }

    // If empty, return hints so UI is never "blank"
    if (results.length === 0) {
      return json(200, {
        ok: true,
        searchId,
        results: [],
        cached: false,
        reasonHints: reasonHintsForEmpty(criteria),
      });
    }

    return json(200, { ok: true, searchId, results, cached: false });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};
