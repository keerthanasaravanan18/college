
import { GoogleGenAI } from "@google/genai";
import { getCache, setCache } from "../utils/cacheUtils";
import { getApiKey } from "../utils/apiUtils";

// Cache images for 30 days (in minutes)
const IMAGE_CACHE_TTL = 30 * 24 * 60;

/**
 * Generates an AI image using Gemini-2.5-Flash-Image.
 * Caches the resulting base64 string to prevent repeated generation.
 * @param cropName Name of the crop
 * @param force If true, ignores the cache and generates a new image
 */
export const generateCropImage = async (cropName: string, force: boolean = false): Promise<string | null> => {
  const cleanName = cropName.split('(')[0].trim();
  const cacheKey = `img-v2-${cleanName.toLowerCase().replace(/\s+/g, '-')}`;
  
  // 1. Check persistent cache first if not forced
  if (!force) {
    const cachedImage = getCache<string>(cacheKey);
    if (cachedImage) {
      console.debug(`[ImageService] Cache hit for ${cleanName}. Using existing stored image.`);
      return cachedImage;
    }
  }

  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `A professional, high-quality, cinematic photography of a lush ${cleanName} crop field in an Indian agricultural setting. Vibrant colors, sunlight, 4k detail, agricultural excellence, no text, no people.`;

    console.debug(`[ImageService] ${force ? 'Force regenerating' : 'No cache found for'} ${cleanName}. Generating new image via Gemini...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        },
      },
    });

    let base64Data: string | null = null;

    // 2. Extract image from response parts
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (base64Data) {
      // 3. Store in cache for future use
      setCache(cacheKey, base64Data, IMAGE_CACHE_TTL);
      console.debug(`[ImageService] Successfully cached new image for ${cleanName}.`);
      return base64Data;
    }

    return null;
  } catch (err) {
    console.warn(`Gemini image generation failed for ${cleanName}:`, err);
    return null;
  }
};
