import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

type Prospect = {
  id?: string;
  companyName: string;
  website?: string;
  location?: string;
  summary?: string;
  sourceUrl?: string;
  industry?: string;
  intentSignal?: string;
  contact?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  };
};

type Body = {
  tone?: "professional" | "friendly" | "direct" | "executive" | string;
  goal?: "intro_call" | "quote" | "partnership" | string;
  length?: "short" | "medium" | "long" | string;
  prospect?: Prospect;
  variants?: number;
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

function safeParse(body: string | null) {
  try {
    return body ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

function cap(s: any, max: number) {
  const t = String(s ?? "");
  return t.length > max ? t.slice(0, max) : t;
}

function normalizeTone(tone: string) {
  const t = (tone || "").toLowerCase();
  if (t.includes("friendly")) return "friendly";
  if (t.includes("direct")) return "direct";
  if (t.includes("executive")) return "executive";
  return "professional";
}

function normalizeGoal(goal: string) {
  const g = (goal || "").toLowerCase();
  if (g.includes("quote")) return "quote";
  if (g.includes("partner")) return "partnership";
  return "intro_call";
}

function normalizeLength(length: string) {
  const l = (length || "").toLowerCase();
  if (l.includes("long")) return "long";
  if (l.includes("medium")) return "medium";
  return "short";
}

function extractText(result: any): string {
  const candidates = result?.response?.candidates || result?.candidates || [];
  return (
    candidates
      .map((c: any) => (c?.content?.parts || []).map((p: any) => p?.text || "").join("\n"))
      .join("\n")
      .trim() || ""
  );
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

function stripHtml(html: string) {
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<\/(p|div|li|br|h1|h2|h3|h4|h5|h6)>/gi, "\n");
  text = text.replace(/<[^>]+>/g, " ");
  text = text.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  text = text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

async function fetchSnippets(url: string): Promise<{ ok: boolean; snippets: string; usedUrl: string; error?: string }> {
  const usedUrl = url.trim();
  if (!usedUrl) return { ok: false, snippets: "", usedUrl, error: "Empty URL" };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(usedUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "HeartFLeadFinder/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    const ct = String(res.headers.get("content-type") || "");
    const raw = await res.text();

    if (!res.ok) {
      return { ok: false, snippets: "", usedUrl, error: `HTTP ${res.status}` };
    }

    if (!ct.toLowerCase().includes("text/html")) {
      const plain = cap(raw, 4000);
      return { ok: true, snippets: plain, usedUrl };
    }

    const text = stripHtml(raw);
    const snippets = cap(text, 4000);
    return { ok: true, snippets, usedUrl: res.url || usedUrl };
  } catch (e: any) {
    return { ok: false, snippets: "", usedUrl, error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

function emailPrompt(p: Prospect, tone: string, goal: string, length: string, variants: number, snippets: string) {
  const contactLine = p.contact?.name
    ? `${p.contact.name}${p.contact.title ? ` (${p.contact.title})` : ""}`
    : "";

  const goalText =
    goal === "quote"
      ? "Ask for shipment volume/routes so you can provide a quote."
      : goal === "partnership"
        ? "Propose a logistics partnership and ask for the right person to talk to."
        : "Book a 15-minute intro call this week.";

  const lengthText =
    length === "long" ? "around 180–220 words" : length === "medium" ? "around 120–160 words" : "around 70–110 words";

  const systemRules = `
Hard rules:
- Do NOT invent facts. You may ONLY reference facts that are explicitly present in the Prospect data and Source snippets below.
- If Source snippets are empty, do NOT claim you visited their site; keep it generic.
- If the prospect contact is missing, address the email generically (e.g., "Hi there,").
- Do not mention "AI", "Gemini", or "I used tools".
- Provide ${variants} distinct variants (different angles/value propositions) while staying truthful.
- Output JSON only, exactly:
{
  "emails": [
    { "subject": "...", "body": "..." }
  ]
}
`.trim();

  return `
You are writing cold outreach emails for HeartF Logistics (logistics/fleet/freight partner).

${systemRules}

Prospect data:
Company: ${cap(p.companyName || "", 160)}
Location: ${cap(p.location || "", 160)}
Industry: ${cap(p.industry || "", 160)}
Website: ${cap(p.website || "", 260)}
Source URL: ${cap(p.sourceUrl || "", 260)}
Contact: ${cap(contactLine, 160)}
Summary: ${cap(p.summary || "", 900)}
Intent signal: ${cap(p.intentSignal || "", 900)}

Source snippets (only allowed personalization source):
${snippets ? snippets : "(none)"}

Writing style:
Tone: ${tone}
Length: ${lengthText}
Goal: ${goalText}

Each body must include:
- One context line (only if supported by Summary or Source snippets)
- One HeartF value line
- One single CTA aligned to the goal
- Signature line: "Christina, HeartF Logistics"

Return JSON only.
`.trim();
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
    if (event.httpMethod !== "POST") return json(405, { ok: false, error: "Method not allowed" });

    if (!ai) return json(500, { ok: false, error: "AI is not configured. Set GEMINI_API_KEY or API_KEY." });

    const body = safeParse(event.body || null) as Body | null;
    const prospect = body?.prospect;

    if (!prospect?.companyName) return json(400, { ok: false, error: "Missing prospect.companyName" });

    const tone = normalizeTone(String(body?.tone || "professional"));
    const goal = normalizeGoal(String(body?.goal || "intro_call"));
    const length = normalizeLength(String(body?.length || "short"));
    const variants = Math.max(1, Math.min(5, Number(body?.variants ?? 3)));

    const urlToFetch = (prospect.sourceUrl || prospect.website || "").trim();
    const fetched = urlToFetch
      ? await fetchSnippets(urlToFetch)
      : { ok: false, snippets: "", usedUrl: "", error: "No URL" };
    const snippets = fetched.ok ? fetched.snippets : "";

    const prompt = emailPrompt(prospect, tone, goal, length, variants, snippets);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
        topP: 0.9,
        maxOutputTokens: 1800,
      },
    } as any);

    const rawText = extractText(result);
    const payload = extractJson(rawText);

    const emails = Array.isArray(payload?.emails) ? payload.emails : [];
    const cleaned = emails
      .map((e: any) => ({
        subject: String(e?.subject || "").trim(),
        body: String(e?.body || "").trim(),
      }))
      .filter((e: any) => e.subject && e.body)
      .slice(0, variants);

    if (!cleaned.length) {
      return json(500, {
        ok: false,
        error: "Model did not return valid email drafts.",
        raw: rawText.slice(0, 2000),
      });
    }

    return json(200, {
      ok: true,
      emails: cleaned,
      personalization: {
        urlAttempted: urlToFetch || null,
        urlUsed: fetched.ok ? fetched.usedUrl : null,
        snippetsUsed: Boolean(snippets),
      },
    });
  } catch (e: any) {
    return json(500, { ok: false, error: "Server error", detail: String(e?.message || e) });
  }
};
