
import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { Vehicle, VehicleMaintenance, VehicleExpense, Lead, Opportunity, Invoice, Expense, LeadScoringRule, Route, RouteWaypoint } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLEET_DATA_CONTEXT = `You are a Fleet Management Assistant for Heartfledge Logistics. Use the provided JSON data about the fleet to answer questions. The data includes vehicles, maintenance schedules, and expenses. If the question is about real-world information like regulations, news, or locations not in the data, use the provided tools. Be concise and helpful.`;
const CRM_DATA_CONTEXT = `You are a CRM Assistant for Heartfledge Logistics. Use the provided JSON data about leads, opportunities, and lead scoring rules to answer questions. Analyze the sales pipeline, lead status, and scoring logic. If the question is about real-world information like company news or market trends not in the data, use the provided tools. Be concise and helpful.`;
const FINANCIALS_DATA_CONTEXT = `You are a Financial Assistant for Heartfledge Logistics. Use the provided JSON data about invoices and company-wide expenses to answer questions. Analyze revenue, costs, and profitability. If the question is about real-world information like tax laws or market conditions not in the data, use the provided tools. Be concise and helpful.`;
const ROUTES_DATA_CONTEXT = `You are a Route Planning Assistant for Heartfledge Logistics. Use the provided JSON data about predefined routes and waypoints to answer questions. Analyze route details, distances, durations, and stops. If the question is about real-world information like live traffic, weather, or specific addresses not in the data, use the provided tools. Be concise and helpful.`;
const PROSPECTING_SYSTEM_INSTRUCTION = `You are the Heartfledge AI Lead Prospector. Always use realtime Google Search grounding to discover net-new companies that match the request. Synthesize only what the cited sources confirm and never hallucinate contact info. Respond exclusively with structured JSON that follows the requested schema.`;

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


const analyzePrompt = (prompt: string): { model: string; tools?: any[]; config?: any } => {
  const lowerCasePrompt = prompt.toLowerCase();
  
  if (lowerCasePrompt.includes('complex analysis') || lowerCasePrompt.includes('optimize') || lowerCasePrompt.includes('forecast')) {
    return { 
      model: 'gemini-2.5-pro',
      config: { thinkingConfig: { thinkingBudget: 32768 } }
    };
  }
  
  if (lowerCasePrompt.includes('find near') || lowerCasePrompt.includes('locate') || lowerCasePrompt.includes('map of')) {
     return { model: 'gemini-2.5-flash', tools: [{googleMaps: {}}] };
  }
  
  if (lowerCasePrompt.includes('latest news') || lowerCasePrompt.includes('regulations') || lowerCasePrompt.includes('what is the latest')) {
     return { model: 'gemini-2.5-flash', tools: [{googleSearch: {}}] };
  }
  
  if (lowerCasePrompt.includes('fast') || lowerCasePrompt.includes('quick summary')) {
      return { model: 'gemini-flash-lite-latest' };
  }

  return { model: 'gemini-2.5-flash' };
};

type FleetData = { vehicles: Vehicle[], maintenance: VehicleMaintenance[], expenses: VehicleExpense[] };
type CrmData = { leads: Lead[], opportunities: Opportunity[], leadScoringRules: LeadScoringRule[] };
type FinancialsData = { invoices: Invoice[], expenses: Expense[] };
type RoutesData = { routes: Route[], waypoints: RouteWaypoint[] };

type ContextType = 'fleet' | 'crm' | 'financials' | 'routes';

const getSystemInstruction = (contextType: ContextType) => {
    switch (contextType) {
        case 'fleet': return FLEET_DATA_CONTEXT;
        case 'crm': return CRM_DATA_CONTEXT;
        case 'financials': return FINANCIALS_DATA_CONTEXT;
        case 'routes': return ROUTES_DATA_CONTEXT;
        default: return 'You are a helpful assistant.';
    }
}

export const getGeminiResponse = async (
  prompt: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  contextData: FleetData | CrmData | FinancialsData | RoutesData,
  contextType: ContextType,
  location: { latitude: number, longitude: number } | null
) => {
  const { model, tools, config: analyzedConfig } = analyzePrompt(prompt);

  const dataContext = `\n\nCURRENT DATA CONTEXT:\n${JSON.stringify(contextData, null, 2)}`;
  const systemInstruction = getSystemInstruction(contextType);
  
  const contents = [...chatHistory, { role: 'user' as const, parts: [{ text: prompt + dataContext }] }];

  // Build the request object step-by-step to avoid syntax errors from complex inline objects
  // FIX: `systemInstruction` should be part of the `config` object per Gemini API guidelines.
  const request: GenerateContentParameters = {
    model: model,
    contents: contents,
    config: {
      systemInstruction: systemInstruction,
      ...analyzedConfig
    }
  };

  if (tools) {
    if (!request.config) {
        request.config = {};
    }
    request.config.tools = tools;
  }

  if (location && tools?.some(t => t.googleMaps)) {
    if (!request.config) {
        request.config = {};
    }
    request.config.toolConfig = {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      }
    };
  }

  try {
    const result = await ai.models.generateContent(request);
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const response = {
        text: "Sorry, I encountered an error. Please try again.",
        candidates: [],
    };
    // This is not a real GenerateContentResponse, but it's compatible with how the UI uses it.
    return response as any;
  }
};

const buildProspectingPrompt = (criteria: LeadProspectingCriteria) => {
  const lines = [
    `Search Query: ${criteria.query}`,
  ];

  if (criteria.geography) {
    lines.push(`Geography focus: ${criteria.geography}`);
  }
  if (criteria.industryFocus) {
    lines.push(`Industry focus: ${criteria.industryFocus}`);
  }
  if (criteria.intentFocus) {
    lines.push(`Buying intent: ${criteria.intentFocus}`);
  }
  if (criteria.minHeadcount) {
    lines.push(`Minimum headcount/company size: ${criteria.minHeadcount}`);
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

  return `Uncover 3-6 net-new companies that match Heartfledge Logistics' ICP. Always call the googleSearch tool before responding so that every insight is grounded in live web data.
${lines.join('\n')}

Reporting requirements:
- Highlight why each company is a logistics prospect (intent signal).
- Include at least one verified public contact or executive if search returns it; otherwise leave fields blank.
- confidence is a score from 0-1 describing how strong the match is.

${schema}
Answer with JSON only.`;
};

const extractJsonPayload = (rawText: string): any | null => {
  if (!rawText) return null;
  const fencedMatch = rawText.match(/```json([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : rawText;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return null;
  }
  const jsonSlice = candidate.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch (error) {
    console.warn('Failed to parse prospecting JSON', error);
    return null;
  }
};

const extractTextFromResult = (result: any): string => {
  const extractFromCandidates = (candidates: any[]) =>
    candidates
      .map((candidate: any) => {
        const parts = candidate.content?.parts || [];
        return parts.map((part: any) => part.text || '').join('\n');
      })
      .join('\n')
      .trim();

  if (result?.response?.candidates?.length) {
    return extractFromCandidates(result.response.candidates);
  }
  if (result?.candidates?.length) {
    return extractFromCandidates(result.candidates);
  }
  if (typeof result?.text === 'string') {
    return result.text;
  }
  return '';
};

const normalizeProspects = (payload: any): LeadProspect[] => {
  if (!payload || !Array.isArray(payload.leads)) {
    return [];
  }

  return payload.leads.map((lead: any, index: number) => {
    const fallbackIdSource = `${lead?.companyName || 'prospect'}-${index}-${Date.now()}`;
    const rawContact = lead?.contact || {};
    const contact: LeadProspectContact | undefined =
      rawContact && (rawContact.name || rawContact.title || rawContact.email || rawContact.phone || rawContact.linkedin)
        ? {
            name: rawContact.name?.trim(),
            title: rawContact.title?.trim(),
            email: rawContact.email?.trim(),
            phone: rawContact.phone?.trim(),
            linkedin: rawContact.linkedin?.trim(),
          }
        : undefined;
    return {
      id: lead?.id || fallbackIdSource,
      companyName: (lead?.companyName || '').trim(),
      summary: (lead?.summary || lead?.intentSignal || '').trim(),
      location: lead?.location?.trim(),
      industry: lead?.industry?.trim(),
      companySize: lead?.companySize?.trim(),
      website: lead?.website?.trim(),
      intentSignal: lead?.intentSignal?.trim(),
      contact,
      sourceUrl: lead?.sourceUrl?.trim(),
      confidence: typeof lead?.confidence === 'number' ? lead.confidence : undefined,
    } as LeadProspect;
  }).filter((lead: LeadProspect) => Boolean(lead.companyName));
};

export const findPotentialLeads = async (criteria: LeadProspectingCriteria): Promise<LeadProspect[]> => {
  if (!criteria.query?.trim()) {
    throw new Error('Search query is required');
  }

  console.log('[LeadProspector] Starting search with criteria:', criteria);
  const prompt = buildProspectingPrompt(criteria);
  console.log('[LeadProspector] Built prompt:', prompt.slice(0, 200) + '...');

  const request: GenerateContentParameters = {
    model: 'gemini-2.5-pro',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    config: {
      systemInstruction: PROSPECTING_SYSTEM_INSTRUCTION,
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
    },
  };

  try {
    console.log('[LeadProspector] Calling Gemini API...');
    const result = await ai.models.generateContent(request);
    console.log('[LeadProspector] Got result:', result);
    const rawText = extractTextFromResult(result);
    console.log('[LeadProspector] Extracted text:', rawText?.slice(0, 500));
    const payload = extractJsonPayload(rawText);
    console.log('[LeadProspector] Parsed payload:', payload);
    const prospects = normalizeProspects(payload);
    console.log('[LeadProspector] Normalized prospects:', prospects.length);
    return prospects;
  } catch (error) {
    console.error('[LeadProspector] Error finding potential leads:', error);
    throw error;
  }
};
