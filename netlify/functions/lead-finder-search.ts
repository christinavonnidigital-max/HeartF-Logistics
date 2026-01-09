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
  confidence?: number; // 0-100
  sourceUrl?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  verified?: boolean;
  sourcesCount?: number;
  resultKey?: string;
};

const MAX_RESULTS = Math.max(1, Math.min(10, Number(process.env.LEAD_FINDER_MAX_RESULTS || "10")));
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const VERIFY_PAGES = (process.env.LEAD_FINDER_VERIFY_PAGES || "").toLowerCase() === "true";
const VERIFY_MAX = Math.max(0, Math.min(10, Number(process.env.LEAD_FINDER_VERIFY_MAX || "4")));
const FETCH_TIMEOUT_MS = Math.max(1500, Math.min(15000, Number(process.env.LEAD_FINDER_FETCH_TIMEOUT_MS || "6000")));
const FETCH_MAX_BYTES = Math.max(50_000, Math.min(500_000, Number(process.env.LEAD_FINDER_FETCH_MAX_BYTES || "200000")));

function buildQuery(c: LeadProspectingCriteria) {
  const parts = [c.query?.trim(), c.industryFocus?.trim(), c.intentFocus?.trim(), c.geography?.trim()].filter(Boolean);
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

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

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

function resultKeyFromLead(lead: { website?: string; sourceUrl?: string; companyName?: string }): string {
  const domain = domainFromUrl(lead.website) || domainFromUrl(lead.sourceUrl);
  if (domain) return `domain:${domain}`;
  const name = (lead.companyName || "").toLowerCase().replace(/\s+/g, " ").trim();
  return name ? `name:${name}` : "";
}

function domainFromUrl(input?: string): string | null {
  const u = safeUrl(input);
  if (!u) return null;
  return u.hostname.replace(/^www\./i, "").toLowerCase();
}

/* ----------------------------
   Verification helpers
---------------------------- */

function safeUrl(input?: string): URL | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u;
  } catch {
    return null;
  }
}

function guessWebsiteFromSource(sourceUrl?: string): string | undefined {
  const u = safeUrl(sourceUrl);
  if (!u) return undefined;
  return `${u.protocol}//${u.hostname}`;
}

function findContactUrl(base: URL): string[] {
  // Try common contact paths. Keep it small.
  const candidates = ["/contact", "/contact-us", "/about", "/company", "/support"];
  return candidates.map((p) => `${base.origin}${p}`);
}

async function fetchText(url: string): Promise<string | null> {
  const u = safeUrl(url);
  if (!u) return null;

  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(u.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ac.signal,
      headers: {
        "User-Agent": "HeartfledgeLeadFinder/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) return null;

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    if (!ct.includes("text/html") && !ct.includes("application/xhtml+xml")) return null;

    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text().catch(() => "");
      return htmlToText(text).slice(0, 50_000);
    }

    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      received += value.byteLength;
      if (received > FETCH_MAX_BYTES) break;
      chunks.push(value);
    }

    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = buf.toString("utf-8");
    return htmlToText(html).slice(0, 50_000);
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

function htmlToText(html: string): string {
  let s = html;

  // Remove scripts/styles
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");

  // Convert breaks/paragraphs to new lines
  s = s.replace(/<(br|br\/)\s*>/gi, "\n");
  s = s.replace(/<\/(p|div|section|article|li|h\d)>/gi, "\n");

  // Strip tags
  s = s.replace(/<[^>]+>/g, " ");

  // Decode a few common entities
  s = s.replace(/&nbsp;/g, " ");
  s = s.replace(/&amp;/g, "&");
  s = s.replace(/&lt;/g, "<");
  s = s.replace(/&gt;/g, ">");
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&quot;/g, '"');

  // Normalize whitespace
  s = s.replace(/[ \t]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

function verifySchema() {
  return {
    type: "object",
    properties: {
      verified: { type: "boolean" },
      website: { type: "string" },
      location: { type: "string" },
      summary: { type: "string" },
      contact: {
        type: "object",
        properties: {
          email: { type: "string" },
          phone: { type: "string" },
        },
        additionalProperties: false,
      },
      confidenceDelta: { type: "integer", minimum: -30, maximum: 30 },
    },
    required: ["verified", "confidenceDelta"],
    additionalProperties: false,
  };
}

async function geminiVerifyFromPageText(args: {
  companyName: string;
  website: string;
  pageText: string;
}): Promise<{
  verified: boolean;
  website?: string;
  location?: string;
  summary?: string;
  contact?: { email?: string; phone?: string };
  confidenceDelta: number;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_NOT_CONFIGURED");

  const prompt = `
You are verifying a business lead ONLY from the provided website text.
Rules:
- Do NOT invent any information.
- Only extract an email or phone if it appears in the text.
- If the text does not mention something, omit it.
- verified=true only if the text clearly describes a business matching the company name and looks like an official page.

Company name: ${args.companyName}
Website: ${args.website}

Website text (evidence):
${args.pageText}

Return JSON matching the schema.
`.trim();

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: verifySchema(),
      temperature: 0.1,
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
  if (!text) return { verified: false, confidenceDelta: 0 };

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/{[\s\S]*}/);
    if (!match) return { verified: false, confidenceDelta: 0 };
    parsed = JSON.parse(match[0]);
  }

  return parsed;
}

async function verifyLead(result: LeadProspect): Promise<LeadProspect> {
  const website = result.website || guessWebsiteFromSource(result.sourceUrl);
  const baseUrl = safeUrl(website);
  if (!baseUrl) return result;

  // Fetch homepage text
  const homeText = await fetchText(baseUrl.toString());
  if (!homeText) return result;

  // Fetch a likely contact/about page too (best effort)
  let extraText = "";
  for (const candidate of findContactUrl(baseUrl)) {
    const t = await fetchText(candidate);
    if (t && t.length > 200) {
      extraText = t;
      break;
    }
  }

  const combined = [homeText, extraText].filter(Boolean).join("\n\n").slice(0, 50_000);

  // Gemini verification pass
  const v = await geminiVerifyFromPageText({
    companyName: result.companyName,
    website: baseUrl.origin,
    pageText: combined,
  });

  if (!v || !v.verified) {
    // slight penalty if verification fails
    return { ...result, verified: false, confidence: Math.max(0, (result.confidence ?? 50) - 5) };
  }

  const nextConfidence = Math.max(0, Math.min(100, (result.confidence ?? 50) + (v.confidenceDelta ?? 10)));

  return {
    ...result,
    verified: true,
    website: v.website || result.website || baseUrl.origin,
    location: v.location || result.location,
    summary: v.summary || result.summary,
    contact: {
      ...(result.contact || {}),
      ...(v.contact || {}),
    },
    confidence: nextConfidence,
  };
}

/* ----------------------------
   Handler
---------------------------- */

export const handler: Handler = async (event) => {
  try {
    const a = await requireAuth(event);
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    // permission gate
    requireRole(a, ["admin", "ops_manager", "dispatcher"]);

    const DAY_LIMIT = Number(process.env.LEAD_FINDER_DAILY_LIMIT || "50");
    const { rows: limitRows } = await q<{ c: number }>(
      `select count(*)::int as c
       from lead_finder_searches
       where org_id = $1 and created_at > now() - interval '24 hours'`,
      [a.orgId]
    );
    if ((limitRows[0]?.c ?? 0) >= DAY_LIMIT) {
      return json(429, { error: "Daily Lead Finder limit reached. Try again tomorrow." });
    }

    const criteria = readJson<LeadProspectingCriteria>(event);
    const query = (criteria.query || "").trim();
    if (!query) return json(400, { error: "Missing query" });

    const mode = (process.env.LEAD_FINDER_MODE || "grounded").toLowerCase();
    const searchQuery = buildQuery(criteria);

    const cacheKey = JSON.stringify({
      q: searchQuery,
      geo: criteria.geography || "",
      ind: criteria.industryFocus || "",
      intent: criteria.intentFocus || "",
    });

    const cached = await q<{ search_id: string }>(
      `select id as search_id
       from lead_finder_searches
       where org_id = $1 and query = $2 and criteria->>'cacheKey' = $3
       and created_at > now() - interval '6 hours'
       order by created_at desc
       limit 1`,
      [a.orgId, searchQuery, cacheKey]
    );

    if (cached.rowCount === 1) {
      const searchId = cached.rows[0].search_id;
      const r = await q(
        `select id, company_name, website, location, summary, confidence, contact, source_url
         from lead_finder_results
         where search_id = $1
         order by confidence desc
         limit 50`,
        [searchId]
      );

      return json(200, {
        ok: true,
        searchId,
        results: r.rows.map((x: any, idx: number) => {
          const contact =
            x.contact && typeof x.contact === "string"
              ? (() => {
                  try {
                    return JSON.parse(x.contact);
                  } catch {
                    return {};
                  }
                })()
              : x.contact;
          const hasContact = Boolean(contact?.email || contact?.phone);
          const resultKey = resultKeyFromLead({
            website: x.website,
            sourceUrl: x.source_url,
            companyName: x.company_name,
          });

          return {
            id: x.id || `cached_${idx}`,
            companyName: x.company_name,
            website: x.website,
            location: x.location,
            summary: x.summary,
            confidence: Math.round(Math.max(0, Math.min(100, x.confidence ?? 50))),
            contact,
            sourceUrl: x.source_url,
            verified: Boolean(hasContact),
            sourcesCount: Number(x.source_url ? 1 : 0),
            resultKey: resultKey || `cached_${idx}`,
          };
        }),
        cached: true,
      });
    }

    // Optional: log search
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
      // optional logging only
    }

    // 1) Grounding: search
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

    // 2) Extract leads
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

    // 3) Verify pages (optional)
    if (VERIFY_PAGES && mode === "grounded" && VERIFY_MAX > 0) {
      const toVerify = results.slice(0, VERIFY_MAX);
      const verified: LeadProspect[] = [];

      for (const r of toVerify) {
        try {
          const vr = await verifyLead(r);
          verified.push(vr);
        } catch {
          verified.push(r);
        }
      }

      // Merge verified back into results by id
      const byId = new Map(verified.map((v) => [v.id, v]));
      results = results.map((r) => byId.get(r.id) || r);
    }

    results = results.map((r) => {
      const confidence = Math.round(Math.max(0, Math.min(100, r.confidence ?? 50)));
      const hasContact = Boolean(r.contact?.email?.trim()) || Boolean(r.contact?.phone?.trim());
      const resultKey = resultKeyFromLead(r);

      return {
        ...r,
        confidence,
        verified: Boolean(r.verified || hasContact),
        sourcesCount: Number(r.sourcesCount ?? (r.sourceUrl ? 1 : 0)),
        resultKey: resultKey || r.id,
      };
    });

    // Optional: store results
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
