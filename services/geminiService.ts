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

const PROSPECTING_SYSTEM_INSTRUCTION =
  "You are the Heartfledge Lead Prospecting Assistant. You must respond ONLY with valid JSON that matches the requested schema. Do not include commentary or markdown unless explicitly asked.";

// Types used by the rest of the app
export interface LeadProspectingCriteria {
  query: string;
  geography?: string;
  industryFocus?: string;
  intentFocus?: string;
  minHeadcount?: number;
  maxResults?: number;
}

export interface LeadProspectContact {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface LeadProspect {
  companyName: string;
  website?: string;
  industry?: string;
  location?: string;
  headcount?: number;
  description?: string;
  contacts?: LeadProspectContact[];
  evidence?: string[];
  confidence: number; // 0..1
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
  lines.push(`Goal: Find potential leads for Heartfledge Logistics.`);
  lines.push(`Search query: ${criteria.query}`);

  if (criteria.geography) lines.push(`Geography focus: ${criteria.geography}`);
  if (criteria.industryFocus) lines.push(`Industry focus: ${criteria.industryFocus}`);
  if (criteria.intentFocus) lines.push(`Buying intent: ${criteria.intentFocus}`);
  if (criteria.minHeadcount) lines.push(`Minimum company size/headcount: ${criteria.minHeadcount}`);

  const maxResults = criteria.maxResults && criteria.maxResults > 0 ? criteria.maxResults : 10;

  const schema = `Return JSON that matches this schema exactly:
{
  "prospects": [
    {
      "companyName": "string",
      "website": "string or null",
      "industry": "string or null",
      "location": "string or null",
      "headcount": number or null,
      "description": "string or null",
      "contacts": [
        {
          "name": "string or null",
          "title": "string or null",
          "email": "string or null",
          "phone": "string or null",
          "linkedinUrl": "string or null"
        }
      ],
      "evidence": ["short strings explaining why this is a match"],
      "confidence": number
    }
  ]
}`;

  return `${PROSPECTING_SYSTEM_INSTRUCTION}\n\n${lines.join("\n")}\n\nConstraints:
- Return at most ${maxResults} prospects.
- confidence must be between 0 and 1.
- evidence must be short and relevant.
\n\n${schema}\nAnswer with JSON only.`;
};

// Extract JSON from model output robustly
const extractJsonPayload = (rawText: string): any | null => {
  if (!rawText) return null;

  // Strip ```json fences if present
  const fencedMatch = rawText.match(/```json([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : rawText;

  const startObj = candidate.indexOf("{");
  const endObj = candidate.lastIndexOf("}");
  if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
    const slice = candidate.slice(startObj, endObj + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // fallthrough
    }
  }

  return null;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const normalizeProspects = (payload: any): LeadProspect[] => {
  const arr = payload?.prospects;
  if (!Array.isArray(arr)) return [];

  const out: LeadProspect[] = [];
  for (const p of arr) {
    const companyName = typeof p?.companyName === "string" ? p.companyName.trim() : "";
    if (!companyName) continue;

    const contactsRaw = Array.isArray(p?.contacts) ? p.contacts : [];
    const contacts: LeadProspectContact[] = contactsRaw.map((c: any) => ({
      name: typeof c?.name === "string" ? c.name : undefined,
      title: typeof c?.title === "string" ? c.title : undefined,
      email: typeof c?.email === "string" ? c.email : undefined,
      phone: typeof c?.phone === "string" ? c.phone : undefined,
      linkedinUrl: typeof c?.linkedinUrl === "string" ? c.linkedinUrl : undefined,
    }));

    const evidence = Array.isArray(p?.evidence)
      ? p.evidence.map((e: any) => String(e)).filter(Boolean).slice(0, 8)
      : [];

    const confidence = clamp01(Number(p?.confidence));

    out.push({
      companyName,
      website: typeof p?.website === "string" ? p.website : undefined,
      industry: typeof p?.industry === "string" ? p.industry : undefined,
      location: typeof p?.location === "string" ? p.location : undefined,
      headcount: Number.isFinite(Number(p?.headcount)) ? Number(p?.headcount) : undefined,
      description: typeof p?.description === "string" ? p.description : undefined,
      contacts,
      evidence,
      confidence,
    });
  }

  // Sort best matches first
  out.sort((a, b) => b.confidence - a.confidence);
  return out;
};

export const findPotentialLeads = async (
  criteria: LeadProspectingCriteria,
  options?: { modelOverride?: string }
): Promise<LeadProspect[]> => {
  if (!ai) {
    return [];
  }

  const prompt = buildProspectingPrompt(criteria);

  const request: GenerateContentParameters = {
    model: options?.modelOverride || "gemini-2.5-flash",
    contents: [{ role: "user" as const, parts: [{ text: prompt }] }],
    config: {
      systemInstruction: PROSPECTING_SYSTEM_INSTRUCTION,
    } as any,
  } as any;

  // Use search tool for prospecting, if supported
  (request as any).tools = [{ googleSearch: {} }];

  const result = await (ai as any).models.generateContent(request);
  const rawText = extractTextFromResult(result);
  const payload = extractJsonPayload(rawText);
  return normalizeProspects(payload);
};
