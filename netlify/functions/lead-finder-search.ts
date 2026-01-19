import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

type IncomingBody =
  | {
      query?: string;
      geography?: string;
      industryFocus?: string;
      intentFocus?: string;
      minHeadcount?: string;
      forceRefresh?: boolean;

      excludeIndustries?: string[] | string;
      excludeKeywords?: string[] | string;
    }
  | {
      industry?: string;
      location?: string;
      keywords?: string;
      companySize?: string;

      excludeIndustries?: string[] | string;
      excludeKeywords?: string[] | string;

      forceRefresh?: boolean;
    };

type LeadProspect = {
  id: string;
  companyName: string;
  website?: string;
  location?: string;
  industry?: string;
  companySize?: string;
  summary?: string;
  intentSignal?: string;
  confidence?: number;
  sourceUrl?: string;
  verified?: boolean;
  sourcesCount?: number;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
};

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function safeParse(body: string | null): any {
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    return {};
  }
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function clamp01(n: any) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function hashId(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i);
  return Math.abs(hash >>> 0).toString(36);
}

function extractText(result: any): string {
  const candidates = result?.response?.candidates || result?.candidates || [];
  const text =
    candidates
      .map((c: any) => (c?.content?.parts || []).map((p: any) => p?.text || "").join("\n"))
      .join("\n")
      .trim() || "";
  return text;
}

function extractJson(text: string): any | null {
  if (!text) return null;

  const fenced = text.match(/```json([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  const slice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

function containsAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => n && h.includes(n.toLowerCase()));
}

function normalizeIncoming(body: IncomingBody) {
  const query = "query" in body ? norm((body as any).query) : "";
  const geography = "geography" in body ? norm((body as any).geography) : "";
  const industryFocus = "industryFocus" in body ? norm((body as any).industryFocus) : "";
  const intentFocus = "intentFocus" in body ? norm((body as any).intentFocus) : "";
  const minHeadcount = "minHeadcount" in body ? norm((body as any).minHeadcount) : "";

  const legacyIndustry = "industry" in body ? norm((body as any).industry) : "";
  const legacyLocation = "location" in body ? norm((body as any).location) : "";
  const legacyKeywords = "keywords" in body ? norm((body as any).keywords) : "";
  const legacyCompanySize = "companySize" in body ? norm((body as any).companySize) : "";

  const forceRefresh = Boolean((body as any).forceRefresh);

  const excludeIndustries = asArray((body as any).excludeIndustries);
  const excludeKeywords = asArray((body as any).excludeKeywords);

  const finalQuery =
    query ||
    [legacyIndustry, legacyLocation, legacyKeywords]
      .filter(Boolean)
      .join(" ")
      .trim();

  const finalGeography = geography || legacyLocation;
  const finalIndustryFocus = industryFocus || legacyIndustry;
  const finalIntentFocus = intentFocus || legacyKeywords;
  const finalMinHeadcount = minHeadcount || legacyCompanySize;

  return {
    query: finalQuery,
    geography: finalGeography,
    industryFocus: finalIndustryFocus,
    intentFocus: finalIntentFocus,
    minHeadcount: finalMinHeadcount,
    excludeIndustries,
    excludeKeywords,
    forceRefresh,
  };
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const cache = new Map<
  string,
  { createdAt: number; results: LeadProspect[]; reasonHints: string[] }
>();

function cacheKey(obj: any) {
  return JSON.stringify(obj);
}

const SYSTEM_INSTRUCTION = `
You are a B2B logistics lead prospector for HeartF Logistics.

Non-negotiable rules:
- You MUST use the googleSearch tool before answering.
- Do NOT fabricate facts, contacts, or companies.
- Every lead MUST include: companyName AND (website OR sourceUrl). Prefer both.
- If you cannot find a verified contact, leave contact fields blank.
- Provide sources: each lead should include a public sourceUrl that supports the company existence and fit.
- Follow exclusions strictly: do not include excluded industries or excluded keywords.

Return JSON only, no markdown, no commentary.
`.trim();

function buildPrompt(input: ReturnType<typeof normalizeIncoming>) {
  const excludeIndustries = input.excludeIndustries.length ? input.excludeIndustries.join(", ") : "(none)";
  const excludeKeywords = input.excludeKeywords.length ? input.excludeKeywords.join(", ") : "(none)";

  const schema = `Return JSON matching exactly:
{
  "leads": [
    {
      "companyName": "",
      "summary": "",
      "location": "",
      "industry": "",
      "companySize": "",
      "website": "",
      "intentSignal": "",
      "contact": { "name": "", "title": "", "email": "", "phone": "", "linkedin": "" },
      "sourceUrl": "",
      "confidence": 0.0,
      "sourcesCount": 0,
      "verified": false
    }
  ]
}`;

  return `
Task:
Find 4–8 real companies that are likely buyers of logistics/freight/fleet/transport services.

You must:
- Use live web sources (googleSearch).
- Enforce exclusions.
- Include a short evidence-based "intentSignal" (what indicates logistics need).

Search criteria:
- Query: ${input.query}
- Geography focus: ${input.geography || "(any)"}
- Industry focus: ${input.industryFocus || "(any)"}
- Intent focus: ${input.intentFocus || "(any)"}
- Company size / headcount: ${input.minHeadcount || "(any)"}

Exclusions (strict):
- Exclude industries: ${excludeIndustries}
- Exclude keywords: ${excludeKeywords}

Quality rules:
- summary: 1–2 sentences describing what they do and why they fit logistics.
- intentSignal: cite what you found (expansion, distribution, export, warehousing, procurement, etc.).
- confidence: 0.0–1.0
- verified: true only if evidence is strong and sources are credible.
- sourcesCount: number of distinct sources you used for that lead (estimate).

${schema}
Return JSON only.
`.trim();
}

function normalizeLeadList(payload: any, input: ReturnType<typeof normalizeIncoming>) {
  const reasonHints: string[] = [];
  const raw = Array.isArray(payload?.leads) ? payload.leads : [];
  const excludeIndustries = input.excludeIndustries.map((s) => s.toLowerCase());
  const excludeKeywords = input.excludeKeywords.map((s) => s.toLowerCase());

  const normalized: LeadProspect[] = [];

  for (let i = 0; i < raw.length; i++) {
    const lead = raw[i] || {};
    const companyName = norm(lead.companyName);
    const website = norm(lead.website);
    const sourceUrl = norm(lead.sourceUrl);
    const summary = norm(lead.summary);
    const location = norm(lead.location);
    const industry = norm(lead.industry);
    const companySize = norm(lead.companySize);
    const intentSignal = norm(lead.intentSignal);

    const haystack = `${companyName} ${summary} ${industry} ${intentSignal} ${website} ${sourceUrl}`.toLowerCase();

    if (!companyName) {
      reasonHints.push(`Dropped a lead with missing companyName.`);
      continue;
    }

    if (!website && !sourceUrl) {
      reasonHints.push(`Dropped "${companyName}" (missing website/sourceUrl).`);
      continue;
    }

    if (excludeIndustries.length && containsAny(industry, excludeIndustries)) {
      reasonHints.push(`Excluded "${companyName}" (industry matched exclusion: "${industry}").`);
      continue;
    }

    if (excludeKeywords.length && containsAny(haystack, excludeKeywords)) {
      reasonHints.push(`Excluded "${companyName}" (matched excluded keyword).`);
      continue;
    }

    const id = hashId(`${companyName}|${website}|${sourceUrl}|${i}`);

    const contact = lead.contact || {};
    normalized.push({
      id,
      companyName,
      website: website || undefined,
      location: location || undefined,
      industry: industry || undefined,
      companySize: companySize || undefined,
      summary: summary || undefined,
      intentSignal: intentSignal || undefined,
      confidence: clamp01(lead.confidence),
      sourceUrl: sourceUrl || (website ? website : undefined),
      verified: Boolean(lead.verified),
      sourcesCount: typeof lead.sourcesCount === "number" ? lead.sourcesCount : undefined,
      contact: {
        name: norm(contact.name) || undefined,
        title: norm(contact.title) || undefined,
        email: norm(contact.email) || undefined,
        phone: norm(contact.phone) || undefined,
        linkedin: norm(contact.linkedin) || undefined,
      },
    });
  }

  const seen = new Set<string>();
  const deduped: LeadProspect[] = [];
  for (const p of normalized) {
    const key = `${p.companyName.toLowerCase()}|${(p.website || "").toLowerCase()}|${(p.sourceUrl || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(p);
  }

  deduped.sort((a, b) => {
    const va = a.verified ? 1 : 0;
    const vb = b.verified ? 1 : 0;
    if (va !== vb) return vb - va;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });

  return { results: deduped, reasonHints };
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
    if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

    if (!ai) return json(500, { ok: false, error: "AI is not configured. Set GEMINI_API_KEY or API_KEY." });

    const body = safeParse(event.body || null) as IncomingBody;
    const input = normalizeIncoming(body);

    if (!input.query) {
      return json(400, { ok: false, error: "Missing query. Provide query or industry/location/keywords." });
    }

    const key = cacheKey({
      query: input.query,
      geography: input.geography,
      industryFocus: input.industryFocus,
      intentFocus: input.intentFocus,
      minHeadcount: input.minHeadcount,
      excludeIndustries: input.excludeIndustries,
      excludeKeywords: input.excludeKeywords,
    });

    if (!input.forceRefresh) {
      const hit = cache.get(key);
      if (hit && Date.now() - hit.createdAt <= CACHE_TTL_MS) {
        return json(200, { ok: true, cached: true, results: hit.results, reasonHints: hit.reasonHints });
      }
    }

    const prompt = buildPrompt(input);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 4096,
        tools: [{ googleSearch: {} }] as any,
      },
    } as any);

    const rawText = extractText(result);
    const payload = extractJson(rawText);

    if (!payload) {
      return json(500, { ok: false, error: "Model did not return valid JSON.", raw: rawText.slice(0, 2000) });
    }

    const { results, reasonHints } = normalizeLeadList(payload, input);

    cache.set(key, { createdAt: Date.now(), results, reasonHints });

    return json(200, { ok: true, cached: false, results, reasonHints });
  } catch (e: any) {
    return json(500, { ok: false, error: "Server error", detail: String(e?.message || e) });
  }
};
