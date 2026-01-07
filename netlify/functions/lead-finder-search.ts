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
  confidence?: number;
  sourceUrl?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
};

const MAX_RESULTS = Math.max(1, Math.min(10, Number(process.env.LEAD_FINDER_MAX_RESULTS || "10")));
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function buildQuery(c: LeadProspectingCriteria) {
  const parts = [
    c.query?.trim(),
    c.industryFocus?.trim(),
    c.intentFocus?.trim(),
    c.geography?.trim(),
  ].filter(Boolean);

  return `${parts.join(" ")} (company OR ltd OR limited OR pvt OR services)`;
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

async function geminiExtractLeads(criteria: LeadProspectingCriteria, items: SearchItem[]): Promise<Omit<LeadProspect, "id">[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const prompt = buildExtractionPrompt(criteria, items);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    GEMINI_MODEL
  )}:generateContent`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: leadSchemaOpenApi(),
      temperature: 0.2,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GEMINI_FAILED:${res.status}:${text.slice(0, 250)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return [];

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) return [];
  return parsed;
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

      return {
        id: `lf_${now}_${idx + 1}`,
        companyName,
        sourceUrl,
        confidence: Math.max(0, Math.min(100, Math.round(confidence))),
        website,
        location,
        companySize,
        industry,
        summary,
        intentSignal,
        contact,
      } as LeadProspect;
    })
    .filter(Boolean) as LeadProspect[];
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

    let searchId: string | null = null;
    try {
      const ins = await q<{ id: string }>(
        `insert into lead_finder_searches(org_id, user_id, query, criteria)
         values ($1,$2,$3,$4)
         returning id`,
        [a.orgId, a.userId, searchQuery, JSON.stringify(criteria)]
      );
      searchId = ins.rows[0]?.id || null;
    } catch {
      // optional logging only
    }

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

    if (!items.length) return json(200, { ok: true, searchId, results: [] });

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

    const results = normalizeAndGuard(items, extracted);

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
        // optional persistence
      }
    }

    return json(200, { ok: true, searchId, results });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHENTICATED") return json(401, { error: "Unauthenticated" });
    if (msg === "FORBIDDEN") return json(403, { error: "Forbidden" });
    return json(500, { error: "Server error" });
  }
};

