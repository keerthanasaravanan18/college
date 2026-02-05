
import { GoogleGenAI, Type } from "@google/genai";
import { SoilData, WeatherData, CropRecommendation, MarketInsight, SandhaiPrice } from "../types";
import { Language } from "../translations";
import { withRetry, getApiKey, deduplicateRequest } from "../utils/apiUtils";
import { getCache, setCache } from "../utils/cacheUtils";

// VOLATILITY OPTIMIZATION:
// Soil: Extremely low volatility. 48h cache is safe.
const SOIL_CACHE_TTL = 48 * 60; 
// Advice: Medium volatility, changes with weather patterns. 2h is sufficient.
const ADVICE_CACHE_TTL = 120;
// Recommendations: Tied to Soil + Weather. 24h cache.
const REC_CACHE_TTL = 24 * 60;
// Market Prices: High volatility (Daily morning updates). Decreased to 4h for fresh "live" feeling.
const MARKET_CACHE_TTL = 4 * 60;

const extractJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (e2) {
        throw new Error("Failed to parse extracted JSON block");
      }
    }
    throw new Error("No valid JSON found in response");
  }
};

export const generateAiRecommendations = async (
  soil: SoilData,
  weather: WeatherData,
  location: string,
  history: string,
  lang: Language = 'en'
): Promise<CropRecommendation[]> => {
  const langName = lang === 'ta' ? 'Tamil' : 'English';
  const forecastPart = (weather.forecast || 'Stable').substring(0, 15);
  
  const cacheKeyObj = {
    loc: location,
    soil: `${soil.soilType}-${soil.ph}-${soil.moisture}`,
    hist: history,
    weath: `${Math.round(weather.temp || 0)}-${forecastPart}`,
    lng: lang
  };
  const cacheKey = `recs-v6-${JSON.stringify(cacheKeyObj).replace(/["{}:]/g, '')}`;

  const cachedRecs = getCache<CropRecommendation[]>(cacheKey);
  if (cachedRecs) return cachedRecs;
  
  const getRecs = async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const systemInstruction = `
      You are a world-class Precision Agronomist specializing in Indian soil chemistry and tropical meteorology. 
      Your goal is to maximize farmer yield and profit while ensuring soil sustainability.
      Always respond in ${langName}.
    `;

    const prompt = `
      Analyze this specific dataset to recommend the top 3 crops. 
      Location: ${location}
      SOIL DATA: Type: ${soil.soilType}, pH: ${soil.ph}, Nitrogen: ${soil.nitrogen} mg/kg, Moisture: ${soil.moisture}%
      CLIMATE DATA: Temp: ${weather.temp}°C, Forecast: ${weather.forecast}
      PREVIOUS CROP: ${history}
      Output exactly 3 recommendations in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cropName: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              expectedYield: { type: Type.STRING },
              estimatedProfit: { type: Type.STRING },
              sustainabilityScore: { type: Type.NUMBER },
              sustainabilityReport: { type: Type.STRING },
              advice: { type: Type.STRING },
              plantingWindow: { type: Type.STRING },
              suitabilityReasons: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["cropName", "confidence", "expectedYield", "estimatedProfit", "sustainabilityScore", "sustainabilityReport", "advice", "plantingWindow", "suitabilityReasons"]
          }
        }
      }
    });

    const result = extractJson(response.text || "[]");
    if (result && result.length > 0) setCache(cacheKey, result, REC_CACHE_TTL);
    return result;
  };

  try {
    return await withRetry(getRecs);
  } catch (e) {
    console.error("Recommendation generation failed", e);
    return [];
  }
};

export const fetchLiveMarketData = async (location: string, crops: string[], lang: Language = 'en', force: boolean = false): Promise<MarketInsight> => {
  const dateStr = new Date().toISOString().split('T')[0];
  const cacheKey = `live-market-v6-${location}-${crops.join('-')}-${dateStr}`;
  
  if (!force) {
    const cached = getCache<MarketInsight>(cacheKey);
    if (cached) return cached;
  }

  return deduplicateRequest(cacheKey, async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `
      TASK: FETCH REAL-TIME COMMODITY PRICES for ${dateStr} in ${location}, India.
      SEARCH PRIORITY: eNAM (enam.gov.in), Agmarknet.
      Crops to check: ${crops.join(', ')}.
      
      CRITICAL: Return ONLY a valid JSON object.
      JSON structure:
      {
        "analysis": "2-sentence analysis",
        "lastUpdated": "${new Date().toLocaleTimeString()}",
        "prices": [
          {
            "commodity": "Crop Name",
            "mandi": "Mandi Name",
            "minPrice": "₹Amount",
            "maxPrice": "₹Amount",
            "modalPrice": "₹Amount",
            "retailPrice": "₹Amount",
            "trend": "Up" | "Down" | "Stable",
            "lastUpdated": "Source time",
            "reliability": "Official" | "Verified" | "Standard",
            "sourceName": "Source site"
          }
        ]
      }
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] }
      });

      const result = extractJson(response.text || "{}") as MarketInsight;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri
      })).filter((s: any) => s.uri) || [];

      const finalResult = { ...result, sources: sources.slice(0, 3) };
      setCache(cacheKey, finalResult, MARKET_CACHE_TTL);
      return finalResult;
    } catch (e) {
      console.error("Advanced Market Grounding failed", e);
      throw e;
    }
  });
};

export const getExpertStrategicAdvice = async (location: string, weather: WeatherData, lang: Language = 'en'): Promise<string> => {
  const cacheKey = `advice-v3-${location}-${lang}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  return deduplicateRequest(cacheKey, async () => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Location: ${location}. Weather: ${weather.temp}C, ${weather.forecast}. Provide a short 2-sentence expert farming tip in ${lang === 'ta' ? 'Tamil' : 'English'}.`,
      config: { systemInstruction: "You are a Precision Agronomist." }
    });
    const result = response.text || "";
    setCache(cacheKey, result, ADVICE_CACHE_TTL);
    return result;
  });
};

export const predictSoilCharacteristics = async (location: string, weather: WeatherData): Promise<SoilData> => {
  const cacheKey = `soil-v3-${location}`;
  const cached = getCache<SoilData>(cacheKey);
  if (cached) return cached;
  
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Predict typical soil characteristics for ${location} in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          ph: { type: Type.NUMBER },
          nitrogen: { type: Type.NUMBER },
          phosphorus: { type: Type.NUMBER },
          potassium: { type: Type.NUMBER },
          organicMatter: { type: Type.NUMBER },
          moisture: { type: Type.NUMBER },
          soilType: { type: Type.STRING },
          moistureStatus: { type: Type.STRING }
        },
        required: ["ph", "nitrogen", "phosphorus", "potassium", "organicMatter", "moisture", "soilType", "moistureStatus"]
      }
    }
  });
  const result = extractJson(response.text || "{}") as SoilData;
  setCache(cacheKey, result, SOIL_CACHE_TTL);
  return result;
};
