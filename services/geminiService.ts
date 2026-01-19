import {
  GoogleGenAI,
  GenerateContentParameters,
  FunctionDeclaration,
  Content,
  ToolConfig,
} from "@google/genai";

import {
  Vehicle,
  VehicleMaintenance,
  VehicleExpense,
  Lead,
  Opportunity,
  Invoice,
  Expense,
  LeadScoringRule,
  Route,
  RouteWaypoint,
} from "../types";

// Resolve API key safely in both Vite/browser and Node environments
const viteEnv = (import.meta as any)?.env as any | undefined;
const nodeEnv = (typeof process !== "undefined" ? (process as any).env : undefined) as any | undefined;

const apiKey: string | undefined =
  (viteEnv?.VITE_GEMINI_API_KEY as string | undefined) ||
  (viteEnv?.VITE_API_KEY as string | undefined) ||
  (nodeEnv?.GEMINI_API_KEY as string | undefined) ||
  (nodeEnv?.API_KEY as string | undefined);

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// System instructions (not truncated)
const FLEET_DATA_CONTEXT =
  "You are a Fleet Management Assistant for Heartfledge Logistics. Use the provided fleet data (vehicles, maintenance, expenses) to answer questions. If something is not in the data, say so and suggest what information is needed. Be concise and helpful.";

const CRM_DATA_CONTEXT =
  "You are a CRM Assistant for Heartfledge Logistics. Use the provided CRM data (leads, opportunities, lead activities, scoring rules) to answer questions. If something is not in the data, say so and suggest what information is needed. Be concise and helpful.";

const FINANCIALS_DATA_CONTEXT =
  "You are a Financial Assistant for Heartfledge Logistics. Use the provided financial data (invoices, expenses) to answer questions. If something is not in the data, say so and suggest what information is needed. Be concise and helpful.";

const ROUTES_DATA_CONTEXT =
  "You are a Route Planning Assistant for Heartfledge Logistics. Use the provided routing data (routes, waypoints) to answer questions. If something is not in the data, say so and suggest what information is needed. Be concise and helpful.";

// ===============================
// Lead Finder / Prospecting (Gemini)
// ===============================

const PROSPECTING_SYSTEM_INSTRUCTION = `
You are the Heartfledge Lead Prospector.

CRITICAL RULES:
- You MUST use the googleSearch tool before you answer.
- Only include companies that you can verify with public sources.
- DO NOT fabricate contact information. If you cannot find a verified public contact, leave contact fields blank.
- Every lead MUST include at least one of: website OR sourceUrl (prefer both).
- confidence must reflect evidence strength: 0.0 (weak) to 1.0 (strong).
- Output JSON only, matching the schema exactly. No markdown, no commentary.
`.trim();

// Types used by the rest of the app
export interface LeadProspectingCriteria {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: string;
}

export interface LeadProspectContact {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface LeadProspect {
  id: string;
  companyName: string;
  summary: string;
  location?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  intentSignal?: string;
  contact?: LeadProspectContact;
  sourceUrl?: string;
  confidence?: number;
}

type FleetData = {
  vehicles: Vehicle[];
  maintenance: VehicleMaintenance[];
  expenses: VehicleExpense[];
};

type CrmData = {
  leads: Lead[];
  opportunities: Opportunity[];
  leadScoringRules: LeadScoringRule[];
};

type FinancialsData = {
  invoices: Invoice[];
  expenses: Expense[];
};

type RoutesData = {
  routes: Route[];
  waypoints: RouteWaypoint[];
};

type ContextType = "fleet" | "crm" | "financials" | "routes";

const getSystemInstruction = (contextType: ContextType) => {
  switch (contextType) {
    case "fleet":
      return FLEET_DATA_CONTEXT;
    case "crm":
      return CRM_DATA_CONTEXT;
    case "financials":
      return FINANCIALS_DATA_CONTEXT;
    case "routes":
      return ROUTES_DATA_CONTEXT;
    default:
      return "You are a helpful assistant.";
  }
};

export interface GeminiCallOptions {
  functionDeclarations?: FunctionDeclaration[];
  extraContents?: Content[];
  toolConfig?: ToolConfig;
  includeDataContext?: boolean;
  modelOverride?: string;
}

type AnalyzeResult = {
  model: string;
  tools?: any[];
  config?: Record<string, any>;
};

// Lightweight prompt routing
const analyzePrompt = (prompt: string): AnalyzeResult => {
  const p = (prompt || "").toLowerCase();

  // If the user asks for maps/directions/route planning, enable maps tool if available
  if (
    p.includes("route") ||
    p.includes("directions") ||
    p.includes("distance") ||
    p.includes("map") ||
    p.includes("eta")
  ) {
    return { model: "gemini-2.5-flash", tools: [{ googleMaps: {} }] };
  }

  // If the user asks for latest info, enable search tool if available
  if (
    p.includes("latest") ||
    p.includes("news") ||
    p.includes("regulation") ||
    p.includes("regulations") ||
    p.includes("what is the latest") ||
    p.includes("search")
  ) {
    return { model: "gemini-2.5-flash", tools: [{ googleSearch: {} }] };
  }

  // If the user asks for a quick/fast summary, use a faster model
  if (p.includes("fast") || p.includes("quick summary") || p.includes("short summary")) {
    return { model: "gemini-flash-lite-latest" };
  }

  return { model: "gemini-2.5-flash" };
};

function extractTextFromResult(result: any): string {
  if (!result) return "";
  if (typeof result.text === "string") return result.text;

  const candidates = result.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return "";

  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || !parts.length) return "";

  const textParts = parts
    .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
    .filter(Boolean);

  return textParts.join("\n").trim();
}

export const getGeminiResponse = async (
  prompt: string,
  chatHistory: Content[],
  contextData: FleetData | CrmData | FinancialsData | RoutesData | any,
  contextType: ContextType,
  location: { latitude: number; longitude: number } | null,
  options?: GeminiCallOptions
): Promise<{ text: string; candidates: any[]; raw?: any }> => {
  if (!ai) {
    return {
      text:
        "AI assistant is disabled because no API key is configured. Set VITE_GEMINI_API_KEY (recommended) to enable responses.",
      candidates: [],
    };
  }

  const { model, tools, config: analyzedConfig } = analyzePrompt(prompt);
  const chosenModel = options?.modelOverride || model;

  const dataContext =
    options?.includeDataContext === false
      ? ""
      : `\n\nCURRENT DATA CONTEXT:\n${JSON.stringify(contextData, null, 2)}`;

  const systemInstruction = getSystemInstruction(contextType);

  const contents: Content[] = [
    ...(chatHistory || []),
    { role: "user" as const, parts: [{ text: prompt + dataContext }] },
  ];

  if (options?.extraContents?.length) {
    contents.push(...options.extraContents);
  }

  const request: GenerateContentParameters = {
    model: chosenModel,
    contents,
    config: {
      systemInstruction,
      ...(analyzedConfig || {}),
      ...(options?.toolConfig ? { toolConfig: options.toolConfig } : {}),
    } as any,
  } as any;

  // Attach tools/function declarations if provided
  const mergedTools: any[] = [];
  if (Array.isArray(tools)) mergedTools.push(...tools);
  if (Array.isArray(options?.functionDeclarations) && options!.functionDeclarations!.length) {
    mergedTools.push({
      functionDeclarations: options!.functionDeclarations!,
    });
  }
  if (mergedTools.length) {
    (request as any).tools = mergedTools;
  }

  // Optional location context
  if (location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    (request as any).config = {
      ...(request as any).config,
      location,
    };
  }

  try {
    const result = await (ai as any).models.generateContent(request);
    const text = extractTextFromResult(result);
    const candidates = Array.isArray((result as any)?.candidates) ? (result as any).candidates : [];
    return { text, candidates, raw: result };
  } catch (error) {
    // Keep UI-safe output
    console.error("Error calling Gemini API:", error);
    return { text: "Sorry, I encountered an error. Please try again.", candidates: [] };
  }
};

// Prospecting prompt builder
const buildProspectingPrompt = (criteria: LeadProspectingCriteria) => {
  const lines: string[] = [];
  lines.push(`Search query: ${criteria.query}`);

  if (criteria.geography?.trim()) {
    lines.push(`Geography focus: ${criteria.geography.trim()}`);
  }
  if (criteria.industryFocus?.trim()) {
    lines.push(`Industry focus: ${criteria.industryFocus.trim()}`);
  }
  if (criteria.intentFocus?.trim()) {
    lines.push(`Buying intent focus: ${criteria.intentFocus.trim()}`);
  }
  if (criteria.minHeadcount?.trim()) {
    lines.push(`Minimum headcount / company size: ${criteria.minHeadcount.trim()}`);
  }

  const schema = `Return JSON that matches this schema exactly:
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
      "contact": {
        "name": "",
        "title": "",
        "email": "",
        "phone": "",
        "linkedin": ""
      },
      "sourceUrl": "",
      "confidence": 0.0
    }
  ]
}`;

  return `
Task:
Find 3–6 net-new companies that match the Heartfledge Logistics ICP, grounded in live web data.

Use googleSearch to verify:
- Company existence
- Website
- Any strong intent signal relevant to logistics (fleet expansion, distribution, freight needs, warehousing, deliveries, procurement, transport partnerships, etc.)

Criteria:
${lines.join("\n")}

Reporting requirements:
- summary: 1–2 sentences describing what the company does and why it is a fit.
- intentSignal: what suggests they need logistics services (and what you found).
- contact: include at least one verified public contact if available; otherwise blank fields.
- sourceUrl: a public URL supporting the claim (company site or credible directory/news page).
- confidence: 0.0–1.0 based on how strong the match and evidence are.

${schema}

Answer with JSON only.
`.trim();
};

const extractJsonPayload = (rawText: string): any | null => {
  if (!rawText) return null;

  const fencedMatch = rawText.match(/```json([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : rawText;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;

  const jsonSlice = candidate.slice(start, end + 1);

  try {
    return JSON.parse(jsonSlice);
  } catch (error) {
    console.warn("[LeadProspector] Failed to parse JSON payload:", error);
    return null;
  }
};

const hashId = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return Math.abs(hash >>> 0).toString(36);
};

const normalizeProspects = (payload: any): LeadProspect[] => {
  const rawList = Array.isArray(payload?.leads)
    ? payload.leads
    : Array.isArray(payload?.prospects)
      ? payload.prospects
      : [];

  if (!rawList.length) return [];

  const normalized = rawList
    .map((lead: any, index: number) => {
      const rawContact = lead?.contact || {};
      const contactHasAny =
        !!rawContact &&
        (rawContact.name || rawContact.title || rawContact.email || rawContact.phone || rawContact.linkedin);

      const contact: LeadProspectContact | undefined = contactHasAny
        ? {
            name: typeof rawContact.name === "string" ? rawContact.name.trim() : undefined,
            title: typeof rawContact.title === "string" ? rawContact.title.trim() : undefined,
            email: typeof rawContact.email === "string" ? rawContact.email.trim() : undefined,
            phone: typeof rawContact.phone === "string" ? rawContact.phone.trim() : undefined,
            linkedin: typeof rawContact.linkedin === "string" ? rawContact.linkedin.trim() : undefined,
          }
        : undefined;

      const companyName = typeof lead?.companyName === "string" ? lead.companyName.trim() : "";
      const website = typeof lead?.website === "string" ? lead.website.trim() : "";
      const sourceUrl = typeof lead?.sourceUrl === "string" ? lead.sourceUrl.trim() : "";

      const summary =
        typeof lead?.summary === "string"
          ? lead.summary.trim()
          : typeof lead?.intentSignal === "string"
            ? lead.intentSignal.trim()
            : "";

      const confidence =
        typeof lead?.confidence === "number" && Number.isFinite(lead.confidence)
          ? Math.max(0, Math.min(1, lead.confidence))
          : undefined;

      if (!companyName) return null;
      if (!website && !sourceUrl) return null;

      const idSource = `${companyName}|${website || ""}|${sourceUrl || ""}|${index}`;
      const id = hashId(idSource);

      const out: LeadProspect = {
        id,
        companyName,
        summary,
        location: typeof lead?.location === "string" ? lead.location.trim() : undefined,
        industry: typeof lead?.industry === "string" ? lead.industry.trim() : undefined,
        companySize: typeof lead?.companySize === "string" ? lead.companySize.trim() : undefined,
        website: website || undefined,
        intentSignal: typeof lead?.intentSignal === "string" ? lead.intentSignal.trim() : undefined,
        contact,
        sourceUrl: sourceUrl || (website ? website : undefined),
        confidence,
      };

      return out;
    })
    .filter(Boolean) as LeadProspect[];

  const seen = new Set<string>();
  const deduped: LeadProspect[] = [];
  for (const p of normalized) {
    const key = `${p.companyName.toLowerCase()}|${(p.website || "").toLowerCase()}|${(p.sourceUrl || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(p);
  }

  deduped.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

  return deduped;
};

const extractProspectTextFromResult = (result: any): string => {
  const extractFromCandidates = (candidates: any[]) =>
    candidates
      .map((candidate: any) => {
        const parts = candidate.content?.parts || [];
        return parts.map((part: any) => part.text || "").join("\n");
      })
      .join("\n")
      .trim();

  if (result?.response?.candidates?.length) {
    return extractFromCandidates(result.response.candidates);
  }
  if (result?.candidates?.length) {
    return extractFromCandidates(result.candidates);
  }
  if (typeof result?.text === "string") {
    return result.text;
  }
  return "";
};

export const findPotentialLeads = async (criteria: LeadProspectingCriteria): Promise<LeadProspect[]> => {
  if (!criteria.query?.trim()) {
    throw new Error("Search query is required");
  }
  if (!ai) {
    throw new Error("AI is disabled because no API key is configured. Set API_KEY or GEMINI_API_KEY.");
  }

  console.log("[LeadProspector] Starting search with criteria:", criteria);

  const prompt = buildProspectingPrompt(criteria);

  const request: GenerateContentParameters = {
    model: "gemini-2.5-pro",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      systemInstruction: PROSPECTING_SYSTEM_INSTRUCTION,
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 4096,
      tools: [{ googleSearch: {} }] as any,
    },
  };

  try {
    const result = await ai!.models.generateContent(request);
    const rawText = extractProspectTextFromResult(result);
    const payload = extractJsonPayload(rawText);

    if (!payload) {
      console.warn("[LeadProspector] No JSON payload returned. Raw output:", rawText);
      return [];
    }

    const prospects = normalizeProspects(payload);
    console.log("[LeadProspector] Normalized prospects:", prospects.length);
    return prospects;
  } catch (error) {
    console.error("[LeadProspector] Error finding potential leads:", error);
    throw error;
  }
};
