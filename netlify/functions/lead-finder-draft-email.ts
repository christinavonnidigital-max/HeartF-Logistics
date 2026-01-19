import type { Handler } from "@netlify/functions";
import { GoogleGenAI } from "@google/genai";

type Prospect = {
  companyName: string;
  website?: string;
  location?: string;
  summary?: string;
  sourceUrl?: string;
  verified?: boolean;
  confidence?: number;
  sourcesCount?: number;
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
};

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function json(statusCode: number, body: any) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
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

function cap(s: string, max: number) {
  if (!s) return "";
  const t = String(s);
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

function emailPrompt(p: Prospect, tone: string, goal: string, length: string) {
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

  return `
You are writing a cold outreach email for HeartF Logistics (a logistics/fleet/freight partner).

Hard rules:
- Do not invent facts. Use only what is provided in the prospect data.
- If the prospect contact is missing, address the email generically (e.g., “Hi there,”).
- Keep it specific, respectful, and action-oriented.
- Produce JSON only, exactly: { "subject": "...", "body": "..." }.

Prospect data:
Company: ${cap(p.companyName || "", 160)}
Location: ${cap(p.location || "", 160)}
Website: ${cap(p.website || "", 260)}
Source URL: ${cap(p.sourceUrl || "", 260)}
Contact: ${cap(contactLine, 160)}
Summary: ${cap(p.summary || "", 900)}

Writing style:
Tone: ${tone}
Length: ${lengthText}
Goal: ${goalText}

Include:
- One sentence showing you understand their context (based on Summary only).
- One clear value proposition for logistics.
- One call-to-action aligned to the goal.
- A simple signature: “Christina, HeartF Logistics”
`.trim();
}

function extractJson(text: string) {
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

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
    if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

    if (!ai) return json(500, { error: "AI is not configured. Set GEMINI_API_KEY or API_KEY." });

    const body = safeParse(event.body || null) as Body | null;
    const prospect = body?.prospect;

    if (!prospect?.companyName) return json(400, { error: "Missing prospect.companyName" });

    const tone = normalizeTone(String(body?.tone || "professional"));
    const goal = normalizeGoal(String(body?.goal || "intro_call"));
    const length = normalizeLength(String(body?.length || "short"));

    const prompt = emailPrompt(prospect, tone, goal, length);

    const result = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 1200,
      },
    } as any);

    const candidates = (result as any)?.response?.candidates || (result as any)?.candidates || [];
    const text =
      candidates
        .map((c: any) => (c?.content?.parts || []).map((p: any) => p?.text || "").join("\n"))
        .join("\n")
        .trim() || "";

    const payload = extractJson(text);
    if (!payload?.subject || !payload?.body) {
      return json(500, { error: "Model did not return valid JSON email draft.", raw: text.slice(0, 2000) });
    }

    return json(200, {
      ok: true,
      email: {
        subject: String(payload.subject).trim(),
        body: String(payload.body).trim(),
      },
    });
  } catch (e: any) {
    return json(500, { error: "Server error", detail: String(e?.message || e) });
  }
};
