
import { SoilData, WeatherData, CropRecommendation, MarketInsight, SandhaiPrice } from "../types";

export const getLocalRecommendations = (
  soil: SoilData,
  weather: WeatherData,
  location: string,
  history: string
): CropRecommendation[] => {
  const recs: CropRecommendation[] = [];
  const { soilType, moistureStatus, moisture, ph } = soil;

  // 1. Logic for Black Soil
  if (soilType === 'Black') {
    if (moistureStatus === 'Moist' || moisture > 50) {
      recs.push({
        cropName: "Cotton (Bt Variety)",
        confidence: 92,
        expectedYield: "10-14 Quintals/acre",
        estimatedProfit: "High",
        sustainabilityScore: 88,
        sustainabilityReport: "Black soil's high clay content combined with current moisture levels is ideal for cotton taproot development.",
        advice: "Monitor for bollworm during the first 60 days. Current moisture is optimal for germination.",
        plantingWindow: "July - August",
        suitabilityReasons: ["Excellent moisture retention", "Ideal Black Soil drainage", "Optimal NPK compatibility"]
      });
    } else {
      recs.push({
        cropName: "Soybean",
        confidence: 85,
        expectedYield: "8-10 Quintals/acre",
        estimatedProfit: "Moderate",
        sustainabilityScore: 92,
        sustainabilityReport: "Soybeans perform well in dry-moist Black soil as they fix nitrogen for the next cycle.",
        advice: "Seed treatment with Rhizobium is recommended to boost yields in this soil state.",
        plantingWindow: "June - July",
        suitabilityReasons: ["Drought tolerance", "Nitrogen fixation", "Fits clay soil structure"]
      });
    }
  }

  // 2. Logic for Red Soil
  if (soilType === 'Red') {
    if (moistureStatus === 'Dry' || moisture < 35) {
      recs.push({
        cropName: "Groundnut (Peanut)",
        confidence: 95,
        expectedYield: "15-20 Quintals/acre",
        estimatedProfit: "High",
        sustainabilityScore: 94,
        sustainabilityReport: "Red soil's friable nature allows pods to develop easily even in lower moisture conditions.",
        advice: "Ensure Gypsum application at 45 days for better pod filling.",
        plantingWindow: "June (Kharif)",
        suitabilityReasons: ["Easy pod penetration", "High drought resilience", "Matches low moisture profile"]
      });
    } else {
      recs.push({
        cropName: "Maize (Hybrid)",
        confidence: 88,
        expectedYield: "25-30 Quintals/acre",
        estimatedProfit: "Stable",
        sustainabilityScore: 80,
        sustainabilityReport: "Red soil with moisture supports the heavy nutrient and water demand of hybrid maize.",
        advice: "High fertilizer requirement; split Nitrogen application into 3 doses.",
        plantingWindow: "July - August",
        suitabilityReasons: ["Efficient drainage", "Supportive root anchorage", "Utilizes available moisture"]
      });
    }
  }

  // 3. Logic for Alluvial Soil
  if (soilType === 'Alluvial') {
    if (moistureStatus === 'Wet' || moisture > 70) {
      recs.push({
        cropName: "Paddy (Rice)",
        confidence: 98,
        expectedYield: "25-30 Quintals/acre",
        estimatedProfit: "Stable",
        sustainabilityScore: 75,
        sustainabilityReport: "Current 'Wet' state and Alluvial nutrients create the perfect environment for SRI paddy cultivation.",
        advice: "Focus on water management; maintain 2-5cm standing water level.",
        plantingWindow: "Samba Season",
        suitabilityReasons: ["High nutrient silt", "Flood tolerance", "Matches Alluvial profile"]
      });
    } else {
      recs.push({
        cropName: "Sugarcane",
        confidence: 82,
        expectedYield: "40-50 Tons/acre",
        estimatedProfit: "Long-term High",
        sustainabilityScore: 70,
        sustainabilityReport: "Deep Alluvial soils support the heavy biomass of sugarcane.",
        advice: "Use drip irrigation to maintain consistent moisture if 'Wet' status drops.",
        plantingWindow: "December - March",
        suitabilityReasons: ["Deep root system support", "High fertility requirement", "Perennial suitability"]
      });
    }
  }

  // 4. Logic for Laterite Soil
  if (soilType === 'Laterite') {
    recs.push({
      cropName: "Cashew Nut",
      confidence: 90,
      expectedYield: "800-1000 kg/acre",
      estimatedProfit: "High",
      sustainabilityScore: 95,
      sustainabilityReport: "Laterite soil's low nutrient status doesn't bother hardy cashew trees.",
      advice: "Training and pruning in early years is crucial for high yields.",
      plantingWindow: "June - August",
      suitabilityReasons: ["Acidic tolerance", "Hardy root system", "Low moisture requirement"]
    });
  }

  // Fallback
  if (recs.length === 0) {
    recs.push({
      cropName: "Green Gram",
      confidence: 80,
      expectedYield: "4-6 Quintals/acre",
      estimatedProfit: "Quick Return",
      sustainabilityScore: 98,
      sustainabilityReport: "A universal legume that restores soil health regardless of type.",
      advice: "Short duration crop (60-70 days) that improves nitrogen content.",
      plantingWindow: "Year-round",
      suitabilityReasons: ["Nitrogen fixing", "Short duration", "Versatile soil adaptation"]
    });
  }

  return recs.slice(0, 3);
};

const generateMockHistory = (base: number, trend: 'Up' | 'Down' | 'Stable', volatility: number = 0.05) => {
  const history = [];
  let current = base;
  for (let i = 0; i < 7; i++) {
    const changePercent = (Math.random() - 0.5) * volatility;
    const trendBias = trend === 'Up' ? 0.02 : trend === 'Down' ? -0.02 : 0;
    current = current * (1 + changePercent + trendBias);
    history.push(Math.round(current));
  }
  return history.reverse();
};

export const getSandhaiInsights = (location: string, recommendedCropNames: string[] = []): MarketInsight => {
  const city = location.split(',')[0].trim();
  
  const basePrices: Record<string, { base: number, trend: 'Up' | 'Down' | 'Stable', vol: number }> = {
    "Tomato": { base: 3200, trend: 'Up', vol: 0.15 },
    "Paddy": { base: 2300, trend: 'Stable', vol: 0.02 },
    "Cotton": { base: 7100, trend: 'Down', vol: 0.04 },
    "Onion": { base: 4500, trend: 'Up', vol: 0.12 },
    "Jasmine": { base: 850, trend: 'Up', vol: 0.20 },
    "Maize": { base: 2150, trend: 'Stable', vol: 0.03 },
    "Turmeric": { base: 14200, trend: 'Up', vol: 0.05 },
    "Black Gram": { base: 9200, trend: 'Up', vol: 0.04 },
    "Ragi": { base: 3800, trend: 'Up', vol: 0.03 },
    "Green Gram": { base: 8600, trend: 'Stable', vol: 0.04 },
    "Cardamom": { base: 1950, trend: 'Up', vol: 0.08 },
    "Sugarcane": { base: 3100, trend: 'Stable', vol: 0.01 },
    "Ginger": { base: 12000, trend: 'Up', vol: 0.07 },
    "Small Onion": { base: 5500, trend: 'Up', vol: 0.14 },
    "Banana": { base: 2800, trend: 'Stable', vol: 0.06 },
    "Coconut": { base: 1800, trend: 'Down', vol: 0.03 },
    "Groundnut": { base: 6500, trend: 'Up', vol: 0.04 },
    "Chillies (Red)": { base: 18500, trend: 'Up', vol: 0.09 }
  };

  const dynamicPrices: (SandhaiPrice & { retailPrice: string })[] = [];

  const processCrop = (crop: string, hub: string) => {
    const template = basePrices[crop] || { base: 4000, trend: 'Stable', vol: 0.05 };
    const modalPrice = Math.round(template.base);
    // Retail price is usually 35-50% higher than wholesale
    const retailPrice = Math.round(modalPrice * (1.35 + Math.random() * 0.15));
    
    return {
      commodity: crop,
      mandi: hub,
      minPrice: `₹${Math.round(modalPrice * 0.9)}`,
      maxPrice: `₹${Math.round(modalPrice * 1.1)}`,
      modalPrice: `₹${modalPrice}`,
      retailPrice: `₹${retailPrice}`,
      trend: template.trend,
      history: generateMockHistory(template.base, template.trend, template.vol)
    } as any;
  };

  recommendedCropNames.forEach(crop => {
    const cleanName = crop.split('(')[0].trim().split('/')[0].trim();
    if (!dynamicPrices.find(p => p.commodity === cleanName)) {
      dynamicPrices.push(processCrop(cleanName, `${city} APMC`));
    }
  });

  const regionalFavorites: Record<string, string[]> = {
    "Thanjavur": ["Paddy", "Coconut", "Black Gram", "Sugarcane", "Banana"],
    "Dindigul": ["Jasmine", "Maize", "Tomato", "Onion", "Small Onion"],
    "Coimbatore": ["Turmeric", "Cotton", "Coconut", "Banana", "Tomato"],
    "Madurai": ["Jasmine", "Chillies (Red)", "Groundnut", "Paddy", "Onion"]
  };

  const favorites = regionalFavorites[city] || ["Tomato", "Paddy", "Maize", "Onion", "Cotton"];
  favorites.forEach(crop => {
    if (dynamicPrices.length < 10 && !dynamicPrices.find(p => p.commodity === crop)) {
      dynamicPrices.push(processCrop(crop, `${city} Sandhai`));
    }
  });

  return {
    analysis: `Market intelligence for ${city} indicates active retail trade volumes. Retail margins currently fluctuate between 35% and 48%.`,
    prices: dynamicPrices
  };
};
