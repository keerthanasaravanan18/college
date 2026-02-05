
export interface SoilData {
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organicMatter: number;
  moisture: number;
  soilType: string;
  moistureStatus: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
}

export interface WeatherData {
  temp: number;
  humidity: number;
  rainfall: number;
  forecast: string;
  dailyForecast?: DailyForecast[];
}

export interface CropRecommendation {
  cropName: string;
  confidence: number;
  expectedYield: string;
  estimatedProfit: string;
  sustainabilityScore: number;
  sustainabilityReport: string;
  advice: string;
  plantingWindow: string;
  suitabilityReasons: string[];
}

export interface SandhaiPrice {
  commodity: string;
  mandi: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
  trend: 'Up' | 'Down' | 'Stable';
  lastUpdated?: string;
  reliability?: 'Official' | 'Verified' | 'Standard';
  sourceName?: string;
}

export interface MarketInsight {
  analysis: string;
  prices: SandhaiPrice[];
  lastUpdated?: string;
}
