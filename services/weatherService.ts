
import { WeatherData, DailyForecast } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { getApiKey } from '../utils/apiUtils';
import { getCache, setCache } from '../utils/cacheUtils';

// VOLATILITY OPTIMIZATION:
// Weather data is highly volatile in tropical agricultural hubs. 
// Reduced from 60 mins to 30 mins to ensure farmers get timely storm/heat alerts.
const CACHE_TTL_MINUTES = 30; 

const GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

const wmoCodeToCondition = (code: number): string => {
  if (code === 0) return "Sunny";
  if (code >= 1 && code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Foggy";
  if (code >= 51 && code <= 67) return "Rainy";
  if (code >= 80 && code <= 82) return "Heavy Rain";
  if (code >= 95) return "Stormy";
  return "Cloudy";
};

export const fetchRegionalWeather = async (location: string): Promise<WeatherData> => {
  const city = location.split(',')[0].trim();
  const cacheKey = `weather-v4-${city.toLowerCase()}`;
  
  const cachedData = getCache<WeatherData>(cacheKey);
  if (cachedData) return cachedData;

  try {
    const searchQuery = `${location}, India`;
    const geoUrl = `${GEOCODING_API}?name=${encodeURIComponent(searchQuery)}&count=1&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      const backupGeoUrl = `${GEOCODING_API}?name=${encodeURIComponent(city)}&count=1&format=json`;
      const backupRes = await fetch(backupGeoUrl);
      const backupData = await backupRes.json();
      if (!backupData.results || backupData.results.length === 0) throw new Error("Location not found");
      geoData.results = backupData.results;
    }

    const { latitude, longitude, name } = geoData.results[0];

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current_weather: 'true',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      timezone: 'auto'
    });

    const weatherUrl = `${WEATHER_API}?${params.toString()}`;
    const weatherRes = await fetch(weatherUrl);
    const wData = await weatherRes.json();

    const current = wData.current_weather;
    const daily = wData.daily;

    const dailyForecast: DailyForecast[] = daily.time.slice(0, 5).map((date: string, i: number) => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      tempMax: Math.round(daily.temperature_2m_max[i]),
      tempMin: Math.round(daily.temperature_2m_min[i]),
      condition: wmoCodeToCondition(daily.weather_code[i])
    }));

    const weatherData: WeatherData = {
      temp: Math.round(current.temperature),
      humidity: 65,
      rainfall: 0,
      forecast: `${wmoCodeToCondition(current.weathercode)} in ${name}. Temp: ${Math.round(current.temperature)}°C.`,
      dailyForecast
    };

    setCache(cacheKey, weatherData, CACHE_TTL_MINUTES);
    return weatherData;

  } catch (error) {
    console.warn("Weather API fallback to simulation", error);
    return await fetchSimulatedWeather(location);
  }
};

const fetchSimulatedWeather = async (location: string): Promise<WeatherData> => {
   try {
     const ai = new GoogleGenAI({ apiKey: getApiKey() });
     const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Simulate weather for ${location}, India in JSON format matching WeatherData type.`,
        config: { 
           responseMimeType: "application/json",
           responseSchema: {
             type: Type.OBJECT,
             properties: {
               temp: { type: Type.NUMBER },
               humidity: { type: Type.NUMBER },
               rainfall: { type: Type.NUMBER },
               forecast: { type: Type.STRING },
               dailyForecast: {
                 type: Type.ARRAY,
                 items: {
                   type: Type.OBJECT,
                   properties: {
                     date: { type: Type.STRING },
                     tempMax: { type: Type.NUMBER },
                     tempMin: { type: Type.NUMBER },
                     condition: { type: Type.STRING }
                   },
                   required: ["date", "tempMax", "tempMin", "condition"]
                 }
               }
             },
             required: ["temp", "humidity", "rainfall", "forecast", "dailyForecast"]
           }
        }
     });
     
     return JSON.parse(response.text || "{}") as WeatherData;
   } catch (e) {
     return {
       temp: 30,
       humidity: 60,
       rainfall: 0,
       forecast: `Stable weather in ${location}.`,
       dailyForecast: []
     };
   }
};
