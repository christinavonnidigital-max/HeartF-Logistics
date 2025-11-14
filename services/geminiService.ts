
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
    request.config.tools = tools;
  }

  if (location && tools?.some(t => t.googleMaps)) {
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
