
import { GoogleGenAI } from "@google/genai";
import { Vehicle, VehicleMaintenance, VehicleExpense } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FLEET_DATA_CONTEXT = `You are a Fleet Management Assistant for LogiPro. Use the provided JSON data about the fleet to answer questions. The data includes vehicles, maintenance schedules, and expenses. If the question is about real-world information like regulations, news, or locations not in the data, use the provided tools. Be concise and helpful.`;

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
      return { model: 'gemini-2.5-flash-lite' };
  }

  return { model: 'gemini-2.5-flash' };
};

export const getGeminiResponse = async (
  prompt: string,
  chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
  fleetData: { vehicles: Vehicle[], maintenance: VehicleMaintenance[], expenses: VehicleExpense[] },
  location: { latitude: number, longitude: number } | null
) => {
  const { model, tools, config } = analyzePrompt(prompt);

  const dataContext = `\n\nFLEET DATA:\n${JSON.stringify(fleetData, null, 2)}`;
  
  const contents = [...chatHistory, { role: 'user' as const, parts: [{ text: prompt + dataContext }] }];

  try {
    const result = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
            ...config,
            tools: tools,
            toolConfig: location && tools?.some(t => t.googleMaps) ? {
              retrievalConfig: {
                latLng: {
                  latitude: location.latitude,
                  longitude: location.longitude
                }
              }
            } : undefined,
        },
        systemInstruction: FLEET_DATA_CONTEXT,
    });
    
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return { text: "Sorry, I encountered an error. Please try again.", candidates: [] };
  }
};
